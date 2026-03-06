// ===============================
// perfil.js — Gestión del perfil de usuario
// ===============================

document.addEventListener("DOMContentLoaded", () => {
    // ===============================
    // Verificar sesión activa
    // ===============================
    const user = Auth.getActiveUser();
    if (!user) {
        // No hay sesión -> volver a login
        window.location.href = "../login.html";
        return;
    }

    // ===============================
    // Elementos del DOM
    // ===============================
    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");
    const profilePhoto = document.getElementById("profilePhoto");
    const photoInput = document.getElementById("photoInput");
    const saveBtn = document.getElementById("saveBtn");
    const saveAlert = document.getElementById("saveAlert");
    const form = document.getElementById("profileForm");

    const nombreInput = document.getElementById("nombre");
    const apellidoInput = document.getElementById("apellido");
    const correoInput = document.getElementById("correo");
    const telefonoInput = document.getElementById("telefono");
    const descripcionInput = document.getElementById("descripcion");
    const discapacidadSelect = document.getElementById("discapacidad");

    // ===============================
    // Cargar datos del usuario actual
    // ===============================
    function loadProfile() {
        profileName.textContent = user.nombre || "Usuario";
        profileEmail.textContent = user.correo;

        nombreInput.value = user.nombre || "";
        apellidoInput.value = user.apellido || "";
        correoInput.value = user.correo || "";
        telefonoInput.value = user.telefono || "";
        descripcionInput.value = user.descripcion || "";
        discapacidadSelect.value = user.discapacidad || "";

        if (user.foto) {
            profilePhoto.src = user.foto;
        }
    }

    loadProfile();

    // ===============================
    // Subir nueva foto de perfil
    // ===============================
    photoInput.addEventListener("change", e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (event) {
            const imgBase64 = event.target.result;
            profilePhoto.src = imgBase64;

            // Actualizar en memoria
            user.foto = imgBase64;
            Auth.setActiveUser(user);
            Data.updateUser(user.correo, { foto: imgBase64 });
        };
        reader.readAsDataURL(file);
    });

    // ===============================
    // Guardar cambios en el perfil
    // ===============================
    form.addEventListener("submit", e => {
        e.preventDefault();

        // Actualizar datos locales
        user.nombre = nombreInput.value.trim();
        user.apellido = apellidoInput.value.trim();
        user.telefono = telefonoInput.value.trim();
        user.descripcion = descripcionInput.value.trim();
        user.discapacidad = discapacidadSelect.value;

        // Guardar sesión actualizada
        Auth.setActiveUser(user);

        // Guardar en base de datos
        Data.updateUser(user.correo, user);

        // Mostrar alerta de éxito
        saveAlert.classList.remove("d-none");
        setTimeout(() => saveAlert.classList.add("d-none"), 2000);

        // Actualizar encabezado
        profileName.textContent = user.nombre || "Usuario";
    });

    // ===============================
    // Cerrar sesión
    // ===============================
    document.getElementById("logoutBtn").addEventListener("click", () => {
        Auth.logout();
    });
});
