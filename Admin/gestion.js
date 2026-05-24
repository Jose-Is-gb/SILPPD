document.addEventListener("DOMContentLoaded", async () => {

    // ===============================
    // RBAC: Solo usuarios con rol 'admin' pueden acceder
    // ===============================
    const adminUser = await Auth.requireRole("admin", "../login.html");
    if (!adminUser) return;

    // ===============================
    // Referencias DOM
    // ===============================
    const tablaOfertas = document.getElementById("tablaOfertas");
    const buscarOferta = document.getElementById("buscarOferta");
    const filtrarDiscapacidad = document.getElementById("filtrarDiscapacidad");
    const btnFiltrar = document.getElementById("btnFiltrar");
    const btnLimpiar = document.getElementById("btnLimpiar");
    const guardarNuevaOferta = document.getElementById("guardarNuevaOferta");

    const nuevoTitulo = document.getElementById("nuevoTitulo");
    const nuevaEmpresa = document.getElementById("nuevaEmpresa");
    const nuevaCategoria = document.getElementById("nuevaCategoria");
    const nuevaDescripcion = document.getElementById("nuevaDescripcion");
    const nuevaCiudad = document.getElementById("nuevaCiudad");
    const nuevaModalidad = document.getElementById("nuevaModalidad");
    const nuevaDiscapacidad = document.getElementById("nuevaDiscapacidad");
    const nuevoEstado = document.getElementById("nuevoEstado");

    let ofertas = [];
    let editandoID = null;

    // ===============================
    // Renderizar tabla (Asíncrona)
    // ===============================
    async function renderOfertas(lista) {
        tablaOfertas.innerHTML = "";

        if (lista.length === 0) {
            tablaOfertas.innerHTML = Security.sanitizeHTML(`
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="fa fa-info-circle me-2"></i>No hay ofertas registradas.
                </td>
            </tr>`);
            return;
        }

        lista.forEach(o => {
            const tr = document.createElement("tr");
            tr.innerHTML = Security.sanitizeHTML(`
            <td>${o.titulo}</td>
            <td>${o.empresa}</td>
            <td>${o.ciudad}</td>
            <td>${o.modalidad}</td>
            <td>${o.discapacidad || o.categoria || "—"}</td>
            <td class="text-center">
                <button class="btn btn-sm ${o.estado === "Activa" ? "btn-success" : "btn-warning"} me-1"
                    onclick="toggleEstado('${o.id}')">
                    ${o.estado}
                </button>
            </td>
            <td>
                <button class="btn btn-sm btn-primary me-1" onclick="editarOferta('${o.id}')">
                    <i class="fa fa-pen"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="eliminarOferta('${o.id}')">
                    <i class="fa fa-trash"></i>
                </button>
            </td>
            `);
            tablaOfertas.appendChild(tr);
        });
    }

    async function reloadOfertas() {
        ofertas = await Data.getOfertas();
        renderOfertas(ofertas);
    }

    // ===============================
    // BUSCAR
    // ===============================
    buscarOferta.addEventListener("input", () => {
        const q = buscarOferta.value.toLowerCase();
        const filtradas = ofertas.filter(o =>
            (o.titulo || "").toLowerCase().includes(q) ||
            (o.empresa || "").toLowerCase().includes(q)
        );
        renderOfertas(filtradas);
    });

    // ===============================
    // FILTRAR POR DISCAPACIDAD
    // ===============================
    btnFiltrar.addEventListener("click", () => {
        const filtro = filtrarDiscapacidad.value;
        if (filtro === "all") renderOfertas(ofertas);
        else {
            const filtradas = ofertas.filter(o =>
                (o.discapacidad || "").toLowerCase() === filtro.toLowerCase()
            );
            renderOfertas(filtradas);
        }
    });

    btnLimpiar.addEventListener("click", () => {
        buscarOferta.value = "";
        filtrarDiscapacidad.value = "all";
        renderOfertas(ofertas);
    });

    // ===============================
    // GUARDAR (Crear / Editar)
    // ===============================
    guardarNuevaOferta.addEventListener("click", async () => {
        const payload = {
            titulo: nuevoTitulo.value.trim(),
            empresa: nuevaEmpresa.value.trim(),
            categoria: nuevaCategoria.value.trim(),
            descripcion: nuevaDescripcion.value.trim(),
            ciudad: nuevaCiudad.value.trim(),
            modalidad: nuevaModalidad.value.trim(),
            discapacidad: nuevaDiscapacidad.value.trim(),
            estado: nuevoEstado.value.trim(),
            fecha: new Date().toISOString().split("T")[0]
        };

        if (!payload.titulo || !payload.empresa) {
            alert("Completa los campos obligatorios.");
            return;
        }

        try {
            if (editandoID === null) {
                await Data.addOferta(payload);
            } else {
                await Data.updateOferta(editandoID, payload);
                editandoID = null;
            }
            await reloadOfertas();
            bootstrap.Modal.getInstance(document.getElementById("modalNuevaOferta")).hide();
            limpiarCampos();
            alert("✓ Cambios guardados en la nube.");
        } catch (e) {
            console.error(e);
            alert("Error al guardar.");
        }
    });

    function limpiarCampos() {
        nuevoTitulo.value = "";
        nuevaEmpresa.value = "";
        nuevaCategoria.value = "";
        nuevaDescripcion.value = "";
        nuevaCiudad.value = "";
        nuevaModalidad.value = "Presencial";
        nuevaDiscapacidad.value = "Fisica";
        nuevoEstado.value = "Activa";
    }

    // ===============================
    // ACCIONES GLOBALES
    // ===============================
    window.editarOferta = async (id) => {
        const oferta = ofertas.find(o => String(o.id) === String(id));
        if (!oferta) return;

        editandoID = id;
        nuevoTitulo.value = oferta.titulo || "";
        nuevaEmpresa.value = oferta.empresa || "";
        nuevaCategoria.value = oferta.categoria || "";
        nuevaDescripcion.value = oferta.descripcion || "";
        nuevaCiudad.value = oferta.ciudad || "";
        nuevaModalidad.value = oferta.modalidad || "Presencial";
        nuevaDiscapacidad.value = oferta.discapacidad || "Fisica";
        nuevoEstado.value = oferta.estado || "Activa";

        new bootstrap.Modal(document.getElementById("modalNuevaOferta")).show();
    };

    window.toggleEstado = async (id) => {
        const oferta = ofertas.find(o => String(o.id) === String(id));
        if (!oferta) return;

        const nuevo = oferta.estado === "Activa" ? "Pausada" : "Activa";
        await Data.updateOferta(id, { estado: nuevo });
        await reloadOfertas();
        alert("✓ Estado actualizado.");
    };

    window.eliminarOferta = async (id) => {
        if (!confirm("¿Eliminar esta oferta definitivamente?")) return;
        await Data.deleteOferta(id);
        await reloadOfertas();
        alert("🗑️ Oferta eliminada de la nube.");
    };

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", async () => {
        await Auth.logout();
    });

    // Inicializar
    await reloadOfertas();
});
