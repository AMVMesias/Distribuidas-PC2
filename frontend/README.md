# Nexo Park Frontend

Interfaz web del sistema distribuido de parqueadero. Está construida con Next.js 16, React 19, Tailwind CSS 4, GSAP y TypeScript.

## Desarrollo local

1. Levanta los microservicios y Kong desde la raíz del proyecto.
2. Verifica que Kong responda en `http://localhost:8000`.
3. Instala y ejecuta el frontend:

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`. La ruta raíz redirige a `/es`; también está disponible `/en`.

La API usa `http://localhost:8000` de forma predeterminada. Para cambiarla, define:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Experiencias incluidas

- Landing pública, tema claro/oscuro, español e inglés.
- Login, registro de cliente, refresh de sesión y cierre de sesión.
- Dashboard adaptado a los permisos del usuario.
- Zonas y espacios.
- Vehículos.
- Tickets y detalle.
- Operación de entradas, salidas y cobro.
- Usuarios, roles y asignaciones.
- Perfil y cambio de contraseña.
- Zona crítica exclusiva para `ROOT`.

## Roles

- `CLIENTE`: vehículos, asignaciones y tickets propios.
- `RECAUDADOR`: consulta operativa, entradas, salidas y cobros.
- `ADMIN`: configuración, usuarios, roles y operación completa.
- `ROOT`: permisos administrativos y eliminación física.

## Validación

```bash
npm run lint
npm run build
```

El frontend se mantiene local y no incluye configuración de publicación.
