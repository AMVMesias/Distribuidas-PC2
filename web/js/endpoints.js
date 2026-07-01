// Catálogo declarativo de endpoints. Cada entrada describe:
//   method, path, perm, desc, hint (qué esperar), fields (campos del formulario),
//   builder (construye el body/path desde los valores del formulario).

export const AUTH_ENDPOINTS = [
  {
    id: "auth-register",
    method: "POST",
    path: "/api/v1/auth/register",
    perm: "public",
    desc: "Registra un nuevo usuario. El servicio asigna el rol CLIENTE y devuelve una sesión completa.",
    hint: `<ul>
      <li>201 con <code>user</code>, <code>accessToken</code>, <code>refreshToken</code>, <code>tokenType</code> y <code>expiresIn: 900</code>.</li>
      <li>400 si falta algún campo obligatorio o el email/DNI ya existen.</li>
      <li>429 si superas el límite de 5 registros por hora desde la misma IP.</li>
    </ul>`,
    fields: [
      { name: "dni", label: "DNI", type: "text", required: true, placeholder: "1712345678", value: "1712345678" },
      { name: "firstName", label: "Nombre", type: "text", required: true, value: "Juan" },
      { name: "lastName", label: "Apellido", type: "text", required: true, value: "Perez" },
      { name: "email", label: "Email", type: "email", required: true, value: "juan@example.com" },
      { name: "phone", label: "Teléfono", type: "text", placeholder: "+593 99 123 4567" },
      { name: "password", label: "Contraseña (min 8)", type: "text", required: true, value: "Demo12345!" },
    ],
    build: (v) => ({
      body: {
        persona: {
          dni: v.dni, firstName: v.firstName, lastName: v.lastName,
          email: v.email, phone: v.phone || "",
          middleName: v.middleName || "", address: v.address || "",
          nationality: v.nationality || "",
        },
        password: v.password,
      },
    }),
  },
  {
    id: "auth-login",
    method: "POST",
    path: "/api/v1/auth/login",
    perm: "public",
    desc: "Inicia sesión y devuelve access + refresh token. Guarda la sesión en el cliente automáticamente.",
    hint: `<ul>
      <li>200 con la sesión (<code>accessToken</code> 15 min, <code>refreshToken</code> 7 días).</li>
      <li>401 si las credenciales son inválidas.</li>
      <li>429 si superas 10 intentos/minuto desde la misma IP.</li>
    </ul>`,
    fields: [
      { name: "username", label: "Usuario", type: "text", required: true, value: "admin", fromStore: "username" },
      { name: "password", label: "Contraseña", type: "password", required: true, placeholder: "Contraseña del usuario" },
    ],
    build: (v) => ({ body: { username: v.username, password: v.password } }),
    special: "login",
  },
  {
    id: "auth-refresh",
    method: "POST",
    path: "/api/v1/auth/refresh",
    perm: "public",
    desc: "Rota el refresh token. El anterior deja de ser válido y reutilizarlo revoca toda su familia.",
    hint: `<ul>
      <li>200 con una pareja nueva de tokens.</li>
      <li>401 si el refresh token está revocado, expirado o ya fue usado.</li>
      <li>Límite: 30/minuto por IP.</li>
    </ul>`,
    fields: [
      { name: "refreshToken", label: "Refresh token", type: "textarea", required: true, value: "", fromStore: "refresh" },
    ],
    build: (v) => ({ body: { refreshToken: v.refreshToken } }),
    special: "refresh",
  },
  {
    id: "auth-logout",
    method: "POST",
    path: "/api/v1/auth/logout",
    perm: "public",
    desc: "Revoca la sesión actual. El refresh token ya no será válido.",
    hint: `<ul><li>204 No Content; la sesión local se elimina aunque el token ya no exista.</li></ul>`,
    fields: [
      { name: "refreshToken", label: "Refresh token", type: "textarea", required: true, value: "", fromStore: "refresh" },
    ],
    build: (v) => ({ body: { refreshToken: v.refreshToken } }),
    special: "logout",
  },
  {
    id: "auth-me",
    method: "GET",
    path: "/api/v1/auth/me",
    perm: "CLIENTE/ADMIN",
    desc: "Devuelve el usuario autenticado a partir del access token.",
    hint: `<ul><li>200 con el usuario y sus roles.</li><li>401 sin token, token expirado o inválido.</li></ul>`,
    fields: [],
    build: () => ({}),
    special: "me",
  },
];

