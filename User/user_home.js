// ===============================
// user_home.js — Control de sesión y bienvenida
// ===============================

document.addEventListener("DOMContentLoaded", () => {
    const session = Auth.getActiveUser();
    console.log("Sesión actual:", session);

    // Si no hay sesión, redirige al login
    if (!session) {
        window.location.href = "../login.html";
        return;
    }

    // Mostrar mensaje de bienvenida
    const welcome = document.getElementById("welcomeMessage");
    if (welcome && session.nombre) {
        welcome.style.display = "block";
        welcome.textContent = `👋 Bienvenido/a, ${session.nombre}`;
    }

    // Logout
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            Auth.logout();
            window.location.href = "../login.html";
        });
    }
});
