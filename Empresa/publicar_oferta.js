document.addEventListener("DOMContentLoaded", () => {
    // 1. Verificar sesión
    const user = Auth.getActiveUser();
    if (!user || user.rol !== "empresa") {
        window.location.href = "../login.html";
        return;
    }

    // 2. Elementos del DOM
    const offerForm = document.getElementById("offerForm");
    
    // 3. Manejar edición si hay ID en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');

    if (editId) {
        document.querySelector("h2").textContent = "Editar Oferta";
        document.querySelector("button[type='submit']").textContent = "Actualizar oferta";
        
        const oferta = Data.getOfertas().find(o => o.id == editId);
        if (oferta) {
            document.getElementById("titulo").value = oferta.titulo;
            document.getElementById("categoria").value = oferta.categoria;
            document.getElementById("descripcion").value = oferta.descripcion;
            document.getElementById("modalidad").value = oferta.modalidad;
            document.getElementById("ubicacion").value = oferta.ciudad;
            // Otros campos simulados o añadidos en la expansión
            if (oferta.vacantes) document.getElementById("vacantes").value = oferta.vacantes;
            if (oferta.requisitos) document.getElementById("requisitos").value = oferta.requisitos;
            if (oferta.jornada) document.getElementById("jornada").value = oferta.jornada;
            if (oferta.salarioMin) document.getElementById("salarioMin").value = oferta.salarioMin;
            if (oferta.salarioMax) document.getElementById("salarioMax").value = oferta.salarioMax;
            if (oferta.adaptaciones) document.getElementById("adaptaciones").value = oferta.adaptaciones;
            if (oferta.vencimiento) document.getElementById("vencimiento").value = oferta.vencimiento;
        }
    }

    // 4. Guardar Oferta
    offerForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const nuevaOferta = {
            titulo: document.getElementById("titulo").value,
            categoria: document.getElementById("categoria").value,
            vacantes: document.getElementById("vacantes").value,
            descripcion: document.getElementById("descripcion").value,
            requisitos: document.getElementById("requisitos").value,
            modalidad: document.getElementById("modalidad").value,
            jornada: document.getElementById("jornada").value,
            salarioMin: document.getElementById("salarioMin").value,
            salarioMax: document.getElementById("salarioMax").value,
            ciudad: document.getElementById("ubicacion").value,
            adaptaciones: document.getElementById("adaptaciones").value,
            vencimiento: document.getElementById("vencimiento").value,
            empresa: user.nombre,
            fecha: new Date().toISOString().split('T')[0],
            estado: "Activa"
        };

        if (editId) {
            Data.updateOferta(parseInt(editId), nuevaOferta);
            alert("Oferta actualizada con éxito.");
        } else {
            nuevaOferta.id = Date.now(); // ID único temporal
            Data.addOferta(nuevaOferta);
            alert("Oferta publicada con éxito.");
        }

        window.location.href = "gestion_ofertas.html";
    });

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", (e) => {
        e.preventDefault();
        Auth.logout();
    });
});
