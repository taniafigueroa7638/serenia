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

// Íconos SVG del toggle de contraseña (heredan color vía currentColor)
const ICON_EYE = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z"/><circle cx="12" cy="12" r="3.25"/></svg>`;
const ICON_EYE_OFF = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 5.2A10.6 10.6 0 0 1 12 5c7 0 10.5 7 10.5 7a13.2 13.2 0 0 1-3.15 4.05M6.6 6.6C3.4 8.6 1.5 12 1.5 12s3.5 7 10.5 7a10.2 10.2 0 0 0 4.4-.95"/><path d="M9.9 10.05A3.25 3.25 0 0 0 12 15.25a3.24 3.24 0 0 0 2.15-.8"/></svg>`;

// Auto-bind events after DOM changes. Este es el ÚNICO punto donde se registran los
// listeners de [data-navigate] y [data-toggle] en toda la app (antes había un segundo
// registro manual en auth.js que duplicaba el listener del ojo y hacía que el toggle
// se cancelara a sí mismo al hacer clic).
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
    // Estado inicial del ícono (ojo abierto = contraseña oculta)
    if (!btn.querySelector('svg')) btn.innerHTML = ICON_EYE;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const inputId = btn.dataset.toggle;
      const input = document.getElementById(inputId);
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = ICON_EYE_OFF;
        btn.setAttribute('aria-label', 'Ocultar contraseña');
        btn.title = 'Ocultar contraseña';
      } else {
        input.type = 'password';
        btn.innerHTML = ICON_EYE;
        btn.setAttribute('aria-label', 'Mostrar contraseña');
        btn.title = 'Mostrar contraseña';
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
