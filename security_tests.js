// Pruebas unitarias de las mitigaciones de seguridad implementadas
const assert = require('assert');

// Simular el entorno de navegador y DOMPurify para el módulo de seguridad
global.window = global;
global.DOMPurify = {
    sanitize: (html) => {
        // Mock simple: si tiene un <script>, lo eliminamos
        return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
};

// Cargar el módulo Security
require('./utils/security.js');

function runTests() {
    let passed = 0;
    let failed = 0;

    function test(name, fn) {
        try {
            fn();
            console.log(`[PASS] ${name}`);
            passed++;
        } catch (e) {
            console.error(`[FAIL] ${name}`);
            console.error(e.message);
            failed++;
        }
    }

    console.log("=== INICIANDO TESTS DE SEGURIDAD ===\n");

    // 1. Email Header Injection
    test("Debe aceptar un correo válido", () => {
        assert.strictEqual(Security.isValidEmailStrict("usuario@empresa.com"), true);
    });

    test("Debe rechazar un correo con salto de línea (\\n) - Header Injection", () => {
        assert.strictEqual(Security.isValidEmailStrict("usuario@empresa.com\nCC: hacker@mal.com"), false);
    });

    test("Debe rechazar un correo con retorno de carro (\\r) - Header Injection", () => {
        assert.strictEqual(Security.isValidEmailStrict("usuario@empresa.com\rBCC: hacker@mal.com"), false);
    });

    test("Debe rechazar un correo con %0A (URL encoded newline)", () => {
        assert.strictEqual(Security.isValidEmailStrict("usuario@empresa.com%0ACC: hacker@mal.com"), false);
    });

    test("Debe rechazar si el input no es string (Object Injection Bypass)", () => {
        assert.strictEqual(Security.isValidEmailStrict({"$gt": ""}), false);
    });

    // 2. LDAP Injection
    test("Debe escapar un asterisco (*)", () => {
        assert.strictEqual(Security.escapeLDAP("admin*"), "admin\\2a");
    });

    test("Debe escapar paréntesis ( )", () => {
        assert.strictEqual(Security.escapeLDAP("admin(test)"), "admin\\28test\\29");
    });

    test("Debe manejar objetos maliciosos devolviendo un string vacío", () => {
        assert.strictEqual(Security.escapeLDAP({"$gt": ""}), "");
    });

    // 3. NoSQL Injection (Validaciones de tipo añadidas a data.js/auth.js equivalentes)
    test("Validación isString para prevenir NoSQL object injection", () => {
        assert.strictEqual(Security.isString({"$gt": ""}), false);
        assert.strictEqual(Security.isString("correo@test.com"), true);
    });

    // 4. XSS - Sanitización HTML
    test("Sanitizar contenido HTML malicioso con XSS (DOMPurify)", () => {
        const payload = "<p>Hola</p><script>alert(1)</script>";
        const safe = Security.sanitizeHTML(payload);
        assert.strictEqual(safe.includes("<script>"), false);
    });

    console.log(`\n=== RESULTADOS: ${passed} Pasaron, ${failed} Fallaron ===`);
}

runTests();
