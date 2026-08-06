package com.servicedesk.ai.api;

import com.servicedesk.ai.api.controller.SuggestionController;
import com.servicedesk.ai.api.dto.request.ResolveIncidentRequest;
import com.servicedesk.ai.api.dto.response.SuggestionResponse;
import com.servicedesk.ai.application.port.in.SuggestResolutionUseCase;
import com.servicedesk.ai.domain.model.ConfidenceScore;
import com.servicedesk.ai.domain.model.ResolutionSuggestion;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SuggestionControllerTest {

    @Mock
    private SuggestResolutionUseCase suggestResolutionUseCase;

    @InjectMocks
    private SuggestionController suggestionController;

    private ResolutionSuggestion mockSuggestion;

    @BeforeEach
    void setUp() {
        mockSuggestion = ResolutionSuggestion.builder()
            .suggestionId("sug-1001")
            .queryTitle("VPN Connection Dropping")
            .recommendedTitle("GlobalProtect VPN Certificate Reset")
            .summaryResolution("Run gpconfig /refresh to force reload Palo Alto TLS certificate")
            .stepByStepInstructions(List.of("1. Open CMD as Admin", "2. Run gpconfig /refresh"))
            .codeOrCommandSnippet("gpconfig /refresh")
            .confidenceScore(ConfidenceScore.of(94))
            .deflectionSuccessful(true)
            .generatedByModel("gemini-3.6-flash")
            .createdAt(Instant.now())
            .correlationId("test-cid-9000")
            .build();
    }

    @Test
    @DisplayName("Should return 200 OK with valid resolution suggestion")
    void testResolveIncident_Success() {
        when(suggestResolutionUseCase.suggestResolution(any())).thenReturn(mockSuggestion);

        ResolveIncidentRequest request = new ResolveIncidentRequest(
            "VPN Connection Dropping",
            "Unable to connect to gateway after password change",
            "user@enterprise.com",
            "Engineering",
            "Network",
            75
        );

        ResponseEntity<SuggestionResponse> response = suggestionController.resolveIncident(request);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("sug-1001", response.getBody().suggestionId());
        assertEquals(94, response.getBody().confidenceScore());
        assertTrue(response.getBody().deflectionSuccessful());

        verify(suggestResolutionUseCase, times(1)).suggestResolution(any());
    }
}
