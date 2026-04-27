document.addEventListener("DOMContentLoaded", async () => {
    // 1. Verificar sesión activa
    const user = Auth.getActiveUser();
    if (!user) {
        window.location.href = "../login.html";
        return;
    }

    // 2. Elementos del DOM — Sidebar
    const sidebarName = document.getElementById("sidebarName");
    const sidebarEmail = document.getElementById("sidebarEmail");
    const sidebarPhone = document.getElementById("sidebarPhone");
    const profilePhoto = document.getElementById("profilePhoto");
    const photoInput = document.getElementById("photoInput");
    
    // 3. Formularios
    const formPersonal = document.getElementById("formPersonal");
    const formDisability = document.getElementById("formDisability");
    const formLaboral = document.getElementById("formLaboral");
    const formPreferences = document.getElementById("formPreferences");
    const cvInput = document.getElementById("cvInput");
    const cvFileName = document.getElementById("cvFileName");
    const cvFileMeta = document.getElementById("cvFileMeta");

    // 4. Toast de éxito
    const saveAlert = document.getElementById("saveAlert");
    const toast = new bootstrap.Toast(saveAlert);

    // ===============================================
    // Cargar datos asincrónicamente
    // ===============================================
    async function loadProfile() {
        // Refrescar el objeto user desde la base de datos (por si cambió en otro lado)
        const freshUser = await Data.getUserByEmail(user.correo);
        Object.assign(user, freshUser);

        // Sidebar
        sidebarName.textContent = `${user.nombre || ""} ${user.apellido || ""}`.trim() || "Usuario";
        sidebarEmail.textContent = user.correo;
        sidebarPhone.textContent = user.telefono || "No especificado";
        const sidebarLocation = document.getElementById("sidebarLocation");
        if (sidebarLocation) {
            sidebarLocation.textContent = `${user.ciudad || ""}, ${user.pais || ""}`.replace(/^, |, $/, "") || "Ubicación no especificada";
        }
        const sidebarExperience = document.getElementById("sidebarExperience");
        if (sidebarExperience) {
            const years = user.experienciaYears || "0-1";
            sidebarExperience.textContent = `${years === "0-1" ? "Menos de 1 año" : years + " años"} de experiencia`;
        }
        if (user.foto) profilePhoto.src = user.foto;

        // Actualizar estadísticas reales
        await updateActivityStats();

        // Datos Personales
        setInput("reg-nombre", user.nombre);
        setInput("reg-apellido", user.apellido);
        setInput("reg-tipo-doc", user.tipoDoc || "DNI");
        setInput("reg-num-doc", user.numDoc);
        setInput("reg-fecha-nacimiento", user.fechaNacimiento);
        setInput("reg-correo", user.correo);
        setInput("reg-telefono", user.telefono);
        setInput("reg-direccion", user.direccion);
        setInput("reg-cp", user.codigoPostal);
        setInput("reg-ciudad", user.ciudad);
        setInput("reg-pais", user.pais);

        // Discapacidad
        setInput("reg-tipo-discapacidad", user.discapacidad);
        setInput("reg-grado-discapacidad", user.gradoDiscapacidad || "33-49");
        setInput("reg-num-certificado", user.numCertificado);
        setInput("reg-vencimiento-certificado", user.vencimientoCertificado);
        setInput("reg-adaptaciones", user.adaptaciones);
        
        // Checkboxes asistencia
        const asistencia = user.asistencia || [];
        setCheckbox("assist-accesibilidad", asistencia.includes("accesibilidad"));
        setCheckbox("assist-tecnologia", asistencia.includes("tecnologia"));
        setCheckbox("assist-interprete", asistencia.includes("interprete"));
        setCheckbox("assist-remoto", asistencia.includes("remoto"));

        // Información Laboral
        setInput("reg-educacion", user.nivelEducativo || "Grado universitario");
        setInput("reg-especializacion", user.especializacion);
        setInput("reg-exp-years", user.experienciaYears || "1-3");
        setInput("reg-habilidades", user.habilidades);
        setInput("reg-idiomas", user.idiomas);

        // Preferencias
        setInput("reg-modalidad", user.modalidadLaboral || "Híbrido");
        setInput("reg-disponibilidad", user.disponibilidad || "Inmediata");
        setInput("reg-salario", user.expectativaSalarial);

        // CV Info
        if (user.cv) {
            if (cvFileName) cvFileName.textContent = user.cv.name;
            if (cvFileMeta) cvFileMeta.textContent = `Subido el ${user.cv.date} • ${user.cv.size}`;
        }

        // Privacidad
        if (user.privacidad) {
            setCheckbox("privacy-visible", user.privacidad.visible !== false);
            setCheckbox("privacy-disability", user.privacidad.disability !== false);
            setCheckbox("privacy-alerts", user.privacidad.alerts !== false);
            setCheckbox("privacy-newsletter", user.privacidad.newsletter === true);
        }
    }

    async function updateActivityStats() {
        const db = await Data.getDB();
        const userPostulaciones = (db.postulaciones || []).filter(p => p.email === user.correo);
        
        const total = userPostulaciones.length;
        const enProceso = userPostulaciones.filter(p => p.estado === "Pendiente" || p.estado === "En revisión").length;
        
        let anio = "2024";
        if (user.fechaRegistro) {
            const parts = user.fechaRegistro.split("/");
            if (parts.length === 3) anio = parts[2];
            else {
                const date = new Date(user.fechaRegistro);
                if (!isNaN(date.getTime())) anio = date.getFullYear();
            }
        }

        document.getElementById("stat-postulaciones").textContent = total;
        document.getElementById("stat-proceso").textContent = enProceso;
        document.getElementById("stat-miembro").textContent = anio;
    }

    function setInput(id, value) {
        const el = document.getElementById(id);
        if (el) el.value = value || "";
    }

    function setCheckbox(id, checked) {
        const el = document.getElementById(id);
        if (el) el.checked = checked;
    }

    await loadProfile();

    // ===============================================
    // Guardar datos asincrónicamente
    // ===============================================
    async function saveAndNotify() {
        try {
            await Data.updateUser(user.correo, user);
            Auth.setActiveUser(user);
            
            // Actualizar UI inmediata
            sidebarName.textContent = `${user.nombre} ${user.apellido}`.trim();
            sidebarPhone.textContent = user.telefono || "No especificado";
            
            const sidebarLocation = document.getElementById("sidebarLocation");
            if (sidebarLocation) {
                sidebarLocation.textContent = `${user.ciudad || ""}, ${user.pais || ""}`.replace(/^, |, $/, "") || "Ubicación no especificada";
            }
            const sidebarExperience = document.getElementById("sidebarExperience");
            if (sidebarExperience) {
                const years = user.experienciaYears || "0-1";
                sidebarExperience.textContent = `${years === "0-1" ? "Menos de 1 año" : years + " años"} de experiencia`;
            }
            
            await updateActivityStats();
            toast.show();
        } catch (e) {
            console.error("Error al guardar perfil:", e);
            alert("No se pudieron guardar los cambios en la nube.");
        }
    }

    // Eventos de los formularios
    [formPersonal, formDisability, formLaboral, formPreferences].forEach(form => {
        if (!form) return;
        form.addEventListener("submit", async e => {
            e.preventDefault();
            
            if (form.id === "formPersonal") {
                user.nombre = document.getElementById("reg-nombre").value.trim();
                user.apellido = document.getElementById("reg-apellido").value.trim();
                user.tipoDoc = document.getElementById("reg-tipo-doc").value;
                user.numDoc = document.getElementById("reg-num-doc").value.trim();
                user.fechaNacimiento = document.getElementById("reg-fecha-nacimiento").value;
                user.telefono = document.getElementById("reg-telefono").value.trim();
                user.direccion = document.getElementById("reg-direccion").value.trim();
                user.codigoPostal = document.getElementById("reg-cp").value.trim();
                user.ciudad = document.getElementById("reg-ciudad").value.trim();
                user.pais = document.getElementById("reg-pais").value.trim();
            }

            if (form.id === "formDisability") {
                user.discapacidad = document.getElementById("reg-tipo-discapacidad").value;
                user.gradoDiscapacidad = document.getElementById("reg-grado-discapacidad").value;
                user.numCertificado = document.getElementById("reg-num-certificado").value.trim();
                user.vencimientoCertificado = document.getElementById("reg-vencimiento-certificado").value;
                user.adaptaciones = document.getElementById("reg-adaptaciones").value.trim();
                
                user.asistencia = [];
                if (document.getElementById("assist-accesibilidad").checked) user.asistencia.push("accesibilidad");
                if (document.getElementById("assist-tecnologia").checked) user.asistencia.push("tecnologia");
                if (document.getElementById("assist-interprete").checked) user.asistencia.push("interprete");
                if (document.getElementById("assist-remoto").checked) user.asistencia.push("remoto");
            }

            if (form.id === "formLaboral") {
                user.nivelEducativo = document.getElementById("reg-educacion").value;
                user.especializacion = document.getElementById("reg-especializacion").value.trim();
                user.experienciaYears = document.getElementById("reg-exp-years").value;
                user.habilidades = document.getElementById("reg-habilidades").value.trim();
                user.idiomas = document.getElementById("reg-idiomas").value.trim();
            }

            if (form.id === "formPreferences") {
                user.modalidadLaboral = document.getElementById("reg-modalidad").value;
                user.disponibilidad = document.getElementById("reg-disponibilidad").value;
                user.expectativaSalarial = document.getElementById("reg-salario").value.trim();

                user.privacidad = {
                    visible: document.getElementById("privacy-visible").checked,
                    disability: document.getElementById("privacy-disability").checked,
                    alerts: document.getElementById("privacy-alerts").checked,
                    newsletter: document.getElementById("privacy-newsletter").checked
                };
            }

            await saveAndNotify();
        });
    });

    // Subir foto a Cloud Storage
    photoInput.addEventListener("change", async e => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            // Mostrar estado de carga (opcional UX)
            profilePhoto.style.opacity = "0.5";
            const url = await Data.uploadFile(`usuarios/${user.correo}/foto_perfil_${Date.now()}`, file);
            
            profilePhoto.src = url;
            user.foto = url;
            await saveAndNotify();
            profilePhoto.style.opacity = "1";
        } catch (err) {
            console.error(err);
            alert("Error al subir la foto a la nube.");
            profilePhoto.style.opacity = "1";
        }
    });

    // Subir CV a Cloud Storage
    if (cvInput) {
        cvInput.addEventListener("change", async e => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.type !== "application/pdf") {
                alert("Por favor, sube solo archivos en formato PDF.");
                return;
            }

            try {
                if (cvFileName) cvFileName.textContent = "Subiendo archivo...";
                const url = await Data.uploadFile(`usuarios/${user.correo}/cv_${Date.now()}.pdf`, file);
                
                const date = new Date().toLocaleDateString();
                const size = (file.size / 1024).toFixed(0) + " KB";
                
                user.cv = {
                    name: file.name,
                    date: date,
                    size: size,
                    url: url // Guardamos la URL de la nube en lugar del Base64
                };

                if (cvFileName) cvFileName.textContent = file.name;
                if (cvFileMeta) cvFileMeta.textContent = `Subido el ${date} • ${size}`;
                
                await saveAndNotify();
            } catch (err) {
                console.error(err);
                alert("Error al subir el CV a la nube.");
                if (cvFileName) cvFileName.textContent = "Error al subir";
            }
        });
    }

    // Botones de cancelar
    document.querySelectorAll(".btn-cancel").forEach(btn => {
        btn.addEventListener("click", async () => {
            if (confirm("¿Estás seguro de que deseas cancelar? Se perderán los cambios no guardados.")) {
                await loadProfile();
            }
        });
    });

    // Cerrar sesión
    document.getElementById("logoutBtn").addEventListener("click", async (e) => {
        e.preventDefault();
        await Auth.logout();
    });
});
