package com.datashare.controller;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.List;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.datashare.dto.FileMetadata;
import com.datashare.dto.TagsRequest;
import com.datashare.dto.TagsResponse;
import com.datashare.dto.UploadResponse;
import com.datashare.service.FileService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    /** Upload a file (OpenAPI: POST /files). Authenticated → owned by the user;
     * anonymous → owner-less (US07). {@code principal} is null when no JWT is sent. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UploadResponse upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "expires_in_days", required = false) Integer expiresInDays,
            @RequestParam(value = "password", required = false) String password,
            @RequestParam(value = "tags", required = false) List<String> tags,
            Principal principal) {
        String email = principal != null ? principal.getName() : null;
        return fileService.upload(file, expiresInDays, password, tags, email);
    }

    /** File details before downloading — public (OpenAPI: GET /files/{token}). */
    @GetMapping("/{token}")
    public FileMetadata metadata(@PathVariable String token) {
        return fileService.getMetadata(token);
    }

    /** Download the file bytes — public, password required if the file is protected
     * (OpenAPI: GET /files/{token}/download). The password travels in the
     * X-File-Password header, never in the URL (query strings end up in access logs). */
    @GetMapping("/{token}/download")
    public ResponseEntity<Resource> download(
            @PathVariable String token,
            @RequestHeader(value = "X-File-Password", required = false) String password) {
        FileService.DownloadResult result = fileService.download(token, decodePassword(password));
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

    /** Replace a file's tags, owner only (OpenAPI: PATCH /files/{id}/tags). */
    @PatchMapping("/{id}/tags")
    public TagsResponse updateTags(
            @PathVariable UUID id,
            @RequestBody TagsRequest request,
            Principal principal) {
        return fileService.updateTags(id, request.tags(), principal.getName());
    }

    /**
     * The client URL-encodes the X-File-Password header so non-ASCII passwords survive
     * HTTP's Latin-1 header restriction. A value that is not valid percent-encoding is
     * used as-is (it will simply fail the password check).
     */
    private String decodePassword(String raw) {
        if (raw == null) {
            return null;
        }
        try {
            return URLDecoder.decode(raw, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            return raw;
        }
    }
}
