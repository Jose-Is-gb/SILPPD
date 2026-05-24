// ===============================
// utils/security.js — Funciones de seguridad y sanitización
// ===============================

const Security = {
    // XSS: Sanitizar contenido HTML usando DOMPurify
    sanitizeHTML(htmlStr) {
        if (typeof DOMPurify !== 'undefined') {
            const str = htmlStr.trim();
            // Evitar que el navegador y DOMPurify eliminen etiquetas de tabla huérfanas
            if (str.startsWith('<td') || str.startsWith('<th')) {
                const clean = DOMPurify.sanitize('<table><tr>' + htmlStr + '</tr></table>');
                const temp = document.createElement('div');
                temp.innerHTML = clean;
                const tr = temp.querySelector('tr');
                return tr ? tr.innerHTML : '';
            } else if (str.startsWith('<tr')) {
                const clean = DOMPurify.sanitize('<table><tbody>' + htmlStr + '</tbody></table>');
                const temp = document.createElement('div');
                temp.innerHTML = clean;
                const tbody = temp.querySelector('tbody');
                return tbody ? tbody.innerHTML : '';
            }
            return DOMPurify.sanitize(htmlStr);
        }
        console.warn("DOMPurify no está cargado. Usando fallback básico.");
        const temp = document.createElement('div');
        temp.textContent = htmlStr;
        return temp.innerHTML;
    },

    // Inyección de Headers de Email: Validación estricta RFC 5321 (sin saltos de línea)
    isValidEmailStrict(email) {
        if (typeof email !== 'string') return false;
        // Evita inyección de cabeceras (\r, \n, %0A, %0D)
        if (/[\r\n]|%0[ad]/i.test(email)) return false;
        
        // Expresión regular robusta para email
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email.toLowerCase());
    },

    // LDAP Injection: Escapar caracteres especiales para filtros LDAP (Futura integración)
    escapeLDAP(input) {
        if (typeof input !== 'string') return '';
        // RFC 4515 - String Representation of Search Filters
        return input.replace(/[\*\(\)\\\x00]/g, function(char) {
            switch (char) {
                case '*': return '\\2a';
                case '(': return '\\28';
                case ')': return '\\29';
                case '\\': return '\\5c';
                case '\x00': return '\\00';
            }
        });
    },

    // Validación estricta de tipos de entrada para evitar NoSQL Injection
    isString(value) {
        return typeof value === 'string';
    }
};

// Exportar globalmente si estamos en entorno navegador
if (typeof window !== 'undefined') {
    window.Security = Security;
}
