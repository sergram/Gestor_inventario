const API = "/api";

let sucursalesDisponibles = [];
let articulosDisponibles = [];


/* =========================
   PANEL PRINCIPAL
========================= */

async function cargarPanel() {

    try {

        const [
            respuestaSucursales,
            respuestaInventario,
            respuestaBajo
        ] = await Promise.all([
            fetch(`${API}/sucursales`),
            fetch(`${API}/inventario`),
            fetch(`${API}/inventario/bajo`)
        ]);

        if (
            !respuestaSucursales.ok ||
            !respuestaInventario.ok ||
            !respuestaBajo.ok
        ) {
            throw new Error("No fue posible cargar el panel");
        }

        const sucursales = await respuestaSucursales.json();
        const inventario = await respuestaInventario.json();
        const inventarioBajo = await respuestaBajo.json();

        sucursalesDisponibles = sucursales;

        /* Obtener artículos únicos del inventario */
        const mapaArticulos = new Map();

        inventario.forEach(item => {

            if (!mapaArticulos.has(item.articulo_id)) {

                mapaArticulos.set(item.articulo_id, {
                    id: item.articulo_id,
                    nombre: item.articulo
                });

            }

        });

        articulosDisponibles = Array.from(mapaArticulos.values());


        /* RESUMEN */

        document.getElementById("totalSucursales").textContent =
            sucursales.length;

        document.getElementById("totalArticulos").textContent =
            articulosDisponibles.length;

        document.getElementById("totalBajo").textContent =
            inventarioBajo.length;


        /* MOSTRAR DATOS */

        mostrarInventario(inventario);

        cargarOpcionesMovimiento();

    } catch (error) {

        console.error("Error cargando panel:", error);

    }
}


/* =========================
   INVENTARIO
========================= */

