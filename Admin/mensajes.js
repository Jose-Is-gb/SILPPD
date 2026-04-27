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

    // 5. Eventos
    adminSendBtn.addEventListener("click", async () => {
        const text = adminMsgInput.value.trim();
        if (!text || !activeChatEmail) return;

        await Data.sendMessage(soporteEmail, activeChatEmail, text);
        adminMsgInput.value = "";
    });

    adminMsgInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") adminSendBtn.click();
    });

    searchInput.addEventListener("input", (e) => renderContacts(e.target.value));

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
