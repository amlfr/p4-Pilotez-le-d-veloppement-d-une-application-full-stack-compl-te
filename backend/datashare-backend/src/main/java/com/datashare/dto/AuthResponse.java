package com.datashare.dto;

import java.util.UUID;

/** 201 body of POST /api/auth/register (OpenAPI: AuthResponse). */
public record AuthResponse(
        UUID id,
        String email,
        String token
) {
}
