// ===============================
// user_home.js — Control de sesión y Dashboard dinámico con Firebase
// ===============================

document.addEventListener("DOMContentLoaded", async () => {
    // RBAC: Solo usuarios con rol 'usuario' pueden acceder
    const session = await Auth.requireRole("usuario", "../login.html");
    if (!session) return;

    // ===============================
    // Personalización de Interfaz
    // ===============================
    const heroWelcome = document.getElementById("heroWelcome");
    if (heroWelcome && session.nombre) {
        heroWelcome.textContent = `¡Hola, ${session.nombre}! 👋`;
    }

    // ===============================
    // Cálculo de Estadísticas desde la Nube
    // ===============================
    try {
        // En lugar de bajar toda la DB, hacemos consultas específicas si es posible, 
        // o usamos los métodos asíncronos de Data.js
        const allOfertas = await Data.getOfertas();
        const activeOffers = allOfertas.filter(o => o.estado === "Activa");
        document.getElementById("statOfertas").textContent = activeOffers.length;

        const allPostulaciones = await Data.getPostulaciones();
        const myApps = allPostulaciones.filter(p => p.email === session.correo);
        document.getElementById("statApps").textContent = myApps.length;

        const myMsgs = await Data.getMensajesByUser(session.correo);
        document.getElementById("statMsg").textContent = myMsgs.length;

    } catch (e) {
        console.error("Error cargando estadísticas:", e);
    }

    // ===============================
    // Logout
    // ===============================
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            await Auth.logout();
        });
    }
});
