# Guia de uso de la API de Usuarios y Roles

Esta guia explica como levantar el proyecto, probar los endpoints en orden y revisar la base de datos PostgreSQL en Docker.

## 1. Levantar la base de datos

Desde la raiz del proyecto:

```powershell
cd C:\Users\mesia\Desktop\Universidad\Distribuidas\2P\Reservas\distribui-role-asignment
docker compose up -d
docker compose ps
```

La base queda disponible con estos datos:

```text
host: localhost
port: 5433
database: usuarios
user: admin
password: admin
connection string: postgresql://admin:admin@localhost:5433/usuarios
jdbc: jdbc:postgresql://localhost:5433/usuarios
```

Ver logs de PostgreSQL:

```powershell
docker compose logs -f usuarios-postgres
```

## 2. Levantar la aplicacion

En otra terminal:

```powershell
cd C:\Users\mesia\Desktop\Universidad\Distribuidas\2P\Reservas\distribui-role-asignment\usuarios
.\mvnw.cmd spring-boot:run
```

La API queda en:

```text
http://localhost:8080
```

Probar que responde:

```powershell
curl http://localhost:8080/api/roles
```

## 3. Orden recomendado para probar

Usa este orden para evitar errores por IDs faltantes:

1. Crear roles.
2. Crear persona independiente.
3. Crear usuarios.
4. Copiar IDs de las respuestas.
5. Asignar roles a usuarios.
6. Listar y revisar.
7. Desactivar asignaciones, usuarios, personas o roles.

Los endpoints usan soft delete: `DELETE` no borra fisicamente, cambia `active=false`.

## 4. Roles

### Crear rol

```powershell
curl -X POST http://localhost:8080/api/roles `
  -H "Content-Type: application/json" `
  -d '{ "name": "ADMIN", "description": "Administrador del sistema" }'
```

Respuesta esperada: `201 Created`.

Guarda el campo:

```json
"id": "UUID_DEL_ROL"
```

### Listar roles

```powershell
curl http://localhost:8080/api/roles
```

### Buscar rol por ID

```powershell
curl http://localhost:8080/api/roles/UUID_DEL_ROL
```

### Actualizar rol

```powershell
curl -X PUT http://localhost:8080/api/roles/UUID_DEL_ROL `
  -H "Content-Type: application/json" `
  -d '{ "name": "ADMIN", "description": "Administrador general del sistema" }'
```

### Desactivar rol

Al desactivar un rol tambien se desactivan sus asignaciones activas en `user_role`.

```powershell
curl -X DELETE http://localhost:8080/api/roles/UUID_DEL_ROL
```

Respuesta esperada: `204 No Content`.

## 5. Personas

### Crear persona independiente

```powershell
curl -X POST http://localhost:8080/api/personas `
  -H "Content-Type: application/json" `
  -d '{
    "dni": "1711111111",
    "firstName": "Carla",
    "middleName": "Andrea",
    "lastName": "Paz Molina",
    "email": "carla.paz@example.com",
    "phone": "+593999111222",
    "address": "Quito",
    "nationality": "Ecuatoriana"
  }'
```

Guarda:

```json
"idUuid": "UUID_DE_LA_PERSONA"
```

### Listar personas

```powershell
curl http://localhost:8080/api/personas
```

### Buscar persona por ID

```powershell
curl http://localhost:8080/api/personas/UUID_DE_LA_PERSONA
```

### Actualizar persona

```powershell
curl -X PUT http://localhost:8080/api/personas/UUID_DE_LA_PERSONA `
  -H "Content-Type: application/json" `
  -d '{
    "dni": "1711111111",
    "firstName": "Carla",
    "middleName": "Andrea",
    "lastName": "Paz Molina",
    "email": "carla.paz@example.com",
    "phone": "+593999111333",
    "address": "Quito Norte",
    "nationality": "Ecuatoriana"
  }'
```

