package ec.edu.espe.usuarios.util;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class UsernameGeneratorTests {

	@Test
	void generatesUsernameFromNames() {
		assertEquals("momariscal", UsernameGenerator.generateBase("Mesias", "Orlando", "Mariscal Oña"));
		assertEquals("dnrea", UsernameGenerator.generateBase("Denise", "Noemi", "Rea Diaz"));
	}

	@Test
	void generatesNumericSuffixWhenUsernameAlreadyExists() {
		Set<String> existing = new HashSet<>();
		existing.add("momariscal");
		existing.add("momariscal2");

		String username = UsernameGenerator.generateUnique(
				"Mesias",
				"Orlando",
				"Mariscal Oña",
				existing::contains);

		assertEquals("momariscal3", username);
	}

	@Test
	void trimsBaseBeforeAddingLongSuffix() {
		Set<String> existing = Set.of("momariscallargo", "momariscallar12");

		String username = UsernameGenerator.generateUnique(
				"Mesias",
				"Orlando",
				"Mariscallargote",
				existing::contains);

		assertEquals("momariscallarg2", username);
	}
}
