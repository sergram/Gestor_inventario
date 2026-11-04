# Documento de Requerimientos Funcionales y No Funcionales

**Proyecto:** Sistema Inteligente de Gestión de Inventario para Panadería El Viajero  
**Curso:** Análisis de Sistemas II  
**Universidad:** Universidad Mariano Gálvez de Guatemala  
**Versión:** 1.0  
**Fecha:** 3 de noviembre de 2026

---

## 1. Introducción

El presente documento define los requerimientos funcionales y no funcionales del Sistema Inteligente de Gestión de Inventario para Panadería El Viajero.

El proyecto consiste en una aplicación web administrativa que integra una base de datos PostgreSQL y un modelo de inteligencia artificial local, Gemma 3 4B, ejecutado mediante Ollama.

Su propósito es facilitar el control de existencias, el registro de movimientos y la consulta de información mediante lenguaje natural.

## 2. Descripción del problema

Panadería El Viajero cuenta con cinco sucursales distribuidas en tres municipios y comercializa productos de panadería e ingredientes.

El control de inventario se realiza actualmente con herramientas como Excel, lo que dificulta la consulta centralizada de existencias, la identificación de productos con inventario bajo y el seguimiento de los movimientos.

Se propone un sistema que centralice esta información y facilite las tareas administrativas.

## 3. Objetivo general

Desarrollar un sistema web de gestión de inventario que permita administrar las existencias de distintas sucursales e integrar inteligencia artificial para interpretar consultas en lenguaje natural, manteniendo la integridad de los datos mediante PostgreSQL.

## 4. Actores y componentes externos

**Administrador:** usuario principal del sistema. Consulta inventarios, registra movimientos, administra artículos y utiliza el asistente inteligente.

**Servicio de inteligencia artificial:** Ollama con Gemma 3 4B. Procesa las consultas en lenguaje natural e identifica intenciones y entidades.

**Base de datos:** PostgreSQL. Almacena la información de inventario, sucursales, artículos, movimientos e interacciones.

## 5. Requerimientos funcionales

| Código | Requerimiento | Descripción |
|---|---|---|
| RF-01 | Consultar dashboard | El sistema permitirá visualizar un resumen de sucursales, artículos y registros con inventario bajo. |
| RF-02 | Consultar inventario | El administrador podrá visualizar las existencias registradas por artículo y sucursal. |
| RF-03 | Filtrar inventario | Se permitirá buscar por artículo y filtrar por sucursal y estado del inventario. |
| RF-04 | Registrar artículos | Se permitirá crear productos o ingredientes indicando nombre, tipo, unidad, sucursal, cantidad inicial y mínimo. |
| RF-05 | Asignar artículos a sucursales | Un artículo existente podrá tener inventario independiente en diferentes sucursales. |
| RF-06 | Registrar entradas | El administrador podrá aumentar las existencias mediante movimientos de entrada. |
| RF-07 | Registrar salidas | El administrador podrá registrar disminuciones de existencias, siempre que exista cantidad suficiente. |
| RF-08 | Consultar movimientos | Se permitirá visualizar el historial de entradas y salidas registradas. |
| RF-09 | Detectar inventario bajo | El sistema identificará los registros cuya cantidad sea menor o igual al stock mínimo. |
| RF-10 | Sugerir reposiciones | El sistema calculará las cantidades necesarias para alcanzar el mínimo de inventario cuando exista déficit. |
| RF-11 | Consultar mediante IA | El administrador podrá introducir preguntas en lenguaje natural y recibir respuestas basadas en datos del sistema para las intenciones soportadas. |
| RF-12 | Consultar por artículo | El asistente podrá identificar artículos y consultar sus existencias. |
| RF-13 | Consultar por sucursal | El asistente podrá interpretar solicitudes de información sobre el inventario de una sucursal. |
| RF-14 | Registrar interacciones | El sistema almacenará las preguntas y respuestas del asistente en PostgreSQL. |
| RF-15 | Consultar historial de IA | El administrador podrá revisar interacciones anteriores desde la interfaz. |
| RF-16 | Gestionar errores de IA | El sistema responderá de forma controlada cuando Ollama no esté disponible o una solicitud no pueda procesarse. |

## 6. Requerimientos no funcionales

