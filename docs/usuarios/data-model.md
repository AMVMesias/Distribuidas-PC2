# Modelo de Datos

## Diagrama Entidad-Relación

```mermaid
erDiagram
    PERSONAS ||--o| USERS : tiene
    USERS ||--o{ USER_ROLE : asignado
    ROLES ||--o{ USER_ROLE : contiene

    PERSONAS {
        uuid id_uuid PK
        boolean active
        string address
        timestamp created_at
        string dni "character varying(30)"
        string email "character varying(50)"
        string first_name "character varying(30)"
        string last_name "character varying(30)"
        string middle_name "character varying(30)"
        string nationality "character varying(30)"
        string phone "character varying(15)"
        timestamp updated_at
    }

    USERS {
        uuid id_person FK
        boolean active
        timestamp created_at
        timestamp last_login
        string password_hash "character varying(30)"
        timestamp updated_at
        string username "character varying(15)"
    }

    USER_ROLE {
        uuid id_role FK
        uuid id_user FK
    }

    ROLES {
        uuid id PK
        boolean active
        timestamp assigned_at
        timestamp updated_at
        string name "character varying(50)"
        string description "text"
    }
```

## Descripción de Tablas

### PERSONAS
Tabla que contiene información personal de los usuarios del sistema.

- **id_uuid**: Identificador único (UUID)
- **dni**: Documento de identidad
- **first_name, middle_name, last_name**: Nombre completo
- **email**: Correo electrónico
- **phone**: Teléfono de contacto
- **address**: Dirección
- **nationality**: Nacionalidad
- **active**: Estado de la persona
- **created_at, updated_at**: Auditoría temporal

### USERS
Tabla de credenciales y acceso al sistema.

- **id_person**: FK a PERSONAS (relación uno a uno)
- **username**: Nombre de usuario único
- **password_hash**: Contraseña hasheada
- **active**: Usuario activo o inactivo
- **last_login**: Último acceso al sistema
- **created_at, updated_at**: Auditoría temporal

### ROLES
Tabla de roles disponibles en el sistema.

- **id**: Identificador único (UUID)
- **name**: Nombre del rol
- **description**: Descripción del rol
- **active**: Rol activo o inactivo
- **assigned_at, updated_at**: Auditoría temporal

### USER_ROLE
Tabla de relación muchos a muchos entre usuarios y roles.

- **id_user**: FK a USERS
- **id_role**: FK a ROLES

Permite asignar múltiples roles a cada usuario.

## Relaciones

1. **PERSONAS → USERS** (1:1): Una persona puede tener una cuenta de usuario
2. **USERS → USER_ROLE → ROLES** (M:N): Un usuario puede tener múltiples roles
