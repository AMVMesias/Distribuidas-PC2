package ec.edu.espe.zonas.servicio;

import ec.edu.espe.zonas.dtos.EspacioRequestDto;
import ec.edu.espe.zonas.dtos.EspaciosResponseDto;
import ec.edu.espe.zonas.entidades.EstadoEspacio;

import java.util.List;
import java.util.UUID;

public interface EspacioServicio {

    EspaciosResponseDto crearEspacio(EspacioRequestDto dto);

    EspaciosResponseDto actualizarEspacio(EspacioRequestDto dto, UUID idEspacio);

    List<EspaciosResponseDto> obtenerEspacios();

    List<EspaciosResponseDto> obtenerEspaciosPorZona(UUID idZona);

    void eliminiarEspacio(UUID idEspacio);

    EspaciosResponseDto cambiarEstado(UUID idEspacio, EstadoEspacio estado);

    List<EspaciosResponseDto> obtenerEspacioPorEstado(EstadoEspacio estado);

    List<EspaciosResponseDto> obtenerEspacioPorZonaEsgtado(EstadoEspacio estado);

}
