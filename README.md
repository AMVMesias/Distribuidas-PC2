<a id="top"></a>
<div align="center">

<img src="frontend/src/shared/assets/nexo-park-logo.png" alt="Nexo Park Logo" width="250" />

# Nexo Park - Gateway Distribuidas

**Plataforma completa de gestión de parking con aplicación Frontend (Next.js), microservicios protegidos por Kong Gateway y mensajería asíncrona.**

[Características](#características) ·
[Arquitectura](#arquitectura) ·
[Frontend](#aplicación-frontend-nexo-park) ·
[Inicio rápido](#inicio-rápido) ·
[API](#api-pública) ·
[Swagger UI](#documentación-interactiva) ·
[K8s](#despliegue-con-kubernetes-minikube) ·
[Operación](#operación)

</div>

---

## Tabla de contenidos

- [Resumen](#resumen)
- [Características](#características)
- [Arquitectura](#arquitectura)
- [Stack tecnológico](#stack-tecnológico)
- [Aplicación Frontend (Nexo Park)](#aplicación-frontend-nexo-park)
- [Requisitos](#requisitos)
- [Archivos de configuración clave](#archivos-de-configuración-clave)
- [Inicio rápido](#inicio-rápido)
  - [0. Clonar el repositorio](#0-clonar-el-repositorio)
  - [1. Configurar el entorno (.env)](#1-configurar-el-entorno-env)
  - [2A. Bootstrap con scripts (recomendado)](#2a-bootstrap-con-scripts-recomendado)
  - [2B. Bootstrap manual, sin scripts (comandos directos)](#2b-bootstrap-manual-sin-scripts-comandos-directos)
  - [3. Levantar la plataforma](#3-levantar-la-plataforma)
  - [4. Probar la API](#4-probar-la-api)
  - [5. Abrir la app y Swagger UI](#5-abrir-la-app-y-swagger-ui)
  - [6. Logs en vivo](#6-logs-en-vivo)
  - [7. Apagar y limpiar](#7-apagar-y-limpiar)
  - [Resumen de métodos lado a lado](#resumen-de-métodos-lado-a-lado)
- [API pública](#api-pública)
- [Documentación interactiva](#documentación-interactiva)
- [Modelo de datos](#modelo-de-datos)
- [Seguridad](#seguridad)
- [Pruebas locales](#pruebas-locales)
- [Datos de demostración](#datos-de-demostración)
- [Operación](#operación)
- [Despliegue con Kubernetes (Minikube)](#despliegue-con-kubernetes-minikube)
- [Solución de problemas](#solución-de-problemas)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Licencia](#licencia)

---

## Resumen

<div align="center">
  <img src="frontend/src/shared/assets/smart-parking-hero.png" alt="Nexo Park App Interfaz" width="800" style="border-radius: 8px;" />
</div>
<br/>

Plataforma distribuida de gestión de parking con **seis microservicios** independientes (cinco de negocio + `ms-audit`), protegidos por **Kong Gateway** como único punto de entrada. La autenticación se realiza con **JWT RS256** (access tokens de 15 min) y **refresh tokens opacos rotativos** (7 días). Cada servicio usa su propia base de datos PostgreSQL y se comunica con los demás sólo a través de canales internos autenticados. La UI de cliente es una **SPA Next.js 16** con i18n, dark mode y consumo de eventos en tiempo real (SSE).

| Punto de acceso | URL | Visible desde | Notas |
|---|---|---|---|
| **Aplicación Frontend (Nexo Park)** | `http://localhost:3000` | Host / navegador | **Interfaz de usuario principal (Next.js).** |
| **Swagger UI centralizado** | **<http://localhost:8000/asignaciones/swagger-ui>** | Host / navegador | **Forma recomendada de explorar y probar la API.** |
| API Gateway (Kong) | `http://localhost:8000` | Host / navegador | Único punto de entrada de la API. |
| Backends, Postgres, RabbitMQ | — | Red interna Docker | No expuestos al host. |

> La plataforma expone **OpenAPI 3** para los cinco servicios de negocio (más `ms-audit` para auditoría). El servicio `asignaciones` publica un Swagger UI que agrega las specs en una sola URL. Úsalo como punto de partida; Postman queda relegado a casos puntuales (ver [Documentación interactiva](#documentación-interactiva)).

---

## Características

- **Aplicación Frontend Moderna** construida con Next.js 16, React 19 y TailwindCSS v4, organizada en arquitectura **FSD** (`entities` / `features` / `widgets` / `pageviews` / `shared`).
- **Internacionalización (i18n)** con diccionarios `es`/`en` servidos desde el cliente y selector de idioma persistente.
- **Tema claro/oscuro** con detección de preferencia del sistema y persistencia en `localStorage`.
- **Animaciones** con **GSAP** y set de íconos con **lucide-react** para una experiencia pulida.
- **Landing pública** con secciones `Hero`, `How it works`, `Benefits`, `Roles/Sedes` y `Closing`.
- **Portal autenticado** con sidebar por rol: Dashboard, Zonas, Vehículos, Tickets, Operación, Usuarios, Asignaciones, Roles, Perfil y "Zona crítica" (admin).
- **Server-Sent Events (SSE)** consumidos desde el cliente vía hook `useSse` para refrescar el estado de espacios en tiempo real.
- **API Gateway único** con Kong 3.9 en modo *DB-less* y configuración declarativa.
- **Seis microservicios** con tecnologías heterogéneas (Spring Boot + NestJS).
- **Patrón `event-publisher`** en cada servicio NestJS para emitir eventos a RabbitMQ sin acoplarse al broker.
- **Clientes HTTP internos** (`internal-clients`) para llamadas service-to-service autenticadas con `X-Internal-Service-Token`.
- **Patrón `Factory`** en `vehiculos` para instanciar la jerarquía `Auto` / `Moto` / `Camioneta` desde el DTO.
- **Guards reutilizables** (`JwtAuthGuard`, `RolesGuard`, `InternalTokenGuard`) y filtro global de errores (`ApiErrorFilter`) en todos los NestJS.
- **Server-Sent Events (SSE)** emitidos por el servicio `tickets` (`/sse/espacios`) para que el frontend reciba cambios de estado sin polling.
- **Arquitectura orientada a eventos** usando **RabbitMQ** para recolectar eventos de auditoría (`ms-audit`).
- **Despliegue flexible:** orquestación local con Docker Compose o cluster con **Kubernetes (k8s)** usando Minikube y manifiestos Kustomize.
- **Autenticación JWT RS256** con par de claves generado en el bootstrap.
- **Refresh tokens opacos** con rotación y revocación por familia (detección de reuso).
- **RBAC** con roles `CLIENTE`, `RECAUDADOR`, `ADMIN` y `ROOT`. Los servicios validan el token y aplican permisos de negocio.
- **Rate limiting** diferenciado en Kong: login 10/min, registro 5/h, refresh 30/min, autenticados 100/min.
- **CORS, `X-Request-ID` y correlación de peticiones** configurados como plugin global.
- **Auditoría de asignaciones** con snapshot del estado anterior y nuevo en cada cambio, consultable vía API HTTP en `ms-audit`.
- **Migraciones automáticas** con Flyway (Spring) y migraciones TypeORM (NestJS).
- **Soft delete** en usuarios, personas, roles, zonas y asignaciones.
- **Redes Docker aisladas**: cada Postgres y cada backend vive en su propia red *internal*.

---

## Arquitectura

### Vista de despliegue

```mermaid
flowchart LR
    subgraph Host["Host (Windows / WSL Ubuntu)"]
        Browser["Navegador (Nexo Park App)"]
        Swagger["Swagger UI centralizado (:8000)"]
    end

    subgraph FE["Frontend"]
        NextJS["Nexo Park (Next.js) :3000"]
    end

    subgraph GW["Docker / K8s · red gateway"]
        Kong["Kong Gateway · :8000"]
    end

    subgraph BE["Docker / K8s · Microservicios"]
        Usuarios["usuarios (Spring Boot)"]
        Zonas["zonas (Spring Boot)"]
        Vehiculos["vehiculos (NestJS)"]
        Asignaciones["asignaciones (NestJS)"]
        Tickets["tickets (NestJS)"]
        Audit["ms-audit (NestJS)"]
    end
    
    subgraph MSG["Mensajería"]
        RabbitMQ["RabbitMQ"]
    end

    subgraph DB["Docker / K8s · Bases de datos"]
        DbU[("usuarios-db")]
        DbZ[("zonas-db")]
        DbV[("vehiculos-db")]
        DbA[("asignaciones-db")]
        DbT[("tickets-db")]
        DbAu[("audit-db")]
    end

    Browser --> NextJS
    NextJS --> Kong
    Swagger --> Kong
    
    Kong -->|JWT| Usuarios
    Kong -->|JWT| Zonas
    Kong -->|JWT| Vehiculos
    Kong -->|JWT| Asignaciones
    Kong -->|JWT| Tickets
    
    Usuarios -.->|Eventos| RabbitMQ
    Zonas -.->|Eventos| RabbitMQ
    Vehiculos -.->|Eventos| RabbitMQ
    Asignaciones -.->|Eventos| RabbitMQ
    Tickets -.->|Eventos| RabbitMQ
    
    RabbitMQ -.->|Consume| Audit
    
    Usuarios --> DbU
    Zonas --> DbZ
    Vehiculos --> DbV
    Asignaciones --> DbA
    Tickets --> DbT
    Audit --> DbAu
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
| `frontend` | Next.js 16 | 3000 | — | UI Nexo Park: landing pública, portal autenticado (Cliente / Recaudador / Admin), i18n, dark mode, FSD. |
| `usuarios` | Spring Boot 4.1 | 8080 | Postgres 18 | Auth, personas, usuarios, roles. Emite y firma JWT. Publica eventos de auditoría. |
| `zonas` | Spring Boot 4.0 | 8080 | Postgres 16 | Zonas de parking y sus espacios. Publica eventos de auditoría. |
| `vehiculos` | NestJS 11 | 3000 | Postgres 16 | Vehículos por dueño (`ownerId` desde `sub` del JWT). Jerarquía `Auto`/`Moto`/`Camioneta` con `Factory`. Publica eventos. |
| `asignaciones` | NestJS 11 | 3000 | Postgres 16 | Propiedad vehículo-propietario + auditoría con snapshot. Llama a `usuarios` y `vehiculos` por HTTP interno. |
| `tickets` | NestJS 11 | 3000 | Postgres 16 | Emisión, pago y cancelación de tickets. Llama a `vehiculos`, `asignaciones` y `zonas`. Publica estado de espacios por **SSE** (`/sse/espacios`). |
| `ms-audit` | NestJS 11 | 3000 | Postgres 16 | Consumer de RabbitMQ con **API HTTP propia** para consultar el historial de eventos. |

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16.2, React 19, TailwindCSS v4, GSAP, lucide-react |
| API Gateway | Kong 3.9 (DB-less, CORS, correlation-id, JWT, rate-limiting) |
| Auth | Spring Security + JJWT (RS256) + refresh tokens opacos con hash |
| Backend Java | Java 25, Spring Boot 4.x, Spring Data JPA, Hibernate, Flyway |
| Backend Node | Node 22, NestJS 11, TypeORM, Passport JWT, class-validator |
| Persistencia | PostgreSQL 18 (usuarios) y PostgreSQL 16 (por servicio) |
| Mensajería | RabbitMQ (eventos de auditoría + bus interno) + SSE para espacios |
| Orquestación | Docker Compose (local), Kubernetes (K8s con Minikube) |
| API docs | springdoc-openapi (Spring) y `@nestjs/swagger` (NestJS) |
| Frontend UX | i18n (es/en), tema claro/oscuro, animaciones GSAP, FSD |
| Observabilidad | Health checks por servicio + healthcheck de Kong |

---

## Aplicación Frontend (Nexo Park)

<div align="center">
  <img src="docs/screenshots/landing.png" alt="Nexo Park - Landing pública (modo oscuro)" width="900" style="border-radius: 8px;" />
  <br/><em>Landing pública en modo oscuro con hero animado, selector de idioma y tema.</em>
</div>
<br/>

La UI de Nexo Park es una **SPA Next.js 16** con App Router, React 19, TailwindCSS v4 y animaciones GSAP. Está organizada como **Feature-Sliced Design (FSD)**:

```text
frontend/src/
├── app/                    # Rutas Next.js (App Router)
│   ├── [locale]/           # Segmento dinámico de idioma (es|en)
│   │   ├── page.tsx        # Landing pública
│   │   ├── login/          # Login
│   │   ├── registro/       # Registro
│   │   └── portal/         # Layout autenticado
│   │       ├── page.tsx    # Dashboard
│   │       └── [section]/  # Zonas, Vehículos, Tickets, Usuarios, etc.
│   ├── layout.tsx
│   ├── providers.tsx       # Theme + i18n + Auth contexts
│   └── globals.css
├── entities/               # Modelos de dominio (parking, user)
├── features/               # Capacidades reutilizables (auth, vehicles, zones, …)
├── widgets/                # Composiciones (PortalShell, LandingHeader, AuthShell)
├── pageviews/              # Vistas por sección (landing, dashboard, tickets…)
└── shared/                 # API client, i18n, theme, hooks, componentes
    ├── api/client.ts       # Fetch wrapper con bearer + refresh
    ├── i18n/               # Diccionarios es/en + I18nContext
    ├── theme/              # ThemeContext (light/dark, persiste en localStorage)
    └── hooks/useSse.ts     # Cliente SSE tipado
```

### Capacidades

| Capacidad | Dónde vive | Notas |
|---|---|---|
| **i18n (es / en)** | `shared/i18n/` | Diccionarios tipados, sin librerías externas; cambia con un toggle en la cabecera. |
| **Tema claro/oscuro** | `shared/theme/` | Detecta `prefers-color-scheme`, persiste en `localStorage` bajo `nexo-theme`. |
| **AuthContext** | `features/auth/model/` | Maneja access + refresh tokens, rehidrata desde `localStorage` y expone `useAuth`. |
| **SSE** | `shared/hooks/useSse.ts` | Hook tipado con `EventSource` para consumir `http://localhost:8000/tickets/sse/espacios`. |
| **Animaciones** | `features/landing/model/useLandingMotion.ts` + GSAP | Transiciones y scroll-trigger en la landing. |
| **Formularios** | `features/*/components/*Form.tsx` | Validación cliente, manejo de feedback (`ActionMessage`, `Feedback`). |
| **Shell autenticado** | `widgets/PortalShell/` | Sidebar con permisos por rol y `PortalHeader` con selector de tema/idioma. |

### Roles visibles en la UI

| Rol | Secciones del portal |
|---|---|
| `CLIENTE` | Dashboard, Mis vehículos, Mis tickets, Mi perfil. |
| `RECAUDADOR` | + Operación (entrada/salida), Zonas (lectura). |
| `ADMIN` | + Usuarios, Asignaciones, Zonas (CRUD), Roles, Zona crítica. |
| `ROOT` | Todo lo anterior. |

### Ejecución local de solo Frontend

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

La landing queda en `http://localhost:3000/` y el portal (requiere login) en `http://localhost:3000/portal`.

---

## Requisitos

El proyecto se ejecuta **completamente en Docker**, así que cualquier entorno con Docker sirve. Elegí el que prefieras:

| Entorno | Necesitás | Cómo corre Docker |
|---|---|---|
| **Windows + WSL 2 (Ubuntu)** *(recomendado)* | WSL 2 con la distro Ubuntu, Docker Engine + Compose Plugin dentro de Ubuntu, OpenSSL. | Docker corre dentro de Linux. Scripts `.sh`/`.ps1`. |
| **Windows + Docker Desktop** | Docker Desktop con WSL 2 backend activado, Git Bash o PowerShell, OpenSSL (incluido en Git Bash o `choco install openssl`). | Docker Desktop expone el daemon. Comandos `docker compose` directos. |
| **macOS** | Docker Desktop, OpenSSL (`brew install openssl`). | Igual que Windows con Docker Desktop. |
| **Linux nativo** | Docker Engine, Docker Compose Plugin, OpenSSL. | Docker corre nativo. Comandos `docker compose` directos. |

En todos los casos también necesitás:

- **Navegador moderno** para usar la app y Swagger UI.
- (Opcional) **PowerShell 7** si querés usar los scripts `.ps1` desde Windows.
- (Opcional) **kubectl + Minikube** si vas a desplegar en Kubernetes (ver [Despliegue con Kubernetes](#despliegue-con-kubernetes-minikube)).

### Verificar el entorno

PowerShell + WSL:

```powershell
wsl -d Ubuntu -- bash -lc "docker --version && docker compose version && openssl version"
```

Linux / macOS / Git Bash (Docker Desktop):

```bash
docker --version && docker compose version && openssl version
```

> **TL;DR**: si ya tenés Docker y OpenSSL, basta con clonar, hacer bootstrap y `docker compose up --build -d`. El resto de esta sección lo explica en detalle.

---

## Archivos de configuración clave

Antes de arrancar, conviene conocer estos archivos. **Ninguno se versiona en Git** (excepto `.env.example` y la plantilla `kong.yml.template`); se generan en el bootstrap.

| Archivo | Generado por (con scripts) | Equivalente manual | Propósito |
|---|---|---|---|
| `.env` | `bootstrap.ps1` / `bootstrap.sh` copian `.env.example` | `cp .env.example .env` | Variables de entorno: credenciales de Postgres, JWT, admin inicial, CORS. |
| `.secrets/jwt-private.pem` | `openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out .secrets/jwt-private.pem` | igual | Clave privada RSA usada por `usuarios` para firmar los access tokens. |
| `.secrets/jwt-public.pem` | `openssl rsa -pubout -in .secrets/jwt-private.pem -out .secrets/jwt-public.pem` | igual | Clave pública RSA usada por Kong (vía `kong.yml`) y por los 4 backends para validar tokens. |
| `infrastructure/kong/kong.yml` | Render de `kong.yml.template` sustituyendo `__JWT_ISSUER__`, `__CORS_ORIGINS__` y `__JWT_PUBLIC_KEY__` | `sed` + `awk` (ver [Método B · Sin scripts](#2b-bootstrap-manual-sin-scripts-comandos-directos)) | Configuración declarativa de Kong: rutas, plugins, CORS, claves, etc. |

> Si clonas en otro equipo, basta con ejecutar `bash scripts/bootstrap.sh` (o `.\scripts\bootstrap.ps1` desde PowerShell) para regenerar todos. Si querés empezar desde cero, agregá `-Force` o reejecutá los comandos manuales equivalentes.

---

## Inicio rápido

Esta sección cubre el ciclo completo: clonar → configurar → arrancar → probar. Hay **dos caminos**:

- **Método A · Con scripts** *(recomendado)*: usa `scripts/bootstrap.ps1` y `scripts/bootstrap.sh`. Funciona en Windows + WSL, Docker Desktop, macOS y Linux.
- **Método B · Sin scripts** (comandos directos): para quien prefiera ver exactamente qué se ejecuta, o si los scripts fallan en su entorno. Funciona igual en cualquier Docker host.

> **TL;DR** Si ya tenés Docker y OpenSSL, basta con clonar → correr el bootstrap → `docker compose up --build -d`. El resto de la sección detalla cada método.

### 0. Clonar el repositorio

```bash
git clone <url-del-repo>
cd Distribuidas-PC2     # (o como se llame la carpeta)
```

### 1. Configurar el entorno (`.env`)

El repositorio incluye una plantilla `.env.example` con valores por defecto funcionales. **Copiá a `.env` y revisá las credenciales antes de arrancar:**

```ini
# PostgreSQL (uno por servicio)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
USUARIOS_DB=usuarios
ZONAS_DB=zonas
VEHICULOS_DB=gestion_vehiculos
ASIGNACIONES_DB=asignaciones
TICKETS_DB=tickets
AUDIT_DB=auditoria

# RabbitMQ
RABBITMQ_USER=audit
RABBITMQ_PASSWORD=audit
RABBITMQ_MANAGEMENT_PORT=15672

# JWT
JWT_ISSUER=gateway-distribuidas
JWT_AUDIENCE=parking-api
JWT_ACCESS_MINUTES=15
JWT_REFRESH_DAYS=7

# Token interno service-to-service dentro de Docker
INTERNAL_SERVICE_TOKEN=change-me-internal-token

# Tarifas por hora y factores de espacio para tickets
TICKET_RATE_MOTO=0.50
TICKET_RATE_AUTO=1.00
TICKET_RATE_CAMIONETA=1.25
TICKET_RATE_BUS=2.00
TICKET_SPACE_FACTOR_MOTO=1.00
TICKET_SPACE_FACTOR_AUTO=1.00
TICKET_SPACE_FACTOR_BUS=1.50

# Administrador inicial (se crea en el primer arranque de `usuarios`)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin12345!
ADMIN_DNI=0000000000
ADMIN_FIRST_NAME=Administrador
ADMIN_LAST_NAME=Sistema
ADMIN_EMAIL=admin@example.com

# Orígenes CORS permitidos (separados por coma). Incluye la app Next.js.
CORS_ORIGINS=http://localhost:3000,http://localhost:4200,http://localhost:5173
```

> ⚠️ Cambiá `POSTGRES_PASSWORD`, `ADMIN_PASSWORD` e `INTERNAL_SERVICE_TOKEN` si vas a exponer la plataforma fuera de `localhost`.

---

### 2A. Bootstrap con scripts (recomendado)

El bootstrap prepara tres cosas:

1. Copia `.env.example` a `.env` si no existe.
2. Genera el par RSA (`jwt-private.pem` / `jwt-public.pem`) en `.secrets/`.
3. Renderiza `infrastructure/kong/kong.yml` a partir de `kong.yml.template`, insertando la clave pública, el emisor y los orígenes CORS.

Es **idempotente**: si ya existen los archivos no los regenera (salvo que se lo pidas).

**Windows + WSL (PowerShell 7):**

```powershell
.\scripts\bootstrap.ps1
# para forzar regeneración completa del par RSA y Kong:
.\scripts\bootstrap.ps1 -Force
```

**Windows + WSL (bash directo en Ubuntu):**

```bash
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/<usuario>/<ruta>/Distribuidas-PC2 && bash scripts/bootstrap.sh"
```

**Docker Desktop (Windows / macOS) o Linux nativo (Git Bash / bash):**

```bash
bash scripts/bootstrap.sh
# o equivalentemente
chmod +x scripts/bootstrap.sh && ./scripts/bootstrap.sh
```

---

### 2B. Bootstrap manual, sin scripts (comandos directos)

Si preferís ver cada paso o los scripts no funcionan en tu entorno, esto es exactamente lo que hace `bootstrap.sh`:

```bash
# 1) Copiar plantilla de variables
cp .env.example .env

# 2) Crear carpeta de secretos
mkdir -p .secrets

# 3) Generar par RSA de 2048 bits
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out .secrets/jwt-private.pem
openssl rsa -pubout -in .secrets/jwt-private.pem -out .secrets/jwt-public.pem
chmod 600 .secrets/jwt-private.pem

# 4) Renderizar kong.yml a partir de la plantilla
JWT_ISSUER=$(grep '^JWT_ISSUER=' .env | cut -d= -f2-)
CORS_ORIGINS=$(grep '^CORS_ORIGINS=' .env | cut -d= -f2-)

# 4a) Construir array JSON de orígenes CORS
CORS_JSON='['
IFS=','
for origin in $CORS_ORIGINS; do
  [ "$CORS_JSON" = '[' ] || CORS_JSON="$CORS_JSON,"
  CORS_JSON="$CORS_JSON\"$origin\""
done
IFS=$OLD_IFS
CORS_JSON="$CORS_JSON]"

# 4b) Aplicar sustituciones a la plantilla
sed "s|__JWT_ISSUER__|$JWT_ISSUER|g; s|__CORS_ORIGINS__|$CORS_JSON|g" \
  infrastructure/kong/kong.yml.template > infrastructure/kong/kong.yml.tmp

# 4c) Insertar la clave pública RSA en el placeholder __JWT_PUBLIC_KEY__
awk -v pubfile=".secrets/jwt-public.pem" '
  /__JWT_PUBLIC_KEY__/ {
    while ((getline line < pubfile) > 0) { sub(/\r$/, "", line); print "          " line }
    close(pubfile)
    next
  }
  { print }
' infrastructure/kong/kong.yml.tmp > infrastructure/kong/kong.yml
rm infrastructure/kong/kong.yml.tmp
```

> Si usás **PowerShell nativo** (sin WSL ni Git Bash), el equivalente está en `scripts/bootstrap.ps1` — adaptalo a tu shell si lo necesitás.

---

### 3. Levantar la plataforma

**Desde Windows + WSL (PowerShell):**

```powershell
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/<usuario>/<ruta>/Distribuidas-PC2 && docker compose up --build -d"
```

**Desde WSL, Docker Desktop, Linux o macOS (bash):**

```bash
docker compose up --build -d
```

Esperá a que **todos los healthchecks** pasen:

```bash
docker compose ps
```

El estado correcto es `running (healthy)` para `usuarios`, `zonas`, `vehiculos`, `asignaciones`, `tickets` y `kong`. Si algún servicio queda en `(health: starting)` o `(unhealthy)`, revisá los logs de ese servicio.

Compilar sólo un servicio tras un cambio:

```bash
docker compose up -d --build usuarios   # o zonas, vehiculos, asignaciones, tickets, kong
```

### 4. Probar la API

Login (devuelve `accessToken` JWT RS256 + `refreshToken` opaco):

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"Admin12345!"}'
```

Llamada protegida:

```bash
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

### 5. Abrir la app y Swagger UI

| Herramienta | URL |
|---|---|
| **Aplicación Frontend (Nexo Park)** | **<http://localhost:3000>** |
| **Swagger UI centralizado** (5 servicios) | **<http://localhost:8000/asignaciones/swagger-ui>** |
| Kong Gateway (API) | <http://localhost:8000> |
| RabbitMQ Management UI | <http://localhost:15672> *(credenciales en `.env`)* |

En el **Swagger UI centralizado** seleccioná la spec del servicio en el desplegable superior derecho. Pulsá **Authorize** y pegá el `accessToken` del paso 4 para probar las rutas protegidas.

### 6. Logs en vivo

```bash
docker compose logs -f --tail=100                  # todos
docker compose logs -f kong --tail=200             # uno en particular
docker compose logs -f usuarios vehiculos tickets  # varios a la vez
```

### 7. Apagar y limpiar

```bash
docker compose down            # detiene los contenedores, conserva volúmenes
docker compose down -v         # además borra los volúmenes (datos de Postgres y RabbitMQ)
docker compose down -v --rmi local   # limpieza total: borra también imágenes locales
```

> `down -v` borra los datos. Usalo sólo cuando quieras empezar desde cero.

---

### Resumen de métodos lado a lado

| Paso | Con scripts | Sin scripts |
|---|---|---|
| 1. Variables | *(lo hace el script)* | `cp .env.example .env` |
| 2. Claves RSA | *(lo hace el script)* | `openssl genpkey` + `openssl rsa -pubout` |
| 3. Render Kong | *(lo hace el script)* | `sed` + `awk` sobre la plantilla |
| 4. Levantar | `docker compose up --build -d` | `docker compose up --build -d` |
| 5. Verificar | `docker compose ps` | `docker compose ps` |
| 6. Probar | `curl http://localhost:8000/...` | `curl http://localhost:8000/...` |

Ambos métodos producen exactamente el mismo estado. Elegí el que te resulte más cómodo.

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

### Tickets — eventos en tiempo real (SSE)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| `GET` | `/tickets/sse/espacios` | Público (en red interna) | Stream SSE con cambios de estado de espacios. Incluye heartbeat cada 15 s. |

El frontend se conecta a este endpoint con el hook `useSse('/tickets/sse/espacios')` para refrescar la UI de Operación sin polling.

> El endpoint SSE **no requiere JWT** porque se consume desde el navegador del cliente autenticado; Kong lo expone tal cual bajo el prefijo `/tickets`. Si lo exponés fuera de `localhost`, filtrá por IP o protégelo con un plugin de Kong.

### Auditoría (ms-audit)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| `GET` | `/audit/eventos` | `ADMIN`, `ROOT` | Lista eventos de auditoría persistidos (origen, tipo, payload, timestamp). |
| `GET` | `/audit/eventos/{id}` | `ADMIN`, `ROOT` | Detalle de un evento específico. |

> Los eventos los publica cada servicio a RabbitMQ (`audit_exchange` / `audit_event`) y `ms-audit` los persiste en `audit-db`. La API HTTP es sólo para consulta.

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

> Las rutas de documentación **no requieren JWT** para abrir la UI, pero los endpoints que vayas a probar sí. Si el token expira (15 min), repite el login por `curl` o Swagger y vuelve a pulsar **Authorize**.

### Postman (alternativa)

Si necesitas compartir peticiones o usar *environments* por desarrollador, importa la colección:

| Colección | Archivo | Cuándo usarla |
|---|---|---|
| **Gateway consolidado** (recomendada) | [`docs/gateway.postman_collection.json`](./docs/gateway.postman_collection.json) | Cubre auth, zonas, vehículos, asignaciones y tickets bajo una sola `baseUrl` (Kong). |
| **Por servicios** | [`docs/parking-por-servicios.postman_collection.json`](./docs/parking-por-servicios.postman_collection.json) | Cada microservicio con su `baseUrl` propio (para pruebas internas). |
| **Mínima** | [`docs/parking-postman-minimal.postman_collection.json`](./docs/parking-postman-minimal.postman_collection.json) | Sólo login + 2-3 endpoints clave, ideal para smoke tests rápidos. |
| **Esquema / variables** | [`docs/parking-por-servicios.json`](./docs/parking-por-servicios.json) | Export de Postman en formato `v2.1` para generar clientes (ej. `openapi-generator`). |
| **Referencia textual** | [`docs/endpoints.md`](./docs/endpoints.md) | Listado manual de endpoints con descripciones. |

Las variables `baseUrl`, `accessToken` y `refreshToken` se actualizan automáticamente al ejecutar `login` y `refresh`. **Úsalas solo si Swagger UI no cubre tu caso de uso**; para el día a día, Swagger UI es la opción primaria.

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

- **CORS** se configura en Kong con los orígenes declarados en `CORS_ORIGINS`.
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
- **Aislamiento de red**: cada Postgres y cada red de backend es `internal: true`. El único puerto publicado al host es `8000` (Kong).

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

```bash
# Desde WSL, Docker Desktop, Linux o macOS
docker compose config --quiet && docker compose ps -a

# O desde PowerShell (Windows + WSL)
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/<usuario>/<ruta>/Distribuidas-PC2 && docker compose config --quiet && docker compose ps -a"
```

### Colección Postman (opcional)

Si prefieres Postman sobre Swagger UI (por ejemplo para *environments* por desarrollador), importa [`docs/gateway.postman_collection.json`](./docs/gateway.postman_collection.json). Las variables `baseUrl`, `accessToken` y `refreshToken` se actualizan automáticamente al ejecutar `login` y `refresh`. Para el día a día, **Swagger UI es la opción recomendada** (ver [Documentación interactiva](#documentación-interactiva)).

---

## Datos de demostración

El script `seed-demo` carga un dataset de ejemplo usando las APIs reales. Si ya existen tickets, no duplica datos y te pide usar `--reset`. Con `--reset` borra **únicamente** los volúmenes de este monorepo y empieza desde cero.

```bash
# Cualquier Docker host (Docker Desktop, Linux, macOS, o WSL bash)
bash scripts/seed-demo.sh
# Re-cargar desde cero (borra volúmenes de este monorepo)
bash scripts/seed-demo.sh --reset
```

```powershell
# Equivalente desde PowerShell en Windows
.\scripts\seed-demo.ps1
.\scripts\seed-demo.ps1 --reset
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

Los siguientes comandos funcionan en cualquier entorno con Docker. En Windows + WSL reemplazá `docker compose` por `wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/<usuario>/<ruta>/Distribuidas-PC2 && docker compose ..."`.

| Tarea | Comando |
|---|---|
| Ver estado | `docker compose ps` |
| Logs en vivo (todos) | `docker compose logs -f --tail=100` |
| Logs de un servicio | `docker compose logs -f <servicio>` *(ej. `kong`, `usuarios`, `vehiculos`)* |
| Reiniciar un servicio | `docker compose restart <servicio>` |
| Reconstruir y relanzar | `docker compose up -d --build <servicio>` |
| Apagar todo (conserva datos) | `docker compose down` |
| Apagar y borrar volúmenes | `docker compose down -v` |
| Limpieza total (volúmenes + imágenes) | `docker compose down -v --rmi local` |
| Regenerar claves + Kong | `bash scripts/bootstrap.sh` *(o `.\scripts\bootstrap.ps1 -Force` en PowerShell)* |
| Cargar datos demo | `bash scripts/seed-demo.sh` *(o `.\scripts\seed-demo.ps1` en PowerShell)* |
| Re-cargar datos demo desde cero | `bash scripts/seed-demo.sh --reset` *(o `.\scripts\seed-demo.ps1 --reset`)* |

### Inspección rápida

```bash
# Health de Kong (vía API pública)
curl -fsS http://localhost:8000/usuarios/actuator/health

# Health de un backend (sólo dentro de la red Docker)
docker exec kong wget -qO- http://usuarios:8080/actuator/health

# Estado de RabbitMQ (consumidores, colas, exchanges)
# UI: http://localhost:15672 (credenciales en .env)
docker exec rabbitmq rabbitmqctl list_queues name messages consumers

# Conectarse a Postgres de un servicio
docker exec -it usuarios-db psql -U postgres -d usuarios
docker exec -it tickets-db   psql -U postgres -d tickets
```

---

## Despliegue con Kubernetes (Minikube)

Los manifiestos de `k8s/` están escritos con **Kustomize** y crean todos los recursos bajo el namespace `nexo-park`. Los PVCs de Postgres y RabbitMQ persisten entre `apply`, por lo que **no se pierden datos** al redesplegar.

### Requisitos

- Docker Engine, `kubectl` y **Minikube** con driver Docker.
- Haber ejecutado `.\scripts\bootstrap.ps1` (genera `.env` y el par RSA en `.secrets/`).
- `minikube` corriendo: `minikube start --driver=docker`.
- Addon de ingress habilitado: `minikube addons enable ingress`.

### Despliegue completo (WSL Ubuntu)

```bash
cd /mnt/c/Users/<usuario>/<ruta>/Distribuidas-PC2
minikube start --driver=docker
minikube addons enable ingress
bash scripts/k8s-build.sh        # construye imágenes en el daemon de Minikube
bash scripts/k8s-validate.sh     # valida manifiestos y conectividad
bash scripts/k8s-deploy.sh       # aplica kustomization
```

En otra terminal, dejá el túnel de Minikube activo:

```bash
minikube tunnel
```

Y agregá esta línea a tu archivo de hosts:

```text
127.0.0.1 nexo.local
```

> Los scripts detectan automáticamente el contexto `minikube` y conectan Docker al daemon interno para evitar subir imágenes a un registry externo.

### Scripts disponibles en `scripts/`

| Script | Función |
|---|---|
| `k8s-build.sh` | Construye las imágenes de los 6 servicios + frontend en el daemon de Minikube. |
| `k8s-validate.sh` | Verifica que los manifiestos, secrets e imágenes estén listos antes de aplicar. |
| `k8s-deploy.sh` | Aplica `k8s/kustomization.yaml` y espera a que los pods queden `Ready`. |
| `k8s-status.sh` | Muestra `kubectl get pods,svc,ingress,pvc` resumido del namespace `nexo-park`. |
| `k8s-reset-dev.sh` | **Borra el namespace `nexo-park` y sus PVCs** (úsalo solo para empezar de cero). |

### Manifiestos (`k8s/`)

```text
k8s/
├── 1-namespace.yaml     # Namespace dedicado
├── 2-config.yaml        # ConfigMap con variables de entorno
├── 3-postgres.yaml      # Deployments + Services + PVCs (usuarios, zonas, …)
├── 4-rabbitmq.yaml      # RabbitMQ + PVC
├── 5-usuarios.yaml      # Deployment usuarios
├── 6-zonas.yaml         # Deployment zonas
├── 7-vehiculos.yaml     # Deployment vehiculos
├── 8-asignaciones.yaml  # Deployment asignaciones
├── 9-tickets.yaml       # Deployment tickets
├── 10-audit.yaml        # Deployment ms-audit
├── 11-kong.yaml         # Deployment + Service Kong
├── 12-frontend.yaml     # Deployment + Service Next.js
├── 13-ingress.yaml      # Ingress Nginx: nexo.local → kong / frontend
└── kustomization.yaml
```

### Acceso una vez desplegado

| Recurso | URL |
|---|---|
| Frontend (Next.js) | <http://nexo.local> |
| Kong Gateway (API) | <http://nexo.local:8000> |
| Swagger centralizado | <http://nexo.local:8000/asignaciones/swagger-ui> |

> La raíz `/` y todos los prefijos `/usuarios`, `/zonas`, `/vehiculos`, `/asignaciones`, `/tickets` se enrutan al ingress Nginx, que reenvía a Kong o al frontend según corresponda.

### Cargar datos demo en K8s

```bash
bash scripts/seed-demo.sh
kubectl logs -n nexo-park job/seed-demo -f   # si lo ejecutás como Job
```

### Reset completo (datos de desarrollo)

```bash
bash scripts/k8s-reset-dev.sh --yes
bash scripts/k8s-deploy.sh
```

> Esto borra el namespace `nexo-park` y todos sus PVCs. **No afecta otros namespaces ni otros clústeres.**

---

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Connection refused` a `localhost:8000` | Kong no está arriba o `docker compose` falló. | `docker compose ps` y `docker compose logs kong`. |
| Swagger UI no carga o muestra JSON crudo | El servicio no ha terminado de arrancar o su OpenAPI no se generó. | Espera a que `docker compose ps` muestre `healthy`. Comprueba `GET http://localhost:8000/<servicio>/v3/api-docs` directamente. |
| `401` desde Kong con `Unauthorized`, `Bad token` o `invalid signature` | El access token falta, expiró, está mal pegado o incluye texto extra como `refreshToken`. Kong corta la solicitud antes de que llegue al backend. | Hacé login otra vez y pegá solo el `accessToken` en Swagger Authorize. No pegues `Bearer`, comillas, JSON completo ni `refreshToken`. |
| `403` desde un backend | El token pasó Kong pero el rol no permite la operación. | Revisá la tabla de permisos. Iniciá sesión como `ADMIN` si la ruta lo requiere. |
| `429` | Rate limit de Kong activo. | Esperá el tiempo indicado y reintentá. Los límites están en `infrastructure/kong/kong.yml`. |
| Cambié `CORS_ORIGINS` y no aplica | Kong no se ha regenerado. | Reejecutá el bootstrap: `bash scripts/bootstrap.sh` (o `.\scripts\bootstrap.ps1 -Force` en PowerShell) y recreá Kong: `docker compose up -d --force-recreate kong`. |
| Cambié claves en `.env` (JWT, admin, Postgres) y no aplica | Los contenedores se levantaron con los valores anteriores. | Reejecutá el bootstrap (si tocás `JWT_ISSUER`/`CORS_ORIGINS`) y recreá los servicios afectados: `docker compose up -d --force-recreate kong usuarios`. |
| Postgres de `usuarios` no arranca | El volumen se montó sobre `/var/lib/postgresql` en vez de `/var/lib/postgresql/data` (es lo correcto para Postgres 18). | Compose ya apunta a la ruta correcta. Si lo modificás a mano, asegurate de respetar la convención de la imagen. |
| Quiero empezar desde cero | Volúmenes con datos viejos. | `docker compose down -v && docker compose up --build -d`. **Esto elimina sólo los volúmenes de este monorepo**. |
| `docker compose` no se reconoce | Falta el plugin de Docker Compose. | **Linux**: `sudo apt install docker-compose-plugin`. **macOS/Windows con Docker Desktop**: actualizá Docker Desktop a la última versión. |
| `Cannot connect to the Docker daemon` | Docker no está corriendo. | **WSL**: `sudo service docker start`. **Docker Desktop**: abrí la app. **Linux**: `sudo systemctl start docker`. |
| `openssl: command not found` en Windows | No tenés OpenSSL. | Instalalo con `choco install openssl` o usá Git Bash (lo incluye). Alternativa: corré el bootstrap desde WSL o Git Bash. |

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
├── frontend/                    App principal Next.js 16 (UI Nexo Park, FSD, i18n, dark mode)
├── k8s/                         Manifiestos de Kubernetes (Kustomize) + README
├── docker-compose.yml           Orquestación: 6 servicios, 6 Postgres, RabbitMQ, Kong
├── .env.example                 Plantilla de variables (copiada a .env por el bootstrap)
├── COMANDOS.md                  Referencia rápida de comandos WSL
│
├── services/
│   ├── usuarios/                Spring Boot 4.1 · auth + personas + usuarios + roles
│   ├── zonas/                   Spring Boot 4.0 · zonas + espacios
│   ├── vehiculos/               NestJS 11 · vehículos (jerarquía Auto/Moto/Camioneta + Factory)
│   ├── asignaciones/            NestJS 11 · propiedad vehículo-propietario + auditoría
│   ├── tickets/                 NestJS 11 · emisión/pago/cancelación de tickets + SSE
│   └── ms-audit/                NestJS 11 · consumer RabbitMQ + API HTTP de consulta
│
├── infrastructure/
│   └── kong/                    kong.yml.template + kong.yml renderizado (ignorado por Git)
├── informe-pruebas/             Informe técnico LaTeX (`main.tex`) + PDF compilado
├── scripts/                     Automatización (bootstrap, seed, k8s)
│   ├── bootstrap.ps1 / .sh      Genera .env, claves RSA y kong.yml
│   ├── seed-demo.ps1 / .sh      Carga datos de demostración
│   └── k8s-*.sh                 Build, deploy, validate, status, reset-dev
├── docs/                        Colecciones Postman, endpoints.md, JSON de specs
└── .secrets/                    Par RSA generado (ignorado por Git)
```

---

<div align="center">

**[⬆ Volver al inicio](#top)**

</div>

---

## Licencia

Este proyecto está bajo la **Licencia MIT**. Consultá el archivo [`LICENSE`](./LICENSE) para el texto completo.

```
MIT License — Copyright (c) 2026 Mesias Orlando Mariscal Oña
```
