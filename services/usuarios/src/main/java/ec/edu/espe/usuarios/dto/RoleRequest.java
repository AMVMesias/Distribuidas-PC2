package ec.edu.espe.usuarios.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RoleRequest(
		@NotBlank @Size(max = 50) String name,
		@Size(max = 500) String description) {
}
