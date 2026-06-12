package com.datashare.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/** 200 body of POST /api/auth/login (OpenAPI: TokenResponse). */
public record TokenResponse(
        String token,

        @JsonProperty("expires_in")
        long expiresIn
) {
}
