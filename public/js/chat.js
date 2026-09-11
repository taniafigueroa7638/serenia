let chatState = {
  preferences: null,
  conversationId: null,
  ephemeralHistory: [],
  loading: false,
};

let chatKeyboardHandler = null;

function formatChatDate(value) {
  if (!value) return 'Conversación';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Conversación';
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

async function renderChat() {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderNavbar()}
    <main class="chat-page container">
      <section class="chat-shell glass">
        <aside class="chat-sidebar">
          <div class="chat-sidebar-header">
            <div>
              <span class="chat-eyebrow">Acompañamiento</span>
              <h1>Serenia IA</h1>
            </div>
            <button class="chat-icon-btn" id="newChatBtn" type="button" title="Nueva conversación" aria-label="Nueva conversación">＋</button>
          </div>

          <div id="chatPreferences" class="chat-preferences"></div>

          <div class="chat-history-title">Conversaciones guardadas</div>
          <div id="chatConversationList" class="chat-conversation-list">
            <div class="chat-muted">Cargando…</div>
          </div>
        </aside>

        <section class="chat-main">
          <div id="chatNotice"></div>
          <div id="chatMessages" class="chat-messages" role="log" tabindex="0" aria-live="polite" aria-label="Conversación con Serenia IA"></div>
          <div class="chat-scroll-controls" aria-label="Navegación de la conversación">
            <button id="chatScrollUp" class="chat-scroll-btn" type="button" title="Subir en la conversación" aria-label="Subir en la conversación">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>
            </button>
            <button id="chatScrollDown" class="chat-scroll-btn" type="button" title="Bajar en la conversación" aria-label="Bajar en la conversación">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
            </button>
          </div>
          <form id="chatForm" class="chat-composer">
            <textarea id="chatInput" maxlength="2000" rows="1" placeholder="Escribe lo que quieras conversar…" aria-label="Mensaje para Serenia IA"></textarea>
            <button id="chatSendBtn" class="chat-send-btn" type="submit">Enviar</button>
          </form>
          <div class="chat-disclaimer">Serenia IA ofrece orientación general y puede equivocarse. No sustituye atención profesional ni servicios de emergencia.</div>
        </section>
      </section>
    </main>
  `;

  chatState = {
    preferences: null,
    conversationId: null,
    ephemeralHistory: [],
    loading: false,
  };

  bindChatEvents();
  await loadChatPreferences();
  await loadChatConversations();
  renderWelcomeMessage();
}

function bindChatEvents() {
  document.getElementById('newChatBtn')?.addEventListener('click', startNewChat);
  document.getElementById('chatForm')?.addEventListener('submit', sendChatMessage);

  const input = document.getElementById('chatInput');
  input?.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 150)}px`;
  });
  input?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      document.getElementById('chatForm')?.requestSubmit();
      return;
    }

    // Cuando el cuadro está vacío, ↑ y ↓ sirven también para recorrer el chat.
    // Si hay texto escrito, conservan su comportamiento normal para mover el cursor.
    if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && !input.value && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      scrollChatBy(event.key === 'ArrowUp' ? -56 : 56);
    }
  });

  const messages = document.getElementById('chatMessages');
  messages?.addEventListener('scroll', updateChatScrollControls, { passive: true });
  messages?.addEventListener('click', () => messages.focus({ preventScroll: true }));

  document.getElementById('chatScrollUp')?.addEventListener('click', () => scrollChatPage(-1));
  document.getElementById('chatScrollDown')?.addEventListener('click', () => scrollChatPage(1));

  bindChatKeyboardNavigation();
  requestAnimationFrame(updateChatScrollControls);
}

async function loadChatPreferences() {
  try {
    const data = await api('/chat/preferences');
    chatState.preferences = data.preferences;
    renderChatPreferences();
    renderChatNotice();
    updateComposerState();
  } catch (err) {
    showChatError(err.message);
  }
}

