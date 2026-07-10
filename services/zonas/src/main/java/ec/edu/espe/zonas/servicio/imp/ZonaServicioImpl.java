package ec.edu.espe.zonas.servicio.imp;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Map;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import jakarta.servlet.http.HttpServletRequest;
import ec.edu.espe.zonas.dtos.AuditEvent;
import ec.edu.espe.zonas.servicio.EventPublisherService;

import jakarta.persistence.EntityManager;
import jakarta.persistence.ParameterMode;
import jakarta.persistence.PersistenceException;
import jakarta.persistence.StoredProcedureQuery;
import org.springframework.http.HttpStatus;
import org.springframework.orm.jpa.JpaSystemException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import ec.edu.espe.zonas.dtos.EspaciosResponseDto;
import ec.edu.espe.zonas.dtos.ZonaRequestDto;
import ec.edu.espe.zonas.dtos.ZonaResponseDto;
import ec.edu.espe.zonas.entidades.TipoZona;
import ec.edu.espe.zonas.entidades.Zona;
import ec.edu.espe.zonas.repositories.ZonaRepositorio;
import ec.edu.espe.zonas.servicio.ZonaServicio;
import ec.edu.espe.zonas.utils.UtilsMappers;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ZonaServicioImpl implements ZonaServicio {

    private static final int ESTADO_ACTIVO = 1;

    private final ZonaRepositorio zonaRepositorio;
    private final EntityManager entityManager;
    private final UtilsMappers utilsMappers;
    private final EventPublisherService eventPublisher;
    private final HttpServletRequest request;

    @Override
    @Transactional(readOnly = true)
    public List<ZonaResponseDto> listarZonas() {
        return zonaRepositorio.findByEstado(ESTADO_ACTIVO)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ZonaResponseDto crearZona(ZonaRequestDto zona) {
        validarRequest(zona);

        Zona objZona = new Zona();
        LocalDateTime ahora = LocalDateTime.now();

        objZona.setNombre(zona.getNombre().trim());
        objZona.setDescripcion(zona.getDescripcion());
        objZona.setCodigo(generarCodigoZona(zona.getNombre(), zona.getTipo()));
        objZona.setEstado(ESTADO_ACTIVO);
        objZona.setTipo(zona.getTipo());
        objZona.setCapacidad(zona.getCapacidad());
        objZona.setFechaCreacion(ahora);
        objZona.setFechaModificacion(ahora);

        ZonaResponseDto response = toResponse(guardarZona(objZona));
        emitRabbitEvent("CREATE", "ZONA", response);
        return response;
    }

    @Override
    @Transactional
    public ZonaResponseDto actualizarZona(UUID idZona, ZonaRequestDto zona) {
        validarRequest(zona);

        Zona objZona = zonaRepositorio.findById(idZona)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Zona no encontrada"));

        if (objZona.getEstado() != ESTADO_ACTIVO) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No se puede actualizar una zona inactiva");
        }

        objZona.setNombre(zona.getNombre().trim());
        objZona.setDescripcion(zona.getDescripcion());
        objZona.setTipo(zona.getTipo());
        objZona.setCapacidad(zona.getCapacidad());
        objZona.setFechaModificacion(LocalDateTime.now());

        ZonaResponseDto response = toResponse(guardarZona(objZona));
        emitRabbitEvent("UPDATE", "ZONA", response);
        return response;
    }

    @Override
    @Transactional
    public ZonaResponseDto desactivarZona(UUID idZona) {
        ejecutarProcedureDesactivarZona(idZona);
        entityManager.clear();

        ZonaResponseDto response = zonaRepositorio.findById(idZona)
                .map(this::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Zona no encontrada"));
        
        emitRabbitEvent("DELETE", "ZONA", response);
        return response;
    }

    private ZonaResponseDto toResponse(Zona objZona) {
        return ZonaResponseDto.builder()
                .id(objZona.getId())
                .codigo(objZona.getCodigo())
                .nombre(objZona.getNombre())
                .descripcion(objZona.getDescripcion())
                .estado(objZona.getEstado())
                .tipo(objZona.getTipo())
                .capacidad(objZona.getCapacidad())
                .espacios(mapearEspacios(objZona))
                .fechaCreacion(objZona.getFechaCreacion())
                .fechaModificacion(objZona.getFechaModificacion())
                .build();
    }

    private List<EspaciosResponseDto> mapearEspacios(Zona objZona) {
        if (objZona.getEspacios() == null) {
            return List.of();
        }
        return objZona.getEspacios()
                .stream()
                .map(utilsMappers::toResponseDto)
                .collect(Collectors.toList());
    }

    private String generarCodigoZona(String nombre, TipoZona tipoZona) {
        String inicialNombre = nombre.trim().substring(0, 1).toUpperCase();
        String inicialTipo = tipoZona.name().substring(0, 1).toUpperCase();
        String fechaHora = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        for (int intento = 0; intento < 5; intento++) {
            String sufijo = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
            String codigo = String.format("ZON-%s%s-%s-%s", inicialNombre, inicialTipo, fechaHora, sufijo);
            if (!zonaRepositorio.existsByCodigo(codigo)) {
                return codigo;
            }
        }

        throw new ResponseStatusException(HttpStatus.CONFLICT, "No se pudo generar un codigo unico para la zona");
    }

    private void validarRequest(ZonaRequestDto zona) {
        if (zona == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La zona es obligatoria");
        }
        if (zona.getNombre() == null || zona.getNombre().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre de la zona es obligatorio");
        }
        if (zona.getTipo() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El tipo de zona es obligatorio");
        }
    }

    private Zona guardarZona(Zona zona) {
        try {
            return zonaRepositorio.saveAndFlush(zona);
        } catch (RuntimeException ex) {
            throw traducirErrorBaseDatos(ex);
        }
    }

    private void ejecutarProcedureDesactivarZona(UUID idZona) {
        try {
            StoredProcedureQuery procedure = entityManager.createStoredProcedureQuery("desactivar_zona");
            procedure.registerStoredProcedureParameter(1, UUID.class, ParameterMode.IN);
            procedure.setParameter(1, idZona);
            procedure.execute();
        } catch (RuntimeException ex) {
            throw traducirErrorBaseDatos(ex);
        }
    }

    private ResponseStatusException traducirErrorBaseDatos(RuntimeException ex) {
        String mensaje = obtenerMensajeRaiz(ex);

        if (mensaje.contains("Zona no encontrada")) {
            return new ResponseStatusException(HttpStatus.NOT_FOUND, mensaje, ex);
        }
        if (mensaje.contains("ux_zonas_nombre_activo")) {
            return new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una zona activa con el mismo nombre", ex);
        }
        if (mensaje.contains("ux_zonas_codigo_activo")) {
            return new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una zona activa con el mismo codigo", ex);
        }
        if (ex instanceof PersistenceException || ex instanceof JpaSystemException) {
            return new ResponseStatusException(HttpStatus.CONFLICT, mensaje, ex);
        }

        return new ResponseStatusException(HttpStatus.CONFLICT, mensaje, ex);
    }

    private String obtenerMensajeRaiz(Throwable ex) {
        Throwable actual = ex;
        while (actual.getCause() != null) {
            actual = actual.getCause();
        }
        return actual.getMessage() == null ? "La base de datos rechazo la operacion" : actual.getMessage();
    }

    private void emitRabbitEvent(String accion, String entidad, Object datos) {
        String username = "SYSTEM";
        String rol = "USER";
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            username = jwt.getClaimAsString("preferred_username");
            if (username == null) username = jwt.getSubject();
            List<String> roles = jwt.getClaimAsStringList("roles");
            if (roles != null && !roles.isEmpty()) {
                rol = String.join(",", roles);
            }
        }

        String ip = "127.0.0.1";
        if (request != null) {
            ip = request.getRemoteAddr();
            if (ip == null || "0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) ip = "127.0.0.1";
            if (ip.startsWith("::ffff:")) ip = ip.replace("::ffff:", "");
        }

        AuditEvent event = AuditEvent.builder()
                .servicio("ms-zonas")
                .accion(accion)
                .entidad(entidad)
                .datos(datos)
                .usuario(username)
                .rol(rol)
                .ip(ip)
                .mac("00:00:00:00:00:00")
                .build();
        eventPublisher.publish(event);
    }
}
