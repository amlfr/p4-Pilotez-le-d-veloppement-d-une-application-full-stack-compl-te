package com.datashare.service;

import java.nio.file.Path;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

/**
 * Reads, writes and deletes the physical bytes of an uploaded file, identified by
 * its {@code storedName} (the generated UUID, never the user's filename).
 *
 * <p>Business code depends on this abstraction only (DIP): swapping the local-disk
 * implementation ({@link DiskStorageService}) for another backend (S3, blob store…)
 * would not touch {@code FileService} or the cleanup job.
 */
public interface StorageService {

    /**
     * Loads the physical file for streaming. Missing or unreadable bytes are signalled
     * with {@link com.datashare.exception.FileGoneException} (the metadata row outlived
     * its bytes), matching the download contract.
     */
    Resource load(String storedName);

    /** Removes the physical file; missing files are tolerated (already gone is fine). */
    void delete(String storedName);

    /** Writes the upload under {@code storedName}, returning the location used. */
    Path store(MultipartFile file, String storedName);
}
