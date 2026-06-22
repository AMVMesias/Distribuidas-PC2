package ec.edu.espe.usuarios.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record UserResponse(
		UUID idPerson,
		boolean active,
		String username,
		LocalDateTime lastLogin,
		LocalDateTime createdAt,
		LocalDateTime updatedAt,
		PersonaResponse persona,
		List<RoleResponse> roles) {
}