function renderChatPreferences() {
  const root = document.getElementById('chatPreferences');
  const p = chatState.preferences;
  if (!root || !p) return;

  root.innerHTML = `
    <div class="chat-preferences-title">Privacidad y contexto</div>
    <div class="chat-toggle-row" style="cursor:default;">
      <span>
        <strong>Perfil completo</strong>
        <small>Serenia IA usa automáticamente los datos de tu perfil para personalizar las respuestas, incluido tu país para recursos locales.</small>
      </span>
      <strong style="color:var(--primary);font-size:11px;white-space:nowrap;">Activo</strong>
    </div>
    <label class="chat-toggle-row">
      <span>
        <strong>Usar evaluaciones</strong>
        <small>Permite usar resultados recientes como contexto.</small>
      </span>
      <input type="checkbox" id="chatUseEvaluations" ${p.usarEvaluaciones ? 'checked' : ''}>
    </label>
    <label class="chat-toggle-row">
      <span>
        <strong>Usar diario autorizado</strong>
        <small>Solo entradas marcadas para el chatbot.</small>
      </span>
      <input type="checkbox" id="chatUseDiary" ${p.usarDiario ? 'checked' : ''}>
    </label>
    <label class="chat-toggle-row">
      <span>
        <strong>Guardar historial</strong>
        <small>Los mensajes se almacenan cifrados.</small>
      </span>
      <input type="checkbox" id="chatSaveHistory" ${p.guardarHistorial ? 'checked' : ''}>
    </label>
  `;

  ['chatUseEvaluations', 'chatUseDiary', 'chatSaveHistory'].forEach((id) => {
    document.getElementById(id)?.addEventListener('change', saveChatPreferences);
  });
}

async function saveChatPreferences() {
  const previousSaveHistory = chatState.preferences?.guardarHistorial;
  const body = {
    usarEvaluaciones: Boolean(document.getElementById('chatUseEvaluations')?.checked),
    usarDiario: Boolean(document.getElementById('chatUseDiary')?.checked),
    guardarHistorial: Boolean(document.getElementById('chatSaveHistory')?.checked),
  };

  try {
    const data = await api('/chat/preferences', { method: 'PUT', body });
    chatState.preferences = data.preferences;
    if (previousSaveHistory !== data.preferences.guardarHistorial) {
      startNewChat();
      await loadChatConversations();
    }
  } catch (err) {
    showChatError(err.message);
    await loadChatPreferences();
  }
}

function renderChatNotice() {
  const root = document.getElementById('chatNotice');
  const accepted = chatState.preferences?.avisoAceptado;
  if (!root) return;

  if (accepted) {
    root.innerHTML = '';
    return;
  }

  root.innerHTML = `
    <div class="chat-notice-card">
      <div class="chat-notice-icon">✦</div>
      <div>
        <h2>Antes de comenzar</h2>
        <p>Serenia IA es una herramienta de acompañamiento y orientación general. Para personalizar la conversación utiliza los datos de tu perfil; el diario y las evaluaciones solo se usan si los autorizas. No realiza diagnósticos ni sustituye psicoterapia, atención médica o servicios de emergencia. Sus respuestas pueden contener errores.</p>
        <button id="acceptChatNotice" class="btn btn-primary" type="button">Entiendo y quiero continuar</button>
      </div>
    </div>
  `;
  document.getElementById('acceptChatNotice')?.addEventListener('click', acceptChatNotice);
}

async function acceptChatNotice() {
  try {
    const data = await api('/chat/preferences', {
      method: 'PUT',
      body: { acceptNotice: true },
    });
    chatState.preferences = data.preferences;
    renderChatNotice();
    renderChatPreferences();
    updateComposerState();
    document.getElementById('chatInput')?.focus();
  } catch (err) {
    showChatError(err.message);
  }
}

