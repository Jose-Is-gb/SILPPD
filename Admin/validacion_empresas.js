
document.addEventListener("DOMContentLoaded", () => {
let empresaSeleccionada = null;

    const db = Data.getDB();

    // Construir lista de empresas desde ofertas
    const empresasUnicas = [...new Set(db.ofertas.map(o => o.empresa))];

    let empresas = empresasUnicas.map(nombre => {
        const ofertasEmpresa = db.ofertas.filter(o => o.empresa === nombre);

        // Buscar si ya existe en db.empresas (para recuperar ESTADO)
        const empresaGuardada = db.empresas?.find(e => e.nombre === nombre);

        return {
            nombre,
            sector: ofertasEmpresa[0]?.categoria || "No especificado",
            region: ofertasEmpresa[0]?.ciudad || "No especificado",
            descripcion: `Empresa registrada automáticamente a partir de ${ofertasEmpresa.length} oferta(s).`,
            estado: empresaGuardada?.estado || "Pendiente"
        };
    });

    // Referencias DOM
    const empresasContainer = document.getElementById("empresasContainer");
    const filtrarSector = document.getElementById("filtrarSector");
    const filtrarRegion = document.getElementById("filtrarRegion");
    const btnFiltrar = document.getElementById("btnFiltrar");
    const btnLimpiar = document.getElementById("btnLimpiar");

    const modal = new bootstrap.Modal(document.getElementById("modalEmpresa"));
    const modalTitulo = document.getElementById("modalEmpresaTitulo");
    const modalContenido = document.getElementById("modalEmpresaContenido");

    document.getElementById("btnAprobarModal").addEventListener("click", () => {
        if (empresaSeleccionada) {
            aprobarEmpresa(empresaSeleccionada.nombre);
        }
    });

    document.getElementById("btnRechazarModal").addEventListener("click", () => {
        if (empresaSeleccionada) {
            rechazarEmpresa(empresaSeleccionada.nombre);
        }
    });

    // Render tabla
    function renderEmpresas(lista = empresas) {
        empresasContainer.innerHTML = "";

        if (lista.length === 0) {
            empresasContainer.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted py-4">
                        <i class="fa fa-info-circle me-2"></i>No hay empresas registradas
                    </td>
                </tr>`;
            return;
        }

        lista.forEach(emp => {
            const estadoColor =
                emp.estado === "Aprobada" ? "bg-success" :
                emp.estado === "Rechazada" ? "bg-danger" :
                "bg-secondary";

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${emp.nombre}</td>
                <td>${emp.sector}</td>
                <td>${emp.region}</td>

                <td>
                    <span class="badge ${estadoColor}">${emp.estado}</span>
                </td>

                <td class="text-center">
                    <button class="btn btn-sm btn-primary me-1" onclick="verEmpresa('${emp.nombre}')">
                        <i class="fa fa-eye"></i>
                    </button>

                    <button class="btn btn-sm btn-danger" onclick="eliminarEmpresa('${emp.nombre}')">
                        <i class="fa fa-trash"></i>
                    </button>

                </td>
            `;
            empresasContainer.appendChild(row);
        });
    }

    renderEmpresas();

    // Abrir modal empresa
    window.verEmpresa = function (nombre) {
        const empresa = empresas.find(e => e.nombre === nombre);
        if (!empresa) return;

        empresaSeleccionada = empresa; // GUARDAR TEMPORALMENTE LA EMPRESA

        modalTitulo.textContent = empresa.nombre;
        modalContenido.innerHTML = `
            <p><strong>Sector:</strong> ${empresa.sector}</p>
            <p><strong>Región:</strong> ${empresa.region}</p>
            <p><strong>Descripción:</strong></p>
            <p>${empresa.descripcion}</p>
            <p><strong>Estado:</strong> ${empresa.estado}</p>
        `;

        modal.show();
    };

    // ACTUALIZAR / APROBAR
    window.aprobarEmpresa = function (nombre) {
        const empresa = empresas.find(e => e.nombre === nombre);
        if (!empresa) return;

        const db = Data.getDB();

        let registro = db.empresas.find(e => e.nombre === nombre);

        if (!registro) {
            db.empresas.push({
                nombre: empresa.nombre,
                sector: empresa.sector,
                region: empresa.region,
                descripcion: empresa.descripcion,
                estado: "Aprobada"
            });
        } else {
            registro.estado = "Aprobada";
        }

        empresa.estado = "Aprobada";

        Data.saveDB(db);
        renderEmpresas();

        modal.hide();
        alert(` Empresa aprobada: ${empresa.nombre}`);
    };

    // RECHAZAR
    window.rechazarEmpresa = function (nombre) {
        const empresa = empresas.find(e => e.nombre === nombre);
        if (!empresa) return;

        const db = Data.getDB();

        let registro = db.empresas.find(e => e.nombre === nombre);

        if (!registro) {
            db.empresas.push({
                nombre: empresa.nombre,
                sector: empresa.sector,
                region: empresa.region,
                descripcion: empresa.descripcion,
                estado: "Rechazada"
            });
        } else {
            registro.estado = "Rechazada";
        }

        empresa.estado = "Rechazada";

        Data.saveDB(db);
        renderEmpresas();

        modal.hide();
        alert(` Empresa rechazada: ${empresa.nombre}`);
    };

    window.eliminarEmpresa = function (nombre) {
        if (!confirm(`¿Eliminar la empresa "${nombre}"? Esta acción no se puede deshacer.`)) return;

        const db = Data.getDB();

        // Eliminar de la lista temporal
        empresas = empresas.filter(e => e.nombre !== nombre);

        // Eliminar de la base guardada si existe
        db.empresas = db.empresas.filter(e => e.nombre !== nombre);

        Data.saveDB(db);
        renderEmpresas();

        alert(`Empresa eliminada: ${nombre}`);
    };

    // Filtros
    btnFiltrar.addEventListener("click", () => {
        const sector = filtrarSector.value;
        const region = filtrarRegion.value;

        const filtradas = empresas.filter(e =>
            (sector === "all" || e.sector === sector) &&
            (region === "all" || e.region === region)
        );

        renderEmpresas(filtradas);
    });

    btnLimpiar.addEventListener("click", () => {
        filtrarSector.value = "all";
        filtrarRegion.value = "all";
        renderEmpresas();
    });
});
