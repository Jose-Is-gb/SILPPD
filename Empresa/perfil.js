document.addEventListener("DOMContentLoaded", () => {
    // 1. Verificar sesión
    const user = Auth.getActiveUser();
    if (!user || user.rol !== "empresa") {
        window.location.href = "../login.html";
        return;
    }

    // 2. Elementos del DOM - Sidebar
    const sideName = document.getElementById("sideName");
    const sideSector = document.getElementById("sideSector");
    const sideLocation = document.getElementById("sideLocation");
    const sideSize = document.getElementById("sideSize");
    const sideWeb = document.getElementById("sideWeb");
    const sideEmail = document.getElementById("sideEmail");
    const sidePhone = document.getElementById("sidePhone");
    const sideFounded = document.getElementById("sideFounded");
    
    // Stats
    const statOfertas = document.getElementById("statOfertas");
    const statContratos = document.getElementById("statContratos");
    const statMiembro = document.getElementById("statMiembro");

    // Formularios
    const formPerfil = document.getElementById("formPerfil");
    const formContacto = document.getElementById("formContacto");
    const formInclusion = document.getElementById("formInclusion");

    // 3. Cargar Datos
    function loadProfile() {
        // Sidebar
        sideName.textContent = user.nombre;
        sideSector.textContent = user.sector || "Sector no especificado";
        sideLocation.textContent = user.direccion || "Ubicación no especificada";
        sideSize.textContent = user.tamanio || "Tamaño no especificado";
        sideWeb.textContent = user.sitioWeb || "www.empresa.com";
        sideWeb.href = user.sitioWeb || "#";
        sideEmail.textContent = user.correo;
        sidePhone.textContent = user.telefono || "Sin teléfono";
        sideFounded.textContent = user.fundacion ? `Fundada en ${user.fundacion}` : "Año no especificado";

        // Stats dinámicas
        const db = Data.getDB();
        const ofertas = db.ofertas.filter(o => o.empresa === user.nombre);
        const postulaciones = db.postulaciones.filter(p => ofertas.some(o => o.id == p.idOferta));
        
        statOfertas.textContent = ofertas.length;
        statContratos.textContent = postulaciones.filter(p => p.estado === "Aceptado").length;
        statMiembro.textContent = user.fechaRegistro ? user.fechaRegistro.split('/').pop() : '2024';

        // TAB 1: Datos Empresa
        document.getElementById("razonSocial").value = user.razonSocial || user.nombre;
        document.getElementById("nombreComercial").value = user.nombreComercial || user.nombre;
        document.getElementById("ruc").value = user.ruc || "";
        document.getElementById("partidaRegistral").value = user.partidaRegistral || "";
        document.getElementById("sector").value = user.sector || "Tecnología e Informática";
        document.getElementById("tamanio").value = user.tamanio || "251-1000 empleados";
        document.getElementById("fundacion").value = user.fundacion || "";
        document.getElementById("sitioWeb").value = user.sitioWeb || "";
        document.getElementById("descripcion").value = user.descripcion || "";
        document.getElementById("mision").value = user.mision || "";

        // TAB 2: Contacto
        if (user.contacto) {
            document.getElementById("contNombre").value = user.contacto.nombre || "";
            document.getElementById("contCargo").value = user.contacto.cargo || "";
            document.getElementById("contEmail").value = user.contacto.email || user.correo;
            document.getElementById("contTelefono").value = user.contacto.telefono || user.telefono;
            document.getElementById("contDireccion").value = user.contacto.direccion || user.direccion;
            document.getElementById("contCiudad").value = user.contacto.ciudad || "";
            document.getElementById("contProvincia").value = user.contacto.provincia || "";
            document.getElementById("contCP").value = user.contacto.cp || "";
            document.getElementById("contLinkedin").value = user.contacto.linkedin || "";
            document.getElementById("contFacebook").value = user.contacto.facebook || "";
        } else {
            document.getElementById("contEmail").value = user.correo || "";
            document.getElementById("contTelefono").value = user.telefono || "";
            document.getElementById("contDireccion").value = user.direccion || "";
        }

        // TAB 3: Inclusión
        if (user.inclusion) {
            document.getElementById("accFisica").checked = user.inclusion.accFisica || false;
            document.getElementById("accTecno").checked = user.inclusion.accTecno || false;
            document.getElementById("accLengua").checked = user.inclusion.accLengua || false;
            document.getElementById("accRemoto").checked = user.inclusion.accRemoto || false;
            document.getElementById("accParking").checked = user.inclusion.accParking || false;
            document.getElementById("accFormacion").checked = user.inclusion.accFormacion || false;
            
            document.getElementById("polInclusion").value = user.inclusion.politica || "Sí, certificada (ISO 30415 u otra)";
            document.getElementById("empDiscapacidad").value = user.inclusion.empDiscapacidad || "45";
            document.getElementById("compromisoTexto").value = user.inclusion.compromiso || "";
            document.getElementById("certificaciones").value = user.inclusion.certificaciones || "";
            document.getElementById("presupuesto").value = user.inclusion.presupuesto || "Sí, presupuesto anual definido";
            document.getElementById("responsable").value = user.inclusion.responsable || "Sí, puesto dedicado";
        }

        // TAB 4: Verificación
        // No fields to fill here as per the screenshot (mostly static/display information)
    }

    // 4. Guardar Datos
    formPerfil.addEventListener("submit", (e) => {
        e.preventDefault();
        const updatedData = {
            razonSocial: document.getElementById("razonSocial").value,
            nombreComercial: document.getElementById("nombreComercial").value,
            ruc: document.getElementById("ruc").value,
            partidaRegistral: document.getElementById("partidaRegistral").value,
            sector: document.getElementById("sector").value,
            tamanio: document.getElementById("tamanio").value,
            fundacion: document.getElementById("fundacion").value,
            sitioWeb: document.getElementById("sitioWeb").value,
            descripcion: document.getElementById("descripcion").value,
            mision: document.getElementById("mision").value,
        };
        saveAndReload(updatedData, "Datos legales actualizados.");
    });

    formContacto.addEventListener("submit", (e) => {
        e.preventDefault();
        const contacto = {
            nombre: document.getElementById("contNombre").value,
            cargo: document.getElementById("contCargo").value,
            email: document.getElementById("contEmail").value,
            telefono: document.getElementById("contTelefono").value,
            direccion: document.getElementById("contDireccion").value,
            ciudad: document.getElementById("contCiudad").value,
            provincia: document.getElementById("contProvincia").value,
            cp: document.getElementById("contCP").value,
            linkedin: document.getElementById("contLinkedin").value,
            facebook: document.getElementById("contFacebook").value
        };
        saveAndReload({ contacto, direccion: contacto.direccion, telefono: contacto.telefono }, "Información de contacto actualizada.");
    });

    formInclusion.addEventListener("submit", (e) => {
        e.preventDefault();
        const inclusion = {
            accFisica: document.getElementById("accFisica").checked,
            accTecno: document.getElementById("accTecno").checked,
            accLengua: document.getElementById("accLengua").checked,
            accRemoto: document.getElementById("accRemoto").checked,
            accParking: document.getElementById("accParking").checked,
            accFormacion: document.getElementById("accFormacion").checked,
            politica: document.getElementById("polInclusion").value,
            empDiscapacidad: document.getElementById("empDiscapacidad").value,
            compromiso: document.getElementById("compromisoTexto").value,
            certificaciones: document.getElementById("certificaciones").value,
            presupuesto: document.getElementById("presupuesto").value,
            responsable: document.getElementById("responsable").value
        };
        saveAndReload({ inclusion }, "Políticas de inclusión actualizadas.");
    });

    function saveAndReload(newData, message) {
        if (newData.nombreComercial) {
            user.nombre = newData.nombreComercial;
        }
        Object.assign(user, newData);
        Auth.setActiveUser(user);
        Data.updateUser(user.correo, user);
        alert(message);
        loadProfile();
    }

    // 5. Visor de documentos
    const modalDocElement = document.getElementById('modalDoc');
    const modalDoc = modalDocElement ? new bootstrap.Modal(modalDocElement) : null;
    const modalDocTitle = document.getElementById('modalDocTitle');

    // Cambiar Logo
    const logoBtn = document.getElementById("logoBtn");
    const logoInput = document.getElementById("logoInput");
    if (logoBtn && logoInput) {
        logoBtn.onclick = () => logoInput.click();
        logoInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const imgData = event.target.result;
                    const container = document.querySelector(".logo-container");
                    if(container) container.innerHTML = `<img src="${imgData}" style="width:100%; height:100%; object-fit:cover;" class="rounded-circle">`;
                    saveAndReload({ fotoEmpresa: imgData }, "Logo actualizado correctamente.");
                };
                reader.readAsDataURL(file);
            }
        };
    }

    // Botones de cancelar
    document.querySelectorAll(".btn-light").forEach(btn => {
        if(btn.textContent.trim() === "Cancelar") {
            btn.onclick = () => {
                if (confirm("¿Estás seguro de que deseas cancelar? Se perderán los cambios no guardados.")) {
                    loadProfile();
                }
            };
        }
    });

    loadProfile();

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", (e) => {
        e.preventDefault();
        Auth.logout();
    });
});
