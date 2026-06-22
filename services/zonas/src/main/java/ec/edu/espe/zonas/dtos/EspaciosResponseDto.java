package ec.edu.espe.zonas.dtos;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import ec.edu.espe.zonas.entidades.EstadoEspacio;
import ec.edu.espe.zonas.entidades.TipoEspacio;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EspaciosResponseDto {
    private UUID id;

    private String codigo;

    private String descripcion;

    private Integer capacidad;

    private TipoEspacio tipo;

    private EstadoEspacio estado;

    private boolean activo;

    private UUID idZona;

    private String nombreZona;

    private LocalDateTime fechaCreacion;

    private LocalDateTime fechaModificacion;

}
