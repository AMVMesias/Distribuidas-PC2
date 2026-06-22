package ec.edu.espe.usuarios.util;

import java.util.Locale;

public final class TextSanitizer {

	private TextSanitizer() {
	}

	public static String trimToNull(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}

	public static String lowerTrimToNull(String value) {
		String trimmed = trimToNull(value);
		return trimmed == null ? null : trimmed.toLowerCase(Locale.ROOT);
	}
}
