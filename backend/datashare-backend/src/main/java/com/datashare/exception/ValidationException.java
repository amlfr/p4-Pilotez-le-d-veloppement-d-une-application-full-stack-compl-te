package com.datashare.exception;

import org.springframework.http.HttpStatus;

/** A request field breaking a business rule (retention range, tag rules, password length…) → 422. */
public class ValidationException extends DatashareException {

    public ValidationException(String message) {
        super(HttpStatus.UNPROCESSABLE_CONTENT, message);
    }
}
