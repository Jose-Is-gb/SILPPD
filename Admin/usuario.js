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
    const editApellido = document.getElementById("editApellido");
    const editCorreo = document.getElementById("editCorreo");
    const editTelefono = document.getElementById("editTelefono");
    const editPassword = document.getElementById("editPassword");
    const editDescripcion = document.getElementById("editDescripcion");
    const editDiscapacidad = document.getElementById("editDiscapacidad");
    const guardarCambios = document.getElementById("guardarCambios");

    // Toggle para ver/ocultar contraseña
    const toggleEditPass = document.getElementById("toggleEditPass");
    if (toggleEditPass) {
        toggleEditPass.addEventListener("click", () => {
            const inp = editPassword;
            if (inp.type === "password") {
                inp.type = "text";
                toggleEditPass.innerHTML = '<i class="fa fa-eye-slash"></i>';
            } else {
                inp.type = "password";
                toggleEditPass.innerHTML = '<i class="fa fa-eye"></i>';
            }
        });
    }

    // Campos y botón del modal "Agregar Usuario"
    const nuevoNombre = document.getElementById("nuevoNombre");
    const nuevoCorreo = document.getElementById("nuevoCorreo");
    const nuevoPassword = document.getElementById("nuevoPassword");
    const nuevoDiscapacidad = document.getElementById("nuevoDiscapacidad");
    const guardarNuevoUsuario = document.getElementById("guardarNuevoUsuario");

    const containerEditDiscapacidad = document.getElementById("containerEditDiscapacidad");
    const containerNuevoDiscapacidad = document.getElementById("containerNuevoDiscapacidad");

    // ===============================
    // Lógica dinámica para mostrar/ocultar Discapacidad
    // ===============================
    if (document.getElementById("editRol")) {
        document.getElementById("editRol").addEventListener("change", (e) => {
            if (e.target.value === "usuario") {
                containerEditDiscapacidad.style.display = "block";
            } else {
                containerEditDiscapacidad.style.display = "none";
            }
        });
    }

    if (document.getElementById("nuevoRol")) {
        document.getElementById("nuevoRol").addEventListener("change", (e) => {
            if (e.target.value === "usuario") {
                containerNuevoDiscapacidad.style.display = "block";
            } else {
                containerNuevoDiscapacidad.style.display = "none";
                nuevoDiscapacidad.value = "";
            }
        });
    }


    let usuarios = Data.getDB().usuarios || [];
    let usuarioActual = null; // Para edición

    // ===============================
    // Referencias de filtros
    // ===============================
    const filtroRol = document.getElementById("filtroRol");
    const containerFiltroDiscapacidad = document.getElementById("containerFiltroDiscapacidad");
    const containerFiltroSector = document.getElementById("containerFiltroSector");
    const containerFiltroRegion = document.getElementById("containerFiltroRegion");
    const filtroSector = document.getElementById("filtroSector");
    const filtroRegion = document.getElementById("filtroRegion");

    // ===============================
    // Función para renderizar tabla
    // ===============================
    function renderUsuarios(lista) {
        tablaUsuarios.innerHTML = "";

        // Actualizar encabezados de tabla según el filtro activo
        const thCol3 = document.getElementById("thCol3");
        const thCol5 = document.getElementById("thCol5");
        const rolActual = filtroRol ? filtroRol.value : "all";

        if (rolActual === "empresa") {
            thCol3.textContent = "Sector";
            thCol5.textContent = "Región";
        } else {
            thCol3.textContent = "Discapacidad";
            thCol5.textContent = "Fecha Registro";
        }

        if (lista.length === 0) {
            tablaUsuarios.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fa fa-info-circle me-2"></i>No hay registros que coincidan.
                    </td>
                </tr>
            `;
            return;
        }

        lista.forEach(u => {
            const tr = document.createElement("tr");
            const col3 = rolActual === "empresa" ? (u.discapacidad || "—") : (u.discapacidad || "No especificada");
            const col5 = rolActual === "empresa" ? (u._region || "—") : (u.fechaRegistro || "—");

            tr.innerHTML = `
                <td>${u.nombre}</td>
                <td>${u.correo}</td>
                <td>${col3}</td>
                <td><span class="badge ${u.rol === 'admin' ? 'bg-danger' : u.rol === 'empresa' ? 'bg-success' : 'bg-primary'}">${u.rol ? u.rol.toUpperCase() : "USUARIO"}</span></td>
                <td>${col5}</td>
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
    // Filtro por texto (en tiempo real)
    // ===============================
    searchInput.addEventListener("input", () => aplicarFiltros());

    // Extraer región de la dirección si no existe el campo region
    function getRegion(emp) {
        if (emp.region) return emp.region;
        // Intentar extraer la ciudad de la dirección (formato: "Calle X, Ciudad")
        if (emp.direccion) {
            const partes = emp.direccion.split(",");
            if (partes.length > 1) return partes[partes.length - 1].trim();
        }
        return "Sin región";
    }

    // Asignar sector si no existe
    function getSector(emp) {
        if (emp.sector) return emp.sector;
        // Intentar asignar por nombre de empresa
        const nombre = (emp.nombre || "").toLowerCase();
        if (nombre.includes("tech") || nombre.includes("cloud") || nombre.includes("lab")) return "Tecnología";
        if (nombre.includes("pixel") || nombre.includes("art") || nombre.includes("studio")) return "Diseño y Marketing";
        if (nombre.includes("eco") || nombre.includes("market")) return "Comercio";
        if (nombre.includes("edu") || nombre.includes("learn")) return "Educación";
        return "General";
    }

    // Poblar dinámicamente sectores y regiones desde la BD
    function poblarFiltrosEmpresa() {
        const db = Data.getDB();
        const empresas = db.empresas || [];

        // Sectores únicos
        const sectores = [...new Set(empresas.map(e => getSector(e)))].sort();
        filtroSector.innerHTML = '<option value="all">Todos</option>';
        sectores.forEach(s => {
            filtroSector.innerHTML += `<option value="${s}">${s}</option>`;
        });

        // Regiones únicas
        const regiones = [...new Set(empresas.map(e => getRegion(e)))].sort();
        filtroRegion.innerHTML = '<option value="all">Todas</option>';
        regiones.forEach(r => {
            filtroRegion.innerHTML += `<option value="${r}">${r}</option>`;
        });
    }

    filtroRol.addEventListener("change", () => {
        // Ocultar todos los filtros condicionales
        containerFiltroDiscapacidad.style.display = "none";
        containerFiltroSector.style.display = "none";
        containerFiltroRegion.style.display = "none";
        filtroDiscapacidad.value = "all";
        filtroSector.value = "all";
        filtroRegion.value = "all";

        if (filtroRol.value === "usuario") {
            containerFiltroDiscapacidad.style.display = "block";
        } else if (filtroRol.value === "empresa") {
            poblarFiltrosEmpresa();
            containerFiltroSector.style.display = "block";
            containerFiltroRegion.style.display = "block";
        }
        aplicarFiltros();
    });

    // ===============================
    // Función combinada de filtros
    // ===============================
    function aplicarFiltros() {
        const query = searchInput.value.toLowerCase();
        const rolFiltro = filtroRol.value;
        const discFiltro = filtroDiscapacidad.value;
        const sectorFiltro = filtroSector.value;
        const regionFiltro = filtroRegion.value;

        // Base de datos: combinar usuarios + empresas normalizadas
        let listaBase;

        if (rolFiltro === "empresa") {
            const db = Data.getDB();
            let empresasList = db.empresas || [];

            // Filtrar por sector (usando helper)
            if (sectorFiltro !== "all") {
                empresasList = empresasList.filter(e => getSector(e) === sectorFiltro);
            }
            // Filtrar por región (usando helper)
            if (regionFiltro !== "all") {
                empresasList = empresasList.filter(e => getRegion(e) === regionFiltro);
            }

            listaBase = empresasList.map(e => ({
                nombre: e.nombre || e.razonSocial || "Sin nombre",
                apellido: "",
                correo: e.correo || "",
                discapacidad: getSector(e),
                rol: "empresa",
                fechaRegistro: e.fechaRegistro || "—",
                _region: getRegion(e),
                _esEmpresa: true
            }));
        } else if (rolFiltro === "all") {
            const db = Data.getDB();
            const empresasNorm = (db.empresas || []).map(e => ({
                nombre: e.nombre || e.razonSocial || "Sin nombre",
                apellido: "",
                correo: e.correo || "",
                discapacidad: "—",
                rol: "empresa",
                fechaRegistro: e.fechaRegistro || "—",
                _esEmpresa: true
            }));
            listaBase = [...usuarios, ...empresasNorm];
        } else {
            listaBase = usuarios;
        }

        let filtrados = listaBase;

        // Filtro por texto
        if (query) {
            filtrados = filtrados.filter(u =>
                (u.nombre || "").toLowerCase().includes(query) ||
                (u.apellido || "").toLowerCase().includes(query) ||
                (u.correo || "").toLowerCase().includes(query)
            );
        }

        // Filtro por rol (para "all" ya tenemos ambos, para usuario/admin filtrar)
        if (rolFiltro !== "all" && rolFiltro !== "empresa") {
            filtrados = filtrados.filter(u => (u.rol || "usuario") === rolFiltro);
        }

        // Filtro por discapacidad (solo si rol es "usuario")
        if (rolFiltro === "usuario" && discFiltro !== "all") {
            filtrados = filtrados.filter(u => (u.discapacidad || "").toLowerCase() === discFiltro);
        }

        renderUsuarios(filtrados);
    }

    filterBtn.addEventListener("click", () => aplicarFiltros());

    clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        filtroRol.value = "all";
        filtroDiscapacidad.value = "all";
        filtroSector.value = "all";
        filtroRegion.value = "all";
        containerFiltroDiscapacidad.style.display = "none";
        containerFiltroSector.style.display = "none";
        containerFiltroRegion.style.display = "none";
        renderUsuarios(usuarios);
    });

    // ===============================
    // Guardar cambios del modal
    // ===============================
    guardarCambios.addEventListener("click", () => {
        if (!usuarioActual) return;

        const nuevoNombreVal = editNombre.value.trim();
        const nuevoApellidoVal = editApellido.value.trim();
        const nuevoCorreoVal = editCorreo.value.trim();
        const nuevoTelefonoVal = editTelefono.value.trim();
        const nuevoPasswordVal = editPassword.value.trim();
        const nuevaDescripcionVal = editDescripcion.value.trim();
        const nuevaDiscapacidad = editDiscapacidad.value.trim();
        const nuevoRol = document.getElementById("editRol").value;

        if (!nuevoNombreVal || !nuevoCorreoVal) {
            alert("Por favor, completa los campos requeridos (Nombre y Correo).");
            return;
        }

        // Construir objeto de actualización
        const datosActualizados = {
            nombre: nuevoNombreVal,
            apellido: nuevoApellidoVal,
            correo: nuevoCorreoVal,
            telefono: nuevoTelefonoVal,
            descripcion: nuevaDescripcionVal,
            discapacidad: nuevaDiscapacidad,
            rol: nuevoRol
        };

        // Solo actualizar password si se ingresó una nueva
        if (nuevoPasswordVal) {
            datosActualizados.password = nuevoPasswordVal;
        }

        // Actualizar datos
        Data.updateUser(usuarioActual.correo, datosActualizados);

        // Actualizar en memoria y recargar
        usuarios = Data.getDB().usuarios;
        const modal = bootstrap.Modal.getInstance(document.getElementById("modalEditar"));
        modal.hide();
        editPassword.value = ""; // Limpiar campo de contraseña
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

        editNombre.value = usuario.nombre || "";
        editApellido.value = usuario.apellido || "";
        editCorreo.value = usuario.correo || "";
        editTelefono.value = usuario.telefono || "";
        editPassword.value = ""; // Siempre vacío al abrir
        editDescripcion.value = usuario.descripcion || "";
        editDiscapacidad.value = usuario.discapacidad || "";
        if (document.getElementById("editRol")) {
            const r = usuario.rol || "usuario";
            document.getElementById("editRol").value = r;
            if (r === "usuario") {
                containerEditDiscapacidad.style.display = "block";
            } else {
                containerEditDiscapacidad.style.display = "none";
            }
        }

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
        const rol = document.getElementById("nuevoRol") ? document.getElementById("nuevoRol").value : "usuario";

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
            rol: rol,
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
        if (document.getElementById("nuevoRol")) {
            document.getElementById("nuevoRol").value = "usuario";
            if (containerNuevoDiscapacidad) containerNuevoDiscapacidad.style.display = "block";
        }

        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById("modalAgregar"));
        modal.hide();

        alert(" Usuario agregado correctamente. Ya puede iniciar sesión con su correo y contraseña.");
        usuarios = db.usuarios;
        renderUsuarios(usuarios);
    });


});
