package com.datashare.exception;

import org.springframework.http.HttpStatus;

/** Missing or wrong credentials: bad login, unknown JWT subject, wrong file password → 401. */
public class UnauthorizedException extends DatashareException {

    public UnauthorizedException(String message) {
        super(HttpStatus.UNAUTHORIZED, message);
    }
}
