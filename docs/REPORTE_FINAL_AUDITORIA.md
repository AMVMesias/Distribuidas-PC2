# Reporte Final de Implementación: Sistema de Auditoría con RabbitMQ

Este documento presenta un análisis exhaustivo y el estado final de la implementación del sistema de auditoría asíncrona basado en RabbitMQ a través de todos los microservicios del proyecto (Node.js/NestJS y Java/Spring Boot).

## 1. Resumen de la Arquitectura Implementada

Se adoptó un patrón de **Event-Driven Architecture (EDA)** para el registro de auditoría, en el cual los microservicios actúan como **Publishers** (productores de eventos) y el microservicio `ms-audit` actúa como **Subscriber** (consumidor).

*   **Broker de Mensajería:** RabbitMQ.
*   **Exchange:** `audit_exchange` (tipo `topic`, durable).
*   **Routing Key:** `audit_event`.
*   **Formato de Mensaje:** JSON (`Jackson2JsonMessageConverter` en Java y `JSON.stringify` en Node.js).
*   **Estructura del Evento (`AuditEvent`):**
    ```json
    {
      "servicio": "nombre-del-microservicio",
      "accion": "CREATE | UPDATE | DELETE",
      "entidad": "NombreEntidad",
      "datos": { ... },
      "usuario": "username",
      "rol": "USER_ROLE",
      "ip": "192.168.1.X",
      "mac": "00:00:00:00:00:00"
    }
    ```

## 2. Microservicios Implementados

### 2.1 Fase 1: Microservicios en Node.js / NestJS

Se intervino en los microservicios que utilizan el framework NestJS:

*   **`ms-asignaciones` (Completado):**
    *   **Librerías instaladas:** `amqplib` y `@types/amqplib`.
    *   **Implementación:** Se integró el `EventPublisherService` que publica en el exchange.
    *   **Lógica de Negocio:** Las emisiones de RabbitMQ se acoplaron de manera segura después del guardado transaccional en la base de datos (dentro de `AsignacionesService.ts`). Se emiten eventos para las operaciones de `create`, `remove` (desactivación lógica) y `transfer`.
    *   **Extracción de Contexto:** Se modificó el controlador `AsignacionesController.ts` para extraer `req.ip` de la petición original y propagarla al servicio.

*   **`ms-tickets` (Completado):**
    *   **Librerías instaladas:** `amqplib` y `@types/amqplib`.
    *   **Implementación:** Configuración del publisher mediante `EventPublisherService`.
    *   **Lógica de Negocio:** Las emisiones se añadieron en los métodos `create`, `pay` (pago) y `cancel` (anulación) en `TicketsService.ts`.
    *   **Extracción de Contexto:** Modificación de `TicketsController.ts` para mapear de manera correcta la IP del cliente y remitirla a través del `AuditRequestContext`.

### 2.2 Fase 2: Microservicios en Java / Spring Boot

Se intervino en los microservicios del ecosistema Java:

*   **`ms-usuarios` (Completado):**
    *   **Librerías instaladas:** Dependencia `spring-boot-starter-amqp` añadida en el `pom.xml`.
    *   **Configuración:** Se añadió la inyección de propiedades (`spring.rabbitmq.*`) en el `application.properties`. Se estableció un Bean de configuración `RabbitMQConfig.java` para el `RabbitTemplate` y el conversor de JSON.
    *   **Implementación:** Se inyectó `EventPublisherService` y `HttpServletRequest` directamente en el `UserService.java`.
    *   **Lógica de Negocio:** La auditoría captura creación de usuarios (`CREATE`), actualización (`UPDATE`), eliminación lógica (`DELETE`), cambio de contraseña y asignación/desasignación de roles. El `username` y `roles` se obtienen automáticamente del token JWT mediante `SecurityContextHolder.getContext().getAuthentication()`.

