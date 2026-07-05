package com.datashare.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import com.datashare.exception.FileTooLargeException;
import com.datashare.exception.ForbiddenFileTypeException;
import com.datashare.exception.ValidationException;

/**
 * US01 — the upload input rules (contract: POST /files): file present, at most
 * 1 Go, no executable extension, retention 1..7 days, password of 6+ chars if
 * given. Pure unit tests, no Spring context.
 */
class FileUploadValidatorTest {

    private final FileUploadValidator validator = new FileUploadValidator();

    @Test
    void rejectsNullFile() {
        assertThatThrownBy(() -> validator.validate(null, 7, null))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void rejectsEmptyFile() {
        MockMultipartFile empty = new MockMultipartFile("file", "empty.txt", "text/plain", new byte[0]);

        assertThatThrownBy(() -> validator.validate(empty, 7, null))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void rejectsFileOverOneGigabyte() {
        // Stubbed size: allocating a real 1 Go payload would be absurd in a unit test.
        MultipartFile huge = mock(MultipartFile.class);
        when(huge.isEmpty()).thenReturn(false);
        when(huge.getSize()).thenReturn(1024L * 1024 * 1024 + 1);

        assertThatThrownBy(() -> validator.validate(huge, 7, null))
                .isInstanceOf(FileTooLargeException.class);
    }

    @Test
    void rejectsForbiddenExtension() {
        assertThatThrownBy(() -> validator.validate(file("virus.exe"), 7, null))
                .isInstanceOf(ForbiddenFileTypeException.class);
    }

    @Test
    void rejectsForbiddenExtensionCaseInsensitively() {
        assertThatThrownBy(() -> validator.validate(file("VIRUS.EXE"), 7, null))
                .isInstanceOf(ForbiddenFileTypeException.class);
    }

    @Test
    void acceptsAllowedExtension() {
        assertThatCode(() -> validator.validate(file("report.pdf"), 7, null))
                .doesNotThrowAnyException();
    }

    @Test
    void acceptsFileWithoutExtension() {
        assertThatCode(() -> validator.validate(file("README"), 7, null))
                .doesNotThrowAnyException();
    }

    @Test
    void rejectsRetentionOutOfRange() {
        assertThatThrownBy(() -> validator.validate(file("a.txt"), 0, null))
                .isInstanceOf(ValidationException.class);
        assertThatThrownBy(() -> validator.validate(file("a.txt"), 8, null))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void acceptsRetentionBoundsAndDefault() {
        assertThatCode(() -> validator.validate(file("a.txt"), 1, null)).doesNotThrowAnyException();
        assertThatCode(() -> validator.validate(file("a.txt"), 7, null)).doesNotThrowAnyException();
        // null means "not sent" — the service falls back to the 7-day default.
        assertThatCode(() -> validator.validate(file("a.txt"), null, null)).doesNotThrowAnyException();
    }

    @Test
    void rejectsPasswordShorterThanSixChars() {
        assertThatThrownBy(() -> validator.validate(file("a.txt"), 7, "abc"))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void acceptsValidMissingOrBlankPassword() {
        assertThatCode(() -> validator.validate(file("a.txt"), 7, "secret6")).doesNotThrowAnyException();
        assertThatCode(() -> validator.validate(file("a.txt"), 7, null)).doesNotThrowAnyException();
        // Blank means "field left empty in the form" — not a password at all.
        assertThatCode(() -> validator.validate(file("a.txt"), 7, "  ")).doesNotThrowAnyException();
    }

    private MockMultipartFile file(String name) {
        return new MockMultipartFile("file", name, "application/octet-stream", "contenu".getBytes());
    }
}
