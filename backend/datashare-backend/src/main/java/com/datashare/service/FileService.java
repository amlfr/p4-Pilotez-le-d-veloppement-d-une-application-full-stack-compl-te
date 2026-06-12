package com.datashare.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.datashare.dto.UploadResponse;
import com.datashare.entity.StoredFile;
import com.datashare.entity.User;
import com.datashare.repository.FileRepository;
import com.datashare.repository.UserRepository;

@Service
public class FileService {

    // Executable types refused by the contract (415).
    private static final Set<String> FORBIDDEN_EXTENSIONS =
            Set.of("exe", "bat", "sh", "ps1", "msi", "dll", "vbs", "cmd");
    private static final long MAX_BYTES = 1024L * 1024 * 1024; // 1 Go
    private static final int DEFAULT_EXPIRY_DAYS = 7;
    private static final int MIN_PASSWORD_LENGTH = 6;

    private final UserRepository userRepository;
    private final FileRepository fileRepository;
    private final FileStorageService storage;
    private final PasswordEncoder passwordEncoder;
    private final String baseUrl;

    public FileService(
            UserRepository userRepository,
            FileRepository fileRepository,
            FileStorageService storage,
            PasswordEncoder passwordEncoder,
            @Value("${datashare.base-url}") String baseUrl) {
        this.userRepository = userRepository;
        this.fileRepository = fileRepository;
        this.storage = storage;
        this.passwordEncoder = passwordEncoder;
        this.baseUrl = baseUrl;
    }

    /**
     * Stores an uploaded file for an authenticated user and returns its download token.
     *
     * @param email the authenticated user's email (the JWT subject)
     */
    public UploadResponse upload(
            MultipartFile file, Integer expiresInDays, String password, String email) {

        User owner = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Authentification requise"));

        validate(file, expiresInDays, password);

        int days = expiresInDays == null ? DEFAULT_EXPIRY_DAYS : expiresInDays;
        UUID token = UUID.randomUUID();
        storage.store(file, token.toString());

        Instant now = Instant.now();
        StoredFile stored = StoredFile.builder()
                .owner(owner)
                .originalName(cleanName(file.getOriginalFilename()))
                .storedName(token.toString())
                .sizeBytes(file.getSize())
                .contentType(resolveContentType(file))
                .password(hashPassword(password))
                .downloadToken(token)
                .uploadDate(now)
                .expirationDate(now.plus(days, ChronoUnit.DAYS))
                .build();

        StoredFile saved = fileRepository.save(stored);
        return new UploadResponse(saved.getId(), downloadUrl(token), token, saved.getExpirationDate());
    }

    private void validate(MultipartFile file, Integer expiresInDays, String password) {
        if (file == null || file.isEmpty()) {
            throw unprocessable("Le fichier est vide ou manquant");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new ResponseStatusException(
                    HttpStatus.PAYLOAD_TOO_LARGE, "La taille des fichiers est limitée à 1 Go");
        }
        if (FORBIDDEN_EXTENSIONS.contains(extension(file.getOriginalFilename()))) {
            throw new ResponseStatusException(
                    HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Ce type de fichier n'est pas autorisé");
        }
        if (expiresInDays != null && (expiresInDays < 1 || expiresInDays > 7)) {
            throw unprocessable("La durée de conservation doit être comprise entre 1 et 7 jours");
        }
        if (password != null && !password.isBlank() && password.length() < MIN_PASSWORD_LENGTH) {
            throw unprocessable("Le mot de passe doit contenir au moins 6 caractères");
        }
    }

    private String hashPassword(String password) {
        if (password == null || password.isBlank()) {
            return null;
        }
        return passwordEncoder.encode(password);
    }

    private String downloadUrl(UUID token) {
        String base = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        return base + "/api/files/" + token + "/download";
    }

    private String resolveContentType(MultipartFile file) {
        String contentType = file.getContentType();
        return contentType == null || contentType.isBlank()
                ? "application/octet-stream"
                : contentType;
    }

    /** Strips any path components from the uploaded filename, defaulting to "fichier". */
    private String cleanName(String original) {
        if (original == null || original.isBlank()) {
            return "fichier";
        }
        String cleaned = StringUtils.getFilename(StringUtils.cleanPath(original));
        return cleaned == null || cleaned.isBlank() ? "fichier" : cleaned;
    }

    private String extension(String filename) {
        if (filename == null) {
            return "";
        }
        int dot = filename.lastIndexOf('.');
        return dot == -1 ? "" : filename.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private ResponseStatusException unprocessable(String message) {
        return new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, message);
    }
}
