document.addEventListener("DOMContentLoaded", async () => {
    // 1. Verificar sesión activa
    const user = Auth.getActiveUser();
    if (!user || user.rol !== "empresa") {
        window.location.href = "../login.html";
        return;
    }

    // 2. Elementos del DOM
    const chatList = document.getElementById("chatList");
    const chatBody = document.getElementById("chatBody");
    const activeChatName = document.getElementById("activeChatName");
    const activeChatStatus = document.getElementById("activeChatStatus");
    const messageInput = document.getElementById("messageInput");
    const sendBtn = document.getElementById("sendBtn");
    const chatSearch = document.getElementById("chatSearch");
    const attachBtn = document.getElementById("attachBtn");
    const attachInput = document.getElementById("attachInput");

    let activeChat = null;
    let unsubscribeMessages = null;
    const SOPORTE_EMAIL = "soporte@talentoinclusivo.com";

    // 3. Cargar conversaciones (Asíncrono)
    async function loadChats() {
        try {
            const db = await Data.getDB();
            const allMessages = db.mensajes || [];
            
            // Obtener contactos únicos desde los mensajes (nube + locales previos si los hay)
            const userMsgs = allMessages.filter(m => m.remitente === user.correo || m.destinatario === user.correo);
            const contactosEmails = [...new Set(userMsgs.map(m => m.remitente === user.correo ? m.destinatario : m.remitente))];

            if (!contactosEmails.includes(SOPORTE_EMAIL)) {
                contactosEmails.unshift(SOPORTE_EMAIL);
            }

            renderChatList(contactosEmails, allMessages);
        } catch (e) {
            console.error("Error cargando chats de empresa:", e);
        }
    }

    async function renderChatList(contactos, allMessages) {
        const query = chatSearch.value.toLowerCase();
        chatList.innerHTML = "";
        
        for (const email of contactos) {
            const info = await Data.getContactInfo(email);
            if (info.nombre.toLowerCase().includes(query)) {
                const li = document.createElement("div");
                li.className = `list-group-item list-group-item-action border-0 mb-1 rounded-3 ${activeChat === email ? 'active-chat shadow-sm' : ''}`;
                
                const lastMsg = allMessages.filter(m => 
                    (m.remitente === user.correo && m.destinatario === email) || 
                    (m.remitente === email && m.destinatario === user.correo)
                ).pop();

                li.innerHTML = `
                    <div class="d-flex align-items-center">
                        <img src="${info.foto}" class="rounded-circle me-3" style="width: 45px; height: 45px; object-fit: cover; flex-shrink: 0; border: 2px solid #fff;">
                        <div class="overflow-hidden">
                            <h6 class="mb-0 text-truncate fw-bold" style="font-size: 0.9rem;">${info.nombre}</h6>
                            <p class="mb-0 text-truncate small text-muted">${lastMsg ? lastMsg.texto : 'Sin mensajes'}</p>
                        </div>
                    </div>
                `;
                li.onclick = () => openChat(email, info.nombre, info.foto);
                chatList.appendChild(li);
            }
        }
    }

    async function openChat(email, nombre, foto) {
        if (unsubscribeMessages) unsubscribeMessages();
        
        activeChat = email;
        activeChatName.textContent = nombre;
        activeChatStatus.textContent = "Online";
        
        // Header Icon (Simulación)
        const headerIconWrap = document.querySelector("#chatHeader .bg-orange-light");
        if (headerIconWrap) {
            headerIconWrap.innerHTML = `<img src="${foto}" class="rounded-circle" style="width: 100%; height: 100%; object-fit: cover;">`;
        }

        // Real-time listener para mensajes
        unsubscribeMessages = Data.listenConversacion(user.correo, email, (msgs) => {
            renderMessages(msgs);
            loadChats(); // Refrescar lista para ver último mensaje
        });

        // UI Feedback
        document.querySelectorAll('.list-group-item').forEach(el => el.classList.remove('active-chat', 'shadow-sm'));
        loadChats();
    }

    function renderMessages(msgs) {
        chatBody.innerHTML = "";
        if (msgs.length === 0) {
            chatBody.innerHTML = `
                <div class="empty-chat text-center my-auto py-5 opacity-50">
                    <i class="fa fa-comment-dots fa-4x mb-3 text-orange opacity-25"></i>
                    <p class="fw-medium">No hay mensajes previos. ¡Inicia la conversación!</p>
                </div>
            `;
            return;
        }

        msgs.forEach(msg => {
            const isMe = msg.remitente === user.correo;
            const div = document.createElement("div");
            div.className = `message ${isMe ? 'me shadow-sm' : 'other'}`;
            div.innerHTML = `
                <div class="msg-text">${msg.texto}</div>
                <div class="msg-time ${isMe ? 'text-end' : ''}" style="font-size: 0.65rem; opacity: 0.6; margin-top: 4px;">
                    ${msg.fecha || "Ahora"}
                </div>
            `;
            chatBody.appendChild(div);
        });

        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // Enviar mensaje
    sendBtn.onclick = async () => {
        const texto = messageInput.value.trim();
        if (!texto || !activeChat) return;

        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString();
        
        try {
            await Data.addMensaje(user.correo, activeChat, texto, timestamp);
            messageInput.value = "";

            // Respuesta automática de soporte
            if (activeChat === SOPORTE_EMAIL) {
                setTimeout(async () => {
                    await Data.addMensaje(SOPORTE_EMAIL, user.correo, "Gracias por contactar a soporte. Estamos validando su requerimiento.", timestamp);
                }, 2000);
            }
        } catch (e) {
            console.error("Error enviando mensaje:", e);
            alert("No se pudo enviar el mensaje a la nube.");
        }
    };

    // Filtro y eventos
    chatSearch.addEventListener("input", () => loadChats());
    messageInput.addEventListener("keypress", (e) => { if (e.key === "Enter") sendBtn.click(); });

    if(attachBtn) {
        attachBtn.onclick = () => attachInput.click();
        attachInput.onchange = () => {
            const file = attachInput.files[0];
            if (file) { messageInput.value = `[Documento adjunto: ${file.name}]`; messageInput.focus(); }
        };
    }

    // Inicializar
    await loadChats();

    // Logout
    document.getElementById("logoutBtn").onclick = async (e) => {
        e.preventDefault();
        await Auth.logout();
    };

    // Parámetros de URL
    const params = new URLSearchParams(window.location.search);
    const sendTo = params.get("sendto");
    const nombreTo = params.get("nombre");
    const fotoTo = params.get("foto") || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    if (sendTo) {
        setTimeout(() => openChat(sendTo, nombreTo || sendTo, fotoTo), 500);
    }
});
