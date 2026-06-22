package ec.edu.espe.usuarios.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.function.Predicate;

public final class UsernameGenerator {

	public static final int MAX_USERNAME_LENGTH = 15;

	private UsernameGenerator() {
	}

	public static String generateBase(String firstName, String middleName, String lastName) {
		String base = firstInitial(firstName) + firstInitial(middleName) + firstLastNameToken(lastName);
		if (base.isBlank()) {
			throw new IllegalArgumentException("No se pudo generar el nombre de usuario");
		}
		return limit(base, MAX_USERNAME_LENGTH);
	}

	public static String generateUnique(
			String firstName,
			String middleName,
			String lastName,
			Predicate<String> usernameExists) {
		String base = generateBase(firstName, middleName, lastName);
		String candidate = base;
		int suffix = 2;
		while (usernameExists.test(candidate)) {
			String suffixValue = String.valueOf(suffix++);
			candidate = limit(base, MAX_USERNAME_LENGTH - suffixValue.length()) + suffixValue;
		}
		return candidate;
	}

	private static String firstInitial(String value) {
		String normalized = normalize(value);
		return normalized.isEmpty() ? "" : normalized.substring(0, 1);
	}

	private static String firstLastNameToken(String value) {
		if (value == null || value.isBlank()) {
			return "";
		}
		String firstToken = value.trim().split("\\s+")[0];
		return normalize(firstToken);
	}

	private static String normalize(String value) {
		if (value == null) {
			return "";
		}
		String lower = value.trim().toLowerCase(Locale.ROOT).replace('ñ', 'n');
		String withoutAccents = Normalizer.normalize(lower, Normalizer.Form.NFD)
				.replaceAll("\\p{M}+", "");
		return withoutAccents.replaceAll("[^a-z0-9]", "");
	}

	private static String limit(String value, int maxLength) {
		if (value.length() <= maxLength) {
			return value;
		}
		return value.substring(0, maxLength);
	}
}
