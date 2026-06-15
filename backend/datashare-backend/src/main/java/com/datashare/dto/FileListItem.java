package com.datashare.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;

/** One row of the user's file history (OpenAPI: FileListItem). */
public record FileListItem(
        UUID id,
        @JsonProperty("original_name") String originalName,
        @JsonProperty("size_bytes") long sizeBytes,
        @JsonProperty("uploaded_at") Instant uploadedAt,
        @JsonProperty("expires_at") Instant expiresAt,
        @JsonProperty("is_expired") boolean isExpired,
        @JsonProperty("download_url") String downloadUrl,
        List<String> tags,
        // Extra property (not in the spec): the UI shows a lock on protected files.
        @JsonProperty("password_protected") boolean passwordProtected
) {
}
