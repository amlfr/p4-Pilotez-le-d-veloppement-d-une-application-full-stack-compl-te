package com.datashare.exception;

import org.springframework.http.HttpStatus;

/** Registration with an email that already has an account → 409. */
public class EmailAlreadyUsedException extends DatashareException {

    public EmailAlreadyUsedException(String message) {
        super(HttpStatus.CONFLICT, message);
    }
}
