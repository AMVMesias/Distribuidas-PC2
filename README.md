<div align="center">

# Gateway Distribuidas

**Monorepo de microservicios para gestión de parking, protegidos por Kong Gateway con autenticación JWT RS256.**

[Características](#-características) ·
[Arquitectura](#-arquitectura) ·
[Inicio rápido](#-inicio-rápido) ·
[API](#-api-pública) ·
[Documentación](#-documentación-interactiva) ·
[Operación](#-operación)

</div>

---

## Tabla de contenidos

- [Resumen](#-resumen)
- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Stack tecnológico](#-stack-tecnológico)
- [Requisitos](#-requisitos)
- [Inicio rápido](#-inicio-rápido)
- [Cliente web](#-cliente-web)
- [API pública](#-api-pública)
- [Documentación interactiva](#-documentación-interactiva)
- [Modelo de datos](#-modelo-de-datos)
- [Seguridad](#-seguridad)
- [Pruebas locales](#-pruebas-locales)
- [Datos de demostración](#-datos-de-demostración)
- [Operación](#-operación)
- [Solución de problemas](#-solución-de-problemas)
- [Estructura del repositorio](#-estructura-del-repositorio)

---

## Resumen

Plataforma distribuida de gestión de parking con cuatro microservicios independientes, protegidos por **Kong Gateway** como único punto de entrada. La autenticación se realiza con **JWT RS256** (access tokens de 15 min) y **refresh tokens opacos rotativos** (7 días). Cada servicio usa su propia base de datos PostgreSQL y se comunica con los demás sólo a través de canales internos autenticados.

| Punto de acceso | URL | Visible desde |
|---|---|---|
| API Gateway (Kong) | `http://localhost:8000` | Host / navegador |
| Cliente web de pruebas | `http://localhost:9000` | Host / navegador |
| Backends, Postgres, Kong Admin | — | Red interna Docker |

---

## Características

- **API Gateway único** con Kong 3.9 en modo *DB-less* y configuración declarativa.
- **Cuatro microservicios** con tecnologías heterogéneas (Spring Boot + NestJS) comunicándose por HTTP interno.
- **Autenticación JWT RS256** con par de claves generado en el bootstrap.
- **Refresh tokens opacos** con rotación y revocación por familia (detección de reuso).
- **RBAC** con dos roles: `USER` y `ADMIN`. Los servicios validan el token y aplican permisos de negocio.
- **Rate limiting** diferenciado en Kong: login 10/min, registro 5/h, refresh 30/min, autenticados 100/min.
- **CORS, `X-Request-ID` y correlación de peticiones** configurados como plugin global.
- **Auditoría de asignaciones** con snapshot del estado anterior y nuevo en cada cambio.
- **Cliente web standalone** (HTML/CSS/JS) que consume la API y muestra Swagger UI de cada servicio.
- **Migraciones automáticas** con Flyway (Spring) y migraciones TypeORM (NestJS).
- **Soft delete** en usuarios, personas, roles, zonas y asignaciones.
- **Redes Docker aisladas**: cada Postgres y cada backend vive en su propia red *internal*.

---

## Arquitectura

### Vista de despliegue

```mermaid
flowchart LR
    subgraph Host["Host (Windows / WSL Ubuntu)"]
        Browser["Cliente web · :9000"]
        Curl["curl / Postman / apps"]
    end

    subgraph GW["Docker · red gateway"]
        Kong["Kong Gateway · :8000"]
    end

    subgraph BE["Docker · red gateway + redes internas"]
        Usuarios["usuarios · Spring Boot :8080"]
        Zonas["zonas · Spring Boot :8080"]
        Vehiculos["vehiculos · NestJS :3000"]
        Asignaciones["asignaciones · NestJS :3000"]
    end

    subgraph DB["Docker · redes internas sin acceso externo"]
        DbU[("PostgreSQL 18 usuarios-db")]
        DbZ[("PostgreSQL 16 zonas-db")]
        DbV[("PostgreSQL 16 vehiculos-db")]
        DbA[("PostgreSQL 16 asignaciones-db")]
    end

    Browser --> Kong
    Curl --> Kong
    Kong -->|JWT| Usuarios
    Kong -->|JWT| Zonas
    Kong -->|JWT| Vehiculos
    Kong -->|JWT| Asignaciones
    Usuarios -.->|X-Internal-Service-Token| Asignaciones
    Vehiculos -.->|X-Internal-Service-Token| Asignaciones
    Usuarios --> DbU
    Zonas --> DbZ
    Vehiculos --> DbV
    Asignaciones --> DbA
```

### Flujo de autenticación

```mermaid
sequenceDiagram
    autonumber
    participant C as Cliente
    participant K as Kong :8000
    participant U as usuarios
    participant DB as Postgres

    C->>K: POST /api/v1/auth/login
    K->>U: reenvía petición
    U->>DB: SELECT user, password_hash
    U-->>K: 200 accessToken + refreshToken
    K-->>C: 200 pareja de tokens

    C->>K: GET /api/v1/zonas (Bearer)
    K->>K: valida firma, iss, exp
    K->>U: reenvía con headers de Kong
    U->>U: re-valida token y aplica RBAC
    U-->>K: respuesta
    K-->>C: respuesta
```

### Servicios y responsabilidades

| Servicio | Stack | Puerto interno | BD | Responsabilidad |
|---|---|---|---|---|
| `usuarios` | Spring Boot 4.1 | 8080 | Postgres 18 | Auth, personas, usuarios, roles. Emite y firma JWT. |
| `zonas` | Spring Boot 4.0 | 8080 | Postgres 16 | Zonas de parking y sus espacios. |
| `vehiculos` | NestJS 11 | 3000 | Postgres 16 | Vehículos por dueño. `ownerId` desde `sub` del JWT. |
| `asignaciones` | NestJS 11 | 3000 | Postgres 16 | Propiedad vehículo-propietario y auditoría. |

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| API Gateway | Kong 3.9 (DB-less, CORS, correlation-id, JWT, rate-limiting) |
| Auth | Spring Security + JJWT (RS256) + refresh tokens opacos con hash |
| Backend Java | Java 25, Spring Boot 4.x, Spring Data JPA, Hibernate, Flyway |
| Backend Node | Node 22, NestJS 11, TypeORM, Passport JWT, class-validator |
| Persistencia | PostgreSQL 18 (usuarios) y PostgreSQL 16 (zonas, vehículos, asignaciones) |
| Cliente web | HTML + CSS + JS vanilla (sin build), servido por Node `http` |
| API docs | springdoc-openapi (Spring) y `@nestjs/swagger` (NestJS), expuestas por Kong |
| Observabilidad | Health checks por servicio + healthcheck de Kong |

---

## Requisitos

- **Windows 10/11** con WSL 2 y la distribución `Ubuntu` instalada.
- **Docker Engine** y **Docker Compose Plugin** dentro de Ubuntu (no se necesita Docker Desktop).
- **OpenSSL** en Ubuntu (lo usa el bootstrap para generar el par RSA).
- **PowerShell 7** (opcional) para invocar los scripts `.ps1` desde Windows.

Verifica el entorno antes de empezar:

```bash
wsl -d Ubuntu -- bash -lc "docker --version && docker compose version && openssl version"
```

---

## Inicio rápido

Los comandos siguientes están escritos para PowerShell 7 en Windows. Si prefieres trabajar directamente en la shell de Ubuntu, traduce las rutas `/mnt/c/...` por la ruta del repositorio dentro de WSL.

### 1. Bootstrap (una sola vez por clonación)

Genera `.env` desde `.env.example`, el par RSA en `.secrets/` y `infrastructure/kong/kong.yml` a partir de la plantilla.

```powershell
cd <ruta-del-repo>
.\scripts\bootstrap.ps1
```

> El script es idempotente. Usa `.\scripts\bootstrap.ps1 -Force` para regenerar el par RSA y la configuración de Kong.

### 2. Levantar la plataforma

```powershell
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/<usuario>/<ruta>/Distribuidas-PC2 && docker compose up --build -d"
```

Espera a que todos los healthchecks pasen:

```powershell
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/<usuario>/<ruta>/Distribuidas-PC2 && docker compose ps"
```

### 3. Probar la API

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"Admin12345!"}'
```

La respuesta trae `accessToken` (JWT RS256) y `refreshToken` (opaco). Para rutas protegidas:

```bash
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

### 4. Abrir el cliente web

Visita **`http://localhost:9000`**. Encontrarás:

- Un *dashboard* con la URL de Kong configurable y el estado de la sesión.
- Formularios dinámicos para **todos los endpoints** de los cuatro servicios.
- Un **inspector de JWT** que decodifica el access token actual.
- Acceso directo al **Swagger UI** de cada servicio a través de Kong.
- **Historial de peticiones** de la sesión.

### 5. Logs en vivo

```powershell
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/<usuario>/<ruta>/Distribuidas-PC2 && docker compose logs -f --tail=100"
```

---

## Cliente web

El directorio [`web/`](./web) contiene una aplicación HTML/CSS/JS **standalone** (sin *framework*, sin *build step*) servida por `web/serve.js`. Es un *playground* pensado para explorar la API sin escribir `curl`.

| Sección | Qué hace |
|---|---|
| **Inicio** | Estado de la plataforma, pasos para arrancar, tabla rápida de permisos. |
| **Autenticación** | `register`, `login`, `refresh`, `logout`, `me`. Login y registro guardan la sesión automáticamente. |
| **JWT Inspector** | Decodifica el access token, muestra header, payload, claims clave y expiración. |
| **Usuarios / Personas / Roles** | CRUD completo (sólo ADMIN). |
| **Zonas / Espacios** | Lectura para USER, escritura para ADMIN. |
| **Vehículos** | USER opera los propios; ADMIN opera todos. El `ownerId` se toma del JWT. |
| **Documentación API** | Estado en vivo de los Swagger UI y enlaces directos. |
| **Historial** | Últimas 50 peticiones con request, response, status y tiempo. |
| **Ayuda** | Errores comunes (401/403/429) y preguntas frecuentes. |

**Características de UX:**

- Tema claro / oscuro con `localStorage`.
- Renovación automática del access token cuando faltan menos de 60 s o el backend responde 401.
- Botón "Copiar cURL" en cada endpoint para llevártelo a la terminal.
- Resaltado de sintaxis JSON en las respuestas.
- Toasts contextuales para 401, 403 y 429.

---

## API pública

> **Importante:** todas las rutas son accesibles **únicamente a través de Kong** (`http://localhost:8000`). Los backends **no** exponen puertos al host.

### Autenticación (`/api/v1/auth`)

| Método | Ruta | Permiso | Notas |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Pública | Crea siempre un `USER`. Devuelve sesión completa. Rate limit: 5/h por IP. |
| `POST` | `/api/v1/auth/login` | Pública | Devuelve `accessToken` (JWT 15 m) + `refreshToken` (opaco 7 d). Rate limit: 10/min por IP. |
| `POST` | `/api/v1/auth/refresh` | Pública | Rota el refresh token. Reusar uno ya rotado revoca toda la familia. Rate limit: 30/min por IP. |
| `POST` | `/api/v1/auth/logout` | Pública | Revoca el refresh token presentado. |
| `GET`  | `/api/v1/auth/me` | `USER` / `ADMIN` | Devuelve el usuario autenticado. |

### Usuarios, personas y roles (`/api/v1/usuarios`, `/personas`, `/roles`)

Reservado a `ADMIN`. Incluye CRUD completo sobre los tres recursos, asignación y remoción de roles a un usuario, y listado de roles por usuario.

### Zonas y espacios (`/api/v1/zonas`, `/api/v1/espacios`)

| Operación | Permiso |
|---|---|
| `GET` (listar, buscar por zona) | `USER` o `ADMIN` |
| `POST`, `PUT`, `DELETE`, cambio de estado | Sólo `ADMIN` |

Tipos de zona: `VIP`, `REGULAR`, `INTERNA`, `EXTERNA`, `PREFERENCIAL`. Estados de espacio: `DISPONIBLE`, `OCUPADO`, `RESERVADO`, `FUERA_DE_SERVICIO`. Tipos de espacio: `MOTO`, `AUTO`, `BUS`.

### Vehículos (`/api/v1/vehiculos`)

| Operación | Permiso |
|---|---|
| `GET` (listar, obtener) | `USER` ve los propios; `ADMIN` ve todos |
| `POST`, `PATCH`, `DELETE` | `USER` sobre los propios; `ADMIN` sobre todos |

> El backend **ignora** cualquier `ownerId` enviado en el body. Lo toma del claim `sub` del JWT.

Tipos de vehículo soportados: `auto`, `motocicleta`, `camioneta`, cada uno con campos específicos (puertas y maletero; tipo de moto; capacidad de carga y tracción).

### Asignaciones (`/api/v1/asignaciones`, `/api/v1/propietarios`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| `POST` | `/api/v1/asignaciones` | `USER` sobre sí mismo, `ADMIN` sobre cualquiera | Crea o reactiva una asignación. |
| `GET` | `/api/v1/asignaciones` | `USER` ve las propias, `ADMIN` ve todas | Lista con filtros. |
| `DELETE` | `/api/v1/asignaciones/{userId}/{vehicleId}` | `USER` sólo sobre sí mismo, `ADMIN` sobre todos | Soft delete. |
| `PUT` | `/api/v1/asignaciones/vehiculos/{vehicleId}/propietario` | Sólo `ADMIN` | Transfiere el propietario activo. |
| `GET` | `/api/v1/propietarios/{userId}/vehiculos` | `USER` sólo la propia flota, `ADMIN` cualquiera | Flota agregada. |
| `GET` | `/api/v1/asignaciones/auditoria` | Sólo `ADMIN` | Eventos de auditoría con snapshot anterior y nuevo. |

### Ejemplo de sesión

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"Admin12345!"}'
```

```json
{
  "user": { "id": "...", "username": "admin", "roles": ["ADMIN"] },
  "accessToken": "eyJhbGciOiJSUzI1NiIs...",
  "refreshToken": "1f3a...opaco",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

```bash
# Llamada protegida
curl http://localhost:8000/api/v1/zonas \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## Documentación interactiva

Cada servicio publica su Swagger UI y OpenAPI JSON. Kong los enruta bajo el prefijo del servicio con `strip_path`, así que **no requieren JWT**.

| Servicio | Swagger UI | OpenAPI JSON |
|---|---|---|
| usuarios | <http://localhost:8000/usuarios/swagger-ui/index.html> | <http://localhost:8000/usuarios/v3/api-docs> |
| zonas | <http://localhost:8000/zonas/swagger-ui/index.html> | <http://localhost:8000/zonas/v3/api-docs> |
| vehiculos | <http://localhost:8000/vehiculos/swagger-ui> | <http://localhost:8000/vehiculos/v3/api-docs> |

> `asignaciones` no expone Swagger UI al exterior, pero puedes consumirlo desde el cliente web en la sección **Asignaciones** o vía Kong con el JWT.

---

## Modelo de datos

### usuarios / personas / roles

```mermaid
erDiagram
    PERSONAS ||--o| USERS : tiene
    USERS ||--o{ USER_ROLE : asignado
    ROLES ||--o{ USER_ROLE : contiene
    PERSONAS {
        uuid id PK
        string dni
        string first_name
        string last_name
        string email
    }
    USERS {
        uuid persona_id FK
        string username
        string password_hash
    }
    ROLES {
        uuid id PK
        string name
    }
    USER_ROLE {
        uuid user_id FK
        uuid role_id FK
    }
```

### vehículos (con jerarquía de tipos)

```mermaid
classDiagram
    class Vehiculo {
        +UUID id
        +String placa
        +String marca
        +String modelo
        +String color
        +int anio
        +String clasificacion
        +UUID ownerId
        +String tipo
    }
    class Auto {
        +int numeroPuertas
        +int capacidadMaletero
    }
    class Motocicleta {
        +String tipoMoto
    }
    class Camioneta {
        +float capacidadCarga
        +String traccion
    }
    Vehiculo <|-- Auto
    Vehiculo <|-- Motocicleta
    Vehiculo <|-- Camioneta
```

### zonas / espacios

```mermaid
erDiagram
    ZONAS ||--o{ ESPACIOS : contiene
    ZONAS {
        uuid id PK
        string nombre
        string tipo
    }
    ESPACIOS {
        uuid id PK
        uuid zona_id FK
        string codigo
        string estado
    }
```

### asignaciones + auditoría

```mermaid
erDiagram
    VEHICLE_ASSIGNMENT ||--o{ ASSIGNMENT_AUDIT_EVENT : genera
    VEHICLE_ASSIGNMENT {
        uuid id PK
        uuid user_id
        uuid vehicle_id
        boolean active
    }
    ASSIGNMENT_AUDIT_EVENT {
        uuid id PK
        uuid assignment_id FK
        string event_type
        uuid actor_user_id
    }
```

> La clave compuesta `user_id + vehicle_id` es la **fuente oficial** de propiedad vehículo-propietario. El `ownerId` que vive en `vehiculos` se conserva sólo por compatibilidad.

---

## Seguridad

### Defensa en profundidad

```mermaid
flowchart TB
    A["Petición del cliente"] --> B{"¿CORS permitido?"}
    B -- no --> X1[403]
    B -- si --> C{"¿Rate limit OK?"}
    C -- no --> X2[429]
    C -- si --> D{"¿Requiere JWT?"}
    D -- no --> E["Proxy al backend"]
    D -- si --> F{"¿Firma / iss / exp válidos?"}
    F -- no --> X3[401]
    F -- si --> G["Proxy al backend"]
    E --> H["Backend aplica RBAC de negocio"]
    G --> H
    H --> I["200 / 4xx / 5xx"]
```

### Decisiones clave

- **CORS** se configura en Kong con los orígenes declarados en `CORS_ORIGINS` (incluye `http://localhost:9000` por defecto).
- **JWT** se verifica en Kong con la clave pública del issuer y de nuevo en cada backend.
- **Tokens**:
  - Access token: JWT RS256, vida 15 min, validado en Kong y backend.
  - Refresh token: opaco, vida 7 d, almacenado con *hash* en base. Cada uso genera uno nuevo; reusar uno ya rotado **revoca toda la familia**.
- **Registro público**: asigna siempre el rol `USER`. Para crear `ADMIN` se necesita otro `ADMIN`.
- **Vehículos**: `ownerId` se toma **exclusivamente** del claim `sub` del token. Aunque el cliente envíe `ownerId` en el body, el servicio lo ignora.
- **Asignaciones**: la propiedad activa vive aquí. `vehiculos.ownerId` se mantiene sincronizado por compatibilidad pero la verdad está en `vehicle_assignment`.
- **Auditoría**: cada `create`, `reactivate`, `transfer` o `soft delete` deja un `assignment_audit_event` con snapshot anterior y nuevo.
- **Comunicaciones internas**: `asignaciones` consulta a `usuarios` y `vehiculos` por la red interna de Docker usando el header `X-Internal-Service-Token`. Esos endpoints no están publicados en Kong.
- **Esquema**: Hibernate valida el esquema y Flyway ejecuta las migraciones desde bases vacías en cada arranque.
- **Aislamiento de red**: cada Postgres y cada red de backend es `internal: true`. El único puerto publicado al host es `8000` (Kong) y `9000` (cliente web).

---

## Pruebas locales

### Pruebas por servicio

```powershell
# Spring Boot
cd services\usuarios; .\mvnw.cmd test
cd ..\zonas;       .\mvnw.cmd test

# NestJS
cd ..\vehiculos;   npm test -- --runInBand; npm run build
cd ..\asignaciones; npm run build
```

### Validación de Compose y estado

```powershell
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/<usuario>/<ruta>/Distribuidas-PC2 && docker compose config --quiet && docker compose ps -a"
```

### Colección Postman

Importa [`docs/gateway.postman_collection.json`](./docs/gateway.postman_collection.json) en Postman. Las variables `baseUrl`, `accessToken` y `refreshToken` se actualizan automáticamente al ejecutar `login` y `refresh`.

---

## Datos de demostración

El script `seed-demo` borra **únicamente** los volúmenes de este monorepo y carga un dataset de ejemplo.

```powershell
# Desde PowerShell
.\scripts\seed-demo.ps1 --reset

# O directamente en Ubuntu
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/<usuario>/<ruta>/Distribuidas-PC2 && bash scripts/seed-demo.sh --reset"
```

| Recurso | Cantidad |
|---|---|
| Usuarios `USER` | 30 |
| Zonas | 10 |
| Espacios | 150 |
| Vehículos | 90 |
| Administrador | 1 |
| Roles | `USER`, `ADMIN` |

> La contraseña compartida de los `USER` demo es **`Demo12345!`**. Úsala sólo en desarrollo. Si ejecutas el script **sin** `--reset` sobre datos ya cargados, habrá conflictos por identificadores únicos.

---

## Operación

### Comandos frecuentes

| Tarea | Comando |
|---|---|
| Ver estado | `docker compose ps` |
| Logs en vivo | `docker compose logs -f --tail=100` |
| Reiniciar un servicio | `docker compose restart <servicio>` |
| Reconstruir una imagen | `docker compose build <servicio>` |
| Apagar todo | `docker compose down` |
| Apagar y borrar volúmenes | `docker compose down -v` |
| Regenerar claves + Kong | `.\scripts\bootstrap.ps1 -Force` |
| Re-cargar datos demo | `.\scripts\seed-demo.ps1 --reset` |

### Inspección rápida

```bash
# Health de Kong
curl -fsS http://localhost:8000/usuarios/actuator/health

# Health de un backend (sólo dentro de la red Docker)
docker exec kong wget -qO- http://usuarios:8080/actuator/health
```

---

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Connection refused` a `localhost:8000` | Kong no está arriba o `docker compose` falló. | `docker compose ps` y `docker compose logs kong`. |
| `401` desde Kong | Token ausente, expirado o con issuer/audience incorrectos. | Inspecciona el JWT en el cliente web y verifica `JWT_ISSUER` / `JWT_AUDIENCE` del `.env`. |
| `403` desde un backend | El token pasó Kong pero el rol no permite la operación. | Revisa la tabla de permisos. Inicia sesión como `ADMIN` si la ruta lo requiere. |
| `429` | Rate limit de Kong activo. | Espera el tiempo indicado y reintenta. Los límites están en `infrastructure/kong/kong.yml`. |
| Cambié `CORS_ORIGINS` y no aplica | Kong no se ha regenerado. | Ejecuta `.\scripts\bootstrap.ps1` de nuevo y recrea Kong: `docker compose up -d --force-recreate kong`. |
| Postgres de `usuarios` no arranca | El volumen se montó sobre `/var/lib/postgresql` en vez de `/var/lib/postgresql/data` (es lo correcto para Postgres 18). | Compose ya apunta a la ruta correcta. Si lo modificas a mano, asegúrate de respetar la convención de la imagen. |
| Quiero empezar desde cero | Volúmenes con datos viejos. | `docker compose down -v && docker compose up --build -d`. **Esto elimina sólo los volúmenes de este monorepo**. |
| `docker compose` no se reconoce | Falta el plugin de Docker Compose. | Instálalo dentro de Ubuntu (`sudo apt install docker-compose-plugin`). |

### Logs por servicio

```bash
docker compose logs usuarios --tail=200
docker compose logs zonas --tail=200
docker compose logs vehiculos --tail=200
docker compose logs asignaciones --tail=200
docker compose logs kong --tail=200
```

---

## Estructura del repositorio

```text
Distribuidas-PC2/
├── docker-compose.yml           Orquestación: 4 servicios, 4 Postgres, Kong, web
├── .env.example                 Plantilla de variables (copiada a .env por el bootstrap)
├── .gitignore                   Excluye .env, .secrets/, kong.yml, node_modules, etc.
│
├── services/
│   ├── usuarios/                Spring Boot 4.1 · auth + personas + usuarios + roles
│   ├── zonas/                   Spring Boot 4.0 · zonas + espacios
│   ├── vehiculos/               NestJS 11 · vehículos por dueño
│   └── asignaciones/            NestJS 11 · propiedad + auditoría
│
├── infrastructure/
│   └── kong/
│       ├── kong.yml.template    Plantilla con placeholders
│       └── kong.yml             Generado por el bootstrap (ignorado por Git)
│
├── web/                         Cliente web standalone (HTML/CSS/JS + serve.js)
│
├── scripts/
│   ├── bootstrap.ps1 / .sh      Genera .env, par RSA y kong.yml
│   └── seed-demo.ps1 / .sh      Carga el dataset de demostración
│
├── docs/
│   ├── endpoints.md             Cómo usar la API
│   ├── gateway.postman_collection.json
│   └── usuarios/data-model.md   Modelo de datos de usuarios
│
└── .secrets/                    Par RSA generado (ignorado por Git)
    ├── jwt-private.pem
    └── jwt-public.pem
```

---

<div align="center">

**[⬆ Volver al inicio](#gateway-distribuidas)**

</div>
