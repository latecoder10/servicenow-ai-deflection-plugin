package com.servicedesk.ai.api.controller;

import com.servicedesk.ai.api.dto.request.ResolveIncidentRequest;
import com.servicedesk.ai.api.dto.response.SuggestionResponse;
import com.servicedesk.ai.application.port.in.SuggestResolutionUseCase;
import com.servicedesk.ai.domain.model.ResolutionSuggestion;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "AI Suggestion Engine", description = "Real-time AI Incident Deflection & Resolution Generation")
@RestController
@RequestMapping("/api/v1/suggestions")
@RequiredArgsConstructor
public class SuggestionController {

    private final SuggestResolutionUseCase suggestResolutionUseCase;

    @Operation(summary = "Generate AI resolution for ServiceNow pre-ticket query")
    @PostMapping("/resolve")
    public ResponseEntity<SuggestionResponse> resolveIncident(@Valid @RequestBody ResolveIncidentRequest request) {
        SuggestResolutionUseCase.Command command = new SuggestResolutionUseCase.Command(
            request.title(),
            request.description(),
            request.callerEmail(),
            request.userDepartment(),
            request.category(),
            request.minConfidenceThreshold()
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
            suggestion.getGeneratedByModel(),
            suggestion.getCreatedAt(),
            suggestion.getCorrelationId()
        );

        return ResponseEntity.ok(response);
    }
}
