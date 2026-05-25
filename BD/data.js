// ===============================
// data.js — Manejo de datos con Firebase Firestore
// ===============================

const Data = {

    // Helper para obtener datos (mantenemos compatibilidad con estructura de objetos)
    async getDB() {
        // En Firebase no solemos bajar toda la DB de golpe,
        // pero para compatibilidad con código antiguo que espera un objeto 'db':
        const snaps = await Promise.all([
            dbFirestore.collection("usuarios").get(),
            dbFirestore.collection("ofertas").get(),
            dbFirestore.collection("empresas").get(),
            dbFirestore.collection("postulaciones").get()
        ]);

        return {
            usuarios: snaps[0].docs.map(d => d.data()),
            ofertas: snaps[1].docs.map(d => d.data()),
            empresas: snaps[2].docs.map(d => d.data()),
            postulaciones: snaps[3].docs.map(d => ({ id: d.id, ...d.data() }))
        };
    },

    // ===============================
    // USUARIOS
    // ===============================

    async getUserByEmail(email) {
        if (typeof email !== 'string') return null; // Prevención NoSQL Injection
        const doc = await dbFirestore.collection("usuarios").doc(email).get();
        return doc.exists ? doc.data() : null;
    },

    async updateUser(email, newData) {
        if (typeof email !== 'string') return false; // Prevención NoSQL Injection
        try {
            await dbFirestore.collection("usuarios").doc(email).update(newData);
            return true;
        } catch (e) {
            console.error("Error updating user:", e);
            return false;
        }
    },

    async deleteUser(email) {
        if (typeof email !== 'string') return; // Prevención NoSQL Injection
        await dbFirestore.collection("usuarios").doc(email).delete();
    },

    // ===============================
    // PERSISTENCIA GLOBAL (COMPATIBILIDAD)
    // ===============================
    async saveDB(newData) {
        // Esta función es para cuando el admin importa un JSON o resetea
        // Debemos ser cuidadosos. Usaremos lotes (batches) si es posible.
        const batch = dbFirestore.batch();

        if (newData.usuarios) {
            newData.usuarios.forEach(u => {
                const ref = dbFirestore.collection("usuarios").doc(u.correo);
                batch.set(ref, u);
            });
        }
        if (newData.ofertas) {
            newData.ofertas.forEach(o => {
                const ref = dbFirestore.collection("ofertas").doc(String(o.id));
                batch.set(ref, o);
            });
        }
        if (newData.empresas) {
            newData.empresas.forEach(e => {
                const ref = dbFirestore.collection("empresas").doc(e.correo);
                batch.set(ref, e);
            });
        }
        if (newData.postulaciones) {
            newData.postulaciones.forEach(p => {
                const id = `${p.email}_${p.idOferta}`;
                const ref = dbFirestore.collection("postulaciones").doc(id);
                batch.set(ref, p);
            });
        }
        if (newData.config) {
            const ref = dbFirestore.collection("config").doc("sistema");
            batch.set(ref, newData.config);
        }

        await batch.commit();
        return true;
    },

    // ===============================
    // OFERTAS DE EMPLEO
    // ===============================

    async addOferta(oferta) {
        if (!oferta.id) oferta.id = "off_" + Date.now();
        if (!oferta.estado) oferta.estado = "Activa";
        await dbFirestore.collection("ofertas").doc(String(oferta.id)).set(oferta);
    },

    async getOfertas() {
        const snap = await dbFirestore.collection("ofertas").get();
        return snap.docs.map(d => {
            const o = d.data();
            return {
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
            };
        });
    },

    async updateOferta(id, newData) {
        await dbFirestore.collection("ofertas").doc(String(id)).update(newData);
    },

    async deleteOferta(id) {
        await dbFirestore.collection("ofertas").doc(String(id)).delete();
    },

    // ===============================
    // MENSAJERÍA
    // ===============================

    async addMensaje(deOrObject, para, texto, fecha) {
        let msg = {};
        if (typeof deOrObject === 'object' && deOrObject !== null) {
            msg = { ...deOrObject };
        } else {
            msg = {
                de: deOrObject,
                para: para,
                remitente: deOrObject,
                destinatario: para,
                texto: texto,
                fecha: fecha || new Date().toLocaleString()
            };
        }
        
        // Compatibilidad de propiedades
        if (!msg.de) msg.de = msg.remitente;
        if (!msg.para) msg.para = msg.destinatario;
        if (!msg.remitente) msg.remitente = msg.de;
        if (!msg.destinatario) msg.destinatario = msg.para;
        
        msg.timestamp = firebase.firestore.FieldValue.serverTimestamp();
        await dbFirestore.collection("mensajes").add(msg);
    },

    async sendMessage(de, para, texto) {
        await this.addMensaje(de, para, texto);
    },

    // Escuchar mensajes en tiempo real (Bidireccional)
    // Usa dos queries simples (==) para evitar índices compuestos en Firestore
    listenConversacion(email1, email2, callback) {
        if (typeof email1 !== 'string' || typeof email2 !== 'string') return () => {}; // Prevención NoSQL Injection
        let msgs1 = [];
        let msgs2 = [];

        const toFecha = (data) => {
            if (data.timestamp && data.timestamp.toDate) return data.timestamp.toDate().toLocaleString();
            if (data.fecha) return data.fecha;
            return new Date().toLocaleString();
        };

        const merge = () => {
            const combined = [...msgs1, ...msgs2];
            combined.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
            callback(combined);
        };

        // Query 1: email1 → email2
        const unsub1 = dbFirestore.collection("mensajes")
            .where("de", "==", email1)
            .where("para", "==", email2)
            .onSnapshot(snap => {
                msgs1 = snap.docs.map(d => {
                    const data = d.data();
                    return { ...data, fecha: toFecha(data) };
                });
                merge();
            }, err => console.error("Error listenConversacion(1):", err));

        // Query 2: email2 → email1
        const unsub2 = dbFirestore.collection("mensajes")
            .where("de", "==", email2)
            .where("para", "==", email1)
            .onSnapshot(snap => {
                msgs2 = snap.docs.map(d => {
                    const data = d.data();
                    return { ...data, fecha: toFecha(data) };
                });
                merge();
            }, err => console.error("Error listenConversacion(2):", err));

        // Devuelve función para desuscribirse de ambas queries
        return () => { unsub1(); unsub2(); };
    },

    async getMensajesByUser(email) {
        if (typeof email !== 'string') return []; // Prevención NoSQL Injection
        const snap1 = await dbFirestore.collection("mensajes").where("de", "==", email).get();
        const snap2 = await dbFirestore.collection("mensajes").where("para", "==", email).get();
        const all = [...snap1.docs.map(d => d.data()), ...snap2.docs.map(d => d.data())];
        return all.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
    },

    // ===============================
    // POSTULACIONES
    // ===============================

    async addPostulacion(postulacion) {
        const id = `${postulacion.email}_${postulacion.idOferta}`;
        await dbFirestore.collection("postulaciones").doc(id).set(postulacion);
    },

    async getPostulaciones() {
        const snap = await dbFirestore.collection("postulaciones").get();
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    async updatePostulacionEstado(id, nuevoEstado) {
        if (typeof id !== 'string') return false;
        try {
            await dbFirestore.collection("postulaciones").doc(id).update({
                estado: nuevoEstado
            });
            return true;
        } catch (e) {
            console.error("Error al actualizar estado de postulación:", e);
            return false;
        }
    },

    // ===============================
    // HELPERS DE CONSISTENCIA
    // ===============================
    async getContactInfo(email) {
        const supportInfo = {
            nombre: "Soporte Talento Inclusivo",
            foto: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
            rol: "soporte",
            color: "bg-primary"
        };

        if (email === "soporte@talentoinclusivo.com") return supportInfo;

        const user = await this.getUserByEmail(email);
        if (user) {
            return {
                nombre: ((user.nombre || "") + " " + (user.apellido || "")).trim() || email,
                foto: user.foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                rol: user.rol || "usuario",
                color: user.rol === "empresa" ? "bg-orange" : "bg-blue"
            };
        }

        return {
            nombre: email || "Usuario",
            foto: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
            rol: "desconocido",
            color: "bg-secondary"
        };
    },

    // ===============================
    // STORAGE (SIMULADO CON BASE64 PARA PLAN GRATUITO)
    // ===============================

    async uploadFile(path, file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    }

};