export const USUARIOS_ENDPOINTS = [
  {
    id: "usuarios-list",
    method: "GET", path: "/api/v1/usuarios", perm: "ADMIN",
    desc: "Lista todos los usuarios.",
    hint: `<ul><li>200 con un array de usuarios.</li><li>403 si no eres ADMIN.</li></ul>`,
    fields: [], build: () => ({}),
  },
  {
    id: "usuarios-get",
    method: "GET", path: "/api/v1/usuarios/{id}", perm: "ADMIN",
    desc: "Obtiene un usuario por su UUID.",
    hint: `<ul><li>200 con el usuario.</li><li>404 si no existe.</li></ul>`,
    fields: [
      { name: "id", label: "UUID", type: "text", required: true, placeholder: "00000000-0000-0000-0000-000000000000" },
    ],
    build: (v) => ({ path: `/api/v1/usuarios/${v.id}` }),
  },
  {
    id: "usuarios-create",
    method: "POST", path: "/api/v1/usuarios", perm: "ADMIN",
    desc: "Crea un usuario (con persona embebida). El administrador decide rol luego.",
    hint: `<ul><li>201 con el usuario creado.</li><li>400 si la persona ya existe o datos inválidos.</li></ul>`,
    fields: [
      { name: "dni", label: "DNI", type: "text", required: true, value: "1800000001" },
      { name: "firstName", label: "Nombre", type: "text", required: true, value: "Maria" },
      { name: "lastName", label: "Apellido", type: "text", required: true, value: "Lopez" },
      { name: "email", label: "Email", type: "email", required: true, value: "maria@example.com" },
      { name: "phone", label: "Teléfono", type: "text", value: "+593 99 000 0000" },
      { name: "password", label: "Contraseña (min 8)", type: "text", required: true, value: "Demo12345!" },
    ],
    build: (v) => ({
      body: {
        persona: {
          dni: v.dni, firstName: v.firstName, lastName: v.lastName,
          email: v.email, phone: v.phone || "",
        },
        password: v.password,
      },
    }),
  },
  {
    id: "usuarios-update",
    method: "PUT", path: "/api/v1/usuarios/{id}", perm: "ADMIN",
    desc: "Actualiza usuario y persona. La contraseña es opcional.",
    hint: `<ul><li>200 con el usuario actualizado.</li><li>404 si no existe.</li></ul>`,
    fields: [
      { name: "id", label: "UUID", type: "text", required: true },
      { name: "dni", label: "DNI", type: "text", required: true, value: "1800000001" },
      { name: "firstName", label: "Nombre", type: "text", required: true, value: "Maria" },
      { name: "lastName", label: "Apellido", type: "text", required: true, value: "Lopez" },
      { name: "email", label: "Email", type: "email", required: true, value: "maria@example.com" },
      { name: "phone", label: "Teléfono", type: "text", value: "" },
      { name: "password", label: "Nueva contraseña (opcional)", type: "text", value: "" },
    ],
    build: (v) => ({
      path: `/api/v1/usuarios/${v.id}`,
      body: {
        persona: {
          dni: v.dni, firstName: v.firstName, lastName: v.lastName,
          email: v.email, phone: v.phone || "",
        },
        password: v.password || undefined,
      },
    }),
  },
  {
    id: "usuarios-delete",
    method: "DELETE", path: "/api/v1/usuarios/{id}", perm: "ADMIN",
    desc: "Desactiva un usuario por UUID.",
    hint: `<ul><li>204 No Content; conserva el registro y revoca su acceso.</li><li>404 si no existe.</li></ul>`,
    fields: [{ name: "id", label: "UUID", type: "text", required: true }],
    build: (v) => ({ path: `/api/v1/usuarios/${v.id}` }),
  },
  {
    id: "usuarios-roles",
    method: "GET", path: "/api/v1/usuarios/{userId}/roles", perm: "ADMIN",
    desc: "Lista los roles asignados al usuario.",
    hint: `<ul><li>200 con array de roles.</li></ul>`,
    fields: [{ name: "userId", label: "User UUID", type: "text", required: true }],
    build: (v) => ({ path: `/api/v1/usuarios/${v.userId}/roles` }),
  },
  {
    id: "usuarios-assign-role",
    method: "POST", path: "/api/v1/usuarios/{userId}/roles/{roleId}", perm: "ADMIN",
    desc: "Asigna un rol a un usuario.",
    hint: `<ul><li>200 con la asignación.</li></ul>`,
    fields: [
      { name: "userId", label: "User UUID", type: "text", required: true },
      { name: "roleId", label: "Role UUID", type: "text", required: true },
    ],
    build: (v) => ({ path: `/api/v1/usuarios/${v.userId}/roles/${v.roleId}` }),
  },
  {
    id: "usuarios-remove-role",
    method: "DELETE", path: "/api/v1/usuarios/{userId}/roles/{roleId}", perm: "ADMIN",
    desc: "Desactiva un rol de un usuario.",
    hint: `<ul><li>204 No Content.</li></ul>`,
    fields: [
      { name: "userId", label: "User UUID", type: "text", required: true },
      { name: "roleId", label: "Role UUID", type: "text", required: true },
    ],
    build: (v) => ({ path: `/api/v1/usuarios/${v.userId}/roles/${v.roleId}` }),
  },
];

