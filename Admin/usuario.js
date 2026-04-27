document.addEventListener("DOMContentLoaded", async () => {
    // 1. Verificar sesión
    if (typeof Auth !== "undefined") {
        const user = Auth.getActiveUser();
        if (!user || user.rol !== "admin") {
            window.location.href = "../login.html";
            return;
        }
    }

    // 2. Elementos del DOM
    const tablaUsuarios = document.getElementById("tablaUsuarios");
    const searchInput = document.getElementById("searchInput");
    const filtroRol = document.getElementById("filtroRol");
    const filtroDiscapacidad = document.getElementById("filtroDiscapacidad");
    const containerFiltroDiscapacidad = document.getElementById("containerFiltroDiscapacidad");
    const filterBtn = document.getElementById("filterBtn");
    const clearBtn = document.getElementById("clearBtn");

    const editForm = {
        nombre: document.getElementById("editNombre"),
        apellido: document.getElementById("editApellido"),
        correo: document.getElementById("editCorreo"),
        telefono: document.getElementById("editTelefono"),
        password: document.getElementById("editPassword"),
        descripcion: document.getElementById("editDescripcion"),
        discapacidad: document.getElementById("editDiscapacidad"),
        rol: document.getElementById("editRol")
    };

    let allUsers = [];
    let usuarioActual = null;

    // 3. Renderizar Tabla (Asíncrona)
    async function renderUsuarios(lista) {
        tablaUsuarios.innerHTML = "";
        const rolActual = filtroRol.value;

        // Ajustar headers
        document.getElementById("thCol3").textContent = rolActual === "empresa" ? "Sector" : "Discapacidad";
        document.getElementById("thCol5").textContent = rolActual === "empresa" ? "Ubicación" : "Registro";

        if (lista.length === 0) {
            tablaUsuarios.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No hay resultados.</td></tr>`;
            return;
        }

        for (const u of lista) {
            const info = await Data.getContactInfo(u.correo);
            const col3 = u.rol === "empresa" ? (u.sector || "General") : (u.discapacidad || "—");
            const col5 = u.rol === "empresa" ? (u.direccion || "—") : (u.fechaRegistro ? u.fechaRegistro.split('T')[0] : "—");

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <img src="${info.foto}" class="rounded-circle shadow-sm" style="width:32px; height:32px; object-fit: cover; border:1px solid #eee;">
                        <span class="fw-medium">${info.nombre || u.nombre}</span>
                    </div>
                </td>
                <td class="small text-muted">${u.correo}</td>
                <td><span class="badge ${u.rol === 'empresa' ? 'bg-info-light text-info' : 'bg-light text-dark'} fw-normal">${col3}</span></td>
                <td><span class="badge ${u.rol === 'admin' ? 'bg-danger' : u.rol === 'empresa' ? 'bg-success' : 'bg-primary'}">${u.rol.toUpperCase()}</span></td>
                <td class="text-secondary small">${col5}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary border-0" onclick="editarUsuario('${u.correo}')"><i class="fa fa-pen"></i></button>
                    <button class="btn btn-sm btn-outline-danger border-0" onclick="eliminarUsuario('${u.correo}')"><i class="fa fa-trash"></i></button>
                </td>
            `;
            tablaUsuarios.appendChild(tr);
        }
    }

    async function reloadData() {
        const db = await Data.getDB();
        // Combinar usuarios y empresas para gestión unificada
        const users = (db.usuarios || []).map(u => ({...u, rol: u.rol || 'usuario'}));
        const companies = (db.empresas || []).map(e => ({...e, rol: 'empresa', nombre: e.nombre || e.razonSocial}));
        allUsers = [...users, ...companies];
        applyFilters();
    }

    function applyFilters() {
        const query = searchInput.value.toLowerCase();
        const rol = filtroRol.value;
        const disc = filtroDiscapacidad.value;

        let filtered = allUsers;

        if (rol !== "all") filtered = filtered.filter(u => u.rol === rol);
        if (disc !== "all" && rol === "usuario") filtered = filtered.filter(u => (u.discapacidad || "").toLowerCase() === disc);
        if (query) {
            filtered = filtered.filter(u => 
                (u.nombre || "").toLowerCase().includes(query) || 
                (u.correo || "").toLowerCase().includes(query)
            );
        }

        renderUsuarios(filtered);
    }

    // 4. Acciones Globales
    window.editarUsuario = async (correo) => {
        usuarioActual = allUsers.find(u => u.correo === correo);
        if (!usuarioActual) return;

        editForm.nombre.value = usuarioActual.nombre || "";
        editForm.apellido.value = usuarioActual.apellido || "";
        editForm.correo.value = usuarioActual.correo || "";
        editForm.telefono.value = usuarioActual.telefono || "";
        editForm.descripcion.value = usuarioActual.descripcion || "";
        editForm.discapacidad.value = usuarioActual.discapacidad || "";
        editForm.rol.value = usuarioActual.rol || "usuario";

        const modal = new bootstrap.Modal(document.getElementById("modalEditar"));
        modal.show();
    };

    window.eliminarUsuario = async (correo) => {
        if (!confirm("¿Eliminar este usuario de forma permanente?")) return;
        await Data.deleteUser(correo);
        await reloadData();
        alert("🗑️ Registro eliminado de la nube.");
    };

    // 5. Guardar Cambios
    document.getElementById("guardarCambios").addEventListener("click", async () => {
        const newData = {
            nombre: editForm.nombre.value,
            apellido: editForm.apellido.value,
            telefono: editForm.telefono.value,
            descripcion: editForm.descripcion.value,
            discapacidad: editForm.discapacidad.value,
            rol: editForm.rol.value
        };

        if (editForm.password.value) newData.password = editForm.password.value;

        try {
            await Data.updateUser(usuarioActual.correo, newData);
            await reloadData();
            bootstrap.Modal.getInstance(document.getElementById("modalEditar")).hide();
            alert("✓ Usuario actualizado.");
        } catch (e) {
            alert("Error al actualizar.");
        }
    });

    // 6. Nuevo Usuario
    document.getElementById("guardarNuevoUsuario").addEventListener("click", async () => {
        const nNombre = document.getElementById("nuevoNombre").value;
        const nCorreo = document.getElementById("nuevoCorreo").value;
        const nPass = document.getElementById("nuevoPassword").value;
        const nRol = document.getElementById("nuevoRol").value;
        const nDisc = document.getElementById("nuevoDiscapacidad").value;

        if (!nNombre || !nCorreo || !nPass) return alert("Completa los campos.");

        try {
            const db = await Data.getDB();
            if (db.usuarios.some(u => u.correo === nCorreo)) return alert("El correo ya existe.");

            const newUser = {
                nombre: nNombre,
                correo: nCorreo,
                password: nPass,
                rol: nRol,
                discapacidad: nRol === "usuario" ? nDisc : "",
                fechaRegistro: new Date().toISOString()
            };

            await Data.addUser(newUser);
            await reloadData();
            bootstrap.Modal.getInstance(document.getElementById("modalAgregar")).hide();
            alert("✓ Usuario creado en la nube.");
        } catch (e) {
            alert("Error al crear.");
        }
    });

    // UI Events
    filtroRol.addEventListener("change", () => {
        containerFiltroDiscapacidad.style.display = filtroRol.value === "usuario" ? "block" : "none";
        applyFilters();
    });
    filterBtn.addEventListener("click", applyFilters);
    clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        filtroRol.value = "all";
        reloadData();
    });

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", async () => {
        await Auth.logout();
    });

    // Init
    await reloadData();
});
