package ec.edu.espe.usuarios.repository;

import ec.edu.espe.usuarios.entity.UserRole;
import ec.edu.espe.usuarios.entity.UserRoleId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRoleRepository extends JpaRepository<UserRole, UserRoleId> {

	List<UserRole> findByUser_IdPerson(UUID idUser);

	List<UserRole> findByUser_IdPersonAndActiveTrue(UUID idUser);

	List<UserRole> findByRole_IdAndActiveTrue(UUID idRole);

	Optional<UserRole> findByUser_IdPersonAndRole_Id(UUID idUser, UUID idRole);
}
