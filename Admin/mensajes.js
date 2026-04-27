document.addEventListener("DOMContentLoaded", async () => {
    // 1. Verificación
    if (typeof Auth !== "undefined") {
        const user = Auth.getActiveUser();
        if (!user || user.rol !== "admin") {
            window.location.href = "../login.html";
            return;
        }
    }

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

    // 3. Renderizar Lista de Contactos (Asíncrona)
    async function renderContacts(query = "") {
        const db = await Data.getDB();
        contactsList.innerHTML = "";
        
        // Obtener correos únicos de mensajes con soporte
        const allMsgs = db.mensajes || [];
        const uniqueEmails = new Set();
        allMsgs.forEach(m => {
            if (m.remitente === soporteEmail) uniqueEmails.add(m.destinatario);
            if (m.destinatario === soporteEmail) uniqueEmails.add(m.remitente);
        });

        // Convertir a lista y filtrar por rol
        let contacts = [];
        for (const email of uniqueEmails) {
            const info = await Data.getContactInfo(email);
            if (currentTypeFilter !== 'Todos' && info.rol !== currentTypeFilter.toLowerCase()) continue;
            if (query && !info.nombre.toLowerCase().includes(query.toLowerCase())) continue;
            
            const lastMsg = allMsgs.filter(m => (m.remitente === email && m.destinatario === soporteEmail) || (m.remitente === soporteEmail && m.destinatario === email)).pop();
            
            contacts.push({ ...info, email, lastMsg });
        }

        if (contacts.length === 0) {
            contactsList.innerHTML = `<div class="p-4 text-center text-muted small">No hay conversaciones.</div>`;
            return;
        }

        contacts.reverse().forEach(c => {
            const div = document.createElement("div");
            div.className = `contact-item d-flex gap-3 p-3 border-bottom ${activeChatEmail === c.email ? 'active' : ''}`;
            div.onclick = () => selectChat(c.email, c.nombre, c.foto);
            
            div.innerHTML = `
                <img src="${c.foto}" class="rounded-circle" style="width:40px;height:40px;object-fit:cover;">
                <div class="flex-grow-1 overflow-hidden">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <h6 class="mb-0 fw-bold small text-truncate">${c.nombre}</h6>
                        <small class="x-small text-muted">${c.lastMsg ? c.lastMsg.fecha.split(',')[1]?.trim() || '' : ''}</small>
                    </div>
                    <p class="mb-0 text-muted small text-truncate">${c.lastMsg ? c.lastMsg.texto : '...'}</p>
                    <span class="badge ${c.rol === 'empresa' ? 'bg-warning' : 'bg-primary'} x-small mt-1">${c.rol.toUpperCase()}</span>
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
