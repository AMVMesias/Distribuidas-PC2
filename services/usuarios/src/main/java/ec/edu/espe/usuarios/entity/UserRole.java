package ec.edu.espe.usuarios.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "user_role")
public class UserRole {

	@EmbeddedId
	private UserRoleId id = new UserRoleId();

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@MapsId("idUser")
	@JoinColumn(name = "id_user", nullable = false, referencedColumnName = "id_person")
	private User user;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@MapsId("idRole")
	@JoinColumn(name = "id_role", nullable = false)
	private Role role;

	@Column(nullable = false)
	private boolean active = true;

	@Column(name = "assigned_at", nullable = false)
	private LocalDateTime assignedAt;

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	public UserRole(User user, Role role) {
		this.user = user;
		this.role = role;
		this.id = new UserRoleId(user.getIdPerson(), role.getId());
	}

	@PrePersist
	void prePersist() {
		LocalDateTime now = LocalDateTime.now();
		assignedAt = now;
		updatedAt = now;
	}

	@PreUpdate
	void preUpdate() {
		updatedAt = LocalDateTime.now();
	}
}
