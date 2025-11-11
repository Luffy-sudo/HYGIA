/**
 * HYGIA - script.js
 * Lógica de inicialización del dashboard, navegación dinámica por roles y funcionalidades de módulos (Admisión y HCE).
 */

// ==========================================================
// 1. DATOS DE CONFIGURACIÓN Y SIMULACIÓN
// ==========================================================

// Base de datos de pacientes simulada

/*
Los pacientes registrados (incluídos los nuevos) solo existen mientras la aplicación esté abierta en esa pestaña del navegador.
Si se recarga la página o se cierra el navegador, los pacientes que no son los iniciales (P001, P002), se perderán.



*/
let PATIENTS_DB = [
    { id: 'P001', name: 'Ana María Soto', cedula: '101567890', phone: '+57 310 123 4567', birthdate: '1990-05-15', gender: 'F' },
    { id: 'P002', name: 'Carlos Javier López', cedula: '101567891', phone: '+57 320 987 6543', birthdate: '1985-11-20', gender: 'M' },
    // Los nuevos pacientes registrados se añadirán aquí
];

// Definición de la estructura de navegación por Rol
const NAVIGATION_MAP = {
    medico: [
        { name: 'Historia Clínica', icon: 'fas fa-file-medical', url: 'hce.html' },
        { name: 'Dashboard Médico', icon: 'fas fa-chart-line', url: 'dashboard_medico.html' },
    ],
    recepcionista: [
        { name: 'Admisión y Citas', icon: 'fas fa-calendar-check', url: 'admision.html' },
        // Eliminado 'Búsqueda Pacientes' para simplificar el menú
    ],
    farmaceutico: [
        { name: 'Inventario Farmacia', icon: 'fas fa-pills', url: 'farmacia.html' },
        { name: 'Órdenes de Compra', icon: 'fas fa-truck-loading', url: 'ordenes_compra.html' },
    ]
};

// ==========================================================
// 2. INICIALIZACIÓN PRINCIPAL (DOMContentLoaded)
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
    // Obtener la información del usuario de la sesión (simulación de login)
    const userRole = 'recepcionista'; // Forzamos el rol para la demostración de Admision
    const userName = 'Juanita Pérez'; // Nombre simulado
    sessionStorage.setItem('userRole', userRole);
    sessionStorage.setItem('userName', userName);

    // Inicializar el dashboard (Sidebar y Header) si el usuario está logueado
    if (userRole && userName) {
        // En un entorno real, initializeDashboard construiría el menú lateral.
        // Aquí solo nos enfocaremos en la lógica del módulo activo.
    }

    // Inicializar la lógica específica del módulo activo
    if (window.location.pathname.includes('admision.html')) {
        initializeAdmissionModule();
    }
    
    if (window.location.pathname.includes('hce.html')) {
        initializeHCEModule();
    }
});

// ==========================================================
// 3. FUNCIONES GLOBALES DE INICIALIZACIÓN
// ==========================================================

function initializeDashboard(role, name, avatar) {
    // Construir el menú lateral basado en el rol del usuario
    buildSidebarMenu(role);

    // Personalizar el Header con el nombre y avatar
    const welcomeElement = document.getElementById('user-welcome');
    const avatarElement = document.getElementById('user-avatar');
    
    if (welcomeElement) {
        welcomeElement.textContent = `Bienvenido/a, ${name.split(' ')[0]}`; // Solo el primer nombre
    }

    if (avatarElement) {
        avatarElement.textContent = avatar;
        avatarElement.title = name;
    }
}

function buildSidebarMenu(role) {
    const menuList = document.getElementById('menu-items');
    if (!menuList) return;

    menuList.innerHTML = ''; // Limpiar el menú

    const navItems = NAVIGATION_MAP[role] || [];
    const currentPath = window.location.pathname.split('/').pop();

    navItems.forEach(item => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        
        link.href = item.url;
        link.innerHTML = `<i class="${item.icon}"></i> <span>${item.name}</span>`;

        // Marcar el enlace activo
        if (item.url === currentPath) {
            link.classList.add('active');
        }
        
        listItem.appendChild(link);
        menuList.appendChild(listItem);
    });
}

