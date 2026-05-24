// ===============================
// login.js — Integrado con db.js, auth.js, data.js
// ===============================

document.addEventListener("DOMContentLoaded", () => {
    // Constantes
    const APP_URL = "User/user_home.html";
    const COMPANY_URL = "Empresa/dashboard.html";
    const ADMIN_URL = "Admin/admin.html";

    // Elementos
    const btnUser = document.getElementById("btnUser");
    const btnCompany = document.getElementById("btnCompany");
    const btnAdmin = document.getElementById("btnAdmin");
    const labelUser = document.getElementById("labelUser");
    const labelCompany = document.getElementById("labelCompany");
    const labelAdmin = document.getElementById("labelAdmin");
    const forgotPasswordLink = document.getElementById("forgotPasswordLink");
    const loginBox = document.getElementById("loginBox");
    const loginBtn = document.getElementById("loginBtn");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");
    const restrictedMsg = document.getElementById("restrictedMessage");
    const userOptions = document.getElementById("userOptions");
    const adminExtra = document.getElementById("adminExtra");
    const registerLink = document.getElementById("registerLink");
    const showRegisterLink = document.getElementById("showRegister");
    
    // --- Lógica de Captcha Visual ---
    let captchaCorrectAnswer = "";
    function generateCaptcha() {
        const canvas = document.getElementById("captchaCanvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        
        // Caracteres aleatorios (sin O, 0, I, l para evitar confusión)
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        captchaCorrectAnswer = "";
        for (let i = 0; i < 5; i++) {
            captchaCorrectAnswer += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Fondo
        ctx.fillStyle = "#f8f9fa";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Ruido visual (Líneas)
        for (let i = 0; i < 5; i++) {
            const r = Math.floor(Math.random() * 256);
            const g = Math.floor(Math.random() * 256);
            const b = Math.floor(Math.random() * 256);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.5)`;
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.stroke();
        }

        // Texto distorsionado
        ctx.font = "bold 24px 'Courier New', Courier, monospace";
        ctx.textBaseline = "middle";
        for (let i = 0; i < captchaCorrectAnswer.length; i++) {
            ctx.save();
            const char = captchaCorrectAnswer[i];
            const x = 15 + (i * 20);
            const y = canvas.height / 2;
            const angle = (Math.random() - 0.5) * 0.4; // Rotación leve
            
            ctx.translate(x, y);
            ctx.rotate(angle);
            const r = Math.floor(Math.random() * 100);
            const g = Math.floor(Math.random() * 100);
            const b = Math.floor(Math.random() * 100);
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillText(char, 0, 0);
            ctx.restore();
        }

        // Ruido visual (Puntos)
        for (let i = 0; i < 30; i++) {
            const r = Math.floor(Math.random() * 256);
            const g = Math.floor(Math.random() * 256);
            const b = Math.floor(Math.random() * 256);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.4)`;
            ctx.beginPath();
            ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        const captchaAnswer = document.getElementById("captchaAnswer");
        if(captchaAnswer) captchaAnswer.value = "";
    }
    
    // Inicializar Captcha
    generateCaptcha();
    const btnRefreshCaptcha = document.getElementById("refreshCaptcha");
    if (btnRefreshCaptcha) {
        btnRefreshCaptcha.addEventListener("click", generateCaptcha);
    }

    // --- Lógica de Bloqueo de Intentos ---
    const MAX_ATTEMPTS = 3;

    function getActiveMode() {
        if (!loginBox) return "user";
        return loginBox.getAttribute("data-login-mode") || "user";
    }

    function getAttemptsData() {
        const mode = getActiveMode();
        const data = localStorage.getItem(`loginAttempts_${mode}`);
        return data ? JSON.parse(data) : { count: 0, lockoutUntil: null, lockoutCount: 0 };
    }

    function saveAttemptsData(data) {
        const mode = getActiveMode();
        localStorage.setItem(`loginAttempts_${mode}`, JSON.stringify(data));
    }

    function isLockedOut() {
        const data = getAttemptsData();
        if (data.lockoutUntil && new Date().getTime() < data.lockoutUntil) {
            return data.lockoutUntil;
        }
        // Si el tiempo expiró, limpiar solo la fecha de bloqueo para conservar el conteo acumulativo de intentos
        if (data.lockoutUntil && new Date().getTime() >= data.lockoutUntil) {
            data.lockoutUntil = null;
            saveAttemptsData(data);
        }
        return false;
    }

    function registerFailedAttempt() {
        const data = getAttemptsData();
        data.count += 1;
        
        // Bloquear al tercer intento o más
        if (data.count >= MAX_ATTEMPTS) {
            data.lockoutCount = (data.lockoutCount || 0) + 1;
            const penaltyMs = data.lockoutCount * 60 * 1000; // 1 min, luego 2 min, etc.
            data.lockoutUntil = new Date().getTime() + penaltyMs;
        }
        
        saveAttemptsData(data);
        checkLockoutUI();

        // En el 5to intento fallido
        if (data.count >= 5) {
            alert("⚠️ Has superado el límite de 5 intentos fallidos. Por seguridad, debes restablecer tu contraseña a través de tu correo electrónico.");
            
            // Auto-llenar el input del correo en el modal de recuperación
            const recoverEmailInput = document.getElementById("recoverEmail");
            if (recoverEmailInput) {
                recoverEmailInput.value = emailInput.value;
            }
            
            // Abrir modal de recuperación de Bootstrap 5
            const modalEl = document.getElementById("recoverModal");
            if (modalEl) {
                const recoverModal = new bootstrap.Modal(modalEl);
                recoverModal.show();
            }
        }
    }

    function resetAttempts() {
        saveAttemptsData({ count: 0, lockoutUntil: null, lockoutCount: 0 });
    }

    // Actualizar UI del Botón si está bloqueado (independiente para cada pestaña)
    function checkLockoutUI() {
        const lockoutTime = isLockedOut();
        if (lockoutTime) {
            loginBtn.disabled = true;
            const timeLeftMs = lockoutTime - new Date().getTime();
            if (timeLeftMs > 60000) {
                const minutes = Math.ceil(timeLeftMs / 60000);
                loginBtn.innerHTML = Security.sanitizeHTML(`<i class="fa-solid fa-lock"></i> Bloqueado (${minutes}m restantes)`);
            } else {
                const seconds = Math.ceil(timeLeftMs / 1000);
                loginBtn.innerHTML = Security.sanitizeHTML(`<i class="fa-solid fa-lock"></i> Bloqueado (${seconds}s restantes)`);
            }
            
            // Re-chequear cada segundo para actualización dinámica
            setTimeout(checkLockoutUI, 1000);
        } else {
            loginBtn.disabled = false;
            const mode = getActiveMode();
            loginBtn.textContent = mode === "admin" ? "Acceder como Administrador" : "Iniciar Sesión";
        }
    }
    
    // Verificar estado al cargar la página
    checkLockoutUI();

    // --- Validación y Sanitización ---
    function sanitizeHTML(str) {
        let temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }

    function isValidEmail(email) {
        // Expresión regular robusta (RFC 5322 estándar aproximado)
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    // Eventos de entrada (Real-time Feedback)
    emailInput.addEventListener("input", (e) => {
        const val = e.target.value;
        const errSpan = document.getElementById("emailError");
        if (val.length >= 100) {
            e.target.value = val.substring(0, 100);
            errSpan.textContent = "Has alcanzado el límite máximo de 100 caracteres.";
            errSpan.classList.remove("d-none");
        } else {
            errSpan.classList.add("d-none");
            errSpan.textContent = "";
        }
    });

    emailInput.addEventListener("blur", (e) => {
        const val = e.target.value.trim();
        const errSpan = document.getElementById("emailError");
        if (val && !isValidEmail(val)) {
            errSpan.textContent = "Formato de correo electrónico inválido.";
            errSpan.classList.remove("d-none");
        } else if (val.length < 100) {
            errSpan.classList.add("d-none");
        }
    });

    passwordInput.addEventListener("input", (e) => {
        const val = e.target.value;
        const errSpan = document.getElementById("passwordError");
        if (val.length >= 50) {
            e.target.value = val.substring(0, 50);
            errSpan.textContent = "Has alcanzado el límite máximo de 50 caracteres.";
            errSpan.classList.remove("d-none");
        } else {
            errSpan.classList.add("d-none");
            errSpan.textContent = "";
        }
    });

    // Cambiar modo
    function setMode(mode) {

        loginBox.setAttribute("data-login-mode", mode);

        // Reset toggles and styles
        labelUser.style.color = '#6c757d';
        labelUser.style.backgroundColor = 'transparent';
        labelUser.classList.remove('shadow-sm');
        
        labelCompany.style.color = '#6c757d';
        labelCompany.style.backgroundColor = 'transparent';
        labelCompany.classList.remove('shadow-sm');
        
        labelAdmin.style.color = '#6c757d';
        labelAdmin.style.backgroundColor = 'transparent';
        labelAdmin.classList.remove('shadow-sm');

        loginBtn.className = "btn w-100 py-2 fw-bold rounded-3";
        loginBtn.style.backgroundColor = '';
        loginBtn.style.borderColor = '';
        loginBtn.style.color = '';

        if (mode === "admin") {
            labelAdmin.style.color = '#212529';
            labelAdmin.style.backgroundColor = 'white';
            labelAdmin.classList.add('shadow-sm');

            loginBtn.classList.add("btn-success");
            loginBtn.textContent = "Acceder como Administrador";
            emailInput.placeholder = "admin@talentoinclusivo.com";
            restrictedMsg.classList.remove("d-none");
            userOptions.classList.add("d-none");
            adminExtra.classList.remove("d-none");
            registerLink.classList.add("d-none");

        } else if (mode === "company") {
            labelCompany.style.color = 'white';
            labelCompany.style.backgroundColor = '#ff9800';
            labelCompany.classList.add('shadow-sm');

            loginBtn.style.backgroundColor = '#ff9800';
            loginBtn.style.borderColor = '#ff9800';
            loginBtn.style.color = 'white';
            loginBtn.textContent = "Iniciar Sesión";
            emailInput.placeholder = "empresa@ejemplo.com";
            restrictedMsg.classList.add("d-none");
            userOptions.classList.remove("d-none");
            adminExtra.classList.add("d-none");
            registerLink.classList.remove("d-none");
            
            if(forgotPasswordLink) forgotPasswordLink.style.color = '#ff9800';
            if(showRegisterLink) {
                showRegisterLink.textContent = "Registra tu empresa aquí";
                showRegisterLink.style.color = '#ff9800';
                showRegisterLink.href = "registro_empresa.html";
            }

        } else {
            // mode = user
            labelUser.style.color = '#212529';
            labelUser.style.backgroundColor = 'white';
            labelUser.classList.add('shadow-sm');

            loginBtn.classList.add("btn-primary");
            loginBtn.textContent = "Iniciar Sesión";
            emailInput.placeholder = "tu@email.com";
            restrictedMsg.classList.add("d-none");
            userOptions.classList.remove("d-none");
            adminExtra.classList.add("d-none");
            registerLink.classList.remove("d-none");

            if(forgotPasswordLink) forgotPasswordLink.style.color = '#0d6efd';
            if(showRegisterLink) {
                showRegisterLink.textContent = "Regístrate aquí";
                showRegisterLink.style.color = '#0d6efd';
                showRegisterLink.href = "registro.html";
            }
        }
        // Actualizar el estado de bloqueo específico de esta vista inmediatamente al cambiar de pestaña
        checkLockoutUI();
    }

    btnUser.addEventListener("change", () => setMode("user"));
    btnCompany.addEventListener("change", () => setMode("company"));
    btnAdmin.addEventListener("change", () => setMode("admin"));
    setMode("user");

    // Login
    loginBtn.onclick = async () => {
        // 1. Verificación de Bloqueo
        const lockoutTime = isLockedOut();
        if (lockoutTime) {
            const timeLeft = Math.ceil((lockoutTime - new Date().getTime()) / 60000);
            alert(`Demasiados intentos fallidos. Por seguridad, intente de nuevo en ${timeLeft} minuto(s).`);
            return;
        }

        // Ocultar errores anteriores
        const emailErr = document.getElementById("emailError");
        const passErr = document.getElementById("passwordError");
        const capErr = document.getElementById("captchaError");
        if (emailErr) emailErr.classList.add("d-none");
        if (passErr) passErr.classList.add("d-none");
        if (capErr) capErr.classList.add("d-none");

        // 2. Extracción y Sanitización de Inputs
        const rawEmail = emailInput.value.trim();
        const rawPassword = passwordInput.value.trim();
        const captchaAnswerInput = document.getElementById("captchaAnswer").value.trim();
        
        const email = sanitizeHTML(rawEmail);
        const password = sanitizeHTML(rawPassword);
        const mode = loginBox.getAttribute("data-login-mode");

        let hasError = false;

        // 3. Validación de campos vacíos
        if (!email) {
            if (emailErr) {
                emailErr.textContent = "Por favor, ingresa tu correo electrónico.";
                emailErr.classList.remove("d-none");
            }
            hasError = true;
        }
        if (!password) {
            if (passErr) {
                passErr.textContent = "Por favor, ingresa tu contraseña.";
                passErr.classList.remove("d-none");
            }
            hasError = true;
        }
        if (!captchaAnswerInput) {
            if (capErr) {
                capErr.textContent = "Por favor, completa la verificación de seguridad.";
                capErr.classList.remove("d-none");
            }
            hasError = true;
        }

        if (hasError) return;

        // 4. Validación de formato de correo
        if (!isValidEmail(email)) {
            if (emailErr) {
                emailErr.textContent = "El formato del correo electrónico no es válido.";
                emailErr.classList.remove("d-none");
            }
            return;
        }

        // 5. Validación de Captcha (Insensible a mayúsculas)
        if (captchaAnswerInput.toLowerCase() !== captchaCorrectAnswer.toLowerCase()) {
            if (capErr) {
                capErr.textContent = "El código de verificación de seguridad es incorrecto.";
                capErr.classList.remove("d-none");
            }
            generateCaptcha(); // Regenerar para evitar fuerza bruta manual
            return;
        }

        // Mostrar un pequeño indicador de carga si fuera necesario
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fa fa-spinner fa-spin me-2"></i> Cargando...';

        try {
            if (mode === "admin") {
                const result = await Auth.loginAdmin(email, password);
                if (result.success) {
                    resetAttempts();
                    window.location.href = ADMIN_URL;
                } else {
                    registerFailedAttempt();
                    if (passErr) {
                        passErr.textContent = "Correo o contraseña incorrectos.";
                        passErr.classList.remove("d-none");
                    }
                }
            } else if (mode === "company") {
                const user = await Auth.login(email, password);
                if (user && user.rol === "empresa") {
                    resetAttempts();
                    window.location.href = COMPANY_URL;
                } else if (user) {
                    if (passErr) {
                        passErr.textContent = "Esta cuenta no está registrada como empresa.";
                        passErr.classList.remove("d-none");
                    }
                    await Auth.logout();
                } else {
                    registerFailedAttempt();
                    if (passErr) {
                        passErr.textContent = "Correo o contraseña incorrectos.";
                        passErr.classList.remove("d-none");
                    }
                }
            } else {
                const user = await Auth.login(email, password);
                if (user && user.rol === "usuario") {
                    resetAttempts();
                    window.location.href = APP_URL;
                } else if (user) {
                    if (passErr) {
                        passErr.textContent = "Esta cuenta no está registrada como candidato.";
                        passErr.classList.remove("d-none");
                    }
                    await Auth.logout();
                } else {
                    registerFailedAttempt();
                    if (passErr) {
                        passErr.textContent = "Correo o contraseña incorrectos.";
                        passErr.classList.remove("d-none");
                    }
                }
            }
        } catch (e) {
            console.error(e);
            alert("Error en la conexión con el servidor.");
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = mode === "admin" ? "Acceder como Administrador" : "Iniciar Sesión";
            generateCaptcha(); // Siempre regenerar después de un intento para evitar reuso
        }
    };

    // Recuperar contraseña
    const btnRecover = document.getElementById("btnRecoverPassword");

    if (btnRecover) {
        btnRecover.addEventListener("click", async () => {
            const email = document.getElementById("recoverEmail").value.trim();

            if (!email) {
                alert("Por favor, ingresa tu correo electrónico.");
                return;
            }
            if (typeof Security !== 'undefined' && !Security.isValidEmailStrict(email)) {
                alert("Formato de correo inválido o contiene caracteres no permitidos.");
                return;
            }

            try {
                // Notificar Firebase Auth para enviar correo
                await authFirebase.sendPasswordResetEmail(email);
                alert("✓ Te hemos enviado un enlace de recuperación. Revisa tu bandeja de entrada o spam.");
                document.getElementById("recoverEmail").value = "";
                
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById("recoverModal"));
                if (modal) modal.hide();
                
            } catch (e) {
                console.error("Error al recuperar:", e);
                if (e.code === 'auth/user-not-found') {
                    alert("No existe una cuenta registrada con ese correo.");
                } else if (e.code === 'auth/invalid-email') {
                    alert("Formato de correo inválido.");
                } else {
                    alert("Error al enviar el enlace: " + e.message);
                }
            }
        });
    }

    // Mostrar/ocultar contraseña
    if (togglePassword) {
        togglePassword.addEventListener("click", () => {
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            togglePassword.innerHTML =
                type === "password"
                ? '<i class="fa-solid fa-eye"></i>'
                : '<i class="fa-solid fa-eye-slash"></i>';
        });
    }

});
