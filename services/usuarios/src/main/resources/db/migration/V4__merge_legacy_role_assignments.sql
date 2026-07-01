DO $$
DECLARE
    legacy_user_id uuid;
    cliente_id uuid;
    legacy_collector_id uuid;
    recaudador_id uuid;
BEGIN
    SELECT id INTO legacy_user_id FROM roles WHERE UPPER(name) = 'USER' LIMIT 1;
    SELECT id INTO cliente_id FROM roles WHERE UPPER(name) = 'CLIENTE' LIMIT 1;

    IF legacy_user_id IS NOT NULL AND cliente_id IS NOT NULL AND legacy_user_id <> cliente_id THEN
        INSERT INTO user_role (id_user, id_role, active, assigned_at, updated_at)
        SELECT id_user, cliente_id, active, assigned_at, NOW()
        FROM user_role
        WHERE id_role = legacy_user_id
        ON CONFLICT (id_user, id_role) DO NOTHING;

        UPDATE roles SET active = false, updated_at = NOW() WHERE id = legacy_user_id;
    END IF;

    SELECT id INTO legacy_collector_id FROM roles WHERE UPPER(name) = 'COLLECTOR' LIMIT 1;
    SELECT id INTO recaudador_id FROM roles WHERE UPPER(name) = 'RECAUDADOR' LIMIT 1;

    IF legacy_collector_id IS NOT NULL AND recaudador_id IS NOT NULL AND legacy_collector_id <> recaudador_id THEN
        INSERT INTO user_role (id_user, id_role, active, assigned_at, updated_at)
        SELECT id_user, recaudador_id, active, assigned_at, NOW()
        FROM user_role
        WHERE id_role = legacy_collector_id
        ON CONFLICT (id_user, id_role) DO NOTHING;

        UPDATE roles SET active = false, updated_at = NOW() WHERE id = legacy_collector_id;
    END IF;
END $$;