// ==========================================================
// 4. LÓGICA ESPECÍFICA DEL MÓDULO DE ADMISIÓN
// ==========================================================

function initializeAdmissionModule() {
    // 1. Obtención de elementos críticos para Admisión
    const btnShowRegister = document.getElementById('btn-show-register');
    const btnHideRegister = document.getElementById('btn-hide-register');
    // Referencia al MODAL
    const registrationModal = document.getElementById('patient-registration-modal'); 
    const newPatientForm = document.getElementById('new-patient-form');
    const tabsContainer = document.querySelector('.hce-tabs');
    const listPatientsTabBtn = document.querySelector('[data-tab="list-patients"]');
    const searchInput = document.getElementById('search-input'); 

    // Comprobación de existencia de elementos críticos
    if (!btnShowRegister || !btnHideRegister || !registrationModal || !newPatientForm || !searchInput) {
        console.error("ADMISSION MODULE ERROR: Uno o más IDs críticos no se encontraron. Verifique la coincidencia de IDs en admision.html.");
        return; 
    }

   // Funciones de control del modal
    function openModal() {
        registrationModal.style.display = 'flex'; // Usamos flex para centrar el modal
        document.body.style.overflow = 'hidden'; // Bloquea el scroll
    }

    function closeModal() {
        registrationModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restaura el scroll
        newPatientForm.reset();
        renderPatientTable(PATIENTS_DB); // Refrescar la tabla al cerrar
    }

    // 2. Manejo de Modal de Registro (Botones Mostrar/Ocultar y Submit)
    
    // Mostrar el modal
    btnShowRegister.addEventListener('click', openModal);

    // Ocultar el modal (usado por el botón 'X' o 'Cancelar')
    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }

    // Cerrar modal al hacer clic fuera de su contenido
    registrationModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });

    // Simulación de REGISTRO DE PACIENTE
    newPatientForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const name = document.getElementById('reg-name').value;
        const cedula = document.getElementById('reg-cedula').value;
        const birthdate = document.getElementById('reg-birthdate').value;
        const gender = document.getElementById('reg-gender').value;
        const phone = document.getElementById('reg-phone').value;
        
        // Generar nuevo ID (simulación)
        const newIdNum = PATIENTS_DB.length + 1;
        const newId = 'P' + String(newIdNum).padStart(3, '0');
        
        const newPatient = {
            id: newId,
            name: name,
            cedula: cedula,
            phone: phone,
            birthdate: birthdate,
            gender: gender
        };

        // Añadir a la base de datos simulada
        PATIENTS_DB.push(newPatient);
        
        // Sustitución de alert() por notificación visual
        showSuccessMessage(`Paciente ${name} (ID: ${newId}) registrado exitosamente.`);
        
        // Limpiar formulario y cerrar modal
        closeModal(); 
    });

    // 3. Manejo de Búsqueda de Pacientes (Por Cédula o Nombre)
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase().trim();
            
            // Si la búsqueda está vacía, mostrar la lista completa
            if (query === '') {
                renderPatientTable(PATIENTS_DB);
                return;
            }

            const results = PATIENTS_DB.filter(patient => 
                patient.cedula.includes(query) || patient.name.toLowerCase().includes(query)
            );

            renderPatientTable(results);
        });
    }
    
    // 4. Renderizado Inicial de la Tabla
    renderPatientTable(PATIENTS_DB);
}


// ==========================================================
// 5. LÓGICA ESPECÍFICA DEL MÓDULO HCE
// ==========================================================

