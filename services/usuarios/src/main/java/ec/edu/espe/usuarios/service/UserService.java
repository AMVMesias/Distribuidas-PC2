package ec.edu.espe.usuarios.service;

import static ec.edu.espe.usuarios.util.TextSanitizer.trimToNull;

import ec.edu.espe.usuarios.dto.RoleResponse;
import ec.edu.espe.usuarios.dto.UserCreateRequest;
import ec.edu.espe.usuarios.dto.UserResponse;
import ec.edu.espe.usuarios.dto.UserRoleResponse;
import ec.edu.espe.usuarios.dto.UserUpdateRequest;
import ec.edu.espe.usuarios.entity.Persona;
import ec.edu.espe.usuarios.entity.Role;
import ec.edu.espe.usuarios.entity.User;
import ec.edu.espe.usuarios.entity.UserRole;
import ec.edu.espe.usuarios.exception.BusinessRuleException;
import ec.edu.espe.usuarios.exception.ConflictException;
import ec.edu.espe.usuarios.exception.NotFoundException;
import ec.edu.espe.usuarios.repository.RoleRepository;
import ec.edu.espe.usuarios.repository.UserRepository;
import ec.edu.espe.usuarios.repository.UserRoleRepository;
import ec.edu.espe.usuarios.util.UsernameGenerator;
import jakarta.persistence.EntityManager;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

	private final UserRepository userRepository;
	private final RoleRepository roleRepository;
	private final UserRoleRepository userRoleRepository;
	private final PersonaService personaService;
	private final RoleService roleService;
	private final DeactivationService deactivationService;
	private final PasswordEncoder passwordEncoder;
	private final EntityManager entityManager;

	public UserService(
			UserRepository userRepository,
			RoleRepository roleRepository,
			UserRoleRepository userRoleRepository,
			PersonaService personaService,
			RoleService roleService,
			DeactivationService deactivationService,
			PasswordEncoder passwordEncoder,
			EntityManager entityManager) {
		this.userRepository = userRepository;
		this.roleRepository = roleRepository;
		this.userRoleRepository = userRoleRepository;
		this.personaService = personaService;
		this.roleService = roleService;
		this.deactivationService = deactivationService;
		this.passwordEncoder = passwordEncoder;
		this.entityManager = entityManager;
	}

	@Transactional(readOnly = true)
	public List<UserResponse> findAll() {
		return userRepository.findAll().stream()
				.map(this::toResponse)
				.toList();
	}

	@Transactional(readOnly = true)
	public UserResponse findById(UUID id) {
		return toResponse(findUser(id));
	}

	@Transactional
	public UserResponse create(UserCreateRequest request) {
		personaService.validateUniquePersona(request.persona(), null);
		Persona persona = new Persona();
		personaService.applyRequest(persona, request.persona());
		entityManager.persist(persona);

		String username = UsernameGenerator.generateUnique(
				persona.getFirstName(),
				persona.getMiddleName(),
				persona.getLastName(),
				userRepository::existsByUsernameIgnoreCase);

		User user = new User();
		user.setPersona(persona);
		user.setIdPerson(persona.getIdUuid());
		user.setUsername(username);
		user.setPasswordHash(passwordEncoder.encode(request.password()));
		entityManager.persist(user);
		return toResponse(user);
	}

	@Transactional
	public UserResponse update(UUID id, UserUpdateRequest request) {
		User user = findUser(id);
		personaService.validateUniquePersona(request.persona(), id);
		personaService.applyRequest(user.getPersona(), request.persona());
		String password = trimToNull(request.password());
		if (password != null) {
			user.setPasswordHash(passwordEncoder.encode(password));
		}
		return toResponse(user);
	}

	@Transactional
	public void delete(UUID id) {
		findUser(id);
		deactivationService.deactivateUserAndPersona(id);
	}

	@Transactional
	public UserRoleResponse assignRole(UUID userId, UUID roleId) {
		User user = findUser(userId);
		Role role = roleRepository.findById(roleId)
				.orElseThrow(() -> new NotFoundException("Rol no encontrado: " + roleId));
		validateCanAssign(user, role);

		UserRole userRole = userRoleRepository.findByUser_IdPersonAndRole_Id(userId, roleId)
				.map(existing -> reactivateOrReject(existing, role))
				.orElseGet(() -> new UserRole(user, role));
		return toUserRoleResponse(userRoleRepository.save(userRole));
	}

	@Transactional(readOnly = true)
	public List<UserRoleResponse> findUserRoles(UUID userId) {
		findUser(userId);
		return userRoleRepository.findByUser_IdPerson(userId).stream()
				.map(this::toUserRoleResponse)
				.toList();
	}

	@Transactional
	public void deactivateRole(UUID userId, UUID roleId) {
		findUser(userId);
		UserRole userRole = userRoleRepository.findByUser_IdPersonAndRole_Id(userId, roleId)
				.orElseThrow(() -> new NotFoundException("Asignación de rol no encontrada"));
		userRole.setActive(false);
	}

	User findUser(UUID id) {
		return userRepository.findById(id)
				.orElseThrow(() -> new NotFoundException("Usuario no encontrado: " + id));
	}

	private UserRole reactivateOrReject(UserRole userRole, Role role) {
		if (userRole.isActive()) {
			throw new ConflictException("El usuario ya tiene asignado ese rol");
		}
		userRole.setRole(role);
		userRole.setActive(true);
		userRole.setAssignedAt(LocalDateTime.now());
		return userRole;
	}

	private void validateCanAssign(User user, Role role) {
		if (!user.getPersona().isActive()) {
			throw new BusinessRuleException("No se puede asignar roles a una persona inactiva");
		}
		if (!user.isActive()) {
			throw new BusinessRuleException("No se puede asignar roles a un usuario inactivo");
		}
		if (!role.isActive()) {
			throw new BusinessRuleException("No se puede asignar un rol inactivo");
		}
	}

	private UserResponse toResponse(User user) {
		List<RoleResponse> activeRoles = userRoleRepository.findByUser_IdPersonAndActiveTrue(user.getIdPerson()).stream()
				.map(UserRole::getRole)
				.map(roleService::toResponse)
				.toList();
		return new UserResponse(
				user.getIdPerson(),
				user.isActive(),
				user.getUsername(),
				user.getLastLogin(),
				user.getCreatedAt(),
				user.getUpdatedAt(),
				personaService.toResponse(user.getPersona()),
				activeRoles);
	}

	private UserRoleResponse toUserRoleResponse(UserRole userRole) {
		return new UserRoleResponse(
				userRole.getUser().getIdPerson(),
				userRole.getRole().getId(),
				userRole.getUser().getUsername(),
				userRole.getRole().getName(),
				userRole.isActive(),
				userRole.getAssignedAt(),
				userRole.getUpdatedAt());
	}
}
