package com.datashare.service;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.datashare.exception.FileGoneException;
import com.datashare.exception.StorageException;

/** Reads and writes the physical file bytes under a configured storage directory. */
@Service
public class FileStorageService {

    private final Path root;

    public FileStorageService(@Value("${datashare.storage.location}") String location) {
        this.root = Paths.get(location).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new IllegalStateException("Impossible de créer le répertoire de stockage: " + root, e);
        }
    }

    /**
     * Loads the physical file for streaming. A missing or unreadable file is signalled as
     * "gone", matching the download contract (the metadata row outlived its bytes).
     */
    public Resource load(String storedName) {
        Path target = root.resolve(storedName).normalize();
        if (!target.startsWith(root)) {
            throw new StorageException("Chemin de fichier invalide");
        }
        try {
            Resource resource = new UrlResource(target.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new FileGoneException("Le fichier a expiré ou a été supprimé");
            }
            return resource;
        } catch (MalformedURLException e) {
            throw new StorageException("Échec de la lecture du fichier");
        }
    }

    /** Removes the physical file; missing files are tolerated (already gone is fine). */
    public void delete(String storedName) {
        Path target = root.resolve(storedName).normalize();
        if (!target.startsWith(root)) {
            return;
        }
        try {
            Files.deleteIfExists(target);
        } catch (IOException e) {
            throw new StorageException("Échec de la suppression du fichier");
        }
    }

    /** Writes the upload to disk under {@code storedName}, returning the absolute path used. */
    public Path store(MultipartFile file, String storedName) {
        Path target = root.resolve(storedName).normalize();
        // Defence in depth: storedName is a generated UUID, but never let a write escape root.
        if (!target.startsWith(root)) {
            throw new StorageException("Chemin de fichier invalide");
        }
        try {
            file.transferTo(target);
            return target;
        } catch (IOException e) {
            throw new StorageException("Échec de l'enregistrement du fichier");
        }
    }
}
