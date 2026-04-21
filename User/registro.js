// registro.js - Lógica para el formulario de registro multi-paso

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar la vista en el paso 1
    showStep(1);
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
        const nombre = document.getElementById('reg-nombre').value.trim();
        const apellidos = document.getElementById('reg-apellidos').value.trim();
        const tipoDoc = document.getElementById('reg-tipo-doc').value;
        const numDoc = document.getElementById('reg-num-doc').value.trim();
        const fechaNac = document.getElementById('reg-fecha-nac').value;
        const email = document.getElementById('reg-email').value.trim();
        const telefono = document.getElementById('reg-telefono').value.trim();
        const ciudad = document.getElementById('reg-ciudad').value.trim();
        const pais = document.getElementById('reg-pais').value.trim();
        
        const pwd = document.getElementById('reg-password').value;
        const pwdConf = document.getElementById('reg-confirm-password').value;
        const errorBox = document.getElementById('error-step-1');

        if (!nombre || !apellidos || !tipoDoc || !numDoc || !fechaNac || !email || !telefono || !ciudad || !pais || !pwd || !pwdConf) {
            errorBox.textContent = "Por favor, completa todos los campos obligatorios (*).";
            errorBox.classList.remove('d-none');
            return;
        }

        if (pwd.length < 8) {
            errorBox.textContent = "La contraseña debe tener al menos 8 caracteres.";
            errorBox.classList.remove('d-none');
            return;
        }

        // Validador Doble
        if (pwd !== pwdConf) {
            errorBox.textContent = "Las contraseñas no coinciden. Por favor, verifícalas.";
            errorBox.classList.remove('d-none');
            return;
        }

        // Todo OK
        errorBox.classList.add('d-none');
    }

    // PASO 2 a 3: Solo transiciones por ahora sin validación dura de JS, 
    // asumiremos que el form requerido manejará la advertencia visual (aunque como no es submit de HTML nativo...)

    showStep(stepNumber);
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

function submitRegistration() {
    const errorBox = document.getElementById('error-step-4');
    
    // Validar checkbox obligatorios
    const chkTerminos = document.getElementById('chk-terminos').checked;
    const chkSensibles = document.getElementById('chk-sensibles').checked;
    const chkCompartir = document.getElementById('chk-compartir').checked;
    const chkConservacion = document.getElementById('chk-conservacion').checked;

    if (!chkTerminos || !chkSensibles || !chkCompartir || !chkConservacion) {
        errorBox.textContent = "Debes aceptar los términos y condiciones obligatorios (*) para completar el registro.";
        errorBox.classList.remove('d-none');
        return;
    }

    errorBox.classList.add('d-none');

    // MOCK REGISTRATION: Usaremos auth.js si está presente, el usuario pasará con el nombre del email
    const email = document.getElementById('reg-email').value.trim();
    const pwd = document.getElementById('reg-password').value;
    const nombre = document.getElementById('reg-nombre').value.trim();

    // Intentar registro base en Auth.js (si existe la libreria)
    let isRegistered = true;
    if (typeof Auth !== 'undefined' && Auth.registerUser) {
        isRegistered = Auth.registerUser(nombre, email, pwd);
    }

    if (!isRegistered) {
        errorBox.textContent = "Este correo electrónico ya está registrado.";
        errorBox.classList.remove('d-none');
        return;
    }

    // Mostrar éxito y redirigir
    const successBox = document.getElementById('success-reg');
    successBox.textContent = "¡Registro completado con éxito! Redirigiendo al login...";
    successBox.classList.remove('d-none');

    setTimeout(() => {
        window.location.href = 'login.html';
    }, 2000);
}
