package com.datashare.exception;

import org.springframework.http.HttpStatus;

/** A file or download link that does not exist (or must appear not to) → 404. */
public class ResourceNotFoundException extends DatashareException {

    public ResourceNotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, message);
    }
}
