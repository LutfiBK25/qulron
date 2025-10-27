package com.qulron.qulron_engine.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handle validation errors from @Valid annotations
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        Map<String, Object> response = new HashMap<>();
        response.put("statusCode", 400);
        response.put("message", "Validation failed");
        response.put("errors", errors);

        log.warn("Validation failed: {}", errors);
        return ResponseEntity.badRequest().body(response);
    }

    /**
     * Handle general exceptions
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneralException(Exception ex) {
        log.error("Unhandled exception occurred", ex);

        Map<String, Object> response = new HashMap<>();
        response.put("statusCode", 500);
        response.put("message", "Internal server error occurred");
        response.put("error", ex.getMessage());

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    /**
     * Handle IllegalArgumentException
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(IllegalArgumentException ex) {
        log.warn("Illegal argument provided: {}", ex.getMessage());

        Map<String, Object> response = new HashMap<>();
        response.put("statusCode", 400);
        response.put("message", "Invalid request");
        response.put("error", ex.getMessage());

        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(OrderNotFoundException.class)
    public ResponseEntity<Map<String,Object>> handleOrderNotFoundException(OrderNotFoundException ex){
        log.warn("Order not Found Exception: {}", ex.getMessage());

        Map<String,Object> response = new HashMap<>();
        response.put("statusCode", 400);
        response.put("message", "Order was not found");
        response.put("error", ex.getMessage());

        return ResponseEntity.badRequest().body(response);
    }
}