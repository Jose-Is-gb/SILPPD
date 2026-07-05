// registro.js - Lógica para el formulario de registro multi-paso

// Reglas de validación por tipo de documento
const DOC_RULES = {
    'DNI': {
        regex: /^\d{8}$/,
        msg: 'El DNI debe contener exactamente 8 dígitos numéricos.',
        onlyDigits: true,
        maxlength: 8
    },
    'Carnet de Extranjería': {
        regex: /^[A-Za-z0-9]{9}$/,
        msg: 'El Carnet de Extranjería debe contener exactamente 9 caracteres alfanuméricos.',
        onlyDigits: false,
        maxlength: 9
    },
    'Pasaporte': {
        regex: /^[A-Za-z0-9]{6,12}$/,
        msg: 'El Pasaporte debe contener entre 6 y 12 caracteres alfanuméricos.',
        onlyDigits: false,
        maxlength: 12
    }
};

document.addEventListener('DOMContentLoaded', () => {
    showStep(1);

    // Restricción dinámica del campo número de documento según tipo seleccionado
    const tipoDocSelect = document.getElementById('reg-tipo-doc');
    const numDocInput   = document.getElementById('reg-num-doc');
    const cpInput       = document.getElementById('reg-cp');
    const telefonoInput = document.getElementById('reg-telefono');

    // Actualizar restricciones del campo número de documento al cambiar tipo
    tipoDocSelect.addEventListener('change', () => {
        const rule = DOC_RULES[tipoDocSelect.value];
        clearFieldError(numDocInput);
        if (rule) {
            numDocInput.maxLength = rule.maxlength;
            numDocInput.placeholder = rule.onlyDigits
                ? `Ej: ${'0'.repeat(rule.maxlength)}`
                : `Ej: ${'A1'.repeat(Math.ceil(rule.maxlength / 2)).slice(0, rule.maxlength)}`;
        } else {
            numDocInput.maxLength = 20;
            numDocInput.placeholder = 'Número de documento';
        }
    });

    // Permitir solo dígitos en campo número de documento cuando el tipo lo requiere
    numDocInput.addEventListener('input', () => {
        const rule = DOC_RULES[tipoDocSelect.value];
        if (rule && rule.onlyDigits) {
            numDocInput.value = numDocInput.value.replace(/\D/g, '');
        }
        clearFieldError(numDocInput);
    });

    // Código postal: solo dígitos, máximo 6
    if (cpInput) {
        cpInput.maxLength = 6;
        cpInput.addEventListener('input', () => {
            cpInput.value = cpInput.value.replace(/\D/g, '');
            clearFieldError(cpInput);
        });
    }

    // Teléfono: solo dígitos y +, máximo 15 caracteres
    if (telefonoInput) {
        telefonoInput.maxLength = 15;
        telefonoInput.addEventListener('input', () => {
            let val = telefonoInput.value;
            val = val.replace(/(?!^)\+/g, '');
            val = val.replace(/[^\d+]/g, '');
            telefonoInput.value = val;
            clearFieldError(telefonoInput);
        });
    }

    // Limpiar error al escribir en cualquier campo del paso 1
    ['reg-nombre','reg-apellidos','reg-email','reg-fecha-nac',
     'reg-ciudad','reg-pais','reg-password','reg-confirm-password'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => clearFieldError(el));
    });

    // Permitir solo letras en el campo País
    const paisInput = document.getElementById('reg-pais');
    if (paisInput) {
        paisInput.addEventListener('input', () => {
            paisInput.value = paisInput.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
        });
    }

    // Limpiar error en checkboxes (Paso 4)
    ['chk-terminos', 'chk-sensibles', 'chk-compartir', 'chk-conservacion'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', () => clearFieldError(el));
    });
});

function showStep(stepNumber) {
    // Ocultar todos los pasos
    document.querySelectorAll('.step-container').forEach(el => {
        el.classList.remove('active');
    });
    
    // Mostrar el paso actual
    document.getElementById(`step-${stepNumber}`).classList.add('active');
    
    // Actualizar barra de progreso
    document.querySelectorAll('.progress-bar-custom').forEach((el, index) => {
        if (index < stepNumber) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });

    // Resetear errores visibles
    const errorBox = document.getElementById(`error-step-${stepNumber}`);
    if(errorBox) errorBox.classList.add('d-none');
}

function prevStep(stepNumber) {
    showStep(stepNumber);
}

