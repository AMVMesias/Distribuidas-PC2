package ec.edu.espe.zonas.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import ec.edu.espe.zonas.entidades.Zona;

public interface ZonaRepositorio extends JpaRepository<Zona, UUID> {
    boolean existsByCodigo(String codigo);

    boolean existsByNombre(String nombre);

    List<Zona> findByEstado(int estado);
}
