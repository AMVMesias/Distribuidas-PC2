package ec.edu.espe.usuarios.service;

import ec.edu.espe.usuarios.dto.AuthResponse;
import ec.edu.espe.usuarios.dto.LoginRequest;
import ec.edu.espe.usuarios.dto.UserCreateRequest;
import ec.edu.espe.usuarios.dto.UserResponse;
import ec.edu.espe.usuarios.entity.RefreshToken;
import ec.edu.espe.usuarios.entity.Role;
import ec.edu.espe.usuarios.entity.User;
import ec.edu.espe.usuarios.entity.UserRole;
import ec.edu.espe.usuarios.exception.NotFoundException;
import ec.edu.espe.usuarios.exception.UnauthorizedException;
import ec.edu.espe.usuarios.repository.RefreshTokenRepository;
import ec.edu.espe.usuarios.repository.RoleRepository;
import ec.edu.espe.usuarios.repository.UserRepository;
import ec.edu.espe.usuarios.repository.UserRoleRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile("!test")
public class AuthService {
	private final UserRepository users;
	private final RoleRepository roles;
	private final UserRoleRepository userRoles;
	private final RefreshTokenRepository refreshTokens;
	private final UserService userService;
	private final PasswordEncoder passwordEncoder;
	private final JwtEncoder jwtEncoder;
	private final SecureRandom random = new SecureRandom();
	private final String issuer;
	private final String audience;
	private final Duration accessDuration;
	private final Duration refreshDuration;

	public AuthService(UserRepository users, RoleRepository roles, UserRoleRepository userRoles,
			RefreshTokenRepository refreshTokens, UserService userService, PasswordEncoder passwordEncoder,
			JwtEncoder jwtEncoder, @Value("${app.jwt.issuer}") String issuer,
			@Value("${app.jwt.audience}") String audience,
			@Value("${app.jwt.access-minutes}") long accessMinutes,
			@Value("${app.jwt.refresh-days}") long refreshDays) {
		this.users = users;
		this.roles = roles;
		this.userRoles = userRoles;
		this.refreshTokens = refreshTokens;
		this.userService = userService;
		this.passwordEncoder = passwordEncoder;
		this.jwtEncoder = jwtEncoder;
		this.issuer = issuer;
		this.audience = audience;
		this.accessDuration = Duration.ofMinutes(accessMinutes);
		this.refreshDuration = Duration.ofDays(refreshDays);
	}

	@Transactional
	public AuthResponse register(UserCreateRequest request) {
		UserResponse created = userService.create(request);
		User user = users.findById(created.idPerson()).orElseThrow();
		Role role = roles.findByNameIgnoreCase("CLIENTE")
				.orElseThrow(() -> new NotFoundException("El rol CLIENTE no está configurado"));
		userRoles.save(new UserRole(user, role));
		return issueSession(user, UUID.randomUUID());
	}

	@Transactional
	public AuthResponse login(LoginRequest request) {
		User user = users.findByUsernameIgnoreCase(request.username())
				.orElseThrow(() -> new UnauthorizedException("Credenciales inválidas"));
		if (!user.isActive() || !user.getPersona().isActive()
				|| !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
			throw new UnauthorizedException("Credenciales inválidas");
		}
		user.setLastLogin(LocalDateTime.now());
		return issueSession(user, UUID.randomUUID());
	}

	@Transactional
	public AuthResponse refresh(String rawToken) {
		RefreshToken current = refreshTokens.findByHashForUpdate(hash(rawToken))
				.orElseThrow(() -> new UnauthorizedException("Refresh token inválido"));
		if (current.getRevokedAt() != null) {
			revokeFamily(current.getFamilyId());
			throw new UnauthorizedException("Se detectó reutilización del refresh token");
		}
		if (current.getExpiresAt().isBefore(Instant.now())) {
			current.setRevokedAt(Instant.now());
			throw new UnauthorizedException("Refresh token expirado");
		}
		if (!current.getUser().isActive() || !current.getUser().getPersona().isActive()) {
			revokeFamily(current.getFamilyId());
			throw new UnauthorizedException("Usuario inactivo");
		}
		String nextRaw = randomToken();
		RefreshToken next = newRefresh(current.getUser(), current.getFamilyId(), nextRaw);
		refreshTokens.save(next);
		current.setRevokedAt(Instant.now());
		current.setReplacedById(next.getId());
		return response(current.getUser(), nextRaw);
	}

	@Transactional
	public void logout(String rawToken) {
		refreshTokens.findByHashForUpdate(hash(rawToken)).ifPresent(token -> revokeFamily(token.getFamilyId()));
	}

	private AuthResponse issueSession(User user, UUID familyId) {
		String raw = randomToken();
		refreshTokens.save(newRefresh(user, familyId, raw));
		return response(user, raw);
	}

	private AuthResponse response(User user, String refreshToken) {
		return new AuthResponse(userService.findById(user.getIdPerson()), accessToken(user), refreshToken,
				"Bearer", accessDuration.toSeconds());
	}

	private String accessToken(User user) {
		Instant now = Instant.now();
		List<String> activeRoles = userRoles.findByUser_IdPersonAndActiveTrue(user.getIdPerson()).stream()
				.map(UserRole::getRole).filter(Role::isActive).map(Role::getName).map(String::toUpperCase).toList();
		JwtClaimsSet claims = JwtClaimsSet.builder().issuer(issuer).audience(List.of(audience))
				.subject(user.getIdPerson().toString()).issuedAt(now).expiresAt(now.plus(accessDuration))
				.id(UUID.randomUUID().toString()).claim("username", user.getUsername())
				.claim("roles", activeRoles).build();
		JwsHeader header = JwsHeader.with(SignatureAlgorithm.RS256).build();
		return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
	}

	private RefreshToken newRefresh(User user, UUID familyId, String raw) {
		RefreshToken token = new RefreshToken();
		token.setUser(user); token.setFamilyId(familyId); token.setTokenHash(hash(raw));
		token.setIssuedAt(Instant.now()); token.setExpiresAt(Instant.now().plus(refreshDuration));
		return token;
	}

	private void revokeFamily(UUID familyId) {
		Instant now = Instant.now();
		refreshTokens.findByFamilyIdAndRevokedAtIsNull(familyId).forEach(token -> token.setRevokedAt(now));
	}

	private String randomToken() {
		byte[] bytes = new byte[32]; random.nextBytes(bytes);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}

	private String hash(String raw) {
		try {
			return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
					.digest(raw.getBytes(StandardCharsets.UTF_8)));
		} catch (NoSuchAlgorithmException exception) {
			throw new IllegalStateException(exception);
		}
	}
}
