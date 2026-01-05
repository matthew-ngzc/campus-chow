package com.example.exception;

public class DuplicateException extends RuntimeException {
    public DuplicateException(String entity, String keyName, String keyValue) {
        super(String.format("%s already exists with %s=%s", entity, keyName, keyValue));
    }
}
