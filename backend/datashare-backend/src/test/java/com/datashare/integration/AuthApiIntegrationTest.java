package com.datashare.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * US03/US04 through the whole stack (controller → security → service → H2):
 * register auto-logs in, a duplicate email is a 409, login returns a token and
 * bad credentials a 401 — every error in the OpenAPI ErrorResponse shape.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void registerCreatesAccountThenRefusesDuplicateEmail() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("dup@it.test")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.email").value("dup@it.test"))
                // Auto-login per the contract: the token comes back from register.
                .andExpect(jsonPath("$.token").isNotEmpty());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("dup@it.test")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").isNotEmpty())
                .andExpect(jsonPath("$.message").value("Cet email est déjà utilisé"))
                .andExpect(jsonPath("$.timestamp").isNotEmpty());
    }

    @Test
    void loginReturnsTokenAndRejectsWrongPassword() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("login@it.test")))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"login@it.test\",\"password\":\"motdepasse\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.expires_in").value(3600));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"login@it.test\",\"password\":\"mauvais-mdp\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Email ou mot de passe incorrect"))
                .andExpect(jsonPath("$.timestamp").isNotEmpty());
    }

    private String body(String email) {
        return "{\"name\":\"Léa\",\"email\":\"" + email + "\",\"password\":\"motdepasse\"}";
    }
}
