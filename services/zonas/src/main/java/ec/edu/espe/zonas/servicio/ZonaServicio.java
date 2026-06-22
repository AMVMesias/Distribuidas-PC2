package ec.edu.espe.zonas.servicio;

import ec.edu.espe.zonas.dtos.ZonaRequestDto;
import ec.edu.espe.zonas.dtos.ZonaResponseDto;

import java.util.List;
import java.util.UUID;

public interface ZonaServicio {

    List<ZonaResponseDto> listarZonas();

    ZonaResponseDto crearZona(ZonaRequestDto zona);

    ZonaResponseDto actualizarZona(UUID idZona, ZonaRequestDto zona);

    ZonaResponseDto desactivarZona(UUID idZona);
}
