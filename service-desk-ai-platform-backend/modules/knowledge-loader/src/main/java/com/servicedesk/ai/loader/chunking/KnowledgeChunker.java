package com.servicedesk.ai.loader.chunking;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class KnowledgeChunker {

    public List<String> chunkText(String content, int maxChunkSize, int overlap) {
        if (content == null || content.isBlank()) {
            return List.of();
        }

        List<String> chunks = new ArrayList<>();
        int length = content.length();
        int step = Math.max(1, maxChunkSize - overlap);

        for (int i = 0; i < length; i += step) {
            int end = Math.min(length, i + maxChunkSize);
            chunks.add(content.substring(i, end));
            if (end == length) break;
        }

        return chunks;
    }
}
