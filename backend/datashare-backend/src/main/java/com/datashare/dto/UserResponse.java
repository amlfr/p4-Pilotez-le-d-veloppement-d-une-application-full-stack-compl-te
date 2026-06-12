package com.datashare.dto;

/** Returned after a successful registration (no token, no password). */
public record UserResponse(
        Long id,
        String name,
        String email
) {
}