export const PERSONAS_ENDPOINTS = [
  {
    id: "personas-list", method: "GET", path: "/api/v1/personas", perm: "ADMIN",
    desc: "Lista todas las personas.", hint: `<ul><li>200 con array de personas.</li></ul>`,
    fields: [], build: () => ({}),
  },
  {
    id: "personas-get", method: "GET", path: "/api/v1/personas/{id}", perm: "ADMIN",
    desc: "Obtiene una persona por UUID.",
    hint: `<ul><li>200 con la persona.</li><li>404 si no existe.</li></ul>`,
    fields: [{ name: "id", label: "UUID", type: "text", required: true }],
    build: (v) => ({ path: `/api/v1/personas/${v.id}` }),
  },
  {
    id: "personas-create", method: "POST", path: "/api/v1/personas", perm: "ADMIN",
    desc: "Crea una persona (sin usuario).",
    hint: `<ul><li>201 con la persona.</li><li>400 si el email o DNI ya existen.</li></ul>`,
    fields: [
      { name: "dni", label: "DNI", type: "text", required: true, value: "1900000002" },
      { name: "firstName", label: "Nombre", type: "text", required: true, value: "Carlos" },
      { name: "lastName", label: "Apellido", type: "text", required: true, value: "Andrade" },
      { name: "email", label: "Email", type: "email", required: true, value: "carlos@example.com" },
      { name: "phone", label: "Teléfono", type: "text", value: "" },
    ],
    build: (v) => ({
      body: {
        dni: v.dni, firstName: v.firstName, lastName: v.lastName,
        email: v.email, phone: v.phone || "",
      },
    }),
  },
  {
    id: "personas-update", method: "PUT", path: "/api/v1/personas/{id}", perm: "ADMIN",
    desc: "Actualiza una persona.",
    hint: `<ul><li>200 con la persona.</li><li>404 si no existe.</li></ul>`,
    fields: [
      { name: "id", label: "UUID", type: "text", required: true },
      { name: "dni", label: "DNI", type: "text", required: true },
      { name: "firstName", label: "Nombre", type: "text", required: true },
      { name: "lastName", label: "Apellido", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "phone", label: "Teléfono", type: "text", value: "" },
    ],
    build: (v) => ({
      path: `/api/v1/personas/${v.id}`,
      body: { dni: v.dni, firstName: v.firstName, lastName: v.lastName, email: v.email, phone: v.phone || "" },
    }),
  },
  {
    id: "personas-delete", method: "DELETE", path: "/api/v1/personas/{id}", perm: "ADMIN",
    desc: "Desactiva una persona.",
    hint: `<ul><li>204 No Content; conserva el registro.</li><li>404 si no existe.</li></ul>`,
    fields: [{ name: "id", label: "UUID", type: "text", required: true }],
    build: (v) => ({ path: `/api/v1/personas/${v.id}` }),
  },
];

