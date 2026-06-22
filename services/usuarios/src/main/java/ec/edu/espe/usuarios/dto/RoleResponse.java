package ec.edu.espe.usuarios.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record RoleResponse(
		UUID id,
		boolean active,
		String name,
		String description,
		LocalDateTime assignedAt,
		LocalDateTime updatedAt) {
}
