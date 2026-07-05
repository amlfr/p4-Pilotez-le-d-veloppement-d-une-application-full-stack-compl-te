package com.datashare.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.datashare.dto.FileListResponse;
import com.datashare.dto.FileMetadata;
import com.datashare.dto.TagsResponse;
import com.datashare.dto.UploadResponse;
import com.datashare.entity.StoredFile;
import com.datashare.entity.User;
import com.datashare.exception.FileGoneException;
import com.datashare.exception.ForbiddenException;
import com.datashare.exception.ResourceNotFoundException;
import com.datashare.exception.UnauthorizedException;
import com.datashare.exception.ValidationException;
import com.datashare.mapper.FileMapper;
import com.datashare.repository.FileRepository;
import com.datashare.repository.UserRepository;

/**
 * The file business logic (US01/02/06/07/08/09): upload ownership and tag
 * rules, the metadata/download gates (404/410/401), and the owner-only
 * delete/tag updates. Repositories, storage and encoder are mocked; the
 * validator and mapper are real — their own tests cover the fine print.
 */
@ExtendWith(MockitoExtension.class)
class FileServiceTest {

    private static final String EMAIL = "lea@example.com";

    @Mock
    private UserRepository userRepository;

    @Mock
    private FileRepository fileRepository;

    @Mock
    private StorageService storage;

    @Mock
    private PasswordEncoder passwordEncoder;

    private FileService service;

    private final User owner = User.builder()
            .id(UUID.randomUUID())
            .name("Léa")
            .email(EMAIL)
            .password("HASH")
            .build();

    @BeforeEach
    void setUp() {
        service = new FileService(
                userRepository,
                fileRepository,
                storage,
                passwordEncoder,
                new FileMapper("http://localhost:8080"),
                new FileUploadValidator());
    }

    // ── Upload (US01, US07, US08, US09) ─────────────────────────────

