package ec.edu.espe.usuarios.repository;

import ec.edu.espe.usuarios.entity.RefreshToken;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select token from RefreshToken token where token.tokenHash = :hash")
	Optional<RefreshToken> findByHashForUpdate(@Param("hash") String hash);

	List<RefreshToken> findByFamilyIdAndRevokedAtIsNull(UUID familyId);

	void deleteByUser(ec.edu.espe.usuarios.entity.User user);
}
