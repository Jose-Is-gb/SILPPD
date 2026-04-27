// ===============================
// migrate.js — Herramienta de migración LocalStorage -> Firestore
// ===============================

const Migration = {
    async run() {
        console.log("🚀 Iniciando migración a la nube...");
        
        const localData = JSON.parse(localStorage.getItem("TI_DATABASE"));
        if (!localData) {
            console.warn("⚠️ No hay datos en LocalStorage para migrar.");
            return;
        }

        // 1. Migrar Usuarios
        if (localData.usuarios) {
            console.log(`👥 Migrando ${localData.usuarios.length} usuarios...`);
            for (const u of localData.usuarios) {
                // Nota: Firebase Auth requiere crear los usuarios uno por uno manualmente o via Admin SDK.
                // Aquí solo migramos sus PERFILES a Firestore. 
                // El usuario deberá registrarse de nuevo o usaremos una contraseña genérica si forzamos el Auth (no recomendado sin Admin SDK).
                await dbFirestore.collection("usuarios").doc(u.correo).set({
                    ...u,
                    migrado: true
                });
            }
        }

        // 2. Migrar Ofertas
        if (localData.ofertas) {
            console.log(`💼 Migrando ${localData.ofertas.length} ofertas...`);
            for (const o of localData.ofertas) {
                await dbFirestore.collection("ofertas").doc(String(o.id)).set(o);
            }
        }

        // 3. Migrar Mensajes
        if (localData.mensajes) {
            console.log(`💬 Migrando ${localData.mensajes.length} mensajes...`);
            for (const m of localData.mensajes) {
                await dbFirestore.collection("mensajes").add({
                    ...m,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        }

        // 4. Migrar Postulaciones
        if (localData.postulaciones) {
            console.log(`📄 Migrando ${localData.postulaciones.length} postulaciones...`);
            for (const p of localData.postulaciones) {
                const id = `${p.email}_${p.idOferta}`;
                await dbFirestore.collection("postulaciones").doc(id).set(p);
            }
        }

        console.log("✅ Migración completada. Ya puedes usar la base de datos en la nube.");
        alert("Migración completada con éxito. Los datos ahora están en Firestore.");
    }
};
