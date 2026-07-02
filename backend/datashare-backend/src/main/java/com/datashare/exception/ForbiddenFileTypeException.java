package com.datashare.exception;

import org.springframework.http.HttpStatus;

/** An upload with an executable extension refused by the contract → 415. */
public class ForbiddenFileTypeException extends DatashareException {

    public ForbiddenFileTypeException(String message) {
        super(HttpStatus.UNSUPPORTED_MEDIA_TYPE, message);
    }
}
