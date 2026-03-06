// ===============================
// usuario.js — Gestión de Usuarios (Administrador)
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
    // Referencias DOM
    // ===============================
    const tablaUsuarios = document.getElementById("tablaUsuarios");
    const searchInput = document.getElementById("searchInput");
    const filtroDiscapacidad = document.getElementById("filtroDiscapacidad");
    const filterBtn = document.getElementById("filterBtn");
    const clearBtn = document.getElementById("clearBtn");

    const editNombre = document.getElementById("editNombre");
    const editCorreo = document.getElementById("editCorreo");
    const editDiscapacidad = document.getElementById("editDiscapacidad");
    const guardarCambios = document.getElementById("guardarCambios");

    // Campos y botón del modal "Agregar Usuario"
    const nuevoNombre = document.getElementById("nuevoNombre");
    const nuevoCorreo = document.getElementById("nuevoCorreo");
    const nuevoPassword = document.getElementById("nuevoPassword");
    const nuevoDiscapacidad = document.getElementById("nuevoDiscapacidad");
    const guardarNuevoUsuario = document.getElementById("guardarNuevoUsuario");


    let usuarios = Data.getDB().usuarios || [];
    let usuarioActual = null; // Para edición

    // ===============================
    // Función para renderizar tabla
    // ===============================
    function renderUsuarios(lista) {
        tablaUsuarios.innerHTML = "";

        if (lista.length === 0) {
            tablaUsuarios.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted py-4">
                        <i class="fa fa-info-circle me-2"></i>No hay usuarios registrados.
                    </td>
                </tr>
            `;
            return;
        }

        lista.forEach(u => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${u.nombre}</td>
                <td>${u.correo}</td>
                <td>${u.discapacidad || "No especificada"}</td>
                <td>${u.fechaRegistro || "—"}</td>
                <td>
                    <button class="btn btn-sm btn-primary me-1" onclick="editarUsuario('${u.correo}')">
                        <i class="fa fa-pen"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarUsuario('${u.correo}')">
                        <i class="fa fa-trash"></i>
                    </button>
                </td>
            `;
            tablaUsuarios.appendChild(tr);
        });
    }

    // ===============================
    // Render inicial
    // ===============================
    renderUsuarios(usuarios);

    // ===============================
    // Filtro por texto
    // ===============================
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();
        const filtrados = usuarios.filter(u =>
            u.nombre.toLowerCase().includes(query) ||
            u.correo.toLowerCase().includes(query)
        );
        renderUsuarios(filtrados);
    });

    // ===============================
    // Filtro por discapacidad
    // ===============================
    filterBtn.addEventListener("click", () => {
        const filtro = filtroDiscapacidad.value;
        let filtrados = usuarios;

        if (filtro !== "all") {
            filtrados = usuarios.filter(u => (u.discapacidad || "").toLowerCase() === filtro);
        }

        renderUsuarios(filtrados);
    });

    clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        filtroDiscapacidad.value = "all";
        renderUsuarios(usuarios);
    });

    // ===============================
    // Guardar cambios del modal
    // ===============================
    guardarCambios.addEventListener("click", () => {
        if (!usuarioActual) return;

        const nuevoNombre = editNombre.value.trim();
        const nuevoCorreo = editCorreo.value.trim();
        const nuevaDiscapacidad = editDiscapacidad.value.trim();

        if (!nuevoNombre || !nuevoCorreo) {
            alert("Por favor, completa los campos requeridos.");
            return;
        }

        // Actualizar datos
        Data.updateUser(usuarioActual.correo, {
            nombre: nuevoNombre,
            correo: nuevoCorreo,
            discapacidad: nuevaDiscapacidad
        });

        // Actualizar en memoria y recargar
        usuarios = Data.getDB().usuarios;
        const modal = bootstrap.Modal.getInstance(document.getElementById("modalEditar"));
        modal.hide();
        alert("Usuario actualizado correctamente.");
        renderUsuarios(usuarios);
    });

    // ===============================
    // Cerrar sesión
    // ===============================
    document.getElementById("logoutBtn").addEventListener("click", () => {
        Auth.logout();
    });

    // Exponer funciones globales
    window.editarUsuario = (correo) => {
        const db = Data.getDB();
        const usuario = db.usuarios.find(u => u.correo === correo);
        if (!usuario) return alert("Usuario no encontrado.");

        usuarioActual = usuario;

        editNombre.value = usuario.nombre;
        editCorreo.value = usuario.correo;
        editDiscapacidad.value = usuario.discapacidad || "";

        const modal = new bootstrap.Modal(document.getElementById("modalEditar"));
        modal.show();
    };

    window.eliminarUsuario = (correo) => {
        if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;
        Data.deleteUser(correo);
        usuarios = Data.getDB().usuarios;
        renderUsuarios(usuarios);
        alert("Usuario eliminado correctamente.");
    };

    // ===============================
    // Agregar nuevo usuario
    // ===============================
    guardarNuevoUsuario.addEventListener("click", () => {
        const nombre = nuevoNombre.value.trim();
        const correo = nuevoCorreo.value.trim();
        const password = nuevoPassword.value.trim();
        const discapacidad = nuevoDiscapacidad.value.trim();

        if (!nombre || !correo || !password) {
            alert("Por favor completa los campos obligatorios.");
            return;
        }

        // Obtener base actual
        const db = Data.getDB();

        // Verificar duplicado
        if (db.usuarios.some(u => u.correo === correo)) {
            alert("Ya existe un usuario con ese correo.");
            return;
        }

        // Crear objeto compatible con Auth y sistema
        const nuevoUsuario = {
            id: db.usuarios.length ? db.usuarios[db.usuarios.length - 1].id + 1 : 1,
            nombre,
            correo,
            password, // Guardamos directamente por ahora
            discapacidad,
            rol: "usuario",
            fechaRegistro: new Date().toISOString(),
            postulaciones: []
        };

        // Guardar en la base
        db.usuarios.push(nuevoUsuario);
        Data.saveDB(db); // Usa el método del sistema para mantener coherencia

        //  Sincronizar con Auth (opcional, pero útil si Auth usa su propia tabla)
        if (typeof Auth !== "undefined" && Auth.registerUser) {
        Auth.registerUser(nombre, correo, password);
        }


        // Limpiar campos
        nuevoNombre.value = "";
        nuevoCorreo.value = "";
        nuevoPassword.value = "";
        nuevoDiscapacidad.value = "";

        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById("modalAgregar"));
        modal.hide();

        alert(" Usuario agregado correctamente. Ya puede iniciar sesión con su correo y contraseña.");
        usuarios = db.usuarios;
        renderUsuarios(usuarios);
    });


});
