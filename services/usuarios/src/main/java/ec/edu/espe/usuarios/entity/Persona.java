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
		name = "personas",
		uniqueConstraints = {
				@UniqueConstraint(name = "uk_personas_dni", columnNames = "dni"),
				@UniqueConstraint(name = "uk_personas_email", columnNames = "email")
		})
public class Persona {

	@Id
	@Column(name = "id_uuid", nullable = false, updatable = false, columnDefinition = "uuid")
	private UUID idUuid = UUID.randomUUID();

	@Column(nullable = false)
	private boolean active = true;

	@Column(length = 255)
	private String address;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(length = 30, nullable = false)
	private String dni;

	@Column(length = 50, nullable = false)
	private String email;

	@Column(name = "first_name", length = 30, nullable = false)
	private String firstName;

	@Column(name = "last_name", length = 30, nullable = false)
	private String lastName;

	@Column(name = "middle_name", length = 30)
	private String middleName;

	@Column(length = 30)
	private String nationality;

	@Column(length = 15)
	private String phone;

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	@PrePersist
	void prePersist() {
		if (idUuid == null) {
			idUuid = UUID.randomUUID();
		}
		LocalDateTime now = LocalDateTime.now();
		createdAt = now;
		updatedAt = now;
	}

	@PreUpdate
	void preUpdate() {
		updatedAt = LocalDateTime.now();
	}
}
