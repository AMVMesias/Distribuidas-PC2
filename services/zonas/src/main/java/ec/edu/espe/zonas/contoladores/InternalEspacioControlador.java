package ec.edu.espe.zonas.contoladores;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import ec.edu.espe.zonas.dtos.EspaciosResponseDto;
import ec.edu.espe.zonas.entidades.EstadoEspacio;
import ec.edu.espe.zonas.servicio.EspacioServicio;
import io.swagger.v3.oas.annotations.Hidden;

@RestController
@RequestMapping("/api/v1/internal/espacios")
@Profile("!test")
@Hidden
public class InternalEspacioControlador {

    private final EspacioServicio espacioServicio;
    private final String internalToken;

    public InternalEspacioControlador(
            EspacioServicio espacioServicio,
            @Value("${app.internal.service-token:change-me-internal-token}") String internalToken) {
        this.espacioServicio = espacioServicio;
        this.internalToken = internalToken;
    }

    @GetMapping("/{idEspacio}")
    public EspaciosResponseDto obtenerEspacio(
            @PathVariable UUID idEspacio,
            @RequestHeader(name = "X-Internal-Service-Token", required = false) String receivedToken) {
        validarToken(receivedToken);
        return espacioServicio.obtenerEspacioPorId(idEspacio);
    }

    @PatchMapping("/{idEspacio}/estado/{estado}")
    public EspaciosResponseDto cambiarEstado(
            @PathVariable UUID idEspacio,
            @PathVariable String estado,
            @RequestHeader(name = "X-Internal-Service-Token", required = false) String receivedToken) {
        validarToken(receivedToken);
        return espacioServicio.cambiarEstado(idEspacio, EstadoEspacio.fromString(estado));
    }

    private void validarToken(String receivedToken) {
        if (!internalToken.equals(receivedToken)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token interno inválido");
        }
    }
}
