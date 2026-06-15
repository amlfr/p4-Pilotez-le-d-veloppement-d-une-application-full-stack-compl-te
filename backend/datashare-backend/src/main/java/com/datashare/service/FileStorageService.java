package com.datashare.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

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

    /** Removes the physical file; missing files are tolerated (already gone is fine). */
    public void delete(String storedName) {
        Path target = root.resolve(storedName).normalize();
        if (!target.startsWith(root)) {
            return;
        }
        try {
            Files.deleteIfExists(target);
        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Échec de la suppression du fichier");
        }
    }

    /** Writes the upload to disk under {@code storedName}, returning the absolute path used. */
    public Path store(MultipartFile file, String storedName) {
        Path target = root.resolve(storedName).normalize();
        // Defence in depth: storedName is a generated UUID, but never let a write escape root.
        if (!target.startsWith(root)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chemin de fichier invalide");
        }
        try {
            file.transferTo(target);
            return target;
        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Échec de l'enregistrement du fichier");
        }
    }
}
