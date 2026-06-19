package com.datashare.controller;

import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.datashare.dto.FileMetadata;
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

    /** File details before downloading — public (OpenAPI: GET /files/{token}). */
    @GetMapping("/{token}")
    public FileMetadata metadata(@PathVariable String token) {
        return fileService.getMetadata(token);
    }

    /** Download the file bytes — public, password required if the file is protected
     * (OpenAPI: GET /files/{token}/download). */
    @GetMapping("/{token}/download")
    public ResponseEntity<Resource> download(
            @PathVariable String token,
            @RequestParam(value = "password", required = false) String password) {
        FileService.DownloadResult result = fileService.download(token, password);
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(result.filename(), StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(result.contentType()))
                .contentLength(result.sizeBytes())
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(result.resource());
    }

    /** Delete a file, owner only (OpenAPI: DELETE /files/{id}). */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, Principal principal) {
        fileService.deleteFile(id, principal.getName());
    }
}
