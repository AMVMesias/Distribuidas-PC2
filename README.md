# Gateway Distribuidas

Monorepo de tres microservicios protegidos por **Kong Gateway**. La API se expone únicamente mediante Kong (`http://localhost:8000`) y el cliente web está en `http://localhost:9000`; los backends, PostgreSQL y la API administrativa de Kong permanecen en redes privadas de Docker.

## Arquitectura

```text
Cliente -> Kong :8000 -> usuarios (Spring Boot) -> PostgreSQL
                       -> zonas (Spring Boot)    -> PostgreSQL
                       -> vehiculos (NestJS)     -> PostgreSQL
```

```text
services/                 Código de los tres servicios
infrastructure/kong/      Configuración declarativa DB-less
scripts/                  Bootstrap para PowerShell y Bash
docs/                     Modelo, ejemplos y colecciones Postman
docker-compose.yml        Orquestación completa
```

La autenticación usa access tokens JWT RS256 de 15 minutos y refresh tokens opacos, rotativos, de 7 días. Los roles disponibles son `USER` y `ADMIN`.

## Requisitos

- Ubuntu en WSL con Docker Engine y Docker Compose Plugin
- OpenSSL en Ubuntu
- PowerShell 7, opcional para ejecutar el bootstrap desde Windows

No es necesario iniciar Docker Desktop. Los comandos siguientes usan expresamente la distribución `Ubuntu` de WSL.

## Inicio rápido

Desde PowerShell, en la raíz del repositorio:

```powershell
.\scripts\bootstrap.ps1
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/mesia/Desktop/Universidad/Distribuidas/2P && docker compose up --build -d"
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/mesia/Desktop/Universidad/Distribuidas/2P && docker compose ps"
```

El bootstrap crea `.env`, el par RSA dentro de `.secrets/` y `infrastructure/kong/kong.yml`. Todos son locales y están ignorados por Git. Revisa las credenciales de administrador en `.env` antes de usar otro entorno.

Para seguir los logs:

```powershell
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/mesia/Desktop/Universidad/Distribuidas/2P && docker compose logs -f --tail=100"
```

## API pública

| Ruta | Permiso |
|---|---|
| `POST /api/v1/auth/register` | Pública; crea `USER` |
| `POST /api/v1/auth/login` | Pública |
| `POST /api/v1/auth/refresh` | Pública; rota el refresh token |
| `POST /api/v1/auth/logout` | Pública; revoca la sesión |
| `GET /api/v1/auth/me` | `USER` o `ADMIN` |
| `/api/v1/usuarios`, `/personas`, `/roles` | Sólo `ADMIN` |
| `GET /api/v1/zonas`, `/espacios` | `USER` o `ADMIN` |
| Escrituras en `/api/v1/zonas`, `/espacios` | Sólo `ADMIN` |
| `/api/v1/vehiculos` | `USER` sobre los propios; `ADMIN` sobre todos |

Ejemplo de inicio de sesión:

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"CAMBIAR_ESTA_CLAVE"}'
```

Para rutas protegidas envía `Authorization: Bearer <accessToken>`. Kong valida firma, emisor y expiración; cada backend vuelve a validar el token y aplica los permisos de negocio.

## Seguridad y comportamiento

- Kong aplica CORS, `X-Request-ID` y límites diferenciados para login, registro, refresh y rutas autenticadas.
- El registro público siempre asigna `USER`.
- Vehículos toma `ownerId` exclusivamente del claim `sub`.
- Reutilizar un refresh token rotado revoca toda su familia.
- Hibernate valida el esquema y Flyway ejecuta las migraciones desde bases vacías.
- Sólo el puerto `8000` está publicado.

## Pruebas locales

```powershell
cd services\usuarios; .\mvnw.cmd test
cd ..\zonas; .\mvnw.cmd test
cd ..\vehiculos; npm test -- --runInBand; npm run build
```

Validación de Compose y estado en WSL:

```powershell
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/mesia/Desktop/Universidad/Distribuidas/2P && docker compose config --quiet && docker compose ps -a"
```

## Datos de demostración

Para borrar únicamente las bases de este monorepo y crear un conjunto completo desde cero:

```powershell
.\scripts\seed-demo.ps1 --reset
```

Se crean 30 usuarios `USER`, 10 zonas, 150 espacios y 90 vehículos, además del administrador y los roles iniciales. La contraseña compartida de los usuarios demo es `Demo12345!`; úsala exclusivamente en desarrollo. Ejecutar el script sin `--reset` sobre datos ya cargados provocará conflictos por identificadores únicos.

## Solución de problemas

- Si un contenedor cae, consulta `docker compose logs <servicio> --tail=200` dentro de Ubuntu WSL.
- Después de cambiar claves o variables de Kong, vuelve a ejecutar el bootstrap y recrea Kong.
- PostgreSQL 18 usa `/var/lib/postgresql` como punto del volumen de usuarios; Compose ya incluye esa ruta.
- Para reiniciar desde bases nuevas usa `docker compose down -v` y luego `up --build -d`. Esto elimina únicamente los volúmenes de este monorepo; los volúmenes anteriores no se reutilizan ni se modifican.
