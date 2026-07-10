# Plan de Implementación de Auditoría con RabbitMQ (Multi-stack)

Tras un análisis exhaustivo para prevenir errores en un entorno distribuido políglota (NestJS y Spring Boot), se han detectado puntos críticos que podrían causar fallos en producción. El siguiente plan aborda estos riesgos y separa la implementación en fases lógicas.

---

## 1. Prevención de Errores y Validaciones Críticas

Antes de tocar el código, debemos considerar los siguientes fallos potenciales y cómo los mitigaremos:

1. **Incompatibilidad de Serialización (CRÍTICO)**
   - **El Problema:** Por defecto, `RabbitTemplate` en Spring Boot (Java) serializa los objetos utilizando binarios nativos de Java (`application/x-java-serialized-object`). Si enviamos esto, el `JSON.parse(content)` del `ms-audit` (NestJS) fallará catastróficamente provocando que el mensaje se descarte.
   - **La Solución:** En los servicios Java (`usuarios` y `zonas`), debemos configurar explícitamente un Bean de tipo `Jackson2JsonMessageConverter` para que el payload salga como un JSON puro.

2. **Falsos Positivos de Auditoría (Consistencia Transaccional)**
   - **El Problema:** Si publicamos el evento en RabbitMQ antes de que la transacción de base de datos haga *commit*, y luego la base de datos falla (ej. violación de constraint o error de red), RabbitMQ habrá registrado una auditoría de algo que nunca ocurrió.
   - **La Solución (NestJS):** La llamada a `publisher.publish()` debe hacerse *estrictamente después* de `repository.save()` u operaciones similares.
   - **La Solución (Spring Boot):** Es altamente recomendable emitir el evento dentro del servicio, justo después del bloque de persistencia, o utilizando eventos de Spring (`@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`).

3. **Caída por Inaccesibilidad del Broker (Resiliencia)**
   - **El Problema:** Si RabbitMQ está caído temporalmente, los microservicios no deberían bloquearse al iniciar o impedir la operatividad básica (crear un ticket, modificar un usuario).
   - **La Solución:** En NestJS, la conexión debe ser perezosa (*lazy*), inicializando el canal solo cuando se va a enviar el primer evento (como ya hace `EventPublisherService` de `vehiculos`). Envolver el `.publish()` en un `try/catch` que no arroje errores a la petición original. En Spring Boot, `RabbitTemplate` maneja reconexiones en segundo plano de manera transparente, pero debemos asegurarnos de no bloquear el arranque.

4. **Fallo en Pruebas Unitarias (Tests Mocks)**
   - **El Problema:** Al inyectar el `EventPublisherService` en los servicios core, los archivos `*.spec.ts` y `@SpringBootTest` intentarán conectarse a RabbitMQ, rompiendo los pipelines de CI o tests locales si no hay broker disponible.
   - **La Solución:** Proveer mocks explícitos del publicador en los módulos de prueba de cada servicio modificado.

5. **Ausencia del Exchange**
   - **El Problema:** Si un publicador arranca antes que `ms-audit` y el Exchange `audit_exchange` no existe, el mensaje se perderá o lanzará error.
   - **La Solución:** Todos los publicadores deben afirmar/declarar (`assertExchange` en TS, o `@Bean TopicExchange` en Java) la existencia del Exchange antes de publicar, garantizando que esté disponible sin importar el orden de encendido de los microservicios.

---

## 2. Plan por Fases

### Fase 1: Integración en Microservicios NestJS (`asignaciones` y `tickets`)

Dado que ya tenemos la plantilla de `vehiculos`, esta es la fase más segura.

1. **Dependencias:** Instalar `amqplib` y `@types/amqplib`.
2. **Infraestructura:** Copiar el `EventPublisherService` de vehículos (mantiene la conexión lazy y la declaración de Exchange `assertExchange`).
3. **Mocks para Tests:** Actualizar todos los `*.spec.ts` vinculados a los servicios agregando `{ provide: EventPublisherService, useValue: { publish: jest.fn() } }`.
4. **Lógica de Negocio:** 
   - Modificar las firmas de los métodos de mutación para aceptar el `AuditRequestContext`.
   - Incluir el `try/catch` de publicación al final del flujo exitoso (post DB save).
5. **Controladores:** Inyectar la IP usando `@Req() req` extraída del objeto de Express (validando si "trust proxy" está activado).

### Fase 2: Integración en Microservicios Spring Boot (`usuarios` y `zonas`)

Requiere mayor configuración debido a la serialización por defecto de Spring AMQP.

1. **Dependencias:** Añadir `<dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-amqp</artifactId></dependency>` en el `pom.xml`.
2. **Configuración AMQP (`RabbitMQConfig.java`):**
   - Crear un `@Configuration`.
   - Definir `@Bean public TopicExchange auditExchange() { return new TopicExchange("audit_exchange"); }`.
   - Definir `@Bean public MessageConverter jsonMessageConverter() { return new Jackson2JsonMessageConverter(); }`.
   - Definir `@Bean public RabbitTemplate rabbitTemplate(ConnectionFactory factory, MessageConverter converter)` asociando el converter JSON.
3. **DTO (`AuditEvent.java` o `record`):**
   - Mapear la estructura exacta esperada por NestJS: `servicio`, `accion`, `entidad`, `datos` (`Map<String, Object>`), `usuario`, `rol`, `ip`, `mac`.
4. **Lógica de Negocio:**
   - Inyectar `RabbitTemplate` en los servicios de dominio y enviar mediante `rabbitTemplate.convertAndSend("audit_exchange", "audit_event", auditEvent)`. 
5. **Controladores:**
   - Añadir `HttpServletRequest request` a la firma del controlador.
   - Extraer `request.getRemoteAddr()` para el rastreo de IP y enviarlo al servicio.

### Fase 3: Pruebas End-to-End y CI/CD

1. Levantar la infraestructura completa (`docker-compose up -d rabbitmq kong db`).
2. Levantar el servicio consumidor central: `ms-audit`.
3. Disparar peticiones REST a las APIs de `usuarios` (Java) y a `tickets` (TypeScript) utilizando Postman.
4. Monitorear los logs de `ms-audit` para validar:
   - Que los mensajes JSON emitidos por Spring Boot se deserializan sin errores (ausencia de errores de parseo binario).
   - Que todos los payloads pasan la barrera de `class-validator` del `CreateAuditEventDto`.
   - Inclusión correcta de la IP original y el usuario.
