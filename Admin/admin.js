// ===============================
// admin.js — Panel principal del administrador
// ===============================

document.addEventListener("DOMContentLoaded", () => {
    // --- Cargar base de datos local ---
    const db = JSON.parse(localStorage.getItem("TI_DATABASE")) || {
        usuarios: [],
        ofertas: [],
        empresas: [],
        postulaciones: []
    };

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
        const db = JSON.parse(localStorage.getItem("TI_DATABASE")) || {
            usuarios: [],
            ofertas: [],
            empresas: [],
            postulaciones: []
        };

        const listaActividad = document.getElementById("actividadReciente");
        const actividades = [];

        // --- Últimos usuarios registrados ---
        db.usuarios.slice(-3).forEach(u => {
            actividades.push({
                tipo: "Usuario",
                mensaje: `Nuevo usuario registrado: <strong>${u.nombre}</strong>`,
                fecha: u.fechaRegistro ? new Date(u.fechaRegistro) : new Date()
            });
        });

        // --- Últimas ofertas ---
        db.ofertas.slice(-3).forEach(o => {
            actividades.push({
                tipo: "Oferta",
                mensaje: `Oferta publicada: <strong>${o.titulo}</strong>`,
                fecha: o.fechaPublicacion ? new Date(o.fechaPublicacion) : new Date()
            });
        });

        // --- Últimas empresas ---
        db.empresas.slice(-3).forEach(e => {
            actividades.push({
                tipo: "Empresa",
                mensaje: `Nueva empresa registrada: <strong>${e.nombre}</strong>`,
                fecha: e.fechaRegistro ? new Date(e.fechaRegistro) : new Date()
            });
        });

        // --- Ordenar por fecha (más reciente primero) ---
        actividades.sort((a, b) => b.fecha - a.fecha);

        // --- Mostrar solo los últimos 5 eventos ---
        const recientes = actividades.slice(0, 5);

        listaActividad.innerHTML = recientes.length
            ? recientes
                .map(
                    a => `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <span>${a.mensaje}</span>
                    <small class="text-muted">${a.fecha.toLocaleDateString("es-PE")}</small>
                </li>`
                )
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
