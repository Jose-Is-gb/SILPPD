// ===============================
// data.js — Manejo general de la base de datos local
// ===============================

const Data = {

    // Obtener base de datos completa desde localStorage
    getDB() {
        let db = JSON.parse(localStorage.getItem("TI_DATABASE"));

        if (!db) {
            // Crear estructura base
            db = {
                usuarios: [],
                ofertas: [],
                mensajes: [],
                empresas: [],
                postulaciones: []
            };
        }

        // Asegurar claves básicas
        if (!db.usuarios) db.usuarios = [];
        if (!db.empresas) db.empresas = [];
        if (!db.postulaciones) db.postulaciones = [];
        if (!db.mensajes) db.mensajes = [];
        if (!db.ofertas) db.ofertas = [];

        // ===============================
        // INSERTAR USUARIOS INICIALES (solo si no existen)
        // ===============================
        if (db.usuarios.length === 0) {
            db.usuarios.push(
                {
                    nombre: "Juan Pérez",
                    apellido: "García",
                    correo: "juan@example.com",
                    password: "123456",
                    telefono: "987654321",
                    descripcion: "Buscando oportunidades inclusivas en el sector tecnológico.",
                    discapacidad: "Motora",
                    fechaRegistro: new Date().toLocaleDateString(),
                    foto: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                    rol: "usuario"
                },
                {
                    nombre: "María López",
                    apellido: "Ramírez",
                    correo: "maria@example.com",
                    password: "abcdef",
                    telefono: "912345678",
                    descripcion: "Profesional con experiencia en diseño accesible.",
                    discapacidad: "Visual",
                    fechaRegistro: new Date().toLocaleDateString(),
                    foto: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                    rol: "usuario"
                }
            );
        }

        localStorage.setItem("TI_DATABASE", JSON.stringify(db));
        return db;
    },

    // Guardar base de datos en localStorage
    saveDB(db) {
        localStorage.setItem("TI_DATABASE", JSON.stringify(db));
    },

    // ===============================
    // USUARIOS
    // ===============================

    getUserByEmail(email) {
        const db = this.getDB();
        return db.usuarios.find(u => u.correo === email) || null;
    },

    updateUser(email, newData) {
        const db = this.getDB();
        const index = db.usuarios.findIndex(u => u.correo === email);
        if (index !== -1) {
            db.usuarios[index] = { ...db.usuarios[index], ...newData };
            this.saveDB(db);
            return true;
        }
        return false;
    },

    addUser(user) {
        const db = this.getDB();
        db.usuarios.push(user);
        this.saveDB(db);
    },

    deleteUser(email) {
        const db = this.getDB();
        db.usuarios = db.usuarios.filter(u => u.correo !== email);
        this.saveDB(db);
    },

    // ===============================
    // OFERTAS DE EMPLEO
    // ===============================

    addOferta(oferta) {
        const db = this.getDB();
        if (!oferta.estado) oferta.estado = "Activa";
        oferta.discapacidad = oferta.discapacidad?.trim();
        oferta.categoria = oferta.categoria?.trim();
        oferta.modalidad = oferta.modalidad?.trim();
        db.ofertas.push(oferta);
        this.saveDB(db);
    },

    getOfertas() {
        const db = this.getDB();

        db.ofertas = db.ofertas.map(o => ({
            id: o.id,
            titulo: o.titulo || o.puesto || "Sin título",
            empresa: o.empresa,
            categoria: o.categoria || "General",
            descripcion: o.descripcion || `Oferta de ${o.titulo || o.puesto}`,
            ciudad: o.ciudad || "No especificado",
            modalidad: o.modalidad || "Presencial",
            discapacidad: o.discapacidad || "No especificado",
            estado: o.estado || "Activa",
            fecha: o.fecha || o.fechaCreacion?.split("T")[0] || new Date().toISOString().split("T")[0]
        }));

        this.saveDB(db);
        return db.ofertas;
    },

    updateOferta(id, newData) {
        const db = this.getDB();
        const index = db.ofertas.findIndex(o => o.id === id);
        if (index !== -1) {
            db.ofertas[index] = { ...db.ofertas[index], ...newData };
            this.saveDB(db);
        }
    },

    deleteOferta(id) {
        const db = this.getDB();
        db.ofertas = db.ofertas.filter(o => o.id !== id);
        this.saveDB(db);
    },

    // ===============================
    // MENSAJERÍA
    // ===============================

    addMensaje(mensaje) {
        const db = this.getDB();
        db.mensajes.push(mensaje);
        this.saveDB(db);
    },

    getMensajesByUser(email) {
        const db = this.getDB();
        return db.mensajes.filter(m => m.para === email || m.de === email);
    },

    // ===============================
    // POSTULACIONES
    // ===============================

    addPostulacion(postulacion) {
        const db = this.getDB();
        if (!db.postulaciones) db.postulaciones = [];

        const existe = db.postulaciones.some(
            p => p.email === postulacion.email && p.idOferta === postulacion.idOferta
        );

        if (!existe) {
            db.postulaciones.push(postulacion);
            this.saveDB(db);
        }
    },

    getPostulaciones() {
        const db = this.getDB();
        return db.postulaciones || [];
    }

};
