const express = require("express");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://ollama:11434";

async function interpretarConsulta(mensaje) {

const prompt = `
Eres un clasificador de consultas para el sistema de inventario
de Panadería El Viajero.

NO debes responder la pregunta.
Únicamente debes clasificar la intención del usuario y extraer entidades.

INTENCIONES PERMITIDAS:

1. CONSULTAR_ARTICULO
Se utiliza cuando el usuario pregunta por la existencia, cantidad o estado
de un artículo específico.

Ejemplos:
"¿Cuánta harina tenemos?"
"¿Cómo andamos de harina?"
"¿Hay leche?"
"Quiero saber cuánto pan dulce queda"

2. INVENTARIO_BAJO
Se utiliza únicamente cuando el usuario quiere conocer qué artículos
están por debajo o cerca del stock mínimo.

Ejemplos:
"¿Qué artículos tienen inventario bajo?"
"¿Qué se está acabando?"
"Muéstrame los productos con poco stock"

IMPORTANTE:
Si el usuario menciona un artículo específico y pregunta cómo está,
cuánto hay o si existe, utiliza CONSULTAR_ARTICULO.
No lo clasifiques como INVENTARIO_BAJO solamente por expresiones
como "cómo andamos".

3. CONSULTAR_SUCURSAL
Se utiliza cuando el usuario solicita el inventario general de una sucursal.

Una sucursal es una ubicación del negocio, NO es un artículo.

Ejemplos:
"¿Qué inventario tiene la Sucursal 1?"
"Muéstrame lo que hay en la Sucursal 3"
"Mostrame todo lo que tenemos en la Sucursal 1"
"¿Qué hay en la primera sucursal?"
"Quiero ver el inventario de la Sucursal 2"

Para estas consultas debes responder, por ejemplo:

{
  "intencion": "CONSULTAR_SUCURSAL",
  "articulo": null,
  "sucursal": "Sucursal 1"
}

IMPORTANTE:
Si aparecen expresiones como "Sucursal 1", "Sucursal 2",
"Sucursal 3", "Sucursal 4" o "Sucursal 5", estas representan
una sucursal y nunca un artículo.

Si el usuario pide todo el inventario de esa ubicación,
la intención es CONSULTAR_SUCURSAL.

4. SUGERIR_REPOSICION
Se utiliza cuando el usuario pregunta qué debería comprar, pedir
o reponer para alcanzar los niveles necesarios de inventario.

Ejemplos:
"¿Qué debemos reponer?"
"¿Qué necesitamos comprar?"
"¿Qué ingredientes debería pedir?"

5. GENERAL
Se utiliza cuando la solicitud no corresponde a las anteriores.

FORMATO OBLIGATORIO:

{
  "intencion": "INTENCION",
  "articulo": null,
  "sucursal": null
}

REGLAS:

- Responde únicamente JSON válido.
- No agregues explicaciones.
- No respondas la pregunta del usuario.
- No inventes cantidades.
- Si aparece un artículo específico, escríbelo en "articulo".
- Si aparece una sucursal específica, escríbela en "sucursal".
- Si no aparece alguno de esos datos, utiliza null.
REGLA DE PRIORIDAD:

Antes de clasificar, diferencia las entidades:

- Harina, leche, azúcar, pan, ingredientes o productos son artículos.
- "Sucursal" seguida de un número representa una sucursal.
- Nunca coloques una sucursal dentro del campo "articulo".
- Nunca coloques un artículo dentro del campo "sucursal".

SOLICITUD:

${mensaje}
`;

const controller = new AbortController();

const timeout = setTimeout(() => {
  controller.abort();
}, 15000);

  const respuesta = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gemma3:4b",
      prompt: prompt,
      format: "json",
      stream: false
    })
  });
  clearTimeout(timeout);

  if (!respuesta.ok) {
    throw new Error("Error al interpretar la consulta con Ollama");
  }

  const data = await respuesta.json();

  const interpretacion = JSON.parse(data.response);

  return {
    intencion: interpretacion.intencion || "GENERAL",
    articulo: interpretacion.articulo || null,
    sucursal: interpretacion.sucursal || null
  };
}

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    mensaje: "Backend de Panadería El Viajero funcionando"
  });
});

