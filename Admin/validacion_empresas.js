
document.addEventListener("DOMContentLoaded", () => {
    if (typeof Auth !== "undefined") {
        const user = Auth.getActiveUser();
        if (!user || user.rol !== "admin") {
            window.location.href = "../login.html";
            return;
        }
    }

    let empresaSeleccionada = null;
    let filtroEstadoActual = "all";

    // ===============================
    // Helpers: sector y región desde datos
    // ===============================
    function getSector(emp) {
        if (emp.sector) return emp.sector;
        const nombre = (emp.nombre || "").toLowerCase();
        if (nombre.includes("tech") || nombre.includes("cloud") || nombre.includes("lab")) return "Tecnología";
        if (nombre.includes("pixel") || nombre.includes("art") || nombre.includes("studio")) return "Diseño y Marketing";
        if (nombre.includes("eco") || nombre.includes("market")) return "Comercio";
        if (nombre.includes("edu") || nombre.includes("learn")) return "Educación";
        return "General";
    }

    function getRegion(emp) {
        if (emp.region) return emp.region;
        if (emp.direccion) {
            const partes = emp.direccion.split(",");
            if (partes.length > 1) return partes[partes.length - 1].trim();
        }
        return "Sin región";
    }

    // ===============================
    // Cargar empresas desde BD
    // ===============================
    function cargarEmpresas() {
        const db = Data.getDB();
        return (db.empresas || []).map(e => ({
            ...e,
            sector: getSector(e),
            region: getRegion(e),
            estado: e.estado || "Pendiente",
            notas: e.notas || []
        }));
    }

    let empresas = cargarEmpresas();

    // ===============================
    // Referencias DOM
    // ===============================
    const empresasContainer = document.getElementById("empresasContainer");
    const searchInput = document.getElementById("searchEmpresa");
    const modal = new bootstrap.Modal(document.getElementById("modalEmpresa"));
    const modalNotas = new bootstrap.Modal(document.getElementById("modalNotas"));

    // ===============================
    // Actualizar contadores
    // ===============================
    function actualizarContadores() {
        document.getElementById("countTotal").textContent = empresas.length;
        document.getElementById("countPendientes").textContent = empresas.filter(e => e.estado === "Pendiente").length;
        document.getElementById("countVerificadas").textContent = empresas.filter(e => e.estado === "Verificada" || e.estado === "Aprobada").length;
        document.getElementById("countRechazadas").textContent = empresas.filter(e => e.estado === "Rechazada").length;
    }

    // ===============================
    // Renderizar tabla
    // ===============================
    function renderEmpresas(lista) {
        lista = lista || empresas;
        empresasContainer.innerHTML = "";

        // Aplicar filtro de estado
        if (filtroEstadoActual !== "all") {
            if (filtroEstadoActual === "Verificada") {
                lista = lista.filter(e => e.estado === "Verificada" || e.estado === "Aprobada");
            } else {
                lista = lista.filter(e => e.estado === filtroEstadoActual);
            }
        }

        // Aplicar búsqueda
        const query = searchInput.value.toLowerCase();
        if (query) {
            lista = lista.filter(e =>
                (e.nombre || "").toLowerCase().includes(query) ||
                (e.correo || "").toLowerCase().includes(query) ||
                (e.ruc || "").includes(query)
            );
        }

        if (lista.length === 0) {
            empresasContainer.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-5">
                        <i class="fa fa-inbox fa-2x mb-2 d-block opacity-50"></i>
                        No hay empresas que coincidan con los filtros.
                    </td>
                </tr>`;
            return;
        }

        lista.forEach(emp => {
            const info = Data.getContactInfo(emp.correo);
            
            let estadoBadge, estadoIcon;
            switch (emp.estado) {
                case "Verificada":
                case "Aprobada":
                    estadoBadge = "bg-success-subtle text-success";
                    estadoIcon = "fa-circle-check";
                    break;
                case "Rechazada":
                    estadoBadge = "bg-danger-subtle text-danger";
                    estadoIcon = "fa-circle-xmark";
                    break;
                default:
                    estadoBadge = "bg-warning-subtle text-warning";
                    estadoIcon = "fa-clock";
            }

            const notasCount = (emp.notas || []).length;
            const notasBadge = notasCount > 0 ? `<span class="badge bg-info-subtle text-info rounded-pill ms-1" title="${notasCount} nota(s)">${notasCount}</span>` : "";

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <img src="${info.foto}" class="rounded-circle" style="width:36px; height:36px; object-fit: cover;">
                        <div>
                            <span class="fw-semibold">${emp.nombre}</span>${notasBadge}
                            <br><small class="text-muted">${emp.correo || "—"}</small>
                        </div>
                    </div>
                </td>
                <td><small class="text-muted">${emp.ruc || "—"}</small></td>
                <td>${emp.representante || "—"}</td>
                <td><span class="badge bg-light text-dark border">${emp.sector}</span></td>
                <td>${emp.region}</td>
                <td>
                    <span class="badge ${estadoBadge} rounded-pill px-3 py-2">
                        <i class="fa ${estadoIcon} me-1"></i>${emp.estado === "Aprobada" ? "Verificada" : emp.estado}
                    </span>
                </td>
                <td class="text-center">
                    <button class="btn btn-action btn-outline-primary me-1" onclick="verEmpresa('${emp.nombre}')" title="Ver detalles">
                        <i class="fa fa-eye"></i>
                    </button>
                    ${emp.estado === "Pendiente" ? `
                    <button class="btn btn-action btn-outline-success me-1" onclick="aprobarRapido('${emp.nombre}')" title="Aprobar">
                        <i class="fa fa-check"></i>
                    </button>
                    <button class="btn btn-action btn-outline-danger me-1" onclick="rechazarRapido('${emp.nombre}')" title="Rechazar">
                        <i class="fa fa-times"></i>
                    </button>` : ""}
                    <button class="btn btn-action btn-outline-info me-1" onclick="verNotas('${emp.nombre}')" title="Notas">
                        <i class="fa fa-sticky-note"></i>
                    </button>
                    <button class="btn btn-action btn-outline-secondary" onclick="eliminarEmpresa('${emp.nombre}')" title="Eliminar">
                        <i class="fa fa-trash"></i>
                    </button>
                </td>
            `;
            empresasContainer.appendChild(row);
        });

        actualizarContadores();
    }

    renderEmpresas();

    // ===============================
    // Tabs de estado
    // ===============================
    document.querySelectorAll("#tabsEstado .btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll("#tabsEstado .btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            filtroEstadoActual = btn.dataset.filter;
            renderEmpresas();
        });
    });

    // Búsqueda en tiempo real
    searchInput.addEventListener("input", () => renderEmpresas());

    // Click en tarjetas de estado para filtrar
    document.getElementById("cardPendientes").addEventListener("click", () => {
        filtroEstadoActual = "Pendiente";
        actualizarTabActivo();
        renderEmpresas();
    });
    document.getElementById("cardVerificadas").addEventListener("click", () => {
        filtroEstadoActual = "Verificada";
        actualizarTabActivo();
        renderEmpresas();
    });
    document.getElementById("cardRechazadas").addEventListener("click", () => {
        filtroEstadoActual = "Rechazada";
        actualizarTabActivo();
        renderEmpresas();
    });
    document.getElementById("cardTotal").addEventListener("click", () => {
        filtroEstadoActual = "all";
        actualizarTabActivo();
        renderEmpresas();
    });

    function actualizarTabActivo() {
        document.querySelectorAll("#tabsEstado .btn").forEach(b => {
            b.classList.remove("active");
            if (b.dataset.filter === filtroEstadoActual) b.classList.add("active");
        });
    }

    // ===============================
    // Ver detalle de empresa
    // ===============================
    window.verEmpresa = function (nombre) {
        const empresa = empresas.find(e => e.nombre === nombre);
        if (!empresa) return;

        empresaSeleccionada = empresa;

        document.getElementById("modalEmpresaTitulo").innerHTML = `<i class="fa fa-building me-2"></i>${empresa.nombre}`;

        // Construir timeline
        let timelineHtml = "";
        const acciones = empresa.notas || [];
        if (acciones.length > 0) {
            timelineHtml = `<h6 class="fw-bold mt-3 mb-2"><i class="fa fa-timeline me-1"></i> Historial</h6>`;
            acciones.forEach(n => {
                const dotColor = n.tipo === "aprobada" ? "bg-success" : n.tipo === "rechazada" ? "bg-danger" : "bg-info";
                timelineHtml += `
                    <div class="timeline-item">
                        <div class="timeline-dot ${dotColor}"></div>
                        <small class="text-muted">${n.fecha}</small>
                        <p class="mb-0 small">${n.texto}</p>
                    </div>`;
            });
        }

        document.getElementById("modalEmpresaContenido").innerHTML = `
            <div class="row g-3">
                <div class="col-md-6">
                    <div class="p-3 rounded-3 bg-light">
                        <small class="text-muted d-block">RUC</small>
                        <span class="fw-semibold">${empresa.ruc || "No registrado"}</span>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="p-3 rounded-3 bg-light">
                        <small class="text-muted d-block">Correo</small>
                        <span class="fw-semibold">${empresa.correo || "—"}</span>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="p-3 rounded-3 bg-light">
                        <small class="text-muted d-block">Teléfono</small>
                        <span class="fw-semibold">${empresa.telefono || "—"}</span>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="p-3 rounded-3 bg-light">
                        <small class="text-muted d-block">Representante</small>
                        <span class="fw-semibold">${empresa.representante || "—"}</span>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="p-3 rounded-3 bg-light">
                        <small class="text-muted d-block">Sector</small>
                        <span class="badge bg-primary bg-opacity-10 text-primary">${empresa.sector}</span>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="p-3 rounded-3 bg-light">
                        <small class="text-muted d-block">Región</small>
                        <span class="fw-semibold">${empresa.region}</span>
                    </div>
                </div>
                <div class="col-12">
                    <div class="p-3 rounded-3 bg-light">
                        <small class="text-muted d-block">Dirección</small>
                        <span class="fw-semibold">${empresa.direccion || "—"}</span>
                    </div>
                </div>
                <div class="col-12">
                    <div class="p-3 rounded-3 bg-light">
                        <small class="text-muted d-block">Descripción</small>
                        <span>${empresa.descripcion || "Sin descripción"}</span>
                    </div>
                </div>
                <div class="col-12">
                    <div class="p-3 rounded-3 bg-light d-flex align-items-center justify-content-between">
                        <div>
                            <small class="text-muted d-block">Estado actual</small>
                            <span class="fw-bold fs-5 ${empresa.estado === "Verificada" || empresa.estado === "Aprobada" ? "text-success" : empresa.estado === "Rechazada" ? "text-danger" : "text-warning"}">${empresa.estado === "Aprobada" ? "Verificada" : empresa.estado}</span>
                        </div>
                        <small class="text-muted">Registrada: ${empresa.fechaRegistro || "—"}</small>
                    </div>
                </div>
            </div>
            ${timelineHtml}
        `;

        modal.show();
    };

    // ===============================
    // Aprobar / Rechazar desde modal
    // ===============================
    document.getElementById("btnAprobarModal").addEventListener("click", () => {
        if (empresaSeleccionada) aprobarEmpresa(empresaSeleccionada.nombre);
    });

    document.getElementById("btnRechazarModal").addEventListener("click", () => {
        if (empresaSeleccionada) rechazarEmpresa(empresaSeleccionada.nombre);
    });

    // Contactar desde modal
    document.getElementById("btnContactarModal").addEventListener("click", () => {
        if (empresaSeleccionada && empresaSeleccionada.correo) {
            window.location.href = `mensajes.html?chat=${encodeURIComponent(empresaSeleccionada.correo)}`;
        } else {
            alert("Esta empresa no tiene correo registrado.");
        }
    });

    // ===============================
    // Aprobar empresa
    // ===============================
    window.aprobarEmpresa = function (nombre) {
        cambiarEstado(nombre, "Verificada", "aprobada", "Empresa aprobada por el administrador.");
    };

    window.aprobarRapido = function (nombre) {
        if (!confirm(`¿Aprobar la empresa "${nombre}"?`)) return;
        cambiarEstado(nombre, "Verificada", "aprobada", "Aprobación rápida desde la tabla.");
    };

    // ===============================
    // Rechazar empresa
    // ===============================
    window.rechazarEmpresa = function (nombre) {
        const motivo = prompt("Motivo del rechazo (opcional):");
        cambiarEstado(nombre, "Rechazada", "rechazada", motivo ? `Rechazada: ${motivo}` : "Empresa rechazada por el administrador.");
    };

    window.rechazarRapido = function (nombre) {
        const motivo = prompt(`Motivo del rechazo para "${nombre}" (opcional):`);
        if (motivo === null) return; // Canceló
        cambiarEstado(nombre, "Rechazada", "rechazada", motivo ? `Rechazada: ${motivo}` : "Rechazo rápido desde la tabla.");
    };

    // ===============================
    // Función central de cambio estado
    // ===============================
    function cambiarEstado(nombre, nuevoEstado, tipoNota, textoNota) {
        const db = Data.getDB();
        const reg = db.empresas.find(e => e.nombre === nombre);
        if (!reg) return;

        reg.estado = nuevoEstado;

        // Agregar nota de historial
        reg.notas = reg.notas || [];
        reg.notas.push({
            tipo: tipoNota,
            texto: textoNota,
            fecha: new Date().toLocaleString("es-PE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
        });

        Data.saveDB(db);
        empresas = cargarEmpresas();
        renderEmpresas();
        modal.hide();

        // Notificación visual
        const toast = document.createElement("div");
        toast.className = `alert alert-${nuevoEstado === "Verificada" ? "success" : "danger"} alert-dismissible fade show position-fixed shadow`;
        toast.style.cssText = "top:20px;right:20px;z-index:9999;min-width:300px;";
        toast.innerHTML = `
            <i class="fa ${nuevoEstado === "Verificada" ? "fa-check-circle" : "fa-times-circle"} me-2"></i>
            <strong>${nombre}</strong> — ${nuevoEstado === "Verificada" ? "Aprobada" : "Rechazada"}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // ===============================
    // Eliminar empresa
    // ===============================
    window.eliminarEmpresa = function (nombre) {
        if (!confirm(`¿Eliminar la empresa "${nombre}"? Esta acción no se puede deshacer.`)) return;

        const db = Data.getDB();
        db.empresas = db.empresas.filter(e => e.nombre !== nombre);
        Data.saveDB(db);

        empresas = cargarEmpresas();
        renderEmpresas();

        const toast = document.createElement("div");
        toast.className = "alert alert-secondary alert-dismissible fade show position-fixed shadow";
        toast.style.cssText = "top:20px;right:20px;z-index:9999;min-width:300px;";
        toast.innerHTML = `<i class="fa fa-trash me-2"></i>Empresa <strong>${nombre}</strong> eliminada.<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };

    // ===============================
    // Notas de verificación
    // ===============================
    window.verNotas = function (nombre) {
        const empresa = empresas.find(e => e.nombre === nombre);
        if (!empresa) return;

        empresaSeleccionada = empresa;

        // Renderizar notas existentes
        const listaNotas = document.getElementById("listaNotas");
        const notas = empresa.notas || [];
        if (notas.length === 0) {
            listaNotas.innerHTML = '<p class="text-muted small text-center">No hay notas registradas.</p>';
        } else {
            listaNotas.innerHTML = notas.map(n => `
                <div class="note-card">
                    <div class="d-flex justify-content-between">
                        <span class="fw-semibold">${n.tipo === "aprobada" ? "✅" : n.tipo === "rechazada" ? "❌" : "📝"} ${n.texto}</span>
                    </div>
                    <div class="note-date mt-1">${n.fecha}</div>
                </div>
            `).join("");
        }

        document.getElementById("notaTexto").value = "";
        modalNotas.show();
    };

    document.getElementById("btnGuardarNota").addEventListener("click", () => {
        if (!empresaSeleccionada) return;
        const texto = document.getElementById("notaTexto").value.trim();
        if (!texto) return alert("Escribe una nota primero.");

        const db = Data.getDB();
        const reg = db.empresas.find(e => e.nombre === empresaSeleccionada.nombre);
        if (!reg) return;

        reg.notas = reg.notas || [];
        reg.notas.push({
            tipo: "nota",
            texto: texto,
            fecha: new Date().toLocaleString("es-PE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
        });

        Data.saveDB(db);
        empresas = cargarEmpresas();
        renderEmpresas();

        // Refrescar lista de notas
        verNotas(empresaSeleccionada.nombre);
        document.getElementById("notaTexto").value = "";
    });

    // ===============================
    // Logout
    // ===============================
    document.getElementById("logoutBtn").addEventListener("click", () => {
        Auth.logout();
    });
});
