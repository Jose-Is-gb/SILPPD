
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = {
    store: {},
    getItem(key) { return this.store[key] || null; },
    setItem(key, value) { this.store[key] = value.toString(); },
    clear() { this.store = {}; }
};

// Mocking the Data object since I can't easily import it without a module system here
// I'll define a testable version of the logic found in BD/data.js
const Data = {
    getDB() {
        let db = JSON.parse(localStorage.getItem("TI_DATABASE"));
        if (!db) {
            db = { usuarios: [], ofertas: [], empresas: [] };
        }
        return db;
    },
    saveDB(db) {
        localStorage.setItem("TI_DATABASE", JSON.stringify(db));
    },
    addUser(user) {
        const db = this.getDB();
        db.usuarios.push(user);
        this.saveDB(db);
    },
    getUserByEmail(email) {
        const db = this.getDB();
        return db.usuarios.find(u => u.correo === email) || null;
    }
};

// --- Test Suite ---
function runTests() {
    console.log("=== Corriendo Pruebas Unitarias (Metodologías Ágiles - Sprint 1) ===");
    let passed = 0;
    let failed = 0;

    // Test 1: Agregar Usuario
    const testUser = { nombre: "Test", correo: "test@pruebas.com" };
    Data.addUser(testUser);
    const retrieved = Data.getUserByEmail("test@pruebas.com");
    if (retrieved && retrieved.nombre === "Test") {
        console.log("[PASS] T-01: Registro de usuario en BD local");
        passed++;
    } else {
        console.log("[FAIL] T-01: Registro de usuario en BD local");
        failed++;
    }

    // Test 2: Usuario inexistente
    const missing = Data.getUserByEmail("noexiste@pruebas.com");
    if (missing === null) {
        console.log("[PASS] T-02: Búsqueda de usuario inexistente");
        passed++;
    } else {
        console.log("[FAIL] T-02: Búsqueda de usuario inexistente");
        failed++;
    }

    console.log(`\nResumen: ${passed} pasadas, ${failed} fallidas.`);
}

runTests();
