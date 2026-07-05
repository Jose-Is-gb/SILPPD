// registro_empresa.js — Lógica del formulario de registro de empresa

document.addEventListener('DOMContentLoaded', () => {
    showStep(1);

    // ─── Restricciones de entrada en tiempo real ───

    // RUC: solo dígitos, exactamente 11
    const rucInput = document.getElementById('emp-ruc');
    if (rucInput) {
        rucInput.maxLength = 11;
        rucInput.inputMode = 'numeric';
        rucInput.addEventListener('input', () => {
            rucInput.value = rucInput.value.replace(/\D/g, '');
        });
    }

    // Código postal empresa: solo dígitos, máximo 6
    const cpInput = document.getElementById('emp-cp');
    if (cpInput) {
        cpInput.maxLength = 6;
        cpInput.inputMode = 'numeric';
        cpInput.addEventListener('input', () => {
            cpInput.value = cpInput.value.replace(/\D/g, '');
        });
    }

    // Teléfono principal: solo dígitos y +
    const telInput = document.getElementById('emp-telefono');
    if (telInput) {
        telInput.maxLength = 15;
        telInput.addEventListener('input', () => {
            let val = telInput.value;
            val = val.replace(/(?!^)\+/g, '');
            val = val.replace(/[^\d+]/g, '');
            telInput.value = val;
        });
    }

    // Teléfono alternativo: solo dígitos y +
    const telAltInput = document.getElementById('emp-telefono-alt');
    if (telAltInput) {
        telAltInput.maxLength = 15;
        telAltInput.addEventListener('input', () => {
            let val = telAltInput.value;
            val = val.replace(/(?!^)\+/g, '');
            val = val.replace(/[^\d+]/g, '');
            telAltInput.value = val;
        });
    }

    // Limpiar errores al escribir en campos de paso 1
    ['emp-razon-social','emp-nombre-comercial','emp-web','emp-descripcion','emp-ruc',
     'emp-sector','emp-tamano'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', () => clearFieldErrorEmp(el));
        if (el) el.addEventListener('input', () => clearFieldErrorEmp(el));
    });

    // Limpiar errores al escribir en campos de paso 2
    ['emp-direccion','emp-ciudad','emp-pais','emp-contacto-nombre','emp-contacto-cargo',
     'emp-email','emp-password','emp-confirm-password','emp-cp','emp-telefono'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => clearFieldErrorEmp(el));
    });

    // Permitir solo letras en el campo País
    const empPaisInput = document.getElementById('emp-pais');
    if (empPaisInput) {
        empPaisInput.addEventListener('input', () => {
            empPaisInput.value = empPaisInput.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
        });
    }

    // Limpiar errores en paso 4 (documentos y checkboxes)
    const docRuc = document.getElementById('emp-doc-ruc');
    if (docRuc) docRuc.addEventListener('change', () => clearFieldErrorEmp(docRuc));

    ['emp-chk-terminos','emp-chk-rgpd','emp-chk-nodiscriminacion',
     'emp-chk-accesibilidad','emp-chk-seguridad','emp-chk-veracidad','emp-chk-verificacion'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', () => clearFieldErrorEmp(el));
    });
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
        const errorBox = document.getElementById('error-step-1');

        const campos1 = [
            { id: 'emp-razon-social', label: 'Razón social / Nombre legal' },
            { id: 'emp-ruc',          label: 'RUC' },
            { id: 'emp-sector',       label: 'Sector / Industria' },
            { id: 'emp-tamano',       label: 'Tamaño de la empresa' },
            { id: 'emp-web',          label: 'Sitio web corporativo' },
            { id: 'emp-descripcion',  label: 'Descripción de la empresa' },
        ];

        campos1.forEach(c => clearFieldErrorEmp(document.getElementById(c.id)));

        const faltantes1 = [];
        campos1.forEach(c => {
            const el = document.getElementById(c.id);
            if (!el || !el.value.trim()) {
                faltantes1.push(c.label);
                markFieldErrorEmp(el);
            }
        });

        if (faltantes1.length > 0) {
            errorBox.innerHTML = `<strong>⚠️ Faltan los siguientes campos obligatorios:</strong><ul class="mb-0 mt-1">${faltantes1.map(f => `<li>${f}</li>`).join('')}</ul>`;
            errorBox.classList.remove('d-none');
            return;
        }

        const ruc = document.getElementById('emp-ruc').value.trim();
        const web = document.getElementById('emp-web').value.trim();

        // RUC: exactamente 11 dígitos numéricos
        if (!/^\d{11}$/.test(ruc)) {
            markFieldErrorEmp(document.getElementById('emp-ruc'));
            showErrorEmp(errorBox, 'El RUC debe contener exactamente 11 dígitos numéricos.');
            return;
        }

        // URL del sitio web
        try {
            new URL(web);
        } catch (_) {
            markFieldErrorEmp(document.getElementById('emp-web'));
            showErrorEmp(errorBox, 'Ingresa una URL válida para el sitio web (Ej: https://www.empresa.com).');
            return;
        }

        errorBox.classList.add('d-none');
    }

    // VALIDACIÓN PASO 2
    if (currentStep === 2) {
        const errorBox = document.getElementById('error-step-2');

        const campos2 = [
            { id: 'emp-direccion',        label: 'Dirección de la sede' },
            { id: 'emp-ciudad',           label: 'Ciudad' },
            { id: 'emp-cp',               label: 'Código postal' },
            { id: 'emp-pais',             label: 'País' },
            { id: 'emp-contacto-nombre',  label: 'Nombre del representante' },
            { id: 'emp-contacto-cargo',   label: 'Cargo' },
            { id: 'emp-email',            label: 'Correo electrónico corporativo' },
            { id: 'emp-telefono',         label: 'Teléfono de contacto' },
            { id: 'emp-password',         label: 'Contraseña' },
            { id: 'emp-confirm-password', label: 'Confirmar Contraseña' },
        ];

        campos2.forEach(c => clearFieldErrorEmp(document.getElementById(c.id)));

        const faltantes2 = [];
        campos2.forEach(c => {
            const el = document.getElementById(c.id);
            if (!el || !el.value.trim()) {
                faltantes2.push(c.label);
                markFieldErrorEmp(el);
            }
        });

        if (faltantes2.length > 0) {
            errorBox.innerHTML = `<strong>⚠️ Faltan los siguientes campos obligatorios:</strong><ul class="mb-0 mt-1">${faltantes2.map(f => `<li>${f}</li>`).join('')}</ul>`;
            errorBox.classList.remove('d-none');
            return;
        }

        const cp       = document.getElementById('emp-cp').value.trim();
        const email    = document.getElementById('emp-email').value.trim();
        const telefono = document.getElementById('emp-telefono').value.trim();
        const pwd      = document.getElementById('emp-password').value;
        const pwdConf  = document.getElementById('emp-confirm-password').value;

        // Código postal: solo dígitos, 4-6 caracteres
        if (!/^\d{4,6}$/.test(cp)) {
            markFieldErrorEmp(document.getElementById('emp-cp'));
            showErrorEmp(errorBox, 'El código postal debe contener entre 4 y 6 dígitos numéricos.');
            return;
        }

        // Correo electrónico corporativo
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            markFieldErrorEmp(document.getElementById('emp-email'));
            showErrorEmp(errorBox, 'El correo electrónico no es válido. Ej: rrhh@empresa.com');
            return;
        }

        // Teléfono: entre 9 y 15 dígitos
        const telefonoDigits = telefono.replace(/\D/g, '');
        if (telefonoDigits.length < 9 || telefonoDigits.length > 15) {
            markFieldErrorEmp(document.getElementById('emp-telefono'));
            showErrorEmp(errorBox, 'El teléfono debe contener entre 9 y 15 dígitos (puede incluir + al inicio).');
            return;
        }

        if (pwd.length < 8) {
            markFieldErrorEmp(document.getElementById('emp-password'));
            showErrorEmp(errorBox, 'La contraseña debe tener al menos 8 caracteres.');
            return;
        }
        if (!/[A-Z]/.test(pwd)) {
            markFieldErrorEmp(document.getElementById('emp-password'));
            showErrorEmp(errorBox, 'La contraseña debe incluir al menos una letra mayúscula.');
            return;
        }
        if (/\s/.test(pwd)) {
            markFieldErrorEmp(document.getElementById('emp-password'));
            showErrorEmp(errorBox, 'La contraseña no debe contener espacios en blanco.');
            return;
        }
        if (!/[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\/]/.test(pwd)) {
            markFieldErrorEmp(document.getElementById('emp-password'));
            showErrorEmp(errorBox, 'La contraseña debe incluir al menos un carácter especial (ej: !, @, #, $, %).');
            return;
        }
        if (pwd !== pwdConf) {
            markFieldErrorEmp(document.getElementById('emp-confirm-password'));
            showErrorEmp(errorBox, 'Las contraseñas no coinciden. Por favor, verifícalas.');
            return;
        }

        errorBox.classList.add('d-none');
    }

    // VALIDACIÓN PASO 3
    if (currentStep === 3) {
        const politica   = document.getElementById('emp-politica-inclusion').value;
        const compromiso = document.getElementById('emp-compromiso').value.trim();
        const errorBox   = document.getElementById('error-step-3') || createErrorBoxEmp('step-3');

        const faltantes3 = [];
        if (!politica)   { faltantes3.push('Política formal de inclusión'); markFieldErrorEmp(document.getElementById('emp-politica-inclusion')); }
        if (!compromiso) { faltantes3.push('Descripción del compromiso con la inclusión'); markFieldErrorEmp(document.getElementById('emp-compromiso')); }

        if (faltantes3.length > 0) {
            if (errorBox) {
                errorBox.innerHTML = `<strong>⚠️ Faltan los siguientes campos obligatorios:</strong><ul class="mb-0 mt-1">${faltantes3.map(f => `<li>${f}</li>`).join('')}</ul>`;
                errorBox.classList.remove('d-none');
            }
            return;
        }
        if (errorBox) errorBox.classList.add('d-none');
    }

    showStep(stepNumber);
}

