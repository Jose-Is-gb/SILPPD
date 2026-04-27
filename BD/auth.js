// ===============================
// auth.js — Manejo de autenticación y sesiones con Firebase
// ===============================

const Auth = {
    // Verifica si hay una sesión activa de forma sincrónica (desde cache local)
    getActiveUser() {
        const user = localStorage.getItem("activeUser");
        return user ? JSON.parse(user) : null;
    },

    // Guardar sesión localmente para acceso rápido
    setActiveUser(user) {
        localStorage.setItem("activeUser", JSON.stringify(user));
    },

    // Cerrar sesión
    async logout() {
        try {
            await authFirebase.signOut();
        } catch (e) {
            console.error("Error al cerrar sesión en Firebase:", e);
        }
        localStorage.removeItem("activeUser");
        window.location.href = "../login.html";
    },

    // Iniciar sesión con Firebase
    async login(email, password) {
        try {
            const userCredential = await authFirebase.signInWithEmailAndPassword(email, password);
            const fbUser = userCredential.user;

            // Al iniciar sesión, buscamos el perfil extendido en Firestore
            const userDoc = await dbFirestore.collection("usuarios").doc(fbUser.email).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                this.setActiveUser(userData);
                return userData;
            } else {
                // Si no existe el doc en Firestore (pero sí en Auth), creamos uno básico
                const basicUser = { nombre: fbUser.displayName || "Usuario", correo: fbUser.email, rol: "usuario" };
                this.setActiveUser(basicUser);
                return basicUser;
            }
        } catch (error) {
            console.error("Error Login:", error.code, error.message);
            return null;
        }
    },

    // Registrar usuario en Firebase Auth + Firestore
    async registerUser(nombre, email, password, discapacidad = "", rol = "usuario", extraData = {}) {
        try {
            // 1. Crear usuario en Firebase Auth
            const userCredential = await authFirebase.createUserWithEmailAndPassword(email, password);
            const fbUser = userCredential.user;

            // 2. Crear perfil en Firestore
            const profile = {
                nombre,
                correo: email,
                discapacidad,
                rol,
                fechaRegistro: new Date().toLocaleDateString("es-PE"),
                foto: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                ...extraData // Inyectamos todos los datos adicionales que vengan del form
            };

            await dbFirestore.collection("usuarios").doc(email).set(profile);
            
            this.setActiveUser(profile);
            return true;
        } catch (error) {
            console.error("Error Registro:", error.code, error.message);
            alert("Error al registrar: " + error.message);
            return false;
        }
    },

    // Login Admin (usando Firebase)
    async loginAdmin(email, password) {
        const user = await this.login(email, password);
        if (user && user.rol === "admin") {
            return true;
        }
        if (user) {
            await this.logout(); // No es admin
        }
        return false;
    }
};
