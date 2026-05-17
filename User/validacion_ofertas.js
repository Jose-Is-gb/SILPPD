document.addEventListener("DOMContentLoaded", async () => {

    // ===============================
    // RBAC: Solo usuarios con rol 'usuario' pueden acceder
    // ===============================
    const user = await Auth.requireRole("usuario", "../login.html");
    if (!user) return;

    // ===============================
    // Referencias del DOM
    // ===============================
    const offersContainer = document.getElementById("offersContainer");
    const searchInput = document.getElementById("searchInput");
    const categorySelect = document.getElementById("categorySelect");
    const discapacidadSelect = document.getElementById("discapacidadSelect");
    const filterBtn = document.getElementById("filterBtn");

    const modalTitle = document.getElementById("modalTitle");
    const modalCategory = document.getElementById("modalCategory");
    const modalDescription = document.getElementById("modalDescription");
    const modalCompany = document.getElementById("modalCompany");
    const modalDate = document.getElementById("modalDate");
    const modalDiscapacidad = document.getElementById("modalDiscapacidad");
    const postularBtn = document.getElementById("postularBtn");
    const saveBtn = document.getElementById("saveBtn");

    let selectedOffer = null;
    let todasLasOfertas = [];

    // ===============================
    // Cargar ofertas unificadas desde la BD
    // ===============================
    async function loadOffersData() {
        try {
            const db = await Data.getDB();
            const rawOfertas = await Data.getOfertas();
            const empresas = db.empresas || [];

            todasLasOfertas = rawOfertas.filter(o => {
                if (o.estado !== "Activa") return false;
                const empresaInfo = empresas.find(e => e.nombre === o.empresa || e.razonSocial === o.empresa);
                if (!empresaInfo) return true;
                return empresaInfo.estado !== "Rechazada";
            });

            await renderOffers(todasLasOfertas);
        } catch (e) {
            console.error("Error cargando ofertas:", e);
        }
    }

    // ===============================
    // Renderizar ofertas
    // ===============================
    async function renderOffers(lista) {
        offersContainer.innerHTML = "";

        if (lista.length === 0) {
            offersContainer.innerHTML = `
                <div class="col-12 text-center text-muted py-5 mt-4">
                    <div class="bg-white d-inline-block p-5 rounded-5 shadow-sm">
                        <i class="fa fa-search-minus fa-3x mb-3 text-primary opacity-25"></i>
                        <h4 class="fw-bold text-dark">No hay resultados</h4>
                        <p class="mb-0">Prueba con otros filtros o palabras clave.</p>
                    </div>
                </div>`;
            return;
        }

        for (const [index, oferta] of lista.entries()) {
            const card = document.createElement("div");
            card.className = "col-md-6 col-lg-4";
            
            const isFeatured = index % 5 === 0;
            const featuredHtml = isFeatured ? '<span class="featured-tag">Nuevo</span>' : '';

            // Obtener logo de la empresa (o el que haya en la oferta)
            const info = await Data.getContactInfo(oferta.empresaEmail || oferta.empresa);
            const logo = info.foto || "https://cdn-icons-png.flaticon.com/512/186/186100.png";

            card.innerHTML = `
                <div class="card offer-card shadow-sm h-100 p-4 border-0 position-relative">
                    ${featuredHtml}
                    <div class="mb-3 d-flex align-items-center">
                        <img src="${logo}" class="rounded-circle shadow-sm me-3" style="width: 45px; height: 45px; object-fit: cover;">
                        <div>
                            <h5 class="fw-bold text-dark mb-1" style="font-size: 1rem;">${oferta.titulo}</h5>
                            <div class="d-flex align-items-center text-muted small">
                                <i class="fa-solid fa-hotel me-2"></i>
                                <span>${oferta.empresa}</span>
                            </div>
                        </div>
                    </div>
                    
                    <p class="text-muted small mb-4 flex-grow-1">${oferta.descripcion ? oferta.descripcion.substring(0, 100) : "Sin descripción"}...</p>
                    
                    <div class="d-flex justify-content-between align-items-center mt-auto">
                        <span class="badge category-badge">${oferta.categoria}</span>
                        <div class="text-muted small">
                            <i class="fa-regular fa-calendar-check me-1"></i> ${oferta.fecha || "Hace poco"}
                        </div>
                    </div>
                </div>
            `;

            card.querySelector(".offer-card").addEventListener("click", () => openModal(oferta));
            offersContainer.appendChild(card);
        }
    }

    // ===============================
    // Abrir modal con información
    // ===============================
    async function openModal(oferta) {
        selectedOffer = oferta;

        modalTitle.textContent = oferta.titulo;
        modalCategory.textContent = oferta.categoria;
        modalDescription.textContent = oferta.descripcion;
        modalCompany.textContent = oferta.empresa;
        modalDate.textContent = oferta.fecha || "No especificada";
        modalDiscapacidad.textContent = oferta.discapacidad;
        
        await updateModalButtons(oferta.id);

        const myModal = new bootstrap.Modal(document.getElementById("offerModal"));
        myModal.show();
    }

    // ===============================
    // Filtros
    // ===============================
    filterBtn.addEventListener("click", () => {
        const keyword = searchInput.value.toLowerCase();
        const categoria = categorySelect.value;
        const discapacidad = discapacidadSelect.value;

        const filtradas = todasLasOfertas.filter(oferta => {
            const coincideTexto =
                oferta.titulo.toLowerCase().includes(keyword) ||
                (oferta.descripcion || "").toLowerCase().includes(keyword) ||
                oferta.empresa.toLowerCase().includes(keyword);

            const coincideCategoria =
                categoria === "all" || oferta.categoria === categoria;

            const coincideDiscapacidad =
                discapacidad === "all" || oferta.discapacidad === discapacidad;

            return coincideTexto && coincideCategoria && coincideDiscapacidad;
        });

        renderOffers(filtradas);
    });

    // Guardar / Favoritos
    saveBtn.addEventListener("click", async () => {
        if (!selectedOffer) return;

        const freshUser = await Data.getUserByEmail(user.correo);
        freshUser.favoritos = freshUser.favoritos || [];

        const index = freshUser.favoritos.indexOf(selectedOffer.id);
        if (index === -1) {
            freshUser.favoritos.push(selectedOffer.id);
            saveBtn.innerHTML = '<i class="fa-solid fa-star text-warning"></i> Guardado';
            saveBtn.classList.add("btn-light");
            saveBtn.classList.remove("btn-outline-primary");
        } else {
            freshUser.favoritos.splice(index, 1);
            saveBtn.innerHTML = '<i class="fa-regular fa-star"></i> Guardar';
            saveBtn.classList.remove("btn-light");
            saveBtn.classList.add("btn-outline-primary");
        }

        await Data.updateUser(user.correo, freshUser);
        Object.assign(user, freshUser);
        Auth.setActiveUser(user);
    });

    // Postular a una oferta
    postularBtn.addEventListener("click", async () => {
        if (!selectedOffer) return;

        postularBtn.disabled = true;
        postularBtn.innerHTML = '<i class="fa fa-spinner fa-spin me-2"></i> Procesando...';

        try {
            const db = await Data.getDB();
            const yaExiste = (db.postulaciones || []).some(
                p => p.email === user.correo && String(p.idOferta) === String(selectedOffer.id)
            );

            if (yaExiste) {
                alert("Ya te has postulado a esta oferta.");
                postularBtn.disabled = false;
                postularBtn.innerHTML = '<i class="fa fa-check me-2"></i> Postular ahora';
                return;
            }

            // Registrar postulación en la nube
            await Data.addPostulacion({
                idOferta: selectedOffer.id,
                titulo: selectedOffer.titulo,
                empresa: selectedOffer.empresa,
                fecha: new Date().toISOString().split("T")[0],
                estado: "Pendiente",
                email: user.correo
            });

            alert(`✅ ¡Éxito! Te has postulado correctamente a: ${selectedOffer.titulo}.\n\nPuedes ver el progreso en la sección de Seguimiento.`);
            bootstrap.Modal.getInstance(document.getElementById("offerModal")).hide();

        } catch (e) {
            console.error("Error postulando:", e);
            alert("No se pudo enviar la postulación. Intenta de nuevo.");
        } finally {
            postularBtn.disabled = false;
            postularBtn.innerHTML = '<i class="fa fa-check me-2"></i> Postular ahora';
        }
    });

    async function updateModalButtons(ofertaId) {
        const freshUser = await Data.getUserByEmail(user.correo);
        const esFavorito = (freshUser.favoritos || []).includes(ofertaId);
        
        if (esFavorito) {
            saveBtn.innerHTML = '<i class="fa-solid fa-star text-warning"></i> Guardado';
            saveBtn.classList.add("btn-light");
            saveBtn.classList.remove("btn-outline-primary");
        } else {
            saveBtn.innerHTML = '<i class="fa-regular fa-star"></i> Guardar';
            saveBtn.classList.remove("btn-light");
            saveBtn.classList.add("btn-outline-primary");
        }
    }

    // Inicializar
    await loadOffersData();

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", async (e) => {
        e.preventDefault();
        await Auth.logout();
    });
});
