# Uso de la API

Toda petición debe entrar por `http://localhost:8000`. Los servicios no publican puertos propios.

## Obtener una sesión

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "la-clave-configurada-en-env"
}
```

La respuesta incluye `accessToken` y `refreshToken`. Para recursos protegidos:

```http
GET /api/v1/auth/me
Authorization: Bearer <accessToken>
```

El access token dura 15 minutos. `POST /api/v1/auth/refresh` recibe `{"refreshToken":"..."}` y devuelve una pareja nueva; el token anterior deja de ser válido.

Consulta la tabla completa de rutas y permisos en el [README](../README.md).

