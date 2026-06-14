/**
 * @file accessibility.js
 * @description Integración de Herramientas de Accesibilidad en SILPPD (ISO 9999 / WCAG 2.1).
 * Implementa un panel de control flotante que ofrece:
 *  - Alto contraste (Baja visión / Daltonismo)
 *  - Ajuste de tamaño de fuente (Lupa de Windows en navegador)
 *  - Lector de pantalla integrado (Text-to-Speech con SpeechSynthesis)
 *  - Guía visual / Regla de lectura (Apoyo cognitivo y visual)
 *  - Dictado por voz integrado (SpeechRecognition para discapacidad motriz)
 *  - Tipografía adaptada para dislexia (OpenDyslexic)
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Inyectar botón flotante y panel HTML en el DOM
    const htmlMarkup = `
    <!-- Botón flotante -->
    <button id="accessibility-trigger" aria-label="Abrir panel de accesibilidad" title="Panel de Accesibilidad">
        <i class="fa-solid fa-universal-access"></i>
    </button>

    <!-- Panel de opciones -->
    <div id="accessibility-panel" role="dialog" aria-labelledby="acc-title">
        <h4 id="acc-title"><i class="fa-solid fa-gear"></i> Accesibilidad e Inclusión</h4>
        
        <!-- Opción 1: Alto Contraste -->
        <div class="acc-option">
            <label>Modo de Contraste:</label>
            <div class="acc-btn-group">
                <button id="acc-contrast-normal" class="acc-btn active"><i class="fa-solid fa-eye"></i> Normal</button>
                <button id="acc-contrast-high" class="acc-btn"><i class="fa-solid fa-circle-half-stroke"></i> Alto Contraste</button>
            </div>
        </div>

        <!-- Opción 2: Tamaño del Texto -->
        <div class="acc-option">
            <label>Tamaño del Texto:</label>
            <div class="acc-btn-group">
                <button id="acc-text-dec" class="acc-btn"><i class="fa-solid fa-minus"></i> A-</button>
                <button id="acc-text-reset" class="acc-btn"><i class="fa-solid fa-rotate-left"></i> Reset</button>
                <button id="acc-text-inc" class="acc-btn"><i class="fa-solid fa-plus"></i> A+</button>
            </div>
        </div>

        <!-- Opción 3: Lector de Voz (TTS) -->
        <div class="acc-option">
            <label>Lector de Pantalla Integrado:</label>
            <div class="acc-btn-group">
                <button id="acc-tts-toggle" class="acc-btn"><i class="fa-solid fa-volume-xmark"></i> Activar Voz</button>
            </div>
        </div>

        <!-- Opción 4: Dictado por Voz (STT) -->
        <div class="acc-option">
            <label>Dictado por Voz (Micrófono):</label>
            <div class="acc-btn-group">
                <button id="acc-stt-toggle" class="acc-btn"><i class="fa-solid fa-microphone-slash"></i> Activar Dictado</button>
            </div>
        </div>

        <!-- Opción 5: Tipografía Dislexia -->
        <div class="acc-option">
            <label>Fuente para Dislexia:</label>
            <div class="acc-btn-group">
                <button id="acc-dyslexic-toggle" class="acc-btn"><i class="fa-solid fa-font"></i> OpenDyslexic</button>
            </div>
        </div>

        <!-- Opción 6: Regla de Lectura -->
        <div class="acc-option">
            <label>Regla de Lectura Visual:</label>
            <div class="acc-btn-group">
                <button id="acc-ruler-toggle" class="acc-btn"><i class="fa-solid fa-arrows-left-right-to-line"></i> Activar Regla</button>
            </div>
        </div>
    </div>

    <!-- Regla de lectura -->
    <div id="reading-ruler"></div>
    `;

    const container = document.createElement("div");
    container.innerHTML = htmlMarkup;
    document.body.appendChild(container);

    // 2. Elementos del DOM del Panel
    const trigger = document.getElementById("accessibility-trigger");
    const panel = document.getElementById("accessibility-panel");
    const btnContrastNormal = document.getElementById("acc-contrast-normal");
    const btnContrastHigh = document.getElementById("acc-contrast-high");
    const btnTextDec = document.getElementById("acc-text-dec");
    const btnTextReset = document.getElementById("acc-text-reset");
    const btnTextInc = document.getElementById("acc-text-inc");
    const btnTtsToggle = document.getElementById("acc-tts-toggle");
    const btnSttToggle = document.getElementById("acc-stt-toggle");
    const btnDyslexicToggle = document.getElementById("acc-dyslexic-toggle");
    const btnRulerToggle = document.getElementById("acc-ruler-toggle");
    const readingRuler = document.getElementById("reading-ruler");
    // --- Declaraciones previas para evitar Temporal Dead Zone (TDZ) ---
    const targetElements = "h1, h2, h3, h4, h5, p, label, button, a, input, textarea, select, li";

    const ttsHoverHandler = (e) => {
        const el = e.currentTarget;
        let text = "";
        
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            text = el.placeholder || (el.labels && el.labels[0] ? el.labels[0].textContent : "") || "Campo de texto";
        } else {
            text = el.innerText || el.getAttribute("aria-label") || el.title || "";
        }
        
        if (text) {
            speakText(text);
        }
    };

    // 3. Estados Locales
    let fontSizePercent = parseInt(localStorage.getItem("acc_fontSize")) || 100;
    let highContrast = localStorage.getItem("acc_contrast") === "high";
    let ttsActive = localStorage.getItem("acc_tts") === "active";
    let sttActive = localStorage.getItem("acc_stt") === "active";
    let dyslexicActive = localStorage.getItem("acc_dyslexic") === "active";
    let rulerActive = localStorage.getItem("acc_ruler") === "active";

    // --- Aplicar Estados Iniciales al Cargar ---
    applyFontSize();
    applyContrast();
    applyDyslexic();
    applyRuler();
    applyTtsStatus();
    applySttStatus();

    // Toggle Panel
    trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        panel.classList.toggle("open");
    });

    // Cierre al dar click afuera
    document.addEventListener("click", (e) => {
        if (!panel.contains(e.target) && !trigger.contains(e.target)) {
            panel.classList.remove("open");
        }
    });

    // --- LÓGICA 1: ALTO CONTRASTE ---
    btnContrastNormal.addEventListener("click", () => {
        highContrast = false;
        localStorage.setItem("acc_contrast", "normal");
        applyContrast();
    });

    btnContrastHigh.addEventListener("click", () => {
        highContrast = true;
        localStorage.setItem("acc_contrast", "high");
        applyContrast();
    });

    function applyContrast() {
        if (highContrast) {
            document.body.classList.add("high-contrast");
            btnContrastHigh.classList.add("active");
            btnContrastNormal.classList.remove("active");
        } else {
            document.body.classList.remove("high-contrast");
            btnContrastHigh.classList.remove("active");
            btnContrastNormal.classList.add("active");
        }
    }

    // --- LÓGICA 2: TAMAÑO DE TEXTO ---
    btnTextInc.addEventListener("click", () => {
        if (fontSizePercent < 150) {
            fontSizePercent += 10;
            saveFontSize();
        }
    });

    btnTextDec.addEventListener("click", () => {
        if (fontSizePercent > 80) {
            fontSizePercent -= 10;
            saveFontSize();
        }
    });

    btnTextReset.addEventListener("click", () => {
        fontSizePercent = 100;
        saveFontSize();
    });

    function saveFontSize() {
        localStorage.setItem("acc_fontSize", fontSizePercent);
        applyFontSize();
    }

    function applyFontSize() {
        document.body.style.fontSize = fontSizePercent + "%";
    }

    // --- LÓGICA 3: FUENTE DISLEXIA ---
    btnDyslexicToggle.addEventListener("click", () => {
        dyslexicActive = !dyslexicActive;
        localStorage.setItem("acc_dyslexic", dyslexicActive ? "active" : "inactive");
        applyDyslexic();
    });

    function applyDyslexic() {
        if (dyslexicActive) {
            document.body.classList.add("dyslexic-font");
            btnDyslexicToggle.classList.add("active");
        } else {
            document.body.classList.remove("dyslexic-font");
            btnDyslexicToggle.classList.remove("active");
        }
    }

    // --- LÓGICA 4: REGLA DE LECTURA ---
    btnRulerToggle.addEventListener("click", () => {
        rulerActive = !rulerActive;
        localStorage.setItem("acc_ruler", rulerActive ? "active" : "inactive");
        applyRuler();
    });

    function applyRuler() {
        if (rulerActive) {
            readingRuler.style.display = "block";
            btnRulerToggle.classList.add("active");
            document.addEventListener("mousemove", updateRulerPosition);
        } else {
            readingRuler.style.display = "none";
            btnRulerToggle.classList.remove("active");
            document.removeEventListener("mousemove", updateRulerPosition);
        }
    }

    function updateRulerPosition(e) {
        readingRuler.style.top = (e.clientY - 12) + "px";
    }

    // --- LÓGICA 5: LECTOR DE VOZ (TEXT TO SPEECH) ---
    btnTtsToggle.addEventListener("click", () => {
        ttsActive = !ttsActive;
        localStorage.setItem("acc_tts", ttsActive ? "active" : "inactive");
        applyTtsStatus();
        if (!ttsActive) {
            window.speechSynthesis.cancel();
        }
    });

    function applyTtsStatus() {
        if (ttsActive) {
            btnTtsToggle.innerHTML = '<i class="fa-solid fa-volume-high"></i> Voz Activa';
            btnTtsToggle.classList.add("active");
            enableTtsListeners();
        } else {
            btnTtsToggle.innerHTML = '<i class="fa-solid fa-volume-xmark"></i> Activar Voz';
            btnTtsToggle.classList.remove("active");
            disableTtsListeners();
        }
    }

    function speakText(text) {
        if (!ttsActive || !text) return;
        window.speechSynthesis.cancel(); // Detener cualquier lectura previa
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "es-ES";
        window.speechSynthesis.speak(utterance);
    }



    function enableTtsListeners() {
        document.querySelectorAll(targetElements).forEach(el => {
            // Evitar duplicar listeners
            el.removeEventListener("mouseenter", ttsHoverHandler);
            el.addEventListener("mouseenter", ttsHoverHandler);
        });
    }

    function disableTtsListeners() {
        document.querySelectorAll(targetElements).forEach(el => {
            el.removeEventListener("mouseenter", ttsHoverHandler);
        });
    }

    // --- LÓGICA 6: DICTADO POR VOZ (SPEECH RECOGNITION) ---
    btnSttToggle.addEventListener("click", () => {
        sttActive = !sttActive;
        localStorage.setItem("acc_stt", sttActive ? "active" : "inactive");
        applySttStatus();
    });

    function applySttStatus() {
        if (sttActive) {
            btnSttToggle.innerHTML = '<i class="fa-solid fa-microphone"></i> Dictado Activo';
            btnSttToggle.classList.add("active");
            injectMicrophoneButtons();
        } else {
            btnSttToggle.innerHTML = '<i class="fa-solid fa-microphone-slash"></i> Activar Dictado';
            btnSttToggle.classList.remove("active");
            removeMicrophoneButtons();
        }
    }

    let recognition = null;
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'es-PE';
        recognition.interimResults = false;
    }

    function injectMicrophoneButtons() {
        // Encontrar todos los campos de texto e inyectar un botón de micrófono pequeño
        const textInputs = document.querySelectorAll("input[type='text'], input[type='email'], textarea, input:not([type])");
        textInputs.forEach(input => {
            if (input.parentNode && !input.parentNode.querySelector(".btn-mic-dictation")) {
                // Crear wrapper para input y mic si no es flex
                const wrapper = document.createElement("div");
                wrapper.className = "position-relative d-flex align-items-center w-100";
                
                input.parentNode.insertBefore(wrapper, input);
                wrapper.appendChild(input);
                
                const micBtn = document.createElement("button");
                micBtn.type = "button";
                micBtn.className = "btn btn-sm btn-mic-dictation border-0 position-absolute end-0 me-2 text-danger";
                micBtn.style.zIndex = "5";
                micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
                micBtn.title = "Dictar por voz";
                
                micBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    startDictationFor(input);
                });
                
                wrapper.appendChild(micBtn);
            }
        });
    }

    function removeMicrophoneButtons() {
        document.querySelectorAll(".btn-mic-dictation").forEach(btn => {
            const wrapper = btn.parentNode;
            if (wrapper && wrapper.className.includes("position-relative")) {
                const input = wrapper.querySelector("input, textarea");
                if (input && wrapper.parentNode) {
                    wrapper.parentNode.insertBefore(input, wrapper);
                    wrapper.parentNode.removeChild(wrapper);
                }
            } else if (btn.parentNode) {
                btn.parentNode.removeChild(btn);
            }
        });
    }

    function startDictationFor(input) {
        if (!recognition) {
            alert("Tu navegador no soporta el reconocimiento de voz. Usa Chrome o Edge.");
            return;
        }

        input.classList.add("dictation-active");
        speakText("Escuchando...");

        recognition.onstart = () => {
            input.placeholder = "Escuchando... habla ahora.";
        };

        recognition.onresult = (e) => {
            const resultText = e.results[0][0].transcript;
            input.value = resultText;
            input.dispatchEvent(new Event("input")); // Disparar validación inline
            input.dispatchEvent(new Event("change"));
            speakText("Texto dictado: " + resultText);
        };

        recognition.onerror = (e) => {
            console.error("Error en reconocimiento:", e.error);
            input.classList.remove("dictation-active");
            speakText("No logré escucharte.");
        };

        recognition.onend = () => {
            input.classList.remove("dictation-active");
            input.placeholder = input.getAttribute("data-original-placeholder") || "";
        };

        // Guardar placeholder original
        if (!input.getAttribute("data-original-placeholder")) {
            input.setAttribute("data-original-placeholder", input.placeholder || "");
        }

        recognition.start();
    }
});
