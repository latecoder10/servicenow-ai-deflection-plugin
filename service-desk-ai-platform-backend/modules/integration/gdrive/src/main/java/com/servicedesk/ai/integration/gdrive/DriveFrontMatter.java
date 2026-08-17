package com.servicedesk.ai.integration.gdrive;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Extracts a Drive document's metadata so it can be indexed and later cited.
 *
 * Three conventions are recognised, tried in order. A document that matches none
 * of them is still indexed, using the file name as the title and the containing
 * folder as the category, because a team will not retrofit hundreds of documents
 * before seeing any value.
 *
 * <p><b>1. Knowledge article layout.</b> The house style already in use, where the
 * first line carries the identifiers, the second the title, and a trailing line
 * carries ownership and search keywords:
 *
 * <pre>
 *   IT-002  |  IT  |  Network &amp; Connectivity
 *   VPN will not connect - troubleshooting steps
 *   Steps to resolve the most common causes of VPN failures.
 *   ...
 *   Owner: IT Service Desk     Last reviewed: 12 August 2026     Keywords: vpn, tunnel
 * </pre>
 *
 * <p><b>2. Key/value front matter.</b> A block of Key: Value lines closed by a rule
 * of three or more dashes, for documents written specifically for this system:
 *
 * <pre>
 *   Title: VPN Troubleshooting Runbook
 *   Category: Network
 *   Priority: 2
 *   Tags: vpn, globalprotect
 *   ---
 *   Symptoms ...
 * </pre>
 *
 * <p><b>3. Nothing.</b> Filename and folder are used instead.
 *
 * Keys are matched case-insensitively and unrecognised keys are preserved, so a
 * team can add their own without a code change.
 */
public final class DriveFrontMatter {

    /** Give up looking for the separator after this many lines. */
    private static final int MAX_SCAN_LINES = 40;

    /** "IT-002  |  IT  |  Network & Connectivity" */
    private static final Pattern ARTICLE_HEADER =
        Pattern.compile("^\\s*([A-Za-z]{2,10}-\\d{1,6})\\s*\\|\\s*([^|]{1,60}?)\\s*\\|\\s*(.{1,80}?)\\s*$");

    /** "Owner: X   Last reviewed: Y   Keywords: a, b, c" - fields split on runs of blanks. */
    private static final Pattern ARTICLE_FOOTER =
        Pattern.compile("Owner:\\s*(?<owner>.*?)(?:\\s{2,}|\\t+)Last reviewed:\\s*(?<reviewed>.*?)"
            + "(?:\\s{2,}|\\t+)Keywords:\\s*(?<keywords>.+)$");

    /** Present when the document used the knowledge-article layout. */
    public static final String DOC_ID = "docid";
    public static final String REVIEWED = "reviewed";
    public static final String SUMMARY = "summary";

    public static final String TITLE = "title";
    public static final String CATEGORY = "category";
    public static final String DEPARTMENT = "department";
    public static final String PRIORITY = "priority";
    public static final String OWNER = "owner";
    public static final String TAGS = "tags";
    public static final String EFFECTIVE = "effective";

    /** Keys promoted to first-class metadata; everything else is kept as-is. */
    public static final List<String> KNOWN_KEYS =
        List.of(TITLE, CATEGORY, DEPARTMENT, PRIORITY, OWNER, TAGS, EFFECTIVE,
                DOC_ID, REVIEWED, SUMMARY);

    private final Map<String, String> fields;
    private final String body;

    private DriveFrontMatter(Map<String, String> fields, String body) {
        this.fields = fields;
        this.body = body;
    }

    public Map<String, String> fields() {
        return fields;
    }

    /** Document text with any front-matter block removed. */
    public String body() {
        return body;
    }

    public boolean isPresent() {
        return !fields.isEmpty();
    }

    public String get(String key) {
        return fields.get(key);
    }

    public String getOrDefault(String key, String fallback) {
        String value = fields.get(key);
        return (value == null || value.isBlank()) ? fallback : value;
    }

