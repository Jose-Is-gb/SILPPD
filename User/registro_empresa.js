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

async function submitEmpresa() {
    const errorBox = document.getElementById('error-step-4');
    const btnSubmit = document.querySelector('button[onclick="submitEmpresa()"]');
    
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
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Procesando solicitud...';

    // RECOLECCIÓN COMPLETA DE DATOS DE EMPRESA
    const extraData = {
        razonSocial: document.getElementById('emp-razon-social').value.trim(),
        nombreComercial: document.getElementById('emp-nombre-comercial').value.trim(),
        ruc: document.getElementById('emp-ruc').value.trim(),
        sector: document.getElementById('emp-sector').value,
        tamanio: document.getElementById('emp-tamano').value,
        fundacion: document.getElementById('emp-fundacion').value,
        sitioWeb: document.getElementById('emp-web').value.trim(),
        descripcion: document.getElementById('emp-descripcion').value.trim(),
        
        // Ubicación y Contacto
        direccion: document.getElementById('emp-direccion').value.trim(),
        ciudad: document.getElementById('emp-ciudad').value.trim(),
        provincia: document.getElementById('emp-provincia').value.trim(),
        codigoPostal: document.getElementById('emp-cp').value.trim(),
        pais: document.getElementById('emp-pais').value.trim(),
        telefono: document.getElementById('emp-telefono').value.trim(),
        
        contacto: {
            nombre: document.getElementById('emp-contacto-nombre').value.trim(),
            cargo: document.getElementById('emp-contacto-cargo').value.trim(),
            email: document.getElementById('emp-email').value.trim(),
            telefono: document.getElementById('emp-telefono').value.trim()
        },

        // Inclusión
        inclusion: {
            politica: document.getElementById('emp-politica-inclusion').value,
            empDiscapacidad: document.getElementById('emp-empleados-discapacidad').value,
            compromiso: document.getElementById('emp-compromiso').value.trim(),
            certificaciones: document.getElementById('emp-certificaciones').value.trim(),
            presupuesto: document.getElementById('emp-presupuesto').value,
            responsable: document.getElementById('emp-responsable').value,
            accFisica: document.getElementById('adapt-fisica').checked,
            accTecno: document.getElementById('adapt-tecnologia').checked,
            accLengua: document.getElementById('adapt-lengua').checked,
            accRemoto: document.getElementById('adapt-remoto').checked,
            accParking: document.getElementById('adapt-transporte').checked,
            accFormacion: document.getElementById('adapt-formacion').checked
        },
        
        validada: false, // Requiere aprobación del admin
        estado: "Pendiente"
    };

    const email = document.getElementById('emp-email').value.trim();
    const pwd = document.getElementById('emp-password').value;
    const nombre = extraData.nombreComercial || extraData.razonSocial;

    try {
        let isRegistered = false;
        if (typeof Auth !== 'undefined' && Auth.registerUser) {
            isRegistered = await Auth.registerUser(nombre, email, pwd, "", "empresa", extraData);
        }

        if (!isRegistered) {
            errorBox.textContent = "El registro de empresa falló en la nube. Revisa los datos.";
            errorBox.classList.remove('d-none');
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = 'Enviar solicitud de registro';
            return;
        }

        const successBox = document.getElementById('success-reg');
        successBox.textContent = "¡Solicitud enviada a la nube! El administrador la revisará pronto.";
        successBox.classList.remove('d-none');

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);

    } catch (e) {
        console.error("Error en registro empresa cloud:", e);
        errorBox.textContent = "Error inesperado: " + e.message;
        errorBox.classList.remove('d-none');
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = 'Enviar solicitud de registro';
    }
}
