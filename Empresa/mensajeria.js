// ===============================
// mensajeria.js — Chat de la Empresa
// ===============================

document.addEventListener("DOMContentLoaded", () => {
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

    // Lógica de archivos
    if(attachBtn) {
        attachBtn.onclick = () => attachInput.click();
        attachInput.onchange = () => {
            const file = attachInput.files[0];
            if (file) {
                messageInput.value = `[Documento: ${file.name}]`;
                messageInput.focus();
            }
        };
    }

    let activeChat = null;
    const SOPORTE_EMAIL = "soporte@talentoinclusivo.com";

    // 3. Cargar conversaciones
    function loadChats() {
        const db = Data.getDB();
        const userMsgs = db.mensajes.filter(m => m.remitente === user.correo || m.destinatario === user.correo);

        // Obtener contactos únicos
        const contactos = [...new Set(userMsgs.map(m => m.remitente === user.correo ? m.destinatario : m.remitente))];

        // Siempre asegurar que el soporte esté presente si hay mensajes o por defecto
        if (!contactos.includes(SOPORTE_EMAIL)) {
            contactos.unshift(SOPORTE_EMAIL);
        }

        renderChatList(contactos);
    }

    function renderChatList(contactos) {
        const query = chatSearch.value.toLowerCase();
        const db = Data.getDB();
        
        chatList.innerHTML = "";
        
        contactos.forEach(email => {
            const info = Data.getContactInfo(email);
            if (info.nombre.toLowerCase().includes(query)) {
                const li = document.createElement("div");
                li.className = `list-group-item list-group-item-action border-0 mb-1 rounded-3 ${activeChat === email ? 'active-chat' : ''}`;
                
                const lastMsg = db.mensajes.filter(m => 
                    (m.remitente === user.correo && m.destinatario === email) || 
                    (m.remitente === email && m.destinatario === user.correo)
                ).pop();

                li.innerHTML = `
                    <div class="d-flex align-items-center">
                        <img src="${info.foto}" class="rounded-circle me-3" style="width: 45px; height: 45px; object-fit: cover; flex-shrink: 0;">
                        <div class="overflow-hidden">
                            <h6 class="mb-0 text-truncate font-bold" style="font-size: 0.9rem;">${info.nombre}</h6>
                            <p class="mb-0 text-truncate small text-muted">${lastMsg ? lastMsg.texto : 'Sin mensajes'}</p>
                        </div>
                    </div>
                `;
                li.onclick = () => openChat(email, info.nombre, info.foto);
                chatList.appendChild(li);
            }
        });
    }

    function openChat(email, nombre, foto) {
        activeChat = email;
        const info = foto ? { nombre, foto } : Data.getContactInfo(email);
        
        activeChatName.textContent = info.nombre;
        activeChatStatus.textContent = "Online";
        
        // Actualizar avatar en el header (si existe el elemento)
        const headerAvatar = document.querySelector(".chat-header .rounded-circle");
        if (headerAvatar && headerAvatar.tagName === "IMG") {
            headerAvatar.src = info.foto;
        }
        
        // Marcar activo en la lista
        document.querySelectorAll('.list-group-item').forEach(el => el.classList.remove('active-chat'));
        loadChats(); // Recargar para aplicar clase active-chat
        
        renderMessages();
    }

    function renderMessages() {
        if (!activeChat) return;

        const db = Data.getDB();
        const msgs = db.mensajes.filter(m => 
            (m.remitente === user.correo && m.destinatario === activeChat) || 
            (m.remitente === activeChat && m.destinatario === user.correo)
        );

        chatBody.innerHTML = "";

        if (msgs.length === 0) {
            chatBody.innerHTML = `
                <div class="text-center my-auto opacity-50 py-5">
                    <p class="small">No hay mensajes previos en esta conversación.</p>
                </div>
            `;
            return;
        }

        msgs.forEach(msg => {
            const isMe = msg.remitente === user.correo;
            const div = document.createElement("div");
            div.className = `message ${isMe ? 'me' : 'other'}`;
            div.innerHTML = `
                <div>${msg.texto}</div>
                <div style="font-size: 0.65rem; opacity: 0.7; margin-top: 4px; text-align: ${isMe ? 'right' : 'left'}">
                    ${msg.fecha}
                </div>
            `;
            chatBody.appendChild(div);
        });

        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // 4. Enviar mensaje
    sendBtn.onclick = () => {
        const texto = messageInput.value.trim();
        if (!texto || !activeChat) return;

        const db = Data.getDB();
        const msg = {
            remitente: user.correo,
            destinatario: activeChat,
            texto: texto,
            fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString()
        };

        db.mensajes.push(msg);
        localStorage.setItem("TI_DATABASE", JSON.stringify(db));
        
        messageInput.value = "";
        renderMessages();
        loadChats();

        // Simular respuesta de soporte si corresponde
        if (activeChat === SOPORTE_EMAIL) {
            setTimeout(() => {
                const dbFresh = Data.getDB();
                dbFresh.mensajes.push({
                    remitente: SOPORTE_EMAIL,
                    destinatario: user.correo,
                    texto: "He recibido tu consulta. Un agente de soporte te atenderá en unos minutos.",
                    fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString()
                });
                localStorage.setItem("TI_DATABASE", JSON.stringify(dbFresh));
                if (activeChat === SOPORTE_EMAIL) renderMessages();
                loadChats();
            }, 1500);
        }
    };

    messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendBtn.click();
    });

    chatSearch.addEventListener("input", () => {
        loadChats();
    });

    // Logout
    document.getElementById("logoutBtn").onclick = (e) => {
        e.preventDefault();
        Auth.logout();
    };

    // Inicializar
    loadChats();

    // Manejar parámetros de URL (p. ej. ?sendto=email&nombre=Nombre)
    const params = new URLSearchParams(window.location.search);
    const sendTo = params.get("sendto");
    const nombreTo = params.get("nombre");
    if (sendTo) {
        setTimeout(() => {
            openChat(sendTo, nombreTo || sendTo);
        }, 300);
    }
});
