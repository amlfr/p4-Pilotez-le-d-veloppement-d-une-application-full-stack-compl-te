package com.datashare.exception;

import org.springframework.http.HttpStatus;

/**
 * Base of all business exceptions. Each subclass names a domain failure
 * (link not found, wrong password, file too large…) and encapsulates the
 * HTTP status the API contract maps it to, so the service layer never
 * manipulates statuses itself — {@link GlobalExceptionHandler} does the
 * translation into the OpenAPI ErrorResponse shape.
 */
public abstract class DatashareException extends RuntimeException {

    private final HttpStatus status;

    protected DatashareException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
