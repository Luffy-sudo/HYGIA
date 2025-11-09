/**
 * HYGIA - auth.js
 * Lógica de Autenticación y Control de Acceso por Roles
 */

// ==========================================================
// 1. BASE DE DATOS DE USUARIOS DE PRUEBA (SIMULADA)
// ==========================================================
const USERS_DB = [
    // Rol: MEDICO. Redirige a hce.html
    { code: '12345', password: 'pass', name: 'Dr. Pérez', role: 'medico', avatar: 'DP' },
    
    // Rol: RECEPCIONISTA. Redirige a admision.html (Módulo habilitado)
    { code: '67890', password: 'pass', name: 'Sra. García', role: 'recepcionista', avatar: 'SG' },
    
    // Rol: FARMACEUTICO. Redirige a farmacia.html
    { code: '24680', password: 'pass', name: 'Farm. López', role: 'farmaceutico', avatar: 'FL' },
];

// ==========================================================
// 2. FUNCIÓN DE INICIO DE SESIÓN
// ==========================================================
function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    const user = USERS_DB.find(u => u.code === username && u.password === password);

    if (user) {
        // Almacenar información esencial del usuario en la sesión
        sessionStorage.setItem('userRole', user.role);
        sessionStorage.setItem('userName', user.name);
        sessionStorage.setItem('userAvatar', user.avatar);
        
        // Redirección por Rol al módulo correspondiente
        if (user.role === 'recepcionista') {
            window.location.href = 'admision.html';
        } else if (user.role === 'medico') {
            window.location.href = 'hce.html';
        } else if (user.role === 'farmaceutico') {
            window.location.href = 'farmacia.html';
        } else {
            // Manejo de rol no reconocido
            alert('Rol de usuario no reconocido. Contacte a soporte.');
            window.location.href = 'index.html'; 
        }

    } else {
        alert('Credenciales incorrectas. Intente de nuevo.');
    }
}

// ==========================================================
// 3. FUNCIÓN DE CIERRE DE SESIÓN
// ==========================================================
function logout() {
    // Limpia todas las variables de sesión
    sessionStorage.clear();
    // Redirige a la página de inicio de sesión (index.html)
    window.location.href = 'index.html'; 
}

// ==========================================================
// 4. VERIFICACIÓN DE AUTENTICACIÓN (Guardia de Ruta)
// ==========================================================
function checkAuth() {
    const userRole = sessionStorage.getItem('userRole');
    
    // Obtiene la ruta actual (ej: admision.html)
    const currentPath = window.location.pathname;

    // Si NO hay rol de usuario en la sesión Y NO estamos en la página de login...
    if (!userRole && !currentPath.includes('index.html')) {
        // Redirige forzosamente al login
        alert('Sesión expirada o no autenticada. Por favor, inicie sesión.');
        window.location.href = 'index.html'; 
    }
}

// ==========================================================
// 5. EJECUCIÓN
// ==========================================================
// Esta línea asegura que la función checkAuth se ejecute al cargar cualquier página.
// Solo se excluye la página de inicio (index.html).
if (!window.location.pathname.includes('index.html')) {
    checkAuth();
}