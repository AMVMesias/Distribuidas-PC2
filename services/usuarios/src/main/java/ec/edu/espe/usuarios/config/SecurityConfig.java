package ec.edu.espe.usuarios.config;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@Profile("!test")
public class SecurityConfig {
	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		return http
				.csrf(csrf -> csrf.disable())
				.cors(Customizer.withDefaults())
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.exceptionHandling(exceptions -> exceptions
						.authenticationEntryPoint((request, response, exception) -> writeSecurityError(
								response,
								HttpServletResponse.SC_UNAUTHORIZED,
								"Unauthorized",
								accessTokenMessage(request.getHeader("Authorization")),
								request.getRequestURI()))
						.accessDeniedHandler((request, response, exception) -> writeSecurityError(
								response,
								HttpServletResponse.SC_FORBIDDEN,
								"Forbidden",
								"No tienes permisos para realizar esta operacion con tu rol actual",
								request.getRequestURI())))
				.authorizeHttpRequests(auth -> auth
						.requestMatchers("/actuator/health/**", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
						.requestMatchers("/api/v1/internal/**").permitAll()
						.requestMatchers(HttpMethod.POST,
								"/api/v1/auth/register", "/api/v1/auth/login",
								"/api/v1/auth/refresh", "/api/v1/auth/logout").permitAll()
						.requestMatchers("/api/v1/auth/me").authenticated()
						.requestMatchers("/api/v1/root/**").hasRole("ROOT")
						.requestMatchers("/api/v1/usuarios/me").authenticated()
						.requestMatchers("/api/v1/personas/me").authenticated()
						.requestMatchers("/api/v1/usuarios/**").hasAnyRole("ADMIN", "ROOT")
						.requestMatchers("/api/v1/personas/**").hasAnyRole("ADMIN", "ROOT")
						.requestMatchers("/api/v1/roles/**").hasAnyRole("ADMIN", "ROOT")
						.anyRequest().hasRole("ADMIN"))
				.oauth2ResourceServer(oauth -> oauth.jwt(jwt -> jwt.jwtAuthenticationConverter(authorities())))
				.build();
	}

	private String accessTokenMessage(String authorization) {
		if (authorization == null || authorization.isBlank()) {
			return "Access token ausente. Inicia sesion y envia el header Authorization: Bearer <accessToken>";
		}
		return "Access token invalido o expirado. Copia solo el accessToken, sin comillas, sin refreshToken y sin texto extra";
	}

	private void writeSecurityError(
			HttpServletResponse response,
			int status,
			String error,
			String message,
			String path) throws IOException {
		response.setStatus(status);
		response.setCharacterEncoding("UTF-8");
		response.setContentType("application/json;charset=UTF-8");
		response.getWriter().write("""
				{"timestamp":"%s","status":%d,"error":"%s","message":"%s","path":"%s","validationErrors":null}
				""".formatted(LocalDateTime.now(), status, error, escape(message), escape(path)));
	}

	private String escape(String value) {
		return value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\"");
	}

	private Converter<Jwt, AbstractAuthenticationToken> authorities() {
		return jwt -> {
			List<String> roles = jwt.getClaimAsStringList("roles");
			Collection<GrantedAuthority> granted = roles == null ? List.of() : roles.stream()
					.map(role -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + role))
					.toList();
			return new JwtAuthenticationToken(jwt, granted, jwt.getClaimAsString("username"));
		};
	}
}
