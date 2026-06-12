package com.datashare.dto;

import java.time.Instant;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;

/** Upload result (OpenAPI: UploadResponse). */
public record UploadResponse(
        UUID id,
        @JsonProperty("download_url") String downloadUrl,
        UUID token,
        @JsonProperty("expires_at") Instant expiresAt
) {
}
