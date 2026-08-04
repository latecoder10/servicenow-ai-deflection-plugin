package com.servicedesk.ai.loader.chunking;

import com.servicedesk.ai.domain.model.DocumentMetadata;
import com.servicedesk.ai.domain.model.KnowledgeChunk;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class SlidingWindowChunker {

    private static final int DEFAULT_CHUNK_SIZE_WORDS = 300;
    private static final int DEFAULT_OVERLAP_WORDS = 50;

    public List<KnowledgeChunk> createChunks(String fullText, DocumentMetadata metadata) {
        if (fullText == null || fullText.isBlank()) {
            return List.of();
        }

        String[] words = fullText.split("\\s+");
        List<KnowledgeChunk> chunks = new ArrayList<>();
        int wordIndex = 0;
        int chunkSeq = 0;

        while (wordIndex < words.length) {
            int end = Math.min(wordIndex + DEFAULT_CHUNK_SIZE_WORDS, words.length);
            StringBuilder chunkText = new StringBuilder();
            for (int i = wordIndex; i < end; i++) {
                chunkText.append(words[i]).append(" ");
            }

            KnowledgeChunk chunk = KnowledgeChunk.builder()
                .chunkId(UUID.randomUUID().toString())
                .documentId(metadata != null ? metadata.documentId() : UUID.randomUUID().toString())
                .chunkIndex(chunkSeq++)
                .textContent(chunkText.toString().trim())
                .tokenCount((int) (chunkText.toString().split("\\s+").length * 1.3))
                .metadata(metadata)
                .build();

            chunks.add(chunk);

            if (end == words.length) {
                break;
            }
            wordIndex += (DEFAULT_CHUNK_SIZE_WORDS - DEFAULT_OVERLAP_WORDS);
        }

        return chunks;
    }
}