async function loadChatConversations() {
  const root = document.getElementById('chatConversationList');
  if (!root) return;

  try {
    const data = await api('/chat/conversations');
    const conversations = data.conversations || [];
    if (!conversations.length) {
      root.innerHTML = '<div class="chat-muted">Aún no hay conversaciones guardadas.</div>';
      return;
    }

    root.innerHTML = conversations.map((conversation) => `
      <div class="chat-conversation-row ${Number(chatState.conversationId) === Number(conversation.id) ? 'is-active' : ''}" data-chat-id="${conversation.id}">
        <button class="chat-conversation-open" type="button" data-open-chat="${conversation.id}">
          <strong>${escapeHtml(formatChatDate(conversation.updated_at))}</strong>
          <small>${conversation.message_count} mensajes</small>
        </button>
        <button class="chat-delete-btn" type="button" data-delete-chat="${conversation.id}" aria-label="Eliminar conversación" title="Eliminar">×</button>
      </div>
    `).join('');

    root.querySelectorAll('[data-open-chat]').forEach((button) => {
      button.addEventListener('click', () => openConversation(Number(button.dataset.openChat)));
    });
    root.querySelectorAll('[data-delete-chat]').forEach((button) => {
      button.addEventListener('click', () => deleteConversation(Number(button.dataset.deleteChat)));
    });
  } catch (err) {
    root.innerHTML = `<div class="chat-error-inline">${escapeHtml(err.message)}</div>`;
  }
}

function renderWelcomeMessage() {
  const root = document.getElementById('chatMessages');
  if (!root || root.children.length) return;
  appendChatMessage('assistant', 'Hola. Soy Serenia IA. Puedes contarme cómo te sientes, ordenar una idea conmigo o pedirme una estrategia sencilla para manejar lo que estás viviendo.');
}

function startNewChat() {
  chatState.conversationId = null;
  chatState.ephemeralHistory = [];
  const root = document.getElementById('chatMessages');
  if (root) root.innerHTML = '';
  renderWelcomeMessage();
  loadChatConversations();
  document.getElementById('chatInput')?.focus();
}

async function openConversation(id) {
  try {
    const data = await api(`/chat/conversations/${id}/messages`);
    chatState.conversationId = id;
    chatState.ephemeralHistory = [];
    const root = document.getElementById('chatMessages');
    if (root) root.innerHTML = '';
    (data.messages || []).forEach((message) => appendChatMessage(message.role, message.content));
    if (!(data.messages || []).length) renderWelcomeMessage();
    await loadChatConversations();
    scrollChatToBottom();
  } catch (err) {
    showChatError(err.message);
  }
}

async function deleteConversation(id) {
  if (!window.confirm('¿Eliminar esta conversación? Esta acción no se puede deshacer.')) return;
  try {
    await api(`/chat/conversations/${id}`, { method: 'DELETE' });
    if (Number(chatState.conversationId) === Number(id)) startNewChat();
    await loadChatConversations();
  } catch (err) {
    showChatError(err.message);
  }
}

function renderChatMarkdown(content) {
  // Markdown mínimo y seguro: primero escapamos HTML y después aplicamos
  // únicamente formato visual conocido. Así **texto** se ve en negrita sin
  // permitir que una respuesta de la IA inyecte HTML o scripts.
  return escapeHtml(String(content ?? ''))
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_\n]+)__/g, '<strong>$1</strong>');
}

function appendChatMessage(role, content, extraClass = '') {
  const root = document.getElementById('chatMessages');
  if (!root) return null;

  const wrapper = document.createElement('div');
  wrapper.className = `chat-message ${role === 'user' ? 'is-user' : 'is-assistant'} ${extraClass}`.trim();

  const avatar = document.createElement('div');
  avatar.className = 'chat-avatar';
  avatar.textContent = role === 'user' ? 'Tú' : 'S';

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  if (role === 'assistant' && extraClass !== 'is-typing' && extraClass !== 'is-error') {
    bubble.innerHTML = renderChatMarkdown(content);
  } else {
    bubble.textContent = content;
  }

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  const shouldFollow = isChatNearBottom(root);
  root.appendChild(wrapper);
  if (shouldFollow) scrollChatToBottom();
  requestAnimationFrame(updateChatScrollControls);
  return wrapper;
}

function showChatError(message) {
  const node = appendChatMessage('assistant', message, 'is-error');
  if (node) setTimeout(() => node.classList.add('is-visible'), 10);
}

function setChatLoading(value) {
  chatState.loading = value;
  const button = document.getElementById('chatSendBtn');
  if (button) button.textContent = value ? 'Pensando…' : 'Enviar';
  updateComposerState();
}

function updateComposerState() {
  const enabled = Boolean(chatState.preferences?.avisoAceptado) && !chatState.loading;
  const input = document.getElementById('chatInput');
  const button = document.getElementById('chatSendBtn');
  if (input) input.disabled = !enabled;
  if (button) button.disabled = !enabled;
}

