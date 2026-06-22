UPDATE zonas
SET estado = 1
WHERE estado IS NULL
@@

UPDATE zonas
SET capacidad = 1
WHERE capacidad IS NULL OR capacidad < 1
@@

UPDATE zonas
SET capacidad = 300
WHERE capacidad > 300
@@

UPDATE espacios
SET capacidad = 1
WHERE capacidad IS NULL OR capacidad < 1
@@

UPDATE espacios
SET capacidad = 300
WHERE capacidad > 300
@@

UPDATE espacios
SET activo = false,
    estado = 'FUERA_DE_SERVICIO',
    fecha_actualizacion = COALESCE(fecha_actualizacion, CURRENT_TIMESTAMP)
WHERE zona_id IN (
    SELECT id
    FROM zonas
    WHERE estado = 0
)
@@

UPDATE espacios
SET estado = 'FUERA_DE_SERVICIO',
    fecha_actualizacion = COALESCE(fecha_actualizacion, CURRENT_TIMESTAMP)
WHERE activo = false
  AND estado <> 'FUERA_DE_SERVICIO'
@@

UPDATE espacios
SET activo = false,
    fecha_actualizacion = COALESCE(fecha_actualizacion, CURRENT_TIMESTAMP)
WHERE estado = 'FUERA_DE_SERVICIO'
  AND activo = true
@@

UPDATE zonas
SET fecha_creacion = COALESCE(fecha_creacion, CURRENT_TIMESTAMP),
    fecha_modificacion = COALESCE(fecha_modificacion, CURRENT_TIMESTAMP)
@@

UPDATE espacios
SET fecha_creacion = COALESCE(fecha_creacion, CURRENT_TIMESTAMP),
    fecha_actualizacion = COALESCE(fecha_actualizacion, CURRENT_TIMESTAMP)
@@

ALTER TABLE zonas
    ALTER COLUMN estado SET DEFAULT 1,
    ALTER COLUMN estado SET NOT NULL,
    ALTER COLUMN capacidad SET DEFAULT 1,
    ALTER COLUMN capacidad SET NOT NULL,
    ALTER COLUMN fecha_creacion SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN fecha_creacion SET NOT NULL,
    ALTER COLUMN fecha_modificacion SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN fecha_modificacion SET NOT NULL
@@

ALTER TABLE espacios
    ALTER COLUMN descripcion TYPE varchar(100),
    ALTER COLUMN activo SET DEFAULT true,
    ALTER COLUMN activo SET NOT NULL,
    ALTER COLUMN capacidad SET DEFAULT 1,
    ALTER COLUMN capacidad SET NOT NULL,
    ALTER COLUMN fecha_creacion SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN fecha_creacion SET NOT NULL,
    ALTER COLUMN fecha_actualizacion SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN fecha_actualizacion SET NOT NULL
@@

ALTER TABLE zonas DROP CONSTRAINT IF EXISTS chk_zonas_estado_valido
@@

ALTER TABLE zonas
    ADD CONSTRAINT chk_zonas_estado_valido CHECK (estado IN (0, 1))
@@

ALTER TABLE zonas DROP CONSTRAINT IF EXISTS chk_zonas_capacidad_valida
@@

ALTER TABLE zonas
    ADD CONSTRAINT chk_zonas_capacidad_valida CHECK (capacidad BETWEEN 1 AND 300)
@@

ALTER TABLE zonas DROP CONSTRAINT IF EXISTS chk_zonas_textos_validos
@@

ALTER TABLE zonas
    ADD CONSTRAINT chk_zonas_textos_validos
    CHECK (
        length(btrim(codigo)) > 0
        AND length(btrim(nombre)) > 0
        AND (descripcion IS NULL OR length(btrim(descripcion)) > 0)
    )
@@

ALTER TABLE espacios DROP CONSTRAINT IF EXISTS chk_espacios_capacidad_valida
@@

ALTER TABLE espacios
    ADD CONSTRAINT chk_espacios_capacidad_valida CHECK (capacidad BETWEEN 1 AND 300)
@@

ALTER TABLE espacios DROP CONSTRAINT IF EXISTS chk_espacios_textos_validos
@@

ALTER TABLE espacios
    ADD CONSTRAINT chk_espacios_textos_validos
    CHECK (
        length(btrim(codigo)) > 0
        AND (descripcion IS NULL OR length(btrim(descripcion)) > 0)
    )
@@

ALTER TABLE espacios DROP CONSTRAINT IF EXISTS chk_espacios_activo_estado
@@

ALTER TABLE espacios
    ADD CONSTRAINT chk_espacios_activo_estado
    CHECK (
        (activo = true AND estado <> 'FUERA_DE_SERVICIO')
        OR (activo = false AND estado = 'FUERA_DE_SERVICIO')
    )
@@

CREATE UNIQUE INDEX IF NOT EXISTS ux_zonas_nombre_activo
    ON zonas (lower(nombre))
    WHERE estado = 1
@@

