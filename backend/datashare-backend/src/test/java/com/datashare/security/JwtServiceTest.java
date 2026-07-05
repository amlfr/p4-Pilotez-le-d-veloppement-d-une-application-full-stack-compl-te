package com.datashare.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.datashare.entity.User;

/**
 * US03/US04 — the JWT roundtrip: a generated token must give back its subject,
 * and anything expired, tampered with, or malformed must be rejected (null),
 * never throw. Real JwtService instances, no Spring context.
 */
class JwtServiceTest {

    private static final String SECRET = "test-secret-0123456789";

    private final JwtService jwtService = new JwtService(SECRET, 3_600_000L);

    @Test
    void generatedTokenGivesBackTheEmail() {
        String token = jwtService.generateToken(user());

        assertThat(jwtService.extractEmail(token)).isEqualTo("lea@example.com");
    }

    @Test
    void expiredTokenIsRejected() {
        JwtService expired = new JwtService(SECRET, -1_000L);
        String token = expired.generateToken(user());

        assertThat(expired.extractEmail(token)).isNull();
    }

    @Test
    void tokenSignedWithAnotherSecretIsRejected() {
        JwtService other = new JwtService("another-secret-entirely", 3_600_000L);
        String token = other.generateToken(user());

        assertThat(jwtService.extractEmail(token)).isNull();
    }

    @Test
    void malformedTokenIsRejected() {
        assertThat(jwtService.extractEmail("not-a-jwt")).isNull();
    }

    @Test
    void expiresInSecondsMatchesConfiguredMillis() {
        assertThat(jwtService.getExpiresInSeconds()).isEqualTo(3_600L);
    }

    private User user() {
        return User.builder()
                .id(UUID.randomUUID())
                .name("Léa")
                .email("lea@example.com")
                .password("hash")
                .build();
    }
}
