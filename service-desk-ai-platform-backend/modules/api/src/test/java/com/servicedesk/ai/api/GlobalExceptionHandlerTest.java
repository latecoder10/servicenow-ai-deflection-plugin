package com.servicedesk.ai.api;

import com.servicedesk.ai.api.exception.GlobalExceptionHandler;
import com.servicedesk.ai.common.model.ProblemDetails;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Every one of these previously answered 500, which told a caller nothing about
 * whether they had sent a bad request or the server had broken.
 */
class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("Validation failures are 400 and name the offending field")
    void validationFailureIsBadRequest() throws Exception {
        BindingResult binding = new BeanPropertyBindingResult(new Object(), "resolveIncidentRequest");
        binding.rejectValue(null, "Size", "Title must be between 3 and 250 characters");
        binding.addError(new org.springframework.validation.FieldError(
            "resolveIncidentRequest", "title", "Title must be between 3 and 250 characters"));

        MethodParameter param = new MethodParameter(
            GlobalExceptionHandlerTest.class.getDeclaredMethod("dummy", String.class), 0);
        ResponseEntity<ProblemDetails> response =
            handler.handleValidation(new MethodArgumentNotValidException(param, binding));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().detail().contains("title"),
            "the caller must be told which field failed");
    }

    @Test
    @DisplayName("A missing required parameter is 400, not 500")
    void missingParameterIsBadRequest() {
        ResponseEntity<ProblemDetails> response = handler.handleMissingParam(
            new MissingServletRequestParameterException("query", "String"));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().detail().contains("query"));
    }

    @Test
    @DisplayName("An unparseable path variable is 400, not 500")
    void typeMismatchIsBadRequest() {
        ResponseEntity<ProblemDetails> response = handler.handleTypeMismatch(
            new MethodArgumentTypeMismatchException("not-a-uuid", UUID.class, "jobId", null, null));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().detail().contains("jobId"));
    }

    @Test
    @DisplayName("Malformed JSON is 400, not 500")
    void unreadableBodyIsBadRequest() {
        ResponseEntity<ProblemDetails> response = handler.handleUnreadableBody(
            new HttpMessageNotReadableException("boom", (org.springframework.http.HttpInputMessage) null));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("A controller's chosen status survives instead of being rewritten to 500")
    void responseStatusExceptionKeepsItsStatus() {
        ResponseEntity<ProblemDetails> response = handler.handleResponseStatus(
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Record abc was not found in ServiceNow"));

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals(404, response.getBody().status());
        assertTrue(response.getBody().detail().contains("abc"));
    }

    @Test
    @DisplayName("An unsupported connector type is 400, not 500")
    void illegalArgumentIsBadRequest() {
        ResponseEntity<ProblemDetails> response = handler.handleIllegalArgument(
            new IllegalArgumentException("Unsupported connector type: NOPE"));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().detail().contains("NOPE"));
    }

    @Test
    @DisplayName("Genuine faults stay 500 and withhold the internal message")
    void unexpectedFailureStaysInternalAndDoesNotLeak() {
        ResponseEntity<ProblemDetails> response = handler.handleGeneral(
            new IllegalStateException("jdbc password is hunter2"));

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertFalse(response.getBody().detail().contains("hunter2"),
            "internal detail must not be echoed to the caller");
    }

    @SuppressWarnings("unused")
    private void dummy(String value) {
        // Only exists to give MethodParameter something to point at.
    }
}
