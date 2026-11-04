
const API = "/api";

let sucursalesDisponibles = [];
let articulosDisponibles = [];
let inventarioActual = [];

/* =========================
   NAVEGACIÓN
========================= */

const titulos = {
    dashboard: "Dashboard",
    inventario: "Inventario",
    movimientos: "Movimientos",
    asistente: "Asistente IA",
    historial: "Historial IA",
    sucursales: "Sucursales",
    articulos: "Artículos"
};

document.querySelectorAll(".nav-link").forEach(boton => {
    boton.addEventListener("click", () => {
        const destino = boton.dataset.seccion;

        document.querySelectorAll(".nav-link").forEach(item => {
            item.classList.toggle("activo", item === boton);
        });

        document.querySelectorAll(".pagina").forEach(pagina => {
            pagina.classList.toggle("activa", pagina.id === destino);
        });

        document.getElementById("tituloPagina").textContent =
            titulos[destino] || "Administración";

        if (destino === "movimientos") cargarMovimientos();
        if (destino === "historial") cargarHistorial();
        if (destino === "inventario" || destino === "dashboard") {
            cargarPanel();
        }
    });
});

/* =========================
   UTILIDADES
========================= */

function escaparHTML(valor) {
    const div = document.createElement("div");
    div.textContent = valor == null ? "" : String(valor);
    return div.innerHTML;
}

async function obtenerJSON(ruta) {
    const respuesta = await fetch(`${API}${ruta}`);

    if (!respuesta.ok) {
        throw new Error(`Error HTTP ${respuesta.status}`);
    }

    return respuesta.json();
}

function mostrarMensaje(contenedor, mensaje, error = false) {
    contenedor.innerHTML = "";

    const elemento = document.createElement("div");
    elemento.className = error ? "mensaje-error" : "mensaje-exito";
    elemento.textContent = mensaje;

    contenedor.appendChild(elemento);
}

/* =========================
   PANEL E INVENTARIO
========================= */

async function cargarPanel() {
    try {
        const [sucursales, inventario, inventarioBajo] =
            await Promise.all([
                obtenerJSON("/sucursales"),
                obtenerJSON("/inventario"),
                obtenerJSON("/inventario/bajo")
            ]);

        sucursalesDisponibles = sucursales;
        inventarioActual = inventario;

        const mapa = new Map();

        inventario.forEach(item => {
            if (!mapa.has(item.articulo_id)) {
                mapa.set(item.articulo_id, {
                    id: item.articulo_id,
                    nombre: item.articulo,
                    tipo: item.tipo
                });
            }
        });

        articulosDisponibles = [...mapa.values()];

        document.getElementById("totalSucursales").textContent =
            sucursales.length;

        document.getElementById("totalArticulos").textContent =
            articulosDisponibles.length;

        document.getElementById("totalBajo").textContent =
            inventarioBajo.length;

        cargarFiltroSucursales();
        aplicarFiltrosInventario();

        mostrarSucursales(sucursales);
        mostrarArticulos(articulosDisponibles);
        cargarOpcionesMovimiento();
        cargarSucursalesArticulo();
        cargarOpcionesAsignacion();
        cargarOpcionesMinimo();

    } catch (error) {
        console.error("Error al cargar panel:", error);
        document.getElementById("tablaInventario").innerHTML =
            '<tr><td colspan="6">No se pudo cargar el inventario.</td></tr>';
    }
}