export const ROLES_ENDPOINTS = [
  {
    id: "roles-list", method: "GET", path: "/api/v1/roles", perm: "ADMIN",
    desc: "Lista todos los roles.", hint: `<ul><li>200 con array de roles.</li></ul>`,
    fields: [], build: () => ({}),
  },
  {
    id: "roles-get", method: "GET", path: "/api/v1/roles/{id}", perm: "ADMIN",
    desc: "Obtiene un rol por UUID.",
    hint: `<ul><li>200 con el rol.</li><li>404 si no existe.</li></ul>`,
    fields: [{ name: "id", label: "UUID", type: "text", required: true }],
    build: (v) => ({ path: `/api/v1/roles/${v.id}` }),
  },
  {
    id: "roles-create", method: "POST", path: "/api/v1/roles", perm: "ADMIN",
    desc: "Crea un rol nuevo.",
    hint: `<ul><li>201 con el rol.</li></ul>`,
    fields: [
      { name: "name", label: "Nombre", type: "text", required: true, value: "OPERADOR" },
      { name: "description", label: "Descripción", type: "text", value: "Operador de parking" },
    ],
    build: (v) => ({ body: { name: v.name, description: v.description || "" } }),
  },
  {
    id: "roles-update", method: "PUT", path: "/api/v1/roles/{id}", perm: "ADMIN",
    desc: "Actualiza un rol.",
    hint: `<ul><li>200 con el rol.</li></ul>`,
    fields: [
      { name: "id", label: "UUID", type: "text", required: true },
      { name: "name", label: "Nombre", type: "text", required: true },
      { name: "description", label: "Descripción", type: "text", value: "" },
    ],
    build: (v) => ({ path: `/api/v1/roles/${v.id}`, body: { name: v.name, description: v.description || "" } }),
  },
  {
    id: "roles-delete", method: "DELETE", path: "/api/v1/roles/{id}", perm: "ADMIN",
    desc: "Desactiva un rol.",
    hint: `<ul><li>204 No Content; conserva el registro.</li></ul>`,
    fields: [{ name: "id", label: "UUID", type: "text", required: true }],
    build: (v) => ({ path: `/api/v1/roles/${v.id}` }),
  },
];

export const ZONAS_ENDPOINTS = [
  {
    id: "zonas-list", method: "GET", path: "/api/v1/zonas", perm: "CLIENTE/RECAUDADOR/ADMIN",
    desc: "Lista todas las zonas.",
    hint: `<ul><li>200 con array de zonas.</li><li>401 sin token.</li></ul>`,
    fields: [], build: () => ({}),
  },
  {
    id: "zonas-create", method: "POST", path: "/api/v1/zonas", perm: "ADMIN",
    desc: "Crea una zona.",
    hint: `<ul><li>201 con la zona.</li><li>403 si no eres ADMIN.</li></ul>`,
    fields: [
      { name: "nombre", label: "Nombre (max 32)", type: "text", required: true, value: "Zona Norte" },
      { name: "descripcion", label: "Descripción", type: "text", value: "Acceso por Av. América" },
      { name: "tipo", label: "Tipo", type: "select", options: ["VIP", "REGULAR", "INTERNA", "EXTERNA", "PREFERENCIAL"], value: "REGULAR" },
      { name: "capacidad", label: "Capacidad", type: "number", value: "40" },
    ],
    build: (v) => ({
      body: {
        nombre: v.nombre, descripcion: v.descripcion || "",
        tipo: v.tipo, capacidad: parseInt(v.capacidad || "0", 10),
      },
    }),
  },
  {
    id: "zonas-update", method: "PUT", path: "/api/v1/zonas/{id}", perm: "ADMIN",
    desc: "Actualiza una zona.",
    hint: `<ul><li>200 con la zona.</li><li>404 si no existe.</li></ul>`,
    fields: [
      { name: "id", label: "UUID", type: "text", required: true },
      { name: "nombre", label: "Nombre", type: "text", required: true },
      { name: "descripcion", label: "Descripción", type: "text", value: "" },
      { name: "tipo", label: "Tipo", type: "select", options: ["VIP", "REGULAR", "INTERNA", "EXTERNA", "PREFERENCIAL"], value: "REGULAR" },
      { name: "capacidad", label: "Capacidad", type: "number", value: "40" },
    ],
    build: (v) => ({
      path: `/api/v1/zonas/${v.id}`,
      body: {
        nombre: v.nombre, descripcion: v.descripcion || "",
        tipo: v.tipo, capacidad: parseInt(v.capacidad || "0", 10),
      },
    }),
  },
  {
    id: "zonas-deactivate", method: "PUT", path: "/api/v1/zonas/{id}/desactivar", perm: "ADMIN",
    desc: "Desactiva una zona.",
    hint: `<ul><li>200 con la zona desactivada.</li></ul>`,
    fields: [{ name: "id", label: "UUID", type: "text", required: true }],
    build: (v) => ({ path: `/api/v1/zonas/${v.id}/desactivar` }),
  },
];

