package com.datashare.dto;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonProperty;

/** File details shown before download (OpenAPI: FileMetadata). */
public record FileMetadata(
        @JsonProperty("original_name") String originalName,
        @JsonProperty("size_bytes") long sizeBytes,
        @JsonProperty("mime_type") String mimeType,
        @JsonProperty("expires_at") Instant expiresAt,
        @JsonProperty("password_protected") boolean passwordProtected
) {
}
