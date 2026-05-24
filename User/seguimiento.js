document.addEventListener("DOMContentLoaded", async () => {
    // RBAC: Solo usuarios con rol 'usuario' pueden acceder
    const user = await Auth.requireRole("usuario", "../login.html");
    if (!user) return;

    // --- Referencias DOM ---
    const tableBody = document.getElementById("tableBody");
    const countPendientes = document.getElementById("countPendientes");
    const countRevision = document.getElementById("countRevision");
    const countAceptadas = document.getElementById("countAceptadas");
    const countRechazadas = document.getElementById("countRechazadas");
    const emptyState = document.getElementById("emptyState");

    // --- Cargar postulaciones del usuario activo de la nube ---
    async function loadSeguimiento() {
        const db = await Data.getDB();
        const postulaciones = (db.postulaciones || []).filter(p => p.email === user.correo);

        // --- Si no hay postulaciones ---
        if (postulaciones.length === 0) {
            tableBody.innerHTML = "";
            if (emptyState) emptyState.classList.remove("d-none");
            return;
        }

        if (emptyState) emptyState.classList.add("d-none");

        // --- Contadores por estado ---
        let stats = { Pendiente: 0, "En revisión": 0, Aceptado: 0, Rechazado: 0 };
        postulaciones.forEach(p => {
            if (stats[p.estado] !== undefined) stats[p.estado]++;
        });

        countPendientes.textContent = stats["Pendiente"];
        countRevision.textContent = stats["En revisión"];
        countAceptadas.textContent = stats["Aceptado"];
        countRechazadas.textContent = stats["Rechazado"];

        window.showDetails = (idOferta) => {
            const p = postulaciones.find(x => String(x.idOferta) === String(idOferta));
            if (!p) return;

            document.getElementById("infoPuesto").textContent = p.titulo;
            document.getElementById("infoEmpresa").textContent = p.empresa;
            document.getElementById("infoFecha").textContent = p.fecha;
            
            const badge = document.getElementById("infoEstado");
            badge.textContent = p.estado;
            badge.className = "badge " + (
                p.estado === "Aceptado" ? "bg-success" :
                p.estado === "Rechazado" ? "bg-danger" :
                p.estado === "En revisión" ? "bg-primary" :
                "bg-warning"
            );

            const modal = new bootstrap.Modal(document.getElementById('detailModal'));
            modal.show();
        };

        // --- Renderizar tabla ---
        tableBody.innerHTML = "";
        postulaciones.forEach(p => {
            const tr = document.createElement("tr");

            const badgeClass =
                p.estado === "Aceptado" ? "bg-success-subtle text-success" :
                p.estado === "Rechazado" ? "bg-danger-subtle text-danger" :
                p.estado === "En revisión" ? "bg-primary-subtle text-primary" :
                "bg-warning-subtle text-warning";

            tr.innerHTML = Security.sanitizeHTML(`
                <td class="ps-4">
                    <div class="fw-bold text-dark">${p.titulo}</div>
                    <div class="text-muted small">${p.empresa}</div>
                </td>
                <td>
                    <div class="text-secondary small fw-medium">${p.fecha}</div>
                </td>
                <td>
                    <span class="badge ${badgeClass} text-uppercase px-3">${p.estado}</span>
                </td>
                <td class="text-end pe-4">
                    <button class="btn btn-light btn-sm rounded-pill px-3 fw-bold border shadow-xs" onclick="showDetails('${p.idOferta}')">
                        <i class="fa fa-eye me-1"></i> Detalles
                    </button>
                </td>
            `);

            tableBody.appendChild(tr);
        });
    }

    await loadSeguimiento();

    // --- Logout ---
    document.getElementById("logoutBtn").addEventListener("click", async (e) => {
        e.preventDefault();
        await Auth.logout();
    });
});
