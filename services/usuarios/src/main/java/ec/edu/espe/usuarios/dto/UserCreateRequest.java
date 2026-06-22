package ec.edu.espe.usuarios.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserCreateRequest(
		@NotNull @Valid PersonaRequest persona,
		@NotBlank @Size(min = 8, max = 72) String password) {
}
