document.addEventListener("DOMContentLoaded", () => {
    // ===============================
    // Verificar sesión activa
    // ===============================
    const user = Auth.getActiveUser();
    if (!user || user.rol !== "admin") {
        window.location.href = "../login.html";
        return;
    }

    // ===============================
    // Obtener datos
    // ===============================
    const db = Data.getDB();
    const usuarios = db.usuarios || [];
    const ofertas = db.ofertas || [];
    const postulaciones = db.postulaciones || [];

    console.log("Usuarios:", usuarios);
    console.log("Ofertas:", ofertas);
    console.log("Postulaciones:", postulaciones);

    // ===============================
    // 1️⃣ Usuarios por tipo de discapacidad
    // ===============================
    const tiposDiscapacidad = ["Motora", "Visual", "Auditiva", "Intelectual", "Psicosocial"];
    const usuariosPorTipo = tiposDiscapacidad.map(t =>
        usuarios.filter(u => (u.discapacidad || "").toLowerCase() === t.toLowerCase()).length
    );

    new Chart(document.getElementById("chartDiscapacidad"), {
        type: "pie",
        data: {
            labels: tiposDiscapacidad,
            datasets: [{
                data: usuariosPorTipo,
                backgroundColor: ["#0d6efd", "#198754", "#ffc107", "#dc3545", "#6c757d"]
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: "bottom" } }
        }
    });

    // ===============================
    // 2️⃣ Modalidad de ofertas
    // ===============================
    const modalidades = ["Presencial", "Híbrido", "Remoto"];
    const ofertasModalidad = modalidades.map(m =>
        ofertas.filter(o => (o.modalidad || "Presencial") === m).length
    );

    new Chart(document.getElementById("chartModalidad"), {
        type: "bar",
        data: {
            labels: modalidades,
            datasets: [{
                label: "Cantidad de ofertas",
                data: ofertasModalidad,
                backgroundColor: ["#0d6efd", "#198754", "#ffc107"]
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });

    // ===============================
    // 3️⃣ Compatibilidad de ofertas
    // ===============================
    const ofertasCompatibilidad = tiposDiscapacidad.map(t =>
        ofertas.filter(o => (o.discapacidad || "").toLowerCase() === t.toLowerCase()).length
    );

    new Chart(document.getElementById("chartCompatibilidad"), {
        type: "doughnut",
        data: {
            labels: tiposDiscapacidad,
            datasets: [{
                data: ofertasCompatibilidad,
                backgroundColor: ["#0d6efd", "#198754", "#ffc107", "#dc3545", "#6c757d"]
            }]
        },
        options: { responsive: true, plugins: { legend: { position: "bottom" } } }
    });

    // ===============================
    // 4️⃣ Postulaciones por mes
    // ===============================
    const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const postulacionesPorMes = meses.map((_, i) =>
        postulaciones.filter(p => new Date(p.fecha).getMonth() === i).length
    );

    new Chart(document.getElementById("chartPostulaciones"), {
        type: "line",
        data: {
            labels: meses,
            datasets: [{
                label: "Postulaciones",
                data: postulacionesPorMes,
                fill: true,
                borderColor: "#0d6efd",
                backgroundColor: "rgba(13, 110, 253, 0.2)",
                tension: 0.3
            }]
        },
        options: { responsive: true }
    });

    // ===============================
    // Logout
    // ===============================
    document.getElementById("logoutBtn").addEventListener("click", () => {
        Auth.logout();
    });
});
