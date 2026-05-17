document.addEventListener("DOMContentLoaded", async () => {
    // RBAC: Solo usuarios con rol 'admin' pueden acceder
    const adminUser = await Auth.requireRole("admin", "../login.html");
    if (!adminUser) return;

    // 2. Variables y Toast
    function showToast(msg, type = "success") {
        const container = document.getElementById("toastContainer");
        if (!container) return;
        const toast = document.createElement("div");
        toast.className = `alert alert-${type} alert-dismissible fade show shadow`;
        toast.innerHTML = `<i class="fa fa-info-circle me-2"></i>${msg}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // 3. Cargar Datos (Asíncrono)
    const db = await Data.getDB();
    const config = db.config || {
        nombre: "Talento Inclusivo",
        correoSistema: "soporte@talentoinclusivo.com",
        adminNombre: "Administrador"
    };

    // Init UI
    document.getElementById("nombreSistema").value = config.nombre;
    document.getElementById("correoSistema").value = config.correoSistema;
    document.getElementById("adminNombre").value = config.adminNombre;
    document.getElementById("adminNameDisplay").textContent = config.adminNombre;

    // 4. Guardar Cambios
    document.getElementById("guardarGeneral").onclick = async () => {
        const newConfig = {
            ...config,
            nombre: document.getElementById("nombreSistema").value.trim(),
            correoSistema: document.getElementById("correoSistema").value.trim()
        };
        // En una implementación real, guardaríamos esto en una colección config de Firestore
        // Aquí simulamos guardándolo en el objeto db central
        db.config = newConfig;
        await Data.saveDB(db);
        showToast("Configuración general guardada.");
    };

    document.getElementById("guardarPerfil").onclick = async () => {
        const newAdminNombre = document.getElementById("adminNombre").value.trim();
        db.config.adminNombre = newAdminNombre;
        await Data.saveDB(db);
        document.getElementById("adminNameDisplay").textContent = newAdminNombre;
        showToast("Perfil actualizado.");
    };

    // 5. Gestión de Datos
    document.getElementById("statUsuarios").textContent = (db.usuarios || []).length;
    document.getElementById("statEmpresas").textContent = (db.empresas || []).length;
    document.getElementById("statOfertas").textContent = (db.ofertas || []).length;

    document.getElementById("btnExportarDB").onclick = () => {
        const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "backup_silppd.json";
        a.click();
    };

    document.getElementById("btnResetDB").onclick = async () => {
        if (!confirm("⚠️ ¿Resetear base de datos?")) return;
        localStorage.clear();
        location.reload();
    };

    document.getElementById("logoutBtn").onclick = async () => await Auth.logout();
});
