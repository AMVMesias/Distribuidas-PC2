package ec.edu.espe.usuarios.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import ec.edu.espe.usuarios.dto.PersonaRequest;
import ec.edu.espe.usuarios.dto.RoleRequest;
import ec.edu.espe.usuarios.dto.RoleResponse;
import ec.edu.espe.usuarios.dto.UserCreateRequest;
import ec.edu.espe.usuarios.dto.UserResponse;
import ec.edu.espe.usuarios.dto.UserRoleResponse;
import ec.edu.espe.usuarios.entity.User;
import ec.edu.espe.usuarios.entity.UserRole;
import ec.edu.espe.usuarios.exception.ConflictException;
import ec.edu.espe.usuarios.repository.PersonaRepository;
import ec.edu.espe.usuarios.repository.RoleRepository;
import ec.edu.espe.usuarios.repository.UserRepository;
import ec.edu.espe.usuarios.repository.UserRoleRepository;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class UserServiceIntegrationTests {

	@Autowired
	private UserService userService;

	@Autowired
	private RoleService roleService;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private PersonaRepository personaRepository;

	@Autowired
	private RoleRepository roleRepository;

	@Autowired
	private UserRoleRepository userRoleRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Test
	void createsUserWithSharedPersonaIdAndHashedPassword() {
		UserResponse response = userService.create(userCreate(
				"0102030405",
				"mesias@example.com",
				"Mesias",
				"Orlando",
				"Mariscal Oña"));

		assertNotNull(response.idPerson());
		assertEquals(response.idPerson(), response.persona().idUuid());
		assertEquals("momariscal", response.username());

		User user = userRepository.findById(response.idPerson()).orElseThrow();
		assertNotEquals("Password123", user.getPasswordHash());
		assertTrue(passwordEncoder.matches("Password123", user.getPasswordHash()));
	}

	@Test
	void rejectsRepeatedPersonDataAndRoleNames() {
		userService.create(userCreate(
				"0102030406",
				"denise@example.com",
				"Denise",
				"Noemi",
				"Rea Diaz"));

		assertThrows(ConflictException.class, () -> userService.create(userCreate(
				"0102030406",
				"another@example.com",
				"Daniel",
				"Noel",
				"Rivas Perez")));
		assertThrows(ConflictException.class, () -> userService.create(userCreate(
				"1111111111",
				"DENISE@example.com",
				"Diana",
				"Natalia",
				"Roa Perez")));

		roleService.create(new RoleRequest("ADMIN", "Administración"));
		assertThrows(ConflictException.class, () -> roleService.create(new RoleRequest("admin", "Duplicado")));
	}

	@Test
	void assignsRejectsDuplicateAndReactivatesUserRole() {
		UserResponse user = userService.create(userCreate(
				"0202030405",
				"role-user@example.com",
				"Mesias",
				"Orlando",
				"Mariscal Oña"));
		RoleResponse role = roleService.create(new RoleRequest("OPERADOR", "Operación"));

		UserRoleResponse assigned = userService.assignRole(user.idPerson(), role.id());

		assertTrue(assigned.active());
		assertThrows(ConflictException.class, () -> userService.assignRole(user.idPerson(), role.id()));

		userService.deactivateRole(user.idPerson(), role.id());
		UserRole inactive = userRoleRepository.findByUser_IdPersonAndRole_Id(user.idPerson(), role.id()).orElseThrow();
		assertFalse(inactive.isActive());

		UserRoleResponse reactivated = userService.assignRole(user.idPerson(), role.id());

		assertTrue(reactivated.active());
		long assignmentCount = userRoleRepository.findByUser_IdPerson(user.idPerson()).stream()
				.filter(userRole -> userRole.getRole().getId().equals(role.id()))
				.count();
		assertEquals(1, assignmentCount);
	}

	@Test
	void deactivatesAssignmentsUserAndPersonaInChain() {
		UserResponse user = userService.create(userCreate(
				"0302030405",
				"chain-user@example.com",
				"Laura",
				"Paola",
				"Solis Vega"));
		RoleResponse role = roleService.create(new RoleRequest("SUPERVISOR", "Supervisión"));
		userService.assignRole(user.idPerson(), role.id());

		userService.delete(user.idPerson());

		assertFalse(userRepository.findById(user.idPerson()).orElseThrow().isActive());
		assertFalse(personaRepository.findById(user.idPerson()).orElseThrow().isActive());
		assertTrue(userRoleRepository.findByUser_IdPerson(user.idPerson()).stream().noneMatch(UserRole::isActive));
	}

	@Test
	void deactivatesRoleAndItsActiveAssignments() {
		UserResponse user = userService.create(userCreate(
				"0402030405",
				"role-chain@example.com",
				"Andres",
				"Felipe",
				"Torres Mora"));
		RoleResponse role = roleService.create(new RoleRequest("AUDITOR", "Auditoría"));
		userService.assignRole(user.idPerson(), role.id());

		roleService.delete(role.id());

		assertFalse(roleRepository.findById(role.id()).orElseThrow().isActive());
		assertTrue(userRoleRepository.findByRole_IdAndActiveTrue(role.id()).isEmpty());
	}

	private UserCreateRequest userCreate(
			String dni,
			String email,
			String firstName,
			String middleName,
			String lastName) {
		return new UserCreateRequest(
				new PersonaRequest(
						dni,
						firstName,
						middleName,
						lastName,
						email,
						"+593999999999",
						"Quito",
						"Ecuatoriana"),
				"Password123");
	}
}
