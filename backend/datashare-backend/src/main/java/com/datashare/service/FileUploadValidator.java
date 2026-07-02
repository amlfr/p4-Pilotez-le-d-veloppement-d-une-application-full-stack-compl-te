package com.datashare.service;

import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.datashare.exception.FileTooLargeException;
import com.datashare.exception.ForbiddenFileTypeException;
import com.datashare.exception.ValidationException;

/**
 * The business rules an upload must satisfy (contract: POST /files): present and
 * non-empty, at most 1 Go, no executable extension, retention within 1..7 days,
 * optional download password of at least 6 characters.
 */
@Component
public class FileUploadValidator {

    // Executable types refused by the contract (415).
    private static final Set<String> FORBIDDEN_EXTENSIONS =
            Set.of("exe", "bat", "sh", "ps1", "msi", "dll", "vbs", "cmd");
    private static final long MAX_BYTES = 1024L * 1024 * 1024; // 1 Go
    private static final int MIN_PASSWORD_LENGTH = 6;

    public void validate(MultipartFile file, Integer expiresInDays, String password) {
        if (file == null || file.isEmpty()) {
            throw new ValidationException("Le fichier est vide ou manquant");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new FileTooLargeException("La taille des fichiers est limitée à 1 Go");
        }
        if (FORBIDDEN_EXTENSIONS.contains(extension(file.getOriginalFilename()))) {
            throw new ForbiddenFileTypeException("Ce type de fichier n'est pas autorisé");
        }
        if (expiresInDays != null && (expiresInDays < 1 || expiresInDays > 7)) {
            throw new ValidationException("La durée de conservation doit être comprise entre 1 et 7 jours");
        }
        if (password != null && !password.isBlank() && password.length() < MIN_PASSWORD_LENGTH) {
            throw new ValidationException("Le mot de passe doit contenir au moins 6 caractères");
        }
    }

    private String extension(String filename) {
        if (filename == null) {
            return "";
        }
        int dot = filename.lastIndexOf('.');
        return dot == -1 ? "" : filename.substring(dot + 1).toLowerCase(Locale.ROOT);
    }
}