    @Test
    void uploadStoresOwnedFileAndReturnsDownloadUrl() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(owner));
        when(fileRepository.save(any(StoredFile.class))).thenAnswer(inv -> inv.getArgument(0));

        UploadResponse response = service.upload(
                upload("notes.txt"), 3, null, List.of(" cours ", "", "projet"), EMAIL);

        ArgumentCaptor<StoredFile> saved = ArgumentCaptor.forClass(StoredFile.class);
        verify(fileRepository).save(saved.capture());
        StoredFile file = saved.getValue();

        assertThat(file.getOwner()).isEqualTo(owner);
        assertThat(file.getOriginalName()).isEqualTo("notes.txt");
        // On-disk name is the download token, never the user-supplied filename.
        assertThat(file.getStoredName()).isEqualTo(file.getDownloadToken().toString());
        assertThat(file.getTags()).containsExactly("cours", "projet");
        assertThat(file.getPassword()).isNull();
        verify(storage).store(any(), any());
        assertThat(response.downloadUrl()).contains(file.getDownloadToken().toString());
    }

    @Test
    void uploadHashesThePasswordNeverStoresItPlain() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(owner));
        when(fileRepository.save(any(StoredFile.class))).thenAnswer(inv -> inv.getArgument(0));
        when(passwordEncoder.encode("secret6")).thenReturn("BCRYPT");

        service.upload(upload("a.txt"), 7, "secret6", null, EMAIL);

        ArgumentCaptor<StoredFile> saved = ArgumentCaptor.forClass(StoredFile.class);
        verify(fileRepository).save(saved.capture());
        assertThat(saved.getValue().getPassword()).isEqualTo("BCRYPT");
    }

    @Test
    void uploadWithoutRetentionDefaultsToSevenDays() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(owner));
        when(fileRepository.save(any(StoredFile.class))).thenAnswer(inv -> inv.getArgument(0));

        service.upload(upload("a.txt"), null, null, null, EMAIL);

        ArgumentCaptor<StoredFile> saved = ArgumentCaptor.forClass(StoredFile.class);
        verify(fileRepository).save(saved.capture());
        assertThat(saved.getValue().getExpirationDate())
                .isCloseTo(Instant.now().plus(7, ChronoUnit.DAYS),
                        org.assertj.core.api.Assertions.within(1, ChronoUnit.MINUTES));
    }

    @Test
    void anonymousUploadHasNoOwnerAndDropsTags() {
        when(fileRepository.save(any(StoredFile.class))).thenAnswer(inv -> inv.getArgument(0));

        service.upload(upload("a.txt"), 1, null, List.of("ignoré"), null);

        ArgumentCaptor<StoredFile> saved = ArgumentCaptor.forClass(StoredFile.class);
        verify(fileRepository).save(saved.capture());
        assertThat(saved.getValue().getOwner()).isNull();
        // US08: tags are a connected-user feature — silently dropped for anonymous.
        assertThat(saved.getValue().getTags()).isEmpty();
        verifyNoInteractions(userRepository);
    }

    @Test
    void uploadWithUnknownEmailIsUnauthorized() {
        when(userRepository.findByEmail("fantome@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.upload(upload("a.txt"), 7, null, null, "fantome@example.com"))
                .isInstanceOf(UnauthorizedException.class);

        verifyNoInteractions(storage);
    }

    @Test
    void uploadRejectsCaseInsensitiveDuplicateTagsBeforeTouchingDisk() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(owner));

        assertThatThrownBy(() -> service.upload(upload("a.txt"), 7, null, List.of("Cours", "cours"), EMAIL))
                .isInstanceOf(ValidationException.class);

        verifyNoInteractions(storage);
    }

    @Test
    void uploadRejectsTagOverThirtyChars() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(owner));

        assertThatThrownBy(() -> service.upload(
                upload("a.txt"), 7, null, List.of("a".repeat(31)), EMAIL))
                .isInstanceOf(ValidationException.class);
    }

    // ── Metadata & download (US02, US09) ────────────────────────────

    @Test
    void metadataExposesPasswordProtection() {
        StoredFile file = storedFile(future(), "BCRYPT");
        when(fileRepository.findByDownloadToken(file.getDownloadToken()))
                .thenReturn(Optional.of(file));

        FileMetadata metadata = service.getMetadata(file.getDownloadToken().toString());

        assertThat(metadata.passwordProtected()).isTrue();
        assertThat(metadata.originalName()).isEqualTo("notes.txt");
    }

    @Test
    void metadataOfExpiredFileIsNotFound() {
        StoredFile file = storedFile(past(), null);
        when(fileRepository.findByDownloadToken(file.getDownloadToken()))
                .thenReturn(Optional.of(file));

        assertThatThrownBy(() -> service.getMetadata(file.getDownloadToken().toString()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void downloadUnknownTokenIsNotFound() {
        when(fileRepository.findByDownloadToken(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.download(UUID.randomUUID().toString(), null))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void downloadMalformedTokenIsCleanNotFound() {
        assertThatThrownBy(() -> service.download("pas-un-uuid", null))
                .isInstanceOf(ResourceNotFoundException.class);

        verifyNoInteractions(fileRepository);
    }

    @Test
    void downloadExpiredFileIsGone() {
        StoredFile file = storedFile(past(), null);
        when(fileRepository.findByDownloadToken(file.getDownloadToken()))
                .thenReturn(Optional.of(file));

        assertThatThrownBy(() -> service.download(file.getDownloadToken().toString(), null))
                .isInstanceOf(FileGoneException.class);
    }

    @Test
    void protectedDownloadWithoutPasswordIsUnauthorized() {
        StoredFile file = storedFile(future(), "BCRYPT");
        when(fileRepository.findByDownloadToken(file.getDownloadToken()))
                .thenReturn(Optional.of(file));

        assertThatThrownBy(() -> service.download(file.getDownloadToken().toString(), null))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Mot de passe requis");
    }

    @Test
    void protectedDownloadWithWrongPasswordIsUnauthorized() {
        StoredFile file = storedFile(future(), "BCRYPT");
        when(fileRepository.findByDownloadToken(file.getDownloadToken()))
                .thenReturn(Optional.of(file));
        when(passwordEncoder.matches("mauvais", "BCRYPT")).thenReturn(false);

        assertThatThrownBy(() -> service.download(file.getDownloadToken().toString(), "mauvais"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Mot de passe incorrect");
    }

    @Test
    void protectedDownloadWithCorrectPasswordStreamsTheFile() {
        StoredFile file = storedFile(future(), "BCRYPT");
        when(fileRepository.findByDownloadToken(file.getDownloadToken()))
                .thenReturn(Optional.of(file));
        when(passwordEncoder.matches("secret6", "BCRYPT")).thenReturn(true);
        Resource resource = mock(Resource.class);
        when(storage.load(file.getStoredName())).thenReturn(resource);

        FileService.DownloadResult result =
                service.download(file.getDownloadToken().toString(), "secret6");

        assertThat(result.resource()).isSameAs(resource);
        assertThat(result.filename()).isEqualTo("notes.txt");
        assertThat(result.contentType()).isEqualTo("text/plain");
        assertThat(result.sizeBytes()).isEqualTo(42L);
    }

    // ── Delete & tags (US06, US08) ──────────────────────────────────

    @Test
    void ownerDeletesBytesThenRow() {
        StoredFile file = ownedFile();
        when(fileRepository.findById(file.getId())).thenReturn(Optional.of(file));

        service.deleteFile(file.getId(), EMAIL);

        verify(storage).delete(file.getStoredName());
        verify(fileRepository).delete(file);
    }

    @Test
    void deletingAnotherUsersFileIsForbidden() {
        StoredFile file = ownedFile();
        when(fileRepository.findById(file.getId())).thenReturn(Optional.of(file));

        assertThatThrownBy(() -> service.deleteFile(file.getId(), "autre@example.com"))
                .isInstanceOf(ForbiddenException.class);

        verifyNoInteractions(storage);
    }

    @Test
    void deletingAnOwnerlessFileIsForbidden() {
        StoredFile file = storedFile(future(), null);
        when(fileRepository.findById(file.getId())).thenReturn(Optional.of(file));

        assertThatThrownBy(() -> service.deleteFile(file.getId(), EMAIL))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void deletingUnknownFileIsNotFound() {
        UUID id = UUID.randomUUID();
        when(fileRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deleteFile(id, EMAIL))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateTagsReplacesTheWholeList() {
        StoredFile file = ownedFile();
        file.setTags(List.of("ancien"));
        when(fileRepository.findById(file.getId())).thenReturn(Optional.of(file));

        TagsResponse response = service.updateTags(file.getId(), List.of("remplacé", "neuf"), EMAIL);

        assertThat(response.tags()).containsExactly("remplacé", "neuf");
        assertThat(file.getTags()).containsExactly("remplacé", "neuf");
        verify(fileRepository).save(file);
    }

    @Test
    void updateTagsOnUnknownFileIsNotFound() {
        UUID id = UUID.randomUUID();
        when(fileRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateTags(id, List.of("x"), EMAIL))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateTagsOnAnotherUsersFileIsForbidden() {
        StoredFile file = ownedFile();
        when(fileRepository.findById(file.getId())).thenReturn(Optional.of(file));

        assertThatThrownBy(() -> service.updateTags(file.getId(), List.of("x"), "autre@example.com"))
                .isInstanceOf(ForbiddenException.class);
    }

    // ── History (US05) ──────────────────────────────────────────────

    @Test
    void listFilesClampsPageAndPerPage() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(owner));
        when(fileRepository.findByOwner(any(), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of()));

        FileListResponse response = service.listFiles(0, 100, null, EMAIL);

        ArgumentCaptor<PageRequest> pageable = ArgumentCaptor.forClass(PageRequest.class);
        verify(fileRepository).findByOwner(any(), pageable.capture());
        // Spec page is 1-based (clamped to 1 → index 0); per_page is capped at 50.
        assertThat(pageable.getValue().getPageNumber()).isZero();
        assertThat(pageable.getValue().getPageSize()).isEqualTo(50);
        assertThat(response.page()).isEqualTo(1);
        assertThat(response.perPage()).isEqualTo(50);
    }

    // ── Helpers ─────────────────────────────────────────────────────

    private MockMultipartFile upload(String name) {
        return new MockMultipartFile("file", name, "text/plain", "contenu".getBytes());
    }

    private StoredFile storedFile(Instant expiration, String passwordHash) {
        UUID token = UUID.randomUUID();
        return StoredFile.builder()
                .id(UUID.randomUUID())
                .originalName("notes.txt")
                .storedName(token.toString())
                .sizeBytes(42L)
                .contentType("text/plain")
                .password(passwordHash)
                .downloadToken(token)
                .uploadDate(Instant.now())
                .expirationDate(expiration)
                .build();
    }

    private StoredFile ownedFile() {
        StoredFile file = storedFile(future(), null);
        file.setOwner(owner);
        return file;
    }

    private Instant future() {
        return Instant.now().plus(3, ChronoUnit.DAYS);
    }

    private Instant past() {
        return Instant.now().minus(1, ChronoUnit.DAYS);
    }
}
