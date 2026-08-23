const SERENIA_SUGGESTIONS = [
  'Tómate unos minutos para respirar lentamente y relajar tu cuerpo.',
  'Haz una pausa breve y aléjate unos minutos de aquello que te genera tensión.',
  'Recuerda hidratarte y descansar cuando lo necesites.',
  'Escuchar música tranquila puede ayudarte a crear un momento de calma.',
  'Dedica unos minutos a realizar una actividad que disfrutes.',
];

let suggestionIntervalId = null;

function stopSuggestionRotation() {
  if (suggestionIntervalId) {
    clearInterval(suggestionIntervalId);
    suggestionIntervalId = null;
  }
}

function startSuggestionRotation() {
  stopSuggestionRotation();
  const suggestionElement = document.getElementById('wellnessSuggestion');
  const dots = document.querySelectorAll('.suggestion-dot');
  if (!suggestionElement) return;

  let currentIndex = 0;
  suggestionIntervalId = setInterval(() => {
    currentIndex = (currentIndex + 1) % SERENIA_SUGGESTIONS.length;
    suggestionElement.classList.add('is-changing');

    setTimeout(() => {
      if (!suggestionElement.isConnected) return;
      suggestionElement.textContent = SERENIA_SUGGESTIONS[currentIndex];
      suggestionElement.classList.remove('is-changing');
      dots.forEach((dot, index) => {
        dot.classList.toggle('is-active', index === currentIndex);
      });
    }, 180);
  }, 5000);
}

async function renderDashboard() {
  try {
    const data = await api('/user/profile');
    const { user, stats } = data;
    const weeklyStatus = state.questionnaireStatus;
    if (!['/', '/dashboard'].includes(window.location.pathname)) return;

    document.getElementById('app').innerHTML = `
      ${renderNavbar()}
      <div class="dashboard container">
        <div class="hero-section glass">
          <h1>Hola, ${user.nombre} 👋</h1>
          <p>Bienvenido de vuelta a Serenia. Tu bienestar emocional es nuestra prioridad.</p>
          <div class="hero-checkin">
            <h2>¿Cómo te sientes hoy?</h2>
            <p>Registra tu estado emocional o realiza los instrumentos de medición.</p>
            <button class="btn btn-primary" data-navigate="/questionnaire">Responder una evaluación</button>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card glass">
            <div class="icon">📋</div>
            <div class="value">${stats.total_cuestionarios}</div>
            <div class="label">Evaluaciones completadas</div>
          </div>
          <div class="stat-card glass">
            <div class="icon">😰</div>
            <div class="value">${stats.promedio_estres}</div>
            <div class="label">Promedio de estrés</div>
          </div>
          <div class="stat-card glass">
            <div class="icon">😟</div>
            <div class="value">${stats.promedio_ansiedad}</div>
            <div class="label">Promedio de ansiedad</div>
          </div>
          <div class="stat-card suggestion-card glass">
            <div class="icon">🌿</div>
            <div class="suggestion-title">Un momento para ti</div>
            <div class="suggestion-text" id="wellnessSuggestion">${SERENIA_SUGGESTIONS[0]}</div>
            <div class="suggestion-dots" aria-hidden="true">
              ${SERENIA_SUGGESTIONS.map((_, index) => `
                <span class="suggestion-dot ${index === 0 ? 'is-active' : ''}"></span>
              `).join('')}
            </div>
          </div>
        </div>

        ${weeklyStatus ? `
          <section class="weekly-dashboard glass">
            <div>
              <h2>Seguimiento semanal</h2>
              <p>${weeklyStatus.required
                ? 'Tienes una o más evaluaciones pendientes. También puedes completarlas después.'
                : 'Tus dos evaluaciones están al día.'}</p>
            </div>
            <div class="weekly-dashboard-actions">
              ${['serenia', 'instrumentos'].map((tipo) => {
                const item = weeklyStatus.questionnaires[tipo];
                const nombre = tipo === 'serenia' ? 'Cuestionario Serenia' : 'PSS-10 + GAD-7';
                return `
                  <button class="weekly-dashboard-item ${item.due ? 'is-due' : 'is-current'}" data-navigate="/questionnaire?type=${tipo}">
                    <span>${tipo === 'serenia' ? '🌿' : '🧘'} ${nombre}</span>
                    <strong>${item.due ? 'Pendiente' : 'Al día'}</strong>
                  </button>
                `;
              }).join('')}
            </div>
          </section>
        ` : ''}
      </div>
      <button class="fab" data-navigate="/questionnaire" title="Nuevo cuestionario">+</button>
    `;
    startSuggestionRotation();
  } catch (err) {
    if (!state.token) return;
    document.getElementById('app').innerHTML = `
      ${renderNavbar()}
      <div class="dashboard container" style="text-align:center;padding-top:120px;">
        <div style="font-size:48px;margin-bottom:16px;">😕</div>
        <h2>Error al cargar el dashboard</h2>
        <p style="color:var(--text-light);">${err.message}</p>
      </div>
    `;
  }
}

