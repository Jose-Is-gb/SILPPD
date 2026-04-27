document.addEventListener("DOMContentLoaded", async () => {
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

    // 3. Cargar Filtro de Ofertas (Nube)
    async function loadOffersFilter() {
        const rawOfertas = await Data.getOfertas();
        const misOfertas = rawOfertas.filter(o => o.empresa === user.nombre || o.empresaEmail === user.correo);
        filterOffer.innerHTML = '<option value="">Todas las ofertas</option>' + 
            misOfertas.map(o => `<option value="${o.id}">${o.titulo}</option>`).join('');
    }

    // 4. Renderizar Candidatos de la nube
    async function renderCandidates() {
        const query = searchInput.value.toLowerCase();
        const offerId = filterOffer.value;
        
        try {
            const db = await Data.getDB();
            const rawOfertas = await Data.getOfertas();
            const misOfertas = rawOfertas.filter(o => o.empresa === user.nombre || o.empresaEmail === user.correo);
            
            let postulaciones = (db.postulaciones || []).filter(p => {
                return misOfertas.some(o => String(o.id) === String(p.idOferta));
            });

            // Actualizar contadores
            countNew.textContent = postulaciones.filter(p => p.estado === "Pendiente").length;
            countReviewed.textContent = postulaciones.filter(p => p.estado === "En revisión").length;
            countAccepted.textContent = postulaciones.filter(p => p.estado === "Aceptado").length;
            countRejected.textContent = postulaciones.filter(p => p.estado === "Rechazado").length;

            // Filtros
            postulaciones = postulaciones.filter(p => p.estado === activeStatus);

            if (query) {
                postulaciones = postulaciones.filter(p => 
                    (p.nombreCandidato || "").toLowerCase().includes(query) || 
                    (p.email || "").toLowerCase().includes(query)
                );
            }
            if (offerId) {
                postulaciones = postulaciones.filter(p => String(p.idOferta) === String(offerId));
            }

            if (postulaciones.length === 0) {
                candidatesList.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <p class="text-muted">No hay postulaciones en esta categoría.</p>
                    </div>
                `;
                return;
            }

            candidatesList.innerHTML = "";
            for (const p of postulaciones) {
                const oferta = misOfertas.find(o => String(o.id) === String(p.idOferta));
                const info = await Data.getContactInfo(p.email);
                
                const div = document.createElement("div");
                div.className = "col-12 mb-3";
                div.innerHTML = `
                    <div class="card border-0 shadow-sm rounded-4 p-4 candidate-card">
                        <div class="d-flex justify-content-between align-items-start flex-wrap gap-3">
                            <div class="d-flex gap-3 align-items-center">
                                <img src="${info.foto}" class="rounded-circle shadow-sm" style="width: 60px; height: 60px; object-fit: cover; border: 2px solid #fff;">
                                <div>
                                    <h5 class="fw-bold mb-1">${info.nombre || p.nombreCandidato || 'Candidato'}</h5>
                                    <p class="text-secondary small mb-1">
                                        Postulación a: <span class="text-orange fw-semibold">${oferta ? oferta.titulo : 'Oferta eliminada'}</span>
                                    </p>
                                    <p class="text-muted mb-0" style="font-size: 0.85rem;">
                                        Fecha: ${p.fecha || "No especificada"}
                                    </p>
                                </div>
                            </div>
                            <div class="d-flex flex-column gap-2">
                                <div class="d-flex gap-2">
                                    <button class="btn btn-green-light text-green btn-sm rounded-pill px-3" onclick="updatePostStatus('${p.id}', 'Aceptado')">
                                        <i class="fa fa-check me-1"></i> Aceptar
                                    </button>
                                    <button class="btn btn-light btn-sm rounded-pill px-3" onclick="viewProfile('${p.email}')">
                                        <i class="fa fa-user me-1"></i> Perfil
                                    </button>
                                </div>
                                <div class="d-flex gap-2">
                                    <button class="btn btn-light btn-sm rounded-pill px-3" onclick="viewCV('${p.email}', '${p.nombreCandidato || info.nombre}')">
                                        <i class="fa fa-file-pdf me-1"></i> Ver CV
                                    </button>
                                    <button class="btn btn-light btn-sm rounded-pill px-3" onclick="contactarCandidato('${p.email}', '${info.nombre}', '${info.foto}')">
                                        <i class="fa fa-envelope me-1"></i> Chat
                                    </button>
                                </div>
                                <button class="btn btn-outline-danger btn-sm rounded-pill px-3" onclick="updatePostStatus('${p.id}', 'Rechazado')">
                                    <i class="fa fa-times me-1"></i> Rechazar
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                candidatesList.appendChild(div);
            }
        } catch (e) {
            console.error("Error renderizando postulaciones:", e);
        }
    }

    // Acciones globales
    window.updatePostStatus = async (id, nuevoEstado) => {
        try {
            await Data.updatePostulacionEstado(id, nuevoEstado);
            await renderCandidates();
        } catch (e) {
            console.error("Error al actualizar:", e);
        }
    };

    window.viewProfile = (email) => { alert("Perfil: " + email); };

    window.viewCV = async (email, nombre) => {
        try {
            const candidate = await Data.getUserByEmail(email);
            const modalBody = document.querySelector("#modalCV .modal-body");
            document.getElementById("cvModalTitle").textContent = "CV - " + (nombre || candidate.nombre);

            if (candidate && candidate.cv && candidate.cv.url) {
                // El campo 'url' ahora contiene el string Base64 del PDF
                modalBody.innerHTML = `<iframe src="${candidate.cv.url}" width="100%" height="500px" style="border: none;"></iframe>`;
            } else if (candidate && candidate.cv && candidate.cv.data) {
                // Compatibilidad con registros antiguos que usaban .data
                modalBody.innerHTML = `<iframe src="${candidate.cv.data}" width="100%" height="500px" style="border: none;"></iframe>`;
            } else {
                modalBody.innerHTML = `
                    <div class="text-center py-5">
                        <i class="fa fa-file-circle-exclamation fa-3x text-warning mb-3"></i>
                        <p class="text-muted">El candidato no ha subido su currículum aún.</p>
                    </div>`;
            }
            
            new bootstrap.Modal(document.getElementById('modalCV')).show();
        } catch (err) {
            console.error(err);
            alert("No se pudo cargar el CV.");
        }
    };

    window.contactarCandidato = (email, nombre, foto) => {
        window.location.href = `mensajeria.html?sendto=${email}&nombre=${encodeURIComponent(nombre)}&foto=${encodeURIComponent(foto)}`;
    };

    // Eventos
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const statusMap = { "Nuevas": "Pendiente", "Revisadas": "En revisión", "Aceptadas": "Aceptado", "Rechazadas": "Rechazado" };
            const label = tab.textContent.split(' (')[0];
            activeStatus = statusMap[label] || "Pendiente";
            renderCandidates();
        });
    });

    searchInput.addEventListener("input", renderCandidates);
    filterOffer.addEventListener("change", renderCandidates);

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", async (e) => {
        e.preventDefault();
        await Auth.logout();
    });

    // Iniciar
    await loadOffersFilter();
    await renderCandidates();
});
