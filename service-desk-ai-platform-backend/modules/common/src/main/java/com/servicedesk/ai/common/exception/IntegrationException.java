package com.servicedesk.ai.common.exception;

public class IntegrationException extends DomainException {
    private final String targetSystem;

    public IntegrationException(String targetSystem, String message) {
        super("INTEGRATION_ERROR", String.format("Integration failure with system [%s]: %s", targetSystem, message));
        this.targetSystem = targetSystem;
    }

    public IntegrationException(String targetSystem, String message, Throwable cause) {
        super("INTEGRATION_ERROR", String.format("Integration failure with system [%s]: %s", targetSystem, message), cause);
        this.targetSystem = targetSystem;
    }

    public String getTargetSystem() {
        return targetSystem;
    }
}
