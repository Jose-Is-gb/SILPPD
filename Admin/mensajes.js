// ===============================
// mensajes.js — Panel de Mensajes (Administrador)
// Conexión con base de datos local y mensajería de usuarios/empresas
// ===============================

document.addEventListener("DOMContentLoaded", () => {
    // ===============================
    // Verificación Básica
    // ===============================
    if (typeof Auth !== "undefined") {
        const user = Auth.getActiveUser();
        if (!user || user.rol !== "admin") {
            window.location.href = "../login.html";
            return;
        }
    }
    
    const logoutBtn = document.getElementById("logoutBtnTop");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            sessionStorage.removeItem("adminAuth");
            localStorage.removeItem("adminAuth");
            window.location.href = "../login.html";
        });
    }

    // ===============================
    // Variables
    // ===============================
    const soporteEmail = "soporte@talentoinclusivo.com";
    
    // UI Elements
    const contactsList = document.getElementById("contactsList");
    const chatMessages = document.getElementById("chatMessages");
    const adminMsgInput = document.getElementById("adminMsgInput");
    const adminSendBtn = document.getElementById("adminSendBtn");
    
    const chatHeaderContainer = document.getElementById("chatHeaderContainer");
    const noChatSelected = document.getElementById("noChatSelected");
    const searchInput = document.getElementById("searchChats");

    let activeChatEmail = null;
    let currentTypeFilter = 'Todos';
    let marcados = new Set(JSON.parse(localStorage.getItem('admin_marcados') || '[]'));
    let pendingFiles = [];
    let contactsMap = new Map();

    // ===============================
    // Data Access
    // ===============================
    function getDB() {
        return JSON.parse(localStorage.getItem("TI_DATABASE")) || { usuarios: [], mensajes: [], empresas: [] };
    }
    
    function saveDB(db) {
        localStorage.setItem("TI_DATABASE", JSON.stringify(db));
    }

    // Identify user vs company
    function getUserDetails(email) {
        const info = Data.getContactInfo(email);
        return { 
            name: info.nombre, 
            type: info.rol === 'empresa' ? 'Empresa' : (info.rol === 'usuario' ? 'Usuario' : 'Desconocido'), 
            avatarColor: info.color, 
            initial: info.nombre.charAt(0).toUpperCase(),
            foto: info.foto
        };
    }

    // ===============================
    // Init Demo Data (Mock if needed based on the screenshot)
    // ===============================
    function initDemoData() {
        const db = getDB();
        db.mensajes = db.mensajes || [];
        db.empresas = db.empresas || [];
        
        const demoEmpresaEmail = "tech@empresa.com";
        const demoUserEmail = "maria@example.com";
        const demoDate = new Date().toLocaleString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        
        // Ensure mock company exists mostly for the UI screenshot fidelity
        if (!db.empresas.some(e => e.correo === demoEmpresaEmail)) {
            db.empresas.push({ nombre: "Tech Solutions S.A.", correo: demoEmpresaEmail, estado: "Verificada" });
            saveDB(db);
        }

        // Add some mock messages to soporte if database matches are completely empty
        const setupDemoMsgs = () => {
            db.mensajes.push({ remitente: demoEmpresaEmail, destinatario: soporteEmail, texto: "Buenos días, hemos recibido una consulta de la usuaria María González sobre nuestra oferta de Desarrollador Frontend. Ella pregunta por las adaptaciones disponibles.", fecha: "15/4/2026, 10:16:00" });
            db.mensajes.push({ remitente: soporteEmail, destinatario: demoEmpresaEmail,texto: "Gracias por notificarlo. Puedo ver que la conversación está fluyendo bien. ¿Necesitan alguna orientación adicional sobre las normativas ISO 21542?",fecha: "15/4/2026, 10:20:00"});
            db.mensajes.push({ remitente: demoEmpresaEmail, destinatario: soporteEmail, texto: "Creo que estamos bien, hemos compartido toda la información sobre lectores de pantalla y trabajo remoto. Queremos agendar una videollamada con ella.", fecha: "15/4/2026, 10:28:00" });
            db.mensajes.push({ remitente: soporteEmail, destinatario: demoEmpresaEmail, texto: "Perfecto. Recuerden que durante la videollamada deben asegurar la accesibilidad: subtítulos, audio claro y compartir materiales en formatos accesibles. ¿Necesitan el checklist de entrevistas inclusivas?", fecha: "15/4/2026, 10:35:00" });
            db.mensajes.push({ remitente: demoUserEmail, destinatario: soporteEmail, texto: "¿Cómo puedo actualizar mi certificado de discapacidad?", fecha: "15/4/2026, 10:45:00" });
            saveDB(db);
        };

        if (db.mensajes.filter(m => m.remitente === soporteEmail || m.destinatario === soporteEmail).length === 0) {
            setupDemoMsgs();
        }
    }
    
    initDemoData();

    // ===============================
    // Render Functions
    // ===============================
    
    function parseMessages() {
        const db = getDB();
        const mensajes = db.mensajes || [];
        contactsMap.clear();

        // 1. Agregar los que tienen historial
        mensajes.forEach(m => {
            if (m.remitente === soporteEmail || m.destinatario === soporteEmail) {
                const otherEmail = m.remitente === soporteEmail ? m.destinatario : m.remitente;
                
                if (!contactsMap.has(otherEmail)) {
                    contactsMap.set(otherEmail, { lastMsg: m, count: 1 });
                } else {
                    contactsMap.set(otherEmail, { lastMsg: m, count: contactsMap.get(otherEmail).count + 1 });
                }
            }
        });

        // 2. Agregar empresas registradas aunque no tengan chat previo
        const empresas = db.empresas || [];
        empresas.forEach(emp => {
            if (emp.correo && !contactsMap.has(emp.correo)) {
                contactsMap.set(emp.correo, { 
                    lastMsg: { texto: "Sin mensajes previos", fecha: "", remitente: soporteEmail }, 
                    count: 0 
                });
            }
        });

        // 3. Agregar usuarios registrados aunque no tengan chat previo
        const usuarios = db.usuarios || [];
        usuarios.forEach(usr => {
            if (usr.correo && !contactsMap.has(usr.correo)) {
                contactsMap.set(usr.correo, { 
                    lastMsg: { texto: "Sin mensajes previos", fecha: "", remitente: soporteEmail }, 
                    count: 0 
                });
            }
        });
    }

    function renderContactsList(filterText = "") {
        parseMessages();
        contactsList.innerHTML = "";
        
        let arr = Array.from(contactsMap.entries());
        // Sort by most recent (mock simple sort)
        arr.reverse();

        // ⭐ Marcados primero
        arr.sort((a, b) => {
            const aMarked = marcados.has(a[0]) ? 1 : 0;
            const bMarked = marcados.has(b[0]) ? 1 : 0;
            return bMarked - aMarked;
        });

        if (arr.length === 0) {
            contactsList.innerHTML = `<div class="p-4 text-center text-muted small">No hay conversaciones activas.</div>`;
            return;
        }

        arr.forEach(([email, data]) => {
            const details = getUserDetails(email);
            
            if (filterText && !details.name.toLowerCase().includes(filterText.toLowerCase()) && !email.toLowerCase().includes(filterText.toLowerCase())) {
                return;
            }
            if (currentTypeFilter !== 'Todos' && details.type !== currentTypeFilter) {
                return;
            }
            
            const isUnread = data.lastMsg.remitente !== soporteEmail; // Mock logic: if they sent last, it's unread
            // Using predefined styling matching mock
            let tagHtml = "";
            let unreadBadge = "";
            
            if (details.type === 'Empresa') {
                tagHtml = `<span class="badge bg-warning rounded px-2" style="font-size:0.6rem;">Empresa</span>`;
            }

            if (isUnread) {
                unreadBadge = `<span class="badge bg-success rounded-circle" style="width: 18px;height: 18px;display:inline-flex;align-items:center;justify-content:center;">1</span>`;
            }

            // Extract time
            const timePart = data.lastMsg.fecha.includes(',') ? data.lastMsg.fecha.split(',')[1].trim().slice(0, 5) : '10:00';

            const div = document.createElement("div");
            div.className = `contact-item d-flex gap-3 p-3 border-bottom border-light ${activeChatEmail === email ? 'active border-start' : ''}`;
            div.onclick = () => selectChat(email, details);
            
            // Avatar: foto real o inicial
            let avatarHtml;
            if (details.foto) {
                avatarHtml = `<img src="${details.foto}" class="flex-shrink-0 shadow-sm" style="width:48px;height:48px;border-radius:50%;object-fit:cover;" alt="${details.name}">`;
            } else {
                avatarHtml = `<div class="avatar ${details.avatarColor} flex-shrink-0 shadow-sm">${details.initial}</div>`;
            }

            // Icono marcado
            const isMarked = marcados.has(email);
            const markIcon = isMarked ? `<i class="fa fa-flag text-warning" style="font-size:0.7rem;"></i>` : '';

            div.innerHTML = `
                ${avatarHtml}
                <div class="flex-grow-1 overflow-hidden">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <h6 class="mb-0 fw-bold text-truncate text-dark" style="font-size:0.9rem;">${details.name} ${markIcon}</h6>
                        <small class="text-muted" style="font-size: 0.70rem;">${timePart}</small>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <p class="mb-0 text-muted small text-truncate pe-2">${data.lastMsg.texto}</p>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-1">
                         <div>${tagHtml}</div>
                         <div>${unreadBadge}</div>
                    </div>
                </div>
            `;
            contactsList.appendChild(div);
        });
    }

    function selectChat(email, details) {
        activeChatEmail = email;
        
        noChatSelected.classList.add("d-none");
        chatHeaderContainer.classList.remove("d-none");
        chatHeaderContainer.classList.add("d-flex");
        
        // Update Header
        document.getElementById("chatName").textContent = details.name;
        const avatarEl = document.getElementById("chatAvatar");
        if (details.foto) {
            avatarEl.innerHTML = `<img src="${details.foto}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
            avatarEl.className = `avatar-lg shadow-sm rounded-circle d-flex align-items-center justify-content-center overflow-hidden`;
        } else {
            avatarEl.textContent = details.initial;
            avatarEl.innerHTML = details.initial;
            avatarEl.className = `avatar-lg shadow-sm rounded-circle d-flex align-items-center justify-content-center fw-bold fs-4 text-white ${details.avatarColor}`;
        }

        // Actualizar estado del botón Marcar
        updateMarkBtn();
        
        const chatTag = document.getElementById("chatTag");
        const docLabel = document.getElementById("chatDocLabel");
        const docVal = document.getElementById("chatDocValue");
        const estadoVal = document.getElementById("chatEmpresaEstado");
        
        if(details.type === 'Empresa') {
            chatTag.textContent = "Empresa";
            chatTag.className = "badge bg-warning-subtle text-warning fw-semibold rounded-pill px-2 py-1";
            docLabel.textContent = "RUC";
            
            const db = getDB();
            const empir = db.empresas?.find(x => x.correo === email) || {};
            docVal.textContent = empir.ruc || "20000000000";
            estadoVal.textContent = empir.estado || "Pendiente";
            estadoVal.className = empir.estado === "Verificada" ? "text-success" : "text-warning";
        } else {
            chatTag.textContent = "Usuario";
            chatTag.className = "badge bg-info-subtle text-info fw-semibold rounded-pill px-2 py-1";
            docLabel.textContent = "DNI";
            docVal.textContent = "12345678"; // Usualmente no está en el JSON base del demo
            estadoVal.textContent = "Activo";
            estadoVal.className = "text-success";
        }
        
        renderMessages();
        renderContactsList(searchInput.value); // Refresh list to update active state
    }

    // ===============================
    // Botón Marcar
    // ===============================
    function updateMarkBtn() {
        const btn = document.getElementById("btnMarcarChat");
        if (!btn || !activeChatEmail) return;
        const isMarked = marcados.has(activeChatEmail);
        if (isMarked) {
            btn.innerHTML = '<i class="fa fa-flag me-1 text-warning"></i> Marcado';
            btn.classList.remove('btn-light');
            btn.classList.add('btn-warning', 'bg-warning-subtle');
        } else {
            btn.innerHTML = '<i class="fa-regular fa-flag me-1"></i> Marcar';
            btn.classList.remove('btn-warning', 'bg-warning-subtle');
            btn.classList.add('btn-light');
        }
    }

    document.addEventListener("click", (e) => {
        const btn = e.target.closest("#btnMarcarChat");
        if (btn && activeChatEmail) {
            if (marcados.has(activeChatEmail)) {
                marcados.delete(activeChatEmail);
            } else {
                marcados.add(activeChatEmail);
            }
            localStorage.setItem('admin_marcados', JSON.stringify([...marcados]));
            updateMarkBtn();
            renderContactsList(searchInput.value);
        }
    });

    function renderMessages() {
        if (!activeChatEmail) return;
        
        const db = getDB();
        const chatMsgs = (db.mensajes || []).filter(
            m => (m.remitente === soporteEmail && m.destinatario === activeChatEmail) ||
                 (m.remitente === activeChatEmail && m.destinatario === soporteEmail)
        );
        
        const dateString = new Date().toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric'});
        
        chatMessages.innerHTML = `
            <div class="text-center mb-4 mt-2">
                <span class="badge bg-light text-muted rounded-pill px-4 py-2 border shadow-sm">Hoy, ${dateString}</span>
            </div>
        `;
        
        chatMsgs.forEach(msg => {
            const isMe = msg.remitente === soporteEmail;
            const timePart = msg.fecha.includes(',') ? msg.fecha.split(',')[1].trim().slice(0, 5) : '10:00';
            
            const div = document.createElement("div");
            div.className = `d-flex mx-2 mb-3 ${isMe ? 'justify-content-end' : 'justify-content-start'}`;
            
            // Checkmark logic
            const checkMark = isMe ? `<i class="fa fa-check-double text-primary ms-1" style="font-size:0.7em;"></i>` : '';

            div.innerHTML = `
                <div class="${isMe ? 'text-end' : 'text-start'}" style="max-width: 65%;">
                    <div class="msg-bubble shadow-sm ${isMe ? 'msg-sent' : 'msg-received'}">
                        ${msg.texto}
                    </div>
                    <div class="msg-time ${isMe ? 'msg-sent-time pe-1' : 'ps-1'} d-flex align-items-center ${isMe ? 'justify-content-end' : 'justify-content-start'} gap-1">
                        ${timePart} ${checkMark}
                    </div>
                </div>
            `;
            chatMessages.appendChild(div);
        });
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // ===============================
    // Events
    // ===============================
    
    adminSendBtn.addEventListener("click", () => {
        const text = adminMsgInput.value.trim();
        if (!text || !activeChatEmail) return;
        
        const db = getDB();
        db.mensajes.push({
            remitente: soporteEmail,
            destinatario: activeChatEmail,
            texto: text,
            fecha: new Date().toLocaleString('es-ES')
        });
        
        saveDB(db);
        adminMsgInput.value = "";
        
        renderMessages();
        renderContactsList(searchInput.value);
    });

    adminMsgInput.addEventListener("keypress", e => {
        if (e.key === "Enter") {
            e.preventDefault();
            adminSendBtn.click();
        }
    });

    searchInput.addEventListener("input", (e) => {
        renderContactsList(e.target.value);
    });

    // Filter Buttons
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            // Updated UI styled logic
            document.querySelectorAll(".filter-btn").forEach(b => {
                b.classList.remove("btn-success", "fw-semibold");
                b.classList.add("btn-light", "text-dark");
            });
            e.target.classList.remove("btn-light", "text-dark");
            e.target.classList.add("btn-success", "fw-semibold");

            currentTypeFilter = e.target.dataset.filter;
            renderContactsList(searchInput.value);
        });
    });

    // ===============================
    // Plantillas de respuesta
    // ===============================
    const plantillas = [
        "Gracias por comunicarte con Talento Inclusivo. Estamos revisando tu consulta.",
        "Tu solicitud ha sido recibida. Un agente se pondrá en contacto contigo pronto.",
        "Hemos verificado tu información. Todo está en orden. ¡Gracias!",
        "Lamentamos los inconvenientes. Estamos trabajando en una solución.",
        "¿Podrías proporcionarnos más detalles para poder ayudarte mejor?"
    ];

    document.getElementById("btnPlantilla").addEventListener("click", () => {
        if (!activeChatEmail) return alert("Selecciona un chat primero.");

        let html = '<div class="list-group">';
        plantillas.forEach((p, i) => {
            html += `<button class="list-group-item list-group-item-action small py-2" data-idx="${i}">${p}</button>`;
        });
        html += '</div>';

        const modal = document.createElement("div");
        modal.className = "modal fade";
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content rounded-4 border-0 shadow">
                    <div class="modal-header bg-primary text-white rounded-top-4">
                        <h6 class="modal-title"><i class="fa fa-file-lines me-2"></i>Selecciona una plantilla</h6>
                        <button class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">${html}</div>
                </div>
            </div>`;
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        
        modal.querySelectorAll(".list-group-item").forEach(item => {
            item.addEventListener("click", () => {
                adminMsgInput.value = plantillas[item.dataset.idx];
                bsModal.hide();
                adminMsgInput.focus();
            });
        });

        modal.addEventListener("hidden.bs.modal", () => modal.remove());
        bsModal.show();
    });

    // ===============================
    // Adjuntar guía
    // ===============================
    const guias = [
        { nombre: "📄 Guía de accesibilidad laboral", archivo: "guia_accesibilidad.pdf" },
        { nombre: "📋 Manual de inclusión para empresas", archivo: "manual_inclusion.pdf" },
        { nombre: "📝 Formulario de registro de discapacidad", archivo: "formulario_discapacidad.pdf" },
        { nombre: "📊 Informe de oportunidades inclusivas", archivo: "informe_oportunidades.pdf" }
    ];

    document.getElementById("btnAdjuntarGuia").addEventListener("click", () => {
        if (!activeChatEmail) return alert("Selecciona un chat primero.");

        let html = '<div class="list-group">';
        guias.forEach((g, i) => {
            html += `<button class="list-group-item list-group-item-action small py-2 d-flex justify-content-between align-items-center" data-idx="${i}">
                <span>${g.nombre}</span>
                <i class="fa fa-paper-plane text-primary"></i>
            </button>`;
        });
        html += '</div>';

        const modal = document.createElement("div");
        modal.className = "modal fade";
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content rounded-4 border-0 shadow">
                    <div class="modal-header bg-info text-white rounded-top-4">
                        <h6 class="modal-title"><i class="fa fa-book me-2"></i>Adjuntar guía</h6>
                        <button class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">${html}</div>
                </div>
            </div>`;
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);

        modal.querySelectorAll(".list-group-item").forEach(item => {
            item.addEventListener("click", () => {
                const guia = guias[item.dataset.idx];
                // Enviar como mensaje con adjunto
                const db = getDB();
                db.mensajes.push({
                    remitente: soporteEmail,
                    destinatario: activeChatEmail,
                    texto: `📎 Documento adjunto: ${guia.nombre}`,
                    fecha: new Date().toLocaleString('es-ES')
                });
                saveDB(db);
                bsModal.hide();
                renderMessages();
                renderContactsList(searchInput.value);
            });
        });

        modal.addEventListener("hidden.bs.modal", () => modal.remove());
        bsModal.show();
    });

    // ===============================
    // Adjuntar archivo (clip)
    // ===============================
    const fileInput = document.getElementById("fileInput");
    const filePreview = document.getElementById("filePreview");

    document.getElementById("btnAdjuntarArchivo").addEventListener("click", () => {
        if (!activeChatEmail) return alert("Selecciona un chat primero.");
        fileInput.click();
    });

    fileInput.addEventListener("change", () => {
        pendingFiles = Array.from(fileInput.files);
        if (pendingFiles.length === 0) {
            filePreview.classList.add("d-none");
            return;
        }

        filePreview.classList.remove("d-none");
        filePreview.innerHTML = "";

        pendingFiles.forEach((f, i) => {
            const chip = document.createElement("div");
            chip.className = "badge bg-light text-dark border d-flex align-items-center gap-2 py-2 px-3";
            const icon = f.type.startsWith("image/") ? "fa-image text-success" : "fa-file text-primary";
            chip.innerHTML = `
                <i class="fa ${icon}"></i>
                <span class="small">${f.name.length > 20 ? f.name.slice(0, 18) + '...' : f.name}</span>
                <i class="fa fa-times-circle text-danger ms-1" style="cursor:pointer;" data-idx="${i}"></i>
            `;
            chip.querySelector("[data-idx]").addEventListener("click", () => {
                pendingFiles.splice(i, 1);
                if (pendingFiles.length === 0) filePreview.classList.add("d-none");
                fileInput.value = "";
                filePreview.innerHTML = "";
                // Rerender remaining
                pendingFiles.forEach((pf, pi) => {
                    const c2 = document.createElement("div");
                    c2.className = "badge bg-light text-dark border d-flex align-items-center gap-2 py-2 px-3";
                    c2.innerHTML = `<i class="fa fa-file text-primary"></i><span class="small">${pf.name}</span>`;
                    filePreview.appendChild(c2);
                });
            });
            filePreview.appendChild(chip);
        });
    });

    // Update send to include files
    const originalSendHandler = adminSendBtn.onclick;
    adminSendBtn.addEventListener("click", () => {
        if (!activeChatEmail) return;

        // Send pending files as messages
        if (pendingFiles.length > 0) {
            const db = getDB();
            pendingFiles.forEach(f => {
                db.mensajes.push({
                    remitente: soporteEmail,
                    destinatario: activeChatEmail,
                    texto: `📎 Archivo adjunto: ${f.name} (${(f.size/1024).toFixed(1)} KB)`,
                    fecha: new Date().toLocaleString('es-ES')
                });
            });
            saveDB(db);
            pendingFiles = [];
            fileInput.value = "";
            filePreview.classList.add("d-none");
            filePreview.innerHTML = "";
        }
    });

    // ===============================
    // Dropdown: Eliminar conversación
    // ===============================
    document.getElementById("btnEliminarChat").addEventListener("click", (e) => {
        e.preventDefault();
        if (!activeChatEmail) return;
        if (!confirm("¿Eliminar toda la conversación con este contacto?")) return;

        const db = getDB();
        db.mensajes = db.mensajes.filter(m =>
            !(m.remitente === activeChatEmail || m.destinatario === activeChatEmail)
        );
        saveDB(db);
        activeChatEmail = null;
        chatHeaderContainer.style.display = "none";
        noChatSelected.style.display = "flex";
        renderContactsList(searchInput.value);
    });

    // ===============================
    // Dropdown: Exportar chat
    // ===============================
    document.getElementById("btnExportarChat").addEventListener("click", (e) => {
        e.preventDefault();
        if (!activeChatEmail) return;

        const db = getDB();
        const details = getUserDetails(activeChatEmail);
        const msgs = db.mensajes.filter(m =>
            m.remitente === activeChatEmail || m.destinatario === activeChatEmail
        );

        let txt = `=== Chat con ${details.name} (${activeChatEmail}) ===\n`;
        txt += `Exportado: ${new Date().toLocaleString('es-ES')}\n\n`;
        msgs.forEach(m => {
            const sender = m.remitente === soporteEmail ? "Soporte" : details.name;
            txt += `[${m.fecha}] ${sender}: ${m.texto}\n`;
        });

        const blob = new Blob([txt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat_${details.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    });

    // ===============================
    // Dropdown: Cerrar chat
    // ===============================
    document.getElementById("btnCerrarChat").addEventListener("click", (e) => {
        e.preventDefault();
        activeChatEmail = null;
        chatHeaderContainer.style.display = "none";
        noChatSelected.style.display = "flex";
        renderContactsList(searchInput.value);
    });

    // Boot
    renderContactsList();

    // Check query params to auto-open a specific chat
    const params = new URLSearchParams(window.location.search);
    const chatTarget = params.get('chat');
    if (chatTarget) {
        selectChat(chatTarget, getUserDetails(chatTarget));
    }

});
