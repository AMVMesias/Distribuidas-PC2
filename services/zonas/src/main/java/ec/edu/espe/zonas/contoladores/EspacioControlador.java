package ec.edu.espe.zonas.contoladores;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ec.edu.espe.zonas.dtos.EspacioRequestDto;
import ec.edu.espe.zonas.dtos.EspaciosResponseDto;
import ec.edu.espe.zonas.entidades.EstadoEspacio;
import ec.edu.espe.zonas.servicio.EspacioServicio;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/espacios")
@RequiredArgsConstructor
public class EspacioControlador {

    private final EspacioServicio espacioServicio;

    @GetMapping
    public ResponseEntity<List<EspaciosResponseDto>> listarEspacios() {
        return ResponseEntity.ok(espacioServicio.obtenerEspacios());
    }

    @GetMapping("/zona/{idZona}")
    public ResponseEntity<List<EspaciosResponseDto>> listarEspaciosPorZona(@PathVariable UUID idZona) {
        return ResponseEntity.ok(espacioServicio.obtenerEspaciosPorZona(idZona));
    }

    @PostMapping
    public ResponseEntity<EspaciosResponseDto> crearEspacio(@Valid @RequestBody EspacioRequestDto request) {
        EspaciosResponseDto resp = espacioServicio.crearEspacio(request);
        return new ResponseEntity<>(resp, HttpStatus.CREATED);
    }

    @PutMapping("/{idEspacio}/estado/{estado}")
    public ResponseEntity<EspaciosResponseDto> cambiarEstado(@PathVariable UUID idEspacio,
            @PathVariable String estado) {
        return ResponseEntity.ok(espacioServicio.cambiarEstado(idEspacio, EstadoEspacio.fromString(estado)));
    }
}
