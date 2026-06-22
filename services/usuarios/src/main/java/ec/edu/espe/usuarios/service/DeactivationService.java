package ec.edu.espe.usuarios.service;

import ec.edu.espe.usuarios.entity.Persona;
import ec.edu.espe.usuarios.entity.Role;
import ec.edu.espe.usuarios.entity.User;
import ec.edu.espe.usuarios.entity.UserRole;
import ec.edu.espe.usuarios.exception.NotFoundException;
import ec.edu.espe.usuarios.repository.PersonaRepository;
import ec.edu.espe.usuarios.repository.RoleRepository;
import ec.edu.espe.usuarios.repository.UserRepository;
import ec.edu.espe.usuarios.repository.UserRoleRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DeactivationService {

	private final PersonaRepository personaRepository;
	private final UserRepository userRepository;
	private final RoleRepository roleRepository;
	private final UserRoleRepository userRoleRepository;

	public DeactivationService(
			PersonaRepository personaRepository,
			UserRepository userRepository,
			RoleRepository roleRepository,
			UserRoleRepository userRoleRepository) {
		this.personaRepository = personaRepository;
		this.userRepository = userRepository;
		this.roleRepository = roleRepository;
		this.userRoleRepository = userRoleRepository;
	}

	@Transactional
	public void deactivateUserAndPersona(UUID idUser) {
		User user = userRepository.findById(idUser)
				.orElseThrow(() -> new NotFoundException("Usuario no encontrado: " + idUser));
		for (UserRole userRole : userRoleRepository.findByUser_IdPersonAndActiveTrue(idUser)) {
			userRole.setActive(false);
		}
		user.setActive(false);
		user.getPersona().setActive(false);
	}

	@Transactional
	public void deactivatePersonaOnly(UUID idPersona) {
		Persona persona = personaRepository.findById(idPersona)
				.orElseThrow(() -> new NotFoundException("Persona no encontrada: " + idPersona));
		persona.setActive(false);
	}

	@Transactional
	public void deactivateRole(UUID idRole) {
		Role role = roleRepository.findById(idRole)
				.orElseThrow(() -> new NotFoundException("Rol no encontrado: " + idRole));
		for (UserRole userRole : userRoleRepository.findByRole_IdAndActiveTrue(idRole)) {
			userRole.setActive(false);
		}
		role.setActive(false);
	}
}