CREATE UNIQUE INDEX IF NOT EXISTS ux_zonas_codigo_activo
    ON zonas (codigo)
    WHERE estado = 1
@@

CREATE INDEX IF NOT EXISTS idx_espacios_zona_id
    ON espacios (zona_id)
@@

CREATE OR REPLACE FUNCTION validar_cambio_estado_zona()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.estado = 0 AND NEW.estado = 1 THEN
        RAISE EXCEPTION 'No se puede reactivar una zona desactivada. Cree una zona nueva.'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$
@@

CREATE OR REPLACE FUNCTION desactivar_espacios_de_zona()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.estado IS DISTINCT FROM NEW.estado AND NEW.estado = 0 THEN
        UPDATE espacios
        SET activo = false,
            estado = 'FUERA_DE_SERVICIO',
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE zona_id = NEW.id
          AND (activo = true OR estado <> 'FUERA_DE_SERVICIO');
    END IF;

    RETURN NEW;
END;
$$
@@

CREATE OR REPLACE FUNCTION validar_espacio_con_zona_activa()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    estado_zona integer;
    capacidad_zona integer;
    capacidad_ocupada integer;
BEGIN
    SELECT estado, capacidad
    INTO estado_zona, capacidad_zona
    FROM zonas
    WHERE id = NEW.zona_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Zona no encontrada para el espacio: %', NEW.zona_id
            USING ERRCODE = '23503';
    END IF;

    IF estado_zona = 0 AND TG_OP = 'INSERT' THEN
        RAISE EXCEPTION 'No se puede crear un espacio en una zona inactiva: %', NEW.zona_id
            USING ERRCODE = '23514';
    END IF;

    IF estado_zona = 0 AND (NEW.activo = true OR NEW.estado <> 'FUERA_DE_SERVICIO') THEN
        RAISE EXCEPTION 'Un espacio de una zona inactiva debe estar inactivo y fuera de servicio: %', NEW.zona_id
            USING ERRCODE = '23514';
    END IF;

    IF NEW.activo = true THEN
        SELECT COALESCE(SUM(capacidad), 0)
        INTO capacidad_ocupada
        FROM espacios
        WHERE zona_id = NEW.zona_id
          AND activo = true
          AND id <> NEW.id;

        IF capacidad_ocupada + NEW.capacidad > capacidad_zona THEN
            RAISE EXCEPTION 'La capacidad de espacios activos (%) supera la capacidad de la zona (%)',
                capacidad_ocupada + NEW.capacidad, capacidad_zona
                USING ERRCODE = '23514';
        END IF;
    END IF;

    RETURN NEW;
END;
$$
@@

CREATE OR REPLACE FUNCTION prevenir_delete_zona()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'No se puede eliminar fisicamente una zona. Use desactivar_zona(uuid).'
        USING ERRCODE = '2F000';
END;
$$
@@

CREATE OR REPLACE PROCEDURE desactivar_zona(IN p_zona_id uuid)
LANGUAGE plpgsql
AS $$
DECLARE
    estado_actual integer;
BEGIN
    IF p_zona_id IS NULL THEN
        RAISE EXCEPTION 'El id de la zona es obligatorio'
            USING ERRCODE = '22004';
    END IF;

    SELECT estado
    INTO estado_actual
    FROM zonas
    WHERE id = p_zona_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Zona no encontrada: %', p_zona_id
            USING ERRCODE = 'P0002';
    END IF;

    IF estado_actual = 0 THEN
        RETURN;
    END IF;

    UPDATE zonas
    SET estado = 0,
        fecha_modificacion = CURRENT_TIMESTAMP
    WHERE id = p_zona_id;
END;
$$
@@

DROP TRIGGER IF EXISTS trg_validar_cambio_estado_zona ON zonas
@@

CREATE TRIGGER trg_validar_cambio_estado_zona
    BEFORE UPDATE OF estado ON zonas
    FOR EACH ROW
    EXECUTE FUNCTION validar_cambio_estado_zona()
@@

DROP TRIGGER IF EXISTS trg_desactivar_espacios_de_zona ON zonas
@@

CREATE TRIGGER trg_desactivar_espacios_de_zona
    AFTER UPDATE OF estado ON zonas
    FOR EACH ROW
    EXECUTE FUNCTION desactivar_espacios_de_zona()
@@

DROP TRIGGER IF EXISTS trg_validar_espacio_con_zona_activa ON espacios
@@

CREATE TRIGGER trg_validar_espacio_con_zona_activa
    BEFORE INSERT OR UPDATE OF zona_id, activo, estado, capacidad ON espacios
    FOR EACH ROW
    EXECUTE FUNCTION validar_espacio_con_zona_activa()
@@

DROP TRIGGER IF EXISTS trg_prevenir_delete_zona ON zonas
@@

CREATE TRIGGER trg_prevenir_delete_zona
    BEFORE DELETE ON zonas
    FOR EACH ROW
    EXECUTE FUNCTION prevenir_delete_zona()
@@
