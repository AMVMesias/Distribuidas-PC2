package ec.edu.espe.usuarios.controller;

import ec.edu.espe.usuarios.dto.RoleRequest;
import ec.edu.espe.usuarios.dto.RoleResponse;
import ec.edu.espe.usuarios.service.RoleService;
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
@RequestMapping("/api/v1/roles")
public class RoleController {

	private final RoleService roleService;

	public RoleController(RoleService roleService) {
		this.roleService = roleService;
	}

	@GetMapping
	public List<RoleResponse> findAll() {
		return roleService.findAll();
	}

	@GetMapping("/{id}")
	public RoleResponse findById(@PathVariable UUID id) {
		return roleService.findById(id);
	}

	@PostMapping
	public ResponseEntity<RoleResponse> create(@Valid @RequestBody RoleRequest request) {
		RoleResponse response = roleService.create(request);
		return ResponseEntity.created(URI.create("/api/v1/roles/" + response.id())).body(response);
	}

	@PutMapping("/{id}")
	public RoleResponse update(@PathVariable UUID id, @Valid @RequestBody RoleRequest request) {
		return roleService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable UUID id) {
		roleService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
