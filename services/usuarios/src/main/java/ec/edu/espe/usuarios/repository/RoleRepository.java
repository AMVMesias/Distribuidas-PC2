package ec.edu.espe.usuarios.repository;

import ec.edu.espe.usuarios.entity.Role;
import java.util.UUID;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, UUID> {

	boolean existsByNameIgnoreCase(String name);

	boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);

	Optional<Role> findByNameIgnoreCase(String name);
}
