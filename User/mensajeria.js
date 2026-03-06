// ===============================
// mensajeria.js — Chat del usuario (con Soporte y otros usuarios)
// ===============================

document.addEventListener("DOMContentLoaded", () => {
    // ===============================
    // Verificar sesión activa
    // ===============================
    const user = Auth.getActiveUser();
    if (!user) {
        window.location.href = "../login.html";
        return;
    }

    // ===============================
    // Elementos del DOM
    // ===============================
    const chatList = document.getElementById("chatList");
    const chatBody = document.getElementById("chatBody");
    const chatHeader = document.getElementById("chatHeader");
    const messageInput = document.getElementById("messageInput");
    const sendBtn = document.getElementById("sendBtn");

    let activeChat = null;

    // ===============================
    // Inicializar base de datos si no existe
    // ===============================
    const db = JSON.parse(localStorage.getItem("TI_DATABASE")) || { usuarios: [], mensajes: [] };
    db.mensajes = db.mensajes || [];

    // ===============================
    // Crear conversación predeterminada con Soporte
    // ===============================
    const soporteEmail = "soporte@talentoinclusivo.com";
    const soporteNombre = "Soporte Talento Inclusivo";

    const tieneSoporte = db.mensajes.some(
        m =>
            (m.remitente === user.correo && m.destinatario === soporteEmail) ||
            (m.remitente === soporteEmail && m.destinatario === user.correo)
    );

    if (!tieneSoporte) {
        db.mensajes.push({
            remitente: soporteEmail,
            destinatario: user.correo,
            texto: `👋 ¡Hola ${user.nombre || "usuario"}! Bienvenido a Talento Inclusivo. ¿Necesitas ayuda?`,
            fecha: new Date().toLocaleString()
        });
        localStorage.setItem("TI_DATABASE", JSON.stringify(db));
    }

    // ===============================
    // Obtener nombre del usuario por correo
    // ===============================
    function getNombrePorCorreo(correo) {
        if (correo === soporteEmail) return soporteNombre;
        const usuario = db.usuarios.find(u => u.correo === correo);
        return usuario ? usuario.nombre : correo;
    }

    // ===============================
    // Cargar lista de conversaciones
    // ===============================
    function loadChats() {
        const db = JSON.parse(localStorage.getItem("TI_DATABASE")) || { mensajes: [] };
        const userMsgs = db.mensajes.filter(
            m => m.remitente === user.correo || m.destinatario === user.correo
        );

        const contactos = [...new Set(
            userMsgs.map(m => (m.remitente === user.correo ? m.destinatario : m.remitente))
        )];

        chatList.innerHTML = `
            <li class="list-group-item d-flex justify-content-between align-items-center bg-light">
                <strong>Conversaciones</strong>
                <button class="btn btn-sm btn-success" id="newChatBtn">
                    <i class="fa fa-plus"></i>
                </button>
            </li>
        `;

        if (contactos.length === 0) {
            chatList.innerHTML += `<li class="list-group-item text-center text-muted">No hay conversaciones</li>`;
            return;
        }

        contactos.forEach(contactoCorreo => {
            const li = document.createElement("li");
            li.className = "list-group-item list-group-item-action";
            li.innerHTML = `<i class="fa fa-user-circle me-2 text-primary"></i>${getNombrePorCorreo(contactoCorreo)}`;
            li.onclick = () => openChat(contactoCorreo);
            chatList.appendChild(li);
        });

        document.getElementById("newChatBtn").onclick = createNewChat;
    }

    // ===============================
    // Crear nueva conversación manualmente
    // ===============================
    function createNewChat() {
        const email = prompt("Introduce el correo del usuario con el que deseas chatear:");
        if (!email) return;

        if (email === user.correo) {
            alert("No puedes chatear contigo mismo.");
            return;
        }

        // Abrir el chat directamente
        activeChat = email;
        chatHeader.textContent = `Conversación con ${getNombrePorCorreo(email)}`;
        renderMessages();

        // Añadir a la lista si no existe
        const existe = [...chatList.querySelectorAll("li")].some(li =>
            li.textContent.includes(email)
        );
        if (!existe) {
            const li = document.createElement("li");
            li.className = "list-group-item list-group-item-action";
            li.innerHTML = `<i class="fa fa-user-circle me-2 text-primary"></i>${getNombrePorCorreo(email)}`;
            li.onclick = () => openChat(email);
            chatList.appendChild(li);
        }
    }

    // ===============================
    // Abrir conversación existente
    // ===============================
    function openChat(contactEmail) {
        activeChat = contactEmail;
        chatHeader.textContent = `Conversación con ${getNombrePorCorreo(contactEmail)}`;
        renderMessages();
    }

    // ===============================
    // Mostrar mensajes del chat activo
    // ===============================
    function renderMessages() {
        if (!activeChat) {
            chatBody.innerHTML = `<p class="text-muted text-center">Selecciona una conversación</p>`;
            return;
        }

        const db = JSON.parse(localStorage.getItem("TI_DATABASE")) || { mensajes: [] };
        const msgs = db.mensajes.filter(
            m =>
                (m.remitente === user.correo && m.destinatario === activeChat) ||
                (m.remitente === activeChat && m.destinatario === user.correo)
        );

        chatBody.innerHTML = "";

        if (msgs.length === 0) {
            chatBody.innerHTML = `<p class="text-muted text-center">No hay mensajes todavía</p>`;
            return;
        }

        msgs.forEach(msg => {
            const div = document.createElement("div");
            div.className = msg.remitente === user.correo ? "text-end mb-2" : "text-start mb-2";

            div.innerHTML = `
                <div class="d-inline-block p-2 rounded ${msg.remitente === user.correo
                    ? "bg-primary text-white"
                    : "bg-light"
                }">
                    <small>${msg.texto}</small>
                </div><br>
                <small class="text-muted">${msg.fecha}</small>
            `;
            chatBody.appendChild(div);
        });

        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // ===============================
    // Enviar mensaje
    // ===============================
    sendBtn.addEventListener("click", () => {
        const texto = messageInput.value.trim();
        if (!texto || !activeChat) return;

        const db = JSON.parse(localStorage.getItem("TI_DATABASE")) || { mensajes: [] };
        db.mensajes = db.mensajes || [];

        db.mensajes.push({
            remitente: user.correo,
            destinatario: activeChat,
            texto,
            fecha: new Date().toLocaleString()
        });

        localStorage.setItem("TI_DATABASE", JSON.stringify(db));
        messageInput.value = "";
        renderMessages();

        // ✅ Respuesta automática si el chat es con soporte
        if (activeChat === soporteEmail) {
            setTimeout(() => {
                const reply = {
                    remitente: soporteEmail,
                    destinatario: user.correo,
                    texto: "Gracias por tu mensaje. En breve un agente de Talento Inclusivo te responderá. 💬",
                    fecha: new Date().toLocaleString()
                };
                db.mensajes.push(reply);
                localStorage.setItem("TI_DATABASE", JSON.stringify(db));
                renderMessages();
            }, 1000);
        }
    });

    // Enviar con Enter
    messageInput.addEventListener("keypress", e => {
        if (e.key === "Enter") {
            e.preventDefault();
            sendBtn.click();
        }
    });

    // ===============================
    // Cerrar sesión
    // ===============================
    document.getElementById("logoutBtn").addEventListener("click", () => {
        Auth.logout();
    });

    // Inicializar lista
    loadChats();
});
