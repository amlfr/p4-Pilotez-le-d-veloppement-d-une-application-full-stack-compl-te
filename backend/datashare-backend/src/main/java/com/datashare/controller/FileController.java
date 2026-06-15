package com.datashare.controller;

import java.security.Principal;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.datashare.dto.UploadResponse;
import com.datashare.service.FileService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    /** Upload a file for the authenticated user (OpenAPI: POST /files). */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UploadResponse upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "expires_in_days", required = false) Integer expiresInDays,
            @RequestParam(value = "password", required = false) String password,
            Principal principal) {
        return fileService.upload(file, expiresInDays, password, principal.getName());
    }

    /** Delete a file, owner only (OpenAPI: DELETE /files/{id}). */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, Principal principal) {
        fileService.deleteFile(id, principal.getName());
    }
}
