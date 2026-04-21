document.addEventListener("DOMContentLoaded", () => {
    // 1. Verificar sesión
    const user = Auth.getActiveUser();
    if (!user || user.rol !== "empresa") {
        window.location.href = "../login.html";
        return;
    }

    // 2. Elementos del DOM
    const candidatesList = document.getElementById("candidatesList");
    const searchInput = document.getElementById("searchCandidate");
    const filterOffer = document.getElementById("filterOffer");
    const tabs = document.querySelectorAll("#postulacionesTabs button");
    
    // Contadores
    const countNew = document.getElementById("countNew");
    const countReviewed = document.getElementById("countReviewed");
    const countAccepted = document.getElementById("countAccepted");
    const countRejected = document.getElementById("countRejected");

    let activeStatus = "Pendiente"; // Por defecto "Nuevas"

    // 3. Cargar Filtro de Ofertas
    function loadOffersFilter() {
        const ofertas = Data.getOfertas().filter(o => o.empresa === user.nombre);
        filterOffer.innerHTML = '<option value="">Todas las ofertas</option>' + 
            ofertas.map(o => `<option value="${o.id}">${o.titulo}</option>`).join('');
    }

    // 4. Renderizar Candidatos
    function renderCandidates() {
        const query = searchInput.value.toLowerCase();
        const offerId = filterOffer.value;
        const db = Data.getDB();
        
        // Obtener ofertas de la empresa para filtrar postulaciones
        const misOfertas = db.ofertas.filter(o => o.empresa === user.nombre);
        
        let postulaciones = db.postulaciones.filter(p => {
            return misOfertas.some(o => o.id == p.idOferta);
        });

        // Actualizar contadores globales
        countNew.textContent = postulaciones.filter(p => p.estado === "Pendiente").length;
        countReviewed.textContent = postulaciones.filter(p => p.estado === "En revisión").length;
        countAccepted.textContent = postulaciones.filter(p => p.estado === "Aceptado").length;
        countRejected.textContent = postulaciones.filter(p => p.estado === "Rechazado").length;

        // Filtrar por pestaña activa
        postulaciones = postulaciones.filter(p => p.estado === activeStatus);

        // Filtrar por búsqueda y oferta específica
        if (query) {
            postulaciones = postulaciones.filter(p => p.nombreCandidato?.toLowerCase().includes(query) || p.email.toLowerCase().includes(query));
        }
        if (offerId) {
            postulaciones = postulaciones.filter(p => p.idOferta == offerId);
        }

        if (postulaciones.length === 0) {
            candidatesList.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-muted">No hay postulaciones en esta categoría.</p>
                </div>
            `;
            return;
        }

        candidatesList.innerHTML = postulaciones.map(p => {
            const oferta = misOfertas.find(o => o.id == p.idOferta);
            return `
                <div class="col-12 mb-3">
                    <div class="card border-0 shadow-sm rounded-4 p-4 candidate-card">
                        <div class="d-flex justify-content-between align-items-start flex-wrap gap-3">
                            <div class="d-flex gap-3 align-items-center">
                                <div class="avatar bg-blue-light text-blue rounded-circle d-flex align-items-center justify-content-center" style="width: 60px; height: 60px; font-size: 1.5rem;">
                                    ${p.nombreCandidato ? p.nombreCandidato.charAt(0) : 'U'}
                                </div>
                                <div>
                                    <h5 class="fw-bold mb-1">${p.nombreCandidato || 'Candidato'}</h5>
                                    <p class="text-secondary small mb-1">
                                        Postulación a: <span class="text-orange fw-semibold">${oferta ? oferta.titulo : 'Oferta eliminada'}</span>
                                    </p>
                                    <p class="text-muted mb-0" style="font-size: 0.85rem;">
                                        5 años de experiencia • React, TypeScript, Node.js
                                    </p>
                                    <div class="mt-2 d-flex gap-2">
                                        <span class="badge bg-blue-light text-blue rounded-pill px-2">E-learning</span>
                                        <span class="badge bg-green-light text-green rounded-pill px-2">Accesibilidad</span>
                                    </div>
                                </div>
                            </div>
                            <div class="d-flex flex-column gap-2">
                                <div class="d-flex gap-2">
                                    <button class="btn btn-green-light text-green btn-sm rounded-pill px-3" onclick="updateStatus(${p.idOferta}, '${p.email}', 'Aceptado')">
                                        <i class="fa fa-check me-1"></i> Aceptar
                                    </button>
                                    <button class="btn btn-light btn-sm rounded-pill px-3" onclick="viewProfile('${p.email}')">
                                        <i class="fa fa-user me-1"></i> Ver perfil
                                    </button>
                                </div>
                                <div class="d-flex gap-2">
                                    <button class="btn btn-light btn-sm rounded-pill px-3" onclick="alert('Descargando CV...')">
                                        <i class="fa fa-file-pdf me-1"></i> Ver CV
                                    </button>
                                    <button class="btn btn-light btn-sm rounded-pill px-3" onclick="alert('Iniciando chat...')">
                                        <i class="fa fa-envelope me-1"></i> Contactar
                                    </button>
                                </div>
                                <button class="btn btn-outline-danger btn-sm rounded-pill px-3" onclick="updateStatus(${p.idOferta}, '${p.email}', 'Rechazado')">
                                    <i class="fa fa-times me-1"></i> Rechazar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 5. Acciones
    window.updateStatus = (idOferta, email, nuevoEstado) => {
        const db = Data.getDB();
        const postu = db.postulaciones.find(p => p.idOferta == idOferta && p.email === email);
        if (postu) {
            postu.estado = nuevoEstado;
            Data.saveDB(db);
            renderCandidates();
        }
    };

    window.viewProfile = (email) => {
        alert("Visualizando perfil de: " + email);
    };

    // Eventos
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const statusMap = {
                "Nuevas": "Pendiente",
                "En revisión": "En revisión",
                "Aceptado": "Aceptado",
                "Rechazado": "Rechazado"
            };
            activeStatus = statusMap[tab.getAttribute("data-status")];
            renderCandidates();
        });
    });

    searchInput.addEventListener("input", renderCandidates);
    filterOffer.addEventListener("change", renderCandidates);

    // Init
    loadOffersFilter();
    renderCandidates();

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", (e) => {
        e.preventDefault();
        Auth.logout();
    });
});