export const ESPACIOS_ENDPOINTS = [
  {
    id: "espacios-list", method: "GET", path: "/api/v1/espacios", perm: "CLIENTE/RECAUDADOR/ADMIN",
    desc: "Lista todos los espacios.",
    hint: `<ul><li>200 con array de espacios.</li></ul>`,
    fields: [], build: () => ({}),
  },
  {
    id: "espacios-by-zona", method: "GET", path: "/api/v1/espacios/zona/{idZona}", perm: "CLIENTE/RECAUDADOR/ADMIN",
    desc: "Lista los espacios de una zona.",
    hint: `<ul><li>200 con array de espacios.</li></ul>`,
    fields: [{ name: "idZona", label: "Zona UUID", type: "text", required: true }],
    build: (v) => ({ path: `/api/v1/espacios/zona/${v.idZona}` }),
  },
  {
    id: "espacios-create", method: "POST", path: "/api/v1/espacios", perm: "ADMIN",
    desc: "Crea un espacio dentro de una zona.",
    hint: `<ul><li>201 con el espacio.</li><li>403 si no eres ADMIN.</li></ul>`,
    fields: [
      { name: "codigo", label: "Código (max 16)", type: "text", required: true, value: "A-001" },
      { name: "idZona", label: "Zona UUID", type: "text", required: true },
      { name: "descripcion", label: "Descripción (max 100)", type: "text", required: true, value: "Espacio cubierto" },
      { name: "tipo", label: "Tipo", type: "select", options: ["MOTO", "AUTO", "BUS"], value: "AUTO" },
      { name: "capacidad", label: "Capacidad (1-300)", type: "number", value: "1" },
      { name: "estado", label: "Estado", type: "select", options: ["DISPONIBLE", "OCUPADO", "RESERVADO", "FUERA_DE_SERVICIO"], value: "DISPONIBLE" },
    ],
    build: (v) => ({
      body: {
        codigo: v.codigo, idZona: v.idZona, descripcion: v.descripcion,
        tipo: v.tipo, capacidad: parseInt(v.capacidad || "1", 10), estado: v.estado,
      },
    }),
  },
  {
    id: "espacios-change-state", method: "PUT", path: "/api/v1/espacios/{id}/estado/{estado}", perm: "ADMIN",
    desc: "Cambia el estado de un espacio.",
    hint: `<ul><li>200 con el espacio actualizado.</li></ul>`,
    fields: [
      { name: "id", label: "Espacio UUID", type: "text", required: true },
      { name: "estado", label: "Estado", type: "select", options: ["DISPONIBLE", "OCUPADO", "RESERVADO", "FUERA_DE_SERVICIO"], value: "OCUPADO" },
    ],
    build: (v) => ({ path: `/api/v1/espacios/${v.id}/estado/${v.estado}` }),
  },
];

