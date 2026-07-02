package com.datashare.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.datashare.dto.FileListItem;
import com.datashare.dto.FileListResponse;
import com.datashare.dto.FileMetadata;
import com.datashare.dto.TagsResponse;
import com.datashare.dto.UploadResponse;
import com.datashare.entity.StoredFile;
import com.datashare.entity.User;
import com.datashare.exception.FileGoneException;
import com.datashare.exception.FileTooLargeException;
import com.datashare.exception.ForbiddenException;
import com.datashare.exception.ForbiddenFileTypeException;
import com.datashare.exception.ResourceNotFoundException;
import com.datashare.exception.UnauthorizedException;
import com.datashare.exception.ValidationException;
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
    private static final int MAX_TAG_LENGTH = 30;

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
     * Stores an uploaded file and returns its download token.
     *
     * @param email the authenticated user's email (the JWT subject), or {@code null}
     *              for an anonymous upload (US07) — the file is then owner-less
     */
    public UploadResponse upload(
            MultipartFile file, Integer expiresInDays, String password, List<String> rawTags, String email) {

        // US07: an anonymous upload has no authenticated user — owner stays null.
        User owner = email == null ? null : requireUser(email);

        validate(file, expiresInDays, password);
        // Tags are reserved to connected users (US08); ignore any sent anonymously.
        List<String> tags = owner == null ? new ArrayList<>() : normalizeTags(rawTags);

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
                .tags(tags)
                .build();

        StoredFile saved = fileRepository.save(stored);
        return new UploadResponse(saved.getId(), downloadUrl(token), token, saved.getExpirationDate());
    }

    /**
     * Paginated history of the user's uploads, newest first (OpenAPI: GET /me/files).
     * An optional {@code tag} narrows the list to files carrying that label (US08).
     */
    public FileListResponse listFiles(int page, int perPage, String tag, String email) {
        User owner = requireUser(email);

        int safePage = Math.max(page, 1);
        int safePerPage = Math.clamp(perPage, 1, 50);

        // The spec's page is 1-based, Spring's PageRequest is 0-based.
        PageRequest pageable = PageRequest.of(
                safePage - 1, safePerPage, Sort.by(Sort.Direction.DESC, "uploadDate"));
        Page<StoredFile> result = (tag == null || tag.isBlank())
                ? fileRepository.findByOwner(owner, pageable)
                : fileRepository.findByOwnerAndTag(owner, tag.trim(), pageable);

        List<FileListItem> items = result.getContent().stream()
                .map(this::toListItem)
                .toList();
        return new FileListResponse(items, result.getTotalElements(), safePage, safePerPage);
    }

    /**
     * File details shown before download (OpenAPI: GET /files/{token}). An invalid token or an
     * already-expired file both surface as 404, hiding whether the link ever existed.
     */
    public FileMetadata getMetadata(String token) {
        StoredFile file = findByToken(token);
        if (file.getExpirationDate().isBefore(Instant.now())) {
            throw new ResourceNotFoundException("Lien invalide ou expiré");
        }
        return new FileMetadata(
                file.getOriginalName(),
                file.getSizeBytes(),
                file.getContentType(),
                file.getExpirationDate(),
                file.getPassword() != null);
    }

    /**
     * Resolves a download (OpenAPI: GET /files/{token}/download): 404 for an unknown token,
     * 410 once expired, 401 when a required password is missing or wrong.
     */
    public DownloadResult download(String token, String password) {
        StoredFile file = findByToken(token);
        if (file.getExpirationDate().isBefore(Instant.now())) {
            throw new FileGoneException("Le fichier a expiré ou a été supprimé");
        }
        if (file.getPassword() != null) {
            if (password == null || password.isBlank()) {
                throw new UnauthorizedException("Mot de passe requis");
            }
            if (!passwordEncoder.matches(password, file.getPassword())) {
                throw new UnauthorizedException("Mot de passe incorrect");
            }
        }
        Resource resource = storage.load(file.getStoredName());
        return new DownloadResult(
                resource, file.getOriginalName(), file.getContentType(), file.getSizeBytes());
    }

    /** Everything the controller needs to stream a file back with the right headers. */
    public record DownloadResult(Resource resource, String filename, String contentType, long sizeBytes) {
    }

    /** Looks up a file by its public download token; a malformed or unknown token is a 404. */
    private StoredFile findByToken(String token) {
        UUID uuid;
        try {
            uuid = UUID.fromString(token);
        } catch (IllegalArgumentException e) {
            throw new ResourceNotFoundException("Lien invalide");
        }
        return fileRepository.findByDownloadToken(uuid)
                .orElseThrow(() -> new ResourceNotFoundException("Lien invalide"));
    }

    /** Deletes a file the user owns: physical bytes first, then the metadata row. */
    public void deleteFile(UUID id, String email) {
        StoredFile file = fileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fichier introuvable"));
        requireOwner(file, email);

        storage.delete(file.getStoredName());
        fileRepository.delete(file);
    }

    /**
     * Replaces a file's tags wholesale (OpenAPI: PATCH /files/{id}/tags). 404 if unknown,
     * 403 for another user's file, 422 on a too-long tag or a duplicate.
     */
    public TagsResponse updateTags(UUID id, List<String> rawTags, String email) {
        StoredFile file = fileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fichier introuvable"));
        requireOwner(file, email);

        List<String> tags = normalizeTags(rawTags);
        file.setTags(tags);
        fileRepository.save(file);
        return new TagsResponse(tags);
    }

    /** Resolves the authenticated user by email (the JWT subject), or 401 if unknown. */
    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Authentification requise"));
    }

    private void requireOwner(StoredFile file, String email) {
        if (file.getOwner() == null || !email.equals(file.getOwner().getEmail())) {
            throw new ForbiddenException("Ce fichier appartient à un autre utilisateur");
        }
    }

    /**
     * Trims tags, drops blanks, and rejects over-long (&gt;30 chars) or duplicate labels
     * (case-insensitive) with a 422 — matching the OpenAPI tag rules.
     */
    private List<String> normalizeTags(List<String> raw) {
        if (raw == null) {
            return new ArrayList<>();
        }
        List<String> cleaned = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (String candidate : raw) {
            if (candidate == null) {
                continue;
            }
            String tag = candidate.trim();
            if (tag.isEmpty()) {
                continue;
            }
            if (tag.length() > MAX_TAG_LENGTH) {
                throw new ValidationException("Un tag ne peut pas dépasser 30 caractères");
            }
            if (!seen.add(tag.toLowerCase(Locale.ROOT))) {
                throw new ValidationException("Les tags ne peuvent pas comporter de doublon");
            }
            cleaned.add(tag);
        }
        return cleaned;
    }

    private FileListItem toListItem(StoredFile file) {
        return new FileListItem(
                file.getId(),
                file.getOriginalName(),
                file.getSizeBytes(),
                file.getUploadDate(),
                file.getExpirationDate(),
                file.getExpirationDate().isBefore(Instant.now()),
                downloadUrl(file.getDownloadToken()),
                List.copyOf(file.getTags()),
                file.getPassword() != null);
    }

    private void validate(MultipartFile file, Integer expiresInDays, String password) {
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
}