app.post("/api/asistente", async (req, res) => {
  try {
    const { mensaje } = req.body;

    // -------------------------
    // VALIDACIONES
    // -------------------------

    if (!mensaje || typeof mensaje !== "string") {
      return res.status(400).json({
        error: "Debe enviar un mensaje válido"
      });
    }

    const mensajeLimpio = mensaje.trim();

        if (mensajeLimpio.length === 0) {
      return res.status(400).json({
        error: "El mensaje no puede estar vacío"
      });
    }

        if (mensajeLimpio.length > 500) {
      return res.status(400).json({
        error: "El mensaje excede el límite de 500 caracteres"
      });
    }

    const interpretacionIA = await interpretarConsulta(mensajeLimpio);

console.log("Interpretación de Gemma:");
console.log(interpretacionIA);

const intencionesPermitidas = [
  "INVENTARIO_BAJO",
  "CONSULTAR_ARTICULO",
  "CONSULTAR_SUCURSAL",
  "SUGERIR_REPOSICION",
  "GENERAL"
];

if (!intencionesPermitidas.includes(interpretacionIA.intencion)) {
  interpretacionIA.intencion = "GENERAL";
}

    // -------------------------
    // DETECTAR INTENCIÓN
    // -------------------------

    const texto = mensajeLimpio.toLowerCase();

    let datosSistema = null;
    let tipoConsulta = "GENERAL";

    // Buscar los artículos existentes en PostgreSQL
    const articulosDB = await pool.query(`
    SELECT id, nombre, tipo, unidad_medida
    FROM articulos
    WHERE activo = TRUE
    ORDER BY nombre
    `);

const articuloDetectado = interpretacionIA.articulo
  ? articulosDB.rows.find(articulo =>
      articulo.nombre.toLowerCase() ===
      interpretacionIA.articulo.toLowerCase()
    )
  : null;
    // Buscar las sucursales existentes en PostgreSQL
const sucursalesDB = await pool.query(`
  SELECT id, nombre, municipio
  FROM sucursales
  WHERE activo = TRUE
  ORDER BY nombre
`);

const sucursalDetectada = interpretacionIA.sucursal
  ? sucursalesDB.rows.find(sucursal =>
      sucursal.nombre.toLowerCase() ===
      interpretacionIA.sucursal.toLowerCase()
    )
  : null;

    // Consulta de inventario bajo
if (interpretacionIA.intencion === "INVENTARIO_BAJO") {

      tipoConsulta = "INVENTARIO_BAJO";

      const resultado = await pool.query(`
        SELECT
          s.nombre AS sucursal,
          a.nombre AS articulo,
          a.tipo,
          i.cantidad,
          a.unidad_medida,
          i.stock_minimo
        FROM inventario i
        JOIN sucursales s
          ON s.id = i.sucursal_id
        JOIN articulos a
          ON a.id = i.articulo_id
        WHERE i.cantidad <= i.stock_minimo
        ORDER BY s.nombre, a.nombre
      `);

      datosSistema = resultado.rows;

      console.log("=== DEPURACION ASISTENTE ===");
      console.log("Tipo de consulta:", tipoConsulta);
      console.log("Datos enviados a Gemma:", datosSistema);
      console.log("============================");

    }

      // Consulta de un artículo específico
     else if (
  interpretacionIA.intencion === "CONSULTAR_ARTICULO" &&
  articuloDetectado
) {

        tipoConsulta = "CONSULTAR_ARTICULO";

        const resultado = await pool.query(`
          SELECT
            s.nombre AS sucursal,
            a.nombre AS articulo,
            a.tipo,
            i.cantidad,
            a.unidad_medida,
            i.stock_minimo
          FROM inventario i
          JOIN sucursales s
            ON s.id = i.sucursal_id
          JOIN articulos a
            ON a.id = i.articulo_id
          WHERE a.id = $1
          ORDER BY s.nombre
        `, [articuloDetectado.id]);

        datosSistema = resultado.rows;
      }

      else if (
  interpretacionIA.intencion === "CONSULTAR_SUCURSAL" &&
  sucursalDetectada
) {

  tipoConsulta = "CONSULTAR_SUCURSAL";

  const resultado = await pool.query(`
    SELECT
      s.nombre AS sucursal,
      a.nombre AS articulo,
      a.tipo,
      i.cantidad,
      a.unidad_medida,
      i.stock_minimo
    FROM inventario i
    JOIN sucursales s
      ON s.id = i.sucursal_id
    JOIN articulos a
      ON a.id = i.articulo_id
    WHERE s.id = $1
    ORDER BY a.nombre
  `, [sucursalDetectada.id]);

  datosSistema = resultado.rows;
}
else if (interpretacionIA.intencion === "SUGERIR_REPOSICION") {

  tipoConsulta = "SUGERIR_REPOSICION";

  const resultado = await pool.query(`
    SELECT
      s.nombre AS sucursal,
      a.nombre AS articulo,
      a.tipo,
      i.cantidad,
      a.unidad_medida,
      i.stock_minimo,
      (i.stock_minimo - i.cantidad) AS cantidad_reponer
    FROM inventario i
    JOIN sucursales s
      ON s.id = i.sucursal_id
    JOIN articulos a
      ON a.id = i.articulo_id
    WHERE i.cantidad < i.stock_minimo
    ORDER BY s.nombre, a.nombre
  `);

  datosSistema = resultado.rows;
}

    // -------------------------
    // CONSTRUIR CONTEXTO
    // -------------------------
    let contexto;

if (tipoConsulta === "INVENTARIO_BAJO") {

  if (datosSistema.length === 0) {

    contexto = `
RESULTADO VERIFICADO POR EL SISTEMA:

No existen artículos por debajo del stock mínimo.

Informa al administrador de forma breve que actualmente
no existen artículos con inventario bajo.
`;

  } else {

    const listaInventario = datosSistema.map(item =>
      `- ${item.articulo}: ${item.cantidad} ${item.unidad_medida}, ` +
      `stock mínimo ${item.stock_minimo} ${item.unidad_medida}, ` +
      `${item.sucursal}`
    ).join("\n");

    contexto = `
RESULTADO VERIFICADO POR POSTGRESQL:

Se encontraron ${datosSistema.length} artículos con inventario bajo:

${listaInventario}

INSTRUCCIONES OBLIGATORIAS:

- Los artículos anteriores YA fueron identificados por PostgreSQL.
- NO determines nuevamente si tienen inventario bajo.
- NO ignores ningún artículo.
- NO agregues artículos.
- NO cambies cantidades.
- NO cambies los niveles mínimos.
- Tu única tarea es comunicar estos resultados al administrador.
`;

  }

} else if (tipoConsulta === "CONSULTAR_ARTICULO") {

  if (datosSistema.length === 0) {

    contexto = `
RESULTADO VERIFICADO POR EL SISTEMA:

El artículo consultado existe, pero actualmente no tiene
inventario registrado en ninguna sucursal.

Informa esto al administrador de forma breve.
`;

  } else {

    const listaInventario = datosSistema.map(item =>
      `- ${item.articulo}: ${item.cantidad} ${item.unidad_medida} ` +
      `en ${item.sucursal}`
    ).join("\n");

    contexto = `
RESULTADO VERIFICADO POR POSTGRESQL:

${listaInventario}

INSTRUCCIONES OBLIGATORIAS:

- Utiliza exclusivamente las cantidades anteriores.
- NO inventes existencias.
- NO agregues sucursales.
- NO cambies las cantidades.
- Indica claramente el artículo, la cantidad, la unidad y la sucursal.
- Tu tarea es comunicar los datos al administrador de forma breve.
`;

  }

} else if (tipoConsulta === "CONSULTAR_SUCURSAL") {

  if (datosSistema.length === 0) {

    contexto = `
RESULTADO VERIFICADO POR EL SISTEMA:

La sucursal consultada existe, pero actualmente no tiene
inventario registrado.

Informa esto al administrador de forma breve.
`;

  } else {

    const listaInventario = datosSistema.map(item =>
      `- ${item.articulo}: ${item.cantidad} ${item.unidad_medida}`
    ).join("\n");

    contexto = `
RESULTADO VERIFICADO POR POSTGRESQL:

Sucursal consultada: ${datosSistema[0].sucursal}

Inventario registrado:

${listaInventario}

INSTRUCCIONES OBLIGATORIAS:

- Utiliza exclusivamente los datos anteriores.
- NO inventes artículos.
- NO inventes cantidades.
- NO cambies las unidades de medida.
- Menciona claramente la sucursal consultada.
- Comunica el inventario al administrador de forma clara y breve.
`;

  }

} else {

  contexto = `
No se proporcionaron datos específicos del inventario.

Si la pregunta requiere cantidades, existencias o información real
de Panadería El Viajero, indica que no tienes datos suficientes para
responder.

Puedes responder preguntas generales relacionadas con gestión de inventario.
`;

}
    // -------------------------
    // CONSULTAR OLLAMA
    // -------------------------

    const respuesta = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        model: "gemma3:4b",

        prompt: `
Eres el asistente administrativo de Panadería El Viajero.

Ayudas al administrador con la gestión de inventario.

REGLAS:
- No inventes cantidades.
- No inventes productos.
- No inventes sucursales.
- Los datos proporcionados por el sistema son la fuente de verdad.
- Responde de forma clara, breve y profesional.
- Responde en español.

${contexto}

PREGUNTA DEL ADMINISTRADOR:

${mensajeLimpio}
`,

        stream: false
      })
    });

    if (!respuesta.ok) {
      throw new Error("Ollama no respondió correctamente");
    }

    const data = await respuesta.json();

    let respuestaIA = data.response;