function nextStep(stepNumber) {
    const currentStep = stepNumber - 1;
    
    // VALIDACIÓN PASO 1
    if (currentStep === 1) {
        const errorBox = document.getElementById('error-step-1');

        // Mapa: id del campo -> etiqueta legible
        const camposObligatorios = [
            { id: 'reg-nombre',           label: 'Nombre(s)' },
            { id: 'reg-apellidos',        label: 'Apellido(s)' },
            { id: 'reg-tipo-doc',         label: 'Tipo de documento' },
            { id: 'reg-num-doc',          label: 'Número de documento' },
            { id: 'reg-fecha-nac',        label: 'Fecha de nacimiento' },
            { id: 'reg-email',            label: 'Correo electrónico' },
            { id: 'reg-telefono',         label: 'Teléfono' },
            { id: 'reg-ciudad',           label: 'Ciudad' },
            { id: 'reg-pais',             label: 'País' },
            { id: 'reg-password',         label: 'Contraseña' },
            { id: 'reg-confirm-password', label: 'Confirmar Contraseña' },
        ];

        // Limpiar errores anteriores
        camposObligatorios.forEach(c => clearFieldError(document.getElementById(c.id)));

        // Detectar campos vacíos
        const faltantes = [];
        camposObligatorios.forEach(c => {
            const el = document.getElementById(c.id);
            if (!el || !el.value.trim()) {
                faltantes.push(c.label);
                markFieldError(el);
            }
        });

        if (faltantes.length > 0) {
            errorBox.innerHTML = `
                <strong>⚠️ Faltan los siguientes campos obligatorios:</strong>
                <ul class="mb-0 mt-1">${faltantes.map(f => `<li>${f}</li>`).join('')}</ul>`;
            errorBox.classList.remove('d-none');
            document.getElementById('step-1').scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        // Leer valores ya validados como no vacíos
        const tipoDoc  = document.getElementById('reg-tipo-doc').value;
        const numDoc   = document.getElementById('reg-num-doc').value.trim();
        const email    = document.getElementById('reg-email').value.trim();
        const telefono = document.getElementById('reg-telefono').value.trim();
        const cp       = document.getElementById('reg-cp').value.trim();
        const pwd      = document.getElementById('reg-password').value;
        const pwdConf  = document.getElementById('reg-confirm-password').value;

        // Validación número de documento según tipo
        const rule = DOC_RULES[tipoDoc];
        if (rule && !rule.regex.test(numDoc)) {
            markFieldError(document.getElementById('reg-num-doc'));
            showError(errorBox, rule.msg);
            return;
        }

        // Validación correo electrónico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            markFieldError(document.getElementById('reg-email'));
            showError(errorBox, 'El correo electrónico no es válido. Ej: usuario@dominio.com');
            return;
        }

        // Validación teléfono: entre 9 y 15 dígitos
        const telefonoDigits = telefono.replace(/\D/g, '');
        if (telefonoDigits.length < 9 || telefonoDigits.length > 15) {
            markFieldError(document.getElementById('reg-telefono'));
            showError(errorBox, 'El teléfono debe contener entre 9 y 15 dígitos (puede incluir + al inicio).');
            return;
        }

        // Validación código postal (si se ingresó): solo dígitos, 4-6 caracteres
        if (cp && !/^\d{4,6}$/.test(cp)) {
            markFieldError(document.getElementById('reg-cp'));
            showError(errorBox, 'El código postal debe contener entre 4 y 6 dígitos numéricos.');
            return;
        }

        // Validación contraseña
        if (pwd.length < 8) {
            markFieldError(document.getElementById('reg-password'));
            showError(errorBox, 'La contraseña debe tener al menos 8 caracteres.');
            return;
        }
        if (!/[A-Z]/.test(pwd)) {
            markFieldError(document.getElementById('reg-password'));
            showError(errorBox, 'La contraseña debe incluir al menos una letra mayúscula.');
            return;
        }
        if (/\s/.test(pwd)) {
            markFieldError(document.getElementById('reg-password'));
            showError(errorBox, 'La contraseña no debe contener espacios en blanco.');
            return;
        }
        if (!/[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\/]/.test(pwd)) {
            markFieldError(document.getElementById('reg-password'));
            showError(errorBox, 'La contraseña debe incluir al menos un carácter especial (ej: !, @, #, $, %).');
            return;
        }
        if (pwd !== pwdConf) {
            markFieldError(document.getElementById('reg-confirm-password'));
            showError(errorBox, 'Las contraseñas no coinciden. Por favor, verifícalas.');
            return;
        }

        // Todo OK
        errorBox.classList.add('d-none');
    }

    // VALIDACIÓN PASO 2
    if (currentStep === 2) {
        const tipoDisc  = document.getElementById('reg-tipo-discapacidad').value;
        const gradoDisc = document.getElementById('reg-grado-discapacidad').value;
        const errorBox  = document.getElementById('error-step-2') || createErrorBox('step-2');

        const faltantes2 = [];
        if (!tipoDisc)  { faltantes2.push('Tipo de discapacidad');  markFieldError(document.getElementById('reg-tipo-discapacidad')); }
        if (!gradoDisc) { faltantes2.push('Grado de discapacidad'); markFieldError(document.getElementById('reg-grado-discapacidad')); }

        if (faltantes2.length > 0) {
            if (errorBox) {
                errorBox.innerHTML = `<strong>⚠️ Faltan los siguientes campos obligatorios:</strong><ul class="mb-0 mt-1">${faltantes2.map(f => `<li>${f}</li>`).join('')}</ul>`;
                errorBox.classList.remove('d-none');
            }
            return;
        }
        if (errorBox) errorBox.classList.add('d-none');
    }

    // VALIDACIÓN PASO 3
    if (currentStep === 3) {
        const educacion      = document.getElementById('reg-educacion').value;
        const experiencia    = document.getElementById('reg-experiencia').value;
        const habilidades    = document.getElementById('reg-habilidades').value.trim();
        const modalidad      = document.getElementById('reg-modalidad').value;
        const disponibilidad = document.getElementById('reg-disponibilidad').value;
        const cv             = document.getElementById('reg-cv');
        const errorBox       = document.getElementById('error-step-3') || createErrorBox('step-3');

        const faltantes3 = [];
        if (!educacion)      { faltantes3.push('Nivel educativo');             markFieldError(document.getElementById('reg-educacion')); }
        if (!experiencia)    { faltantes3.push('Años de experiencia laboral'); markFieldError(document.getElementById('reg-experiencia')); }
        if (!habilidades)    { faltantes3.push('Habilidades y competencias');  markFieldError(document.getElementById('reg-habilidades')); }
        if (!modalidad)      { faltantes3.push('Modalidad laboral');            markFieldError(document.getElementById('reg-modalidad')); }
        if (!disponibilidad) { faltantes3.push('Disponibilidad');               markFieldError(document.getElementById('reg-disponibilidad')); }

        if (faltantes3.length > 0) {
            if (errorBox) {
                errorBox.innerHTML = `<strong>⚠️ Faltan los siguientes campos obligatorios:</strong><ul class="mb-0 mt-1">${faltantes3.map(f => `<li>${f}</li>`).join('')}</ul>`;
                errorBox.classList.remove('d-none');
            }
            return;
        }
        if (!cv || !cv.files || cv.files.length === 0) {
            if (errorBox) {
                showError(errorBox, 'Debes adjuntar tu Currículum Vitae en formato PDF.');
            }
            return;
        }
        if (errorBox) errorBox.classList.add('d-none');
    }

    showStep(stepNumber);
}

