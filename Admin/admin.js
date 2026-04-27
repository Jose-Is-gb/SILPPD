document.addEventListener("DOMContentLoaded", async () => {
    if (typeof Auth !== "undefined") {
        const user = Auth.getActiveUser();
        if (!user || user.rol !== "admin") {
            window.location.href = "../login.html";
            return;
        }
    }

    // --- Cargar datos de la nube ---
    async function cargarEstadisticas() {
        try {
            const db = await Data.getDB();

            const setText = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value;
            };

            setText("countUsuarios", db.usuarios.length);
            setText("countOfertas", db.ofertas.length);
            setText("countEmpresas", db.empresas.length);
            setText("countPostulaciones", db.postulaciones ? db.postulaciones.length : 0);

            await cargarActividadReciente(db);
        } catch (e) {
            console.error("Error al cargar estadísticas admin:", e);
        }
    }

    async function cargarActividadReciente(db) {
        const listaActividad = document.getElementById("actividadReciente");
        const actividades = [];

        const parseFecha = (val) => {
            if (!val) return new Date();
            if (typeof val === 'string' && val.includes('/')) {
                const parts = val.split('/');
                if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]);
            }
            const d = new Date(val);
            return isNaN(d.getTime()) ? new Date() : d;
        };

        // --- Últimos usuarios registrados ---
        db.usuarios.slice(-5).forEach(u => {
            actividades.push({
                tipo: "Usuario",
                mensaje: `Nuevo usuario: <strong>${u.nombre}</strong>`,
                fecha: parseFecha(u.fechaRegistro),
                email: u.correo
            });
        });

        // --- Últimas ofertas ---
        db.ofertas.slice(-5).forEach(o => {
            actividades.push({
                tipo: "Oferta",
                mensaje: `Oferta: <strong>${o.titulo}</strong>`,
                fecha: parseFecha(o.fecha || o.fechaPublicacion),
                email: o.empresaEmail || "soporte@talentoinclusivo.com"
            });
        });

        // --- Ordenar por fecha ---
        actividades.sort((a, b) => b.fecha - a.fecha);
        const recientes = actividades.slice(0, 5);

        listaActividad.innerHTML = "";

        if (recientes.length === 0) {
            listaActividad.innerHTML = `<li class="list-group-item text-muted">No hay actividad reciente.</li>`;
            return;
        }

        for (const a of recientes) {
            try {
                const info = await Data.getContactInfo(a.email);
                const li = document.createElement("li");
                li.className = "list-group-item d-flex align-items-center justify-content-between py-3";
                li.innerHTML = `
                    <div class="d-flex align-items-center">
                        <img src="${info.foto}" class="rounded-circle me-3" style="width: 32px; height: 32px; object-fit: cover;">
                        <span>${a.mensaje}</span>
                    </div>
                    <small class="text-muted pe-2">${a.fecha ? a.fecha.toLocaleDateString("es-PE") : "—"}</small>
                `;
                listaActividad.appendChild(li);
            } catch (err) {
                console.error("Error al renderizar actividad:", err);
            }
        }
    }

    // --- Migración automática: sincroniza empresas desde 'usuarios' → 'empresas' ---
    async function repairAndLoad() {
        try {
            console.log("🔍 Verificando colección 'empresas'...");

            // 1. Traer todos los usuarios y filtrar por rol='empresa' en JS (sin necesidad de índice)
            const todosSnap = await dbFirestore.collection("usuarios").get();
            const empresasDeUsuarios = todosSnap.docs
                .map(d => d.data())
                .filter(u => u.rol === "empresa");

            if (empresasDeUsuarios.length > 0) {
                // 2. Ver cuáles ya existen en la colección 'empresas'
                const empresasSnap = await dbFirestore.collection("empresas").get();
                const correosYaMigrados = new Set(empresasSnap.docs.map(d => d.id));

                let migrados = 0;
                for (const userData of empresasDeUsuarios) {
                    const correo = userData.correo || userData.email;
                    if (correo && !correosYaMigrados.has(correo)) {
                        await dbFirestore.collection("empresas").doc(correo).set({
                            correo,
                            nombre: userData.nombre || userData.razonSocial || "Empresa",
                            ...userData
                        });
                        migrados++;
                        console.log(`✅ Empresa migrada: ${correo}`);
                    }
                }

                if (migrados > 0) {
                    console.log(`🏭 Migración completa: ${migrados} empresa(s) copiadas.`);
                } else {
                    console.log("✔️ Colección 'empresas' ya sincronizada.");
                }
            } else {
                console.log("ℹ️ No hay usuarios con rol=empresa en Firestore.");
            }

            // 3. También migrar las empresas de ejemplo de window.data (init_data.js) e insertarlas en Auth y 'usuarios'
            if (window.data && Array.isArray(window.data.empresas)) {
                // Chequear usuarios de Firebase en lugar de empresas para esta parte
                const usuariosSnap2 = await dbFirestore.collection("usuarios").get();
                const usuariosExistentes = new Set(usuariosSnap2.docs.map(d => d.id));
                const API_KEY = firebase.app().options.apiKey; // Tomar la llave de la config actual

                for (const emp of window.data.empresas) {
                    const correo = emp.correo;
                    const password = emp.password || "Empresa123*";
                    
                    if (correo && !usuariosExistentes.has(correo)) {
                        // A) Guardar en 'empresas'
                        await dbFirestore.collection("empresas").doc(correo).set(emp);
                        
                        // B) Guardar en 'usuarios' para que auth.js aplique el rol 'empresa'
                        await dbFirestore.collection("usuarios").doc(correo).set({
                           nombre: emp.nombre,
                           correo: correo,
                           rol: "empresa" 
                        });

                        // C) Crear cuenta en Firebase Auth silenciosamente (REST API)
                        try {
                            const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: correo, password: password, returnSecureToken: false })
                            });
                            if (res.ok) {
                                console.log(`✅ Cuenta de Auth creada para: ${correo}`);
                            } else {
                                const errData = await res.json();
                                if (errData.error && errData.error.message !== "EMAIL_EXISTS") {
                                    console.log(`⚠️ Error auth REST (${correo}): ${errData.error.message}`);
                                }
                            }
                        } catch (e) {
                            console.log("Error de red creando Auth:", e);
                        }

                        console.log(`✅ Empresa de ejemplo migrada: ${correo}`);
                    }
                }
            }


            await cargarEstadisticas();
        } catch (e) {
            console.error("Error en reparación admin:", e);
        }
    }

    // Inicializar
    await repairAndLoad();

    // --- Logout ---
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            await Auth.logout();
        });
    }
});
