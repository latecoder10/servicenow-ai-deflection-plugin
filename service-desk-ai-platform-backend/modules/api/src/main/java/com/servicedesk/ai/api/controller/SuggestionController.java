package com.servicedesk.ai.api.controller;

import com.servicedesk.ai.api.dto.request.ResolveIncidentRequest;
import com.servicedesk.ai.api.dto.response.SuggestionResponse;
import com.servicedesk.ai.api.mapper.SourceReferenceMapper;
import com.servicedesk.ai.application.port.in.SuggestResolutionUseCase;
import com.servicedesk.ai.application.service.DeflectionTelemetryService;
import com.servicedesk.ai.domain.model.ResolutionSuggestion;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Tag(name = "AI Suggestion Engine", description = "Real-time AI Incident Deflection & Resolution Generation")
@RestController
@RequestMapping("/api/v1/suggestions")
@RequiredArgsConstructor
public class SuggestionController {

    private final SuggestResolutionUseCase suggestResolutionUseCase;
    private final SourceReferenceMapper sourceReferenceMapper;
    private final DeflectionTelemetryService telemetryService;

    @Operation(summary = "Generate AI resolution for ServiceNow pre-ticket query")
    @PostMapping("/resolve")
    public ResponseEntity<SuggestionResponse> resolveIncident(@Valid @RequestBody ResolveIncidentRequest request) {
        SuggestResolutionUseCase.Command command = new SuggestResolutionUseCase.Command(
            request.title(),
            request.description(),
            request.callerEmail(),
            request.userDepartment(),
            request.category(),
            request.minConfidenceThreshold(),
            Boolean.TRUE.equals(request.includeDriveResults())
        );

        ResolutionSuggestion suggestion = suggestResolutionUseCase.suggestResolution(command);

        SuggestionResponse response = new SuggestionResponse(
            suggestion.getSuggestionId(),
            suggestion.getQueryTitle(),
            suggestion.getRecommendedTitle(),
            suggestion.getSummaryResolution(),
            suggestion.getStepByStepInstructions(),
            suggestion.getCodeOrCommandSnippet(),
            suggestion.getConfidenceScore().value(),
            suggestion.getConfidenceScore().confidenceBand(),
            suggestion.isDeflectionSuccessful(),
            suggestion.getReferencedSources() != null ? suggestion.getReferencedSources().size() : 0,
            sourceReferenceMapper.toReferences(suggestion.getReferencedSources()),
            suggestion.getGeneratedByModel(),
            suggestion.getCreatedAt(),
            suggestion.getCorrelationId()
        );

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Record whether a suggestion actually resolved the problem")
    @PostMapping("/{suggestionId}/feedback")
    public ResponseEntity<Map<String, Object>> recordFeedback(
            @PathVariable String suggestionId,
            @RequestParam(name = "outcome") String outcome) {

        // Only two outcomes are meaningful, and accepting anything else would quietly
        // corrupt the deflection rate.
        String normalised = outcome == null ? "" : outcome.trim().toUpperCase();
        if (!normalised.equals("SOLVED") && !normalised.equals("CONTINUED")) {
            throw new IllegalArgumentException(
                "outcome must be SOLVED or CONTINUED, received: " + outcome);
        }

        boolean recorded = telemetryService.recordOutcome(suggestionId, normalised);
        if (!recorded) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                "No suggestion recorded with id " + suggestionId);
        }

        return ResponseEntity.ok(Map.of(
            "suggestionId", suggestionId,
            "outcome", normalised,
            "message", "Feedback recorded"
        ));
    }
}
