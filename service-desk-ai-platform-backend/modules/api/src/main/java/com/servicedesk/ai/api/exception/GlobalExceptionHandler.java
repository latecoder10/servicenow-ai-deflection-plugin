package com.servicedesk.ai.api.exception;

import com.servicedesk.ai.common.exception.DomainException;
import com.servicedesk.ai.common.exception.IntegrationException;
import com.servicedesk.ai.common.exception.ResourceNotFoundException;
import com.servicedesk.ai.common.model.CorrelationContext;
import com.servicedesk.ai.common.model.ProblemDetails;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.Instant;
import java.util.stream.Collectors;

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

    /**
     * Bean validation failures. Names the offending fields, because "400 Bad Request"
     * alone leaves the caller guessing which of them was wrong.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetails> handleValidation(MethodArgumentNotValidException ex) {
        String detail = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .collect(Collectors.joining("; "));
        if (detail.isBlank()) {
            detail = "Request validation failed";
        }
        log.warn("Validation failure: {}", detail);
        return problem("validation-failed", "Request Validation Failed", HttpStatus.BAD_REQUEST, detail);
    }

    /** A required query parameter was not supplied. */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ProblemDetails> handleMissingParam(MissingServletRequestParameterException ex) {
        String detail = "Required parameter '" + ex.getParameterName() + "' (" + ex.getParameterType() + ") is missing";
        log.warn("{}", detail);
        return problem("missing-parameter", "Missing Request Parameter", HttpStatus.BAD_REQUEST, detail);
    }

    /** A path variable or parameter could not be converted, e.g. a malformed UUID. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ProblemDetails> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String expected = ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "the expected type";
        String detail = "Parameter '" + ex.getName() + "' could not be read as " + expected;
        log.warn("{}: value was '{}'", detail, ex.getValue());
        return problem("invalid-parameter", "Invalid Parameter", HttpStatus.BAD_REQUEST, detail);
    }

    /** Malformed or unreadable request body. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ProblemDetails> handleUnreadableBody(HttpMessageNotReadableException ex) {
        log.warn("Unreadable request body: {}", ex.getMessage());
        return problem("malformed-request", "Malformed Request Body", HttpStatus.BAD_REQUEST,
            "The request body could not be parsed as JSON");
    }

    /**
     * Controllers that raise ResponseStatusException have already chosen a status.
     * Without this, the catch-all below would rewrite a deliberate 404 into a 500.
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ProblemDetails> handleResponseStatus(ResponseStatusException ex) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        if (status == null) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }
        log.warn("{} - {}", status, ex.getReason());
        return problem("request-failed", status.getReasonPhrase(), status,
            ex.getReason() != null ? ex.getReason() : status.getReasonPhrase());
    }

    /**
     * A URL that maps to nothing. Without this the catch-all answers 500, which tells a
     * caller the server broke when in fact they asked for a route that does not exist.
     */
    @ExceptionHandler({NoHandlerFoundException.class, NoResourceFoundException.class})
    public ResponseEntity<ProblemDetails> handleNoHandler(Exception ex) {
        log.warn("No handler for request: {}", ex.getMessage());
        return problem("not-found", "Not Found", HttpStatus.NOT_FOUND,
            "No endpoint matches this path and method");
    }

    /** Right path, wrong verb. */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ProblemDetails> handleMethodNotAllowed(HttpRequestMethodNotSupportedException ex) {
        String supported = ex.getSupportedHttpMethods() == null ? "none" : ex.getSupportedHttpMethods().toString();
        log.warn("Method {} not supported for this path; supported: {}", ex.getMethod(), supported);
        return problem("method-not-allowed", "Method Not Allowed", HttpStatus.METHOD_NOT_ALLOWED,
            ex.getMethod() + " is not supported here. Supported methods: " + supported);
    }

    /** Callers asking for something the platform does not support, e.g. an unknown connector. */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ProblemDetails> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Rejected request: {}", ex.getMessage());
        return problem("invalid-request", "Invalid Request", HttpStatus.BAD_REQUEST,
            ex.getMessage() != null ? ex.getMessage() : "The request could not be processed");
    }

    /**
     * Genuinely unexpected failures. The message is withheld from the caller because it
     * can carry internal detail; the correlation id ties the response to the full stack
     * trace in the log.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetails> handleGeneral(Exception ex) {
        log.error("Unhandled internal server error: {}", ex.getMessage(), ex);
        return problem("internal-server-error", "Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred. Please reference correlation ID: "
                + CorrelationContext.getCorrelationId());
    }

    private ResponseEntity<ProblemDetails> problem(String slug, String title, HttpStatus status, String detail) {
        return ResponseEntity.status(status).body(ProblemDetails.builder()
            .type("https://servicedesk.ai/errors/" + slug)
            .title(title)
            .status(status.value())
            .detail(detail)
            .instance("/api/v1")
            .correlationId(CorrelationContext.getCorrelationId())
            .timestamp(Instant.now())
            .build());
    }
}
