package ec.edu.espe.usuarios.controller;

import ec.edu.espe.usuarios.service.HardDeleteService;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/root")
public class RootController {

	private final HardDeleteService hardDeleteService;

	public RootController(HardDeleteService hardDeleteService) {
		this.hardDeleteService = hardDeleteService;
	}

	@DeleteMapping("/usuarios/{id}")
	public ResponseEntity<Map<String, String>> physicalDeleteUser(@PathVariable UUID id) {
		hardDeleteService.physicalDeleteUser(id);
		return ResponseEntity.ok(Map.of("message", "Usuario eliminado físicamente"));
	}

	@DeleteMapping("/personas/{id}")
	public ResponseEntity<Map<String, String>> physicalDeletePersona(@PathVariable UUID id) {
		hardDeleteService.physicalDeletePersona(id);
		return ResponseEntity.ok(Map.of("message", "Persona eliminada físicamente"));
	}

	@DeleteMapping("/roles/{id}")
	public ResponseEntity<Map<String, String>> physicalDeleteRole(@PathVariable UUID id) {
		hardDeleteService.physicalDeleteRole(id);
		return ResponseEntity.ok(Map.of("message", "Rol eliminado físicamente"));
	}
}
