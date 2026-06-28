package com.datashare.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import jakarta.servlet.DispatcherType;
import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JsonAuthenticationEntryPoint authenticationEntryPoint;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Stateless JSON API: no CSRF tokens, no server-side session.
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Let error dispatches through, otherwise a 401/404 sent via
                        // sendError() is re-evaluated as anonymous and turned into a 403.
                        .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        // Public download by link: metadata + file bytes (US02).
                        .requestMatchers(HttpMethod.GET, "/api/files/*", "/api/files/*/download").permitAll()
                        // Anonymous upload (US07): POST /api/files is public. An authenticated
                        // request still carries its JWT, so the file gets an owner. DELETE and
                        // PATCH (tags) on /api/files/* remain authenticated.
                        .requestMatchers(HttpMethod.POST, "/api/files").permitAll()
                        .anyRequest().authenticated())
                // Unauthenticated requests get the contract's 401 ErrorResponse, not a bare 403.
                .exceptionHandling(handling -> handling
                        .authenticationEntryPoint(authenticationEntryPoint))
                // Validate the JWT before Spring's username/password filter runs.
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
