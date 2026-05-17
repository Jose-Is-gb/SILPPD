document.addEventListener("DOMContentLoaded", async () => {
    // RBAC: Solo usuarios con rol 'admin' pueden acceder
    const adminUser = await Auth.requireRole("admin", "../login.html");
    if (!adminUser) return;

    // 2. Variables
    const soporteEmail = "soporte@talentoinclusivo.com";
    const contactsList = document.getElementById("contactsList");
    const chatMessages = document.getElementById("chatMessages");
    const adminMsgInput = document.getElementById("adminMsgInput");
    const adminSendBtn = document.getElementById("adminSendBtn");
    const chatHeaderContainer = document.getElementById("chatHeaderContainer");
    const noChatSelected = document.getElementById("noChatSelected");
    const searchInput = document.getElementById("searchChats");

    let activeChatEmail = null;
    let unsubscribeActiveChat = null;
    let currentTypeFilter = 'Todos';

    // 3. Renderizar Lista de Contactos — muestra TODOS los usuarios/empresas de Firestore
    async function renderContacts(query = "") {
        contactsList.innerHTML = `<div class="p-4 text-center text-muted small"><div class="spinner-border spinner-border-sm me-2" role="status"></div>Cargando...</div>`;
        const db = await Data.getDB();
        contactsList.innerHTML = "";

        // Mapa de último mensaje por correo
        const allMsgs = db.mensajes || [];
        const lastMsgMap = {};
        allMsgs.forEach(m => {
            const otherEmail = m.remitente === soporteEmail ? m.destinatario : (m.destinatario === soporteEmail ? m.remitente : null);
            if (!otherEmail) return;
            if (!lastMsgMap[otherEmail] || (m.timestamp?.seconds || 0) > (lastMsgMap[otherEmail].timestamp?.seconds || 0)) {
                lastMsgMap[otherEmail] = m;
            }
        });

        // Construir lista completa: usuarios + empresas (sin duplicados, sin admin/soporte)
        const seen = new Set();
        const allContacts = [];

        (db.usuarios || []).forEach(u => {
            if (!u.correo || u.correo === soporteEmail || u.rol === 'admin' || seen.has(u.correo)) return;
            seen.add(u.correo);
            allContacts.push({
                nombre: ((u.nombre || '') + ' ' + (u.apellido || '')).trim() || u.correo,
                email: u.correo,
                rol: u.rol || 'usuario',
                foto: u.foto || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                lastMsg: lastMsgMap[u.correo] || null
            });
        });

        (db.empresas || []).forEach(e => {
            if (!e.correo || e.correo === soporteEmail || seen.has(e.correo)) return;
            seen.add(e.correo);
            allContacts.push({
                nombre: e.nombre || e.razonSocial || e.correo,
                email: e.correo,
                rol: 'empresa',
                foto: e.foto || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                lastMsg: lastMsgMap[e.correo] || null
            });
        });

        // Filtrar por búsqueda y por pestaña activa
        let contacts = allContacts.filter(c => {
            const matchQuery = !query ||
                c.nombre.toLowerCase().includes(query.toLowerCase()) ||
                c.email.toLowerCase().includes(query.toLowerCase());
            const matchFilter = currentTypeFilter === 'Todos' || c.rol === currentTypeFilter.toLowerCase();
            return matchQuery && matchFilter;
        });

        // Ordenar: con mensajes primero (por recencia), luego el resto alfabéticamente
        contacts.sort((a, b) => {
            const ta = a.lastMsg?.timestamp?.seconds || 0;
            const tb = b.lastMsg?.timestamp?.seconds || 0;
            if (ta !== tb) return tb - ta;
            return a.nombre.localeCompare(b.nombre);
        });

        if (contacts.length === 0) {
            contactsList.innerHTML = `<div class="p-4 text-center text-muted small">No se encontraron contactos.</div>`;
            return;
        }

        contacts.forEach(c => {
            const div = document.createElement('div');
            div.className = `contact-item d-flex gap-3 p-3 border-bottom ${activeChatEmail === c.email ? 'active' : ''}`;
            div.style.cursor = 'pointer';
            div.onclick = () => selectChat(c.email, c.nombre, c.foto);

            const hora = c.lastMsg?.fecha ? c.lastMsg.fecha.split(',')[1]?.trim() || '' : '';
            const preview = c.lastMsg ? c.lastMsg.texto : 'Sin mensajes previos';
            const badgeClass = c.rol === 'empresa' ? 'bg-warning text-dark' : 'bg-primary';

            div.innerHTML = `
                <img src="${c.foto}" class="rounded-circle flex-shrink-0" style="width:42px;height:42px;object-fit:cover;">
                <div class="flex-grow-1 overflow-hidden">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <h6 class="mb-0 fw-semibold small text-truncate">${c.nombre}</h6>
                        <small class="text-muted" style="font-size:0.7rem;white-space:nowrap;">${hora}</small>
                    </div>
                    <p class="mb-1 text-muted small text-truncate" style="font-size:0.78rem;">${preview}</p>
                    <span class="badge ${badgeClass} rounded-pill" style="font-size:0.65rem;">${c.rol.toUpperCase()}</span>
                </div>
            `;
            contactsList.appendChild(div);
        });
    }
 
    // 4. Seleccionar Chat
    async function selectChat(email, nombre, foto) {
        if (unsubscribeActiveChat) unsubscribeActiveChat();
        activeChatEmail = email;
 
        noChatSelected.classList.add("d-none");
        chatHeaderContainer.classList.remove("d-none");
        chatHeaderContainer.classList.add("d-flex");
 
        document.getElementById("chatName").textContent = nombre;
        document.getElementById("chatAvatar").innerHTML = `<img src="${foto}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;

        // Cargar datos dinámicos del contacto
        const info = await Data.getContactInfo(email);
        const contactUser = await Data.getUserByEmail(email);
        
        const chatTag = document.getElementById("chatTag");
        if (chatTag) {
            chatTag.textContent = info.rol.toUpperCase();
            chatTag.className = info.rol === "empresa" ? "badge bg-warning text-dark rounded-pill px-2 py-1" : "badge bg-primary text-white rounded-pill px-2 py-1";
        }
        
        const chatDocLabel = document.getElementById("chatDocLabel");
        const chatDocValue = document.getElementById("chatDocValue");
        if (chatDocLabel && chatDocValue) {
            if (info.rol === "empresa") {
                chatDocLabel.textContent = "RUC";
                chatDocValue.textContent = (contactUser && contactUser.ruc) || "No registrado";
            } else {
                chatDocLabel.textContent = "Discapacidad";
                chatDocValue.textContent = (contactUser && contactUser.discapacidad) || "No especificada";
            }
        }
        
        const chatEmpresaEstado = document.getElementById("chatEmpresaEstado");
        if (chatEmpresaEstado) {
            const estadoVal = (contactUser && contactUser.estado) || "Activo";
            chatEmpresaEstado.textContent = estadoVal;
            chatEmpresaEstado.className = estadoVal === "Verificada" || estadoVal === "Aprobada" ? "text-success fw-bold" : "text-warning fw-bold";
        }
 
        // Suscribirse a mensajes en tiempo real
        unsubscribeActiveChat = Data.listenConversacion(soporteEmail, email, (msgs) => {
            renderMessages(msgs);
            renderContacts(searchInput.value); // Refresh list for last msg
        });
    }

    function renderMessages(msgs) {
        chatMessages.innerHTML = "";
        msgs.forEach(m => {
            const isMe = m.remitente === soporteEmail;
            const div = document.createElement("div");
            div.className = `d-flex mb-3 ${isMe ? 'justify-content-end' : 'justify-content-start'}`;
            div.innerHTML = `
                <div class="${isMe ? 'msg-sent' : 'msg-received'} shadow-sm">
                    <div class="p-2 px-3 rounded-4 ${isMe ? 'bg-primary text-white' : 'bg-white text-dark border'}">
                        ${m.texto}
                        <div class="text-end x-small mt-1 opacity-75">${m.fecha.split(',')[1]?.trim() || ''}</div>
                    </div>
                </div>
            `;
            chatMessages.appendChild(div);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Eventos
    adminSendBtn.addEventListener("click", async () => {
        let text = adminMsgInput.value.trim();
        
        // Adjuntar mención si hay archivo
        const files = document.getElementById("fileInput").files;
        if (files && files.length > 0) {
            const fNames = Array.from(files).map(f => f.name).join(", ");
            text = text ? `${text}\n[📎 Archivo adjuntado: ${fNames}]` : `[📎 Archivo adjuntado: ${fNames}]`;
        }

        if (!text || !activeChatEmail) return;

        await Data.sendMessage(soporteEmail, activeChatEmail, text);
        adminMsgInput.value = "";
        
        // Limpiar input y vista
        document.getElementById("fileInput").value = "";
        const preview = document.getElementById("filePreview");
        if(preview) { preview.innerHTML = ""; preview.classList.add("d-none"); }
    });

    adminMsgInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") adminSendBtn.click();
    });

    searchInput.addEventListener("input", (e) => renderContacts(e.target.value));

    // Eventos Adjuntos y Mock Actions
    const btnAdjuntarArchivo = document.getElementById("btnAdjuntarArchivo");
    const fileInput = document.getElementById("fileInput");
    
    if (btnAdjuntarArchivo && fileInput) {
        btnAdjuntarArchivo.addEventListener("click", () => fileInput.click());
        
        fileInput.addEventListener("change", (e) => {
            const preview = document.getElementById("filePreview");
            if (!preview) return;
            if (e.target.files.length > 0) {
                const names = Array.from(e.target.files).map(f => `<span class="badge bg-light text-dark border p-2"><i class="fa fa-file me-2"></i>${f.name}</span>`).join("");
                preview.innerHTML = names;
                preview.classList.remove("d-none");
            } else {
                preview.classList.add("d-none");
            }
        });
    }

    const btnPlantilla = document.getElementById("btnPlantilla");
    if(btnPlantilla) btnPlantilla.addEventListener("click", () => {
        adminMsgInput.value = "Hola, verificamos tus datos y todo se encuentra en orden. ¿Te podemos ayudar en algo más?";
    });

    const btnAdjuntarGuia = document.getElementById("btnAdjuntarGuia");
    if(btnAdjuntarGuia) btnAdjuntarGuia.addEventListener("click", () => {
        adminMsgInput.value = "Adjunto te enviamos la guía de buenas prácticas ISO 30415: https://www.iso.org/obp/ui/#iso:std:iso:30415:ed-1:v1:en";
    });

    const btnExportarChat = document.getElementById("btnExportarChat");
    if(btnExportarChat) btnExportarChat.addEventListener("click", () => {
        alert("El historial del chat ha sido exportado.");
    });

    // Filtros
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".filter-btn").forEach(b => b.classList.replace("btn-success", "btn-light"));
            e.target.classList.replace("btn-light", "btn-success");
            currentTypeFilter = e.target.dataset.filter;
            renderContacts(searchInput.value);
        });
    });

    // Logout
    document.getElementById("logoutBtnTop").addEventListener("click", async () => {
        await Auth.logout();
    });

    // Init
    await renderContacts();
});

