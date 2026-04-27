document.addEventListener("DOMContentLoaded", () => {
    // 1. Verificar sesión
    const user = Auth.getActiveUser();
    if (!user || user.rol !== "empresa") {
        window.location.href = "../login.html";
        return;
    }

    // 2. Elementos del DOM
    const offersList = document.getElementById("offersList");
    const searchInput = document.getElementById("searchOffer");
    const filterEstado = document.getElementById("filterEstado");
    const filterModalidad = document.getElementById("filterModalidad");

    // 3. Cargar y Filtrar Ofertas
    function renderOffers() {
        const query = searchInput.value.toLowerCase();
        const estado = filterEstado.value;
        const modalidad = filterModalidad.value;

        let ofertas = Data.getOfertas().filter(o => o.empresa === user.nombre);
        
        // Aplicar filtros
        if (query) {
            ofertas = ofertas.filter(o => o.titulo.toLowerCase().includes(query));
        }
        if (estado) {
            ofertas = ofertas.filter(o => o.estado === estado);
        }
        if (modalidad) {
            ofertas = ofertas.filter(o => o.modalidad === modalidad);
        }

        if (ofertas.length === 0) {
            offersList.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-muted">No se encontraron ofertas que coincidan con los filtros.</p>
                </div>
            `;
            return;
        }

        const allPostulaciones = Data.getPostulaciones();

        offersList.innerHTML = ofertas.map(o => {
            const numPostulaciones = allPostulaciones.filter(p => p.idOferta == o.id).length;
            const statusClass = o.estado === "Activa" ? "bg-green-light text-green" : "bg-orange-light text-orange";
            const statusDot = o.estado === "Activa" ? "status-active" : "status-paused";
            const toggleText = o.estado === "Activa" ? "Pausar" : "Reactivar";
            const toggleIcon = o.estado === "Activa" ? "fa-pause" : "fa-play";
            const toggleBtnClass = o.estado === "Activa" ? "btn-outline-orange" : "btn-orange";

            return `
                <div class="col-12 mb-3">
                    <div class="card border-0 shadow-sm rounded-4 p-4">
                        <div class="d-flex justify-content-between align-items-start flex-wrap">
                            <div class="d-flex gap-3">
                                <div class="status-indicator ${statusDot} mt-1 shadow-sm"></div>
                                <div>
                                    <h5 class="fw-bold mb-1">${o.titulo}</h5>
                                    <p class="text-secondary small mb-2">
                                        Publicado: ${o.fecha} • Vence: 15/04/2025
                                    </p>
                                    <p class="text-muted small mb-0">
                                        Modalidad: <span class="fw-semibold">${o.modalidad}</span> • Jornada: Tiempo completo • 
                                        <a href="postulaciones_recibidas.html?id=${o.id}" class="text-blue text-decoration-none fw-bold">${numPostulaciones} postulaciones</a>
                                    </p>
                                </div>
                            </div>
                            <div class="d-flex gap-2 mt-2 mt-md-0">
                                <button class="btn btn-light rounded-pill px-3 btn-sm" onclick="viewDetails('${o.id}')">
                                    <i class="fa fa-eye me-1"></i> Ver detalles
                                </button>
                                <button class="btn btn-light rounded-pill px-3 btn-sm" onclick="editOffer('${o.id}')">
                                    <i class="fa fa-edit me-1"></i> Editar
                                </button>
                                <button class="btn ${toggleBtnClass} rounded-pill px-3 btn-sm" onclick="toggleStatus('${o.id}', '${o.estado}')">
                                    <i class="fa ${toggleIcon} me-1"></i> ${toggleText}
                                </button>
                                <button class="btn btn-outline-danger rounded-pill px-3 btn-sm border-0" onclick="deleteOffer('${o.id}')">
                                    <i class="fa fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 4. Acciones
    window.toggleStatus = (id, currentStatus) => {
        const newStatus = currentStatus === "Activa" ? "Pausada" : "Activa";
        Data.updateOferta(id, { estado: newStatus });
        renderOffers();
    };

    window.deleteOffer = (id) => {
        if (confirm("¿Estás seguro de que deseas eliminar esta oferta? Esta acción no se puede deshacer.")) {
            Data.deleteOferta(id);
            renderOffers();
        }
    };

    window.editOffer = (id) => {
        window.location.href = `publicar_oferta.html?edit=${id}`;
    };

    window.viewDetails = (id) => {
        const o = Data.getOfertas().find(of => of.id == id);
        if(!o) return;

        const body = document.getElementById("modalDetalleBody");
        body.innerHTML = `
            <div class="mb-3">
                <h4 class="fw-bold text-orange mb-1">${o.titulo}</h4>
                <span class="badge ${o.estado === 'Activa' ? 'bg-success' : 'bg-warning'} rounded-pill">${o.estado}</span>
            </div>
            <p class="mb-4">${o.descripcion}</p>
            <div class="row g-3 small">
                <div class="col-6">
                    <p class="text-secondary mb-1">Categoría</p>
                    <p class="fw-bold mb-0">${o.categoria}</p>
                </div>
                <div class="col-6">
                    <p class="text-secondary mb-1">Modalidad</p>
                    <p class="fw-bold mb-0">${o.modalidad}</p>
                </div>
                <div class="col-6">
                    <p class="text-secondary mb-1">Fecha Publicación</p>
                    <p class="fw-bold mb-0">${o.fecha}</p>
                </div>
                <div class="col-6">
                    <p class="text-secondary mb-1">Discapacidad Preferente</p>
                    <p class="fw-bold mb-0">${o.discapacidad}</p>
                </div>
            </div>
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('modalDetalle'));
        modal.show();
    };

    // Eventos
    searchInput.addEventListener("input", renderOffers);
    filterEstado.addEventListener("change", renderOffers);
    filterModalidad.addEventListener("change", renderOffers);

    renderOffers();

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", (e) => {
        e.preventDefault();
        Auth.logout();
    });
});