    public static DriveFrontMatter parse(String text) {
        Map<String, String> fields = new LinkedHashMap<>();
        if (text == null || text.isBlank()) {
            return new DriveFrontMatter(fields, "");
        }

        DriveFrontMatter article = parseKnowledgeArticle(text);
        if (article != null) {
            return article;
        }

        String[] lines = text.split("\\r?\\n");
        int separator = -1;

        for (int i = 0; i < Math.min(lines.length, MAX_SCAN_LINES); i++) {
            if (isSeparator(lines[i])) {
                separator = i;
                break;
            }
        }

        // No separator means no front matter; treat the whole file as body.
        if (separator < 0) {
            return new DriveFrontMatter(fields, text.trim());
        }

        for (int i = 0; i < separator; i++) {
            String line = lines[i].trim();
            if (line.isEmpty()) {
                continue;
            }
            int colon = line.indexOf(':');
            if (colon <= 0) {
                // A non-conforming line above the separator means this was never a
                // front-matter block. Keep the document whole rather than eat content.
                return new DriveFrontMatter(new LinkedHashMap<>(), text.trim());
            }
            String key = line.substring(0, colon).trim().toLowerCase();
            String value = line.substring(colon + 1).trim();
            if (!key.isEmpty() && !value.isEmpty()) {
                fields.put(key, value);
            }
        }

        StringBuilder rest = new StringBuilder();
        for (int i = separator + 1; i < lines.length; i++) {
            rest.append(lines[i]).append('\n');
        }
        return new DriveFrontMatter(fields, rest.toString().trim());
    }

    /**
     * Reads the knowledge-article layout. Returns null when the document does not
     * open with an identifier header, leaving the other conventions to try.
     *
     * The body keeps every line: unlike front matter there is no separator, and the
     * title and summary are genuine content worth embedding.
     */
    private static DriveFrontMatter parseKnowledgeArticle(String text) {
        String[] lines = text.split("\\r?\\n");

        int first = -1;
        for (int i = 0; i < Math.min(lines.length, 5); i++) {
            if (!lines[i].isBlank()) {
                first = i;
                break;
            }
        }
        if (first < 0) {
            return null;
        }

        Matcher header = ARTICLE_HEADER.matcher(lines[first]);
        if (!header.matches()) {
            return null;
        }

        Map<String, String> fields = new LinkedHashMap<>();
        fields.put(DOC_ID, header.group(1).trim());
        fields.put(DEPARTMENT, header.group(2).trim());
        fields.put(CATEGORY, header.group(3).trim());

        // The next two non-blank lines are the title and its one-line summary.
        List<String> rest = new java.util.ArrayList<>();
        for (int i = first + 1; i < lines.length; i++) {
            if (!lines[i].isBlank()) {
                rest.add(lines[i].trim());
            }
        }
        if (!rest.isEmpty()) {
            fields.put(TITLE, rest.get(0));
        }
        if (rest.size() > 1) {
            fields.put(SUMMARY, rest.get(1));
        }

        // Ownership and keywords sit on the last line rather than the first.
        for (int i = lines.length - 1; i >= 0; i--) {
            Matcher footer = ARTICLE_FOOTER.matcher(lines[i].trim());
            if (footer.find()) {
                putIfPresent(fields, OWNER, footer.group("owner"));
                putIfPresent(fields, REVIEWED, footer.group("reviewed"));
                // Keywords are search synonyms: "working from home" for a VPN article.
                // They are the highest-value part of the metadata for retrieval.
                putIfPresent(fields, TAGS, footer.group("keywords"));
                break;
            }
        }

        return new DriveFrontMatter(fields, text.trim());
    }

    private static void putIfPresent(Map<String, String> fields, String key, String value) {
        if (value != null && !value.isBlank()) {
            fields.put(key, value.trim());
        }
    }

    private static boolean isSeparator(String line) {
        String trimmed = line.trim();
        if (trimmed.length() < 3) {
            return false;
        }
        return trimmed.chars().allMatch(c -> c == '-')
            || trimmed.chars().allMatch(c -> c == '=');
    }
}
