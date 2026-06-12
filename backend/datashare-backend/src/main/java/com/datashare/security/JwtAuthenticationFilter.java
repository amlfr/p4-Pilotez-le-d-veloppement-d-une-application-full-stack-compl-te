package com.datashare.security;

import java.io.IOException;
import java.util.List;

import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.datashare.entity.User;
import com.datashare.repository.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

/**
 * Validates the {@code Authorization: Bearer <token>} header on each request and,
 * when the token is valid, populates the {@link SecurityContextHolder} with an
 * authenticated principal (the user's email).
 *
 * <p>No protected routes exist yet, so this filter is effectively dormant — it
 * simply leaves the context unauthenticated when no/invalid token is present.
 * Once the File API adds {@code .authenticated()} endpoints it will guard them.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String HEADER = "Authorization";
    private static final String PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String token = resolveToken(request);

        // Only attempt authentication if a token is present and the context is empty.
        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            String email = jwtService.extractEmail(token);
            if (email != null) {
                authenticate(email);
            }
        }

        filterChain.doFilter(request, response);
    }

    /** Loads the user named by the token and marks the request as authenticated. */
    private void authenticate(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            // Token references a user that no longer exists; treat as unauthenticated.
            return;
        }

        var authentication = new UsernamePasswordAuthenticationToken(
                user.getEmail(), null, List.of());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    /** Extracts the bearer token from the Authorization header, or null if absent. */
    private String resolveToken(HttpServletRequest request) {
        String header = request.getHeader(HEADER);
        if (header != null && header.startsWith(PREFIX)) {
            return header.substring(PREFIX.length());
        }
        return null;
    }
}
