package ec.edu.espe.usuarios.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@Embeddable
public class UserRoleId implements Serializable {

	@Column(name = "id_user", nullable = false, columnDefinition = "uuid")
	private UUID idUser;

	@Column(name = "id_role", nullable = false, columnDefinition = "uuid")
	private UUID idRole;
}
