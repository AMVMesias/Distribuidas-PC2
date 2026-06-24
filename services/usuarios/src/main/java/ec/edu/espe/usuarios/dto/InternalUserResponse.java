package ec.edu.espe.usuarios.dto;

import java.util.List;
import java.util.UUID;

public record InternalUserResponse(
		UUID id,
		String username,
		boolean active,
		List<String> roles) {
}
