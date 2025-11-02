package com.qulron.qulron_engine.exception;

// Custom exception for clarity
public class JwtAuthenticationException extends RuntimeException {
    public JwtAuthenticationException(String message, Throwable cause) {
        super(message, cause);
    }
}