async function renderHistory() {
  try {
    const data = await api('/questionnaire/history');
    const cuestionarios = data.questionnaires;

    document.getElementById('app').innerHTML = `
      ${renderNavbar()}
      <div class="dashboard container">
        <div class="hero-section glass" style="padding:32px;">
          <h1>📜 Historial</h1>
          <p class="subtitle">Tus evaluaciones anteriores</p>
        </div>
        ${cuestionarios.length === 0 ? `
          <div class="glass" style="padding:48px;text-align:center;border-radius:var(--radius);">
            <div style="font-size:48px;margin-bottom:16px;">📝</div>
            <h3>Aún no tienes cuestionarios</h3>
            <p style="color:var(--text-light);margin:16px 0;">Realiza tu primer cuestionario para comenzar a hacer seguimiento.</p>
            <button class="btn btn-primary" style="max-width:250px;margin:0 auto;" data-navigate="/questionnaire">Comenzar</button>
          </div>
        ` : `
          <div class="glass" style="padding:24px;border-radius:var(--radius);overflow-x:auto;">
            <table class="history-table" id="historyTable">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Evaluación</th>
                  <th>Estrés</th>
                  <th>Ansiedad</th>
                  <th>Emoción</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                ${cuestionarios.map(q => `
                  <tr data-qid="${q.id}" style="cursor:pointer;">
                    <td>${new Date(q.created_at).toLocaleDateString('es-ES')}</td>
                    <td>${q.tipo === 'serenia' ? 'Serenia' : 'PSS-10 + GAD-7'}</td>
                    <td>${q.tipo === 'serenia' ? '—' : `${q.estres_score}/40`}</td>
                    <td>${q.tipo === 'serenia' ? '—' : `${q.ansiedad_score}/21`}</td>
                    <td>${q.emocion_principal}</td>
                    <td>
                      <span class="badge ${q.tipo === 'serenia' ? 'badge-info' : q.resultado_general === 'Nivel saludable' ? 'badge-low' : q.resultado_general.includes('moderado') ? 'badge-moderate' : 'badge-high'}">
                        ${q.resultado_general}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;

    // Bind row clicks
    document.querySelectorAll('#historyTable tbody tr').forEach(row => {
      row.addEventListener('click', () => {
        verDetalleCuestionario(parseInt(row.dataset.qid));
      });
    });
  } catch (err) {
    if (!state.token) return;
    alert('Error: ' + err.message);
  }
}

async function verDetalleCuestionario(id) {
  try {
    const data = await api(`/questionnaire/${id}`);
    const { questionnaire, answers } = data;
    const esSerenia = questionnaire.tipo === 'serenia';

    document.getElementById('app').innerHTML = `
      ${renderNavbar()}
      <div class="dashboard container">
        <div class="glass" style="padding:32px;border-radius:var(--radius);margin-bottom:24px;">
          <h2 style="margin-bottom:8px;">${esSerenia ? 'Cuestionario Serenia' : 'Instrumentos PSS-10 + GAD-7'}</h2>
          <p style="color:var(--text-light);">${new Date(questionnaire.created_at).toLocaleString('es-ES')}</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px;margin-top:24px;">
            ${esSerenia ? `
              <div style="text-align:center;padding:16px;background:rgba(126,87,194,0.05);border-radius:12px;">
                <div style="font-size:20px;font-weight:700;color:var(--primary-dark);">${questionnaire.estado_emocional}</div>
                <div style="font-size:12px;color:var(--text-light);">Estado emocional</div>
              </div>
            ` : `
              <div style="text-align:center;padding:16px;background:rgba(126,87,194,0.05);border-radius:12px;">
                <div style="font-size:24px;font-weight:700;color:var(--primary-dark);">${questionnaire.estres_score}/40</div>
                <div style="font-size:12px;color:var(--text-light);">Estrés</div>
              </div>
              <div style="text-align:center;padding:16px;background:rgba(126,87,194,0.05);border-radius:12px;">
                <div style="font-size:24px;font-weight:700;color:var(--primary-dark);">${questionnaire.ansiedad_score}/21</div>
                <div style="font-size:12px;color:var(--text-light);">Ansiedad</div>
              </div>
            `}
            <div style="text-align:center;padding:16px;background:rgba(126,87,194,0.05);border-radius:12px;">
              <div style="font-size:24px;font-weight:700;color:var(--primary-dark);">${questionnaire.emocion_principal}</div>
              <div style="font-size:12px;color:var(--text-light);">Emoción</div>
            </div>
          </div>
        </div>
        <div class="glass" style="padding:24px;border-radius:var(--radius);">
          <h3 style="margin-bottom:16px;">Respuestas</h3>
          ${answers.map(a => `
            <div style="padding:16px;border-bottom:1px solid rgba(126,87,194,0.1);">
              <div style="font-size:13px;color:var(--primary);font-weight:600;margin-bottom:4px;">Pregunta ${a.pregunta_numero} · ${a.categoria}</div>
              <div style="font-size:15px;margin-bottom:4px;">${a.pregunta_texto}</div>
              <div style="font-size:14px;color:var(--text-light);">Respuesta: <strong>${a.respuesta}</strong></div>
            </div>
          `).join('')}
          <button class="btn btn-secondary" data-navigate="/history" style="margin-top:24px;">← Volver al historial</button>
        </div>
      </div>
    `;
  } catch (err) {
    if (!state.token) return;
    alert('Error: ' + err.message);
  }
}

async function renderProfile() {
  try {
    const data = await api('/user/profile');
    const { user } = data;

    document.getElementById('app').innerHTML = `
      ${renderNavbar()}
      <div class="dashboard container">
        <div class="hero-section glass" style="padding:32px;">
          <h1>👤 Mi Perfil</h1>
        </div>
        <div class="glass" style="padding:32px;border-radius:var(--radius);max-width:600px;">
          <div style="display:grid;gap:16px;">
            <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(126,87,194,0.1);">
              <span style="color:var(--text-light);">Nombre completo</span>
              <strong>${user.nombre} ${user.apellido}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(126,87,194,0.1);">
              <span style="color:var(--text-light);">Email</span>
              <strong>${user.email}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(126,87,194,0.1);">
              <span style="color:var(--text-light);">Edad</span>
              <strong>${user.edad} años</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(126,87,194,0.1);">
              <span style="color:var(--text-light);">Fecha de nacimiento</span>
              <strong>${new Date(user.fecha_nacimiento).toLocaleDateString('es-ES')}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(126,87,194,0.1);">
              <span style="color:var(--text-light);">Teléfono</span>
              <strong>${user.telefono || 'No especificado'}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(126,87,194,0.1);">
              <span style="color:var(--text-light);">Sexo</span>
              <strong>${user.sexo ? user.sexo.charAt(0).toUpperCase() + user.sexo.slice(1).replace('_', ' ') : 'No especificado'}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:12px 0;">
              <span style="color:var(--text-light);">Miembro desde</span>
              <strong>${new Date(user.created_at).toLocaleDateString('es-ES')}</strong>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    if (!state.token) return;
    alert('Error: ' + err.message);
  }
}
