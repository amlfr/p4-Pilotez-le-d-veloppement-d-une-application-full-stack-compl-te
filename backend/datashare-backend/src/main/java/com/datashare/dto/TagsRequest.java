package com.datashare.dto;

import java.util.List;

/** Full replacement list of tags for a file (OpenAPI: PATCH /files/{id}/tags). */
public record TagsRequest(List<String> tags) {
}
