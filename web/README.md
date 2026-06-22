# Cliente web de pruebas

Aplicación estática (HTML + CSS + JS) para probar de forma visual la API detrás de Kong. Sin frameworks, sin dependencias externas, sin backend: una sola pestaña del navegador.

## Para qué sirve

- Probar todos los endpoints públicos y protegidos del monorepo.
- Ver qué cuerpo enviar y qué respuesta esperar antes de pulsar "Enviar".
- Inspeccionar el access token JWT (header, payload, claims, expiración).
- Ver el historial de peticiones de la sesión actual.
- Copiar el `curl` equivalente de cada petición.
- Cambiar entre tema claro y oscuro.

## Requisitos

- Node 18+ (sólo para el servidor estático opcional) o cualquier servidor de archivos estáticos (Python `http.server`, `npx serve`, etc.).
- Kong y los tres backends levantados con `docker compose up --build` desde la raíz del repo.
- El origen del cliente añadido a `CORS_ORIGINS` en `.env` (por ejemplo `http://localhost:9000`).

## Cómo levantarlo

### Opción recomendada: Docker Compose

Desde la raíz del monorepo:

```powershell
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/mesia/Desktop/Universidad/Distribuidas/2P && docker compose up --build -d"
```

Abre <http://localhost:9000>. Compose espera a que Kong esté saludable antes de iniciar la web.

### Opción alternativa A: servidor Node incluido

```powershell
node web/serve.js
```

Abre <http://localhost:9000>. Para usar otro puerto: `node web/serve.js 4200`.

### Opción alternativa B: cualquier servidor estático

```powershell
python -m http.server 8080 -d web
# o
npx --yes serve web
```

### Configurar CORS

Edita `.env` en la raíz del repo y añade el origen del cliente:

```env
CORS_ORIGINS=http://localhost:4200,http://localhost:5173,http://localhost:9000
```

Vuelve a ejecutar el bootstrap y recrea Kong:

```powershell
.\scripts\bootstrap.ps1
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/mesia/Desktop/Universidad/Distribuidas/2P && docker compose up -d --force-recreate kong"
```

## Uso

1. En la barra superior confirma que la **URL base** apunta a Kong (`http://localhost:8000`).
2. Abre la sección **Autenticación** y haz login con el usuario administrador definido en `.env`.
3. El cliente guarda `accessToken` y `refreshToken` en `localStorage`. La barra superior muestra el usuario, los roles y el tiempo restante del token.
4. Navega por las secciones (Usuarios, Personas, Roles, Zonas, Espacios, Vehículos) y pulsa **Enviar** en cada tarjeta.
5. Cada tarjeta muestra:
   - Método HTTP + ruta + permiso requerido.
   - Descripción y panel "¿Qué debería pasar?" con los códigos esperados.
   - Formulario con valores por defecto listos para editar.
   - Respuesta real con status, tiempo, cuerpo y headers.
   - Botones para copiar `curl` y copiar la respuesta.
6. **JWT Inspector** muestra los claims del token actual y permite renovarlo al instante.
7. **Historial** guarda las últimas 50 peticiones de la sesión.

## Notas de seguridad

- El cliente no verifica la firma del JWT; sólo lo decodifica para mostrarlo. La verificación la hace Kong y cada backend.
- Los tokens viven en `localStorage`. Para borrarlos usa **Salir** o limpia el almacenamiento del navegador.
- No se envían credenciales a ningún tercero: todas las peticiones van directamente a la URL base indicada.

## Estructura

```text
web/
  index.html        Layout y plantilla de tarjeta de endpoint
  css/styles.css    Tema claro/oscuro y estilos de la SPA
  js/
    jwt.js          Decodificación y análisis de JWT
    api.js          Cliente HTTP con manejo de sesión y refresh automático
    endpoints.js    Catálogo declarativo de todos los endpoints
    app.js          Orquestador: render de secciones, eventos, historial
  serve.js          Servidor estático Node sin dependencias
  README.md         Este archivo
```

## Personalizar endpoints

Edita `web/js/endpoints.js`. Cada endpoint tiene:

```js
{
  id: "identificador",
  method: "POST",
  path: "/api/v1/...",
  perm: "public" | "USER" | "ADMIN" | "USER/ADMIN",
  desc: "Texto explicativo corto",
  hint: "<ul><li>Qué esperar…</li></ul>",
  fields: [ { name, label, type, value, options?, required?, fromStore? } ],
  build: (values) => ({ body?, path? }),  // construye la petición final
}
```

Recarga la página y la tarjeta aparecerá automáticamente en su sección.
