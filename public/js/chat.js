let chatState = {
  preferences: null,
  conversationId: null,
  ephemeralHistory: [],
  loading: false,
};

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
          <div id="chatMessages" class="chat-messages" aria-live="polite"></div>
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
    }
  });
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
        <p>Serenia IA es una herramienta de acompañamiento y orientación general. No realiza diagnósticos ni sustituye psicoterapia, atención médica o servicios de emergencia. Sus respuestas pueden contener errores.</p>
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
  bubble.textContent = content;

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  root.appendChild(wrapper);
  scrollChatToBottom();
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
  input.value = '';
  input.style.height = 'auto';
  setChatLoading(true);

  const typing = appendChatMessage('assistant', '…', 'is-typing');

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

function scrollChatToBottom() {
  const root = document.getElementById('chatMessages');
  if (root) root.scrollTop = root.scrollHeight;
}
