CREATE TABLE zonas (
    id uuid PRIMARY KEY,
    codigo varchar(32) NOT NULL,
    nombre varchar(32) NOT NULL,
    descripcion varchar(256),
    estado integer NOT NULL DEFAULT 1,
    capacidad integer NOT NULL DEFAULT 1,
    tipo varchar(32) NOT NULL,
    fecha_creacion timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE espacios (
    id uuid PRIMARY KEY,
    codigo varchar(16) NOT NULL UNIQUE,
    zona_id uuid NOT NULL REFERENCES zonas(id),
    descripcion varchar(100),
    capacidad integer NOT NULL DEFAULT 1,
    tipo varchar(32) NOT NULL,
    activo boolean NOT NULL DEFAULT true,
    estado varchar(32) NOT NULL,
    fecha_creacion timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