export const VEHICULOS_ENDPOINTS = [
  {
    id: "vehiculos-list", method: "GET", path: "/api/v1/vehiculos", perm: "CLIENTE/RECAUDADOR/ADMIN",
    desc: "Lista vehículos. CLIENTE ve los propios; RECAUDADOR, ADMIN y ROOT ven todos.",
    hint: `<ul><li>200 con array de vehículos.</li><li>401 sin token.</li></ul>`,
    fields: [], build: () => ({}),
  },
  {
    id: "vehiculos-get", method: "GET", path: "/api/v1/vehiculos/{id}", perm: "CLIENTE/RECAUDADOR/ADMIN",
    desc: "Obtiene un vehículo por UUID. CLIENTE sólo si es el dueño; RECAUDADOR puede consultar.",
    hint: `<ul><li>200 con el vehículo.</li><li>403 si no eres dueño ni ADMIN.</li><li>404 si no existe.</li></ul>`,
    fields: [{ name: "id", label: "UUID", type: "text", required: true }],
    build: (v) => ({ path: `/api/v1/vehiculos/${v.id}` }),
  },
  {
    id: "vehiculos-by-placa", method: "GET", path: "/api/v1/vehiculos/placa/{placa}", perm: "CLIENTE/RECAUDADOR/ADMIN",
    desc: "Busca un vehículo por placa. Útil para operación de RECAUDADOR.",
    hint: `<ul><li>200 con el vehículo.</li><li>404 si no existe o CLIENTE no es dueño.</li></ul>`,
    fields: [{ name: "placa", label: "Placa", type: "text", required: true, value: "ABC-1234" }],
    build: (v) => ({ path: `/api/v1/vehiculos/placa/${v.placa}` }),
  },
  {
    id: "vehiculos-create", method: "POST", path: "/api/v1/vehiculos", perm: "CLIENTE/ADMIN",
    desc: "Crea un vehículo. El ownerId se toma del claim sub del token, no del body.",
    hint: `<ul>
      <li>201 con el vehículo creado. <strong>ownerId</strong> vendrá del JWT.</li>
      <li>400 si la placa no cumple <code>ABC-1234</code> o falta un campo del tipo.</li>
    </ul>`,
    fields: [
      { name: "tipo", label: "Tipo", type: "select", options: ["auto", "motocicleta", "camioneta"], value: "auto" },
      { name: "placa", label: "Placa (ABC-1234)", type: "text", required: true, value: "ABC-1234" },
      { name: "marca", label: "Marca", type: "text", required: true, value: "Toyota" },
      { name: "modelo", label: "Modelo", type: "text", required: true, value: "Corolla" },
      { name: "color", label: "Color", type: "text", required: true, value: "Gris" },
      { name: "anio", label: "Año", type: "number", required: true, value: "2022" },
      { name: "clasificacion", label: "Clasificación", type: "select", options: ["Electrico", "Hibrido", "Gasolina"], value: "Gasolina" },
      { name: "numeroPuertas", label: "N° puertas (auto)", type: "number", value: "4" },
      { name: "capacidadMaletero", label: "Maletero L (auto)", type: "number", value: "470" },
      { name: "tipoMoto", label: "Tipo moto (moto)", type: "select", options: ["Deportiva", "Scooter", "Motocross"], value: "Scooter" },
      { name: "capacidadCarga", label: "Carga kg (camioneta)", type: "number", value: "800" },
      { name: "traccion", label: "Tracción (camioneta)", type: "select", options: ["4x2", "4x4", "AWD"], value: "4x2" },
    ],
    build: (v) => {
      const base = {
        placa: v.placa, marca: v.marca, modelo: v.modelo, color: v.color,
        anio: parseInt(v.anio, 10), clasificacion: v.clasificacion,
      };
      let datos;
      if (v.tipo === "auto") {
        datos = { ...base, numeroPuertas: parseInt(v.numeroPuertas, 10), capacidadMaletero: parseInt(v.capacidadMaletero, 10) };
      } else if (v.tipo === "motocicleta") {
        datos = { ...base, tipoMoto: v.tipoMoto };
      } else {
        datos = { ...base, capacidadCarga: parseFloat(v.capacidadCarga), traccion: v.traccion };
      }
      return { body: { tipo: v.tipo, datos } };
    },
  },
  {
    id: "vehiculos-update", method: "PATCH", path: "/api/v1/vehiculos/{id}", perm: "CLIENTE/ADMIN",
    desc: "Actualiza parcialmente un vehículo. CLIENTE sólo si es dueño. RECAUDADOR no modifica vehículos.",
    hint: `<ul><li>200 con el vehículo actualizado.</li><li>403 si no eres dueño ni ADMIN.</li></ul>`,
    fields: [
      { name: "id", label: "UUID", type: "text", required: true },
      { name: "tipo", label: "Tipo", type: "select", options: ["auto", "motocicleta", "camioneta"], value: "auto" },
      { name: "placa", label: "Placa", type: "text", value: "ABC-1234" },
      { name: "marca", label: "Marca", type: "text", value: "Toyota" },
      { name: "modelo", label: "Modelo", type: "text", value: "Corolla" },
      { name: "color", label: "Color", type: "text", value: "Negro" },
      { name: "anio", label: "Año", type: "number", value: "2023" },
      { name: "clasificacion", label: "Clasificación", type: "select", options: ["Electrico", "Hibrido", "Gasolina"], value: "Gasolina" },
      { name: "numeroPuertas", label: "N° puertas (auto)", type: "number", value: "4" },
      { name: "capacidadMaletero", label: "Maletero L (auto)", type: "number", value: "470" },
      { name: "tipoMoto", label: "Tipo moto", type: "select", options: ["Deportiva", "Scooter", "Motocross"], value: "Scooter" },
      { name: "capacidadCarga", label: "Carga kg", type: "number", value: "800" },
      { name: "traccion", label: "Tracción", type: "select", options: ["4x2", "4x4", "AWD"], value: "4x2" },
    ],
    build: (v) => {
      const base = {
        placa: v.placa, marca: v.marca, modelo: v.modelo, color: v.color,
        anio: parseInt(v.anio, 10), clasificacion: v.clasificacion,
      };
      let datos;
      if (v.tipo === "auto") {
        datos = { ...base, numeroPuertas: parseInt(v.numeroPuertas, 10), capacidadMaletero: parseInt(v.capacidadMaletero, 10) };
      } else if (v.tipo === "motocicleta") {
        datos = { ...base, tipoMoto: v.tipoMoto };
      } else {
        datos = { ...base, capacidadCarga: parseFloat(v.capacidadCarga), traccion: v.traccion };
      }
      return { path: `/api/v1/vehiculos/${v.id}`, body: { tipo: v.tipo, datos } };
    },
  },
  {
    id: "vehiculos-delete", method: "DELETE", path: "/api/v1/vehiculos/{id}", perm: "CLIENTE/ADMIN",
    desc: "Elimina un vehículo. CLIENTE sólo si es dueño. RECAUDADOR no elimina vehículos.",
    hint: `<ul><li>200 o 204.</li><li>403 si no eres dueño ni ADMIN.</li></ul>`,
    fields: [{ name: "id", label: "UUID", type: "text", required: true }],
    build: (v) => ({ path: `/api/v1/vehiculos/${v.id}` }),
  },
];

