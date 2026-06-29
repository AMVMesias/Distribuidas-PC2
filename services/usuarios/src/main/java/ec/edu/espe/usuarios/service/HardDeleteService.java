package ec.edu.espe.usuarios.service;

import ec.edu.espe.usuarios.entity.Persona;
import ec.edu.espe.usuarios.entity.User;
import ec.edu.espe.usuarios.exception.BusinessRuleException;
import ec.edu.espe.usuarios.exception.NotFoundException;
import ec.edu.espe.usuarios.repository.PersonaRepository;
import ec.edu.espe.usuarios.repository.RefreshTokenRepository;
import ec.edu.espe.usuarios.repository.RoleRepository;
import ec.edu.espe.usuarios.repository.UserRepository;
import ec.edu.espe.usuarios.repository.UserRoleRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class HardDeleteService {

	private final UserRepository userRepository;
	private final PersonaRepository personaRepository;
	private final RoleRepository roleRepository;
	private final UserRoleRepository userRoleRepository;
	private final RefreshTokenRepository refreshTokenRepository;

	public HardDeleteService(
			UserRepository userRepository,
			PersonaRepository personaRepository,
			RoleRepository roleRepository,
			UserRoleRepository userRoleRepository,
			RefreshTokenRepository refreshTokenRepository) {
		this.userRepository = userRepository;
		this.personaRepository = personaRepository;
		this.roleRepository = roleRepository;
		this.userRoleRepository = userRoleRepository;
		this.refreshTokenRepository = refreshTokenRepository;
	}

	@Transactional
	public void physicalDeleteUser(UUID id) {
		User user = userRepository.findById(id)
				.orElseThrow(() -> new NotFoundException("Usuario no encontrado: " + id));
		// Delete user_roles
		userRoleRepository.deleteAll(userRoleRepository.findByUser_IdPerson(id));
		// Delete refresh tokens
		refreshTokenRepository.deleteByUser(user);
		// Delete user
		userRepository.delete(user);
		// Delete persona
		personaRepository.deleteById(id);
	}

	@Transactional
	public void physicalDeletePersona(UUID id) {
		if (userRepository.existsById(id)) {
			throw new BusinessRuleException("No se puede eliminar físicamente una persona con usuario asociado. Elimine primero el usuario.");
		}
		Persona persona = personaRepository.findById(id)
				.orElseThrow(() -> new NotFoundException("Persona no encontrada: " + id));
		personaRepository.delete(persona);
	}

	@Transactional
	public void physicalDeleteRole(UUID id) {
		if (!userRoleRepository.findByRole_IdAndActiveTrue(id).isEmpty()) {
			throw new BusinessRuleException("No se puede eliminar físicamente un rol que tiene asignaciones activas");
		}
		if (!roleRepository.existsById(id)) {
			throw new NotFoundException("Rol no encontrado: " + id);
		}
		// Delete all user_role entries (including inactive) for this role
		userRoleRepository.deleteByRoleId(id);
		roleRepository.deleteById(id);
	}
}