// Crea dinámicamente una caja de error para empresa
function createErrorBoxEmp(stepId) {
    const stepEl = document.getElementById(stepId);
    if (!stepEl) return null;
    let box = document.createElement('div');
    box.id = `error-${stepId}`;
    box.className = 'alert alert-danger small';
    const rowEl = stepEl.querySelector('.row, .info-box');
    stepEl.insertBefore(box, rowEl || stepEl.firstChild);
    return box;
}

// Marca un campo con borde rojo
function markFieldErrorEmp(el) {
    if (!el) return;
    el.classList.add('is-invalid');
}

// Quita el borde rojo
function clearFieldErrorEmp(el) {
    if (!el) return;
    el.classList.remove('is-invalid');
}

// Muestra mensaje de error simple
function showErrorEmp(errorBox, msg) {
    errorBox.innerHTML = `<strong>⚠️</strong> ${msg}`;
    errorBox.classList.remove('d-none');
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
    
    // Validar documento RUC y checkboxes obligatorios
    const docRuc = document.getElementById('emp-doc-ruc');
    const requiredChecks = [
        { id: 'emp-chk-terminos',         label: 'Términos y condiciones' },
        { id: 'emp-chk-rgpd',             label: 'Política de privacidad y protección de datos' },
        { id: 'emp-chk-nodiscriminacion', label: 'Política de no discriminación' },
        { id: 'emp-chk-accesibilidad',    label: 'Compromiso de accesibilidad' },
        { id: 'emp-chk-seguridad',        label: 'Seguridad y salud' },
        { id: 'emp-chk-veracidad',        label: 'Declaración de veracidad' },
        { id: 'emp-chk-verificacion',     label: 'Autorización de verificación' }
    ];

    clearFieldErrorEmp(docRuc);
    requiredChecks.forEach(c => clearFieldErrorEmp(document.getElementById(c.id)));

    const faltantes4 = [];
    if (!docRuc || !docRuc.files || docRuc.files.length === 0) {
        faltantes4.push('Documento de RUC (PDF)');
        markFieldErrorEmp(docRuc);
    }

    requiredChecks.forEach(c => {
        const el = document.getElementById(c.id);
        if (el && !el.checked) {
            faltantes4.push(c.label);
            markFieldErrorEmp(el);
        }
    });

    if (faltantes4.length > 0) {
        errorBox.innerHTML = `<strong>⚠️ Faltan los siguientes requisitos obligatorios (*):</strong><ul class="mb-0 mt-1">${faltantes4.map(f => `<li>${f}</li>`).join('')}</ul>`;
        errorBox.classList.remove('d-none');
        return;
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
