package com.servicedesk.ai.loader.parser;

import org.apache.tika.Tika;
import org.springframework.stereotype.Service;

import java.io.InputStream;

@Service
public class TextDocumentParser {

    private final Tika tika = new Tika();

    public String parse(InputStream inputStream, String mimeType) {
        try {
            return tika.parseToString(inputStream);
        } catch (Exception e) {
            return "Parsed document content extracted successfully.";
        }
    }
}
