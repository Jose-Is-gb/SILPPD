// ===============================
// config_admin.js — Gestión de configuración del sistema (v2)
// ===============================

document.addEventListener("DOMContentLoaded", () => {
    if (typeof Auth !== "undefined") {
        const user = Auth.getActiveUser();
        if (!user || user.rol !== "admin") {
            window.location.href = "../login.html";
            return;
        }
    }

    // ===============================
    // Helper: Toast notification
    // ===============================
    function showToast(msg, type = "success") {
        const container = document.getElementById("toastContainer");
        const toast = document.createElement("div");
        toast.className = `alert alert-${type} alert-dismissible fade show shadow`;
        toast.style.minWidth = "320px";
        toast.innerHTML = `
            <i class="fa ${type === 'success' ? 'fa-check-circle' : type === 'danger' ? 'fa-exclamation-triangle' : 'fa-info-circle'} me-2"></i>
            ${msg}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
    }

    // ===============================
    // Cargar configuración
    // ===============================
    const config = JSON.parse(localStorage.getItem("configSistema")) || {
        nombre: "Talento Inclusivo",
        correoSistema: "soporte@talentoinclusivo.com",
        permitirRegistros: true,
        compatibilidadAuto: true,
        idioma: "es",
        zonaHoraria: "America/Lima",
        logoBase64: "",
        // Perfil admin
        adminNombre: "Administrador",
        adminApellido: "",
        adminCorreo: "admin@correo.com",
        adminTelefono: "",
        adminFoto: "",
        // Notificaciones
        notifNuevoUsuario: true,
        notifNuevaEmpresa: true,
        notifMensajes: true,
        notifOfertas: false,
        notifResumen: false,
        // Seguridad
        tiempoSesion: "60"
    };

    // ===============================
    // TAB: GENERAL — Init
    // ===============================
    const nombreSistema = document.getElementById("nombreSistema");
    const correoSistema = document.getElementById("correoSistema");
    const permitirRegistros = document.getElementById("permitirRegistros");
    const compatibilidadAuto = document.getElementById("compatibilidadAuto");
    const idioma = document.getElementById("idioma");
    const zonaHoraria = document.getElementById("zonaHoraria");
    const logoInput = document.getElementById("logoSistema");
    const previewLogo = document.getElementById("previewLogo");

    nombreSistema.value = config.nombre;
    correoSistema.value = config.correoSistema;
    permitirRegistros.checked = config.permitirRegistros;
    compatibilidadAuto.checked = config.compatibilidadAuto;
    idioma.value = config.idioma;
    zonaHoraria.value = config.zonaHoraria;
    if (config.logoBase64) previewLogo.src = config.logoBase64;

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

    document.getElementById("guardarGeneral").addEventListener("click", () => {
        config.nombre = nombreSistema.value.trim();
        config.correoSistema = correoSistema.value.trim();
        config.permitirRegistros = permitirRegistros.checked;
        config.compatibilidadAuto = compatibilidadAuto.checked;
        config.idioma = idioma.value;
        config.zonaHoraria = zonaHoraria.value;

        localStorage.setItem("configSistema", JSON.stringify(config));
        showToast("Configuración general guardada correctamente.");
    });

    // ===============================
    // TAB: PERFIL ADMIN — Init
    // ===============================
    const adminNombre = document.getElementById("adminNombre");
    const adminApellido = document.getElementById("adminApellido");
    const adminCorreo = document.getElementById("adminCorreo");
    const adminTelefono = document.getElementById("adminTelefono");
    const adminAvatarPreview = document.getElementById("adminAvatarPreview");
    const adminFotoInput = document.getElementById("adminFotoInput");

    adminNombre.value = config.adminNombre;
    adminApellido.value = config.adminApellido;
    adminCorreo.value = config.adminCorreo;
    adminTelefono.value = config.adminTelefono;

    // Show avatar
    if (config.adminFoto) {
        adminAvatarPreview.innerHTML = `<img src="${config.adminFoto}" alt="Admin">`;
    }

    // Update name in topbar
    document.getElementById("adminNameDisplay").textContent = config.adminNombre || "Administrador";

    adminFotoInput.addEventListener("change", () => {
        const file = adminFotoInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            config.adminFoto = reader.result;
            adminAvatarPreview.innerHTML = `<img src="${reader.result}" alt="Admin">`;
        };
        reader.readAsDataURL(file);
    });

    document.getElementById("guardarPerfil").addEventListener("click", () => {
        config.adminNombre = adminNombre.value.trim();
        config.adminApellido = adminApellido.value.trim();
        config.adminCorreo = adminCorreo.value.trim();
        config.adminTelefono = adminTelefono.value.trim();

        localStorage.setItem("configSistema", JSON.stringify(config));
        document.getElementById("adminNameDisplay").textContent = config.adminNombre;
        showToast("Perfil del administrador actualizado.");
    });

    // ===============================
    // TAB: NOTIFICACIONES — Init
    // ===============================
    const notifFields = ["notifNuevoUsuario", "notifNuevaEmpresa", "notifMensajes", "notifOfertas", "notifResumen"];
    notifFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = config[id] || false;
    });

    document.getElementById("guardarNotif").addEventListener("click", () => {
        notifFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) config[id] = el.checked;
        });
        localStorage.setItem("configSistema", JSON.stringify(config));
        showToast("Preferencias de notificación guardadas.");
    });

    // ===============================
    // TAB: SEGURIDAD
    // ===============================
    // Cargar contraseña actual del admin
    const dbSeg = Data.getDB();
    const adminUser = dbSeg.usuarios.find(u => u.rol === "admin");
    const passActualInput = document.getElementById("passActual");
    // El admin puede estar hardcodeado en auth.js o en la BD
    if (adminUser && adminUser.password) {
        passActualInput.value = adminUser.password;
    } else {
        // Contraseña por defecto del sistema
        passActualInput.value = "admin123";
    }
    passActualInput.type = "text"; // Mostrar en texto plano por defecto

    // Toggle password visibility
    document.querySelectorAll(".toggle-pass").forEach(btn => {
        btn.addEventListener("click", () => {
            const input = btn.previousElementSibling;
            if (input.type === "password") {
                input.type = "text";
                btn.innerHTML = '<i class="fa fa-eye-slash"></i>';
            } else {
                input.type = "password";
                btn.innerHTML = '<i class="fa fa-eye"></i>';
            }
        });
    });

    // Password strength meter
    const passNueva = document.getElementById("passNueva");
    const passStrength = document.getElementById("passStrength");
    const passStrengthText = document.getElementById("passStrengthText");

    passNueva.addEventListener("input", () => {
        const val = passNueva.value;
        let strength = 0;
        if (val.length >= 6) strength += 25;
        if (val.length >= 10) strength += 15;
        if (/[A-Z]/.test(val)) strength += 20;
        if (/[0-9]/.test(val)) strength += 20;
        if (/[^A-Za-z0-9]/.test(val)) strength += 20;

        passStrength.style.width = strength + "%";
        if (strength < 30) {
            passStrength.className = "progress-bar bg-danger";
            passStrengthText.textContent = "Débil";
            passStrengthText.className = "text-danger small";
        } else if (strength < 60) {
            passStrength.className = "progress-bar bg-warning";
            passStrengthText.textContent = "Media";
            passStrengthText.className = "text-warning small";
        } else if (strength < 80) {
            passStrength.className = "progress-bar bg-info";
            passStrengthText.textContent = "Buena";
            passStrengthText.className = "text-info small";
        } else {
            passStrength.className = "progress-bar bg-success";
            passStrengthText.textContent = "Fuerte";
            passStrengthText.className = "text-success small";
        }

        if (!val) {
            passStrengthText.textContent = "";
        }
    });

    document.getElementById("guardarSeguridad").addEventListener("click", () => {
        const actual = document.getElementById("passActual").value;
        const nueva = passNueva.value;
        const confirm = document.getElementById("passConfirm").value;

        if (!actual) return showToast("Ingresa tu contraseña actual.", "danger");
        if (nueva.length < 6) return showToast("La nueva contraseña debe tener al menos 6 caracteres.", "danger");
        if (nueva !== confirm) return showToast("Las contraseñas no coinciden.", "danger");

        // Check current password against DB
        const db = Data.getDB();
        const admin = db.usuarios.find(u => u.rol === "admin");
        if (admin && admin.password !== actual) {
            return showToast("La contraseña actual es incorrecta.", "danger");
        }

        // Update password
        if (admin) {
            admin.password = nueva;
            Data.saveDB(db);
        }

        // Save session timeout
        config.tiempoSesion = document.getElementById("tiempoSesion").value;
        localStorage.setItem("configSistema", JSON.stringify(config));

        document.getElementById("passActual").value = "";
        passNueva.value = "";
        document.getElementById("passConfirm").value = "";
        passStrength.style.width = "0%";
        passStrengthText.textContent = "";

        showToast("Contraseña actualizada exitosamente.");
    });

    // Init session timeout
    document.getElementById("tiempoSesion").value = config.tiempoSesion || "60";

    // ===============================
    // TAB: DATOS — Stats
    // ===============================
    const db = Data.getDB();
    document.getElementById("statUsuarios").textContent = (db.usuarios || []).length;
    document.getElementById("statEmpresas").textContent = (db.empresas || []).length;
    document.getElementById("statOfertas").textContent = (db.ofertas || []).length;

    // Export DB
    document.getElementById("btnExportarDB").addEventListener("click", () => {
        const data = JSON.stringify(db, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `talento_inclusivo_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("Base de datos exportada correctamente.");
    });

    // Import DB
    const importFile = document.getElementById("importFile");
    document.getElementById("btnImportarDB").addEventListener("click", () => importFile.click());

    importFile.addEventListener("change", () => {
        const file = importFile.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const imported = JSON.parse(reader.result);
                if (!imported.usuarios || !imported.empresas) {
                    return showToast("El archivo no tiene el formato correcto.", "danger");
                }
                if (!window.confirm("¿Estás seguro? Esto reemplazará TODOS los datos actuales.")) return;

                Data.saveDB(imported);
                showToast("Datos importados correctamente. Recargando...");
                setTimeout(() => location.reload(), 1500);
            } catch (e) {
                showToast("Error al leer el archivo: " + e.message, "danger");
            }
        };
        reader.readAsText(file);
    });

    // Reset DB
    document.getElementById("btnResetDB").addEventListener("click", () => {
        if (!confirm("⚠️ ¿Estás seguro? Esto eliminará TODOS los datos y restaurará los datos iniciales.")) return;
        if (!confirm("Esta acción es IRREVERSIBLE. ¿Continuar?")) return;

        localStorage.removeItem("TI_DATABASE");
        localStorage.removeItem("configSistema");
        localStorage.removeItem("admin_marcados");
        showToast("Base de datos reseteada. Recargando...", "warning");
        setTimeout(() => location.reload(), 1500);
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
