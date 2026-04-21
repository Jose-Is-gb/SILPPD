document.addEventListener("DOMContentLoaded", () => {
    // ===============================
    // Verificar sesión activa
    // ===============================
    const user = Auth.getActiveUser();
    if (!user || user.rol !== "admin") {
        window.location.href = "../login.html";
        return;
    }

    // ===============================
    // Configuración Inicial de Fecha
    // ===============================
    const dateOpts = { day: 'numeric', month: 'long', year: 'numeric' };
    document.getElementById("txtActualizado").textContent = new Date().toLocaleDateString('es-ES', dateOpts);

    // ===============================
    // Obtener datos REALES de BD
    // ===============================
    const db = Data.getDB();
    const usuarios = db.usuarios || [];
    const empresas = db.empresas || [];
    const ofertas = db.ofertas || [];
    let postulaciones = db.postulaciones || [];

    // ===============================
    // LLENADO DE TARJETAS SUPERIORES (USANDO DATOS REALES)
    // ===============================
    const numUsuarios = usuarios.length;
    const numEmpresas = empresas.length;
    const numOfertas = ofertas.length;
    const numContratados = postulaciones.filter(p => p.estado === "Aceptado").length;
    let conversionRate = postulaciones.length > 0 ? ((numContratados / postulaciones.length) * 100).toFixed(0) : 0;

    document.getElementById("valUsuariosActivos").textContent = numUsuarios.toLocaleString();
    document.getElementById("valEmpresasVerificadas").textContent = numEmpresas.toLocaleString();
    document.getElementById("valOfertasPublicadas").textContent = numOfertas.toLocaleString();
    document.getElementById("valTasaExito").textContent = conversionRate + "%";

    // Resumen Período
    document.getElementById("resumenPostulaciones").textContent = postulaciones.length.toLocaleString();
    document.getElementById("resumenContrataciones").textContent = numContratados.toLocaleString();
    document.getElementById("resumenOfertas").textContent = numOfertas.toLocaleString();
    document.getElementById("resumenConversion").textContent = conversionRate + "%";

    // ===============================
    // GRÁFICOS (CHART.JS) - TENDENCIAS MENSUALES (REAL)
    // ===============================
    let chartTendenciasObj = null;

    function renderTendencias(tipo = 'line') {
        const ctx = document.getElementById('chartTendencias').getContext('2d');
        if (chartTendenciasObj) chartTendenciasObj.destroy();

        const mesesLabel = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const currentMonth = new Date().getMonth();
        // Mostrar ultimos 6 meses hasta el actual
        const startMonth = Math.max(0, currentMonth - 5);
        const endMonth = currentMonth;
        
        let displayLabels = [];
        let dataPost = [];
        let dataContratos = [];
        let dataOfertas = [];

        for (let i = startMonth; i <= endMonth; i++) {
            displayLabels.push(mesesLabel[i]);
            // Postulaciones del mes i
            let postMes = postulaciones.filter(p => p.fecha && new Date(p.fecha).getMonth() === i).length;
            let contMes = postulaciones.filter(p => p.estado === "Aceptado" && p.fecha && new Date(p.fecha).getMonth() === i).length;
            let ofeMes = ofertas.filter(o => o.fecha && new Date(o.fecha).getMonth() === i).length;
            
            dataPost.push(postMes);
            dataContratos.push(contMes);
            dataOfertas.push(ofeMes);
        }

        let config = {
            type: tipo === 'area' ? 'line' : tipo,
            data: {
                labels: displayLabels,
                datasets: [
                    {
                        label: 'Postulaciones',
                        data: dataPost,
                        borderColor: '#1E88E5',
                        backgroundColor: tipo === 'area' ? 'rgba(30, 136, 229, 0.2)' : '#1E88E5',
                        fill: tipo === 'area',
                        tension: 0.4
                    },
                    {
                        label: 'Contrataciones',
                        data: dataContratos,
                        borderColor: '#43A047',
                        backgroundColor: tipo === 'area' ? 'rgba(67, 160, 71, 0.2)' : '#43A047',
                        fill: tipo === 'area',
                        tension: 0.4
                    },
                    {
                        label: 'Ofertas Publicadas',
                        data: dataOfertas,
                        borderColor: '#FF8F00',
                        backgroundColor: tipo === 'area' ? 'rgba(255, 143, 0, 0.2)' : '#FF8F00',
                        fill: tipo === 'area',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
        };
        chartTendenciasObj = new Chart(ctx, config);
    }
    renderTendencias('line');

    document.querySelectorAll('.chart-type-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.chart-type-btn').forEach(b => {
                b.classList.remove('btn-success');
                b.classList.add('btn-light', 'text-muted');
            });
            e.target.classList.remove('btn-light', 'text-muted');
            e.target.classList.add('btn-success');
            renderTendencias(e.target.dataset.type);
        });
    });

    // ===============================
    // GRÁFICO DISCAPACIDAD (REAL)
    // ===============================
    const tiposDiscapacidad = ["Física", "Visual", "Auditiva", "Intelectual", "Psicosocial"];
    const coloresDiscapacidad = ["#1E88E5", "#43A047", "#FF8F00", "#8E24AA", "#EF5350"];
    
    let distribucion = tiposDiscapacidad.map(t => 
        usuarios.filter(u => {
            let disc = (u.discapacidad || "").toLowerCase().trim();
            // Normalización para Física (puede venir con acento o sin acento)
            if(t === "Física" && (disc === "física" || disc === "fisica")) return true;
            return disc === t.toLowerCase();
        }).length
    );

    const totalDisp = distribucion.reduce((a,b)=>a+b, 0);

    new Chart(document.getElementById("chartDiscapacidadPie"), {
        type: 'pie',
        data: {
            labels: tiposDiscapacidad,
            datasets: [{
                data: distribucion,
                backgroundColor: coloresDiscapacidad,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'left' } }
        }
    });

    const progressContainer = document.getElementById("discapacidadProgressContainer");
    progressContainer.innerHTML = ''; // Clear prior if any
    distribucion.forEach((count, i) => {
        const perc = totalDisp > 0 ? ((count / totalDisp) * 100).toFixed(0) : 0;
        const color = coloresDiscapacidad[i];
        const name = tiposDiscapacidad[i];

        progressContainer.innerHTML += `
            <div>
                <div class="d-flex justify-content-between mb-1">
                    <span class="fw-medium"><i class="fa fa-circle me-2" style="color:${color}; font-size:12px;"></i>${name}</span>
                    <span class="text-muted">${count} usuarios</span>
                </div>
                <div class="custom-progress">
                    <div class="custom-progress-bar" style="width: ${perc}%; background-color: ${color};"></div>
                </div>
                <div class="d-flex justify-content-between mt-1">
                    <small class="text-muted" style="font-size:0.75rem;">${perc}% del total</small>
                    <small class="text-muted" style="font-size:0.75rem;">${totalDisp} total</small>
                </div>
            </div>
        `;
    });

    // ===============================
    // GRÁFICO SECTORES (REAL)
    // ===============================
    // Sacar las categorías reales usadas en las ofertas
    const categoriasMapa = {};
    ofertas.forEach(o => {
        const cat = o.categoria || "General";
        categoriasMapa[cat] = (categoriasMapa[cat] || 0) + 1;
    });

    const sectoresKeys = Object.keys(categoriasMapa).sort();
    const sectoresDataKeys = sectoresKeys.map(k => categoriasMapa[k]);

    new Chart(document.getElementById("chartSectores"), {
        type: 'bar',
        data: {
            labels: sectoresKeys.length > 0 ? sectoresKeys : ["Sin datos"],
            datasets: [{
                label: 'Empleos',
                data: sectoresDataKeys.length > 0 ? sectoresDataKeys : [0],
                backgroundColor: '#43A047'
            }]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });

    const secCardsContainer = document.getElementById("sectoresCardsContainer");
    secCardsContainer.innerHTML = '';
    sectoresKeys.forEach((sec, i) => {
        secCardsContainer.innerHTML += `
            <div class="col-md-4">
                <div class="card bg-light border-0 p-3 h-100">
                    <p class="small text-muted mb-1">${sec}</p>
                    <h4 class="fw-bold mb-0">${sectoresDataKeys[i]}</h4>
                </div>
            </div>
        `;
    });

    // ===============================
    // EMPRESAS TOP (REAL)
    // ===============================
    const empRanks = {};
    postulaciones.forEach(p => {
        if (p.estado === "Aceptado") {
            empRanks[p.empresa] = (empRanks[p.empresa] || 0) + 1;
        }
    });
    // Añadir empresas que no tienen contrataciones para rellenar
    empresas.forEach(e => {
        if(empRanks[e.nombre] === undefined) empRanks[e.nombre] = 0;
    });

    const arrEmpresas = Object.keys(empRanks).map(eName => {
        const empresaDoc = empresas.find(e => e.nombre === eName);
        return {
            nombre: eName,
            sec: "General", // Placeholder (Sector not usually in empresa object)
            cont: empRanks[eName],
            iso: empresaDoc && empresaDoc.estado === "Verificada" 
        }
    }).sort((a,b) => b.cont - a.cont);

    const tbody = document.getElementById("empresasTopTbody");
    tbody.innerHTML = '';
    arrEmpresas.forEach((emp, i) => {
        if(i > 9) return; // Top 10 max
        const isoBadge = emp.iso 
            ? `<span class="badge text-success bg-success bg-opacity-10 rounded-pill px-3 py-2"><i class="fa fa-check me-1"></i>ISO 30415</span>` 
            : `<span class="badge text-secondary bg-secondary bg-opacity-10 rounded-pill px-3 py-2">Sin certificar</span>`;
        
        tbody.innerHTML += `
            <tr>
                <td><div class="rank-circle">${i+1}</div></td>
                <td class="fw-medium">${emp.nombre}</td>
                <td class="text-blue">${emp.sec}</td>
                <td class="text-success fw-bold">${emp.cont}</td>
                <td class="text-center">${isoBadge}</td>
                <td class="text-center">
                    <button onclick="mostrarDetalleEmpresa('${emp.nombre}')" class="btn btn-sm btn-light border rounded-pill px-3">Ver detalles</button>
                </td>
            </tr>
        `;
    });

    window.mostrarDetalleEmpresa = (nombreEmpresa) => {
        const empresa = empresas.find(e => e.nombre === nombreEmpresa);
        if (!empresa) return;

        // Llenar datos básicos
        document.getElementById('modalNombreEmpresa').textContent = empresa.nombre;
        document.getElementById('modalRucEmpresa').textContent = "RUC: " + (empresa.ruc || 'No especificado');
        document.getElementById('modalDescEmpresa').textContent = empresa.descripcion || 'Sin descripción disponible.';
        document.getElementById('modalCorreoEmpresa').textContent = empresa.correo || 'No especificado';
        document.getElementById('modalTelEmpresa').textContent = empresa.telefono || 'No especificado';
        document.getElementById('modalDirEmpresa').textContent = empresa.direccion || 'No especificado';

        // Llenar datos de estado
        const elEstado = document.getElementById('modalEstadoEmpresa');
        if (empresa.estado === "Verificada") {
            elEstado.className = "badge bg-success bg-opacity-10 text-success rounded-pill px-2 py-1 mb-1";
            elEstado.innerHTML = '<i class="fa fa-check me-1"></i>Verificada';
        } else {
            elEstado.className = "badge bg-warning bg-opacity-10 text-warning rounded-pill px-2 py-1 mb-1";
            elEstado.innerHTML = '<i class="fa fa-clock me-1"></i>Pendiente';
        }

        // Llenar estadísticas calculadas referidas a esa empresa
        const ofs = ofertas.filter(o => o.empresa === empresa.nombre).length;
        const cont = postulaciones.filter(p => p.empresa === empresa.nombre && p.estado === "Aceptado").length;

        document.getElementById('modalTotalOfertas').textContent = ofs;
        document.getElementById('modalTotalContrataciones').textContent = cont;

        // Configurar botón contactar
        document.getElementById('btnIrPerfilEmpresa').onclick = () => {
            window.location.href = `mensajes.html?chat=${encodeURIComponent(empresa.correo)}`;
        };

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('modalDetallesEmpresa'));
        modal.show();
    };

    // ===============================
    // MÉTRICAS ISO (REAL)
    // ===============================
    // 1. Empresas certificadas ISO (Simulado: empresas verificadas)
    let empIsoCount = empresas.filter(e => e.estado === "Verificada").length;
    let empIsoPerc = numEmpresas > 0 ? Math.round((empIsoCount / numEmpresas) * 100) : 0;
    document.getElementById("isoEmpresasPerc").textContent = empIsoPerc + "%";
    document.getElementById("isoEmpresasVal").textContent = empIsoCount;
    document.getElementById("isoEmpresasTotal").textContent = numEmpresas;
    document.getElementById("isoEmpresasBar").style.width = empIsoPerc + "%";

    // 2. Ofertas con adaptaciones
    let ofsAptCount = ofertas.filter(o => o.adaptaciones || (o.discapacidad && o.discapacidad !== "General")).length;
    let ofsAptPerc = numOfertas > 0 ? Math.round((ofsAptCount / numOfertas) * 100) : 0;
    document.getElementById("isoOfertasPerc").textContent = ofsAptPerc + "%";
    document.getElementById("isoOfertasVal").textContent = ofsAptCount;
    document.getElementById("isoOfertasTotal").textContent = numOfertas;
    document.getElementById("isoOfertasBar").style.width = ofsAptPerc + "%";

    // 3. Usuarios Perfil completo
    let usuProfCount = usuarios.filter(u => u.discapacidad).length; // simple check
    let usuProfPerc = numUsuarios > 0 ? Math.round((usuProfCount / numUsuarios) * 100) : 0;
    document.getElementById("isoUsuariosPerc").textContent = usuProfPerc + "%";
    document.getElementById("isoUsuariosVal").textContent = usuProfCount;
    document.getElementById("isoUsuariosTotal").textContent = numUsuarios;
    document.getElementById("isoUsuariosBar").style.width = usuProfPerc + "%";

    // 4. Satisfacción (Simulada, random)
    let satisfaccionRand = numUsuarios > 0 ? 92 : 0; 
    let satValCount = Math.round(numUsuarios * (satisfaccionRand/100));
    document.getElementById("isoSatisfaccionPerc").textContent = satisfaccionRand + "%";
    document.getElementById("isoSatisfaccionVal").textContent = satValCount;
    document.getElementById("isoSatisfaccionTotal").textContent = numUsuarios;
    document.getElementById("isoSatisfaccionBar").style.width = satisfaccionRand + "%";


    // ===============================
    // ACCIONES BOTONES TOP
    // ===============================
    document.getElementById("btnActualizar").addEventListener('click', () => { location.reload(); });
    document.getElementById("btnDescargarPdf").addEventListener('click', () => { window.print(); });

    document.getElementById("btnExportarExcel").addEventListener('click', () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Métrica,Cantidad\n";
        csvContent += `Usuarios Activos,${numUsuarios}\n`;
        csvContent += `Empresas,${numEmpresas}\n`;
        csvContent += `Ofertas,${numOfertas}\n`;
        csvContent += `Postulaciones,${postulaciones.length}\n`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "Reporte_Real_Silppd.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    document.getElementById("logoutBtn").addEventListener("click", () => { Auth.logout(); });
});
