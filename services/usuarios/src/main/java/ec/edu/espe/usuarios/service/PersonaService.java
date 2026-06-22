package ec.edu.espe.usuarios.service;

import static ec.edu.espe.usuarios.util.TextSanitizer.lowerTrimToNull;
import static ec.edu.espe.usuarios.util.TextSanitizer.trimToNull;

import ec.edu.espe.usuarios.dto.PersonaRequest;
import ec.edu.espe.usuarios.dto.PersonaResponse;
import ec.edu.espe.usuarios.entity.Persona;
import ec.edu.espe.usuarios.exception.ConflictException;
import ec.edu.espe.usuarios.exception.NotFoundException;
import ec.edu.espe.usuarios.repository.PersonaRepository;
import ec.edu.espe.usuarios.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PersonaService {

	private final PersonaRepository personaRepository;
	private final UserRepository userRepository;
	private final DeactivationService deactivationService;

	public PersonaService(
			PersonaRepository personaRepository,
			UserRepository userRepository,
			DeactivationService deactivationService) {
		this.personaRepository = personaRepository;
		this.userRepository = userRepository;
		this.deactivationService = deactivationService;
	}

	@Transactional(readOnly = true)
	public List<PersonaResponse> findAll() {
		return personaRepository.findAll().stream()
				.map(this::toResponse)
				.toList();
	}

	@Transactional(readOnly = true)
	public PersonaResponse findById(UUID id) {
		return toResponse(findPersona(id));
	}

	@Transactional
	public PersonaResponse create(PersonaRequest request) {
		validateUniquePersona(request, null);
		Persona persona = new Persona();
		applyRequest(persona, request);
		return toResponse(personaRepository.save(persona));
	}

	@Transactional
	public PersonaResponse update(UUID id, PersonaRequest request) {
		Persona persona = findPersona(id);
		validateUniquePersona(request, id);
		applyRequest(persona, request);
		return toResponse(persona);
	}

	@Transactional
	public void delete(UUID id) {
		Persona persona = findPersona(id);
		if (userRepository.existsById(id)) {
			deactivationService.deactivateUserAndPersona(id);
			return;
		}
		persona.setActive(false);
	}

	Persona findPersona(UUID id) {
		return personaRepository.findById(id)
				.orElseThrow(() -> new NotFoundException("Persona no encontrada: " + id));
	}

	void validateUniquePersona(PersonaRequest request, UUID currentId) {
		String dni = trimToNull(request.dni());
		String email = lowerTrimToNull(request.email());
		boolean repeatedDni = currentId == null
				? personaRepository.existsByDniIgnoreCase(dni)
				: personaRepository.existsByDniIgnoreCaseAndIdUuidNot(dni, currentId);
		if (repeatedDni) {
			throw new ConflictException("Ya existe una persona con el dni indicado");
		}
		boolean repeatedEmail = currentId == null
				? personaRepository.existsByEmailIgnoreCase(email)
				: personaRepository.existsByEmailIgnoreCaseAndIdUuidNot(email, currentId);
		if (repeatedEmail) {
			throw new ConflictException("Ya existe una persona con el email indicado");
		}
	}

	void applyRequest(Persona persona, PersonaRequest request) {
		persona.setDni(trimToNull(request.dni()));
		persona.setFirstName(trimToNull(request.firstName()));
		persona.setMiddleName(trimToNull(request.middleName()));
		persona.setLastName(trimToNull(request.lastName()));
		persona.setEmail(lowerTrimToNull(request.email()));
		persona.setPhone(trimToNull(request.phone()));
		persona.setAddress(trimToNull(request.address()));
		persona.setNationality(trimToNull(request.nationality()));
	}

	PersonaResponse toResponse(Persona persona) {
		return new PersonaResponse(
				persona.getIdUuid(),
				persona.isActive(),
				persona.getDni(),
				persona.getFirstName(),
				persona.getMiddleName(),
				persona.getLastName(),
				persona.getEmail(),
				persona.getPhone(),
				persona.getAddress(),
				persona.getNationality(),
				persona.getCreatedAt(),
				persona.getUpdatedAt());
	}
}
