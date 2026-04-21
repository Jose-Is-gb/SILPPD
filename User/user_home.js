// ===============================
// user_home.js — Control de sesión y Dashboard dinámico
// ===============================

document.addEventListener("DOMContentLoaded", () => {
    const session = Auth.getActiveUser();

    // Si no hay sesión, redirige al login
    if (!session) {
        window.location.href = "../login.html";
        return;
    }

    // ===============================
    // Personalización de Interfaz
    // ===============================
    const heroWelcome = document.getElementById("heroWelcome");
    if (heroWelcome && session.nombre) {
        heroWelcome.textContent = `¡Hola, ${session.nombre}! 👋`;
    }

    const welcome = document.getElementById("welcomeMessage");
    if (welcome && session.nombre) {
        welcome.innerHTML = `<i class="fa fa-info-circle me-2 text-primary"></i> Tip del día: Asegúrate de tener tu CV actualizado en la sección de Perfil.`;
        welcome.style.display = "block";
    }

    // ===============================
    // Cálculo de Estadísticas Reales
    // ===============================
    const db = Data.getDB();

    // 1. Postulaciones del usuario
    const myApps = (db.postulaciones || []).filter(p => p.email === session.correo);
    document.getElementById("statApps").textContent = myApps.length;

    // 2. Ofertas de empleo activas (compatibles o generales)
    const offers = Data.getOfertas().filter(o => o.estado === "Activa");
    document.getElementById("statOfertas").textContent = offers.length;

    // 3. Mensajes (simulado por ahora o desde la BD de mensajes si existe)
    const myMsgs = (db.mensajes || []).filter(m => m.destinatario === session.correo);
    document.getElementById("statMsg").textContent = myMsgs.length;

    // ===============================
    // Logout
    // ===============================
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            Auth.logout();
            window.location.href = "../login.html";
        });
    }
});
