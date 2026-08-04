package com.servicedesk.ai.api.exception;

import com.servicedesk.ai.common.exception.DomainException;
import com.servicedesk.ai.common.exception.IntegrationException;
import com.servicedesk.ai.common.exception.ResourceNotFoundException;
import com.servicedesk.ai.common.model.CorrelationContext;
import com.servicedesk.ai.common.model.ProblemDetails;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ProblemDetails> handleNotFound(ResourceNotFoundException ex) {
        log.warn("Resource not found exception: {}", ex.getMessage());
        ProblemDetails problem = ProblemDetails.builder()
            .type("https://servicedesk.ai/errors/not-found")
            .title("Resource Not Found")
            .status(HttpStatus.NOT_FOUND.value())
            .detail(ex.getMessage())
            .instance("/api/v1")
            .correlationId(CorrelationContext.getCorrelationId())
            .timestamp(Instant.now())
            .build();
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(problem);
    }

    @ExceptionHandler(IntegrationException.class)
    public ResponseEntity<ProblemDetails> handleIntegration(IntegrationException ex) {
        log.error("Integration exception for target {}: {}", ex.getTargetSystem(), ex.getMessage());
        ProblemDetails problem = ProblemDetails.builder()
            .type("https://servicedesk.ai/errors/integration-failure")
            .title("External System Integration Failure")
            .status(HttpStatus.BAD_GATEWAY.value())
            .detail(ex.getMessage())
            .instance("/api/v1")
            .correlationId(CorrelationContext.getCorrelationId())
            .timestamp(Instant.now())
            .build();
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(problem);
    }

    @ExceptionHandler(DomainException.class)
    public ResponseEntity<ProblemDetails> handleDomain(DomainException ex) {
        log.warn("Domain exception [{}]: {}", ex.getErrorCode(), ex.getMessage());
        ProblemDetails problem = ProblemDetails.builder()
            .type("https://servicedesk.ai/errors/domain")
            .title("Domain Violation")
            .status(HttpStatus.UNPROCESSABLE_ENTITY.value())
            .detail(ex.getMessage())
            .instance("/api/v1")
            .correlationId(CorrelationContext.getCorrelationId())
            .timestamp(Instant.now())
            .build();
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(problem);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetails> handleGeneral(Exception ex) {
        log.error("Unhandled internal server error: {}", ex.getMessage(), ex);
        ProblemDetails problem = ProblemDetails.builder()
            .type("https://servicedesk.ai/errors/internal-server-error")
            .title("Internal Server Error")
            .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
            .detail("An unexpected error occurred. Please reference correlation ID: " + CorrelationContext.getCorrelationId())
            .instance("/api/v1")
            .correlationId(CorrelationContext.getCorrelationId())
            .timestamp(Instant.now())
            .build();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(problem);
    }
}
