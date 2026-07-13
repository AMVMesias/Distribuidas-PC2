package ec.edu.espe.zonas.servicio;

import ec.edu.espe.zonas.dtos.AuditEvent;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventPublisherService {

    private final RabbitTemplate rabbitTemplate;
    private final ObjectProvider<HttpServletRequest> requestProvider;

    @Value("${app.rabbitmq.audit.exchange}")
    private String exchangeName;

    @Value("${app.rabbitmq.audit.routing-key}")
    private String routingKey;

    public void publish(String action, String entity, Object data) {
        AuditEvent event = AuditEvent.builder()
                .servicio("ms-zonas")
                .accion(action)
                .entidad(entity)
                .datos(data)
                .usuario(username())
                .rol(role())
                .ip(clientIp())
                .build();

        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    send(event);
                }
            });
            return;
        }
        send(event);
    }

    private void send(AuditEvent event) {
        try {
            rabbitTemplate.convertAndSend(exchangeName, routingKey, event);
            log.debug("Evento de auditoría publicado: {}/{}", event.getServicio(), event.getEntidad());
        } catch (Exception exception) {
            log.warn("No se pudo publicar auditoría: {}", exception.getMessage());
        }
    }

    private String username() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) return "SYSTEM";
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            String username = jwt.getClaimAsString("username");
            return username != null && !username.isBlank() ? username : jwt.getSubject();
        }
        return authentication.getName() == null ? "SYSTEM" : authentication.getName();
    }

    private String role() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) return "SYSTEM";
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            List<String> roles = jwt.getClaimAsStringList("roles");
            if (roles != null && !roles.isEmpty()) return String.join(",", roles);
        }
        return authentication.getAuthorities().stream()
                .map(authority -> authority.getAuthority().replaceFirst("^ROLE_", ""))
                .findFirst()
                .orElse("USER");
    }

    private String clientIp() {
        HttpServletRequest request = requestProvider.getIfAvailable();
        if (request == null) return "127.0.0.1";
        String forwarded = request.getHeader("X-Forwarded-For");
        String ip = forwarded == null || forwarded.isBlank()
                ? request.getRemoteAddr()
                : forwarded.split(",")[0].trim();
        return normalizeIp(ip);
    }

    private String normalizeIp(String ip) {
        if (ip == null || ip.isBlank() || "::1".equals(ip) || "0:0:0:0:0:0:0:1".equals(ip)) {
            return "127.0.0.1";
        }
        return ip.startsWith("::ffff:") ? ip.substring(7) : ip;
    }
}
