// js/auth.js

const API_URL = window.location.origin;
let usuarioActual = null;

function showAlert(mensaje, tipo = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    let icono = 'fa-circle-info';
    if (tipo === 'success') icono = 'fa-circle-check';
    if (tipo === 'error') icono = 'fa-circle-exclamation';

    const toast = document.createElement('div');
    toast.className = `custom-toast ${tipo}`;
    toast.innerHTML = `
        <i class="fa-solid ${icono}" style="font-size: 1.25rem; flex-shrink: 0;"></i>
        <div style="flex-grow: 1;">${mensaje}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        toast.addEventListener('animationend', () => toast.remove());
    }, 4000);
}

function loginExitoso(token, usuario) {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    usuarioActual = usuario;
    window.location.href = "dashboard.html";
}

function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();

        if (response.ok) {
            loginExitoso(data.token, data.usuario);
        } else {
            if (data.mensaje && (data.mensaje.toLowerCase().includes('verific') || data.mensaje.toLowerCase().includes('activ'))) {
                localStorage.setItem('email_verificar', email);
                showAlert('Tu cuenta aún no está activa. Introduce el código enviado.', 'info');
                setTimeout(() => { window.location.href = "verificar.html"; }, 1500);
            } else {
                showAlert(data.mensaje || 'Credenciales incorrectas.', 'error');
            }
        }
    } catch (err) {
        showAlert('No se pudo conectar con el servidor.', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const nombre = document.getElementById('regNombre').value;
    const apellido = document.getElementById('regApellido').value;
    const email = document.getElementById('regEmail').value;
    const fecha_nacimiento = document.getElementById('regFecha').value;
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;

    if (password !== passwordConfirm) {
        showAlert('Las contraseñas ingresadas no coinciden.', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, apellido, email, fecha_nacimiento, password })
        });
        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('email_verificar', email);
            showAlert(data.mensaje || 'Registro exitoso. Redirigiendo...', 'success');
            setTimeout(() => { window.location.href = "verificar.html"; }, 1500);
        } else {
            showAlert(data.mensaje || 'Error al crear la cuenta.', 'error');
        }
    } catch (err) {
        showAlert('Error de conexión con el servidor.', 'error');
    }
}

async function handleForgotPasswordRequest(e) {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value;
    try {
        const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (res.ok) {
            localStorage.setItem('email_verificar', email);
            document.getElementById('forgotForm').classList.add('hidden');
            document.getElementById('resetPasswordForm').classList.remove('hidden');
            showAlert('Se envió un código temporal a tu correo electrónico.', 'success');
        } else {
            const data = await res.json();
            showAlert(data.mensaje || 'No pudimos encontrar ese correo.', 'error');
        }
    } catch (err) {
        showAlert('Error en el servidor.', 'error');
    }
}

async function handleResetPasswordSubmit(e) {
    e.preventDefault();
    const email = localStorage.getItem('email_verificar');
    const codigo = document.getElementById('resetCode').value;
    const nuevaPassword = document.getElementById('resetNewPassword').value;

    try {
        const res = await fetch(`${API_URL}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, codigo, nuevaPassword })
        });
        if (res.ok) {
            showAlert('Tu contraseña fue restablecida con éxito.', 'success');
            localStorage.clear();
            setTimeout(() => { window.location.reload(); }, 2000);
        } else {
            const data = await res.json();
            showAlert(data.mensaje || 'El código introducido no coincide o caducó.', 'error');
        }
    } catch (err) {
        showAlert('Error al cambiar contraseña.', 'error');
    }
}

async function handleUpdateProfile(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const passwordActual = document.getElementById('profPasswordActual').value;
    const passwordNueva = document.getElementById('profPasswordNueva').value;
    const passwordNuevaConfirm = document.getElementById('profPasswordNuevaConfirm').value; 

    if (passwordNueva && !passwordActual) {
        showAlert('Debes ingresar tu contraseña actual para establecer una nueva.', 'error');
        return;
    }
    if (passwordActual && !passwordNueva) {
        showAlert('Por favor, ingresa la nueva contraseña que deseas usar.', 'error');
        return;
    }
    if (passwordNueva !== passwordNuevaConfirm) {
        showAlert('La nueva contraseña y su confirmación no coinciden.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('nombre', document.getElementById('profNombre').value);
    formData.append('apellido', document.getElementById('profApellido').value);
    formData.append('telefono', document.getElementById('profTelefono').value);
    formData.append('fecha_nacimiento', document.getElementById('profFechaNacimiento').value);

    if (passwordActual && passwordNueva) {
        formData.append('passwordActual', passwordActual);
        formData.append('passwordNueva', passwordNueva);
    }

    const file = document.getElementById('profFotoFile').files[0];
    if (file) {
        formData.append('foto_perfil', file);
    }

    try {
        const res = await fetch(`${API_URL}/api/usuario/perfil`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('usuario', JSON.stringify(data.usuario));
            showAlert('¡Perfil actualizado con éxito!', 'success');
            setTimeout(() => { window.location.href = "dashboard.html"; }, 1500);
        } else {
            showAlert(data.mensaje || 'Error al actualizar el perfil.', 'error');
        }
    } catch (err) {
        showAlert('Error de comunicación con el servidor.', 'error');
    }
}

// Visibilidad de contraseñas
document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', function() {
        const targetId = this.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const icon = this.querySelector('i');
        if (input && input.type === 'password') {
            input.type = 'text';
            icon.className = 'fa-solid fa-eye-slash';
        } else if (input) {
            input.type = 'password';
            icon.className = 'fa-solid fa-eye';
        }
    });
});
