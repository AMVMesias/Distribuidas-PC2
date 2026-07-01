DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM roles WHERE UPPER(name) = 'USER')
       AND NOT EXISTS (SELECT 1 FROM roles WHERE UPPER(name) = 'CLIENTE') THEN
        UPDATE roles
        SET name = 'CLIENTE',
            description = 'Cliente del parqueadero',
            updated_at = NOW()
        WHERE UPPER(name) = 'USER';
    ELSE
        INSERT INTO roles (id, active, assigned_at, description, name, updated_at)
        VALUES (gen_random_uuid(), true, NOW(), 'Cliente del parqueadero', 'CLIENTE', NOW())
        ON CONFLICT ON CONSTRAINT uk_roles_name DO NOTHING;
    END IF;

    IF EXISTS (SELECT 1 FROM roles WHERE UPPER(name) = 'COLLECTOR')
       AND NOT EXISTS (SELECT 1 FROM roles WHERE UPPER(name) = 'RECAUDADOR') THEN
        UPDATE roles
        SET name = 'RECAUDADOR',
            description = 'Empleado recaudador del parqueadero',
            updated_at = NOW()
        WHERE UPPER(name) = 'COLLECTOR';
    ELSE
        INSERT INTO roles (id, active, assigned_at, description, name, updated_at)
        VALUES (gen_random_uuid(), true, NOW(), 'Empleado recaudador del parqueadero', 'RECAUDADOR', NOW())
        ON CONFLICT ON CONSTRAINT uk_roles_name DO NOTHING;
    END IF;
END $$;
