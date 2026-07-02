package com.datashare.mapper;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.datashare.dto.FileListItem;
import com.datashare.dto.FileMetadata;
import com.datashare.dto.UploadResponse;
import com.datashare.entity.StoredFile;

/**
 * Turns {@link StoredFile} entities into the DTOs the API returns. The download
 * URL is built here too — it's presentation, not business logic.
 */
@Component
public class FileMapper {

    private final String baseUrl;

    public FileMapper(@Value("${datashare.base-url}") String baseUrl) {
        this.baseUrl = baseUrl;
    }

    /** OpenAPI: POST /files response — {id, download_url, token, expires_at}. */
    public UploadResponse toUploadResponse(StoredFile file) {
        return new UploadResponse(
                file.getId(),
                downloadUrl(file.getDownloadToken()),
                file.getDownloadToken(),
                file.getExpirationDate());
    }

    /** OpenAPI: GET /files/{token} response — the details shown before download. */
    public FileMetadata toMetadata(StoredFile file) {
        return new FileMetadata(
                file.getOriginalName(),
                file.getSizeBytes(),
                file.getContentType(),
                file.getExpirationDate(),
                file.getPassword() != null);
    }

    /** OpenAPI: GET /me/files list rows. */
    public FileListItem toListItem(StoredFile file) {
        return new FileListItem(
                file.getId(),
                file.getOriginalName(),
                file.getSizeBytes(),
                file.getUploadDate(),
                file.getExpirationDate(),
                file.getExpirationDate().isBefore(Instant.now()),
                downloadUrl(file.getDownloadToken()),
                file.getDownloadToken(),
                List.copyOf(file.getTags()),
                file.getPassword() != null);
    }

    private String downloadUrl(UUID token) {
        String base = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        return base + "/api/files/" + token + "/download";
    }
}
