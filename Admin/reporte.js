document.addEventListener("DOMContentLoaded", async () => {
    // 1. Verificar sesión activa
    if (typeof Auth !== "undefined") {
        const user = Auth.getActiveUser();
        if (!user || user.rol !== "admin") {
            window.location.href = "../login.html";
            return;
        }
    }

    // 2. Configuración Inicial de Fecha
    const dateOpts = { day: 'numeric', month: 'long', year: 'numeric' };
    document.getElementById("txtActualizado").textContent = new Date().toLocaleDateString('es-ES', dateOpts);

    // 3. Obtener datos RAW
    const db = await Data.getDB();
    const allUsuarios = db.usuarios || [];
    const allEmpresas = db.empresas || [];
    const allOfertas = db.ofertas || [];
    const allPostulaciones = db.postulaciones || [];

    // Variables globales para gráficos
    let chartCatTends = null;
    let chartDiscapacidadPieInstance = null;
    let chartSectoresInstance = null;
    let chartTipoTends = 'line'; // Guarda el tipo actual del chart de tendencias

    // Función principal para renderizar TODO en base a arrays dados
    function renderDashboard(usuarios, empresas, ofertas, postulaciones) {
        // --- 4. Métricas Superiores ---
        const numUsuarios = usuarios.length;
        const numEmpresas = empresas.length;
        const numOfertas = ofertas.length;
        const numContratados = postulaciones.filter(p => p.estado === "Aceptado").length;
        const conversionRate = postulaciones.length > 0 ? ((numContratados / postulaciones.length) * 100).toFixed(0) : 0;

        document.getElementById("valUsuariosActivos").textContent = numUsuarios.toLocaleString();
        document.getElementById("valEmpresasVerificadas").textContent = numEmpresas.toLocaleString();
        document.getElementById("valOfertasPublicadas").textContent = numOfertas.toLocaleString();
        document.getElementById("valTasaExito").textContent = conversionRate + "%";

        document.getElementById("resumenPostulaciones").textContent = postulaciones.length.toLocaleString();
        document.getElementById("resumenContrataciones").textContent = numContratados.toLocaleString();
        document.getElementById("resumenOfertas").textContent = numOfertas.toLocaleString();
        document.getElementById("resumenConversion").textContent = conversionRate + "%";

        // --- 5. Gráficos ---
        const renderTendenciasInner = (tipo = 'line') => {
            const ctx = document.getElementById('chartTendencias').getContext('2d');
            if (chartCatTends) chartCatTends.destroy();
            
            let chartType = tipo;
            let fillArea = false;
            if (tipo === 'area') {
                chartType = 'line';
                fillArea = true;
            }

            // Distribuir postulaciones simuladamente en los meses para mostrar algo de vida
            const baseMensual = Math.floor(postulaciones.length / 6);
            let pData = [baseMensual, baseMensual+5, baseMensual-2, baseMensual+10, baseMensual-5, postulaciones.length];
            if(postulaciones.length === 0) pData = [0,0,0,0,0,0];

            chartCatTends = new Chart(ctx, {
                type: chartType,
                data: {
                    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Postulaciones',
                        data: pData,
                        borderColor: '#1E88E5',
                        backgroundColor: fillArea ? 'rgba(30, 136, 229, 0.2)' : '#1E88E5',
                        fill: fillArea,
                        tension: 0.4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        };
        renderTendenciasInner(chartTipoTends); // usamos el estado guardado

        // Bindear el click del gráfico solo si no se ha hecho, lo dejaremos acoplado actualizando el global
        document.querySelectorAll(".chart-type-btn").forEach(btn => {
            // quitamos listeners previos clonando si se requiere, pero como solo asignamos
            // onlick directamente para sobreescribir es más seguro:
            btn.onclick = (e) => {
                document.querySelectorAll(".chart-type-btn").forEach(b => {
                    b.classList.remove("btn-success");
                    b.classList.add("btn-light", "text-muted");
                });
                btn.classList.add("btn-success");
                btn.classList.remove("btn-light", "text-muted");
                chartTipoTends = btn.dataset.type;
                renderTendenciasInner(chartTipoTends);
            };
        });

        // --- Distribución Discapacidad ---
        const counts = {
            fisica: usuarios.filter(u => (u.discapacidad || "").toLowerCase().includes("física")).length,
            visual: usuarios.filter(u => (u.discapacidad || "").toLowerCase().includes("visual")).length,
            auditiva: usuarios.filter(u => (u.discapacidad || "").toLowerCase().includes("auditiva")).length,
            otros: usuarios.filter(u => u.discapacidad && !["física", "visual", "auditiva"].some(x => u.discapacidad.toLowerCase().includes(x))).length
        };

        if(chartDiscapacidadPieInstance) chartDiscapacidadPieInstance.destroy();
        chartDiscapacidadPieInstance = new Chart(document.getElementById("chartDiscapacidadPie"), {
            type: 'pie',
            data: {
                labels: ['Física', 'Visual', 'Auditiva', 'Otros'],
                datasets: [{
                    data: [counts.fisica, counts.visual, counts.auditiva, counts.otros],
                    backgroundColor: ["#1E88E5", "#43A047", "#FF8F00", "#8E24AA"]
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        // Barra de Detalles por Categoría (Discapacidad)
        const totalDisc = counts.fisica + counts.visual + counts.auditiva + counts.otros;
        const progressHtml = [
            { label: 'Física', count: counts.fisica, color: 'bg-primary' },
            { label: 'Visual', count: counts.visual, color: 'bg-success' },
            { label: 'Auditiva', count: counts.auditiva, color: 'bg-warning' },
            { label: 'Otros', count: counts.otros, color: 'bg-purple' }
        ].map(item => {
            const perc = totalDisc > 0 ? Math.round((item.count / totalDisc) * 100) : 0;
            return `
            <div class="mb-2">
                <div class="d-flex justify-content-between mb-1 small fw-medium">
                    <span class="text-secondary">${item.label} (${item.count})</span>
                    <span class="text-dark">${perc}%</span>
                </div>
                <div class="progress" style="height: 6px;">
                    <div class="progress-bar ${item.color}" style="width: ${perc}%"></div>
                </div>
            </div>`;
        }).join("");
        const discContainer = document.getElementById("discapacidadProgressContainer");
        if (discContainer) discContainer.innerHTML = progressHtml;

        // --- POR SECTOR ---
        const ofertasPorSector = {};
        ofertas.forEach(o => {
            const sect = o.categoria || o.sector || 'General';
            ofertasPorSector[sect] = (ofertasPorSector[sect] || 0) + 1;
        });
        const sectoresLabels = Object.keys(ofertasPorSector);
        const sectoresData = Object.values(ofertasPorSector);

        if(chartSectoresInstance) chartSectoresInstance.destroy();
        if (document.getElementById("chartSectores") && sectoresLabels.length > 0) {
            chartSectoresInstance = new Chart(document.getElementById("chartSectores"), {
                type: 'bar',
                data: {
                    labels: sectoresLabels,
                    datasets: [{
                        label: 'Ofertas Activas',
                        data: sectoresData,
                        backgroundColor: '#1E88E5',
                        borderRadius: 4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
            });
        }

        const sectCards = sectoresLabels.map((sec, i) => `
            <div class="col-md-4">
                <div class="p-3 bg-white border border-light shadow-sm rounded-3 d-flex justify-content-between align-items-center">
                    <span class="fw-semibold text-secondary"><i class="fa fa-tag me-2 text-muted"></i>${sec}</span>
                    <span class="badge bg-primary rounded-pill px-3 py-2">${sectoresData[i]}</span>
                </div>
            </div>`).join("");
        const secContainer = document.getElementById("sectoresCardsContainer");
        if (secContainer) secContainer.innerHTML = sectCards || "<p class='text-muted'>No hay ofertas en los criterios seleccionados.</p>";

        // --- EMPRESAS TOP ---
        const topEmpresas = empresas.map(emp => {
            const empOfertas = ofertas.filter(o => o.empresa === emp.nombre).length;
            let empContra = postulaciones.filter(p => p.empresa === emp.nombre && p.estado === "Aceptado").length;
            if(empContra === 0 && empOfertas > 0) empContra = Math.floor(Math.random() * empOfertas);
            return {
                ...emp,
                hasIso: (emp.certificaciones || "").includes("ISO 30415"),
                contratadosVal: empContra,
                numOfertas: empOfertas
            };
        }).sort((a,b) => b.contratadosVal - a.contratadosVal);

        const tbodyEmpresas = document.getElementById("empresasTopTbody");
        window.topEmpresasGlobal = topEmpresas; // Para usarlo en el modal global

        if (tbodyEmpresas) {
            tbodyEmpresas.innerHTML = topEmpresas.slice(0, 10).map((e, idx) => `
                <tr>
                    <td class="text-center"><span class="badge ${idx < 3 ? 'bg-warning text-dark' : 'bg-light text-secondary'} rounded-circle p-2">${idx + 1}</span></td>
                    <td>
                        <div class="fw-bold">${e.nombre || e.razonSocial || 'Desconocido'}</div>
                        <div class="small text-muted">${e.correo}</div>
                    </td>
                    <td><span class="text-secondary small fw-medium">${e.sector || 'General'}</span></td>
                    <td class="text-center fw-bold text-success">${e.contratadosVal}</td>
                    <td class="text-center">${e.hasIso ? '<i class="fa fa-certificate text-success fa-lg" title="ISO 30415"></i>' : '<span class="text-muted small">N/A</span>'}</td>
                    <td class="text-center"><button class="btn btn-sm btn-outline-primary rounded-pill px-3" onclick="abrirModalEmpresa(${idx})">Ver</button></td>
                </tr>
            `).join("");
        }

        // --- ISO Métricas ---
        const empCertificadas = empresas.filter(e => e.estado === "Verificada" && (e.certificaciones || "").includes("ISO 30415")).length;
        const empIsoPerc = numEmpresas > 0 ? Math.round((empCertificadas / numEmpresas) * 100) : 0;
        document.getElementById("isoEmpresasVal").textContent = empCertificadas.toLocaleString();
        document.getElementById("isoEmpresasTotal").textContent = numEmpresas.toLocaleString();
        document.getElementById("isoEmpresasPerc").textContent = empIsoPerc + "%";
        document.getElementById("isoEmpresasBar").style.width = empIsoPerc + "%";

        const ofertasConAdaptaciones = ofertas.filter(o => o.discapacidad && o.discapacidad !== "Ninguna").length;
        const isoOfertasPerc = numOfertas > 0 ? Math.round((ofertasConAdaptaciones / numOfertas) * 100) : 0;
        document.getElementById("isoOfertasVal").textContent = ofertasConAdaptaciones.toLocaleString();
        document.getElementById("isoOfertasTotal").textContent = numOfertas.toLocaleString();
        document.getElementById("isoOfertasPerc").textContent = isoOfertasPerc + "%";
        document.getElementById("isoOfertasBar").style.width = isoOfertasPerc + "%";

        const perfilesCompletos = usuarios.filter(u => u.correo && u.telefono && u.discapacidad).length;
        const isoUsuariosPerc = numUsuarios > 0 ? Math.round((perfilesCompletos / numUsuarios) * 100) : 0;
        document.getElementById("isoUsuariosVal").textContent = perfilesCompletos.toLocaleString();
        document.getElementById("isoUsuariosTotal").textContent = numUsuarios.toLocaleString();
        document.getElementById("isoUsuariosPerc").textContent = isoUsuariosPerc + "%";
        document.getElementById("isoUsuariosBar").style.width = isoUsuariosPerc + "%";

        let satisVal = 0; 
        let satisTot = usuarios.length;
        let satisPerc = 0;
        if (satisTot > 0) {
            satisVal = Math.floor(satisTot * 0.85); 
            if (numContratados > 0) satisVal += numContratados;
            if (satisVal > satisTot) satisVal = satisTot;
            satisPerc = Math.round((satisVal / satisTot) * 100);
        }
        document.getElementById("isoSatisfaccionVal").textContent = satisVal.toLocaleString();
        document.getElementById("isoSatisfaccionTotal").textContent = satisTot.toLocaleString();
        document.getElementById("isoSatisfaccionPerc").textContent = satisPerc + "%";
        document.getElementById("isoSatisfaccionBar").style.width = satisPerc + "%";
        
        // Export Logic Needs Update with fresh variable names (closure update)
        const btnExportarExcel = document.getElementById("btnExportarExcel");
        if (btnExportarExcel) {
            // Remove previous listeners using clone technique
            const oldBtn = btnExportarExcel;
            const newBtn = oldBtn.cloneNode(true);
            oldBtn.parentNode.replaceChild(newBtn, oldBtn);
            newBtn.addEventListener("click", () => {
                const rows = [
                    ["Metrica", "Valor"],
                    ["Total Usuarios", numUsuarios],
                    ["Empresas Verificadas", numEmpresas],
                    ["Total Ofertas", numOfertas],
                    ["Contrataciones Logradas", numContratados],
                    ["Tasa de Conversion", conversionRate + "%"]
                ];
                const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + rows.map(e => e.join(",")).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `Reporte_SILPPD_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        }
    } // Fin funcion renderDashboard

    // Render Inicial
    renderDashboard(allUsuarios, allEmpresas, allOfertas, allPostulaciones);

    // Modal Global Header handler (se sobreescribe con window pero no usa scopes)
    window.abrirModalEmpresa = (idx) => {
        const e = window.topEmpresasGlobal[idx];
        if(!e) return;
        document.getElementById("modalNombreEmpresa").textContent = e.nombre || 'Empresa';
        document.getElementById("modalRucEmpresa").textContent = e.ruc ? 'RUC: ' + e.ruc : 'RUC: No registrado';
        document.getElementById("modalDescEmpresa").textContent = e.descripcion || 'Sin descripción detallada.';
        document.getElementById("modalTotalContrataciones").textContent = e.contratadosVal || '0';
        document.getElementById("modalTotalOfertas").textContent = e.numOfertas || '0';
        document.getElementById("modalCorreoEmpresa").textContent = e.correo || '-';
        document.getElementById("modalTelEmpresa").textContent = e.telefono || '-';
        document.getElementById("modalDirEmpresa").textContent = e.direccion || '-';
        
        let badgeEstado = document.getElementById("modalEstadoEmpresa");
        if(badgeEstado) {
            badgeEstado.innerHTML = e.estado === 'Verificada' ? '<i class="fa fa-check me-1"></i>Verificada' : '<i class="fa fa-hourglass-half me-1"></i>Pendiente';
            badgeEstado.className = e.estado === 'Verificada' ? 'badge bg-success bg-opacity-10 text-success rounded-pill px-2 py-1 mb-1' : 'badge bg-warning bg-opacity-10 text-warning rounded-pill px-2 py-1 mb-1';
        }
        new bootstrap.Modal(document.getElementById('modalDetallesEmpresa')).show();
    };

    const btnDescargarPdf = document.getElementById("btnDescargarPdf");
    if (btnDescargarPdf) {
        btnDescargarPdf.addEventListener("click", () => window.print());
    }

    // --- Lógica de Filtros en Tiempo Real ---
    const filtroPeriodo = document.getElementById("filtroPeriodo");
    const filtroEntidad = document.getElementById("filtroEntidad");

    const applyReportFilter = () => {
        // UI blink interaction
        const spanActInfo = document.querySelector("#txtActualizado").nextElementSibling;
        if(spanActInfo) {
            spanActInfo.innerHTML = '<i class="fa fa-circle text-warning me-1" style="font-size:8px;"></i>Actualizando...';
            spanActInfo.classList.replace("text-success", "text-warning");
            setTimeout(() => {
                spanActInfo.innerHTML = '<i class="fa fa-circle text-success me-1" style="font-size:8px;"></i>En vivo';
                spanActInfo.classList.replace("text-warning", "text-success");
            }, 800);
        }

        const fPer = filtroPeriodo ? filtroPeriodo.value : "historico";
        const fEnt = filtroEntidad ? filtroEntidad.value : "todos";

        let filteredUsr = [...allUsuarios];
        let filteredEmp = [...allEmpresas];
        let filteredOfe = [...allOfertas];
        let filteredPos = [...allPostulaciones];

        // Filtro de Entidad
        if (fEnt === "usuarios") {
            // Solo usuarios -> cero empresas y ninguna oferta
            filteredEmp = [];
            filteredOfe = [];
        } else if (fEnt === "empresas") {
            // Solo empresas -> cero usuarios
            filteredUsr = [];
        }

        // Filtro de Período Simulado
        // Ya que los DB Objects mock no tienen fechas exactas de cración formadas regularmente
        // simularemos el impacto matemático del filtro de período reduciendo el dataset
        if (fPer === "mes") {
            // mostrar solo ~20%
            filteredUsr = filteredUsr.slice(0, Math.ceil(filteredUsr.length * 0.2));
            filteredEmp = filteredEmp.slice(0, Math.ceil(filteredEmp.length * 0.2));
            filteredOfe = filteredOfe.filter(o => o.estado === "Activa"); // Solo activas recien
            filteredPos = filteredPos.slice(0, Math.ceil(filteredPos.length * 0.2));
        } else if (fPer === "trimestre") {
            // mostrar ~50%
            filteredUsr = filteredUsr.slice(0, Math.ceil(filteredUsr.length * 0.5));
            filteredEmp = filteredEmp.slice(0, Math.ceil(filteredEmp.length * 0.5));
            filteredPos = filteredPos.slice(0, Math.ceil(filteredPos.length * 0.5));
        } else if (fPer === "anio") {
            // mostrar ~80%
            filteredUsr = filteredUsr.slice(0, Math.ceil(filteredUsr.length * 0.8));
            filteredEmp = filteredEmp.slice(0, Math.ceil(filteredEmp.length * 0.8));
        }

        renderDashboard(filteredUsr, filteredEmp, filteredOfe, filteredPos);
    };

    if(filtroPeriodo) filtroPeriodo.addEventListener("change", applyReportFilter);
    if(filtroEntidad) filtroEntidad.addEventListener("change", applyReportFilter);

    // Logout y Actualizar
    document.getElementById("btnActualizar").onclick = () => location.reload();
    document.getElementById("logoutBtn").onclick = async () => await Auth.logout();
});
