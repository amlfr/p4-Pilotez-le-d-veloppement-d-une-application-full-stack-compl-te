package com.datashare.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

/** Paginated file history (OpenAPI: FileListResponse). */
public record FileListResponse(
        List<FileListItem> data,
        long total,
        int page,
        @JsonProperty("per_page") int perPage
) {
}
