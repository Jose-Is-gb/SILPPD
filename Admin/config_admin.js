// ===============================
// config_admin.js — Gestión de configuración del sistema
// ===============================

document.addEventListener("DOMContentLoaded", () => {

    // ===============================
    // Cargar configuraciones existentes
    // ===============================
    const config = JSON.parse(localStorage.getItem("configSistema")) || {
        nombre: "Talento Inclusivo",
        correoAdmin: "admin@correo.com",
        permitirRegistros: "si",
        compatibilidadAuto: "si",
        logoBase64: ""
    };

    // ===============================
    // Referencias a elementos del DOM
    // ===============================
    const nombreSistema = document.getElementById("nombreSistema");
    const correoAdmin = document.getElementById("correoAdmin");
    const permitirRegistros = document.getElementById("permitirRegistros");
    const compatibilidadAuto = document.getElementById("compatibilidadAuto");
    const logoInput = document.getElementById("logoSistema");
    const previewLogo = document.getElementById("previewLogo");
    const guardarBtn = document.getElementById("guardarConfig");

    // Contenedor de alerta
    let alertDiv = document.createElement("div");
    alertDiv.className = "alert alert-success d-none mt-3";
    alertDiv.role = "alert";
    guardarBtn.parentNode.appendChild(alertDiv);

    // ===============================
    // Inicializar valores en el formulario
    // ===============================
    nombreSistema.value = config.nombre;
    correoAdmin.value = config.correoAdmin;
    permitirRegistros.value = config.permitirRegistros;
    compatibilidadAuto.value = config.compatibilidadAuto;
    previewLogo.src = config.logoBase64 || "https://via.placeholder.com/300x100?text=Logo";

    // ===============================
    // Procesar cambio de logo
    // ===============================
    logoInput.addEventListener("change", () => {
        const file = logoInput.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            previewLogo.src = reader.result;
            config.logoBase64 = reader.result;
        };
        reader.readAsDataURL(file);
    });

    // ===============================
    // Guardar configuración
    // ===============================
    guardarBtn.addEventListener("click", () => {

        config.nombre = nombreSistema.value.trim();
        config.correoAdmin = correoAdmin.value.trim();
        config.permitirRegistros = permitirRegistros.value;
        config.compatibilidadAuto = compatibilidadAuto.value;

        localStorage.setItem("configSistema", JSON.stringify(config));

        // Mostrar alerta estilizada
        alertDiv.textContent = "¡Configuración guardada correctamente!";
        alertDiv.classList.remove("d-none");
        setTimeout(() => alertDiv.classList.add("d-none"), 2500);
    });

    // ===============================
    // Logout
    // ===============================
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            if (typeof Auth !== "undefined" && Auth.logout) {
                Auth.logout();
            } else {
                window.location.href = "../login.html";
            }
        });
    }

});
