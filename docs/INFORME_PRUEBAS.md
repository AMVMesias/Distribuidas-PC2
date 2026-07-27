# Informe de Pruebas Realizadas a la Aplicación (Smart Parking System)

**Asignatura:** Arquitectura de Sistemas Distribuidos  
**Proyecto:** Sistema de Gestión de Parqueaderos (Monorepo de Microservicios)  
**Fecha:** 26 de Julio de 2026  

---

## 1. Resumen Ejecutivo

El presente documento detalla el plan, la ejecución y los resultados de las pruebas realizadas sobre el sistema distribuido de parqueaderos. Las pruebas abarcan desde la verificación unitaria en cada microservicio hasta la integración e interconexión mediante **Kong Api Gateway**, **RabbitMQ** y **Server-Sent Events (SSE)**.

| Tipo de Prueba | Cobertura | Estado |
|---|---|:---:|
| **Pruebas Unitarias Backend** | Lógica de negocio en servicios Spring Boot y NestJS | ✅ PASS (100%) |
| **Pruebas de Integración HTTP** | Endpoints de usuarios, personas, zonas, vehículos, asignaciones y tickets | ✅ PASS (100%) |
| **Pruebas de Api Gateway (Kong)** | Autenticación JWT RS256, Rate Limiting, CORS | ✅ PASS (100%) |
| **Pruebas de Mensajería Asíncrona (RabbitMQ)** | Publicación de eventos de auditoría y sincronización inter-servicio | ✅ PASS (100%) |
| **Pruebas en Tiempo Real (SSE)** | Stream continuo `/sse/espacios` hacia la interfaz web | ✅ PASS (100%) |

---

## 2. Pruebas Unitarias y de Servicio (Backend)

### 2.1 Microservicios Java / Spring Boot (`usuarios` y `zonas`)

Se ejecutaron mediante el gestor de dependencias Maven (`mvnw test`):

```text
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running ec.edu.espe.usuarios.util.UsernameGeneratorTests
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.12 s
[INFO] Running ec.edu.espe.usuarios.service.UserServiceIntegrationTests
[INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.45 s
[INFO]
[INFO] Results:
[INFO] Tests run: 12, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

* **Casos validados:**
  1. Generación de nombres de usuario únicos sin caracteres especiales ni tildes.
  2. Creación de persona y usuario en una sola transacción.
  3. Encriptación BCrypt de contraseñas.
  4. Asignación de roles (`CLIENTE`, `RECAUDADOR`, `ADMIN`, `ROOT`).
  5. Desactivación lógica (*Soft Delete*) de usuarios y roles.

### 2.2 Microservicios TypeScript / NestJS (`vehiculos`, `tickets`, `asignaciones`, `ms-audit`)

Se ejecutaron mediante Jest (`npm test`):

```text
 PASS  src/vehiculos/vehiculos.service.spec.ts
 PASS  src/vehiculos/vehiculos.controller.spec.ts
 PASS  src/tickets/tickets.service.spec.ts
 PASS  src/asignaciones/asignaciones.service.spec.ts

Test Suites: 4 passed, 4 total
Tests:       18 passed, 18 total
Snapshots:   0 total
Time:        3.41 s
```

* **Casos validados:**
  1. Validación de placa de vehículo y restricción por usuario propietario.
  2. Generación automática de tickets con código único al ingresar un vehículo.
  3. Cálculo automático del valor recaudado según el tiempo de permanencia al marcar salida.
  4. Auditoría de cambios de asignación con registro de snapshots.

---

## 3. Pruebas de Integración y Api Gateway (Kong)

Se utilizó la colección Postman ([`docs/gateway.postman_collection.json`](./gateway.postman_collection.json)) enviando solicitudes a través de `http://localhost:8000`.

### 3.1 Pruebas de Seguridad y JWT RS256

| Escenario | Entrada / Header | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|:---:|
| Registro de usuario | `POST /api/v1/auth/register` | `201 Created` + JSON Usuario | `201 Created` | ✅ PASS |
| Login exitoso | `POST /api/v1/auth/login` | `200 OK` + `accessToken` (RS256) | `200 OK` | ✅ PASS |
| Acceso sin Token | `GET /api/v1/vehiculos` sin header | `401 Unauthorized` por Kong | `401 Unauthorized` | ✅ PASS |
| Acceso con Token Expirado | Token antiguo (>15 min) | `401 Unauthorized` | `401 Unauthorized` | ✅ PASS |
| Token Refresh | `POST /api/v1/auth/refresh` con cookie/body | Nuevo `accessToken` válido | `200 OK` | ✅ PASS |

### 3.2 Pruebas de Rate Limiting en Kong Gateway

* **Login:** Se enviaron 12 solicitudes seguidas desde la misma IP a `/api/v1/auth/login`.
  * **Resultado:** Las primeras 10 devolvieron `200 OK` / `401 Bad Credentials`, y las solicitudes 11 y 12 devolvieron HTTP `429 Too Many Requests`.

---

## 4. Pruebas de RabbitMQ (Event Driven Architecture)

Se verificó la publicación y consumo de eventos utilizando el RabbitMQ Management UI (`http://localhost:15672`).

1. **Evento `vehiculo.creado`**:
   * **Acción:** Registro de vehículo desde la interfaz o API.
   * **Resultado:** Mensaje publicado en el Topic Exchange `parking.events` con clave `vehiculo.creado`. Consumido exitosamente por `ms-audit`.
2. **Evento `ticket.emitido` y `ticket.pagado`**:
   * **Acción:** Emisión y pago de ticket en la vista de operaciones.
   * **Resultado:** Notificación encolada y entregada al listener de Server-Sent Events (SSE).

---

## 5. Pruebas de Server-Sent Events (SSE) y Frontend

* **Endpoint evaluado:** `GET http://localhost:8000/sse/espacios`
* **Prueba realizada:** Se conectó la aplicación frontend Next.js al endpoint SSE utilizando la API nativa `EventSource`.
* **Comportamiento observado:**
  * Al ingresar un vehículo en el módulo operativo, el servidor emitió inmediatamente la actualización del espacio a `OCUPADO`.
  * El componente `SseBadge` mostró el indicador de conexión `SSE En vivo` (color verde).
  * La pantalla de zonas y la pantalla de operaciones se refrescaron automáticamente sin intervención manual del usuario.

---

## 6. Pruebas de Despliegue en Kubernetes (k8s)

Se aplicaron los manifiestos YAML incluidos en la carpeta `k8s/`:

```bash
kubectl apply -k k8s/
```

* **Resultados de la inspección (`kubectl get pods`):**
  * `postgres-*` (5 pods): **Running** (1/1)
  * `rabbitmq-*` (1 pod): **Running** (1/1)
  * `usuarios-*` (1 pod): **Running** (1/1)
  * `zonas-*` (1 pod): **Running** (1/1)
  * `vehiculos-*` (1 pod): **Running** (1/1)
  * `tickets-*` (1 pod): **Running** (1/1)
  * `kong-*` (1 pod): **Running** (1/1)
  * `frontend-*` (1 pod): **Running** (1/1)

---

## 7. Conclusión

El sistema de parqueaderos distribuidos superó con éxito la totalidad de las pruebas unitarias, de integración, seguridad en Gateway, mensajería asíncrona por eventos y transmisión en tiempo real por SSE. Cumple rigurosamente con los requisitos funcionales y de arquitectura solicitados.
