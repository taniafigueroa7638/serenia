async function renderDashboard() {
  try {
    const data = await api('/user/profile');
    const { user, stats } = data;

    document.getElementById('app').innerHTML = `
      ${renderNavbar()}
      <div class="dashboard container">
        <div class="hero-section glass">
          <h1>Hola, ${user.nombre} 👋</h1>
          <p>Bienvenido de vuelta a Serenia. Tu bienestar emocional es nuestra prioridad.</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card glass">
            <div class="icon">📋</div>
            <div class="value">${stats.total_cuestionarios}</div>
            <div class="label">Cuestionarios completados</div>
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
        </div>

        <div class="glass" style="padding:32px;border-radius:var(--radius);text-align:center;">
          <h2 style="margin-bottom:16px;color:var(--primary-dark);">¿Cómo te sientes hoy?</h2>
          <p style="color:var(--text-light);margin-bottom:24px;">Realiza un nuevo cuestionario para evaluar tu estado emocional actual.</p>
          <button class="btn btn-primary" style="max-width:300px;margin:0 auto;" onclick="navigate('/questionnaire')">
            📝 Realizar cuestionario
          </button>
        </div>
      </div>
      <button class="fab" onclick="navigate('/questionnaire')" title="Nuevo cuestionario">+</button>
    `;
  } catch (err) {
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
            <button class="btn btn-primary" style="max-width:250px;margin:0 auto;" onclick="navigate('/questionnaire')">Comenzar</button>
          </div>
        ` : `
          <div class="glass" style="padding:24px;border-radius:var(--radius);overflow-x:auto;">
            <table class="history-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Estrés</th>
                  <th>Ansiedad</th>
                  <th>Emoción</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                ${cuestionarios.map(q => `
                  <tr style="cursor:pointer;" onclick="verDetalleCuestionario(${q.id})">
                    <td>${new Date(q.created_at).toLocaleDateString('es-ES')}</td>
                    <td>${q.estres_score}/16</td>
                    <td>${q.ansiedad_score}/16</td>
                    <td>${q.emocion_principal}</td>
                    <td>
                      <span class="badge ${q.resultado_general === 'Nivel saludable' ? 'badge-low' : q.resultado_general.includes('moderado') ? 'badge-moderate' : 'badge-high'}">
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
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

async function verDetalleCuestionario(id) {
  try {
    const data = await api(`/questionnaire/${id}`);
    const { questionnaire, answers } = data;

    document.getElementById('app').innerHTML = `
      ${renderNavbar()}
      <div class="dashboard container">
        <div class="glass" style="padding:32px;border-radius:var(--radius);margin-bottom:24px;">
          <h2 style="margin-bottom:8px;">Detalle del cuestionario</h2>
          <p style="color:var(--text-light);">${new Date(questionnaire.created_at).toLocaleString('es-ES')}</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px;margin-top:24px;">
            <div style="text-align:center;padding:16px;background:rgba(126,87,194,0.05);border-radius:12px;">
              <div style="font-size:24px;font-weight:700;color:var(--primary-dark);">${questionnaire.estres_score}</div>
              <div style="font-size:12px;color:var(--text-light);">Estrés</div>
            </div>
            <div style="text-align:center;padding:16px;background:rgba(126,87,194,0.05);border-radius:12px;">
              <div style="font-size:24px;font-weight:700;color:var(--primary-dark);">${questionnaire.ansiedad_score}</div>
              <div style="font-size:12px;color:var(--text-light);">Ansiedad</div>
            </div>
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
          <button class="btn btn-secondary" style="margin-top:24px;" onclick="navigate('/history')">← Volver al historial</button>
        </div>
      </div>
    `;
  } catch (err) {
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
    alert('Error: ' + err.message);
  }
}
