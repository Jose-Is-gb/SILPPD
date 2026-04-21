// ===============================
// validacion_ofertas.js — Ofertas de empleo (usuario)
// ===============================

document.addEventListener("DOMContentLoaded", () => {

    // ===============================
    // Verificar sesión activa
    // ===============================
    const user = Auth.getActiveUser();
    if (!user) {
        window.location.href = "../login.html";
        return;
    }

    // ===============================
    // Referencias del DOM
    // ===============================
    const offersContainer = document.getElementById("offersContainer");
    const searchInput = document.getElementById("searchInput");
    const categorySelect = document.getElementById("categorySelect");
    const discapacidadSelect = document.getElementById("discapacidadSelect");
    const filterBtn = document.getElementById("filterBtn");

    // Modal
    const modalTitle = document.getElementById("modalTitle");
    const modalCategory = document.getElementById("modalCategory");
    const modalDescription = document.getElementById("modalDescription");
    const modalCompany = document.getElementById("modalCompany");
    const modalDate = document.getElementById("modalDate");
    const modalDiscapacidad = document.getElementById("modalDiscapacidad");
    const postularBtn = document.getElementById("postularBtn");

    let selectedOffer = null;

    // ===============================
    // Obtener ofertas unificadas desde la BD
    // ===============================
    // Obtener base de datos completa
    const db = Data.getDB();

    // Cargar solo ofertas activas cuyas empresas NO están rechazadas
    let ofertas = Data.getOfertas().filter(o => {
        if (o.estado !== "Activa") return false;

        // Buscar información de la empresa en la tabla empresas
        const empresaInfo = db.empresas?.find(e => e.nombre === o.empresa);

        // Si la empresa no existe en db.empresas → se considera pendiente, así que SÍ se muestra
        if (!empresaInfo) return true;

        // Si está rechazada → NO mostrar ofertas de esa empresa
        return empresaInfo.estado !== "Rechazada";
    });


    // ===============================
    // Renderizar ofertas
    // ===============================
    function renderOffers(lista = ofertas) {
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

        lista.forEach((oferta, index) => {
            const card = document.createElement("div");
            card.className = "col-md-6 col-lg-4";
            
            // Simular algunas como destacadas
            const isFeatured = index % 5 === 0;
            const featuredHtml = isFeatured ? '<span class="featured-tag">Nuevo</span>' : '';

            card.innerHTML = `
                <div class="card offer-card shadow-sm h-100 p-4 border-0 position-relative" data-id="${oferta.id}">
                    ${featuredHtml}
                    <div class="offer-icon-wrapper mb-3">
                        <i class="fa-solid fa-briefcase"></i>
                    </div>
                    
                    <div class="mb-3">
                        <h5 class="fw-bold text-dark mb-1">${oferta.titulo}</h5>
                        <div class="d-flex align-items-center text-muted small">
                            <i class="fa-solid fa-hotel me-2"></i>
                            <span>${oferta.empresa}</span>
                        </div>
                    </div>

                    <p class="text-muted small mb-4 flex-grow-1">${oferta.descripcion.substring(0, 100)}...</p>
                    
                    <div class="d-flex justify-content-between align-items-center mt-auto">
                        <span class="badge category-badge">${oferta.categoria}</span>
                        <div class="text-muted small">
                            <i class="fa-regular fa-calendar-check me-1"></i> ${oferta.fecha}
                        </div>
                    </div>
                    <button class="btn btn-link stretched-link p-0 d-none"></button>
                </div>
            `;

            card.querySelector(".offer-card").addEventListener("click", () => openModal(oferta));

            offersContainer.appendChild(card);
        });
    }

    renderOffers();

    // ===============================
    // Abrir modal con información
    // ===============================
    function openModal(oferta) {
        selectedOffer = oferta;

        modalTitle.textContent = oferta.titulo;
        if (modalCategory) modalCategory.textContent = oferta.categoria;
        if (modalDescription) modalDescription.textContent = oferta.descripcion;
        if (modalCompany) modalCompany.textContent = oferta.empresa;
        if (modalDate) modalDate.textContent = oferta.fecha;
        if (modalDiscapacidad) modalDiscapacidad.textContent = oferta.discapacidad;

        const myModal = new bootstrap.Modal(document.getElementById("offerModal"));
        myModal.show();
    }

    // ===============================
    // Filtros (texto, categoría, discapacidad)
    // ===============================
    filterBtn.addEventListener("click", () => {
        const keyword = searchInput.value.toLowerCase();
        const categoria = categorySelect.value;
        const discapacidad = discapacidadSelect.value;

        const filtradas = ofertas.filter(oferta => {
            const coincideTexto =
                oferta.titulo.toLowerCase().includes(keyword) ||
                oferta.descripcion.toLowerCase().includes(keyword) ||
                oferta.empresa.toLowerCase().includes(keyword);

            const coincideCategoria =
                categoria === "all" || oferta.categoria === categoria;

            const coincideDiscapacidad =
                discapacidad === "all" || oferta.discapacidad === discapacidad;

            return coincideTexto && coincideCategoria && coincideDiscapacidad;
        });

        renderOffers(filtradas);
    });

    // ===============================
    // Postular a una oferta
    // ===============================
    postularBtn.addEventListener("click", () => {
        if (!selectedOffer) return;

        const usuario = Auth.getActiveUser();
        if (!usuario) {
            alert("Debes iniciar sesión para postular.");
            return;
        }

        const db = Data.getDB();
        if (!db.postulaciones) db.postulaciones = [];

        // Evitar duplicados
        const yaExiste = db.postulaciones.some(
            p => p.email === usuario.correo && p.idOferta === selectedOffer.id
        );

        if (yaExiste) {
            alert("Ya te has postulado a esta oferta.");
            return;
        }

        // Registrar postulación
        db.postulaciones.push({
            idOferta: selectedOffer.id,
            titulo: selectedOffer.titulo,
            empresa: selectedOffer.empresa,
            fecha: new Date().toISOString().split("T")[0],
            estado: "Pendiente",
            email: usuario.correo
        });

        Data.saveDB(db);

        alert(` Te has postulado correctamente a: ${selectedOffer.titulo}`);

        bootstrap.Modal.getInstance(document.getElementById("offerModal")).hide();
    });

    // ===============================
    // Cerrar sesión
    // ===============================
    document.getElementById("logoutBtn").addEventListener("click", () => {
        Auth.logout();
    });

});