| Código | Categoría | Requerimiento |
|---|---|---|
| RNF-01 | Seguridad | Las credenciales de base de datos se administrarán mediante variables de entorno y no estarán escritas directamente en el código. |
| RNF-02 | Seguridad | Las consultas de los usuarios serán validadas antes de enviarse al servicio de IA. |
| RNF-03 | Seguridad | El backend utilizará consultas SQL parametrizadas para reducir el riesgo de inyección SQL. |
| RNF-04 | Integridad | Las operaciones de inventario impedirán cantidades negativas y utilizarán transacciones cuando corresponda. |
| RNF-05 | Fiabilidad | El backend gestionará errores de conexión y tiempos de espera del servicio de IA. |
| RNF-06 | Persistencia | La información de inventario, movimientos e interacciones permanecerá almacenada tras reiniciar los contenedores, siempre que se conserve el volumen de PostgreSQL. |
| RNF-07 | Usabilidad | La interfaz deberá permitir identificar claramente las distintas secciones y el estado de las existencias. |
| RNF-08 | Portabilidad | El proyecto podrá desplegarse mediante Docker Compose en un equipo compatible con los requisitos del entorno. |
| RNF-09 | Mantenibilidad | El sistema utilizará componentes separados para frontend, backend, base de datos e inteligencia artificial. |
| RNF-10 | Consistencia | Las cantidades oficiales procederán de PostgreSQL y no de valores generados libremente por la inteligencia artificial. |
| RNF-11 | Validación | Las consultas del asistente tendrán un límite máximo de 500 caracteres. |
| RNF-12 | Protección de datos | La interfaz deberá evitar interpretar como HTML el contenido dinámico recibido del sistema. |

## 7. Reglas de negocio

**RN-01.** Cada artículo podrá disponer de existencias independientes en distintas sucursales.

**RN-02.** No se permitirá registrar dos inventarios para la misma combinación de artículo y sucursal.

**RN-03.** Las cantidades de inventario no podrán ser negativas.

**RN-04.** Las salidas de inventario no podrán superar la cantidad disponible.

**RN-05.** Un registro se considerará con inventario bajo cuando su cantidad sea menor o igual al mínimo establecido.

**RN-06.** Las sugerencias de reposición calcularán la diferencia entre el mínimo y la cantidad disponible únicamente cuando exista déficit.

**RN-07.** La inteligencia artificial interpretará las solicitudes, pero las consultas y modificaciones de datos serán controladas por el backend.

**RN-08.** El backend no ejecutará instrucciones SQL generadas libremente por el modelo de IA.

## 8. Arquitectura tecnológica

El sistema se estructura en cuatro servicios principales:

- **Frontend:** HTML, CSS y JavaScript, servido mediante Nginx.
- **Backend:** Node.js y Express, responsable de la API REST, validaciones y lógica de negocio.
- **Base de datos:** PostgreSQL 16, responsable de la persistencia.
- **Inteligencia artificial:** Ollama con Gemma 3 4B, responsable de la interpretación de consultas.

La ejecución y comunicación entre servicios se gestionan mediante Docker Compose.

## 9. Manejo de errores

Se consideran los siguientes escenarios:

| Escenario | Comportamiento esperado |
|---|---|
| Consulta vacía | Rechazar la solicitud con error de validación. |
| Consulta superior a 500 caracteres | Rechazar antes de enviarla a Ollama. |
| Salida mayor al stock | Rechazar el movimiento sin modificar las existencias. |
| Ollama no disponible | Devolver un error controlado, evitando una respuesta inventada. |
| Tiempo de espera agotado | Interrumpir la solicitud y notificar la indisponibilidad del servicio. |
| Datos inválidos de un artículo | Rechazar la solicitud sin realizar inserciones parciales. |
| Artículo ya asignado a la sucursal | Impedir duplicar el registro de inventario. |

## 10. Alcance y limitaciones

El alcance actual comprende la administración básica de inventarios, movimientos, artículos, consultas por sucursal, sugerencias de reposición e historial del asistente.

La inteligencia artificial admite un conjunto definido de intenciones. No todas las preguntas formuladas libremente pueden interpretarse correctamente.

La aplicación está diseñada como prototipo académico. Actualmente no se considera un sistema listo para producción, ya que todavía requiere autenticación, autorización de usuarios y verificaciones adicionales de seguridad.

La administración avanzada de sucursales, la edición de mínimos y otras funciones podrán incorporarse como mejoras posteriores.

## 11. Criterios de aceptación

El proyecto se considerará funcional para la demostración académica cuando se verifiquen los siguientes escenarios:

1. El administrador realiza una consulta válida y obtiene datos correctos de PostgreSQL mediante la integración con IA.
2. Se registra una entrada de inventario y las existencias aumentan correctamente.
3. Se intenta registrar una salida superior a las existencias y el sistema la rechaza.
4. Se registra una interacción con el asistente y puede recuperarse desde el historial.
5. Se envía una entrada inválida y el sistema responde de forma controlada.
6. Se interrumpe el servicio de IA y el backend gestiona el error sin generar información falsa.
7. El sistema puede reconstruirse y ejecutarse siguiendo las instrucciones del repositorio.

**Nota:** estos criterios deberán respaldarse con evidencias de pruebas antes de la entrega final.

## 12. Conclusión

Los requerimientos definidos orientan el desarrollo de un sistema de inventario centralizado que integra inteligencia artificial de forma controlada.

Una decisión fundamental del proyecto es separar la interpretación del lenguaje natural de las operaciones sobre la información. Gemma identifica la intención del administrador, mientras que Express y PostgreSQL se encargan de validar y procesar los datos reales.

Esta separación contribuye a mejorar la consistencia, seguridad y confiabilidad del prototipo.
