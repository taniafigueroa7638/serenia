const PASSWORD_REQUIREMENTS = [
  { key: 'minLength', label: 'Mínimo 8 caracteres', validate: value => value.length >= 8 },
  { key: 'uppercase', label: 'Al menos una letra mayúscula', validate: value => /[A-Z]/.test(value) },
  { key: 'lowercase', label: 'Al menos una letra minúscula', validate: value => /[a-z]/.test(value) },
  { key: 'number', label: 'Al menos un número', validate: value => /[0-9]/.test(value) },
];

function evaluatePassword(password = '') {
  return PASSWORD_REQUIREMENTS.reduce((result, requirement) => {
    result[requirement.key] = requirement.validate(password);
    return result;
  }, {});
}

function passwordMeetsRequirements(password = '') {
  return Object.values(evaluatePassword(password)).every(Boolean);
}

function passwordRequirementsMarkup(id) {
  return `
    <div class="password-requirements" id="${id}" aria-live="polite">
      <p>Tu contraseña debe contener:</p>
      <ul>
        ${PASSWORD_REQUIREMENTS.map(requirement => `
          <li data-password-requirement="${requirement.key}">
            <span class="password-requirement-icon" aria-hidden="true">○</span>
            <span>${requirement.label}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

function setupPasswordRequirements(inputId, requirementsId, submitId) {
  const input = document.getElementById(inputId);
  const container = document.getElementById(requirementsId);
  const submitButton = document.getElementById(submitId);
  if (!input || !container) return;

  const refresh = () => {
    const status = evaluatePassword(input.value);
    PASSWORD_REQUIREMENTS.forEach(requirement => {
      const item = container.querySelector(`[data-password-requirement="${requirement.key}"]`);
      if (!item) return;
      const completed = status[requirement.key];
      item.classList.toggle('is-complete', completed);
      item.querySelector('.password-requirement-icon').textContent = completed ? '✓' : '○';
    });

    const valid = Object.values(status).every(Boolean);
    input.setAttribute('aria-invalid', String(input.value.length > 0 && !valid));
    if (submitButton) submitButton.disabled = !valid;
  };

  input.addEventListener('input', refresh);
  refresh();
}

function renderLogin() {
  document.getElementById('app').innerHTML = `
    <div class="auth-container">
      <div class="auth-box glass">
        <div style="text-align:center;margin-bottom:24px;">
          <img src="/assets/logo.jpg" alt="Serenia" class="login-logo">
          <h1>Bienvenido a Serenia</h1>
          <p class="subtitle">Inicia sesión para continuar tu camino al bienestar</p>
        </div>
        <form id="loginForm">
          <div class="form-group">
            <label>Correo electrónico</label>
            <input type="email" name="email" required placeholder="tu@email.com">
          </div>
          <div class="form-group">
            <label>Contraseña</label>
            <div class="password-wrapper">
              <input type="password" name="password" id="loginPassword" required placeholder="••••••••">
              <button type="button" class="toggle-password" data-toggle="loginPassword" aria-label="Mostrar contraseña" title="Mostrar contraseña"></button>
            </div>
          </div>
          <div id="loginError"></div>
          <button type="submit" class="btn btn-primary">Iniciar sesión</button>
        </form>
        <div class="auth-footer">
          <p>¿No tienes cuenta? <button class="link-btn" data-navigate="/register">Regístrate</button></p>
          <p style="margin-top:8px;"><button class="link-btn" data-navigate="/forgot">¿Olvidaste tu contraseña?</button></p>
        </div>
      </div>
    </div>
  `;

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: { email: formData.get('email'), password: formData.get('password') }
      });
      state.token = data.token;
      state.user = data.user;
      localStorage.setItem('serenia_token', data.token);
      localStorage.setItem('serenia_user', JSON.stringify(data.user));
      goTo('/dashboard');
    } catch (err) {
      document.getElementById('loginError').innerHTML = `<div class="alert alert-error">❌ ${err.message}</div>`;
    }
  });
}

