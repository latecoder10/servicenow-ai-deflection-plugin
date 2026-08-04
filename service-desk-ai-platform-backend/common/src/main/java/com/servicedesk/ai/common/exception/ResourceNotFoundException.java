package com.servicedesk.ai.common.exception;

public class ResourceNotFoundException extends DomainException {
    public ResourceNotFoundException(String resourceType, String id) {
        super("RESOURCE_NOT_FOUND", String.format("%s with identifier '%s' was not found", resourceType, id));
    }
}
