package com.datashare.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.datashare.dto.FileListItem;
import com.datashare.dto.FileMetadata;
import com.datashare.dto.UploadResponse;
import com.datashare.entity.StoredFile;

/**
 * The entity→DTO mapping, including the download_url construction (base-url
 * with or without a trailing slash) and the derived flags (is_expired,
 * password_protected).
 */
class FileMapperTest {

    private static final UUID TOKEN = UUID.fromString("11111111-2222-3333-4444-555555555555");

    @Test
    void uploadResponseCarriesTokenAndDownloadUrl() {
        FileMapper mapper = new FileMapper("http://localhost:8080");
        StoredFile file = file(Instant.now().plus(3, ChronoUnit.DAYS), null);

        UploadResponse response = mapper.toUploadResponse(file);

        assertThat(response.token()).isEqualTo(TOKEN);
        assertThat(response.downloadUrl())
                .isEqualTo("http://localhost:8080/api/files/" + TOKEN + "/download");
        assertThat(response.expiresAt()).isEqualTo(file.getExpirationDate());
    }

    @Test
    void trailingSlashInBaseUrlDoesNotDoubleUp() {
        FileMapper mapper = new FileMapper("http://localhost:8080/");

        UploadResponse response =
                mapper.toUploadResponse(file(Instant.now().plus(1, ChronoUnit.DAYS), null));

        assertThat(response.downloadUrl())
                .isEqualTo("http://localhost:8080/api/files/" + TOKEN + "/download");
    }

    @Test
    void listItemFlagsExpiredFileAndCopiesTags() {
        FileMapper mapper = new FileMapper("http://localhost:8080");
        StoredFile expired = file(Instant.now().minus(1, ChronoUnit.DAYS), null);
        expired.setTags(List.of("cours", "projet"));

        FileListItem item = mapper.toListItem(expired);

        assertThat(item.isExpired()).isTrue();
        assertThat(item.tags()).containsExactly("cours", "projet");
        assertThat(item.passwordProtected()).isFalse();
        assertThat(item.token()).isEqualTo(TOKEN);
    }

    @Test
    void metadataExposesPasswordProtectionWithoutTheHash() {
        FileMapper mapper = new FileMapper("http://localhost:8080");

        FileMetadata metadata =
                mapper.toMetadata(file(Instant.now().plus(1, ChronoUnit.DAYS), "BCRYPT-HASH"));

        assertThat(metadata.passwordProtected()).isTrue();
        assertThat(metadata.originalName()).isEqualTo("notes.txt");
        assertThat(metadata.sizeBytes()).isEqualTo(42L);
        assertThat(metadata.mimeType()).isEqualTo("text/plain");
    }

    private StoredFile file(Instant expiration, String passwordHash) {
        return StoredFile.builder()
                .id(UUID.randomUUID())
                .originalName("notes.txt")
                .storedName(TOKEN.toString())
                .sizeBytes(42L)
                .contentType("text/plain")
                .password(passwordHash)
                .downloadToken(TOKEN)
                .uploadDate(Instant.now().minus(2, ChronoUnit.DAYS))
                .expirationDate(expiration)
                .build();
    }
}
