package ec.edu.espe.zonas.servicio;

import ec.edu.espe.zonas.dtos.AuditEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventPublisherService {

    private final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.audit.exchange}")
    private String exchangeName;

    @Value("${app.rabbitmq.audit.routing-key}")
    private String routingKey;

    public void publish(AuditEvent event) {
        try {
            rabbitTemplate.convertAndSend(exchangeName, routingKey, event);
            log.debug("Evento de auditoría publicado exitosamente: {}", event);
        } catch (Exception e) {
            log.warn("No se pudo publicar auditoría: {}", e.getMessage());
        }
    }
}
