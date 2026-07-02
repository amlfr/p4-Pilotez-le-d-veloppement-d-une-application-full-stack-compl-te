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

/** {@link StorageService} keeping the bytes on the local disk, under a configured directory. */
@Service
public class DiskStorageService implements StorageService {

    private final Path root;

    public DiskStorageService(@Value("${datashare.storage.location}") String location) {
        this.root = Paths.get(location).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new IllegalStateException("Impossible de créer le répertoire de stockage: " + root, e);
        }
    }

    @Override
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

    @Override
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

    @Override
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