function mostrarInventario(inventario) {
    const tabla = document.getElementById("tablaInventario");
    tabla.innerHTML = "";

    if (!inventario.length) {
        tabla.innerHTML =
            '<tr><td colspan="6">Sin registros de inventario.</td></tr>';
        return;
    }

    inventario.forEach(item => {
        const cantidad = Number(item.cantidad);
        const minimo = Number(item.stock_minimo);
        const bajo = cantidad <= minimo;

        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td>${escaparHTML(item.sucursal)}</td>
            <td>${escaparHTML(item.articulo)}</td>
            <td>${escaparHTML(item.tipo)}</td>
            <td>${cantidad} ${escaparHTML(item.unidad_medida)}</td>
            <td>${minimo} ${escaparHTML(item.unidad_medida)}</td>
            <td class="${bajo ? "estado-bajo" : "estado-normal"}">
                ${bajo ? "Inventario bajo" : "Normal"}
            </td>
        `;

        tabla.appendChild(fila);
    });
}

/* =========================
   FILTROS DE INVENTARIO
========================= */

function cargarFiltroSucursales() {
    const select = document.getElementById("filtroSucursal");
    const seleccionAnterior = select.value;

    select.innerHTML =
        '<option value="">Todas las sucursales</option>';

    sucursalesDisponibles.forEach(sucursal => {
        const opcion = document.createElement("option");
        opcion.value = sucursal.id;
        opcion.textContent = sucursal.nombre;
        select.appendChild(opcion);
    });

    select.value = seleccionAnterior;
}

function aplicarFiltrosInventario() {
    const busqueda = document
        .getElementById("buscarInventario")
        .value.trim().toLowerCase();

    const sucursalSeleccionada =
        document.getElementById("filtroSucursal").value;

    const estadoSeleccionado =
        document.getElementById("filtroEstado").value;

    const sucursal = sucursalesDisponibles.find(
        s => String(s.id) === sucursalSeleccionada
    );

    const filtrados = inventarioActual.filter(item => {
        const coincideNombre = String(item.articulo || "")
            .toLowerCase()
            .includes(busqueda);

        const coincideSucursal =
            !sucursalSeleccionada ||
            (sucursal &&
                String(item.sucursal).toLowerCase() ===
                String(sucursal.nombre).toLowerCase());

        const bajo =
            Number(item.cantidad) <= Number(item.stock_minimo);

        const coincideEstado =
            !estadoSeleccionado ||
            (estadoSeleccionado === "BAJO" && bajo) ||
            (estadoSeleccionado === "NORMAL" && !bajo);

        return coincideNombre &&
               coincideSucursal &&
               coincideEstado;
    });

    mostrarInventario(filtrados);

    document.getElementById("contadorInventario").textContent =
        `Mostrando ${filtrados.length} de ${inventarioActual.length} registros`;
}

document.getElementById("buscarInventario")
    .addEventListener("input", aplicarFiltrosInventario);

document.getElementById("filtroSucursal")
    .addEventListener("change", aplicarFiltrosInventario);

document.getElementById("filtroEstado")
    .addEventListener("change", aplicarFiltrosInventario);

document.getElementById("limpiarFiltros")
    .addEventListener("click", () => {
        document.getElementById("buscarInventario").value = "";
        document.getElementById("filtroSucursal").value = "";
        document.getElementById("filtroEstado").value = "";

        aplicarFiltrosInventario();
    });


/* =========================
   SUCURSALES Y ARTÍCULOS
========================= */

function mostrarSucursales(sucursales) {
    const contenedor = document.getElementById("listaSucursales");

    if (!sucursales.length) {
        contenedor.textContent = "No hay sucursales registradas.";
        return;
    }

    contenedor.innerHTML = `
        <div class="tabla-contenedor">
            <table>
                <thead>
                    <tr><th>ID</th><th>Nombre</th><th>Municipio</th></tr>
                </thead>
                <tbody>
                    ${sucursales.map(s => `
                        <tr>
                            <td>${escaparHTML(s.id)}</td>
                            <td>${escaparHTML(s.nombre)}</td>
                            <td>${escaparHTML(s.municipio || "")}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

function mostrarArticulos(articulos) {
    const contenedor = document.getElementById("listaArticulos");

    if (!articulos.length) {
        contenedor.textContent = "No hay artículos en el inventario.";
        return;
    }

    contenedor.innerHTML = `
        <div class="tabla-contenedor">
            <table>
                <thead>
                    <tr><th>ID</th><th>Artículo</th><th>Tipo</th></tr>
                </thead>
                <tbody>
                    ${articulos.map(a => `
                        <tr>
                            <td>${escaparHTML(a.id)}</td>
                            <td>${escaparHTML(a.nombre)}</td>
                            <td>${escaparHTML(a.tipo)}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

/* =========================
   FORMULARIO DE MOVIMIENTOS
========================= */

function cargarOpcionesMovimiento() {
    const selectSucursal = document.getElementById("movSucursal");
    const selectArticulo = document.getElementById("movArticulo");

    const sucursalSeleccionada = selectSucursal.value;
    const articuloSeleccionado = selectArticulo.value;

    selectSucursal.innerHTML =
        '<option value="">Seleccione una sucursal</option>';

    sucursalesDisponibles.forEach(sucursal => {
        const opcion = document.createElement("option");
        opcion.value = sucursal.id;
        opcion.textContent = sucursal.nombre;
        selectSucursal.appendChild(opcion);
    });

    selectSucursal.value = sucursalSeleccionada;

    selectArticulo.innerHTML =
        '<option value="">Seleccione un artículo</option>';

    articulosDisponibles.forEach(articulo => {
        const opcion = document.createElement("option");
        opcion.value = articulo.id;
        opcion.textContent = articulo.nombre;
        selectArticulo.appendChild(opcion);
    });

    selectArticulo.value = articuloSeleccionado;
}

document.getElementById("formMovimiento")
    .addEventListener("submit", async event => {
        event.preventDefault();

        const sucursal_id = Number(
            document.getElementById("movSucursal").value
        );
        const articulo_id = Number(
            document.getElementById("movArticulo").value
        );
        const tipo = document.getElementById("movTipo").value;
        const cantidad = Number(
            document.getElementById("movCantidad").value
        );
        const descripcion =
            document.getElementById("movDescripcion").value.trim();

        const resultado = document.getElementById("resultadoMovimiento");
        const boton = document.getElementById("btnMovimiento");

        if (!sucursal_id || !articulo_id ||
            !["ENTRADA", "SALIDA"].includes(tipo) ||
            !Number.isFinite(cantidad) || cantidad <= 0) {
            mostrarMensaje(resultado, "Revise los campos del movimiento.", true);
            return;
        }

        boton.disabled = true;

        try {
            const respuesta = await fetch(`${API}/movimientos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sucursal_id,
                    articulo_id,
                    tipo,
                    cantidad,
                    descripcion
                })
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(datos.error || "Error al registrar movimiento");
            }

            mostrarMensaje(resultado, "Movimiento registrado correctamente.");

            document.getElementById("formMovimiento").reset();

            await cargarPanel();
            await cargarMovimientos();

        } catch (error) {
            mostrarMensaje(resultado, error.message, true);
        } finally {
            boton.disabled = false;
        }
    });

/* =========================
   HISTORIAL DE MOVIMIENTOS
========================= */

async function cargarMovimientos() {
    const contenedor = document.getElementById("historialMovimientos");

    try {
        const movimientos = await obtenerJSON("/movimientos");

        if (!movimientos.length) {
            contenedor.textContent = "No hay movimientos registrados.";
            return;
        }

        const columnas = [
            ["Fecha", m => m.fecha],
            ["Sucursal", m => m.sucursal || m.sucursal_id],
            ["Artículo", m => m.articulo || m.articulo_id],
            ["Tipo", m => m.tipo],
            ["Cantidad", m => m.cantidad],
            ["Descripción", m => m.descripcion || ""]
        ];

        contenedor.innerHTML = `
            <div class="tabla-contenedor">
                <table>
                    <thead>
                        <tr>${columnas.map(c => `<th>${c[0]}</th>`).join("")}</tr>
                    </thead>
                    <tbody>
                        ${movimientos.map(m => `
                            <tr>
                                ${columnas.map(([nombre, obtener]) => {
                                    let valor = obtener(m);
                                    if (nombre === "Fecha" && valor) {
                                        valor = new Date(valor).toLocaleString("es-GT");
                                    }
                                    return `<td>${escaparHTML(valor)}</td>`;
                                }).join("")}
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `;

    } catch (error) {
        contenedor.textContent = "No se pudo cargar el historial de movimientos.";
        console.error(error);
    }
}

/* =========================
   ASISTENTE IA
========================= */

document.getElementById("formAsistente")
    .addEventListener("submit", async event => {
        event.preventDefault();

        const input = document.getElementById("mensaje");
        const boton = document.getElementById("btnEnviar");
        const salida = document.getElementById("respuestaAsistente");
        const mensaje = input.value.trim();

        if (!mensaje) return;

        boton.disabled = true;
        salida.textContent = "Procesando consulta...";

        try {
            const respuesta = await fetch(`${API}/asistente`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mensaje })
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(datos.error || "No se pudo procesar la consulta");
            }

            salida.textContent = datos.respuesta || "Sin respuesta disponible.";
            input.value = "";

            await cargarPanel();
            await cargarHistorial();

        } catch (error) {
            salida.textContent = error.message;
        } finally {
            boton.disabled = false;
        }
    });

/* =========================
   HISTORIAL DEL ASISTENTE
========================= */

async function cargarHistorial() {
    const contenedor = document.getElementById("historialContenido");

    try {
        const historial = await obtenerJSON("/interacciones");
        contenedor.innerHTML = "";

        if (!historial.length) {
            contenedor.textContent = "No hay interacciones registradas.";
            return;
        }

        historial.slice(0, 20).forEach(item => {
            const elemento = document.createElement("div");
            elemento.className = "item-historial";

            const fecha = item.fecha
                ? new Date(item.fecha).toLocaleString("es-GT")
                : "";

            elemento.innerHTML = `
                <strong>${escaparHTML(item.pregunta)}</strong>
                <p>${escaparHTML(item.respuesta)}</p>
                <small>
                    ${escaparHTML(item.estado)}
                    ${fecha ? " · " + escaparHTML(fecha) : ""}
                </small>
            `;

            contenedor.appendChild(elemento);
        });

    } catch (error) {
        contenedor.textContent = "No se pudo cargar el historial.";
        console.error(error);
    }
}

/* =========================
   INICIALIZACIÓN
========================= */

async function iniciar() {
    await cargarPanel();
    await cargarHistorial();
}

iniciar();


/* =========================
   REGISTRO DE ARTÍCULOS
========================= */

function cargarSucursalesArticulo() {
    const select = document.getElementById("artSucursal");
    const seleccionAnterior = select.value;

    select.innerHTML =
        '<option value="">Seleccione una sucursal</option>';

    sucursalesDisponibles.forEach(sucursal => {
        const opcion = document.createElement("option");
        opcion.value = sucursal.id;
        opcion.textContent = sucursal.nombre;
        select.appendChild(opcion);
    });

    select.value = seleccionAnterior;
}

document.getElementById("formArticulo")
    .addEventListener("submit", async event => {
        event.preventDefault();

        const nombre =
            document.getElementById("artNombre").value.trim();

        const tipo =
            document.getElementById("artTipo").value;

        const unidad_medida =
            document.getElementById("artUnidad").value;

        const sucursal_id = Number(
            document.getElementById("artSucursal").value
        );

        const cantidad = Number(
            document.getElementById("artCantidad").value
        );

        const stock_minimo = Number(
            document.getElementById("artMinimo").value
        );

        const resultado =
            document.getElementById("resultadoArticulo");

        const boton =
            document.getElementById("btnArticulo");

        if (
            !nombre ||
            !["PRODUCTO", "INGREDIENTE"].includes(tipo) ||
            !unidad_medida ||
            !sucursal_id ||
            !Number.isFinite(cantidad) ||
            !Number.isFinite(stock_minimo) ||
            cantidad < 0 ||
            stock_minimo < 0
        ) {
            mostrarMensaje(
                resultado,
                "Revise los datos del artículo.",
                true
            );
            return;
        }

        boton.disabled = true;
        boton.textContent = "Registrando...";

        try {
            const respuesta = await fetch(`${API}/articulos`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nombre,
                    tipo,
                    unidad_medida,
                    sucursal_id,
                    cantidad,
                    stock_minimo
                })
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    datos.error ||
                    "No fue posible registrar el artículo"
                );
            }

            mostrarMensaje(
                resultado,
                "Artículo e inventario registrados correctamente."
            );

            document.getElementById("formArticulo").reset();

            await cargarPanel();

        } catch (error) {
            mostrarMensaje(resultado, error.message, true);
        } finally {
            boton.disabled = false;
            boton.textContent = "Registrar artículo";
        }
    });


/* =====================================
   ASIGNAR INVENTARIO A SUCURSAL
===================================== */


function cargarOpcionesAsignacion() {
    const selectArticulo = document.getElementById("asigArticulo");
    const selectSucursal = document.getElementById("asigSucursal");

    if (!selectArticulo || !selectSucursal) {
        console.error("No se encontraron los selectores de asignación");
        return;
    }

    selectArticulo.innerHTML =
        '<option value="">Seleccione un artículo</option>';

    selectSucursal.innerHTML =
        '<option value="">Seleccione una sucursal</option>';

    // Artículos disponibles
    articulosDisponibles.forEach(articulo => {
        const opcion = document.createElement("option");
        opcion.value = articulo.id;
        opcion.textContent = articulo.nombre;

        selectArticulo.appendChild(opcion);
    });

    // Sucursales disponibles
    sucursalesDisponibles.forEach(sucursal => {
        const opcion = document.createElement("option");
        opcion.value = sucursal.id;
        opcion.textContent = sucursal.nombre;

        selectSucursal.appendChild(opcion);
    });

    console.log("Artículos cargados:", articulosDisponibles.length);
    console.log("Sucursales cargadas:", sucursalesDisponibles.length);
}


document.getElementById("formAsignacion")
    .addEventListener("submit", async event => {
        event.preventDefault();

        const articulo_id = Number(
            document.getElementById("asigArticulo").value
        );

        const sucursal_id = Number(
            document.getElementById("asigSucursal").value
        );

        const cantidad = Number(
            document.getElementById("asigCantidad").value
        );

        const stock_minimo = Number(
            document.getElementById("asigMinimo").value
        );

        const resultado =
            document.getElementById("resultadoAsignacion");

        const boton =
            document.getElementById("btnAsignacion");

        if (
            !Number.isInteger(articulo_id) || articulo_id <= 0 ||
            !Number.isInteger(sucursal_id) || sucursal_id <= 0 ||
            !Number.isFinite(cantidad) || cantidad < 0 ||
            !Number.isFinite(stock_minimo) || stock_minimo < 0
        ) {
            mostrarMensaje(
                resultado,
                "Revise los datos de asignación.",
                true
            );
            return;
        }

        boton.disabled = true;
        boton.textContent = "Asignando...";

        try {
            const respuesta = await fetch(`${API}/inventario/asignar`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    articulo_id,
                    sucursal_id,
                    cantidad,
                    stock_minimo
                })
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    datos.error || "No fue posible asignar el inventario"
                );
            }

            mostrarMensaje(
                resultado,
                "Artículo asignado correctamente a la sucursal."
            );

            document.getElementById("formAsignacion").reset();

            await cargarPanel();

        } catch (error) {
            mostrarMensaje(resultado, error.message, true);
        } finally {
            boton.disabled = false;
            boton.textContent = "Asignar inventario";
        }
    });

/* =====================================
   ACTUALIZAR STOCK MÍNIMO
===================================== */

function cargarOpcionesMinimo() {
    const selectSucursal = document.getElementById("minSucursal");
    const seleccionAnterior = selectSucursal.value;

    selectSucursal.innerHTML =
        '<option value="">Seleccione una sucursal</option>';

    sucursalesDisponibles.forEach(sucursal => {
        const opcion = document.createElement("option");

        opcion.value = sucursal.id;
        opcion.textContent = sucursal.nombre;

        selectSucursal.appendChild(opcion);
    });

    selectSucursal.value = seleccionAnterior;
    cargarArticulosMinimo();
}


function cargarArticulosMinimo() {
    const sucursalId =
        document.getElementById("minSucursal").value;

    const selectArticulo =
        document.getElementById("minArticulo");

    const articuloAnterior = selectArticulo.value;

    selectArticulo.innerHTML =
        '<option value="">Seleccione un artículo</option>';

    selectArticulo.disabled = !sucursalId;

    if (!sucursalId) {
        return;
    }

    const sucursal = sucursalesDisponibles.find(
        s => String(s.id) === sucursalId
    );

    if (!sucursal) {
        return;
    }

    // Mostrar solo artículos asignados a esta sucursal
    inventarioActual
        .filter(item => item.sucursal === sucursal.nombre)
        .forEach(item => {
            const opcion = document.createElement("option");

            opcion.value = item.articulo_id;
            opcion.textContent = item.articulo;

            selectArticulo.appendChild(opcion);
        });

    if ([...selectArticulo.options].some(
        opcion => opcion.value === articuloAnterior
    )) {
        selectArticulo.value = articuloAnterior;
    }

    mostrarMinimoActual();
}


function mostrarMinimoActual() {
    const sucursalId =
        document.getElementById("minSucursal").value;

    const articuloId =
        document.getElementById("minArticulo").value;

    const sucursal = sucursalesDisponibles.find(
        s => String(s.id) === sucursalId
    );

    const registro = inventarioActual.find(item =>
        sucursal &&
        item.sucursal === sucursal.nombre &&
        String(item.articulo_id) === articuloId
    );

    document.getElementById("minValor").value =
        registro ? Number(registro.stock_minimo) : "";
}


document.getElementById("minSucursal")
    .addEventListener("change", cargarArticulosMinimo);

document.getElementById("minArticulo")
    .addEventListener("change", mostrarMinimoActual);


document.getElementById("formMinimo")
    .addEventListener("submit", async event => {
        event.preventDefault();

        const sucursal_id = Number(
            document.getElementById("minSucursal").value
        );

        const articulo_id = Number(
            document.getElementById("minArticulo").value
        );

        const stock_minimo = Number(
            document.getElementById("minValor").value
        );

        const resultado =
            document.getElementById("resultadoMinimo");

        const boton =
            document.getElementById("btnMinimo");

        if (
            !Number.isInteger(sucursal_id) ||
            sucursal_id <= 0 ||
            !Number.isInteger(articulo_id) ||
            articulo_id <= 0 ||
            !Number.isFinite(stock_minimo) ||
            stock_minimo < 0 ||
            stock_minimo > 99999999.99
        ) {
            mostrarMensaje(
                resultado,
                "Revise los datos ingresados.",
                true
            );
            return;
        }

        boton.disabled = true;
        boton.textContent = "Actualizando...";

        try {
            const respuesta = await fetch(
                `${API}/inventario/minimo`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        sucursal_id,
                        articulo_id,
                        stock_minimo
                    })
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    datos.error ||
                    "No fue posible actualizar el mínimo"
                );
            }

            await cargarPanel();

            mostrarMensaje(
                resultado,
                "Stock mínimo actualizado correctamente."
            );

        } catch (error) {
            mostrarMensaje(resultado, error.message, true);
        } finally {
            boton.disabled = false;
            boton.textContent = "Actualizar mínimo";
        }
    });
