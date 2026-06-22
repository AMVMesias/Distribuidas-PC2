package ec.edu.espe.zonas.utils;

import ec.edu.espe.zonas.dtos.EspacioRequestDto;
import ec.edu.espe.zonas.dtos.EspaciosResponseDto;
import ec.edu.espe.zonas.entidades.Espacio;
import org.springframework.stereotype.Component;

@Component
public class UtilsMappers {

    public EspaciosResponseDto toResponseDto(Espacio objEspacio) {
        if (objEspacio == null) return null;

        return EspaciosResponseDto.builder()
                .id(objEspacio.getId())
                .codigo(objEspacio.getCodigo())
                .descripcion(objEspacio.getDescripcion())
                .capacidad(objEspacio.getCapacidad())
                .tipo(objEspacio.getTipo())
                .estado(objEspacio.getEstado())
                .activo(objEspacio.isActivo())
                .idZona(objEspacio.getZona().getId())
                .nombreZona(objEspacio.getZona().getNombre())
                .fechaCreacion(objEspacio.getFechaCreacion())
                .fechaModificacion(objEspacio.getFechaActualizacion())
                .build();
    }

    public Espacio toEntityEspacio(EspacioRequestDto requestDto) {
        if (requestDto == null) return null;

        return Espacio.builder()
                .codigo(requestDto.getCodigo())
                .descripcion(requestDto.getDescripcion())
                .capacidad(requestDto.getCapacidad())
                .tipo(requestDto.getTipo())
                .estado(requestDto.getEstado())
                .build();
    }
}
