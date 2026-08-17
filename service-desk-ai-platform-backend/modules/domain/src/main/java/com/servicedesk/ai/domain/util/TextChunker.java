package com.servicedesk.ai.domain.util;

import java.util.ArrayList;
import java.util.List;

public class TextChunker {

    private TextChunker() {}

    /**
     * Splits a large text into smaller chunks based on a maximum character size,
     * maintaining a specified overlap to preserve context between chunks.
     *
     * @param text       The full text to split.
     * @param chunkSize  The maximum number of characters per chunk.
     * @param overlapSize The number of characters to overlap between chunks.
     * @return A list of text chunks.
     */
    public static List<String> chunkText(String text, int chunkSize, int overlapSize) {
        if (text == null || text.isBlank()) {
            return List.of();
        }
        
        List<String> chunks = new ArrayList<>();
        int length = text.length();
        int i = 0;
        
        while (i < length) {
            int end = Math.min(i + chunkSize, length);
            
            // Try to split on a natural boundary if not at the end of the text
            if (end < length) {
                int lastNewline = text.lastIndexOf('\n', end);
                int lastSpace = text.lastIndexOf(' ', end);
                
                if (lastNewline > i + (chunkSize / 2)) {
                    end = lastNewline + 1;
                } else if (lastSpace > i + (chunkSize / 2)) {
                    end = lastSpace + 1;
                }
            }
            
            chunks.add(text.substring(i, end).trim());
            
            if (end == length) {
                break;
            }
            
            i = end - overlapSize;
            if (i < 0) {
                i = 0;
            }
            // Ensure we make forward progress
            if (i <= (end - chunkSize)) {
                i = end; 
            }
        }
        
        return chunks;
    }

    /**
     * Approximate token count for a chunk, on the same words x 1.3 basis the sliding
     * window chunker uses, so the figure means the same thing whichever ingest path
     * produced the chunk. This returns strings rather than chunk objects, so callers
     * had nothing to record and every synced chunk was indexed with a count of zero.
     */
    public static int estimateTokens(String text) {
        if (text == null || text.isBlank()) {
            return 0;
        }
        return (int) (text.trim().split("\\s+").length * 1.3);
    }
}
