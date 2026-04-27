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
        await render();
    }

    let renderCounter = 0;

    async function render() {
        const currentRenderId = ++renderCounter; // Incrementar el ID para este ciclo
        
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

        // 1. Obtener toda la info asíncrona ANTES de tocar el DOM
        const rowsHtmlPromises = list.map(async (emp) => {
            const info = await Data.getContactInfo(emp.correo);
            const fotoSrc = info.foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
            return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <img src="${fotoSrc}" class="rounded-circle" style="width:36px; height:36px; object-fit: cover; border:1px solid #eee;">
                            <div><span class="fw-medium">${emp.nombre || emp.razonSocial || "—"}</span><br><small class="text-muted">${emp.correo}</small></div>
                        </div>
                    </td>
                    <td><small>${emp.ruc || "—"}</small></td>
                    <td>${emp.contacto?.nombre || emp.representante || "—"}</td>
                    <td><span class="badge bg-light text-dark border fw-normal">${emp.sector || "General"}</span></td>
                    <td><small>${emp.ciudad || emp.region || "—"}</small></td>
                    <td><span class="badge ${getBadgeStyle(emp.estado)} rounded-pill">${emp.estado}</span></td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary border-0" onclick="verEmpresa('${emp.correo}')"><i class="fa fa-eye"></i></button>
                        <button class="btn btn-sm btn-outline-info border-0" onclick="verNotas('${emp.correo}')"><i class="fa fa-sticky-note"></i></button>
                        <button class="btn btn-sm btn-outline-danger border-0" onclick="eliminarEmpresa('${emp.correo}')"><i class="fa fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });

        // Esperar todo en paralelo
        const rowsHtml = await Promise.all(rowsHtmlPromises);

        // 2. Race Condition Check: Si el usuario apretó otro botón de filtro mientras esperábamos, abortar
        if (currentRenderId !== renderCounter) return;

        // 3. Modificar el DOM de un solo golpe (innerHTML)
        if (list.length === 0) {
            empresasContainer.innerHTML = `<tr><td colspan="7" class="text-center py-5 text-muted">No se encontraron empresas con esos criterios.</td></tr>`;
        } else {
            empresasContainer.innerHTML = rowsHtml.join('');
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
        // Eliminar de ambas colecciones: usuarios y empresas
        await Data.deleteUser(correo);
        try { await dbFirestore.collection("empresas").doc(correo).delete(); } catch(e) { console.warn("No se pudo borrar de empresas:", e); }
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
        const updatePayload = { estado: nuevo, notas: nuevasNotas, validada: nuevo === "Verificada" };

        // Actualizar en ambas colecciones: usuarios y empresas
        await Data.updateUser(empresaSeleccionada.correo, updatePayload);
        try {
            await dbFirestore.collection("empresas").doc(empresaSeleccionada.correo).update(updatePayload);
        } catch(e) {
            console.warn("No se pudo actualizar colección empresas:", e);
        }
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

    // Init — Migración automática: sincroniza usuario con rol='empresa' → colección 'empresas'
    async function repairAndLoad() {
        try {
            // Traer todos los usuarios y filtrar en JS (sin índice requerido)
            const todosSnap = await dbFirestore.collection("usuarios").get();
            const empresasDeUsuarios = todosSnap.docs
                .map(d => d.data())
                .filter(u => u.rol === "empresa");

            if (empresasDeUsuarios.length > 0) {
                const empresasSnap = await dbFirestore.collection("empresas").get();
                const correosYaMigrados = new Set(empresasSnap.docs.map(d => d.id));

                for (const userData of empresasDeUsuarios) {
                    const correo = userData.correo || userData.email;
                    if (correo && !correosYaMigrados.has(correo)) {
                        await dbFirestore.collection("empresas").doc(correo).set({
                            correo,
                            nombre: userData.nombre || userData.razonSocial || "Empresa",
                            ...userData
                        });
                        console.log(`✅ Empresa sincronizada: ${correo}`);
                    }
                }
            }
            await reloadData();
        } catch (e) {
            console.error("Error en reparación validación:", e);
        }
    }
    await repairAndLoad();


});
