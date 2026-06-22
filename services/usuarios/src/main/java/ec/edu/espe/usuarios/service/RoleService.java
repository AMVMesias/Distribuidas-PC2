package ec.edu.espe.usuarios.service;

import static ec.edu.espe.usuarios.util.TextSanitizer.trimToNull;

import ec.edu.espe.usuarios.dto.RoleRequest;
import ec.edu.espe.usuarios.dto.RoleResponse;
import ec.edu.espe.usuarios.entity.Role;
import ec.edu.espe.usuarios.exception.ConflictException;
import ec.edu.espe.usuarios.exception.NotFoundException;
import ec.edu.espe.usuarios.repository.RoleRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RoleService {

	private final RoleRepository roleRepository;
	private final DeactivationService deactivationService;

	public RoleService(RoleRepository roleRepository, DeactivationService deactivationService) {
		this.roleRepository = roleRepository;
		this.deactivationService = deactivationService;
	}

	@Transactional(readOnly = true)
	public List<RoleResponse> findAll() {
		return roleRepository.findAll().stream()
				.map(this::toResponse)
				.toList();
	}

	@Transactional(readOnly = true)
	public RoleResponse findById(UUID id) {
		return toResponse(findRole(id));
	}

	@Transactional
	public RoleResponse create(RoleRequest request) {
		validateUniqueName(request.name(), null);
		Role role = new Role();
		applyRequest(role, request);
		return toResponse(roleRepository.save(role));
	}

	@Transactional
	public RoleResponse update(UUID id, RoleRequest request) {
		Role role = findRole(id);
		validateUniqueName(request.name(), id);
		applyRequest(role, request);
		return toResponse(role);
	}

	@Transactional
	public void delete(UUID id) {
		deactivationService.deactivateRole(id);
	}

	Role findRole(UUID id) {
		return roleRepository.findById(id)
				.orElseThrow(() -> new NotFoundException("Rol no encontrado: " + id));
	}

	RoleResponse toResponse(Role role) {
		return new RoleResponse(
				role.getId(),
				role.isActive(),
				role.getName(),
				role.getDescription(),
				role.getAssignedAt(),
				role.getUpdatedAt());
	}

	private void validateUniqueName(String name, UUID currentId) {
		String cleanName = trimToNull(name);
		boolean repeated = currentId == null
				? roleRepository.existsByNameIgnoreCase(cleanName)
				: roleRepository.existsByNameIgnoreCaseAndIdNot(cleanName, currentId);
		if (repeated) {
			throw new ConflictException("Ya existe un rol con el nombre indicado");
		}
	}

	private void applyRequest(Role role, RoleRequest request) {
		role.setName(trimToNull(request.name()));
		role.setDescription(trimToNull(request.description()));
	}
}
