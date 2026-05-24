document.addEventListener("DOMContentLoaded", async () => {
    // RBAC: Solo usuarios con rol 'empresa' pueden acceder
    const user = await Auth.requireRole("empresa", "../login.html");
    if (!user) return;

    // 2. Elementos del DOM
    const offersList = document.getElementById("offersList");
    const searchInput = document.getElementById("searchOffer");
    const filterEstado = document.getElementById("filterEstado");
    const filterModalidad = document.getElementById("filterModalidad");

    // 3. Cargar y Filtrar Ofertas de la nube
    async function renderOffers() {
        const query = searchInput.value.toLowerCase();
        const estado = filterEstado.value;
        const modalidad = filterModalidad.value;

        const allOffers = await Data.getOfertas();
        let ofertas = allOffers.filter(o => o.empresa === user.nombre || o.empresaEmail === user.correo);
        
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
            offersList.innerHTML = Security.sanitizeHTML(`
                <div class="col-12 text-center py-5">
                    <p class="text-muted">No se encontraron ofertas que coincidan con los filtros.</p>
                </div>
            `);
            return;
        }

        const db = await Data.getDB();
        const allPostulaciones = db.postulaciones || [];

        offersList.innerHTML = ofertas.map(o => {
            const numPostulaciones = allPostulaciones.filter(p => String(p.idOferta) === String(o.id)).length;
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
                                        Publicado: ${o.fecha || "No especificada"}
                                    </p>
                                    <p class="text-muted small mb-0">
                                        Modalidad: <span class="fw-semibold">${o.modalidad}</span> • 
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
    window.toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === "Activa" ? "Pausada" : "Activa";
        await Data.updateOferta(id, { estado: newStatus });
        await renderOffers();
    };

    window.deleteOffer = async (id) => {
        if (confirm("¿Estás seguro de que deseas eliminar esta oferta? Esta acción no se puede deshacer.")) {
            await Data.deleteOferta(id);
            await renderOffers();
        }
    };

    window.editOffer = (id) => {
        window.location.href = `publicar_oferta.html?edit=${id}`;
    };

    window.viewDetails = async (id) => {
        const ofertas = await Data.getOfertas();
        const o = ofertas.find(of => String(of.id) === String(id));
        if(!o) return;

        const body = document.getElementById("modalDetalleBody");
        body.innerHTML = Security.sanitizeHTML(`
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
                    <p class="fw-bold mb-0">${o.fecha || "No especificada"}</p>
                </div>
                <div class="col-6">
                    <p class="text-secondary mb-1">Discapacidad Preferente</p>
                    <p class="fw-bold mb-0">${o.discapacidad}</p>
                </div>
            </div>
        `);
        
        const modal = new bootstrap.Modal(document.getElementById('modalDetalle'));
        modal.show();
    };

    // Eventos
    searchInput.addEventListener("input", renderOffers);
    filterEstado.addEventListener("change", renderOffers);
    filterModalidad.addEventListener("change", renderOffers);

    await renderOffers();

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", async (e) => {
        e.preventDefault();
        await Auth.logout();
    });
});