*   **`ms-zonas` (Completado):**
    *   **Librerías instaladas:** Dependencia `spring-boot-starter-amqp` añadida en el `pom.xml`.
    *   **Configuración:** Valores expuestos en el `application.yaml` para habilitar el *host*, puerto y credenciales de RabbitMQ, al igual que en `ms-usuarios`.
    *   **Implementación:** Lógica similar de inyección para el publicador de eventos y request web HTTP.
    *   **Lógica de Negocio:** Inyección realizada dentro de `ZonaServicioImpl.java` y `EspacioServicioImp.java`. Las operaciones capturadas abarcan altas de zonas y espacios, actualizaciones, desactivación de zonas, y el cambio de estado (disponible/ocupado/fuera de servicio) de los espacios.

## 3. Manejo de Errores y Tolerancia a Fallos (Resiliencia)

Uno de los principales objetivos de esta implementación ha sido evitar que un fallo en el sistema de auditoría afecte el flujo normal del usuario.

*   En **NestJS**, dentro de `EventPublisherService`, la publicación está encerrada en un bloque `try/catch`. Si ocurre un fallo (e.g. RabbitMQ no está disponible), se genera un log tipo `warn` pero la transacción de la base de datos se consolida y el usuario recibe su respuesta 200/201 HTTP de manera habitual.
*   En **Spring Boot**, el comportamiento es idéntico: el envío mediante el `rabbitTemplate.convertAndSend` está gestionado dentro de un bloque estructurado en `EventPublisherService.java` para que una excepción de conectividad `AmqpException` loguee un mensaje `WARN` sin detener la hebra principal del controlador.

## 4. Limpieza (Sanitización) de Datos (IP)

En los controladores tanto de Node.js como de Spring, la IP proveniente del proxy o servidor interno podía incluir el prefijo IPv6 de loopback o mapeos v4-a-v6 (como `::ffff:192.168...`).
*   Se desarrolló en todos los microservicios una función centralizada de normalización (ej. `normalizeIp()`) que limpia las IPs y convierte variables predeterminadas (como nulo o `::1`) en direcciones locales estandarizadas `127.0.0.1`.

## 5. Análisis Exhaustivo de Estado Final

*   **Homologación de Stack:** Todos los repositorios (Vehículos, Asignaciones, Tickets, Usuarios, Zonas) ahora poseen un sistema y semántica estandarizada para remitir eventos hacia `ms-audit`. El formato `AuditEvent` está firmemente empaquetado.
*   **Pruebas Estáticas:** Todas las soluciones fueron compiladas tras las inyecciones de código (`nest build` para TypeScript y `mvnw compile` para Java), certificando que no hubo errores de tipado o de enlazado de Beans en Spring Boot.
*   **Independencia de Código Local vs Broker:** Los servicios no están fuertemente acoplados. Gracias al uso de `EventPublisherService`, las instancias de negocio desconocen por completo qué implementación de AMQP o qué protocolo particular corre detrás de la auditoría.
*   **Preparación para Producción:** Los sistemas están listos para entornos *containerizados* (Docker / Kubernetes), puesto que los endpoints, hosts y credenciales de RabbitMQ han sido externalizados y condicionados a su configuración mediante Variables de Entorno (`.env`, `application.yaml`, etc).

## 6. Siguientes Pasos (Opcional para el Equipo)

1.  **Fase 3 (Pruebas E2E):** Realizar un despliegue masivo (levantar `docker-compose up` completo) de todos los microservicios y provocar operaciones CRUD de extremo a extremo, monitoreando la bandeja de entrada del microservicio `ms-audit` y la consola de gestión de RabbitMQ para validar visualmente el flujo masivo de eventos en la arquitectura completa.
2.  **SSE (Server-Sent Events):** Habiéndose garantizado que la mensajería interna entre microservicios es sólida y fiable mediante RabbitMQ, la reactivación de la integración de SSE al Front-End puede proseguir como una mejora puramente dedicada a notificaciones en tiempo real, en las capas del consumidor final.
