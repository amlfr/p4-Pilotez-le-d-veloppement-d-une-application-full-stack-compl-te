package com.datashare.exception;

import org.springframework.http.HttpStatus;

/** An upload exceeding the 1 Go contract limit → 413. */
public class FileTooLargeException extends DatashareException {

    public FileTooLargeException(String message) {
        super(HttpStatus.PAYLOAD_TOO_LARGE, message);
    }
}
