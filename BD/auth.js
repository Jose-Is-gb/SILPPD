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

    // Iniciar sesión (usuario o empresa)
    login(email, password) {
        const db = JSON.parse(localStorage.getItem("TI_DATABASE")) || { usuarios: [], empresas: [] };
        
        // 1. Buscar en usuarios (donde deberían estar todos con el nuevo sistema de roles)
        let user = db.usuarios.find(u => u.correo === email && u.password === password);

        // 2. Si no está en usuarios, buscar en empresas (legado) y migrar si coincide
        if (!user && db.empresas) {
            const company = db.empresas.find(e => e.correo === email);
            // Las empresas legadas no tienen password en init_data.js, permitimos '123456' por defecto o el que se use academicamente
            if (company && (password === "123456")) {
                user = { ...company, rol: "empresa", password: "123456" };
                db.usuarios.push(user);
                db.empresas = db.empresas.filter(e => e.correo !== email);
                localStorage.setItem("TI_DATABASE", JSON.stringify(db));
            }
        }

        if (user) {
            this.setActiveUser(user);
            return user;
        }

        return null;
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
        postulaciones: (rol === "usuario" ? [] : undefined),
        ofertas: (rol === "empresa" ? [] : undefined)
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
