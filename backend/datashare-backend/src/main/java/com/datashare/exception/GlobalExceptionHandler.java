package com.datashare.exception;

import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.server.ResponseStatusException;

import com.datashare.dto.ErrorResponse;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /** @Valid failures → 422 with the OpenAPI ErrorResponse shape. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public ErrorResponse handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return ErrorResponse.of(HttpStatus.UNPROCESSABLE_ENTITY, message);
    }

    /** A multipart upload missing its required `file` part → 422. */
    @ExceptionHandler({MissingServletRequestPartException.class, MissingServletRequestParameterException.class})
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public ErrorResponse handleMissingPart(Exception ex) {
        return ErrorResponse.of(HttpStatus.UNPROCESSABLE_ENTITY, "Le fichier est requis");
    }

    /** Upload exceeding the multipart limit → 413 (the contract's oversize response). */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    @ResponseStatus(HttpStatus.PAYLOAD_TOO_LARGE)
    public ErrorResponse handleMaxSize(MaxUploadSizeExceededException ex) {
        return ErrorResponse.of(HttpStatus.PAYLOAD_TOO_LARGE, "La taille des fichiers est limitée à 1 Go");
    }

    /** Business errors (401, 409, …) thrown as ResponseStatusException → ErrorResponse shape. */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatus(ResponseStatusException ex) {
        HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
        return ResponseEntity.status(status).body(ErrorResponse.of(status, ex.getReason()));
    }
}