async function sendChatMessage(event) {
  event.preventDefault();
  if (chatState.loading || !chatState.preferences?.avisoAceptado) return;

  const input = document.getElementById('chatInput');
  const message = input?.value.trim() || '';
  if (!message) return;

  const previousHistory = [...chatState.ephemeralHistory];
  appendChatMessage('user', message);
  scrollChatToBottom();
  input.value = '';
  input.style.height = 'auto';
  setChatLoading(true);

  const typing = appendChatMessage('assistant', '…', 'is-typing');
  scrollChatToBottom();

  try {
    const body = { message };
    if (chatState.preferences.guardarHistorial) {
      if (chatState.conversationId) body.conversationId = chatState.conversationId;
    } else {
      body.history = previousHistory.slice(-12);
    }

    const data = await api('/chat/message', { method: 'POST', body });
    typing?.remove();
    appendChatMessage('assistant', data.reply);

    if (chatState.preferences.guardarHistorial) {
      chatState.conversationId = data.conversationId || chatState.conversationId;
      await loadChatConversations();
    } else if (data.source !== 'local_safety') {
      // Las conversaciones que activan la respuesta local de seguridad no se
      // reenvían al proveedor de IA en el siguiente turno.
      chatState.ephemeralHistory.push(
        { role: 'user', content: message },
        { role: 'assistant', content: data.reply }
      );
      chatState.ephemeralHistory = chatState.ephemeralHistory.slice(-12);
    }
  } catch (err) {
    typing?.remove();
    showChatError(err.message);
  } finally {
    setChatLoading(false);
    input?.focus();
  }
}

function isChatNearBottom(root = document.getElementById('chatMessages')) {
  if (!root) return true;
  return root.scrollHeight - root.scrollTop - root.clientHeight < 96;
}

function scrollChatToBottom(options = {}) {
  const root = document.getElementById('chatMessages');
  if (!root) return;
  root.scrollTo({
    top: root.scrollHeight,
    behavior: options.smooth ? 'smooth' : 'auto',
  });
  requestAnimationFrame(updateChatScrollControls);
}

function scrollChatBy(amount) {
  const root = document.getElementById('chatMessages');
  if (!root) return;
  root.scrollBy({ top: amount, behavior: 'smooth' });
}

function scrollChatPage(direction) {
  const root = document.getElementById('chatMessages');
  if (!root) return;
  const distance = Math.max(220, Math.round(root.clientHeight * 0.78));
  root.scrollBy({ top: distance * direction, behavior: 'smooth' });
}

function updateChatScrollControls() {
  const root = document.getElementById('chatMessages');
  const up = document.getElementById('chatScrollUp');
  const down = document.getElementById('chatScrollDown');
  if (!root || !up || !down) return;

  const maxScroll = Math.max(0, root.scrollHeight - root.clientHeight);
  const scrollable = maxScroll > 4;
  up.disabled = !scrollable || root.scrollTop <= 2;
  down.disabled = !scrollable || root.scrollTop >= maxScroll - 2;
}

function bindChatKeyboardNavigation() {
  if (chatKeyboardHandler) {
    document.removeEventListener('keydown', chatKeyboardHandler);
  }

  chatKeyboardHandler = (event) => {
    const root = document.getElementById('chatMessages');
    if (!root) return;

    const target = event.target;
    const isChatInput = target?.id === 'chatInput';
    const isEditable = target && (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    );

    // El textarea maneja ↑/↓ cuando está vacío en su propio listener.
    if (isChatInput) return;
    if (isEditable) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    let handled = true;
    switch (event.key) {
      case 'ArrowUp':
        scrollChatBy(-56);
        break;
      case 'ArrowDown':
        scrollChatBy(56);
        break;
      case 'PageUp':
        scrollChatPage(-1);
        break;
      case 'PageDown':
        scrollChatPage(1);
        break;
      case 'Home':
        root.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'End':
        scrollChatToBottom({ smooth: true });
        break;
      default:
        handled = false;
    }

    if (handled) event.preventDefault();
  };

  document.addEventListener('keydown', chatKeyboardHandler);
}
