document.addEventListener("DOMContentLoaded", async () => {
    // 1. Verificación
    if (typeof Auth !== "undefined") {
        const user = Auth.getActiveUser();
        if (!user || user.rol !== "admin") {
            window.location.href = "../login.html";
            return;
        }
    }

    // 2. Variables y Estado
    let empresas = [];
    let empresaSeleccionada = null;
    let filtroEstadoActual = "all";

    const empresasContainer = document.getElementById("empresasContainer");
    const searchInput = document.getElementById("searchEmpresa");
    const modalDetalle = new bootstrap.Modal(document.getElementById("modalEmpresa"));
    const modalNotas = new bootstrap.Modal(document.getElementById("modalNotas"));

    // Helpers
    const getBadgeStyle = (estado) => {
        if (estado === "Verificada" || estado === "Aprobada") return "bg-success-subtle text-success";
        if (estado === "Rechazada") return "bg-danger-subtle text-danger";
        return "bg-warning-subtle text-warning";
    };

    // 3. Carga y Render (Asíncrono)
    async function reloadData() {
        const db = await Data.getDB();
        empresas = (db.empresas || []).map(e => ({
            ...e,
            estado: e.estado || "Pendiente",
            notas: e.notas || []
        }));
        render();
    }

    function render() {
        let list = empresas;
        const query = searchInput.value.toLowerCase();

        if (filtroEstadoActual !== "all") {
            if (filtroEstadoActual === "Verificada") {
                list = list.filter(e => e.estado === "Verificada" || e.estado === "Aprobada");
            } else {
                list = list.filter(e => e.estado === filtroEstadoActual);
            }
        }

        if (query) {
            list = list.filter(e => 
                (e.nombre || "").toLowerCase().includes(query) || 
                (e.correo || "").toLowerCase().includes(query) ||
                (e.ruc || "").includes(query)
            );
        }

        empresasContainer.innerHTML = "";
        if (list.length === 0) {
            empresasContainer.innerHTML = `<tr><td colspan="7" class="text-center py-5 text-muted">No se encontraron empresas.</td></tr>`;
        } else {
            list.forEach(emp => {
                const info = Data.getContactInfo(emp.correo);
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <img src="${info.foto}" class="rounded-circle" style="width:36px; height:36px; object-fit: cover; border:1px solid #eee;">
                            <div><span class="fw-medium">${emp.nombre}</span><br><small class="text-muted">${emp.correo}</small></div>
                        </div>
                    </td>
                    <td><small>${emp.ruc || "—"}</small></td>
                    <td>${emp.representante || "—"}</td>
                    <td><span class="badge bg-light text-dark border fw-normal">${emp.sector || "General"}</span></td>
                    <td><small>${emp.region || "—"}</small></td>
                    <td><span class="badge ${getBadgeStyle(emp.estado)} rounded-pill">${emp.estado}</span></td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary border-0" onclick="verEmpresa('${emp.correo}')"><i class="fa fa-eye"></i></button>
                        <button class="btn btn-sm btn-outline-info border-0" onclick="verNotas('${emp.correo}')"><i class="fa fa-sticky-note"></i></button>
                        <button class="btn btn-sm btn-outline-danger border-0" onclick="eliminarEmpresa('${emp.correo}')"><i class="fa fa-trash"></i></button>
                    </td>
                `;
                empresasContainer.appendChild(tr);
            });
        }

        // Contadores
        document.getElementById("countTotal").textContent = empresas.length;
        document.getElementById("countPendientes").textContent = empresas.filter(e => e.estado === "Pendiente").length;
        document.getElementById("countVerificadas").textContent = empresas.filter(e => e.estado === "Verificada" || e.estado === "Aprobada").length;
        document.getElementById("countRechazadas").textContent = empresas.filter(e => e.estado === "Rechazada").length;
    }

    // 4. Acciones Globales
    window.verEmpresa = (correo) => {
        empresaSeleccionada = empresas.find(e => e.correo === correo);
        if (!empresaSeleccionada) return;

        document.getElementById("modalEmpresaTitulo").textContent = empresaSeleccionada.nombre;
        document.getElementById("modalEmpresaContenido").innerHTML = `
            <div class="row g-3">
                <div class="col-md-6"><label class="text-muted small">RUC</label><div>${empresaSeleccionada.ruc || "—"}</div></div>
                <div class="col-md-6"><label class="text-muted small">Representante</label><div>${empresaSeleccionada.representante || "—"}</div></div>
                <div class="col-md-6"><label class="text-muted small">Correo</label><div>${empresaSeleccionada.correo}</div></div>
                <div class="col-md-6"><label class="text-muted small">Teléfono</label><div>${empresaSeleccionada.telefono || "—"}</div></div>
                <div class="col-12"><label class="text-muted small">Ubicación</label><div>${empresaSeleccionada.direccion || "—"}</div></div>
                <div class="col-12"><label class="text-muted small">Descripción</label><div>${empresaSeleccionada.descripcion || "Sin descripción"}</div></div>
                <div class="col-12 mt-3 p-2 bg-light rounded text-center">
                    Estado Actual: <span class="fw-bold ${empresaSeleccionada.estado === 'Verificada' ? 'text-success' : 'text-warning'}">${empresaSeleccionada.estado}</span>
                </div>
            </div>`;
        modalDetalle.show();
    };

    window.verNotas = (correo) => {
        empresaSeleccionada = empresas.find(e => e.correo === correo);
        if (!empresaSeleccionada) return;

        const lista = document.getElementById("listaNotas");
        lista.innerHTML = (empresaSeleccionada.notas || []).map(n => `
            <div class="p-2 mb-2 bg-light rounded border-start border-4 border-info">
                <div class="small fw-bold">${n.fecha}</div>
                <div class="small">${n.texto}</div>
            </div>`).join("") || '<p class="text-muted small text-center">Sin notas.</p>';
        
        modalNotas.show();
    };

    window.eliminarEmpresa = async (correo) => {
        if (!confirm("¿Eliminar esta empresa definitivamente?")) return;
        await Data.deleteUser(correo);
        await reloadData();
        alert("🗑️ Registro eliminado.");
    };

    // 5. Gestión de Estado
    const updateEstado = async (nuevo) => {
        if (!empresaSeleccionada) return;
        const nota = {
            tipo: nuevo === "Verificada" ? "aprobada" : "rechazada",
            texto: nuevo === "Verificada" ? "Empresa verificada por administración." : prompt("Motivo del rechazo:") || "Empresa rechazada.",
            fecha: new Date().toLocaleString()
        };

        const nuevasNotas = [...(empresaSeleccionada.notas || []), nota];
        await Data.updateUser(empresaSeleccionada.correo, { estado: nuevo, notas: nuevasNotas });
        await reloadData();
        modalDetalle.hide();
        alert(`✓ Estado actualizado a ${nuevo}`);
    };

    document.getElementById("btnAprobarModal").onclick = () => updateEstado("Verificada");
    document.getElementById("btnRechazarModal").onclick = () => updateEstado("Rechazada");
    document.getElementById("btnContactarModal").onclick = () => {
        if (empresaSeleccionada) window.location.href = `mensajes.html?chat=${empresaSeleccionada.correo}`;
    };

    document.getElementById("btnGuardarNota").onclick = async () => {
        const txt = document.getElementById("notaTexto").value.trim();
        if (!txt || !empresaSeleccionada) return;

        const nota = { tipo: "nota", texto: txt, fecha: new Date().toLocaleString() };
        const nuevasNotas = [...(empresaSeleccionada.notas || []), nota];
        await Data.updateUser(empresaSeleccionada.correo, { notas: nuevasNotas });
        await reloadData();
        document.getElementById("notaTexto").value = "";
        verNotas(empresaSeleccionada.correo);
    };

    // 6. Eventos UI
    document.querySelectorAll("#tabsEstado .btn").forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll("#tabsEstado .btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            filtroEstadoActual = btn.dataset.filter;
            render();
        };
    });

    searchInput.oninput = render;

    document.getElementById("logoutBtn").onclick = async () => {
        await Auth.logout();
    };

    // Init
    async function repairAndLoad() {
        try {
            const empresasSnap = await dbFirestore.collection("empresas").limit(1).get();
            if (empresasSnap.empty && window.data && window.data.empresas) {
                console.log("🏭 Migrando empresas a la nube desde validación...");
                for (const emp of window.data.empresas) {
                    await dbFirestore.collection("empresas").doc(emp.correo).set(emp);
                }
            }
            await reloadData();
        } catch (e) {
            console.error("Error en reparación validación:", e);
        }
    }
    await repairAndLoad();
});