function initializeHCEModule() {
    // Lectura de URL (ej: hce.html?patient=P001)
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patient');
    
    const nameElement = document.getElementById('patient-name');
    const detailsElement = document.getElementById('patient-details');
    const warningElement = document.getElementById('patient-warning');
    const patientCard = document.getElementById('active-patient-card');

    // A. BÚSQUEDA Y CARGA DE PACIENTE ACTIVO
    let patient = null;
    
    if (patientId && PATIENTS_DB) {
        patient = PATIENTS_DB.find(p => p.id === patientId);
    }
    
    if (patient) {
        const age = calculateAge(patient.birthdate);
        
        // Cargar datos en el panel superior
        nameElement.textContent = patient.name;
        detailsElement.innerHTML = `ID: ${patient.id} | Edad: ${age} años | Última Visita: Hoy (simulado)`;
        
        if (patientCard) patientCard.classList.add('patient-loaded');
        if (warningElement) warningElement.style.display = 'none';

    } else {
        // Si no hay ID o el paciente no se encuentra
        nameElement.textContent = 'No Seleccionado';
        detailsElement.innerHTML = patientId ? `ID solicitado: ${patientId}. Paciente no encontrado.` : `ID: ---- | Edad: -- | Última Visita: ----`;
        
        if (patientCard) patientCard.classList.add('patient-error');
        if (warningElement) warningElement.style.display = 'block';
    }
    
    // B. LÓGICA ESPECÍFICA: NOTAS MÉDICAS (Guardar Nota)
    const saveNoteButton = document.querySelector('#notas button.btn-primary');
    const noteTextarea = document.querySelector('#notas textarea');
    
    if (saveNoteButton && noteTextarea) {
        saveNoteButton.addEventListener('click', () => {
            if (!patient) {
                alert("Error de guardado: Primero debe seleccionar y cargar un Paciente Activo para guardar la nota.");
                return;
            }
            
            const noteContent = noteTextarea.value.trim();
            
            if (noteContent.length === 0) {
                alert("Por favor, escriba la nota de evolución antes de guardar.");
                return;
            }
            
            // Simulación de guardado

            /*
            Las notas que se "guardan" en el Módulo HCE con la función actual se almacenan únicamente de forma simulada
            en la consola del navegador, y no persisten en una base de datos real.

            El valor se pierde al cerrar la pestaña o navegar a otra página.


            */
            console.log(`Guardando nueva nota para paciente ${patient.id} (${patient.name}):\n${noteContent}`);
            alert(`Nota de ${patient.name} guardada exitosamente. (Simulación)`);
            
            noteTextarea.value = '';
        });
    }
    
    // C. INICIALIZACIÓN DE PESTAÑAS
    setupHCETabs();
}

function setupHCETabs() {
    document.querySelectorAll('.hce-tab-btn').forEach(button => {
        button.addEventListener('click', function() {
            // Desactivar todos los botones y paneles
            document.querySelectorAll('.hce-tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.hce-tab-pane').forEach(pane => pane.classList.remove('active-pane'));
            
            // Activar el botón y el panel correctos
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active-pane');
        });
    });
}

// ==========================================================
// 6. FUNCIONES DE AYUDA
// ==========================================================

function renderPatientTable(patients) {
    const tableBody = document.querySelector('.data-table tbody');
    if (!tableBody) return;

    tableBody.innerHTML = ''; // Limpiar la tabla

    if (patients.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-color-light);">No se encontraron pacientes que coincidan con la búsqueda.</td></tr>';
        return;
    }

    patients.forEach(patient => {
        const row = `
            <tr>
                <td>${patient.id}</td>
                <td>${patient.name}</td>
                <td>${patient.cedula}</td>
                <td>${patient.phone || 'N/D'}</td>
                <td><a href="hce.html?patient=${patient.id}" class="btn btn-primary" style="padding: 5px 10px; font-size: 0.8em;"><i class="fas fa-eye"></i> Ver HCE</a></td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });
}

// Función utilitaria para calcular la edad a partir de la fecha de nacimiento (YYYY-MM-DD)
function calculateAge(birthdate) {
    if (!birthdate) return '--';
    const today = new Date();
    const dob = new Date(birthdate);
    let age = today.getFullYear() - dob.getFullYear();
    const monthDifference = today.getMonth() - dob.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
}