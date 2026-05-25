// =================================================================
// test_requerimientos.js — Suite de Pruebas Unitarias para SILPPD
// =================================================================

const assert = require('assert');

// ==========================================
// CAPA DE COMPATIBILIDAD JEST (ZERO-DEP)
// ==========================================
let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`\x1b[32m[PASS]\x1b[0m ${name}`);
        passed++;
    } catch (e) {
        console.error(`\x1b[31m[FAIL]\x1b[0m ${name}`);
        console.error(`      Error: ${e.message}`);
        failed++;
    }
}

function expect(actual) {
    return {
        toBe: (expected) => {
            assert.strictEqual(actual, expected);
        },
        toEqual: (expected) => {
            assert.deepStrictEqual(actual, expected);
        }
    };
}

// =================================================================
// LOGICA DE REQUERIMIENTOS BAJO PRUEBA (IMPLEMENTACION DEL SISTEMA)
// =================================================================

// RF03: Autenticación
function validarCredenciales(email, password) {
    if (!email || !password) return false;
    if (!email.includes('@')) return false;
    return true;
}

// RF05: Recuperación de contraseña
function validarEmailRecuperacion(email) {
    if (!email) return false;
    if (!email.includes('@')) return false;
    return true;
}

// RF11: Consultar postulaciones
function consultarPostulaciones(postulaciones, idUsuario) {
    if (!Array.isArray(postulaciones)) return [];
    if (!idUsuario) return [];
    return postulaciones.filter(p => p.idUsuario === idUsuario);
}

// RF09: Filtrar ofertas
function filtrarOfertas(ofertas, categoria, ubicacion = '', tipo = '') {
    if (!Array.isArray(ofertas)) return [];
    return ofertas.filter(o => {
        const matchCat = !categoria || o.categoria === categoria;
        const matchUbi = !ubicacion || o.ubicacion === ubicacion;
        const matchTip = !tipo || o.tipo === tipo;
        return matchCat && matchUbi && matchTip;
    });
}


// =================================================================
//  EJECUCIÓN DE PRUEBAS UNITARIAS
// =================================================================

console.log("\x1b[36m===================================================\x1b[0m");
console.log("\x1b[36m   INICIANDO PRUEBAS UNITARIAS DE REQUERIMIENTOS   \x1b[0m");
console.log("\x1b[36m===================================================\x1b[0m\n");


// --------------------------------------------------
//  RF03: Autenticación (Pruebas de Diapositiva 1)
// --------------------------------------------------
test('RF03 - Credenciales validas retorna true', () => {
    expect(validarCredenciales('juan@email.com', 'clave123')).toBe(true);
});

test('RF03 - Email sin @ retorna false', () => {
    expect(validarCredenciales('juanemail.com', 'clave123')).toBe(false);
});

test('RF03 - Password vacio retorna false', () => {
    expect(validarCredenciales('juan@email.com', '')).toBe(false);
});


// --------------------------------------------------
//  RF05: Recuperación de contraseña (Pruebas de Diapositiva 2)
// --------------------------------------------------
test('RF05 - Email valido retorna true', () => {
    expect(validarEmailRecuperacion('juan@email.com')).toBe(true);
});

test('RF05 - Email vacio retorna false', () => {
    expect(validarEmailRecuperacion('')).toBe(false);
});

test('RF05 - Email sin @ retorna false', () => {
    expect(validarEmailRecuperacion('juanemail.com')).toBe(false);
});


// --------------------------------------------------
//  RF11: Consultar postulaciones (Pruebas de Diapositiva 3)
// --------------------------------------------------
test('RF11 - Usuario valido retorna sus postulaciones', () => {
    const postulaciones = [
        { idUsuario: 1, idOferta: 10, estado: 'enviado' },
        { idUsuario: 1, idOferta: 11, estado: 'aceptado' },
        { idUsuario: 2, idOferta: 12, estado: 'rechazado' }
    ];
    const resultado = consultarPostulaciones(postulaciones, 1);
    expect(resultado.length).toBe(2);
});

test('RF11 - ID invalido retorna lista vacia', () => {
    const postulaciones = [
        { idUsuario: 1, idOferta: 10, estado: 'enviado' }
    ];
    const resultado = consultarPostulaciones(postulaciones, 0);
    expect(resultado.length).toBe(0);
});


// --------------------------------------------------
//  RF09: Filtrar ofertas (Pruebas de Diapositiva 4)
// --------------------------------------------------
test('RF09 - Filtrar por categoria retorna ofertas correctas', () => {
    const ofertas = [
        { titulo: 'Desarrollador', categoria: 'Tecnologia', ubicacion: 'Lima', tipo: 'Full-time' },
        { titulo: 'Contador', categoria: 'Finanzas', ubicacion: 'Arequipa', tipo: 'Part-time' }
    ];
    const resultado = filtrarOfertas(ofertas, 'Tecnologia', '', '');
    expect(resultado.length).toBe(1);
});

test('RF09 - Filtro sin coincidencias retorna lista vacia', () => {
    const ofertas = [
        { titulo: 'Desarrollador', categoria: 'Tecnologia', ubicacion: 'Lima', tipo: 'Full-time' }
    ];
    const resultado = filtrarOfertas(ofertas, 'Diseño', '', '');
    expect(resultado.length).toBe(0);
});





// ==========================================
// RESUMEN FINAL DE RESULTADOS
// ==========================================
console.log("\n\x1b[36m===================================================\x1b[0m");
console.log(`\x1b[36m   RESULTADOS: ${passed} Pasaron, ${failed} Fallaron   \x1b[0m`);
console.log("\x1b[36m===================================================\x1b[0m\n");

if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
