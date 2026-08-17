function renderLogin() {
  document.getElementById('app').innerHTML = `
    <div class="auth-container">
      <div class="auth-box glass">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="font-size:48px;margin-bottom:12px;">🧘</div>
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
            <input type="password" name="password" required placeholder="••••••••">
          </div>
          <div id="loginError"></div>
          <button type="submit" class="btn btn-primary">Iniciar sesión</button>
        </form>
        <div class="auth-footer">
          <p>¿No tienes cuenta? <a href="#" onclick="navigate('/register'); return false;">Regístrate</a></p>
          <p style="margin-top:8px;"><a href="#" onclick="navigate('/forgot'); return false;">¿Olvidaste tu contraseña?</a></p>
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
      navigate('/dashboard');
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
          <div style="font-size:48px;margin-bottom:12px;">🌿</div>
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
            <input type="password" name="password" required minlength="8"
              placeholder="Mínimo 8 caracteres, mayúscula, minúscula y número">
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
          <button type="submit" class="btn btn-primary">Crear cuenta</button>
        </form>
        <div class="auth-footer">
          <p>¿Ya tienes cuenta? <a href="#" onclick="navigate('/login'); return false;">Inicia sesión</a></p>
        </div>
      </div>
    </div>
  `;

  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
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
      navigate('/verify');
    } catch (err) {
      document.getElementById('registerError').innerHTML = `<div class="alert alert-error">❌ ${err.message}</div>`;
    }
  });
}

function renderVerify() {
  const email = localStorage.getItem('pending_email');
  if (!email) { navigate('/register'); return; }

  document.getElementById('app').innerHTML = `
    <div class="auth-container">
      <div class="auth-box glass">
        <div style="text-align:center;">
          <div style="font-size:48px;margin-bottom:12px;">📧</div>
          <h1>Verifica tu email</h1>
          <p class="subtitle">Ingresa el código de 6 dígitos enviado a<br><strong>${email}</strong></p>
          <div class="code-inputs" id="codeInputs">
            ${[0,1,2,3,4,5].map(i => `<input type="text" maxlength="1" data-index="${i}" class="code-digit">`).join('')}
          </div>
          <div id="verifyError"></div>
          <button class="btn btn-primary" onclick="submitCode()">Verificar</button>
          <div class="auth-footer">
            <p>¿No recibiste el código? <a href="#" onclick="resendCode(); return false;">Reenviar</a></p>
          </div>
        </div>
      </div>
    </div>
  `;

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
    navigate('/dashboard');
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
          <a href="#" onclick="navigate('/login'); return false;">← Volver al login</a>
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
        <h1>Nueva contraseña</h1>
        <form id="resetForm">
          <div class="form-group">
            <label>Nueva contraseña</label>
            <input type="password" name="password" required minlength="8">
          </div>
          <div id="resetMessage"></div>
          <button type="submit" class="btn btn-primary">Actualizar contraseña</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('resetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = new FormData(e.target).get('password');
    try {
      await api('/auth/reset-password', { method: 'POST', body: { token, newPassword: password } });
      document.getElementById('resetMessage').innerHTML = `<div class="alert alert-success">✅ Contraseña actualizada. <a href="#" onclick="navigate('/login'); return false;">Iniciar sesión</a></div>`;
    } catch (err) {
      document.getElementById('resetMessage').innerHTML = `<div class="alert alert-error">❌ ${err.message}</div>`;
    }
  });
}