function renderRegister() {
  document.getElementById('app').innerHTML = `
    <div class="auth-container">
      <div class="auth-box glass">
        <div style="text-align:center;margin-bottom:24px;">
          <img src="/assets/logo.jpg" alt="Serenia" class="login-logo">
          <h1>Crear cuenta</h1>
          <p class="subtitle">Comienza tu viaje hacia el equilibrio emocional</p>
        </div>
        <form id="registerForm">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div class="form-group">
              <label>Nombre *</label>
              <input type="text" name="nombre" required>
            </div>
            <div class="form-group">
              <label>Apellido *</label>
              <input type="text" name="apellido" required>
            </div>
          </div>
          <div class="form-group">
            <label>Correo electrónico *</label>
            <input type="email" name="email" required>
          </div>
          <div class="form-group">
            <label>Contraseña *</label>
            <div class="password-wrapper">
              <input type="password" name="password" id="regPassword" required minlength="8"
                autocomplete="new-password" aria-describedby="registerPasswordRequirements"
                placeholder="Crea una contraseña segura">
              <button type="button" class="toggle-password" data-toggle="regPassword" aria-label="Mostrar contraseña" title="Mostrar contraseña"></button>
            </div>
            ${passwordRequirementsMarkup('registerPasswordRequirements')}
          </div>
          <div class="form-group">
            <label>Fecha de nacimiento *</label>
            <input type="date" name="fechaNacimiento" required>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div class="form-group">
              <label>Teléfono</label>
              <input type="tel" name="telefono" placeholder="Opcional">
            </div>
            <div class="form-group">
              <label>Sexo</label>
              <select name="sexo">
                <option value="">Seleccionar...</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
                <option value="prefiero_no_decir">Prefiero no decir</option>
              </select>
            </div>
          </div>
          <div id="registerError"></div>
          <button type="submit" class="btn btn-primary" id="btnRegister">Crear cuenta</button>
        </form>
        <div class="auth-footer">
          <p>¿Ya tienes cuenta? <button class="link-btn" data-navigate="/login">Inicia sesión</button></p>
        </div>
      </div>
    </div>
  `;

  setupPasswordRequirements('regPassword', 'registerPasswordRequirements', 'btnRegister');

  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    if (!passwordMeetsRequirements(formData.get('password'))) {
      document.getElementById('registerError').innerHTML = '<div class="alert alert-error">❌ La contraseña todavía no cumple todos los requisitos.</div>';
      document.getElementById('regPassword').focus();
      return;
    }
    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: {
          nombre: formData.get('nombre'),
          apellido: formData.get('apellido'),
          email: formData.get('email'),
          password: formData.get('password'),
          fechaNacimiento: formData.get('fechaNacimiento'),
          telefono: formData.get('telefono') || undefined,
          sexo: formData.get('sexo') || undefined
        }
      });
      localStorage.setItem('pending_email', formData.get('email'));
      goTo('/verify');
    } catch (err) {
      document.getElementById('registerError').innerHTML = `<div class="alert alert-error">❌ ${err.message}</div>`;
    }
  });
}

