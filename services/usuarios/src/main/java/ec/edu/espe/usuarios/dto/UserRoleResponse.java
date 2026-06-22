package ec.edu.espe.usuarios.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserRoleResponse(
		UUID userId,
		UUID roleId,
		String username,
		String roleName,
		boolean active,
		LocalDateTime assignedAt,
		LocalDateTime updatedAt) {
}