### Desactivar persona

Si la persona tiene usuario, tambien se desactivan primero sus asignaciones y luego el usuario.

```powershell
curl -X DELETE http://localhost:8080/api/personas/UUID_DE_LA_PERSONA
```

## 6. Usuarios

Crear un usuario tambien crea su persona. El `idPerson` del usuario es el mismo UUID de la persona.

### Crear usuario

```powershell
curl -X POST http://localhost:8080/api/users `
  -H "Content-Type: application/json" `
  -d '{
    "persona": {
      "dni": "1722222222",
      "firstName": "Mesias",
      "middleName": "Orlando",
      "lastName": "Mariscal Ona",
      "email": "mesias.mariscal@example.com",
      "phone": "+593999222333",
      "address": "Quito",
      "nationality": "Ecuatoriana"
    },
    "password": "Password123"
  }'
```

Guarda:

```json
"idPerson": "UUID_DEL_USUARIO"
```

Regla de username:

```text
Mesias Orlando Mariscal Ona -> momariscal
Denise Noemi Rea Diaz -> dnrea
```

Si el username ya existe, agrega numero:

```text
momariscal2
momariscal3
```

### Listar usuarios

```powershell
curl http://localhost:8080/api/users
```

### Buscar usuario por ID

```powershell
curl http://localhost:8080/api/users/UUID_DEL_USUARIO
```

### Actualizar usuario

```powershell
curl -X PUT http://localhost:8080/api/users/UUID_DEL_USUARIO `
  -H "Content-Type: application/json" `
  -d '{
    "persona": {
      "dni": "1722222222",
      "firstName": "Mesias",
      "middleName": "Orlando",
      "lastName": "Mariscal Ona",
      "email": "mesias.mariscal@example.com",
      "phone": "+593999222335",
      "address": "Quito Centro",
      "nationality": "Ecuatoriana"
    },
    "password": "Password456"
  }'
```

### Desactivar usuario

Se desactivan en este orden:

1. Asignaciones activas de `user_role`.
2. Usuario.
3. Persona.

```powershell
curl -X DELETE http://localhost:8080/api/users/UUID_DEL_USUARIO
```

## 7. Asignacion de roles a usuarios

Necesitas:

```text
UUID_DEL_USUARIO
UUID_DEL_ROL
```

### Asignar rol a usuario

```powershell
curl -X POST http://localhost:8080/api/users/UUID_DEL_USUARIO/roles/UUID_DEL_ROL
```

Si la asignacion ya existe activa, responde conflicto `409`.

Si la asignacion existe inactiva, la reactiva.

### Listar roles asignados a un usuario

```powershell
curl http://localhost:8080/api/users/UUID_DEL_USUARIO/roles
```

### Desactivar asignacion de rol

```powershell
curl -X DELETE http://localhost:8080/api/users/UUID_DEL_USUARIO/roles/UUID_DEL_ROL
```

Respuesta esperada: `204 No Content`.

## 8. Validaciones principales

La API valida:

- `dni` obligatorio, maximo 30.
- `firstName` obligatorio, maximo 30.
- `middleName` opcional, maximo 30.
- `lastName` obligatorio, maximo 30.
- `email` obligatorio, formato email, maximo 50.
- `phone` opcional, maximo 15.
- `role.name` obligatorio, maximo 50.
- `password` minimo 8 y maximo 72.
- `dni`, `email`, `username` y `role.name` no se pueden repetir.

Codigos comunes:

```text
200 OK: consulta o actualizacion correcta
201 Created: creacion correcta
204 No Content: desactivacion correcta
400 Bad Request: validacion o regla de negocio
404 Not Found: recurso no existe
409 Conflict: dato repetido o asignacion duplicada
```

## 9. Revisar tablas en PostgreSQL

Entrar a `psql`:

```powershell
docker compose exec usuarios-postgres psql -U admin -d usuarios
```