function renderVerify() {
  const email = localStorage.getItem('pending_email');
  if (!email) { goTo('/register'); return; }

  document.getElementById('app').innerHTML = `
    <div class="auth-container">
      <div class="auth-box glass">
        <div style="text-align:center;">
          <img src="/assets/logo.jpg" alt="Serenia" class="login-logo" style="width:80px;height:80px;">
          <h1>Verifica tu email</h1>
          <p class="subtitle">Ingresa el código de 6 dígitos enviado a<br><strong>${email}</strong></p>
          <div class="code-inputs" id="codeInputs">
            ${[0,1,2,3,4,5].map(i => `<input type="text" maxlength="1" data-index="${i}" class="code-digit">`).join('')}
          </div>
          <div id="verifyError"></div>
          <button type="button" class="btn btn-primary" id="btnVerify">Verificar</button>
          <div class="auth-footer">
            <p>¿No recibiste el código? <button class="link-btn" id="btnResend">Reenviar</button></p>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btnVerify').addEventListener('click', submitCode);
  document.getElementById('btnResend').addEventListener('click', resendCode);

  const inputs = document.querySelectorAll('.code-digit');
  inputs.forEach((input, idx) => {
    input.addEventListener('input', (e) => {
      if (e.target.value && idx < 5) inputs[idx + 1].focus();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && idx > 0) inputs[idx - 1].focus();
    });
  });
}

async function submitCode() {
  const digits = document.querySelectorAll('.code-digit');
  const code = Array.from(digits).map(d => d.value).join('');
  const email = localStorage.getItem('pending_email');

  try {
    const data = await api('/auth/verify-email', {
      method: 'POST',
      body: { email, code }
    });
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem('serenia_token', data.token);
    localStorage.setItem('serenia_user', JSON.stringify(data.user));
    localStorage.removeItem('pending_email');
    goTo('/dashboard');
  } catch (err) {
    document.getElementById('verifyError').innerHTML = `<div class="alert alert-error">❌ ${err.message}</div>`;
  }
}

async function resendCode() {
  const email = localStorage.getItem('pending_email');
  try {
    await api('/auth/resend-code', { method: 'POST', body: { email } });
    document.getElementById('verifyError').innerHTML = `<div class="alert alert-success">✅ Código reenviado</div>`;
  } catch (err) {
    document.getElementById('verifyError').innerHTML = `<div class="alert alert-error">❌ ${err.message}</div>`;
  }
}

function renderForgot() {
  document.getElementById('app').innerHTML = `
    <div class="auth-container">
      <div class="auth-box glass">
        <div style="text-align:center;margin-bottom:24px;">
          <img src="/assets/logo.jpg" alt="Serenia" class="login-logo" style="width:80px;height:80px;">
        </div>
        <h1>Recuperar contraseña</h1>
        <p class="subtitle">Ingresa tu email y te enviaremos un enlace</p>
        <form id="forgotForm">
          <div class="form-group">
            <label>Correo electrónico</label>
            <input type="email" name="email" required>
          </div>
          <div id="forgotMessage"></div>
          <button type="submit" class="btn btn-primary">Enviar enlace</button>
        </form>
        <div class="auth-footer">
          <button class="link-btn" data-navigate="/login">← Volver al login</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('forgotForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = new FormData(e.target).get('email');
    try {
      await api('/auth/forgot-password', { method: 'POST', body: { email } });
      document.getElementById('forgotMessage').innerHTML = `<div class="alert alert-success">✅ Si el email existe, recibirás instrucciones.</div>`;
    } catch (err) {
      document.getElementById('forgotMessage').innerHTML = `<div class="alert alert-error">❌ ${err.message}</div>`;
    }
  });
}

function renderReset() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  document.getElementById('app').innerHTML = `
    <div class="auth-container">
      <div class="auth-box glass">
        <div style="text-align:center;margin-bottom:24px;">
          <img src="/assets/logo.jpg" alt="Serenia" class="login-logo" style="width:80px;height:80px;">
        </div>
        <h1>Nueva contraseña</h1>
        <form id="resetForm">
          <div class="form-group">
            <label>Nueva contraseña</label>
            <div class="password-wrapper">
              <input type="password" name="password" id="resetPassword" required minlength="8"
                autocomplete="new-password" aria-describedby="resetPasswordRequirements"
                placeholder="Crea una contraseña segura">
              <button type="button" class="toggle-password" data-toggle="resetPassword" aria-label="Mostrar contraseña" title="Mostrar contraseña"></button>
            </div>
            ${passwordRequirementsMarkup('resetPasswordRequirements')}
          </div>
          <div id="resetMessage"></div>
          <button type="submit" class="btn btn-primary" id="btnResetPassword">Actualizar contraseña</button>
        </form>
      </div>
    </div>
  `;
  setupPasswordRequirements('resetPassword', 'resetPasswordRequirements', 'btnResetPassword');

  document.getElementById('resetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = new FormData(e.target).get('password');
    if (!passwordMeetsRequirements(password)) {
      document.getElementById('resetMessage').innerHTML = '<div class="alert alert-error">❌ La contraseña todavía no cumple todos los requisitos.</div>';
      document.getElementById('resetPassword').focus();
      return;
    }
    try {
      await api('/auth/reset-password', { method: 'POST', body: { token, newPassword: password } });
      document.getElementById('resetMessage').innerHTML = `<div class="alert alert-success">✅ Contraseña actualizada. <button class="link-btn" data-navigate="/login">Iniciar sesión</button></div>`;
    } catch (err) {
      document.getElementById('resetMessage').innerHTML = `<div class="alert alert-error">❌ ${err.message}</div>`;
    }
  });
}

// Nota: la navegación [data-navigate] y el toggle de contraseña [data-toggle]
// se registran de forma global y única en app.js (bindAllEvents), evitando dobles
// bindings que antes cancelaban el efecto de mostrar/ocultar la contraseña.
