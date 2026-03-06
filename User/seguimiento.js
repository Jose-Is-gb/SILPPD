// ===============================
// seguimiento.js — Seguimiento de Postulaciones
// ===============================

document.addEventListener("DOMContentLoaded", () => {
    // --- Obtener usuario activo ---
    const user = Auth.getActiveUser();
    if (!user) {
        window.location.href = "../login.html";
        return;
    }

    // --- Referencias DOM ---
    const tableBody = document.getElementById("tableBody");
    const countPendientes = document.getElementById("countPendientes");
    const countRevision = document.getElementById("countRevision");
    const countAceptadas = document.getElementById("countAceptadas");
    const countRechazadas = document.getElementById("countRechazadas");

    // --- Cargar postulaciones del usuario activo ---
    const db = JSON.parse(localStorage.getItem("TI_DATABASE")) || {};
    const postulaciones = (db.postulaciones || []).filter(p => p.email === user.correo);

    // --- Si no hay postulaciones ---
    if (postulaciones.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted py-4">
                    <i class="fa fa-info-circle me-2"></i>No tienes postulaciones registradas aún.
                </td>
            </tr>
        `;
        return;
    }

    // --- Contadores por estado ---
    let pendientes = 0, revision = 0, aceptadas = 0, rechazadas = 0;
    postulaciones.forEach(p => {
        if (p.estado === "Pendiente") pendientes++;
        else if (p.estado === "En revisión") revision++;
        else if (p.estado === "Aceptado") aceptadas++;
        else if (p.estado === "Rechazado") rechazadas++;
    });

    countPendientes.textContent = pendientes;
    countRevision.textContent = revision;
    countAceptadas.textContent = aceptadas;
    countRechazadas.textContent = rechazadas;

    // --- Renderizar tabla ---
    tableBody.innerHTML = "";
    postulaciones.forEach(p => {
        const tr = document.createElement("tr");

        const badgeClass =
            p.estado === "Aceptado" ? "bg-success" :
            p.estado === "Rechazado" ? "bg-danger" :
            p.estado === "En revisión" ? "bg-warning text-dark" :
            "bg-secondary";

        tr.innerHTML = `
            <td>${p.titulo}</td>
            <td>${p.empresa}</td>
            <td>${p.fecha}</td>
            <td><span class="badge ${badgeClass}">${p.estado}</span></td>
        `;

        tableBody.appendChild(tr);
    });

    // --- Logout ---
    document.getElementById("logoutBtn").addEventListener("click", () => Auth.logout());
});
