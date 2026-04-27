// ===============================
// admin.js — Panel principal del administrador
// ===============================

document.addEventListener("DOMContentLoaded", () => {
    if (typeof Auth !== "undefined") {
        const user = Auth.getActiveUser();
        if (!user || user.rol !== "admin") {
            window.location.href = "../login.html";
            return;
        }
    }

    // --- Cargar base de datos local ---
    const db = Data.getDB();

    // --- Actualizar contadores ---
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    setText("countUsuarios", db.usuarios.length);
    setText("countOfertas", db.ofertas.length);
    setText("countEmpresas", db.empresas.length);
    setText("countPostulaciones", db.postulaciones ? db.postulaciones.length : 0);

    // ===============================
    // Mostrar actividad reciente — versión mejorada
    // ===============================
    function cargarActividadReciente() {
        const db = Data.getDB();

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
        db.usuarios.slice(-3).forEach(u => {
            actividades.push({
                tipo: "Usuario",
                mensaje: `Nuevo usuario: <strong>${u.nombre}</strong>`,
                fecha: parseFecha(u.fechaRegistro),
                email: u.correo
            });
        });

        // --- Últimas ofertas ---
        db.ofertas.slice(-3).forEach(o => {
            // Busquemos el correo de la empresa por el nombre (en este mock el nombre es el ID usualmente o link)
            const empresa = db.empresas.find(e => e.nombre === o.empresa);
            actividades.push({
                tipo: "Oferta",
                mensaje: `Oferta: <strong>${o.titulo}</strong>`,
                fecha: parseFecha(o.fecha || o.fechaPublicacion),
                email: empresa ? empresa.correo : "soporte@talentoinclusivo.com"
            });
        });

        // --- Últimas empresas ---
        db.empresas.slice(-3).forEach(e => {
            actividades.push({
                tipo: "Empresa",
                mensaje: `Empresa: <strong>${e.nombre}</strong>`,
                fecha: parseFecha(e.fechaRegistro),
                email: e.correo
            });
        });

        // --- Ordenar por fecha (más reciente primero) ---
        actividades.sort((a, b) => b.fecha - a.fecha);

        // --- Mostrar solo los últimos 5 eventos ---
        const recientes = actividades.slice(0, 5);

        listaActividad.innerHTML = recientes.length
            ? recientes
                .map(a => {
                    const info = Data.getContactInfo(a.email);
                    return `
                    <li class="list-group-item d-flex align-items-center justify-content-between py-3">
                        <div class="d-flex align-items-center">
                            <img src="${info.foto}" class="rounded-circle me-3" style="width: 32px; height: 32px; object-fit: cover;">
                            <span>${a.mensaje}</span>
                        </div>
                        <small class="text-muted pe-2">${a.fecha.toLocaleDateString("es-PE")}</small>
                    </li>`;
                })
                .join("")
            : `<li class="list-group-item text-muted">No hay actividad reciente.</li>`;
    }

    // Ejecutar al cargar
    cargarActividadReciente();


    // --- Logout ---
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => Auth.logout());
    }
});
