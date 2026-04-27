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
    }

    btnUser.addEventListener("change", () => setMode("user"));
    btnCompany.addEventListener("change", () => setMode("company"));
    btnAdmin.addEventListener("change", () => setMode("admin"));
    setMode("user");

    // Login
    loginBtn.onclick = async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const mode = loginBox.getAttribute("data-login-mode");

        if (!email || !password) {
            alert("Por favor, completa todos los campos.");
            return;
        }

        // Mostrar un pequeño indicador de carga si fuera necesario
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fa fa-spinner fa-spin me-2"></i> Cargando...';

        try {
            if (mode === "admin") {
                const result = await Auth.loginAdmin(email, password);
                if (result.success) {
                    window.location.href = ADMIN_URL;
                } else {
                    alert("❌ Bloqueo Admin: " + result.error);
                }
            } else if (mode === "company") {
                const user = await Auth.login(email, password);
                if (user && user.rol === "empresa") {
                    window.location.href = COMPANY_URL;
                } else if (user) {
                    alert("Esta cuenta no es de tipo empresa.");
                    await Auth.logout();
                } else {
                    alert("Correo o contraseña incorrectos.");
                }
            } else {
                const user = await Auth.login(email, password);
                if (user && user.rol === "usuario") {
                    window.location.href = APP_URL;
                } else if (user) {
                    alert("Esta cuenta no es de tipo usuario.");
                    await Auth.logout();
                } else {
                    alert("Correo o contraseña incorrectos.");
                }
            }
        } catch (e) {
            console.error(e);
            alert("Error en la conexión con el servidor.");
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = mode === "admin" ? "Acceder como Administrador" : "Iniciar Sesión";
        }
    };

    // Recuperar contraseña
    const btnRecover = document.getElementById("btnRecoverPassword");

    if (btnRecover) {
        btnRecover.addEventListener("click", async () => {
            const email = document.getElementById("recoverEmail").value.trim();
            const pass1 = document.getElementById("recoverPassword").value;
            const pass2 = document.getElementById("recoverPassword2").value;

            if (!email || !pass1 || !pass2) {
                alert("Completa todos los campos");
                return;
            }

            if (pass1 !== pass2) {
                alert("Las contraseñas no coinciden");
                return;
            }

            try {
                const db = await Data.getDB();
                const user = (db.usuarios || []).find(u => u.correo === email) || 
                             (db.empresas || []).find(e => e.correo === email);

                if (!user) {
                    alert("No existe una cuenta con ese correo");
                    return;
                }

                await Data.updateUser(user.correo, { password: pass1 });
                alert("✓ Contraseña actualizada correctamente en la nube.");
                location.reload();
            } catch (e) {
                alert("Error al actualizar la contraseña: " + e.message);
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