Ver tablas:

```sql
\dt
```

Ver estructura:

```sql
\d personas
\d users
\d roles
\d user_role
```

Ver datos:

```sql
select * from personas;
select * from users;
select * from roles;
select * from user_role;
```

Salir:

```sql
\q
```

Tambien puedes ejecutar sin entrar:

```powershell
docker compose exec usuarios-postgres psql -U admin -d usuarios -c "\dt"
docker compose exec usuarios-postgres psql -U admin -d usuarios -c "select * from roles;"
```

## 10. Usar Postman

Puedes usar Postman de dos maneras:

1. Manualmente, creando cada request.
2. Importando el archivo OpenAPI.

La forma manual es la mejor para aprender.

### 10.1 Configuracion inicial manual

En Postman crea una variable de entorno o usa directamente la URL completa.

Base URL:

```text
http://localhost:8080
```

Si usas variable en Postman:

```text
baseUrl = http://localhost:8080
```

En las URLs puedes escribir:

```text
{{baseUrl}}/api/roles
```

o directamente:

```text
http://localhost:8080/api/roles
```

Para requests `POST` y `PUT`:

1. Ve a `Body`.
2. Selecciona `raw`.
3. Selecciona `JSON`.
4. Pega el JSON del ejemplo.

### 10.2 Flujo manual recomendado en Postman

#### Paso 1: Crear rol

Metodo:

```text
POST
```

URL:

```text
http://localhost:8080/api/roles
```

Body -> raw -> JSON:

```json
{
  "name": "ADMIN",
  "description": "Administrador del sistema"
}
```

De la respuesta copia el campo `id`.

Ejemplo:

```json
{
  "id": "4f9f8c6e-2a8c-4b01-bd95-1f1e4e5b4c31",
  "active": true,
  "name": "ADMIN",
  "description": "Administrador del sistema"
}
```

Ese valor sera tu:

```text
roleId
```

#### Paso 2: Crear segundo rol opcional

Metodo:

```text
POST
```

URL:

```text
http://localhost:8080/api/roles
```

Body:

```json
{
  "name": "OPERADOR",
  "description": "Operador de reservas"
}
```

Copia el `id` de la respuesta si quieres asignar tambien este rol.

#### Paso 3: Crear usuario

Metodo:

```text
POST
```

URL:

```text
http://localhost:8080/api/users
```

Body:

```json
{
  "persona": {
    "dni": "1722222222",
    "firstName": "Mesias",
    "middleName": "Orlando",
    "lastName": "Mariscal Ona",
    "email": "mesias.mariscal@example.com",
    "phone": "+593999222333",
    "address": "Quito",
    "nationality": "Ecuatoriana"
  },
  "password": "Password123"
}
```

De la respuesta copia `idPerson`.

Ejemplo:

```json
{
  "idPerson": "61e63d4f-a3b4-4b5d-87e1-8b5747b8fbd3",
  "active": true,
  "username": "momariscal"
}
```

Ese valor sera tu:

```text
userId
```

Importante:

- `idPerson` es el ID del usuario.
- Tambien es el ID de la persona, porque la relacion persona-usuario comparte UUID.

#### Paso 4: Listar usuarios

Metodo:

```text
GET
```

URL:

```text
http://localhost:8080/api/users
```

No lleva body.

#### Paso 5: Buscar usuario por ID

Metodo:

```text
GET
```

URL:

```text
http://localhost:8080/api/users/PEGAR_USER_ID
```

Ejemplo:

```text
http://localhost:8080/api/users/61e63d4f-a3b4-4b5d-87e1-8b5747b8fbd3
```

#### Paso 6: Asignar rol al usuario

Metodo:

```text
POST
```

URL:

```text
http://localhost:8080/api/users/PEGAR_USER_ID/roles/PEGAR_ROLE_ID
```

Ejemplo:

