document.addEventListener("DOMContentLoaded", async () => {
    // RBAC: Solo usuarios con rol 'empresa' pueden acceder
    const user = await Auth.requireRole("empresa", "../login.html");
    if (!user) return;

    // 2. Elementos del DOM
    const welcomeMsg = document.getElementById("welcomeMsg");
    const countOfertas = document.getElementById("countOfertas");
    const countPostulaciones = document.getElementById("countPostulaciones");
    const countContratados = document.getElementById("countContratados");
    const recentOffersList = document.getElementById("recentOffersList");

    // 3. Cargar Datos
    welcomeMsg.textContent = `Bienvenido, ${user.nombre}`;

    async function loadDashboard() {
        try {
            const todasLasOfertas = await Data.getOfertas();
            const ofertas = todasLasOfertas.filter(o => o.empresa === user.nombre || o.empresa === user.razonSocial);
            const allPostulaciones = await Data.getPostulaciones();
            
            // Vincular postulaciones con las ofertas de esta empresa
            const misPostulaciones = allPostulaciones.filter(p => {
                return ofertas.some(o => String(o.id) === String(p.idOferta));
            });

            // Actualizar contadores
            countOfertas.textContent = `${ofertas.length} publicadas`;
            countPostulaciones.textContent = `${misPostulaciones.length} nuevas`;
            
            // Contratados (Filtrando por estado 'Aceptado' o similar en Firestore)
            const contratados = misPostulaciones.filter(p => p.estado === "Aceptado").length;
            countContratados.textContent = `${contratados} este mes`;

            // Renderizar ofertas recientes (últimas 3)
            const recientes = [...ofertas].reverse().slice(0, 3);
            
            if (recientes.length === 0) {
                recentOffersList.innerHTML = Security.sanitizeHTML(`
                    <div class="col-12 text-center py-5">
                        <p class="text-muted">No has publicado ofertas recientemente.</p>
                    </div>
                `);
                return;
            }

            recentOffersList.innerHTML = recientes.map(o => `
                <div class="col-12">
                    <div class="card border-0 shadow-sm rounded-4 p-4 recent-offer-card transition-all">
                        <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
                            <div>
                                <h5 class="fw-bold mb-1">${o.titulo}</h5>
                                <p class="text-secondary small mb-0">
                                    Modalidad: ${o.modalidad} • Publicado: ${o.fecha}
                                </p>
                            </div>
                            <div class="d-flex gap-2">
                                 <span class="badge bg-blue-light text-blue rounded-pill px-3 py-2">${o.categoria}</span>
                                 <span class="badge bg-green-light text-green rounded-pill px-3 py-2">${o.estado}</span>
                            </div>
                            <a href="gestion_ofertas.html?id=${o.id}" class="btn btn-outline-orange rounded-pill px-4">Ver detalles</a>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (e) {
            console.error("Error cargando dashboard empresa:", e);
        }
    }

    await loadDashboard();

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", async (e) => {
        e.preventDefault();
        await Auth.logout();
    });
});