// Respuestas deterministas para información crítica del inventario
if (tipoConsulta === "INVENTARIO_BAJO") {

  if (datosSistema.length === 0) {

    respuestaIA =
      "Actualmente no existen artículos por debajo del stock mínimo.";

  } else {

    const lista = datosSistema.map(item =>
      `${item.articulo}: ${item.cantidad} ${item.unidad_medida} ` +
      `(mínimo ${item.stock_minimo} ${item.unidad_medida}) ` +
      `en ${item.sucursal}`
    ).join("; ");

    respuestaIA =
      `Actualmente hay ${datosSistema.length} artículo(s) ` +
      `con inventario bajo: ${lista}.`;
  }

} else if (tipoConsulta === "CONSULTAR_ARTICULO") {

  if (datosSistema.length === 0) {

    respuestaIA =
      "El artículo consultado no tiene inventario registrado.";

  } else {

    const lista = datosSistema.map(item =>
      `${item.cantidad} ${item.unidad_medida} en ${item.sucursal}`
    ).join("; ");

    respuestaIA =
      `${datosSistema[0].articulo}: ${lista}.`;
  }

} else if (tipoConsulta === "CONSULTAR_SUCURSAL") {

  if (datosSistema.length === 0) {

    respuestaIA =
      "La sucursal consultada actualmente no tiene inventario registrado.";

  } else {

    const lista = datosSistema.map(item =>
      `${item.articulo}: ${item.cantidad} ${item.unidad_medida}`
    ).join("; ");

    respuestaIA =
      `Inventario de ${datosSistema[0].sucursal}: ${lista}.`;
  }

}

