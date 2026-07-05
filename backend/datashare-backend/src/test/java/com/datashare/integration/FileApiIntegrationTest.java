package com.datashare.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.jayway.jsonpath.JsonPath;

/**
 * The file API through the whole stack on H2 + a temp storage dir under
 * target/: authenticated upload → public metadata → byte-identical download
 * (US01/02), anonymous upload without a JWT (US07), the JWT gate on history
 * (US05) and the owner-only delete (US06).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FileApiIntegrationTest {

    private static final byte[] CONTENT = "contenu du fichier de test".getBytes();

    @Autowired
    private MockMvc mockMvc;

    @Test
    void uploadMetadataDownloadRoundtrip() throws Exception {
        String jwt = registerAndGetToken("roundtrip@it.test");

        MvcResult upload = mockMvc.perform(multipart("/api/files")
                        .file(new MockMultipartFile("file", "notes.txt", "text/plain", CONTENT))
                        .param("expires_in_days", "3")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwt))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.download_url").isNotEmpty())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.expires_at").isNotEmpty())
                .andReturn();
        String token = JsonPath.read(upload.getResponse().getContentAsString(), "$.token");

        // Metadata is public — no Authorization header on purpose.
        mockMvc.perform(get("/api/files/" + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.original_name").value("notes.txt"))
                .andExpect(jsonPath("$.size_bytes").value(CONTENT.length))
                .andExpect(jsonPath("$.mime_type").value("text/plain"))
                .andExpect(jsonPath("$.password_protected").value(false));

        MvcResult download = mockMvc.perform(get("/api/files/" + token + "/download"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                        org.hamcrest.Matchers.containsString("attachment")))
                .andReturn();
        assertThat(download.getResponse().getContentAsByteArray()).isEqualTo(CONTENT);
    }

    @Test
    void anonymousUploadSucceedsWithoutJwt() throws Exception {
        mockMvc.perform(multipart("/api/files")
                        .file(new MockMultipartFile("file", "anonyme.txt", "text/plain", CONTENT))
                        .param("expires_in_days", "1"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void historyRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/me/files"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Authentification requise"))
                .andExpect(jsonPath("$.timestamp").isNotEmpty());
    }

    @Test
    void onlyTheOwnerCanDeleteAFile() throws Exception {
        String ownerJwt = registerAndGetToken("proprietaire@it.test");
        String intruderJwt = registerAndGetToken("intrus@it.test");

        MvcResult upload = mockMvc.perform(multipart("/api/files")
                        .file(new MockMultipartFile("file", "prive.txt", "text/plain", CONTENT))
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerJwt))
                .andExpect(status().isCreated())
                .andReturn();
        String id = JsonPath.read(upload.getResponse().getContentAsString(), "$.id");

        mockMvc.perform(delete("/api/files/" + id)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + intruderJwt))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Ce fichier appartient à un autre utilisateur"));

        mockMvc.perform(delete("/api/files/" + id)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerJwt))
                .andExpect(status().isNoContent());

        // Gone for real: a second delete is a 404.
        mockMvc.perform(delete("/api/files/" + id)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerJwt))
                .andExpect(status().isNotFound());
    }

    private String registerAndGetToken(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Léa\",\"email\":\"" + email + "\",\"password\":\"motdepasse\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.token");
    }
}
