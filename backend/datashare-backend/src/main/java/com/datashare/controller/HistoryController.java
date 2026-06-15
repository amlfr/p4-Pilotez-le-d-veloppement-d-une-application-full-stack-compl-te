package com.datashare.controller;

import java.security.Principal;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.datashare.dto.FileListResponse;
import com.datashare.service.FileService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class HistoryController {

    private final FileService fileService;

    /** The authenticated user's upload history (OpenAPI: GET /me/files). */
    @GetMapping("/api/me/files")
    public FileListResponse listMyFiles(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "per_page", defaultValue = "20") int perPage,
            Principal principal) {
        return fileService.listFiles(page, perPage, principal.getName());
    }
}
