document.addEventListener("DOMContentLoaded", async () => {
    if (typeof Auth !== "undefined") {
        const user = Auth.getActiveUser();
        if (!user || user.rol !== "admin") {
            window.location.href = "../login.html";
            return;
        }
    }

    // --- Cargar datos de la nube ---
    async function cargarEstadisticas() {
        try {
            const db = await Data.getDB();

            const setText = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value;
            };

            setText("countUsuarios", db.usuarios.length);
            setText("countOfertas", db.ofertas.length);
            setText("countEmpresas", db.empresas.length);
            setText("countPostulaciones", db.postulaciones ? db.postulaciones.length : 0);

            await cargarActividadReciente(db);
        } catch (e) {
            console.error("Error al cargar estadísticas admin:", e);
        }
    }

    async function cargarActividadReciente(db) {
        const listaActividad = document.getElementById("actividadReciente");
        const actividades = [];

        const parseFecha = (val) => {
            if (!val) return new Date();
            if (typeof val === 'string' && val.includes('/')) {
                const parts = val.split('/');
                if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]);
            }
            const d = new Date(val);
            return isNaN(d.getTime()) ? new Date() : d;
        };

        // --- Últimos usuarios registrados ---
        db.usuarios.slice(-5).forEach(u => {
            actividades.push({
                tipo: "Usuario",
                mensaje: `Nuevo usuario: <strong>${u.nombre}</strong>`,
                fecha: parseFecha(u.fechaRegistro),
                email: u.correo
            });
        });

        // --- Últimas ofertas ---
        db.ofertas.slice(-5).forEach(o => {
            actividades.push({
                tipo: "Oferta",
                mensaje: `Oferta: <strong>${o.titulo}</strong>`,
                fecha: parseFecha(o.fecha || o.fechaPublicacion),
                email: o.empresaEmail || "soporte@talentoinclusivo.com"
            });
        });

        // --- Ordenar por fecha ---
        actividades.sort((a, b) => b.fecha - a.fecha);
        const recientes = actividades.slice(0, 5);

        listaActividad.innerHTML = "";

        if (recientes.length === 0) {
            listaActividad.innerHTML = `<li class="list-group-item text-muted">No hay actividad reciente.</li>`;
            return;
        }

        for (const a of recientes) {
            try {
                const info = await Data.getContactInfo(a.email);
                const li = document.createElement("li");
                li.className = "list-group-item d-flex align-items-center justify-content-between py-3";
                li.innerHTML = `
                    <div class="d-flex align-items-center">
                        <img src="${info.foto}" class="rounded-circle me-3" style="width: 32px; height: 32px; object-fit: cover;">
                        <span>${a.mensaje}</span>
                    </div>
                    <small class="text-muted pe-2">${a.fecha ? a.fecha.toLocaleDateString("es-PE") : "—"}</small>
                `;
                listaActividad.appendChild(li);
            } catch (err) {
                console.error("Error al renderizar actividad:", err);
            }
        }
    }

    // Inicializar
    await cargarEstadisticas();

    // --- Logout ---
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            await Auth.logout();
        });
    }
});
