package ec.edu.espe.zonas.contoladores;

import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ec.edu.espe.zonas.repositories.EspacioRepositorio;
import ec.edu.espe.zonas.repositories.ZonaRepositorio;
import ec.edu.espe.zonas.entidades.Espacio;
import ec.edu.espe.zonas.entidades.Zona;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/root")
@RequiredArgsConstructor
public class RootZonaControlador {

    private final ZonaRepositorio zonaRepositorio;
    private final EspacioRepositorio espacioRepositorio;

    @DeleteMapping("/zonas/{id}")
    public ResponseEntity<Map<String, String>> physicalDeleteZona(@PathVariable UUID id) {
        Zona zona = zonaRepositorio.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Zona no encontrada: " + id));
        // CascadeType.ALL + orphanRemoval on Zona.espacios handles child deletion
        zonaRepositorio.delete(zona);
        return ResponseEntity.ok(Map.of("message", "Zona y sus espacios eliminados físicamente"));
    }

    @DeleteMapping("/espacios/{id}")
    public ResponseEntity<Map<String, String>> physicalDeleteEspacio(@PathVariable UUID id) {
        Espacio espacio = espacioRepositorio.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Espacio no encontrado: " + id));
        espacioRepositorio.delete(espacio);
        return ResponseEntity.ok(Map.of("message", "Espacio eliminado físicamente"));
    }
}
