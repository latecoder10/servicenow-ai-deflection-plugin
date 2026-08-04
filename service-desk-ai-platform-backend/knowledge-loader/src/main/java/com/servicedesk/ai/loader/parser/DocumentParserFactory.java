package com.servicedesk.ai.loader.parser;

import com.servicedesk.ai.domain.model.DocumentSourceType;
import org.apache.tika.Tika;
import org.springframework.stereotype.Component;

import java.io.InputStream;

@Component
public class DocumentParserFactory {

    private final Tika tika = new Tika();

    public String parseContent(InputStream inputStream, DocumentSourceType sourceType) {
        try {
            return tika.parseToString(inputStream);
        } catch (Exception e) {
            throw new RuntimeException("Failed to extract document text via Apache Tika", e);
        }
    }
}
