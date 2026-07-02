package com.datashare.service;

import java.time.Instant;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.datashare.entity.StoredFile;
import com.datashare.repository.FileRepository;

/**
 * US10 — every day, deletes files whose expiration has passed: the physical
 * bytes first, then the metadata row. Download already returns 410 for expired
 * files; this reclaims the disk space and DB rows the contract requires.
 */
@Service
public class FileCleanupService {

    private static final Logger log = LoggerFactory.getLogger(FileCleanupService.class);

    private final FileRepository fileRepository;
    private final StorageService storage;

    public FileCleanupService(FileRepository fileRepository, StorageService storage) {
        this.fileRepository = fileRepository;
        this.storage = storage;
    }

    /**
     * Runs at 03:00 every day (cron: second minute hour day-of-month month day-of-week).
     * Configurable via {@code datashare.cleanup.cron} in application.properties.
     */
    @Scheduled(cron = "${datashare.cleanup.cron:0 0 3 * * *}")
    @Transactional
    public void purgeExpiredFiles() {
        List<StoredFile> expired = fileRepository.findByExpirationDateBefore(Instant.now());
        if (expired.isEmpty()) {
            return;
        }
        for (StoredFile file : expired) {
            storage.delete(file.getStoredName()); // missing bytes are tolerated
        }
        fileRepository.deleteAll(expired);
        log.info("Purge US10 : {} fichier(s) expiré(s) supprimé(s)", expired.size());
    }
}
