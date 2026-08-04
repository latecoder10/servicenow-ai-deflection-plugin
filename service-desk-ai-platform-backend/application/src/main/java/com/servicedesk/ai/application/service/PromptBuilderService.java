package com.servicedesk.ai.application.service;

import com.servicedesk.ai.domain.model.KnowledgeChunk;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PromptBuilderService {

    public String buildSystemPrompt() {
        return """
            You are the Enterprise AI Service Desk Agent integrated with ServiceNow.
            Your purpose is to analyze IT ticket queries, ground your answer strictly in retrieved internal technical documentation, runbooks, and resolved incidents, and output a high-confidence, actionable resolution.
            
            Guidelines:
            1. Provide clear, numbered step-by-step resolution instructions.
            2. If code, terminal commands, PowerShell scripts, or configuration paths are applicable, format them clearly.
            3. Be authoritative, professional, and concise.
            """;
    }

    public String buildUserPrompt(String title, String description, String department, List<KnowledgeChunk> contextChunks) {
        StringBuilder contextBuilder = new StringBuilder();
        for (int i = 0; i < contextChunks.size(); i++) {
            KnowledgeChunk chunk = contextChunks.get(i);
            contextBuilder.append(String.format("[%d] Source: %s (Category: %s)\nContent: %s\n\n",
                i + 1,
                chunk.getMetadata() != null ? chunk.getMetadata().title() : "Knowledge Article",
                chunk.getMetadata() != null ? chunk.getMetadata().category() : "General",
                chunk.getTextContent()
            ));
        }

        return String.format("""
            User Department: %s
            Issue Summary: %s
            Detailed Description: %s
            
            Retrieved Enterprise Context:
            %s
            
            Formulate a step-by-step IT resolution based on the above context.
            """,
            department,
            title,
            description,
            contextBuilder.toString()
        );
    }
}