export const TICKETS_ENDPOINTS = [
  {
    id: "tickets-list", method: "GET", path: "/api/v1/tickets", perm: "CLIENTE/RECAUDADOR/ADMIN",
    desc: "Lista tickets. CLIENTE ve los propios; RECAUDADOR, ADMIN y ROOT consultan operación.",
    hint: `<ul><li>200 con array de tickets.</li></ul>`,
    fields: [
      { name: "estado", label: "Estado", type: "select", options: ["", "ACTIVO", "PAGADO", "CANCELADO"], value: "" },
      { name: "idUsuario", label: "Usuario UUID", type: "text", value: "" },
      { name: "idVehiculo", label: "Vehículo UUID", type: "text", value: "" },
      { name: "idEspacio", label: "Espacio UUID", type: "text", value: "" },
    ],
    build: (v) => {
      const params = new URLSearchParams();
      ["estado", "idUsuario", "idVehiculo", "idEspacio"].forEach((key) => { if (v[key]) params.set(key, v[key]); });
      const query = params.toString();
      return { path: `/api/v1/tickets${query ? `?${query}` : ""}` };
    },
  },
  {
    id: "tickets-get", method: "GET", path: "/api/v1/tickets/{id}", perm: "CLIENTE/RECAUDADOR/ADMIN",
    desc: "Obtiene un ticket por UUID.",
    hint: `<ul><li>200 con el ticket.</li><li>403 si CLIENTE intenta ver uno ajeno.</li></ul>`,
    fields: [{ name: "id", label: "Ticket UUID", type: "text", required: true }],
    build: (v) => ({ path: `/api/v1/tickets/${v.id}` }),
  },
  {
    id: "tickets-create", method: "POST", path: "/api/v1/tickets", perm: "RECAUDADOR/ADMIN",
    desc: "Emite un ticket de ingreso y ocupa el espacio.",
    hint: `<ul><li>201 con ticket ACTIVO.</li><li>409 si el vehículo ya tiene ticket activo o el espacio no está disponible.</li></ul>`,
    fields: [
      { name: "idEspacio", label: "Espacio UUID", type: "text", required: true },
      { name: "idVehiculo", label: "Vehículo UUID", type: "text", value: "" },
      { name: "placa", label: "Placa", type: "text", value: "ABC-1234" },
    ],
    build: (v) => ({ body: { idEspacio: v.idEspacio, idVehiculo: v.idVehiculo || undefined, placa: v.placa || undefined } }),
  },
  {
    id: "tickets-pay", method: "PATCH", path: "/api/v1/tickets/{id}/pagar", perm: "RECAUDADOR/ADMIN",
    desc: "Registra salida, calcula valor recaudado y libera el espacio.",
    hint: `<ul><li>200 con ticket PAGADO.</li><li>409 si el ticket no está ACTIVO.</li></ul>`,
    fields: [{ name: "id", label: "Ticket UUID", type: "text", required: true }],
    build: (v) => ({ path: `/api/v1/tickets/${v.id}/pagar` }),
  },
  {
    id: "tickets-cancel", method: "PATCH", path: "/api/v1/tickets/{id}/cancelar", perm: "RECAUDADOR/ADMIN",
    desc: "Cancela un ticket activo, deja valor 0 y libera el espacio.",
    hint: `<ul><li>200 con ticket CANCELADO.</li><li>409 si el ticket no está ACTIVO.</li></ul>`,
    fields: [{ name: "id", label: "Ticket UUID", type: "text", required: true }],
    build: (v) => ({ path: `/api/v1/tickets/${v.id}/cancelar` }),
  },
];

