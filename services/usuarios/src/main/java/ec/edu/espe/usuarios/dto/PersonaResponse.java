package ec.edu.espe.usuarios.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record PersonaResponse(
		UUID idUuid,
		boolean active,
		String dni,
		String firstName,
		String middleName,
		String lastName,
		String email,
		String phone,
		String address,
		String nationality,
		LocalDateTime createdAt,
		LocalDateTime updatedAt) {
}
