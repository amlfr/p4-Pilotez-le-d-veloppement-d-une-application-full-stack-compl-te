package com.datashare.exception;

import org.springframework.http.HttpStatus;

/**
 * Base of every business exception. A subclass names what went wrong (link not
 * found, wrong password…) and knows which HTTP status that maps to, so services
 * never deal with HTTP themselves — {@link GlobalExceptionHandler} translates.
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
