// ===============================
// login.js — Integrado con db.js, auth.js, data.js
// ===============================

document.addEventListener("DOMContentLoaded", () => {
    // Constantes
    const APP_URL = "User/user_home.html";
    const ADMIN_URL = "Admin/admin.html";

    // Elementos
    const btnUser = document.getElementById("btnUser");
    const btnAdmin = document.getElementById("btnAdmin");
    const loginBox = document.getElementById("loginBox");
    const registerBox = document.getElementById("registerBox");
    const loginBtn = document.getElementById("loginBtn");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");
    const restrictedMsg = document.getElementById("restrictedMessage");
    const userOptions = document.getElementById("userOptions");
    const adminExtra = document.getElementById("adminExtra");
    const registerLink = document.getElementById("registerLink");
    const registerBtn = document.getElementById("registerBtn");
    const regEmailInput = document.getElementById("regEmail");
    const regPasswordInput = document.getElementById("regPassword");
    const regConfirmPasswordInput = document.getElementById("regConfirmPassword");
    const registerMessage = document.getElementById("registerMessage");
    const showRegisterLink = document.getElementById("showRegister");
    const showLoginLink = document.getElementById("showLogin");

    // Función auxiliar
    const showMessage = (el, text, type = "primary") => {
        el.textContent = text;
        el.className = `alert alert-${type} text-center`;
        el.classList.remove("d-none");
    };

    // Mostrar vistas
    function showView(view) {
        if (view === "register") {
            loginBox.classList.add("d-none");
            registerBox.classList.remove("d-none");
            registerMessage.classList.add("d-none");
        } else {
            loginBox.classList.remove("d-none");
            registerBox.classList.add("d-none");
        }
    }

    showRegisterLink.onclick = e => { e.preventDefault(); showView("register"); };
    showLoginLink.onclick = e => { e.preventDefault(); showView("login"); };

    // Cambiar modo
    function setMode(mode) {

        loginBox.setAttribute("data-login-mode", mode);

        if (mode === "admin") {

            loginBtn.textContent = "Acceder como Administrador";
            emailInput.placeholder = "admin@talentoinclusivo.com";
            restrictedMsg.classList.remove("d-none");
            userOptions.classList.add("d-none");
            adminExtra.classList.remove("d-none");
            registerLink.classList.add("d-none");

        }  else {

            loginBtn.textContent = "Iniciar Sesión";
            emailInput.placeholder = "tu@email.com";
            restrictedMsg.classList.add("d-none");
            userOptions.classList.remove("d-none");
            adminExtra.classList.add("d-none");
            registerLink.classList.remove("d-none");

        }
    }

    btnUser.addEventListener("change", () => setMode("user"));
    btnAdmin.addEventListener("change", () => setMode("admin"));
    setMode("user");

    // Registro
    registerBtn.onclick = () => {
        const email = regEmailInput.value.trim();
        const password = regPasswordInput.value.trim();
        const confirm = regConfirmPasswordInput.value.trim();

        if (!email || !password || !confirm)
            return showMessage(registerMessage, "Todos los campos son obligatorios.", "danger");

        if (password !== confirm)
            return showMessage(registerMessage, "Las contraseñas no coinciden.", "danger");

        const nombre = email.split("@")[0];
        const ok = Auth.registerUser(nombre, email, password);

        if (!ok) return showMessage(registerMessage, "Este correo ya está registrado.", "danger");

        showMessage(registerMessage, "¡Registro exitoso! Ya puedes iniciar sesión.", "success");
        setTimeout(() => showView("login"), 1500);
    };

    // Login
    loginBtn.onclick = () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const mode = loginBox.getAttribute("data-login-mode");

        if (mode === "admin") {
            if (Auth.loginAdmin(email, password)) {
                window.location.href = ADMIN_URL;
            } else {
                alert("Credenciales de administrador incorrectas.");
            }
        } else {
            if (Auth.login(email, password)) {
                window.location.href = APP_URL;
            } else {
                alert("Correo o contraseña incorrectos.");
            }
        }
    };

    const btnRecover = document.getElementById("btnRecoverPassword");

        if (btnRecover) {
        btnRecover.addEventListener("click", () => {

            const email = document.getElementById("recoverEmail").value;
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

            const db = JSON.parse(localStorage.getItem("TI_DATABASE")) || { usuarios: [] };
            const user = db.usuarios.find(u => u.correo === email);

            if (!user) {
                alert("No existe una cuenta con ese correo");
                return;
            }

            user.password = pass1;
            localStorage.setItem("TI_DATABASE", JSON.stringify(db));
            alert("Contraseña actualizada correctamente");
            location.reload();
        });
    }

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
