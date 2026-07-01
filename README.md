<div align="center">

# Gateway Distribuidas

**Monorepo de microservicios para gestión de parking, protegidos por Kong Gateway con autenticación JWT RS256.**

[Características](#-características) ·
[Arquitectura](#-arquitectura) ·
[Inicio rápido](#-inicio-rápido) ·
[API](#-api-pública) ·
[Swagger UI](#-documentación-interactiva) ·
[Operación](#-operación)

</div>

---

## Tabla de contenidos

- [Resumen](#-resumen)
- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Stack tecnológico](#-stack-tecnológico)
- [Requisitos](#-requisitos)
- [Archivos de configuración clave](#-archivos-de-configuración-clave)
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

Plataforma distribuida de gestión de parking con cinco microservicios independientes, protegidos por **Kong Gateway** como único punto de entrada. La autenticación se realiza con **JWT RS256** (access tokens de 15 min) y **refresh tokens opacos rotativos** (7 días). Cada servicio usa su propia base de datos PostgreSQL y se comunica con los demás sólo a través de canales internos autenticados.

| Punto de acceso | URL | Visible desde | Notas |
|---|---|---|---|
| **Swagger UI centralizado (los 5 servicios)** | **<http://localhost:8000/asignaciones/swagger-ui>** | Host / navegador | **Forma recomendada de explorar y probar la API.** |
| API Gateway (Kong) | `http://localhost:8000` | Host / navegador | Único punto de entrada de la API. |
| Cliente web de pruebas | `http://localhost:9000` | Host / navegador | Formularios dinámicos, inspector JWT, historial. |
| Backends, Postgres, Kong Admin | — | Red interna Docker | No expuestos al host. |

> La plataforma expone **OpenAPI 3** para los cinco servicios. El servicio `asignaciones` publica un Swagger UI que agrega las specs en una sola URL. Úsalo como punto de partida; Postman queda relegado a casos puntuales (ver [Documentación interactiva](#-documentación-interactiva)).

---

## Características

- **API Gateway único** con Kong 3.9 en modo *DB-less* y configuración declarativa.
- **Cinco microservicios** con tecnologías heterogéneas (Spring Boot + NestJS) comunicándose por HTTP interno.
- **Autenticación JWT RS256** con par de claves generado en el bootstrap.
- **Refresh tokens opacos** con rotación y revocación por familia (detección de reuso).
- **RBAC** con roles `CLIENTE`, `RECAUDADOR`, `ADMIN` y `ROOT`. Los servicios validan el token y aplican permisos de negocio.
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
        Swagger["Swagger UI centralizado · :8000/asignaciones/swagger-ui"]
        Browser["Cliente web · :9000"]
        Curl["curl / apps externas"]
    end

    subgraph GW["Docker · red gateway"]
        Kong["Kong Gateway · :8000"]
    end

    subgraph BE["Docker · red gateway + redes internas"]
        Usuarios["usuarios · Spring Boot :8080"]
        Zonas["zonas · Spring Boot :8080"]
        Vehiculos["vehiculos · NestJS :3000"]
        Asignaciones["asignaciones · NestJS :3000"]
        Tickets["tickets · NestJS :3000"]
    end

    subgraph DB["Docker · redes internas sin acceso externo"]
        DbU[("PostgreSQL 18 usuarios-db")]
        DbZ[("PostgreSQL 16 zonas-db")]
        DbV[("PostgreSQL 16 vehiculos-db")]
        DbA[("PostgreSQL 16 asignaciones-db")]
        DbT[("PostgreSQL 16 tickets-db")]
    end

    Swagger --> Kong
    Browser --> Kong
    Curl --> Kong
    Kong -->|JWT| Usuarios
    Kong -->|JWT| Zonas
    Kong -->|JWT| Vehiculos
    Kong -->|JWT| Asignaciones
    Kong -->|JWT| Tickets
    Usuarios -.->|X-Internal-Service-Token| Asignaciones
    Vehiculos -.->|X-Internal-Service-Token| Asignaciones
    Tickets -.->|X-Internal-Service-Token| Vehiculos
    Tickets -.->|X-Internal-Service-Token| Asignaciones
    Tickets -.->|X-Internal-Service-Token| Zonas
    Usuarios --> DbU
    Zonas --> DbZ
    Vehiculos --> DbV
    Asignaciones --> DbA
    Tickets --> DbT
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
| `tickets` | NestJS 11 | 3000 | Postgres 16 | Emisión, pago y cancelación de tickets de parqueadero. |

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| API Gateway | Kong 3.9 (DB-less, CORS, correlation-id, JWT, rate-limiting) |
| Auth | Spring Security + JJWT (RS256) + refresh tokens opacos con hash |
| Backend Java | Java 25, Spring Boot 4.x, Spring Data JPA, Hibernate, Flyway |
| Backend Node | Node 22, NestJS 11, TypeORM, Passport JWT, class-validator |
| Persistencia | PostgreSQL 18 (usuarios) y PostgreSQL 16 (zonas, vehículos, asignaciones, tickets) |
| Cliente web | HTML + CSS + JS vanilla (sin build), servido por Node `http` |
| API docs | springdoc-openapi (Spring) y `@nestjs/swagger` (NestJS), expuestas por Kong |
| Observabilidad | Health checks por servicio + healthcheck de Kong |

---

## Requisitos

- **Windows 10/11** con WSL 2 y la distribución `Ubuntu` instalada.
- **Docker Engine** y **Docker Compose Plugin** dentro de Ubuntu (no se necesita Docker Desktop).
- **OpenSSL** en Ubuntu (lo usa el bootstrap para generar el par RSA).
- **PowerShell 7** (opcional) para invocar los scripts `.ps1` desde Windows.
- **Navegador moderno** para usar el cliente web (`http://localhost:9000`) y Swagger UI.

Verifica el entorno antes de empezar:

```bash
wsl -d Ubuntu -- bash -lc "docker --version && docker compose version && openssl version"
```

---

## Archivos de configuración clave

Antes de arrancar, conviene conocer estos archivos. **Ninguno se versiona en Git** (excepto la plantilla `.env.example`); los genera el bootstrap.

| Archivo | Generado por | Propósito |
|---|---|---|
| `.env` | `bootstrap.ps1` (copia desde `.env.example`) | Variables de entorno: credenciales de Postgres, JWT, admin inicial, CORS. |
| `.secrets/jwt-private.pem` | `bootstrap.ps1` (con `openssl genpkey`) | Clave privada RSA usada por `usuarios` para firmar los access tokens. |
| `.secrets/jwt-public.pem` | `bootstrap.ps1` (con `openssl rsa -pubout`) | Clave pública RSA usada por Kong (vía `kong.yml`) y por los 4 backends para validar tokens. |
| `infrastructure/kong/kong.yml` | `bootstrap.ps1` (a partir de `kong.yml.template`) | Configuración declarativa de Kong: rutas, plugins, CORS, claves, etc. |

> Si clonas en otro equipo, basta con ejecutar `.\scripts\bootstrap.ps1` para regenerar todos. Si quieres empezar desde cero en el equipo actual, usa `.\scripts\bootstrap.ps1 -Force` para regenerar también el par RSA.

---

## Inicio rápido

Esta sección cubre el ciclo completo de un desarrollador: clonar → configurar → arrancar → probar. Los comandos están escritos para PowerShell 7 en Windows. Si trabajas directamente en la shell de Ubuntu, traduce las rutas `/mnt/c/...` por la ruta del repositorio dentro de WSL.

> **TL;DR** Si ya tienes WSL Ubuntu con Docker y OpenSSL, basta con `.\scripts\bootstrap.ps1` y luego `docker compose up --build -d` desde WSL. El resto de la sección detalla cada paso.

### 0. Clonar el repositorio

```powershell
git clone <url-del-repo>
cd Distribuidas-PC2
```

### 1. Configurar el entorno (`.env`)

El repositorio incluye una plantilla `.env.example`. El bootstrap la copiará a `.env` automáticamente si no existe. **Revisa y ajusta las credenciales antes de arrancar:**

```ini
# PostgreSQL (usado por los 5 servicios)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
USUARIOS_DB=usuarios
ZONAS_DB=zonas
VEHICULOS_DB=gestion_vehiculos
ASIGNACIONES_DB=asignaciones
TICKETS_DB=tickets

# JWT
JWT_ISSUER=gateway-distribuidas
JWT_AUDIENCE=parking-api
JWT_ACCESS_MINUTES=15
JWT_REFRESH_DAYS=7

# Token interno para llamadas service-to-service dentro de Docker
INTERNAL_SERVICE_TOKEN=change-me-internal-token

# Tarifas por hora y factores de espacio para tickets
TICKET_RATE_MOTO=0.50
TICKET_RATE_AUTO=1.00
TICKET_RATE_CAMIONETA=1.25
TICKET_RATE_BUS=2.00
TICKET_SPACE_FACTOR_MOTO=1.00
TICKET_SPACE_FACTOR_AUTO=1.00
TICKET_SPACE_FACTOR_BUS=1.50

# Administrador inicial (se crea en el primer arranque del servicio `usuarios`)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin12345!
ADMIN_DNI=0000000000
ADMIN_FIRST_NAME=Administrador
ADMIN_LAST_NAME=Sistema
ADMIN_EMAIL=admin@example.com

# Orígenes CORS permitidos (separados por coma). Incluye el cliente web y los Swagger UI.
CORS_ORIGINS=http://localhost:4200,http://localhost:5173,http://localhost:9000
```

> ⚠️ Cambia `POSTGRES_PASSWORD`, `ADMIN_PASSWORD` e `INTERNAL_SERVICE_TOKEN` si vas a exponer la plataforma fuera de `localhost`.

### 2. Ejecutar el bootstrap

```powershell
.\scripts\bootstrap.ps1
```

El script:

1. Copia `.env.example` a `.env` si no existe.
2. Genera el par RSA (`jwt-private.pem` / `jwt-public.pem`) en `.secrets/`.
3. Renderiza `infrastructure/kong/kong.yml` a partir de la plantilla con la clave pública, el emisor y los orígenes CORS.

> Es idempotente. Usa `.\scripts\bootstrap.ps1 -Force` para regenerar el par RSA y la configuración de Kong (por ejemplo, tras cambiar `CORS_ORIGINS`).

Si prefieres hacerlo en WSL directamente:

```bash
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/<usuario>/<ruta>/Distribuidas-PC2 && bash scripts/bootstrap.sh"
```

### 3. Levantar la plataforma

```powershell
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/<usuario>/<ruta>/Distribuidas-PC2 && docker compose up --build -d"
```

Espera a que **todos los healthchecks** pasen:

```powershell
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/<usuario>/<ruta>/Distribuidas-PC2 && docker compose ps"
```

El estado correcto es `running (healthy)` para `usuarios`, `zonas`, `vehiculos`, `asignaciones`, `tickets`, `kong` y `web`. Si algún servicio queda en `(health: starting)` o `(unhealthy)`, revisa los logs de ese servicio.

### 4. Probar la API

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

### 5. Abrir Swagger UI y el cliente web

| Herramienta | URL |
|---|---|
| **Swagger UI centralizado** (los 5 servicios) | **<http://localhost:8000/asignaciones/swagger-ui>** |
| Cliente web de pruebas | <http://localhost:9000> |

En el **Swagger UI centralizado** selecciona la spec del servicio en el desplegable superior derecho. Pulsa **Authorize** y pega el `accessToken` del paso 4 para probar las rutas protegidas.

El **cliente web** ofrece formularios para todos los endpoints, inspector de JWT, historial y acceso directo a los Swagger UI de cada servicio.

### 6. Logs en vivo

```powershell
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/<usuario>/<ruta>/Distribuidas-PC2 && docker compose logs -f --tail=100"
```

Para seguir un servicio concreto: `docker compose logs -f <servicio>` (por ejemplo `kong`, `usuarios`, `vehiculos`).

---

## Cliente web

El directorio [`web/`](./web) contiene una aplicación HTML/CSS/JS **standalone** (sin *framework*, sin *build step*) servida por `web/serve.js`. Es un *playground* pensado para explorar la API sin escribir `curl`.

| Sección | Qué hace |
|---|---|
| **Inicio** | Estado de la plataforma, pasos para arrancar, tabla rápida de permisos. |
| **Autenticación** | `register`, `login`, `refresh`, `logout`, `me`. Login y registro guardan la sesión automáticamente. |
| **JWT Inspector** | Decodifica el access token, muestra header, payload, claims clave y expiración. |
| **Usuarios / Personas / Roles** | CRUD completo (sólo ADMIN). |
| **Zonas / Espacios** | Lectura para CLIENTE y RECAUDADOR, escritura para ADMIN. |
| **Vehículos** | CLIENTE opera los propios; RECAUDADOR consulta; ADMIN opera todos. |
| **Tickets** | RECAUDADOR registra entrada/salida; CLIENTE consulta los propios; ADMIN consulta todo. |
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
| `POST` | `/api/v1/auth/register` | Pública | Crea siempre un `CLIENTE`. Devuelve sesión completa. Rate limit: 5/h por IP. |
| `POST` | `/api/v1/auth/login` | Pública | Devuelve `accessToken` (JWT 15 m) + `refreshToken` (opaco 7 d). Rate limit: 10/min por IP. |
| `POST` | `/api/v1/auth/refresh` | Pública | Rota el refresh token. Reusar uno ya rotado revoca toda la familia. Rate limit: 30/min por IP. |
| `POST` | `/api/v1/auth/logout` | Pública | Revoca el refresh token presentado. |
| `GET`  | `/api/v1/auth/me` | Usuario autenticado | Devuelve el usuario autenticado. |

### Usuarios, personas y roles (`/api/v1/usuarios`, `/personas`, `/roles`)

Reservado a `ADMIN`. Incluye CRUD completo sobre los tres recursos, asignación y remoción de roles a un usuario, y listado de roles por usuario.

### Zonas y espacios (`/api/v1/zonas`, `/api/v1/espacios`)

| Operación | Permiso |
|---|---|
| `GET` (listar, buscar por zona) | `CLIENTE`, `RECAUDADOR`, `ADMIN` o `ROOT` |
| `POST`, `PUT`, `DELETE`, cambio de estado | Sólo `ADMIN` |

Tipos de zona: `VIP`, `REGULAR`, `INTERNA`, `EXTERNA`, `PREFERENCIAL`. Estados de espacio: `DISPONIBLE`, `OCUPADO`, `RESERVADO`, `FUERA_DE_SERVICIO`. Tipos de espacio: `MOTO`, `AUTO`, `BUS`.

### Vehículos (`/api/v1/vehiculos`)

| Operación | Permiso |
|---|---|
| `GET` (listar, obtener, placa) | `CLIENTE` ve los propios; `RECAUDADOR`, `ADMIN` y `ROOT` ven todos |
| `POST`, `PATCH`, `DELETE` | `CLIENTE` sobre los propios; `ADMIN` y `ROOT` sobre todos |

> El backend **ignora** cualquier `ownerId` enviado en el body. Lo toma del claim `sub` del JWT.

Tipos de vehículo soportados: `auto`, `motocicleta`, `camioneta`, cada uno con campos específicos (puertas y maletero; tipo de moto; capacidad de carga y tracción).

### Asignaciones (`/api/v1/asignaciones`, `/api/v1/propietarios`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| `POST` | `/api/v1/asignaciones` | `CLIENTE` sobre sí mismo, `ADMIN` sobre cualquiera | Crea o reactiva una asignación. |
| `GET` | `/api/v1/asignaciones` | `CLIENTE` ve las propias, `ADMIN` ve todas | Lista con filtros. |
| `DELETE` | `/api/v1/asignaciones/{userId}/{vehicleId}` | `CLIENTE` sólo sobre sí mismo, `ADMIN` sobre todos | Soft delete. |
| `PUT` | `/api/v1/asignaciones/vehiculos/{vehicleId}/propietario` | Sólo `ADMIN` | Transfiere el propietario activo. |
| `GET` | `/api/v1/propietarios/{userId}/vehiculos` | `CLIENTE` sólo la propia flota, `ADMIN` cualquiera | Flota agregada. |
| `GET` | `/api/v1/asignaciones/auditoria` | Sólo `ADMIN` | Eventos de auditoría con snapshot anterior y nuevo. |

### Tickets (`/api/v1/tickets`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| `POST` | `/api/v1/tickets` | `RECAUDADOR`, `ADMIN`, `ROOT` | Emite ticket de ingreso, valida asignación activa y ocupa el espacio. |
| `GET` | `/api/v1/tickets` | `CLIENTE`, `RECAUDADOR`, `ADMIN`, `ROOT` | CLIENTE ve los propios; roles operativos consultan con filtros. |
| `GET` | `/api/v1/tickets/{id}` | `CLIENTE`, `RECAUDADOR`, `ADMIN`, `ROOT` | Consulta un ticket por ID respetando permisos. |
| `PATCH` | `/api/v1/tickets/{id}/pagar` | `RECAUDADOR`, `ADMIN`, `ROOT` | Registra salida, calcula valor recaudado y libera espacio. |
| `PATCH` | `/api/v1/tickets/{id}/cancelar` | `RECAUDADOR`, `ADMIN`, `ROOT` | Cancela ticket activo con valor 0 y libera espacio. |

El cobro usa mínimo de 30 minutos: `valor = (max(30, minutos) / 60) * tarifaVehiculo * factorEspacio`.

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

La forma recomendada de explorar y probar la API es el **Swagger UI**. Kong expone los `swagger-ui` y los JSON OpenAPI de cada servicio bajo su prefijo, sin requerir JWT.

### Swagger UI centralizado (los 5 servicios en una sola URL)

El servicio de **asignaciones** publica un Swagger UI que agrega las cinco especificaciones OpenAPI. Es la **puerta de entrada recomendada** para probar la plataforma.

| Recurso | URL |
|---|---|
| **Swagger UI centralizado** | **<http://localhost:8000/asignaciones/swagger-ui>** |
| OpenAPI asignaciones | <http://localhost:8000/asignaciones/v3/api-docs> |
| OpenAPI tickets | <http://localhost:8000/tickets/v3/api-docs> |

> En la esquina superior derecha del Swagger UI centralizado verás un desplegable con las specs: **Asignaciones · Usuarios · Vehículos · Zonas · Tickets**. Selecciona cualquiera y prueba sus endpoints.

### Swagger UI por servicio

Si prefieres abrir la documentación de un servicio concreto, también están disponibles:

| Servicio | Swagger UI | OpenAPI JSON |
|---|---|---|
| usuarios (Spring Boot) | <http://localhost:8000/usuarios/swagger-ui/index.html> | <http://localhost:8000/usuarios/v3/api-docs> |
| zonas (Spring Boot) | <http://localhost:8000/zonas/swagger-ui/index.html> | <http://localhost:8000/zonas/v3/api-docs> |
| vehiculos (NestJS) | <http://localhost:8000/vehiculos/swagger-ui> | <http://localhost:8000/vehiculos/v3/api-docs> |
| asignaciones (NestJS) | <http://localhost:8000/asignaciones/swagger-ui> | <http://localhost:8000/asignaciones/v3/api-docs> |
| tickets (NestJS) | <http://localhost:8000/tickets/swagger-ui> | <http://localhost:8000/tickets/v3/api-docs> |

### Cómo autenticarse desde Swagger UI

1. Abre el Swagger UI (recomendado: la URL centralizada).
2. Pulsa **Authorize** (arriba a la derecha). Aparece un diálogo con el campo `bearerAuth` (Authorization: Bearer …).
3. Pega un `accessToken` válido (obtenido vía `POST /api/v1/auth/login`).
4. Pulsa **Authorize** y luego **Close**. Ya puedes usar "Try it out" en cualquier endpoint protegido.

> Las rutas de documentación **no requieren JWT** para abrir la UI, pero los endpoints que vayas a probar sí. Si el token expira (15 min), repite el login desde el cliente web o por `curl` y vuelve a pulsar **Authorize**.

### Postman (alternativa)

Si necesitas compartir peticiones o usar *environments* por desarrollador, importa la colección:

- [`docs/gateway.postman_collection.json`](./docs/gateway.postman_collection.json)

Las variables `baseUrl`, `accessToken` y `refreshToken` se actualizan automáticamente al ejecutar `login` y `refresh`. **Úsala solo si Swagger UI no cubre tu caso de uso**; para el día a día, Swagger UI es la opción primaria.

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
        uuid user_id
        uuid vehicle_id
        enum status
        timestamp assigned_at
        timestamp unassigned_at
    }
    ASSIGNMENT_AUDIT_EVENT {
        uuid id PK
        uuid user_id
        uuid vehicle_id
        string action
        uuid actor_user_id
    }
```

> La clave compuesta `user_id + vehicle_id` es la **fuente oficial** de propiedad vehículo-propietario. El `ownerId` que vive en `vehiculos` se conserva sólo por compatibilidad.

### tickets

```mermaid
erDiagram
    TICKETS {
        uuid id PK
        string codigo
        uuid id_espacio
        uuid id_usuario
        uuid id_vehiculo
        string placa_vehiculo
        timestamp fecha_hora_ingreso
        timestamp fecha_hora_salida
        enum estado
        uuid id_empleado
        decimal valor_recaudado
        string tipo_vehiculo
        string tipo_espacio
    }
```

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
- **Registro público**: asigna siempre el rol `CLIENTE`. Para crear `ADMIN` se necesita otro `ADMIN`.
- **Vehículos**: `ownerId` se toma **exclusivamente** del claim `sub` del token. Aunque el cliente envíe `ownerId` en el body, el servicio lo ignora.
- **Asignaciones**: la propiedad activa vive aquí. `vehiculos.ownerId` se mantiene sincronizado por compatibilidad pero la verdad está en `vehicle_assignment`.
- **Auditoría**: cada `create`, `reactivate`, `transfer` o `soft delete` deja un `assignment_audit_event` con snapshot anterior y nuevo.
- **Comunicaciones internas**: `asignaciones` consulta a `usuarios` y `vehiculos`; `tickets` consulta a `vehiculos`, `asignaciones` y `zonas` por la red interna de Docker usando el header `X-Internal-Service-Token`. Esos endpoints no están publicados en Kong.
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

### Colección Postman (opcional)

Si prefieres Postman sobre Swagger UI (por ejemplo para *environments* por desarrollador), importa [`docs/gateway.postman_collection.json`](./docs/gateway.postman_collection.json). Las variables `baseUrl`, `accessToken` y `refreshToken` se actualizan automáticamente al ejecutar `login` y `refresh`. Para el día a día, **Swagger UI es la opción recomendada** (ver [Documentación interactiva](#-documentación-interactiva)).

---

## Datos de demostración

El script `seed-demo` carga un dataset de ejemplo usando las APIs reales. Si ya existen tickets, no duplica datos y te pide usar `--reset`. Con `--reset` borra **únicamente** los volúmenes de este monorepo y empieza desde cero.

```powershell
# Desde PowerShell
.\scripts\seed-demo.ps1

# O directamente en Ubuntu
bash scripts/seed-demo.sh
```

| Recurso | Cantidad |
|---|---|
| Usuarios `CLIENTE` | 8 |
| Usuario `RECAUDADOR` | 1 |
| Administrador | 1 |
| Zonas | 3 |
| Espacios | 12 |
| Vehículos | 16 |
| Asignaciones activas | 16 |
| Tickets | 1 `ACTIVO`, 1 `PAGADO`, 1 `CANCELADO` |
| Roles | `CLIENTE`, `RECAUDADOR`, `ADMIN`, `ROOT` |

Credenciales útiles:

| Rol | Usuario | Contraseña |
|---|---|---|
| `ADMIN` | `admin` | `Admin12345!` |
| `RECAUDADOR` | `rdrecaudador` | `Recaudador12345!` |
| `CLIENTE` demo | ver salida del script, por ejemplo `adalvarez` | `Demo12345!` |

> Usa estas credenciales sólo en desarrollo. El script también imprime placas y espacios útiles para probar tickets.

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
| Cargar datos demo | `.\scripts\seed-demo.ps1` |
| Re-cargar datos demo desde cero | `.\scripts\seed-demo.ps1 --reset` |

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
| Swagger UI no carga o muestra JSON crudo | El servicio no ha terminado de arrancar o su OpenAPI no se generó. | Espera a que `docker compose ps` muestre `healthy`. Comprueba `GET http://localhost:8000/<servicio>/v3/api-docs` directamente. |
| `401` desde Kong con `Unauthorized`, `Bad token` o `invalid signature` | El access token falta, expiro, esta mal pegado o incluye texto extra como `refreshToken`. Kong corta la solicitud antes de que llegue al backend. | Haz login otra vez y pega solo el `accessToken` en Swagger Authorize. No pegues `Bearer`, comillas, JSON completo ni `refreshToken`. |
| `403` desde un backend | El token pasó Kong pero el rol no permite la operación. | Revisa la tabla de permisos. Inicia sesión como `ADMIN` si la ruta lo requiere. |
| `429` | Rate limit de Kong activo. | Espera el tiempo indicado y reintenta. Los límites están en `infrastructure/kong/kong.yml`. |
| Cambié `CORS_ORIGINS` y no aplica | Kong no se ha regenerado. | Ejecuta `.\scripts\bootstrap.ps1` de nuevo y recrea Kong: `docker compose up -d --force-recreate kong`. |
| Cambié claves en `.env` (JWT, admin, Postgres) y no aplica | Los contenedores se levantaron con los valores anteriores. | Re-ejecuta `.\scripts\bootstrap.ps1` (si tocas `JWT_ISSUER`/`CORS_ORIGINS`) y recrea los servicios afectados: `docker compose up -d --force-recreate kong usuarios`. |
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
├── docker-compose.yml           Orquestación: 5 servicios, 5 Postgres, Kong, web
├── .env.example                 Plantilla de variables (copiada a .env por el bootstrap)
├── .gitignore                   Excluye .env, .secrets/, kong.yml, node_modules, etc.
│
├── services/
│   ├── usuarios/                Spring Boot 4.1 · auth + personas + usuarios + roles
│   ├── zonas/                   Spring Boot 4.0 · zonas + espacios
│   ├── vehiculos/               NestJS 11 · vehículos por dueño
│   ├── asignaciones/            NestJS 11 · propiedad + auditoría
│   └── tickets/                 NestJS 11 · emisión, pago y cancelación de tickets
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
