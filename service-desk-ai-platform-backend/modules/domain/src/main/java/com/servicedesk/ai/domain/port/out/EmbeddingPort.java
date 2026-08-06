package com.servicedesk.ai.domain.port.out;

import java.util.List;

public interface EmbeddingPort {
    List<Float> generateEmbedding(String textContent);
    
    List<List<Float>> generateBatchEmbeddings(List<String> textBatch);
}