// Crea dinámicamente una caja de error si no existe en el HTML
function createErrorBox(stepId) {
    const stepEl = document.getElementById(stepId);
    if (!stepEl) return null;
    let box = document.createElement('div');
    box.id = `error-${stepId}`;
    box.className = 'alert alert-danger small';
    stepEl.insertBefore(box, stepEl.querySelector('.row'));
    return box;
}

// Marca un campo con borde rojo (Bootstrap is-invalid)
function markFieldError(el) {
    if (!el) return;
    el.classList.add('is-invalid');
}

// Quita el borde rojo de un campo
function clearFieldError(el) {
    if (!el) return;
    el.classList.remove('is-invalid');
}

// Muestra texto de error simple en la caja
function showError(errorBox, msg) {
    errorBox.innerHTML = `<strong>⚠️</strong> ${msg}`;
    errorBox.classList.remove('d-none');
}

function togglePassword(inputId, iconSpan) {
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

async function submitRegistration() {
    const errorBox = document.getElementById('error-step-4');
    const successBox = document.getElementById('success-reg');
    const btnSubmit = document.querySelector('button[onclick="submitRegistration()"]');
    
    // Validar checkbox obligatorios
    const requiredChecks = [
        { id: 'chk-terminos',     label: 'Términos y condiciones' },
        { id: 'chk-sensibles',    label: 'Tratamiento de datos sensibles' },
        { id: 'chk-compartir',    label: 'Compartir perfil con empresas' },
        { id: 'chk-conservacion', label: 'Conservación de datos' }
    ];

    requiredChecks.forEach(c => clearFieldError(document.getElementById(c.id)));

    const faltantes4 = [];
    requiredChecks.forEach(c => {
        const el = document.getElementById(c.id);
        if (el && !el.checked) {
            faltantes4.push(c.label);
            markFieldError(el);
        }
    });

    if (faltantes4.length > 0) {
        errorBox.innerHTML = `<strong>⚠️ Faltan los siguientes consentimientos obligatorios (*):</strong><ul class="mb-0 mt-1">${faltantes4.map(f => `<li>${f}</li>`).join('')}</ul>`;
        errorBox.classList.remove('d-none');
        return;
    }

    errorBox.classList.add('d-none');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Procesando...';

    // RECOLECCIÓN COMPLETA DE DATOS (ISO 30415)
    const extraData = {
        apellido: document.getElementById('reg-apellidos').value.trim(),
        tipoDoc: document.getElementById('reg-tipo-doc').value,
        numDoc: document.getElementById('reg-num-doc').value.trim(),
        fechaNacimiento: document.getElementById('reg-fecha-nac').value,
        telefono: document.getElementById('reg-telefono').value.trim(),
        direccion: document.getElementById('reg-direccion').value.trim(),
        codigoPostal: document.getElementById('reg-cp').value.trim(),
        ciudad: document.getElementById('reg-ciudad').value.trim(),
        pais: document.getElementById('reg-pais').value.trim(),
        
        // Discapacidad
        gradoDiscapacidad: document.getElementById('reg-grado-discapacidad').value,
        numCertificado: document.getElementById('reg-num-cert').value.trim(),
        vencimientoCertificado: document.getElementById('reg-vencimiento-cert').value,
        adaptaciones: document.getElementById('reg-adaptaciones').value.trim(),
        asistencia: [],
        
        // Laboral
        nivelEducativo: document.getElementById('reg-educacion').value,
        especializacion: document.getElementById('reg-especializacion').value.trim(),
        experienciaYears: document.getElementById('reg-experiencia').value,
        habilidades: document.getElementById('reg-habilidades').value.trim(),
        idiomas: document.getElementById('reg-idiomas').value.trim(),
        modalidadLaboral: document.getElementById('reg-modalidad').value,
        disponibilidad: document.getElementById('reg-disponibilidad').value,
        
        privacidad: {
            visible: document.getElementById('chk-compartir').checked,
            newsletter: document.getElementById('chk-comunicaciones').checked
        }
    };

    // Agregar tipos de asistencia checklist
    if (document.getElementById('asist-fisica').checked) extraData.asistencia.push("accesibilidad");
    if (document.getElementById('asist-tecnologia').checked) extraData.asistencia.push("tecnologia");
    if (document.getElementById('asist-interprete').checked) extraData.asistencia.push("interprete");
    if (document.getElementById('asist-horario').checked) extraData.asistencia.push("remoto");

    const email = document.getElementById('reg-email').value.trim();
    const pwd = document.getElementById('reg-password').value;
    const nombre = document.getElementById('reg-nombre').value.trim();
    const discapacidad = document.getElementById('reg-tipo-discapacidad').value;

    try {
        let isRegistered = false;
        if (typeof Auth !== 'undefined' && Auth.registerUser) {
            isRegistered = await Auth.registerUser(nombre, email, pwd, discapacidad, "usuario", extraData);
        }

        if (!isRegistered) {
            errorBox.textContent = "El registro falló en la nube. Verifica tu conexión.";
            errorBox.classList.remove('d-none');
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = 'Completar registro';
            return;
        }

        successBox.textContent = "¡Registro completado en la nube! Redirigiendo...";
        successBox.classList.remove('d-none');

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);

    } catch (e) {
        console.error(e);
        errorBox.textContent = "Error inesperado en el registro cloud: " + e.message;
        errorBox.classList.remove('d-none');
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = 'Completar registro';
    }
}
