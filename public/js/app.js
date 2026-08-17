const API_URL = '';

const state = {
  token: localStorage.getItem('serenia_token'),
  user: JSON.parse(localStorage.getItem('serenia_user') || 'null')
};

const routes = {
  '/': () => state.token ? renderDashboard() : renderLogin(),
  '/login': () => renderLogin(),
  '/register': () => renderRegister(),
  '/verify': () => renderVerify(),
  '/forgot': () => renderForgot(),
  '/reset': () => renderReset(),
  '/dashboard': () => requireAuth(renderDashboard),
  '/questionnaire': () => requireAuth(renderQuestionnaire),
  '/history': () => requireAuth(renderHistory),
  '/profile': () => requireAuth(renderProfile),
};

function requireAuth(fn) {
  if (!state.token) { goTo('/login'); return; }
  fn();
}

// goTo: navegación robusta que funciona con botones
function goTo(path) {
  window.history.pushState({}, '', path);
  router();
}

// navigate: alias para compatibilidad
function navigate(path) {
  goTo(path);
}

function router() {
  const path = window.location.pathname;
  const handler = routes[path] || routes['/'];
  handler();
}

window.addEventListener('popstate', router);

// API helper
async function api(endpoint, options = {}) {
  const url = `${API_URL}/api${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(state.token && { 'Authorization': `Bearer ${state.token}` }),
      ...options.headers
    },
    ...options
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      logout();
      throw new Error('Sesión expirada. Por favor inicia sesión de nuevo.');
    }
    throw new Error(data.error || 'Error en la solicitud');
  }

  return data;
}

function logout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('serenia_token');
  localStorage.removeItem('serenia_user');
  goTo('/login');
}

function renderNavbar() {
  if (!state.token) return '';
  return `
    <nav class="navbar">
      <a href="/dashboard" class="logo" onclick="goTo('/dashboard'); return false;">
        <span style="font-size:28px;">🧘</span>
        <span>Serenia</span>
      </a>
      <div class="nav-links">
        <a href="/dashboard" onclick="goTo('/dashboard'); return false;">Inicio</a>
        <a href="/questionnaire" onclick="goTo('/questionnaire'); return false;">Cuestionario</a>
        <a href="/history" onclick="goTo('/history'); return false;">Historial</a>
        <a href="/profile" onclick="goTo('/profile'); return false;">Perfil</a>
        <button onclick="logout()">Cerrar sesión</button>
      </div>
    </nav>
  `;
}

// Iniciar app
document.addEventListener('DOMContentLoaded', () => {
  router();
});
