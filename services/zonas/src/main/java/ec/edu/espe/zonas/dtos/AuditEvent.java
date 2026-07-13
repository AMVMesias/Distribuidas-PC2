package ec.edu.espe.zonas.dtos;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuditEvent {
    private String servicio;
    private String accion; // "CREATE", "UPDATE", "DELETE"
    private String entidad;
    private Object datos;
    private String usuario;
    private String rol;
    private String ip;
    private String mac;
}
