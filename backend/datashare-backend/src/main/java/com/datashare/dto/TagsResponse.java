package com.datashare.dto;

import java.util.List;

/** Updated tag list returned after a PATCH (OpenAPI: PATCH /files/{id}/tags). */
public record TagsResponse(List<String> tags) {
}
