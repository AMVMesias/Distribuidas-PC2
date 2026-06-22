package ec.edu.espe.zonas.servicio.imp;

import ec.edu.espe.zonas.dtos.EspacioRequestDto;
import ec.edu.espe.zonas.dtos.EspaciosResponseDto;
import ec.edu.espe.zonas.entidades.Espacio;
import ec.edu.espe.zonas.entidades.EstadoEspacio;
import ec.edu.espe.zonas.entidades.Zona;
import ec.edu.espe.zonas.repositories.EspacioRepositorio;
import ec.edu.espe.zonas.repositories.ZonaRepositorio;
import ec.edu.espe.zonas.servicio.EspacioServicio;
import ec.edu.espe.zonas.utils.UtilsMappers;
import jakarta.persistence.PersistenceException;
import org.springframework.http.HttpStatus;
import org.springframework.orm.jpa.JpaSystemException;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EspacioServicioImp implements EspacioServicio {

    private final EspacioRepositorio repositorioEspacio;
    private final ZonaRepositorio zonaRepositorio;
    private final UtilsMappers mapper;

    @Override
    @Transactional(readOnly = true)
    public List<EspaciosResponseDto> obtenerEspacios() {
        return repositorioEspacio.findAll().stream()
                .map(mapper::toResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<EspaciosResponseDto> obtenerEspaciosPorZona(UUID idZona) {
        Zona zona = zonaRepositorio.findById(idZona)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Zona no encontrada con id: " + idZona));

        return repositorioEspacio.findByZona(zona).stream()
                .map(mapper::toResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public EspaciosResponseDto crearEspacio(EspacioRequestDto dto) {
        Zona objZona = zonaRepositorio.findById(dto.getIdZona())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Zona no encontrada con id: " + dto.getIdZona()));

        if (objZona.getEstado() != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No se puede crear un espacio en una zona inactiva");
        }

        String codigo = dto.getCodigo().trim().toUpperCase(Locale.ROOT);
        if (repositorioEspacio.existsByCodigo(codigo)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un espacio con el mismo codigo");
        }

        Espacio nuevoEspacio = mapper.toEntityEspacio(dto);
        LocalDateTime ahora = LocalDateTime.now();
        nuevoEspacio.setCodigo(codigo);
        nuevoEspacio.setZona(objZona);
        nuevoEspacio.setActivo(true);
        nuevoEspacio.setEstado(EstadoEspacio.DISPONIBLE); // Por defecto, el nuevo espacio estará disponible
        nuevoEspacio.setFechaCreacion(ahora);
        nuevoEspacio.setFechaActualizacion(ahora);

        Espacio espacioSaved = guardarEspacio(nuevoEspacio);

        return mapper.toResponseDto(espacioSaved);
    }

    @Override
    public EspaciosResponseDto actualizarEspacio(EspacioRequestDto dto, UUID idEspacio) {
        return null;
    }

    @Override
    public void eliminiarEspacio(UUID idEspacio) {

    }

    @Override
    @Transactional
    public EspaciosResponseDto cambiarEstado(UUID idEspacio, EstadoEspacio estado) {
        Espacio espacio = repositorioEspacio.findById(idEspacio)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Espacio no encontrado con id: " + idEspacio));
        espacio.setEstado(estado);
        espacio.setActivo(estado != EstadoEspacio.FUERA_DE_SERVICIO);
        espacio.setFechaActualizacion(LocalDateTime.now());
        Espacio espacioSaved = guardarEspacio(espacio);
        return mapper.toResponseDto(espacioSaved);
    }

    @Override
    public List<EspaciosResponseDto> obtenerEspacioPorEstado(EstadoEspacio estado) {
        return List.of();
    }

    @Override
    public List<EspaciosResponseDto> obtenerEspacioPorZonaEsgtado(EstadoEspacio estado) {
        return List.of();
    }

    private Espacio guardarEspacio(Espacio espacio) {
        try {
            return repositorioEspacio.saveAndFlush(espacio);
        } catch (RuntimeException ex) {
            throw traducirErrorBaseDatos(ex);
        }
    }

    private ResponseStatusException traducirErrorBaseDatos(RuntimeException ex) {
        String mensaje = obtenerMensajeRaiz(ex);

        if (mensaje.contains("(codigo)") || mensaje.contains("codigo")) {
            return new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un espacio con el mismo codigo", ex);
        }
        if (ex instanceof PersistenceException || ex instanceof JpaSystemException) {
            return new ResponseStatusException(HttpStatus.CONFLICT, mensaje, ex);
        }

        return new ResponseStatusException(HttpStatus.CONFLICT, mensaje, ex);
    }

    private String obtenerMensajeRaiz(Throwable ex) {
        Throwable actual = ex;
        while (actual.getCause() != null) {
            actual = actual.getCause();
        }
        return actual.getMessage() == null ? "La base de datos rechazo la operacion" : actual.getMessage();
    }
}