else if (tipoConsulta === "SUGERIR_REPOSICION") {

  if (datosSistema.length === 0) {

    respuestaIA =
      "Actualmente ningún artículo necesita reposición para alcanzar su stock mínimo.";

  } else {

    const lista = datosSistema.map(item =>
      `${item.articulo}: reponer ${item.cantidad_reponer} ` +
      `${item.unidad_medida} en ${item.sucursal}`
    ).join("; ");

    respuestaIA =
      `Para alcanzar los niveles mínimos de inventario se recomienda: ${lista}.`;
  }
}
    // -------------------------
    // GUARDAR INTERACCIÓN
    // -------------------------

    await pool.query(
      `INSERT INTO interacciones_ia
       (pregunta, respuesta, estado)
       VALUES ($1, $2, $3)`,
      [
        mensajeLimpio,
        respuestaIA,
        "EXITOSA"
      ]
    );

    // -------------------------
    // RESPUESTA
    // -------------------------

    res.json({
      tipo_consulta: tipoConsulta,
      pregunta: mensajeLimpio,
      datos: datosSistema,
      respuesta: respuestaIA
    });

} catch (error) {

  console.error("Error en asistente:", error);

  const esErrorOllama =
    error.name === "AbortError" ||
    error.message.includes("Ollama") ||
    error.cause?.code === "ECONNREFUSED";

  if (esErrorOllama) {
    try {
  await pool.query(
    `INSERT INTO interacciones_ia
     (pregunta, respuesta, estado)
     VALUES ($1, $2, $3)`,
    [
      req.body?.mensaje || "Mensaje no disponible",
      "Servicio de inteligencia artificial no disponible",
      "ERROR"
    ]
  );
} catch (dbError) {
  console.error("No fue posible registrar el error:", dbError);
}

    return res.status(503).json({
      error: "El servicio de inteligencia artificial no está disponible temporalmente"
    });
  }

  return res.status(500).json({
    error: "No fue posible procesar la consulta"
  });
}
});

