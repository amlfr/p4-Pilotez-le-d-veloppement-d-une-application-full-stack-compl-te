package com.datashare.service;

import java.nio.file.Path;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

/**
 * The physical bytes of an uploaded file, identified by {@code storedName} (the
 * generated UUID, never the user's filename). Business code only knows this
 * interface: the disk implementation ({@link DiskStorageService}) could be swapped
 * for S3 without touching {@code FileService}.
 */
public interface StorageService {

    /**
     * Loads the file for streaming. Missing or unreadable bytes →
     * {@link com.datashare.exception.FileGoneException} (the metadata row outlived its bytes).
     */
    Resource load(String storedName);

    /** Removes the physical file; missing files are tolerated (already gone is fine). */
    void delete(String storedName);

    /** Writes the upload under {@code storedName}, returning the location used. */
    Path store(MultipartFile file, String storedName);
}
