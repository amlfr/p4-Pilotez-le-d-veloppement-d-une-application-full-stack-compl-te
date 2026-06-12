package com.datashare.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

        // Not part of the OpenAPI contract (extra property): optional display name.
        // Defaults to the email local part when omitted.
        String name,

        @NotBlank(message = "L'email est requis")
        @Email(message = "Le format de l'email est invalide")
        String email,

        @NotBlank(message = "Le mot de passe est requis")
        @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
        String password
) {
}
