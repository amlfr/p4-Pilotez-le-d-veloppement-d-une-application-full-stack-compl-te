package com.datashare.exception;

import org.springframework.http.HttpStatus;

/** A physical storage failure (disk read/write/delete) the client cannot fix → 500. */
public class StorageException extends DatashareException {

    public StorageException(String message) {
        super(HttpStatus.INTERNAL_SERVER_ERROR, message);
    }
}
