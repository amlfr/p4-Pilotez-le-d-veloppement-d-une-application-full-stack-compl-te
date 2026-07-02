package com.datashare.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.datashare.entity.StoredFile;
import com.datashare.repository.FileRepository;

/**
 * US10 — verifies the daily purge deletes the disk bytes and the metadata rows
 * for expired files, and does nothing when none have expired. No DB needed: the
 * repository and storage are mocked, so this runs in milliseconds.
 */
@ExtendWith(MockitoExtension.class)
class FileCleanupServiceTest {

    @Mock
    private FileRepository fileRepository;

    @Mock
    private StorageService storage;

    @InjectMocks
    private FileCleanupService cleanup;

    @Test
    void deletesBytesAndRowsForExpiredFiles() {
        StoredFile expired = expiredFile("stored-a");
        StoredFile alsoExpired = expiredFile("stored-b");
        when(fileRepository.findByExpirationDateBefore(any(Instant.class)))
                .thenReturn(List.of(expired, alsoExpired));

        cleanup.purgeExpiredFiles();

        verify(storage).delete("stored-a");
        verify(storage).delete("stored-b");
        verify(fileRepository).deleteAll(List.of(expired, alsoExpired));
    }

    @Test
    void doesNothingWhenNoFilesExpired() {
        when(fileRepository.findByExpirationDateBefore(any(Instant.class)))
                .thenReturn(List.of());

        cleanup.purgeExpiredFiles();

        verify(storage, never()).delete(any());
        verify(fileRepository, never()).deleteAll(any());
    }

    private StoredFile expiredFile(String storedName) {
        return StoredFile.builder()
                .storedName(storedName)
                .originalName("old.txt")
                .sizeBytes(0)
                .contentType("text/plain")
                .downloadToken(UUID.randomUUID())
                .uploadDate(Instant.now().minus(10, ChronoUnit.DAYS))
                .expirationDate(Instant.now().minus(1, ChronoUnit.DAYS))
                .build();
    }
}