export const SECTIONS = {
  auth: { title: "Autenticación", lead: "Endpoints públicos del servicio <strong>usuarios</strong>. Login y registro guardan la sesión automáticamente.", endpoints: AUTH_ENDPOINTS },
  usuarios: { title: "Usuarios", lead: "Gestión de usuarios. Sólo <strong>ADMIN</strong>.", endpoints: USUARIOS_ENDPOINTS },
  personas: { title: "Personas", lead: "CRUD de personas. Sólo <strong>ADMIN</strong>.", endpoints: PERSONAS_ENDPOINTS },
  roles: { title: "Roles", lead: "CRUD de roles. Sólo <strong>ADMIN</strong>.", endpoints: ROLES_ENDPOINTS },
  zonas: { title: "Zonas", lead: "Gestión de zonas de parking. <strong>CLIENTE</strong> y <strong>RECAUDADOR</strong> leen; <strong>ADMIN</strong> escribe.", endpoints: ZONAS_ENDPOINTS },
  espacios: { title: "Espacios", lead: "Gestión de espacios dentro de zonas. <strong>CLIENTE</strong> y <strong>RECAUDADOR</strong> leen; <strong>ADMIN</strong> escribe.", endpoints: ESPACIOS_ENDPOINTS },
  vehiculos: { title: "Vehículos", lead: "Gestión de vehículos. <strong>CLIENTE</strong> opera los propios; <strong>RECAUDADOR</strong> consulta; <strong>ADMIN</strong> opera todos.", endpoints: VEHICULOS_ENDPOINTS },
  tickets: { title: "Tickets", lead: "Emisión, pago y cancelación de tickets. <strong>RECAUDADOR</strong> opera entradas y salidas.", endpoints: TICKETS_ENDPOINTS },
};
