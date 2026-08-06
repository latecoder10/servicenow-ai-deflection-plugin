package com.servicedesk.ai.integration.pinecone;

import com.servicedesk.ai.integration.pinecone.config.PineconeConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.ZoneId;
import java.time.Year;

@Slf4j
@Component
@RequiredArgsConstructor
public class PineconeIndexResolver {

    private final PineconeConfig pineconeConfig;

    public String resolveNamespace(Instant documentDate) {
        int docYear = documentDate.atZone(ZoneId.systemDefault()).getYear();
        return resolveNamespace(docYear);
    }

    public String resolveNamespace(int year) {
        int windowStart = (year / 5) * 5;
        int windowEnd = windowStart + 4;
        String namespace = pineconeConfig.getNamespacePrefix() + windowStart + "-" + windowEnd;
        log.debug("[Pinecone Namespace Resolver] Year {} resolved to namespace '{}'", year, namespace);
        return namespace;
    }

    public String resolveCurrentNamespace() {
        return resolveNamespace(Year.now().getValue());
    }

    public String getIndexName() {
        return pineconeConfig.getIndexName();
    }
}
