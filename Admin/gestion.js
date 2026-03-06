// ===============================
// gestion.js — Gestión de Ofertas (Administrador)
// ===============================

document.addEventListener("DOMContentLoaded", () => {

    // ===============================
    // Verificar sesión activa
    // ===============================
    if (typeof Auth !== "undefined") {
        const user = Auth.getActiveUser();
        if (!user || user.rol !== "admin") {
            window.location.href = "../login.html";
            return;
        }
    }

    // ===============================
    // Inicializar base de datos
    // ===============================
    let db = Data.getDB();

    // Si no existen ofertas, cargar DEMO
    if (!db.ofertas || db.ofertas.length === 0) {
        // Las ofertas demo ya están en tu version anterior. No repetir aquí.
        console.log("No hay ofertas, usar gestión para crearlas.");
    }

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

    let ofertas = Data.getOfertas();
    let editandoID = null; //  Detecta si estamos editando

    // ===============================
    // Renderizar tabla
    // ===============================
    function renderOfertas(lista) {
        tablaOfertas.innerHTML = "";

        if (lista.length === 0) {
            tablaOfertas.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="fa fa-info-circle me-2"></i>No hay ofertas registradas.
                </td>
            </tr>`;
            return;
        }

        lista.forEach(o => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
            <td>${o.titulo}</td>
            <td>${o.empresa}</td>
            <td>${o.ciudad}</td>
            <td>${o.modalidad}</td>
            <td>${o.discapacidad}</td>
            <td class="text-center">
                <!-- Botón de estado -->
                
                <button class="btn btn-sm ${o.estado === "Activa" ? "btn-success" : "btn-warning"} me-1"
                    onclick="toggleEstado(${o.id})">
                    ${o.estado}
                </button>
                </td>
                <!-- Editar -->
                <button class="btn btn-sm btn-primary me-1" onclick="editarOferta(${o.id})">
                    <i class="fa fa-pen"></i>
                </button>

                <!-- Eliminar -->
                <button class="btn btn-sm btn-danger" onclick="eliminarOferta(${o.id})">
                    <i class="fa fa-trash"></i>
                </button>

            </td>

            `;

            tablaOfertas.appendChild(tr);
        });
    }

    renderOfertas(ofertas);

    // ===============================
    // BUSCAR
    // ===============================
    buscarOferta.addEventListener("input", () => {
        const q = buscarOferta.value.toLowerCase();
        const filtradas = ofertas.filter(o =>
            o.titulo.toLowerCase().includes(q) ||
            o.empresa.toLowerCase().includes(q)
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
                o.discapacidad.toLowerCase() === filtro.toLowerCase()
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
    guardarNuevaOferta.addEventListener("click", () => {

        const titulo = nuevoTitulo.value.trim();
        const empresa = nuevaEmpresa.value.trim();
        const categoria = nuevaCategoria.value.trim();
        const descripcion = nuevaDescripcion.value.trim();
        const ciudad = nuevaCiudad.value.trim();
        const modalidad = nuevaModalidad.value.trim();
        const discapacidad = nuevaDiscapacidad.value.trim();
        const estado = nuevoEstado.value.trim();

        if (!titulo || !empresa) {
            alert("Completa los campos obligatorios.");
            return;
        }

        if (editandoID === null) {
            // ===============================
            // CREAR OFERTA
            // ===============================
            const nuevaOferta = {
                id: ofertas.length ? Math.max(...ofertas.map(o => o.id)) + 1 : 1,
                titulo,
                empresa,
                categoria,
                descripcion,
                ciudad,
                modalidad,
                discapacidad,
                estado,
                fecha: new Date().toISOString().split("T")[0]
            };

            Data.addOferta(nuevaOferta);
        } else {
            // ===============================
            // EDITAR OFERTA
            // ===============================
            Data.updateOferta(editandoID, {
                titulo,
                empresa,
                categoria,
                descripcion,
                ciudad,
                modalidad,
                discapacidad,
                estado
            });

            editandoID = null; // salir del modo edición
        }

        ofertas = Data.getOfertas();
        renderOfertas(ofertas);

        const modal = bootstrap.Modal.getInstance(document.getElementById("modalNuevaOferta"));
        modal.hide();
        limpiarCampos();

        alert(" Cambios guardados.");
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
    // EDITAR OFERTA (CARGA MODAL)
    // ===============================
    window.editarOferta = id => {
        const oferta = ofertas.find(o => o.id === id);
        if (!oferta) return;

        editandoID = id;

        nuevoTitulo.value = oferta.titulo;
        nuevaEmpresa.value = oferta.empresa;
        nuevaCategoria.value = oferta.categoria;
        nuevaDescripcion.value = oferta.descripcion;
        nuevaCiudad.value = oferta.ciudad;
        nuevaModalidad.value = oferta.modalidad;
        nuevaDiscapacidad.value = oferta.discapacidad;
        nuevoEstado.value = oferta.estado;

        const modal = new bootstrap.Modal(document.getElementById("modalNuevaOferta"));
        modal.show();
    };

    // ===============================
    // ACTIVAR / PAUSAR
    // ===============================
    window.toggleEstado = id => {
        const oferta = ofertas.find(o => o.id === id);
        if (!oferta) return;

        const nuevo = oferta.estado === "Activa" ? "Pausada" : "Activa";
        Data.updateOferta(id, { estado: nuevo });

        ofertas = Data.getOfertas();
        renderOfertas(ofertas);

        alert(" Estado actualizado.");
    };

    // ===============================
    // ELIMINAR
    // ===============================
    window.eliminarOferta = id => {
        if (!confirm("¿Eliminar esta oferta?")) return;

        Data.deleteOferta(id);

        ofertas = Data.getOfertas();
        renderOfertas(ofertas);

        alert("🗑️ Oferta eliminada.");
    };

    // ===============================
    // LOGOUT
    // ===============================
    document.getElementById("logoutBtn").addEventListener("click", () => {
        Auth.logout();
    });

});
