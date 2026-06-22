package ec.edu.espe.usuarios.dto;

public record AuthResponse(
		UserResponse user,
		String accessToken,
		String refreshToken,
		String tokenType,
		long expiresIn) {
}
