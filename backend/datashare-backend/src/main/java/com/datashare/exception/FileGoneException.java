package com.datashare.exception;

import org.springframework.http.HttpStatus;

/** The link existed but the file is no longer served: expired, or its bytes are missing → 410. */
public class FileGoneException extends DatashareException {

    public FileGoneException(String message) {
        super(HttpStatus.GONE, message);
    }
}
