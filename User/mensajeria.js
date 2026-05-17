// ===============================
// mensajeria.js — Chat del usuario (con Soporte y otros usuarios) - FIREBASE
// ===============================

document.addEventListener("DOMContentLoaded", async () => {
    // ===============================
    // RBAC: Solo usuarios con rol 'usuario' pueden acceder
    // ===============================
    const user = await Auth.requireRole("usuario", "../login.html");
    if (!user) return;

    // ===============================
    // Elementos del DOM
    // ===============================
    const chatList = document.getElementById("chatList");
    const chatBody = document.getElementById("chatBody");
    const chatHeader = document.getElementById("chatHeader");
    const messageInput = document.getElementById("messageInput");
    const sendBtn = document.getElementById("sendBtn");
    const attachBtn = document.getElementById("attachBtn");
    const attachInput = document.getElementById("attachInput");

    let activeChat = null;
    let unsubscribeMessages = null;

    // Lógica de archivos
    attachBtn.onclick = () => attachInput.click();
    attachInput.onchange = () => {
        const file = attachInput.files[0];
        if (file) {
            messageInput.value = `[Documento: ${file.name}]`;
            messageInput.focus();
        }
    };

    const soporteEmail = "soporte@talentoinclusivo.com";

    // ===============================
    // Cargar lista de conversaciones únicas
    // ===============================
    async function loadChats() {
        try {
            const allMsgs = await Data.getMensajesByUser(user.correo);
            
            // Si no hay mensajes, forzamos el de bienvenida de Soporte en la nube
            if (allMsgs.length === 0) {
                await Data.addMensaje({
                    de: soporteEmail,
                    para: user.correo,
                    texto: `👋 ¡Hola ${user.nombre || "usuario"}! Bienvenido a Talento Inclusivo Cloud. ¿Necesitas ayuda?`
                });
                return loadChats(); // Re-cargar
            }

            const contactosSet = new Set(
                allMsgs.map(m => (m.de === user.correo ? m.para : m.de))
            );

            // Asegurar que soporte esté en la lista
            contactosSet.add(soporteEmail);

            chatList.innerHTML = `
                <li class="list-group-item d-flex justify-content-between align-items-center bg-light">
                    <strong>Conversaciones</strong>
                    <button class="btn btn-sm btn-success" id="newChatBtn">
                        <i class="fa fa-plus"></i>
                    </button>
                </li>
            `;

            for (const contactoCorreo of contactosSet) {
                const info = await Data.getContactInfo(contactoCorreo);
                const li = document.createElement("li");
                li.className = `list-group-item list-group-item-action d-flex align-items-center ${activeChat === contactoCorreo ? 'active bg-primary text-white border-primary' : ''}`;
                li.innerHTML = `
                    <div class="position-relative me-3">
                        <img src="${info.foto}" class="rounded-circle" style="width: 35px; height: 35px; object-fit: cover;">
                        <span class="position-absolute bottom-0 end-0 p-1 bg-success border border-light rounded-circle" style="padding: 4px !important;"></span>
                    </div>
                    <span>${info.nombre}</span>
                `;
                li.onclick = () => openChat(contactoCorreo, info.nombre, info.foto);
                chatList.appendChild(li);
            }

            document.getElementById("newChatBtn").onclick = createNewChat;
        } catch (e) {
            console.error("Error cargando chats:", e);
        }
    }

    function createNewChat() {
        const email = prompt("Introduce el correo del usuario con el que deseas chatear:");
        if (!email || email === user.correo) return;
        openChat(email);
    }

    // ===============================
    // Abrir conversación existente con ESCUCHA EN TIEMPO REAL
    // ===============================
    async function openChat(contactEmail, nombre, foto) {
        // Cancelar suscripción anterior si existe
        if (unsubscribeMessages) unsubscribeMessages();
        
        activeChat = contactEmail;
        const info = foto ? { nombre, foto } : await Data.getContactInfo(contactEmail);
        
        chatHeader.innerHTML = `
            <div class="d-flex align-items-center">
                <img src="${info.foto}" class="rounded-circle me-3" style="width: 40px; height: 40px; object-fit: cover;">
                <div>
                    <h6 class="mb-0 text-dark fw-bold">${info.nombre}</h6>
                    <small class="text-success" style="font-size: 0.75rem;">Online</small>
                </div>
            </div>
        `;

        // ESCUCHAR EN TIEMPO REAL CON FIRESTORE
        unsubscribeMessages = Data.listenConversacion(user.correo, activeChat, (msgs) => {
            renderMessages(msgs);
        });

        // Refrescar lista para marcar el activo
        loadChats();
    }

    function renderMessages(msgs) {
        chatBody.innerHTML = "";
        
        if (msgs.length === 0) {
            chatBody.innerHTML = `<div class="text-center py-5 opacity-50"><p>No hay mensajes todavía. ¡Saluda primero! 👋</p></div>`;
            return;
        }

        msgs.forEach(msg => {
            const isMe = msg.de === user.correo;
            const div = document.createElement("div");
            div.className = isMe ? "text-end mb-3" : "text-start mb-3";

            div.innerHTML = `
                <div class="d-inline-block p-3 rounded-4 shadow-sm" style="max-width: 80%; ${isMe
                    ? "background-color: #0d6efd; color: white; border-bottom-right-radius: 2px;"
                    : "background-color: #f8f9fa; color: #333; border-bottom-left-radius: 2px;"
                }">
                    <p class="mb-1" style="font-size: 0.95rem;">${msg.texto}</p>
                    <small class="opacity-75" style="font-size: 0.7rem;">${msg.fecha || "Ahora mismo"}</small>
                </div>
            `;
            chatBody.appendChild(div);
        });

        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // ===============================
    // Enviar mensaje
    // ===============================
    sendBtn.addEventListener("click", async () => {
        const texto = messageInput.value.trim();
        if (!texto || !activeChat) return;

        messageInput.value = "";
        
        try {
            await Data.addMensaje({
                de: user.correo,
                para: activeChat,
                texto: texto
            });
            
            // ✅ Respuesta automática si el chat es con soporte
            if (activeChat === soporteEmail) {
                setTimeout(async () => {
                    const autoReplyText = "Gracias por escribir. Todo nuestro equipo ha migrado a la nube de Firebase para darte una mejor experiencia. ☁️✨";
                    await Data.addMensaje({
                        de: soporteEmail,
                        para: user.correo,
                        texto: autoReplyText
                    });
                }, 1500);
            }
        } catch (e) {
            console.error("Error enviando mensaje:", e);
            alert("No se pudo enviar el mensaje.");
        }
    });

    // Enviar con Enter
    messageInput.addEventListener("keypress", e => {
        if (e.key === "Enter") {
            e.preventDefault();
            sendBtn.click();
        }
    });

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", async () => {
        await Auth.logout();
    });

    // Inicializar
    await loadChats();
});
