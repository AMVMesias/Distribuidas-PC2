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

import ec.edu.espe.zonas.dtos.ZonaRequestDto;
import ec.edu.espe.zonas.dtos.ZonaResponseDto;
import ec.edu.espe.zonas.servicio.ZonaServicio;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/v1/zonas")
@RequiredArgsConstructor
public class ZonaControlador {

    private final ZonaServicio zonaServicio;

    @GetMapping
    public ResponseEntity<List<ZonaResponseDto>> listarZonas(){
        return ResponseEntity.ok(zonaServicio.listarZonas());
    }

    @PostMapping
    public ResponseEntity<ZonaResponseDto> crearZona(@Valid @RequestBody ZonaRequestDto request){
        ZonaResponseDto resp = zonaServicio.crearZona(request);
        return new ResponseEntity<>(resp, HttpStatus.CREATED);
    }

    @PutMapping("/{idZonas}/desactivar")
    public ResponseEntity<ZonaResponseDto> desactivarZona(@PathVariable UUID idZonas){
        return ResponseEntity.ok(zonaServicio.desactivarZona(idZonas));
    }

    @PutMapping("/{idZonas}")
    public ResponseEntity<ZonaResponseDto> actualizarZona(@PathVariable UUID idZonas, @Valid @RequestBody ZonaRequestDto request){
       return ResponseEntity.ok(zonaServicio.actualizarZona(idZonas, request));
    }

}
