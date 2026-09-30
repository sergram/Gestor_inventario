# Sistema Inteligente de Gestión de Inventario
## Panadería El Viajero

Proyecto desarrollado para el curso **Análisis de Sistemas II** de la Universidad Mariano Gálvez de Guatemala.

El sistema consiste en una aplicación web administrativa para apoyar la gestión de inventario de **Panadería El Viajero**, integrando un modelo de inteligencia artificial ejecutado localmente.

## Objetivo

Centralizar y facilitar la consulta del inventario de las diferentes sucursales de Panadería El Viajero.

El sistema permite realizar consultas mediante lenguaje natural. La inteligencia artificial interpreta la intención del usuario, mientras que los datos reales del inventario son obtenidos desde PostgreSQL.

## Funcionalidades actuales

- Consulta de existencias de productos e ingredientes.
- Consulta de inventario por sucursal.
- Identificación de artículos con inventario bajo.
- Sugerencias de reposición.
- Registro de entradas de inventario.
- Registro de salidas de inventario.
- Validación de salidas para evitar inventario negativo.
- Historial de movimientos.
- Consultas mediante lenguaje natural.
- Historial persistente de interacciones con el asistente.
- Manejo de errores de comunicación con el servicio de IA.
- Validación de entradas del usuario.

## Arquitectura

El proyecto utiliza una arquitectura basada en servicios contenerizados con Docker Compose.

```text
Usuario
   |
   v
Frontend
HTML + CSS + JavaScript
Nginx
   |
   v
Backend
Node.js + Express
   |
   +--------------------+
   |                    |
   v                    v
PostgreSQL          Ollama
Base de datos       Gemma 3 4B
```

### Frontend

Interfaz web administrativa servida mediante **Nginx**.

Permite:

- visualizar el inventario;
- consultar al asistente;
- registrar movimientos;
- visualizar el historial de interacciones.

### Backend

API REST desarrollada con **Node.js y Express**.

Es responsable de:

- validar las solicitudes;
- comunicarse con Ollama;
- validar la interpretación generada por la IA;
- ejecutar las consultas a PostgreSQL;
- registrar movimientos;
- calcular reposiciones;
- almacenar el historial de interacciones;
- controlar errores.

### Base de datos

Se utiliza **PostgreSQL** para almacenar:

- sucursales;
- artículos;
- inventario;
- movimientos;
- interacciones con el asistente.

### Inteligencia Artificial

El sistema utiliza **Ollama** con el modelo:

```text
gemma3:4b
```

Gemma se utiliza principalmente para interpretar consultas realizadas en lenguaje natural.

La IA **no es la fuente de verdad del inventario**. Las cantidades y existencias son obtenidas desde PostgreSQL y las operaciones críticas son realizadas por el backend.

## Flujo de una consulta

Ejemplo:

```text
¿Qué necesitamos comprar?
```

Flujo:

```text
Usuario
   |
   v
Frontend
   |
   v
POST /api/asistente
   |
   v
Backend Express
   |
   v
Gemma 3 4B
Interpreta intención
   |
   v
SUGERIR_REPOSICION
   |
   v
Backend valida interpretación
   |
   v
PostgreSQL
   |
   v
Backend calcula reposición
   |
   v
Respuesta al usuario
```

## Tecnologías utilizadas

- Docker
- Docker Compose
- Node.js
- Express
- PostgreSQL
- Ollama
- Gemma 3 4B
- Nginx
- HTML5
- CSS3
- JavaScript

## Estructura del proyecto

```text
el-viajero/
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── package.json
│   └── Dockerfile
│
├── database/
│   └── init.sql
│
├── frontend/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── nginx.conf
│   └── Dockerfile
│
├── compose.yaml
├── .env
├── .env.example
├── .gitignore
└── README.md
```

## Configuración

El proyecto utiliza variables de entorno para las credenciales de PostgreSQL.

Crear un archivo `.env` tomando como referencia `.env.example`.

Ejemplo:

```env
POSTGRES_DB=el_viajero
POSTGRES_USER=usuario_ejemplo
POSTGRES_PASSWORD=contraseña_ejemplo
```

> El archivo `.env` contiene configuración local y no debe almacenarse en el repositorio.

## Ejecución

### 1. Construir y levantar los contenedores

Desde la raíz del proyecto:

```bash
docker compose up -d --build
```

### 2. Verificar los servicios

```bash
docker compose ps
```

### 3. Descargar el modelo de IA

La primera vez que se ejecuta el proyecto:

```bash
docker exec -it el-viajero-ollama ollama pull gemma3:4b
```

### 4. Abrir la aplicación

La interfaz web se encuentra disponible en:

```text
http://localhost:8080
```

## API

Principales endpoints implementados:

```text
GET  /api/sucursales
GET  /api/inventario
GET  /api/inventario/bajo

POST /api/movimientos
GET  /api/movimientos

POST /api/asistente
GET  /api/interacciones
```

## Seguridad

El prototipo implementa diferentes controles básicos de seguridad:

- variables de entorno para credenciales;
- exclusión de `.env` mediante `.gitignore`;
- validación de datos antes de enviarlos al modelo de IA;
- límite de longitud para consultas;
- lista de intenciones permitidas;
- validación de entidades contra la base de datos;
- consultas SQL parametrizadas;
- control de errores del servicio de IA;
- prevención de salidas de inventario superiores a las existencias;
- escape de contenido mostrado en la interfaz.

## Estado actual

El proyecto se encuentra en la etapa correspondiente al **Avance 2**.

Actualmente se encuentra implementado el flujo principal:

```text
Usuario
→ Interfaz web
→ Backend
→ Inteligencia Artificial
→ Validación
→ PostgreSQL
→ Respuesta
```

También se cuenta con persistencia, registro de movimientos, manejo de errores y controles básicos de ciberseguridad.

## Autor

**Sergio Gramajo**  
Universidad Mariano Gálvez de Guatemala  
Análisis de Sistemas II
