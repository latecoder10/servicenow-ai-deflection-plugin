package com.servicedesk.ai.integration.gdrive;

import java.time.Instant;

/**
 * A file in the watched Drive folder.
 *
 * @param id           Drive file id
 * @param name         file name including extension
 * @param mimeType     Drive mime type; Google-native docs need export rather than download
 * @param modifiedTime last modification, the value the sync watermark is compared against
 * @param parentName   containing folder name, used as the category fallback
 * @param webViewLink  link a human can open, cited as the source of a suggestion
 */
public record DriveFile(
    String id,
    String name,
    String mimeType,
    Instant modifiedTime,
    String parentName,
    String webViewLink
) {
    public static final String MIME_GOOGLE_DOC = "application/vnd.google-apps.document";
    public static final String MIME_FOLDER = "application/vnd.google-apps.folder";
    public static final String MIME_DOCX =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    /** Google-native docs have no bytes to download and must be exported instead. */
    public boolean isGoogleNative() {
        return mimeType != null && mimeType.startsWith("application/vnd.google-apps");
    }

    public boolean isFolder() {
        return MIME_FOLDER.equals(mimeType);
    }

    /** Everything the pipeline can currently turn into text. */
    public boolean isIndexable() {
        if (mimeType == null || isFolder()) {
            return false;
        }
        return MIME_GOOGLE_DOC.equals(mimeType)
            || MIME_DOCX.equals(mimeType)
            || mimeType.equals("application/msword")
            || mimeType.equals("application/pdf")
            || mimeType.startsWith("text/");
    }

    /** File name without its extension, used as the title fallback. */
    public String baseName() {
        if (name == null) {
            return "";
        }
        int dot = name.lastIndexOf('.');
        return dot > 0 ? name.substring(0, dot) : name;
    }
}
