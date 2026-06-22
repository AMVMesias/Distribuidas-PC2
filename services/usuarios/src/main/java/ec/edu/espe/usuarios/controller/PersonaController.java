package ec.edu.espe.usuarios.controller;

import ec.edu.espe.usuarios.dto.PersonaRequest;
import ec.edu.espe.usuarios.dto.PersonaResponse;
import ec.edu.espe.usuarios.service.PersonaService;
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
@RequestMapping("/api/v1/personas")
public class PersonaController {

	private final PersonaService personaService;

	public PersonaController(PersonaService personaService) {
		this.personaService = personaService;
	}

	@GetMapping
	public List<PersonaResponse> findAll() {
		return personaService.findAll();
	}

	@GetMapping("/{id}")
	public PersonaResponse findById(@PathVariable UUID id) {
		return personaService.findById(id);
	}

	@PostMapping
	public ResponseEntity<PersonaResponse> create(@Valid @RequestBody PersonaRequest request) {
		PersonaResponse response = personaService.create(request);
		return ResponseEntity.created(URI.create("/api/v1/personas/" + response.idUuid())).body(response);
	}

	@PutMapping("/{id}")
	public PersonaResponse update(@PathVariable UUID id, @Valid @RequestBody PersonaRequest request) {
		return personaService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable UUID id) {
		personaService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
