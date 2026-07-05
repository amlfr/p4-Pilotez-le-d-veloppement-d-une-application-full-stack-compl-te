package com.datashare.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;

import com.datashare.exception.FileGoneException;
import com.datashare.exception.StorageException;

/**
 * Disk storage under a JUnit temp directory: store/load/delete roundtrip, 410
 * for missing bytes, and the path-traversal guard — a stored name may never
 * escape the storage root.
 */
class DiskStorageServiceTest {

    @TempDir
    Path tempDir;

    private DiskStorageService storage;

    @BeforeEach
    void setUp() {
        storage = new DiskStorageService(tempDir.toString());
    }

    @Test
    void storeWritesBytesUnderTheStoredName() throws Exception {
        storage.store(upload("bonjour"), "token-123");

        Path written = tempDir.resolve("token-123");
        assertThat(written).exists();
        assertThat(Files.readString(written)).isEqualTo("bonjour");
    }

    @Test
    void loadReadsBackAStoredFile() {
        storage.store(upload("contenu"), "token-123");

        Resource resource = storage.load("token-123");

        assertThat(resource.exists()).isTrue();
        assertThat(resource.isReadable()).isTrue();
    }

    @Test
    void loadMissingFileIsGone() {
        assertThatThrownBy(() -> storage.load("jamais-ecrit"))
                .isInstanceOf(FileGoneException.class);
    }

    @Test
    void deleteRemovesTheFileAndToleratesMissingOnes() {
        storage.store(upload("contenu"), "token-123");

        storage.delete("token-123");

        assertThat(tempDir.resolve("token-123")).doesNotExist();
        assertThatCode(() -> storage.delete("token-123")).doesNotThrowAnyException();
    }

    @Test
    void traversingStoredNameCannotEscapeTheRoot() {
        assertThatThrownBy(() -> storage.store(upload("piege"), "../evasion"))
                .isInstanceOf(StorageException.class);
        assertThatThrownBy(() -> storage.load("../evasion"))
                .isInstanceOf(StorageException.class);
        // delete() swallows traversal silently — but must not touch the file either.
        assertThatCode(() -> storage.delete("../evasion")).doesNotThrowAnyException();
        assertThat(tempDir.getParent().resolve("evasion")).doesNotExist();
    }

    private MockMultipartFile upload(String content) {
        return new MockMultipartFile("file", "notes.txt", "text/plain", content.getBytes());
    }
}