```text
http://localhost:8080/api/users/61e63d4f-a3b4-4b5d-87e1-8b5747b8fbd3/roles/4f9f8c6e-2a8c-4b01-bd95-1f1e4e5b4c31
```

No lleva body.

#### Paso 7: Ver roles asignados al usuario

Metodo:

```text
GET
```

URL:

```text
http://localhost:8080/api/users/PEGAR_USER_ID/roles
```

Ejemplo:

```text
http://localhost:8080/api/users/61e63d4f-a3b4-4b5d-87e1-8b5747b8fbd3/roles
```

#### Paso 8: Desactivar asignacion de rol

Metodo:

```text
DELETE
```

URL:

```text
http://localhost:8080/api/users/PEGAR_USER_ID/roles/PEGAR_ROLE_ID
```

No lleva body.

Esto no borra la fila de `user_role`; solo cambia `active=false`.

#### Paso 9: Reactivar asignacion de rol

Metodo:

```text
POST
```

URL:

```text
http://localhost:8080/api/users/PEGAR_USER_ID/roles/PEGAR_ROLE_ID
```

Si la asignacion ya existia inactiva, se reactiva.

#### Paso 10: Desactivar usuario

Metodo:

```text
DELETE
```

URL:

```text
http://localhost:8080/api/users/PEGAR_USER_ID
```

Esto desactiva en cadena:

1. Sus asignaciones `user_role`.
2. El usuario.
3. La persona.

### 10.3 Endpoints manuales extra

Listar roles:

```text
GET http://localhost:8080/api/roles
```

Buscar rol:

```text
GET http://localhost:8080/api/roles/PEGAR_ROLE_ID
```

Actualizar rol:

```text
PUT http://localhost:8080/api/roles/PEGAR_ROLE_ID
```

Body:

```json
{
  "name": "ADMIN",
  "description": "Administrador general del sistema"
}
```

Desactivar rol:

```text
DELETE http://localhost:8080/api/roles/PEGAR_ROLE_ID
```

Crear persona sin usuario:

```text
POST http://localhost:8080/api/personas
```

Body:

```json
{
  "dni": "1711111111",
  "firstName": "Carla",
  "middleName": "Andrea",
  "lastName": "Paz Molina",
  "email": "carla.paz@example.com",
  "phone": "+593999111222",
  "address": "Quito",
  "nationality": "Ecuatoriana"
}
```

Listar personas:

```text
GET http://localhost:8080/api/personas
```

Buscar persona:

```text
GET http://localhost:8080/api/personas/PEGAR_PERSONA_ID
```

Actualizar persona:

```text
PUT http://localhost:8080/api/personas/PEGAR_PERSONA_ID
```

Desactivar persona:

```text
DELETE http://localhost:8080/api/personas/PEGAR_PERSONA_ID
```

### 10.4 Importar en Postman

Si quieres importar en lugar de crear manualmente, usa el archivo OpenAPI:

```text
postman/usuarios-api.openapi.json
```

En Postman:

1. Import.
2. Files.
3. Selecciona `postman/usuarios-api.openapi.json`.
4. Import as Collection.

Luego prueba en este orden:

1. `POST /api/roles`
2. `POST /api/users`
3. Copia `id` del rol y `idPerson` del usuario.
4. `POST /api/users/{userId}/roles/{roleId}`
5. `GET /api/users/{userId}/roles`
6. `DELETE /api/users/{userId}/roles/{roleId}`
7. `DELETE /api/users/{id}`

## 11. Comandos utiles

Compilar:

```powershell
cd usuarios
.\mvnw.cmd compile
```

Probar:

```powershell
.\mvnw.cmd test
```

Empaquetar:

```powershell
.\mvnw.cmd clean package
```

Apagar Docker:

```powershell
cd ..
docker compose down
```

Apagar Docker y borrar datos:

```powershell
docker compose down -v
```

Usa `down -v` solo si quieres limpiar toda la base.
