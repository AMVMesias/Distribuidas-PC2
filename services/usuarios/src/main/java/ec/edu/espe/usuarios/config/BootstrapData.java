package ec.edu.espe.usuarios.config;

import ec.edu.espe.usuarios.entity.Persona;
import ec.edu.espe.usuarios.entity.Role;
import ec.edu.espe.usuarios.entity.User;
import ec.edu.espe.usuarios.entity.UserRole;
import ec.edu.espe.usuarios.repository.RoleRepository;
import ec.edu.espe.usuarios.repository.UserRepository;
import jakarta.persistence.EntityManager;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(name = "app.bootstrap.enabled", havingValue = "true", matchIfMissing = true)
public class BootstrapData implements CommandLineRunner {
	private final RoleRepository roles;
	private final UserRepository users;
	private final EntityManager entityManager;
	private final PasswordEncoder encoder;
	private final String username;
	private final String password;
	private final String dni;
	private final String firstName;
	private final String lastName;
	private final String email;

	public BootstrapData(RoleRepository roles, UserRepository users, EntityManager entityManager,
			PasswordEncoder encoder,
			@Value("${ADMIN_USERNAME:admin}") String username,
			@Value("${ADMIN_PASSWORD:Admin12345!}") String password,
			@Value("${ADMIN_DNI:0000000000}") String dni,
			@Value("${ADMIN_FIRST_NAME:Administrador}") String firstName,
			@Value("${ADMIN_LAST_NAME:Sistema}") String lastName,
			@Value("${ADMIN_EMAIL:admin@example.com}") String email) {
		this.roles = roles; this.users = users; this.entityManager = entityManager;
		this.encoder = encoder; this.username = username; this.password = password; this.dni = dni;
		this.firstName = firstName; this.lastName = lastName; this.email = email;
	}

	@Override
	@Transactional
	public void run(String... args) {
		Role admin = role("ADMIN", "Administración completa");
		role("USER", "Usuario de la aplicación (Client)");
		role("COLLECTOR", "Recolector de vehículos");
		role("ROOT", "Superusuario con permisos de borrado físico");
		if (users.findByUsernameIgnoreCase(username).isPresent()) return;

		Persona person = new Persona();
		person.setIdUuid(UUID.randomUUID()); person.setDni(dni); person.setFirstName(firstName);
		person.setLastName(lastName); person.setEmail(email); person.setActive(true);
		entityManager.persist(person);

		User user = new User();
		user.setPersona(person); user.setIdPerson(person.getIdUuid()); user.setUsername(username);
		user.setPasswordHash(encoder.encode(password)); user.setActive(true);
		entityManager.persist(user);
		entityManager.persist(new UserRole(user, admin));
	}

	private Role role(String name, String description) {
		return roles.findByNameIgnoreCase(name).orElseGet(() -> {
			Role role = new Role(); role.setName(name); role.setDescription(description); role.setActive(true);
			return roles.save(role);
		});
	}
}