app.get("/api/sucursales", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT id, nombre, municipio, direccion
      FROM sucursales
      WHERE activo = TRUE
      ORDER BY id
    `);

    res.json(resultado.rows);

  } catch (error) {
    console.error("Error al consultar sucursales:", error);

    res.status(500).json({
      error: "No fue posible consultar las sucursales"
    });
  }
});
app.get("/api/inventario", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        s.id AS sucursal_id,
        s.nombre AS sucursal,
        a.id AS articulo_id,
        a.nombre AS articulo,
        a.tipo,
        i.cantidad,
        a.unidad_medida,
        i.stock_minimo
      FROM inventario i
      JOIN sucursales s
        ON s.id = i.sucursal_id
      JOIN articulos a
        ON a.id = i.articulo_id
      ORDER BY s.id, a.nombre
    `);

    res.json(resultado.rows);

  } catch (error) {
    console.error("Error al consultar inventario:", error);

    res.status(500).json({
      error: "No fue posible consultar el inventario"
    });
  }
});
app.get("/api/inventario/bajo", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        s.nombre AS sucursal,
        a.nombre AS articulo,
        a.tipo,
        i.cantidad,
        a.unidad_medida,
        i.stock_minimo
      FROM inventario i
      JOIN sucursales s
        ON s.id = i.sucursal_id
      JOIN articulos a
        ON a.id = i.articulo_id
      WHERE i.cantidad <= i.stock_minimo
      ORDER BY s.nombre, a.nombre
    `);

    res.json(resultado.rows);

  } catch (error) {
    console.error("Error al consultar inventario bajo:", error);

    res.status(500).json({
      error: "No fue posible consultar el inventario bajo"
    });
  }
});
app.post("/api/movimientos", async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      sucursal_id,
      articulo_id,
      tipo,
      cantidad,
      descripcion
    } = req.body;

    // Validaciones
    if (!sucursal_id || !articulo_id || !tipo || cantidad === undefined) {
      return res.status(400).json({
        error: "Faltan datos obligatorios"
      });
    }

    const cantidadNumero = Number(cantidad);

    if (!Number.isFinite(cantidadNumero) || cantidadNumero <= 0) {
      return res.status(400).json({
        error: "La cantidad debe ser un número mayor que cero"
      });
    }

    const tipoMovimiento = String(tipo).toUpperCase();

    if (!["ENTRADA", "SALIDA"].includes(tipoMovimiento)) {
      return res.status(400).json({
        error: "El tipo debe ser ENTRADA o SALIDA"
      });
    }

    await client.query("BEGIN");

    // Bloqueamos la fila mientras realizamos el movimiento.
    const inventario = await client.query(
      `SELECT cantidad
       FROM inventario
       WHERE sucursal_id = $1
         AND articulo_id = $2
       FOR UPDATE`,
      [sucursal_id, articulo_id]
    );

    if (inventario.rowCount === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "No existe inventario para ese artículo en esa sucursal"
      });
    }

    const cantidadActual = Number(inventario.rows[0].cantidad);

    let nuevaCantidad;

    if (tipoMovimiento === "ENTRADA") {
      nuevaCantidad = cantidadActual + cantidadNumero;
    } else {
      if (cantidadNumero > cantidadActual) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          error: "No existe suficiente inventario para realizar la salida"
        });
      }

      nuevaCantidad = cantidadActual - cantidadNumero;
    }

    // Actualizar inventario
    await client.query(
      `UPDATE inventario
       SET cantidad = $1,
           fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE sucursal_id = $2
         AND articulo_id = $3`,
      [nuevaCantidad, sucursal_id, articulo_id]
    );

    // Registrar movimiento
    const movimiento = await client.query(
      `INSERT INTO movimientos
        (sucursal_id, articulo_id, tipo, cantidad, descripcion)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, tipo, cantidad, descripcion, fecha`,
      [
        sucursal_id,
        articulo_id,
        tipoMovimiento,
        cantidadNumero,
        descripcion || null
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      mensaje: "Movimiento registrado correctamente",
      cantidad_anterior: cantidadActual,
      cantidad_actual: nuevaCantidad,
      movimiento: movimiento.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error al registrar movimiento:", error);

    res.status(500).json({
      error: "No fue posible registrar el movimiento"
    });

  } finally {
    client.release();
  }
});

app.get("/api/movimientos", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        m.id,
        s.nombre AS sucursal,
        a.nombre AS articulo,
        m.tipo,
        m.cantidad,
        a.unidad_medida,
        m.descripcion,
        m.fecha
      FROM movimientos m
      JOIN sucursales s
        ON s.id = m.sucursal_id
      JOIN articulos a
        ON a.id = m.articulo_id
      ORDER BY m.fecha DESC
    `);

    res.json(resultado.rows);

  } catch (error) {
    console.error("Error al consultar movimientos:", error);

    res.status(500).json({
      error: "No fue posible consultar los movimientos"
    });
  }
});

app.get("/api/interacciones", async (req, res) => {
  try {

    const resultado = await pool.query(`
      SELECT
        id,
        pregunta,
        respuesta,
        estado,
        fecha
      FROM interacciones_ia
      ORDER BY fecha DESC
      LIMIT 50
    `);

    res.json(resultado.rows);

  } catch (error) {

    console.error("Error al consultar interacciones:", error);

    res.status(500).json({
      error: "No fue posible consultar el historial de interacciones"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend ejecutándose en puerto ${PORT}`);
});
