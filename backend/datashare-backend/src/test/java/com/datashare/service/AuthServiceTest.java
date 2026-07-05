package com.datashare.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.datashare.dto.AuthResponse;
import com.datashare.dto.LoginRequest;
import com.datashare.dto.RegisterRequest;
import com.datashare.dto.TokenResponse;
import com.datashare.entity.User;
import com.datashare.exception.EmailAlreadyUsedException;
import com.datashare.exception.UnauthorizedException;
import com.datashare.repository.UserRepository;
import com.datashare.security.JwtService;

/**
 * US03/US04 — register hashes the password, auto-logs the account in (token in
 * the response) and refuses duplicate emails with 409; login returns a token or
 * a non-revealing 401. Repository, encoder and JwtService are mocked.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    @Test
    void registerSavesHashedPasswordAndReturnsToken() {
        when(userRepository.existsByEmail("lea@example.com")).thenReturn(false);
        when(passwordEncoder.encode("motdepasse")).thenReturn("HASH");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });
        when(jwtService.generateToken(any(User.class))).thenReturn("JWT");

        AuthResponse response = authService.register(
                new RegisterRequest("Léa", "lea@example.com", "motdepasse"));

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertThat(saved.getValue().getPassword()).isEqualTo("HASH");
        assertThat(saved.getValue().getName()).isEqualTo("Léa");
        assertThat(response.token()).isEqualTo("JWT");
        assertThat(response.email()).isEqualTo("lea@example.com");
        assertThat(response.id()).isNotNull();
    }

    @Test
    void registerWithoutNameFallsBackToEmailLocalPart() {
        when(userRepository.existsByEmail("paul.durand@example.com")).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("HASH");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.generateToken(any(User.class))).thenReturn("JWT");

        authService.register(new RegisterRequest(null, "paul.durand@example.com", "motdepasse"));

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertThat(saved.getValue().getName()).isEqualTo("paul.durand");
    }

    @Test
    void registerTrimsProvidedName() {
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("HASH");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.generateToken(any(User.class))).thenReturn("JWT");

        authService.register(new RegisterRequest("  Léa  ", "lea@example.com", "motdepasse"));

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertThat(saved.getValue().getName()).isEqualTo("Léa");
    }

    @Test
    void registerRefusesDuplicateEmail() {
        when(userRepository.existsByEmail("lea@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(
                new RegisterRequest("Léa", "lea@example.com", "motdepasse")))
                .isInstanceOf(EmailAlreadyUsedException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void loginReturnsTokenAndExpiry() {
        User user = user("lea@example.com", "HASH");
        when(userRepository.findByEmail("lea@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("motdepasse", "HASH")).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("JWT");
        when(jwtService.getExpiresInSeconds()).thenReturn(86_400L);

        TokenResponse response = authService.login(new LoginRequest("lea@example.com", "motdepasse"));

        assertThat(response.token()).isEqualTo("JWT");
        assertThat(response.expiresIn()).isEqualTo(86_400L);
    }

    @Test
    void loginRejectsUnknownEmail() {
        when(userRepository.findByEmail("inconnu@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("inconnu@example.com", "x")))
                .isInstanceOf(UnauthorizedException.class)
                // Same message as a wrong password: must not reveal whether the email exists.
                .hasMessage("Email ou mot de passe incorrect");
    }

    @Test
    void loginRejectsWrongPassword() {
        when(userRepository.findByEmail("lea@example.com"))
                .thenReturn(Optional.of(user("lea@example.com", "HASH")));
        when(passwordEncoder.matches("mauvais", "HASH")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("lea@example.com", "mauvais")))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Email ou mot de passe incorrect");
    }

    private User user(String email, String passwordHash) {
        return User.builder()
                .id(UUID.randomUUID())
                .name("Léa")
                .email(email)
                .password(passwordHash)
                .build();
    }
}
