// ===============================
// auth.js — Manejo de autenticación y sesiones
// ===============================

// Objeto global Auth
const Auth = {
    // Verifica si hay una sesión activa
    getActiveUser() {
        return JSON.parse(localStorage.getItem("activeUser")) || null;
    },

    // Guardar sesión
    setActiveUser(user) {
        localStorage.setItem("activeUser", JSON.stringify(user));
    },

    // Cerrar sesión
    logout() {
        localStorage.removeItem("activeUser");
        window.location.href = "../login.html";
    },

    // Iniciar sesión (usuario)
    login(email, password) {
        const db = JSON.parse(localStorage.getItem("TI_DATABASE")) || { usuarios: [] };
        const user = db.usuarios.find(u => u.correo === email && u.password === password);

        if (user) {
            this.setActiveUser(user); // ✅ guarda sesión
            return user; // devuelve el objeto usuario
        }

        return null; // credenciales incorrectas
    },

    // Registrar usuario (devuelve true si se registró correctamente)
    // Registrar usuario (devuelve true si se registró correctamente)
    registerUser(nombre, email, password, discapacidad = "", rol = "usuario") {
    const db = JSON.parse(localStorage.getItem("TI_DATABASE")) || { usuarios: [] };

    // Evitar duplicados
    if (db.usuarios.some(u => u.correo === email)) {
        return false;
    }

    db.usuarios.push({
        id: db.usuarios.length ? db.usuarios[db.usuarios.length - 1].id + 1 : 1,
        nombre,
        correo: email,
        password,
        discapacidad,
        rol,
        fechaRegistro: new Date().toLocaleDateString("es-PE"),
        postulaciones: []
    });

    localStorage.setItem("TI_DATABASE", JSON.stringify(db));
    return true;
},


    // Iniciar sesión como administrador
    loginAdmin(email, password) {
        const ADMIN_EMAIL = "admin@talentoinclusivo.com";
        const ADMIN_PASS = "admin123";

        if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
            const adminUser = { nombre: "Administrador", correo: ADMIN_EMAIL, rol: "admin" };
            this.setActiveUser(adminUser); // ✅ guarda sesión de admin
            return true;
        }
        return false;
    }

    
};
