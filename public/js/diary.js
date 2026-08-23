const DIARY_MOODS = [
  { value: '', label: 'Sin seleccionar', emoji: '📖' },
  { value: 'tranquilo', label: 'Tranquilo/a', emoji: '😌' },
  { value: 'feliz', label: 'Feliz', emoji: '😄' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
  { value: 'preocupado', label: 'Preocupado/a', emoji: '😟' },
  { value: 'ansioso', label: 'Ansioso/a', emoji: '😰' },
  { value: 'molesto', label: 'Molesto/a', emoji: '😡' },
  { value: 'triste', label: 'Triste', emoji: '😢' },
  { value: 'cansado', label: 'Cansado/a', emoji: '😴' },
];

let diaryEntries = [];
let activeDiaryId = null;

function getLocalDateValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDiaryMood(value) {
  return DIARY_MOODS.find((mood) => mood.value === value) || DIARY_MOODS[0];
}

function formatDiaryDate(value) {
  if (!value) return '';
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

async function renderDiary() {
  document.getElementById('app').innerHTML = `
    ${renderNavbar()}
    <main class="diary-container container">
      <div class="diary-loading glass">
        <div class="loading loading-primary" aria-label="Cargando"></div>
        <p>Abriendo tu diario...</p>
      </div>
    </main>
  `;

  try {
    await loadDiaryEntries();
  } catch (err) {
    if (!state.token) return;
    document.getElementById('app').innerHTML = `
      ${renderNavbar()}
      <main class="diary-container container">
        <div class="diary-loading glass">
          <div class="diary-empty-icon">😕</div>
          <h2>No pudimos abrir tu diario</h2>
          <p>${escapeHtml(err.message)}</p>
          <button class="btn btn-secondary" data-navigate="/dashboard">Volver al inicio</button>
        </div>
      </main>
    `;
  }
}

async function loadDiaryEntries(preferredId = null) {
  const data = await api('/diary');
  diaryEntries = data.entries;

  if (preferredId && diaryEntries.some((entry) => entry.id === preferredId)) {
    activeDiaryId = preferredId;
  } else if (activeDiaryId && diaryEntries.some((entry) => entry.id === activeDiaryId)) {
    // Conserva la entrada que el usuario estaba viendo.
  } else {
    activeDiaryId = diaryEntries[0]?.id || null;
  }

  renderDiaryWorkspace();
}

function renderDiaryWorkspace() {
  const activeEntry = diaryEntries.find((entry) => entry.id === activeDiaryId) || null;
  const dateValue = activeEntry ? String(activeEntry.fecha).slice(0, 10) : getLocalDateValue();
  const moodValue = activeEntry?.emocion || '';

  document.getElementById('app').innerHTML = `
    ${renderNavbar()}
    <main class="diary-container container">
      <header class="diary-header">
        <div>
          <span class="diary-eyebrow">Un espacio solo para ti</span>
          <h1>📓 Mi diario</h1>
          <p>Escribe con libertad. Tus entradas son privadas.</p>
        </div>
        <button class="btn btn-primary diary-new-button" id="btnNewDiaryEntry">+ Nueva entrada</button>
      </header>

      <div class="diary-notebook glass">
        <div class="diary-spiral" aria-hidden="true"></div>
        <aside class="diary-index">
          <label class="diary-search">
            <span>Buscar entradas</span>
            <input type="search" id="diarySearch" placeholder="Título, texto o emoción...">
          </label>
          <div class="diary-entry-list" id="diaryEntryList">
            ${renderDiaryEntryList(diaryEntries)}
          </div>
        </aside>

        <section class="diary-page">
          <form id="diaryForm" data-entry-id="${activeEntry?.id || ''}">
            <div class="diary-page-heading">
              <input
                class="diary-title-input"
                name="titulo"
                maxlength="100"
                required
                placeholder="Título de esta página"
                value="${escapeHtml(activeEntry?.titulo || '')}"
              >
              <div class="diary-meta-fields">
                <label>
                  <span>Fecha</span>
                  <input type="date" name="fecha" required value="${dateValue}">
                </label>
                <label>
                  <span>¿Cómo te sentías?</span>
                  <select name="emocion">
                    ${DIARY_MOODS.map((mood) => `
                      <option value="${mood.value}" ${mood.value === moodValue ? 'selected' : ''}>
                        ${mood.emoji} ${mood.label}
                      </option>
                    `).join('')}
                  </select>
                </label>
              </div>
            </div>

            <label class="diary-writing-area">
              <span class="sr-only">Contenido de la entrada</span>
              <textarea
                name="contenido"
                id="diaryContent"
                maxlength="8000"
                required
                placeholder="Hoy quiero escribir sobre..."
              >${escapeHtml(activeEntry?.contenido || '')}</textarea>
            </label>
            <div class="diary-character-count"><span id="diaryCharCount">${activeEntry?.contenido?.length || 0}</span>/8000</div>

            <label class="diary-privacy-control">
              <input type="checkbox" name="permitirChatbot" ${activeEntry?.permitir_chatbot ? 'checked' : ''}>
              <span class="diary-privacy-switch" aria-hidden="true"></span>
              <span>
                <strong>Permitir acceso a “Habla con Serenia”</strong>
                <small>Cuando incorporemos el chatbot, solo podrá consultar esta entrada si activas este permiso.</small>
              </span>
            </label>

            <div id="diaryMessage" aria-live="polite"></div>
            <div class="diary-form-actions">
              ${activeEntry ? '<button type="button" class="btn diary-delete-button" id="btnDeleteDiaryEntry">Eliminar</button>' : '<span></span>'}
              <button type="submit" class="btn btn-primary" id="btnSaveDiaryEntry">
                ${activeEntry ? 'Guardar cambios' : 'Guardar entrada'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  `;

  bindDiaryEvents();
}

function renderDiaryEntryList(entries) {
  if (entries.length === 0) {
    return `
      <div class="diary-list-empty">
        <span>✍️</span>
        <strong>Aún no hay páginas</strong>
        <small>Tu primera entrada aparecerá aquí.</small>
      </div>
    `;
  }

  return entries.map((entry) => {
    const mood = getDiaryMood(entry.emocion);
    const preview = entry.contenido.replace(/\s+/g, ' ').trim().slice(0, 90);
    return `
      <button type="button" class="diary-entry-item ${entry.id === activeDiaryId ? 'is-active' : ''}" data-entry-id="${entry.id}">
        <span class="diary-entry-topline">
          <strong>${escapeHtml(entry.titulo)}</strong>
          <span title="${escapeHtml(mood.label)}">${mood.emoji}</span>
        </span>
        <span class="diary-entry-preview">${escapeHtml(preview)}${entry.contenido.length > 90 ? '…' : ''}</span>
        <span class="diary-entry-footer">
          <time>${formatDiaryDate(entry.fecha)}</time>
          <span title="${entry.permitir_chatbot ? 'Chatbot autorizado' : 'Entrada privada'}">
            ${entry.permitir_chatbot ? '🔓' : '🔒'}
          </span>
        </span>
      </button>
    `;
  }).join('');
}

function bindDiaryEntryButtons() {
  document.querySelectorAll('.diary-entry-item').forEach((button) => {
    button.addEventListener('click', () => {
      activeDiaryId = Number.parseInt(button.dataset.entryId, 10);
      renderDiaryWorkspace();
    });
  });
}

function bindDiaryEvents() {
  bindDiaryEntryButtons();

  document.getElementById('btnNewDiaryEntry').addEventListener('click', () => {
    activeDiaryId = null;
    renderDiaryWorkspace();
    document.querySelector('.diary-title-input')?.focus();
  });

  document.getElementById('diarySearch').addEventListener('input', (event) => {
    const term = event.target.value.trim().toLocaleLowerCase('es');
    const filteredEntries = diaryEntries.filter((entry) => {
      const mood = getDiaryMood(entry.emocion);
      return [entry.titulo, entry.contenido, mood.label]
        .some((value) => value.toLocaleLowerCase('es').includes(term));
    });
    document.getElementById('diaryEntryList').innerHTML = renderDiaryEntryList(filteredEntries);
    bindDiaryEntryButtons();
  });

  const content = document.getElementById('diaryContent');
  content.addEventListener('input', () => {
    document.getElementById('diaryCharCount').textContent = content.value.length;
  });

  document.getElementById('diaryForm').addEventListener('submit', saveDiaryEntry);
  document.getElementById('btnDeleteDiaryEntry')?.addEventListener('click', deleteDiaryEntry);
}

async function saveDiaryEntry(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const entryId = form.dataset.entryId;
  const payload = {
    titulo: formData.get('titulo'),
    contenido: formData.get('contenido'),
    fecha: formData.get('fecha'),
    emocion: formData.get('emocion') || null,
    permitirChatbot: formData.get('permitirChatbot') === 'on',
  };
  const saveButton = document.getElementById('btnSaveDiaryEntry');
  saveButton.disabled = true;

  try {
    const data = await api(entryId ? `/diary/${entryId}` : '/diary', {
      method: entryId ? 'PUT' : 'POST',
      body: payload,
    });
    await loadDiaryEntries(data.entry.id);
    showDiaryMessage('✓ Tu entrada está guardada.', 'success');
  } catch (err) {
    showDiaryMessage(err.message, 'error');
    saveButton.disabled = false;
  }
}

async function deleteDiaryEntry() {
  if (!activeDiaryId) return;
  const entry = diaryEntries.find((item) => item.id === activeDiaryId);
  const confirmed = window.confirm(`¿Eliminar “${entry?.titulo || 'esta entrada'}”? Esta acción no se puede deshacer.`);
  if (!confirmed) return;

  try {
    await api(`/diary/${activeDiaryId}`, { method: 'DELETE' });
    activeDiaryId = null;
    await loadDiaryEntries();
    showDiaryMessage('Entrada eliminada.', 'success');
  } catch (err) {
    showDiaryMessage(err.message, 'error');
  }
}

function showDiaryMessage(message, type) {
  const target = document.getElementById('diaryMessage');
  if (!target) return;
  target.className = `diary-message is-${type}`;
  target.textContent = message;
}
