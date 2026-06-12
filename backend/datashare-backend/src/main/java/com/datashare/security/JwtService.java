package com.datashare.security;

import java.util.Date;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.datashare.entity.User;

@Service
public class JwtService {

    private final Algorithm algorithm;
    private final long expirationMs;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration-ms}") long expirationMs) {
        // HMAC-SHA256 keyed directly with the secret — no SecretKey/charset handling needed.
        this.algorithm = Algorithm.HMAC256(secret);
        this.expirationMs = expirationMs;
    }

    /** Builds a signed JWT whose subject is the user's email. */
    public String generateToken(User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return JWT.create()
                .withSubject(user.getEmail())
                .withClaim("userId", user.getId())
                .withClaim("name", user.getName())
                .withIssuedAt(now)
                .withExpiresAt(expiry)
                .sign(algorithm);
    }

    /**
     * Verifies the token's signature and expiry and returns the subject (the user's email),
     * or null if the token is malformed, tampered with, or expired.
     */
    public String extractEmail(String token) {
        try {
            return JWT.require(algorithm).build().verify(token).getSubject();
        } catch (JWTVerificationException e) {
            return null;
        }
    }
}
