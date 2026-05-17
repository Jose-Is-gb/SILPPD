document.addEventListener("DOMContentLoaded", async () => {
    // RBAC: Solo usuarios con rol 'empresa' pueden acceder
    const user = await Auth.requireRole("empresa", "../login.html");
    if (!user) return;

    // 2. Elementos del DOM
    const offerForm = document.getElementById("offerForm");
    
    // 3. Manejar edición si hay ID en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');

    if (editId) {
        document.querySelector("h2").textContent = "Editar Oferta";
        document.querySelector("button[type='submit']").textContent = "Actualizar oferta";
        
        const rawOfertas = await Data.getOfertas();
        const oferta = rawOfertas.find(o => String(o.id) === String(editId));

        if (oferta) {
            document.getElementById("titulo").value = oferta.titulo || "";
            document.getElementById("categoria").value = oferta.categoria || "";
            document.getElementById("descripcion").value = oferta.descripcion || "";
            document.getElementById("modalidad").value = oferta.modalidad || "";
            document.getElementById("ubicacion").value = oferta.ciudad || "";
            document.getElementById("vacantes").value = oferta.vacantes || "1";
            document.getElementById("requisitos").value = oferta.requisitos || "";
            document.getElementById("jornada").value = oferta.jornada || "";
            document.getElementById("salarioMin").value = oferta.salarioMin || "";
            document.getElementById("salarioMax").value = oferta.salarioMax || "";
            document.getElementById("adaptaciones").value = oferta.adaptaciones || "";
            document.getElementById("vencimiento").value = oferta.vencimiento || "";
        }
    }

    // 4. Guardar Oferta (Nube)
    offerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const btn = offerForm.querySelector("button[type='submit']");
        btn.disabled = true;
        btn.innerHTML = '<i class="fa fa-spinner fa-spin me-2"></i> Procesando...';

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
            empresaEmail: user.correo,
            fecha: new Date().toISOString().split('T')[0],
            estado: "Activa"
        };

        try {
            if (editId) {
                await Data.updateOferta(editId, nuevaOferta);
                alert("✓ Oferta actualizada en la nube.");
            } else {
                await Data.addOferta(nuevaOferta);
                alert("✓ Oferta publicada en la nube.");
            }
            window.location.href = "gestion_ofertas.html";
        } catch (err) {
            console.error(err);
            alert("Error al guardar la oferta. Intenta de nuevo.");
            btn.disabled = false;
            btn.textContent = editId ? "Actualizar oferta" : "Publicar oferta";
        }
    });

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", async (e) => {
        e.preventDefault();
        await Auth.logout();
    });
});
