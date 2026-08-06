package com.servicedesk.ai.loader.chunking;

import com.servicedesk.ai.domain.model.DocumentMetadata;
import com.servicedesk.ai.domain.model.KnowledgeChunk;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChunkingEngine {

    private final SlidingWindowChunker slidingWindowChunker;

    public List<KnowledgeChunk> processAndChunk(String rawDocumentText, DocumentMetadata metadata) {
        log.info("Cleaning and chunking document: {} (Length: {} chars)", metadata.title(), rawDocumentText != null ? rawDocumentText.length() : 0);
        
        String cleanedText = cleanText(rawDocumentText);
        List<KnowledgeChunk> chunks = slidingWindowChunker.createChunks(cleanedText, metadata);
        
        log.info("Successfully produced {} vector chunks for document {}", chunks.size(), metadata.title());
        return chunks;
    }

    private String cleanText(String input) {
        if (input == null) return "";
        return input.replaceAll("[\\r\\n]+", "\n")
                    .replaceAll("[ \\t]+", " ")
                    .trim();
    }
}
