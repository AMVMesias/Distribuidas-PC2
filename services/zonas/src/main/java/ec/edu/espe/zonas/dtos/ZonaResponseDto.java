package ec.edu.espe.zonas.dtos;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import ec.edu.espe.zonas.entidades.TipoZona;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZonaResponseDto {
    private UUID id;

    private String codigo;

    private String nombre;

    private String descripcion;

    private int estado;

    private TipoZona tipo;

    private int capacidad;

    private List<EspaciosResponseDto> espacios;

    private LocalDateTime fechaCreacion;

    private LocalDateTime fechaModificacion;
}
