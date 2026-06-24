package ec.edu.espe.usuarios.controller;

import ec.edu.espe.usuarios.dto.InternalUserResponse;
import ec.edu.espe.usuarios.dto.UserResponse;
import ec.edu.espe.usuarios.service.UserService;
import io.swagger.v3.oas.annotations.Hidden;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/internal/usuarios")
@Profile("!test")
@Hidden
public class InternalUserController {
	private final UserService userService;
	private final String internalToken;

	public InternalUserController(
			UserService userService,
			@Value("${app.internal.service-token:change-me-internal-token}") String internalToken) {
		this.userService = userService;
		this.internalToken = internalToken;
	}

	@GetMapping("/{id}")
	InternalUserResponse findInternal(
			@PathVariable UUID id,
			@RequestHeader(name = "X-Internal-Service-Token", required = false) String receivedToken) {
		if (!internalToken.equals(receivedToken)) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token interno inválido");
		}
		UserResponse user = userService.findById(id);
		return new InternalUserResponse(
				user.idPerson(),
				user.username(),
				user.active(),
				user.roles().stream().map(role -> role.name()).toList());
	}
}
