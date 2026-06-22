package ec.edu.espe.usuarios.repository;

import ec.edu.espe.usuarios.entity.Persona;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PersonaRepository extends JpaRepository<Persona, UUID> {

	boolean existsByDniIgnoreCase(String dni);

	boolean existsByEmailIgnoreCase(String email);

	boolean existsByDniIgnoreCaseAndIdUuidNot(String dni, UUID idUuid);

	boolean existsByEmailIgnoreCaseAndIdUuidNot(String email, UUID idUuid);
}
