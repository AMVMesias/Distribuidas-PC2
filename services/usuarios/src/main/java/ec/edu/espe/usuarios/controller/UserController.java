package ec.edu.espe.usuarios.controller;

import ec.edu.espe.usuarios.dto.UserCreateRequest;
import ec.edu.espe.usuarios.dto.UserResponse;
import ec.edu.espe.usuarios.dto.UserRoleResponse;
import ec.edu.espe.usuarios.dto.UserUpdateRequest;
import ec.edu.espe.usuarios.service.UserService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/usuarios")
public class UserController {

	private final UserService userService;

	public UserController(UserService userService) {
		this.userService = userService;
	}

	@GetMapping
	public List<UserResponse> findAll() {
		return userService.findAll();
	}

	@GetMapping("/{id}")
	public UserResponse findById(@PathVariable UUID id) {
		return userService.findById(id);
	}

	@PostMapping
	public ResponseEntity<UserResponse> create(@Valid @RequestBody UserCreateRequest request) {
		UserResponse response = userService.create(request);
		return ResponseEntity.created(URI.create("/api/v1/usuarios/" + response.idPerson())).body(response);
	}

	@PutMapping("/{id}")
	public UserResponse update(@PathVariable UUID id, @Valid @RequestBody UserUpdateRequest request) {
		return userService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable UUID id) {
		userService.delete(id);
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/{userId}/roles")
	public List<UserRoleResponse> findUserRoles(@PathVariable UUID userId) {
		return userService.findUserRoles(userId);
	}

	@PostMapping("/{userId}/roles/{roleId}")
	public UserRoleResponse assignRole(@PathVariable UUID userId, @PathVariable UUID roleId) {
		return userService.assignRole(userId, roleId);
	}

	@DeleteMapping("/{userId}/roles/{roleId}")
	public ResponseEntity<Void> deactivateRole(@PathVariable UUID userId, @PathVariable UUID roleId) {
		userService.deactivateRole(userId, roleId);
		return ResponseEntity.noContent().build();
	}
}
