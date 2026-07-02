package com.datashare.exception;

import org.springframework.http.HttpStatus;

/** Authenticated but not allowed: acting on a file owned by another user → 403. */
public class ForbiddenException extends DatashareException {

    public ForbiddenException(String message) {
        super(HttpStatus.FORBIDDEN, message);
    }
}
