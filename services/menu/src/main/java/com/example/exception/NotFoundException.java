package com.example.exception;

public class NotFoundException extends RuntimeException {
    public NotFoundException(String entity, String keyName, String keyValue) {
        super(String.format("%s not found with %s=%s", entity, keyName, keyValue));
    }
}