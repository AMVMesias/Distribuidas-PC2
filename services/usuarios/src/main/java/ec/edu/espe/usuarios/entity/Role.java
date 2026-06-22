package ec.edu.espe.usuarios.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
		name = "roles",
		uniqueConstraints = @UniqueConstraint(name = "uk_roles_name", columnNames = "name"))
public class Role {

	@Id
	@Column(nullable = false, updatable = false, columnDefinition = "uuid")
	private UUID id = UUID.randomUUID();

	@Column(nullable = false)
	private boolean active = true;

	@Column(name = "assigned_at", nullable = false, updatable = false)
	private LocalDateTime assignedAt;

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	@Column(length = 50, nullable = false)
	private String name;

	@Column(columnDefinition = "text")
	private String description;

	@PrePersist
	void prePersist() {
		if (id == null) {
			id = UUID.randomUUID();
		}
		LocalDateTime now = LocalDateTime.now();
		assignedAt = now;
		updatedAt = now;
	}

	@PreUpdate
	void preUpdate() {
		updatedAt = LocalDateTime.now();
	}
}
