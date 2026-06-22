package ec.edu.espe.usuarios.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Transactional
class RoleControllerTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void createsRoleThroughRestEndpoint() throws Exception {
		mockMvc.perform(post("/api/v1/roles")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "name": "CAJERO",
								  "description": "Caja y reservas"
								}
								"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.active").value(true))
				.andExpect(jsonPath("$.name").value("CAJERO"));
	}

	@Test
	void returnsValidationErrorThroughRestEndpoint() throws Exception {
		mockMvc.perform(post("/api/v1/roles")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "name": "",
								  "description": "Inválido"
								}
								"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.validationErrors.name").exists());
	}
}
