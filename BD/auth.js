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

            // Si es empresa, también la guardamos en la colección 'empresas'
            if (rol === "empresa") {
                const empresaDoc = {
                    correo: email,
                    nombre,
                    ...extraData,
                    fechaRegistro: profile.fechaRegistro
                };
                await dbFirestore.collection("empresas").doc(email).set(empresaDoc);
            }

            this.setActiveUser(profile);
            return true;
        } catch (error) {
            console.error("Error Registro:", error.code, error.message);
            alert("Error al registrar: " + error.message);
            return false;
        }
    },

    // Login Admin (desglosado para diagnóstico)
    async loginAdmin(email, password) {
        try {
            const userCredential = await authFirebase.signInWithEmailAndPassword(email, password);
            const fbUser = userCredential.user;
            
            const userDoc = await dbFirestore.collection("usuarios").doc(fbUser.email).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                if (userData.rol === "admin") {
                    this.setActiveUser(userData);
                    return { success: true };
                } else {
                    await this.logout();
                    return { success: false, error: "Tu cuenta no tiene permisos de Administrador (rol: " + userData.rol + ")" };
                }
            } else {
                await this.logout();
                return { success: false, error: "No existe un perfil de datos para este admin en Firestore." };
            }
        } catch (error) {
            let msg = "Error de autenticación";
            if (error.code === "auth/user-not-found") msg = "El usuario no existe en Firebase Authentication. Créalo en la consola.";
            if (error.code === "auth/wrong-password") msg = "La contraseña es incorrecta.";
            if (error.code === "auth/invalid-email") msg = "El correo no tiene un formato válido.";
            return { success: false, error: msg };
        }
    }
};
