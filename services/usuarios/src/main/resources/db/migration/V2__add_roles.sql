-- V2: Agregar roles COLLECTOR y ROOT
INSERT INTO roles (id, active, assigned_at, description, name, updated_at)
VALUES (
    gen_random_uuid(), true, NOW(), 'Recolector de vehículos', 'COLLECTOR', NOW()
)
ON CONFLICT ON CONSTRAINT uk_roles_name DO NOTHING;

INSERT INTO roles (id, active, assigned_at, description, name, updated_at)
VALUES (
    gen_random_uuid(), true, NOW(), 'Superusuario con permisos de borrado físico', 'ROOT', NOW()
)
ON CONFLICT ON CONSTRAINT uk_roles_name DO NOTHING;
