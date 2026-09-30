CREATE TABLE sucursales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    municipio VARCHAR(100) NOT NULL,
    direccion VARCHAR(200),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE articulos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL
        CHECK (tipo IN ('PRODUCTO', 'INGREDIENTE')),
    unidad_medida VARCHAR(30) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE inventario (
    id SERIAL PRIMARY KEY,
    sucursal_id INTEGER NOT NULL,
    articulo_id INTEGER NOT NULL,
    cantidad NUMERIC(10,2) NOT NULL DEFAULT 0
        CHECK (cantidad >= 0),
    stock_minimo NUMERIC(10,2) NOT NULL DEFAULT 0
        CHECK (stock_minimo >= 0),
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_inventario_sucursal
        FOREIGN KEY (sucursal_id)
        REFERENCES sucursales(id),

    CONSTRAINT fk_inventario_articulo
        FOREIGN KEY (articulo_id)
        REFERENCES articulos(id),

    CONSTRAINT uq_inventario
        UNIQUE (sucursal_id, articulo_id)
);

CREATE TABLE movimientos (
    id SERIAL PRIMARY KEY,
    sucursal_id INTEGER NOT NULL,
    articulo_id INTEGER NOT NULL,
    tipo VARCHAR(20) NOT NULL
        CHECK (tipo IN ('ENTRADA', 'SALIDA', 'AJUSTE')),
    cantidad NUMERIC(10,2) NOT NULL
        CHECK (cantidad > 0),
    descripcion VARCHAR(250),
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (sucursal_id)
        REFERENCES sucursales(id),

    FOREIGN KEY (articulo_id)
        REFERENCES articulos(id)
);

CREATE TABLE interacciones_ia (
    id SERIAL PRIMARY KEY,
    pregunta TEXT NOT NULL,
    respuesta TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'EXITOSA',
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- SUCURSALES DE PRUEBA

INSERT INTO sucursales (nombre, municipio) VALUES
('Sucursal 1', 'Municipio de prueba'),
('Sucursal 2', 'Municipio de prueba'),
('Sucursal 3', 'Municipio de prueba'),
('Sucursal 4', 'Municipio de prueba'),
('Sucursal 5', 'Municipio de prueba');


-- ARTICULOS DE PRUEBA

INSERT INTO articulos (nombre, tipo, unidad_medida) VALUES
('Harina', 'INGREDIENTE', 'kg'),
('Azucar', 'INGREDIENTE', 'kg'),
('Leche', 'INGREDIENTE', 'litros'),
('Pan frances', 'PRODUCTO', 'unidades'),
('Pan dulce', 'PRODUCTO', 'unidades');


-- INVENTARIO DE PRUEBA PARA SUCURSAL 1

INSERT INTO inventario
(sucursal_id, articulo_id, cantidad, stock_minimo)
VALUES
(1, 1, 150, 50),
(1, 2, 20, 30),
(1, 3, 15, 20),
(1, 4, 200, 100),
(1, 5, 80, 100);
