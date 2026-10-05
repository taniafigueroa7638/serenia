// Hotfix de verificación: conserva el ID de usuario devuelto por /register y lo
// usa para verificar/re-enviar. Así la validación no depende de diferencias de
// normalización del correo entre frontend y backend.
(function () {
  const originalApi = api;

  api = async function patchedApi(endpoint, options = {}) {
    const data = await originalApi(endpoint, options);

    if (endpoint === '/auth/register' && options?.method === 'POST' && data?.userId) {
      localStorage.setItem('pending_user_id', String(data.userId));
    }

    return data;
  };

  function getPendingIdentity() {
    const rawId = localStorage.getItem('pending_user_id');
    const parsedId = Number(rawId);
    return {
      userId: Number.isInteger(parsedId) && parsedId > 0 ? parsedId : undefined,
      email: localStorage.getItem('pending_email') || undefined,
    };
  }

  function collectCode() {
    return Array.from(document.querySelectorAll('.code-digit'))
      .map(input => String(input.value || '').replace(/\D/g, '').slice(0, 1))
      .join('');
  }

  function fillCodeFrom(inputIndex, text) {
    const digits = String(text || '').replace(/\D/g, '').slice(0, 6);
    if (!digits) return;
    const inputs = Array.from(document.querySelectorAll('.code-digit'));
    for (let offset = 0; offset < digits.length && inputIndex + offset < inputs.length; offset += 1) {
      inputs[inputIndex + offset].value = digits[offset];
    }
    const nextIndex = Math.min(inputIndex + digits.length, inputs.length - 1);
    inputs[nextIndex]?.focus();
  }

  function setupCodeInputs() {
    const inputs = Array.from(document.querySelectorAll('.code-digit'));
    inputs.forEach((input, idx) => {
      input.inputMode = 'numeric';
      input.pattern = '[0-9]*';
      if (idx === 0) input.autocomplete = 'one-time-code';

      input.addEventListener('paste', (event) => {
        const pasted = event.clipboardData?.getData('text') || '';
        const onlyDigits = pasted.replace(/\D/g, '');
        if (!onlyDigits) return;
        event.preventDefault();
        fillCodeFrom(idx, onlyDigits);
      });

      input.addEventListener('input', (event) => {
        const raw = event.target.value;
        const onlyDigits = raw.replace(/\D/g, '');
        if (onlyDigits.length > 1) {
          fillCodeFrom(idx, onlyDigits);
          return;
        }
        event.target.value = onlyDigits.slice(0, 1);
        if (event.target.value && idx < inputs.length - 1) inputs[idx + 1].focus();
      });

      input.addEventListener('keydown', (event) => {
        if (event.key === 'Backspace' && !event.target.value && idx > 0) inputs[idx - 1].focus();
        if (event.key === 'Enter') submitCode();
      });
    });
  }

  function startResendCooldown(seconds) {
    const button = document.getElementById('btnResend');
    if (!button) return;
    let remaining = Math.max(0, Number(seconds) || 0);
    if (!remaining) return;

    button.disabled = true;
    const originalText = 'Reenviar';
    button.textContent = `Reenviar (${remaining}s)`;

    const timer = setInterval(() => {
      remaining -= 1;
      if (!button.isConnected || remaining <= 0) {
        clearInterval(timer);
        if (button.isConnected) {
          button.disabled = false;
          button.textContent = originalText;
        }
        return;
      }
      button.textContent = `Reenviar (${remaining}s)`;
    }, 1000);
  }

  renderVerify = function patchedRenderVerify() {
    const email = localStorage.getItem('pending_email');
    const pendingId = localStorage.getItem('pending_user_id');
    if (!email && !pendingId) { goTo('/register'); return; }

    document.getElementById('app').innerHTML = `
      <div class="auth-container">
        <div class="auth-box glass">
          <div style="text-align:center;">
            <img src="/assets/logo.jpg" alt="Serenia" class="login-logo" style="width:80px;height:80px;">
            <h1>Verifica tu email</h1>
            <p class="subtitle">Ingresa el código de 6 dígitos enviado${email ? ` a<br><strong>${escapeHtml(email)}</strong>` : ''}</p>
            <div class="code-inputs" id="codeInputs">
              ${[0,1,2,3,4,5].map(i => `<input type="text" maxlength="1" data-index="${i}" class="code-digit" aria-label="Dígito ${i + 1} del código">`).join('')}
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
    setupCodeInputs();
    document.querySelector('.code-digit')?.focus();
  };

  submitCode = async function patchedSubmitCode() {
    const code = collectCode();
    const identity = getPendingIdentity();
    const errorBox = document.getElementById('verifyError');

    if (!/^\d{6}$/.test(code)) {
      errorBox.innerHTML = '<div class="alert alert-error">❌ Ingresa los 6 dígitos del código.</div>';
      return;
    }

    try {
      const data = await api('/auth/verify-email', {
        method: 'POST',
        body: { ...identity, code }
      });
      state.token = data.token;
      state.user = data.user;
      localStorage.setItem('serenia_token', data.token);
      localStorage.setItem('serenia_user', JSON.stringify(data.user));
      localStorage.removeItem('pending_email');
      localStorage.removeItem('pending_user_id');
      goTo('/dashboard');
    } catch (err) {
      errorBox.innerHTML = `<div class="alert alert-error">❌ ${escapeHtml(err.message)}</div>`;
    }
  };

  resendCode = async function patchedResendCode() {
    const identity = getPendingIdentity();
    const errorBox = document.getElementById('verifyError');
    const button = document.getElementById('btnResend');
    if (button) button.disabled = true;

    try {
      const data = await api('/auth/resend-code', { method: 'POST', body: identity });
      errorBox.innerHTML = '<div class="alert alert-success">✅ Código reenviado. Revisa el correo más reciente.</div>';
      startResendCooldown(data.cooldownSeconds || 60);
    } catch (err) {
      errorBox.innerHTML = `<div class="alert alert-error">❌ ${escapeHtml(err.message)}</div>`;
      if (button) button.disabled = false;
    }
  };
})();
