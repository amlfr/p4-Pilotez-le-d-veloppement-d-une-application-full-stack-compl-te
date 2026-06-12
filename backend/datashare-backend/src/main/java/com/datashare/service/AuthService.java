package com.datashare.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.datashare.dto.AuthResponse;
import com.datashare.dto.LoginRequest;
import com.datashare.dto.RegisterRequest;
import com.datashare.dto.TokenResponse;
import com.datashare.entity.User;
import com.datashare.repository.UserRepository;
import com.datashare.security.JwtService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    /**
     * Creates a new account and logs it straight in (the contract returns a token).
     * Fails with 409 if the email is already taken.
     */
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cet email est déjà utilisé");
        }

        User user = User.builder()
                .name(resolveName(request))
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .build();

        User saved = userRepository.save(user);
        String token = jwtService.generateToken(saved);
        return new AuthResponse(saved.getId(), saved.getEmail(), token);
    }

    /** Validates credentials and returns a signed JWT. Fails with 401 on bad credentials. */
    public TokenResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Email ou mot de passe incorrect"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email ou mot de passe incorrect");
        }

        String token = jwtService.generateToken(user);
        return new TokenResponse(token, jwtService.getExpiresInSeconds());
    }

    /** The name is optional in the API contract; fall back to the email local part. */
    private String resolveName(RegisterRequest request) {
        if (request.name() != null && !request.name().isBlank()) {
            return request.name().trim();
        }
        return request.email().substring(0, request.email().indexOf('@'));
    }
}
