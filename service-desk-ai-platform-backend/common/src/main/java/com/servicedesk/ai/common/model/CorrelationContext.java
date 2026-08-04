package com.servicedesk.ai.common.model;

import java.util.UUID;

public class CorrelationContext {
    private static final ThreadLocal<String> CORRELATION_ID = new ThreadLocal<>();

    public static String getCorrelationId() {
        String current = CORRELATION_ID.get();
        if (current == null) {
            current = UUID.randomUUID().toString();
            CORRELATION_ID.set(current);
        }
        return current;
    }

    public static void setCorrelationId(String id) {
        CORRELATION_ID.set(id);
    }

    public static void clear() {
        CORRELATION_ID.remove();
    }
}
