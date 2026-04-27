document.addEventListener("DOMContentLoaded", async () => {
    // 1. Verificar sesión activa
    if (typeof Auth !== "undefined") {
        const user = Auth.getActiveUser();
        if (!user || user.rol !== "admin") {
            window.location.href = "../login.html";
            return;
        }
    }

    // 2. Configuración Inicial de Fecha
    const dateOpts = { day: 'numeric', month: 'long', year: 'numeric' };
    document.getElementById("txtActualizado").textContent = new Date().toLocaleDateString('es-ES', dateOpts);

    // 3. Obtener datos REALES de Firebase (Asíncrono)
    const db = await Data.getDB();
    const usuarios = db.usuarios || [];
    const empresas = db.empresas || [];
    const ofertas = db.ofertas || [];
    const postulaciones = db.postulaciones || [];

    // 4. Métricas Superiores
    const numUsuarios = usuarios.length;
    const numEmpresas = empresas.length;
    const numOfertas = ofertas.length;
    const numContratados = postulaciones.filter(p => p.estado === "Aceptado").length;
    const conversionRate = postulaciones.length > 0 ? ((numContratados / postulaciones.length) * 100).toFixed(0) : 0;

    document.getElementById("valUsuariosActivos").textContent = numUsuarios.toLocaleString();
    document.getElementById("valEmpresasVerificadas").textContent = numEmpresas.toLocaleString();
    document.getElementById("valOfertasPublicadas").textContent = numOfertas.toLocaleString();
    document.getElementById("valTasaExito").textContent = conversionRate + "%";

    document.getElementById("resumenPostulaciones").textContent = postulaciones.length.toLocaleString();
    document.getElementById("resumenContrataciones").textContent = numContratados.toLocaleString();
    document.getElementById("resumenOfertas").textContent = numOfertas.toLocaleString();
    document.getElementById("resumenConversion").textContent = conversionRate + "%";

    // 5. Gráficos (Simplicado para esta versión)
    const renderTendencias = (tipo = 'line') => {
        const ctx = document.getElementById('chartTendencias').getContext('2d');
        new Chart(ctx, {
            type: tipo,
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                datasets: [{
                    label: 'Postulaciones',
                    data: [10, 25, 45, 30, 55, postulaciones.length],
                    borderColor: '#1E88E5',
                    tension: 0.4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    };
    renderTendencias();

    // Distribución Discapacidad
    const counts = {
        fisica: usuarios.filter(u => (u.discapacidad || "").toLowerCase().includes("física")).length,
        visual: usuarios.filter(u => (u.discapacidad || "").toLowerCase().includes("visual")).length,
        auditiva: usuarios.filter(u => (u.discapacidad || "").toLowerCase().includes("auditiva")).length,
        otros: usuarios.filter(u => u.discapacidad && !["física", "visual", "auditiva"].some(x => u.discapacidad.toLowerCase().includes(x))).length
    };

    new Chart(document.getElementById("chartDiscapacidadPie"), {
        type: 'pie',
        data: {
            labels: ['Física', 'Visual', 'Auditiva', 'Otros'],
            datasets: [{
                data: [counts.fisica, counts.visual, counts.auditiva, counts.otros],
                backgroundColor: ["#1E88E5", "#43A047", "#FF8F00", "#8E24AA"]
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // 6. ISO Métricas
    const empIsoPerc = numEmpresas > 0 ? Math.round((empresas.filter(e => e.estado === "Verificada").length / numEmpresas) * 100) : 0;
    document.getElementById("isoEmpresasPerc").textContent = empIsoPerc + "%";
    document.getElementById("isoEmpresasBar").style.width = empIsoPerc + "%";

    // Eventos
    document.getElementById("btnActualizar").onclick = () => location.reload();
    document.getElementById("logoutBtn").onclick = async () => await Auth.logout();
});
