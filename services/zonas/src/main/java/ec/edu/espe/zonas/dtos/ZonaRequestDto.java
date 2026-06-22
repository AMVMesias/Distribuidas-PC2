package ec.edu.espe.zonas.dtos;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import ec.edu.espe.zonas.entidades.TipoZona;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZonaRequestDto {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 32, message = "El nombre no puede exceder los 32 caracteres")
    private String nombre;

    private String descripcion;

    @Enumerated(EnumType.STRING)
    private TipoZona tipo;

    private int capacidad;

}
