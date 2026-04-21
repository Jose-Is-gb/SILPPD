// registro_empresa.js — Lógica del formulario de registro de empresa

document.addEventListener('DOMContentLoaded', () => {
    showStep(1);
});

function showStep(stepNumber) {
    document.querySelectorAll('.step-container').forEach(el => {
        el.classList.remove('active');
    });
    
    document.getElementById(`step-${stepNumber}`).classList.add('active');
    
    // Actualizar barra de progreso
    document.querySelectorAll('.progress-bar-custom').forEach((el, index) => {
        if (index < stepNumber) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });

    // Scroll al tope del formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prevStep(stepNumber) {
    showStep(stepNumber);
}

function nextStep(stepNumber) {
    const currentStep = stepNumber - 1;
    
    // VALIDACIÓN PASO 1
    if (currentStep === 1) {
        const razonSocial = document.getElementById('emp-razon-social').value.trim();
        const ruc = document.getElementById('emp-ruc').value.trim();
        const sector = document.getElementById('emp-sector').value;
        const tamano = document.getElementById('emp-tamano').value;
        const web = document.getElementById('emp-web').value.trim();
        const descripcion = document.getElementById('emp-descripcion').value.trim();
        const errorBox = document.getElementById('error-step-1');

        if (!razonSocial || !ruc || !sector || !tamano || !web || !descripcion) {
            errorBox.textContent = "Por favor, completa todos los campos obligatorios (*).";
            errorBox.classList.remove('d-none');
            return;
        }

        errorBox.classList.add('d-none');
    }

    // VALIDACIÓN PASO 2
    if (currentStep === 2) {
        const direccion = document.getElementById('emp-direccion').value.trim();
        const ciudad = document.getElementById('emp-ciudad').value.trim();
        const cp = document.getElementById('emp-cp').value.trim();
        const pais = document.getElementById('emp-pais').value.trim();
        const nombre = document.getElementById('emp-contacto-nombre').value.trim();
        const cargo = document.getElementById('emp-contacto-cargo').value.trim();
        const email = document.getElementById('emp-email').value.trim();
        const telefono = document.getElementById('emp-telefono').value.trim();
        const pwd = document.getElementById('emp-password').value;
        const pwdConf = document.getElementById('emp-confirm-password').value;
        const errorBox = document.getElementById('error-step-2');

        if (!direccion || !ciudad || !cp || !pais || !nombre || !cargo || !email || !telefono || !pwd || !pwdConf) {
            errorBox.textContent = "Por favor, completa todos los campos obligatorios (*).";
            errorBox.classList.remove('d-none');
            return;
        }

        if (pwd.length < 8) {
            errorBox.textContent = "La contraseña debe tener al menos 8 caracteres.";
            errorBox.classList.remove('d-none');
            return;
        }

        // Validador Doble de contraseña
        if (pwd !== pwdConf) {
            errorBox.textContent = "Las contraseñas no coinciden. Por favor, verifícalas.";
            errorBox.classList.remove('d-none');
            return;
        }

        errorBox.classList.add('d-none');
    }

    showStep(stepNumber);
}

function togglePasswordEmp(inputId, iconSpan) {
    const input = document.getElementById(inputId);
    const icon = iconSpan.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function submitEmpresa() {
    const errorBox = document.getElementById('error-step-4');
    
    // Validar documento RUC obligatorio
    const docRuc = document.getElementById('emp-doc-ruc');
    if (!docRuc.files || docRuc.files.length === 0) {
        errorBox.textContent = "Debes subir el documento de RUC.";
        errorBox.classList.remove('d-none');
        return;
    }

    // Validar checkboxes obligatorios
    const requiredChecks = [
        'emp-chk-terminos',
        'emp-chk-rgpd',
        'emp-chk-nodiscriminacion',
        'emp-chk-accesibilidad',
        'emp-chk-seguridad',
        'emp-chk-veracidad',
        'emp-chk-verificacion'
    ];

    for (const id of requiredChecks) {
        if (!document.getElementById(id).checked) {
            errorBox.textContent = "Debes aceptar todos los consentimientos obligatorios (*) para completar el registro.";
            errorBox.classList.remove('d-none');
            return;
        }
    }

    errorBox.classList.add('d-none');

    // Guardar datos de empresa (simulado)
    const email = document.getElementById('emp-email').value.trim();
    const pwd = document.getElementById('emp-password').value;
    const razonSocial = document.getElementById('emp-razon-social').value.trim();

    let isRegistered = true;
    if (typeof Auth !== 'undefined' && Auth.registerUser) {
        isRegistered = Auth.registerUser(razonSocial, email, pwd, "", "empresa");
    }

    if (!isRegistered) {
        errorBox.textContent = "Este correo electrónico ya está registrado.";
        errorBox.classList.remove('d-none');
        return;
    }

    // Éxito
    const successBox = document.getElementById('success-reg');
    successBox.textContent = "¡Solicitud enviada con éxito! Su cuenta será revisada en 48-72 horas hábiles.";
    successBox.classList.remove('d-none');

    setTimeout(() => {
        window.location.href = 'login.html';
    }, 3000);
}
