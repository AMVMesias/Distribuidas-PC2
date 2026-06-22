package ec.edu.espe.zonas.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import ec.edu.espe.zonas.entidades.Espacio;
import ec.edu.espe.zonas.entidades.EstadoEspacio;
import ec.edu.espe.zonas.entidades.TipoEspacio;
import ec.edu.espe.zonas.entidades.Zona;

public interface EspacioRepositorio extends JpaRepository<Espacio, UUID> {
    boolean existsByCodigo(String codigo);

    List<Espacio> findByZona(Zona zona);

    List<Espacio> findByTipoAndEstado(TipoEspacio tipo, EstadoEspacio estado);
}
