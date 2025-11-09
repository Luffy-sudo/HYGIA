/**
 * HYGIA - auth.js
 * Lógica de Autenticación simulada y gestión de roles
 */

// Datos de prueba: Usuario, Contraseña, Rol, Página de inicio
const USERS = {
    // Médico: Acceso a HCE
    '12345': { password: 'pass', role: 'medico', name: 'Dr. Pérez', startPage: 'hce.html' },
    // Recepcionista: Acceso a Admisión
    '67890': { password: 'pass', role: 'recepcionista', name: 'Sra. Gómez', startPage: 'admision.html' },
    // Farmacéutico: Acceso a Farmacia
    '11223': { password: 'pass', role: 'farmaceutico', name: 'Sr. Ruiz', startPage: 'farmacia.html' }
};

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const messageElement = document.getElementById('login-message');

    // Limpiar mensaje anterior
    messageElement.classList.remove('active', 'error', 'success');
    messageElement.innerHTML = '';

    const user = USERS[username];

    if (user && user.password === password) {
        // Autenticación exitosa
        messageElement.classList.add('active', 'success');
        messageElement.innerHTML = `¡Bienvenido/a, ${user.name}! Redirigiendo...`;

        // 1. Guardar la información del usuario en el almacenamiento de sesión
        sessionStorage.setItem('isAuthenticated', 'true');
        sessionStorage.setItem('userRole', user.role);
        sessionStorage.setItem('userName', user.name);
        sessionStorage.setItem('userAvatar', user.name.split(' ').map(n => n[0]).join('').toUpperCase()); // Iniciales

        // 2. Redirigir a la página de inicio correspondiente
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);

    } else {
        // Autenticación fallida
        messageElement.classList.add('active', 'error');
        messageElement.innerHTML = 'Error de autenticación. Usuario o contraseña incorrectos.';
    }
}

// Función global para cerrar sesión
function logout() {
    sessionStorage.clear();
    window.location.href = 'login.html';
}

// Función para verificar la autenticación en páginas protegidas
function checkAuth() {
    if (sessionStorage.getItem('isAuthenticated') !== 'true') {
        window.location.href = 'login.html';
    }
}

// Ejecutar la verificación si no estamos en login.html
if (!window.location.pathname.includes('login.html')) {
    checkAuth();
}