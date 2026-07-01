package ec.edu.espe.zonas.config;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import java.security.interfaces.RSAPublicKey;
import java.util.Collection;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.convert.converter.Converter;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.converter.RsaKeyConverters;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@Profile("!test")
public class SecurityConfig {
    @Bean
    RSAPublicKey jwtPublicKey(@Value("${app.jwt.public-key}") Resource resource) throws IOException {
        return RsaKeyConverters.x509().convert(resource.getInputStream());
    }

    @Bean
    JwtDecoder jwtDecoder(RSAPublicKey key, @Value("${app.jwt.issuer}") String issuer,
            @Value("${app.jwt.audience}") String audience) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withPublicKey(key).build();
        OAuth2TokenValidator<Jwt> audienceValidator = jwt -> jwt.getAudience().contains(audience)
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Audiencia inválida", null));
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(issuer), audienceValidator));
        return decoder;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http.csrf(csrf -> csrf.disable())
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
                        .requestMatchers("/api/v1/root/**").hasRole("ROOT")
                        .requestMatchers(HttpMethod.GET, "/api/v1/zonas/**", "/api/v1/espacios/**").hasAnyRole("CLIENTE", "RECAUDADOR", "ADMIN", "ROOT")
                        .requestMatchers(HttpMethod.POST, "/api/v1/zonas/**", "/api/v1/espacios/**").hasAnyRole("ADMIN", "ROOT")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/zonas/**", "/api/v1/espacios/**").hasAnyRole("ADMIN", "ROOT")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/zonas/**", "/api/v1/espacios/**").hasAnyRole("ADMIN", "ROOT")
                        .anyRequest().authenticated())
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
                    .map(role -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + role)).toList();
            return new JwtAuthenticationToken(jwt, granted, jwt.getClaimAsString("username"));
        };
    }
}