function mostrarInventario(inventario) {

    const tabla = document.getElementById("tablaInventario");

    tabla.innerHTML = "";

    if (inventario.length === 0) {

        tabla.innerHTML = `
            <tr>
                <td colspan="6">
                    No hay inventario registrado.
                </td>
            </tr>
        `;

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

            <td>
                ${cantidad}
                ${escaparHTML(item.unidad_medida || "")}
            </td>

            <td>
                ${minimo}
                ${escaparHTML(item.unidad_medida || "")}
            </td>

            <td class="${bajo ? "estado-bajo" : "estado-normal"}">
                ${bajo ? "Inventario bajo" : "Normal"}
            </td>
        `;

        tabla.appendChild(fila);

    });
}


/* =========================
   OPCIONES DE MOVIMIENTO
========================= */

function cargarOpcionesMovimiento() {

    const selectSucursal =
        document.getElementById("movSucursal");

    const selectArticulo =
        document.getElementById("movArticulo");


    selectSucursal.innerHTML =
        `<option value="">Seleccione una sucursal</option>`;

    sucursalesDisponibles.forEach(sucursal => {

        const opcion = document.createElement("option");

        opcion.value = sucursal.id;
        opcion.textContent = sucursal.nombre;

        selectSucursal.appendChild(opcion);

    });


    selectArticulo.innerHTML =
        `<option value="">Seleccione un artículo</option>`;

    articulosDisponibles.forEach(articulo => {

        const opcion = document.createElement("option");

        opcion.value = articulo.id;
        opcion.textContent = articulo.nombre;

        selectArticulo.appendChild(opcion);

    });

}


/* =========================
   REGISTRAR MOVIMIENTO
========================= */

document
    .getElementById("formMovimiento")
    .addEventListener("submit", async function (event) {

        event.preventDefault();

        const sucursalId =
            Number(document.getElementById("movSucursal").value);

        const articuloId =
            Number(document.getElementById("movArticulo").value);

        const tipo =
            document.getElementById("movTipo").value;

        const cantidad =
            Number(document.getElementById("movCantidad").value);

        const descripcion =
            document.getElementById("movDescripcion").value.trim();

        const resultado =
            document.getElementById("resultadoMovimiento");

        const boton =
            document.getElementById("btnMovimiento");


        resultado.innerHTML = "";


        if (
            !sucursalId ||
            !articuloId ||
            !tipo ||
            !cantidad ||
            cantidad <= 0
        ) {

            resultado.innerHTML = `
                <div class="mensaje-error">
                    Complete correctamente todos los campos obligatorios.
                </div>
            `;

            return;
        }


        boton.disabled = true;
        boton.textContent = "Registrando...";


        try {

            const respuesta = await fetch(`${API}/movimientos`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    sucursal_id: sucursalId,
                    articulo_id: articuloId,
                    tipo: tipo,
                    cantidad: cantidad,
                    descripcion: descripcion
                })

            });


            const datos = await respuesta.json();


            if (!respuesta.ok) {

                throw new Error(
                    datos.error ||
                    "No fue posible registrar el movimiento"
                );

            }


            resultado.innerHTML = `
                <div class="mensaje-exito">
                    Movimiento registrado correctamente.
                </div>
            `;


            /* Limpiar formulario */

            document.getElementById("movTipo").value = "";
            document.getElementById("movCantidad").value = "";
            document.getElementById("movDescripcion").value = "";


            /* Actualizar inventario */

            await cargarPanel();


        } catch (error) {

            resultado.innerHTML = `
                <div class="mensaje-error">
                    ${escaparHTML(error.message)}
                </div>
            `;

        } finally {

            boton.disabled = false;
            boton.textContent = "Registrar movimiento";

        }

    });


/* =========================
   ASISTENTE IA
========================= */

document
    .getElementById("formAsistente")
    .addEventListener("submit", async function (event) {

        event.preventDefault();

        const input =
            document.getElementById("mensaje");

        const boton =
            document.getElementById("btnEnviar");

        const respuestaElemento =
            document.getElementById("respuestaAsistente");

        const mensaje = input.value.trim();


        if (!mensaje) {
            return;
        }


        boton.disabled = true;
        boton.textContent = "Procesando...";

        respuestaElemento.textContent =
            "El asistente está procesando la consulta...";


        try {

            const respuesta = await fetch(`${API}/asistente`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    mensaje: mensaje
                })

            });


            const datos = await respuesta.json();


            if (!respuesta.ok) {

                throw new Error(
                    datos.error ||
                    "No fue posible procesar la consulta"
                );

            }


            respuestaElemento.textContent =
                datos.respuesta ||
                "Consulta procesada correctamente.";


            input.value = "";


            /* Actualizar información */

            await cargarPanel();
            await cargarHistorial();


        } catch (error) {

            respuestaElemento.textContent =
                error.message;

        } finally {

            boton.disabled = false;
            boton.textContent = "Consultar";

        }

    });


/* =========================
   HISTORIAL IA
========================= */

async function cargarHistorial() {

    const contenedor =
        document.getElementById("historial");


    try {

        const respuesta =
            await fetch(`${API}/interacciones`);


        if (!respuesta.ok) {

            throw new Error(
                "No fue posible cargar el historial"
            );

        }


        const historial =
            await respuesta.json();


        mostrarHistorial(historial);


    } catch (error) {

        contenedor.textContent =
            "No fue posible cargar el historial.";

    }

}


function mostrarHistorial(historial) {

    const contenedor =
        document.getElementById("historial");


    contenedor.innerHTML = "";


    if (historial.length === 0) {

        contenedor.textContent =
            "Todavía no existen consultas registradas.";

        return;
    }


    historial
        .slice(0, 5)
        .forEach(item => {

            const elemento =
                document.createElement("div");

            elemento.className =
                "item-historial";


            const fecha =
                item.fecha
                    ? new Date(item.fecha).toLocaleString()
                    : "";


            elemento.innerHTML = `
                <strong>
                    ${escaparHTML(item.pregunta)}
                </strong>

                <p>
                    ${escaparHTML(item.respuesta)}
                </p>

                <small>
                    Estado:
                    ${escaparHTML(item.estado)}
                    ${fecha ? " · " + escaparHTML(fecha) : ""}
                </small>
            `;


            contenedor.appendChild(elemento);

        });

}


/* =========================
   SEGURIDAD
========================= */

function escaparHTML(texto) {

    const div =
        document.createElement("div");

    div.textContent =
        texto === null || texto === undefined
            ? ""
            : String(texto);

    return div.innerHTML;

}


/* =========================
   INICIO
========================= */

cargarPanel();
cargarHistorial();