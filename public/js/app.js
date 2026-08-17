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

function goTo(path) {
  window.history.pushState({}, '', path);
  router();
}

function navigate(path) {
  goTo(path);
}

function router() {
  const path = window.location.pathname;
  const handler = routes[path] || routes['/'];
  handler();
}

window.addEventListener('popstate', router);

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
      <a href="/dashboard" class="logo" data-navigate="/dashboard">
        <span style="font-size:28px;">🧘</span>
        <span>Serenia</span>
      </a>
      <div class="nav-links">
        <a href="/dashboard" data-navigate="/dashboard">Inicio</a>
        <a href="/questionnaire" data-navigate="/questionnaire">Cuestionario</a>
        <a href="/history" data-navigate="/history">Historial</a>
        <a href="/profile" data-navigate="/profile">Perfil</a>
        <button id="navLogout">Cerrar sesión</button>
      </div>
    </nav>
  `;
}

// Auto-bind events after DOM changes
function bindAllEvents() {
  // Navigation links [data-navigate]
  document.querySelectorAll('[data-navigate]').forEach(el => {
    if (el._bound) return;
    el._bound = true;
    el.addEventListener('click', (e) => {
      e.preventDefault();
      goTo(el.dataset.navigate);
    });
  });

  // Logout button
  const logoutBtn = document.getElementById('navLogout');
  if (logoutBtn && !logoutBtn._bound) {
    logoutBtn._bound = true;
    logoutBtn.addEventListener('click', logout);
  }

  // Password toggles [data-toggle]
  document.querySelectorAll('[data-toggle]').forEach(btn => {
    if (btn._bound) return;
    btn._bound = true;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const inputId = btn.dataset.toggle;
      const input = document.getElementById(inputId);
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
        btn.title = 'Ocultar';
      } else {
        input.type = 'password';
        btn.textContent = '👁️';
        btn.title = 'Mostrar';
      }
    });
  });
}

// Watch for DOM changes and auto-bind
const observer = new MutationObserver(bindAllEvents);

// Iniciar app
document.addEventListener('DOMContentLoaded', () => {
  observer.observe(document.getElementById('app'), { childList: true, subtree: true });
  router();
});
