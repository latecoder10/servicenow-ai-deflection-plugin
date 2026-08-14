package com.servicedesk.ai.integration.gdrive;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class DriveFrontMatterTest {

    /** Verbatim text of IT-002 from the shared Drive folder, as the extractor sees it. */
    private static final String KNOWLEDGE_ARTICLE = """
        IT-002  |  IT  |  Network & Connectivity
        VPN will not connect - troubleshooting steps
        Steps to resolve the most common causes of VPN connection failures when working remotely.
        Steps
        Confirm you have working internet by opening any public website.
        Fully quit and reopen the VPN client rather than just retrying the connect button.
        Sign out and sign back in so the authentication token refreshes.
        Please note: Corporate VPN does not work over some guest networks.
        Owner: IT Service Desk     Last reviewed: 12 August 2026     Keywords: vpn, connect, remote, working from home, tunnel
        """;

    @Test
    void readsTheKnowledgeArticleLayout() {
        DriveFrontMatter fm = DriveFrontMatter.parse(KNOWLEDGE_ARTICLE);

        assertTrue(fm.isPresent());
        assertEquals("IT-002", fm.get(DriveFrontMatter.DOC_ID));
        assertEquals("IT", fm.get(DriveFrontMatter.DEPARTMENT));
        assertEquals("Network & Connectivity", fm.get(DriveFrontMatter.CATEGORY));
        assertEquals("VPN will not connect - troubleshooting steps", fm.get(DriveFrontMatter.TITLE));
        assertTrue(fm.get(DriveFrontMatter.SUMMARY).startsWith("Steps to resolve"));
    }

    @Test
    void readsOwnershipAndKeywordsFromTheFooter() {
        DriveFrontMatter fm = DriveFrontMatter.parse(KNOWLEDGE_ARTICLE);

        assertEquals("IT Service Desk", fm.get(DriveFrontMatter.OWNER));
        assertEquals("12 August 2026", fm.get(DriveFrontMatter.REVIEWED));
        // Keywords carry the synonyms a user actually types, so they must survive.
        assertTrue(fm.get(DriveFrontMatter.TAGS).contains("working from home"));
    }

    @Test
    void keepsTheWholeArticleAsBody() {
        // Unlike front matter there is no separator to strip: the title and summary
        // are real content and must still be embedded.
        DriveFrontMatter fm = DriveFrontMatter.parse(KNOWLEDGE_ARTICLE);

        assertTrue(fm.body().contains("Confirm you have working internet"));
        assertTrue(fm.body().contains("VPN will not connect"));
    }

    @Test
    void articleLayoutWinsOverFrontMatter() {
        // A document opening with an identifier header is an article, even if a later
        // line happens to look like a key/value pair.
        DriveFrontMatter fm = DriveFrontMatter.parse(
            "IT-009  |  IT  |  Software\nRequesting software\nSummary line\nNote: not front matter\n");

        assertEquals("IT-009", fm.get(DriveFrontMatter.DOC_ID));
        assertEquals("Software", fm.get(DriveFrontMatter.CATEGORY));
    }

    @Test
    void ordinaryProseIsNotMistakenForAnArticle() {
        DriveFrontMatter fm = DriveFrontMatter.parse(
            "How to reset a password\nOpen the portal and choose Forgot Password.\n");

        assertFalse(fm.isPresent());
        assertTrue(fm.body().startsWith("How to reset"));
    }

    @Test
    void parsesBlockAndSeparatesBody() {
        DriveFrontMatter fm = DriveFrontMatter.parse("""
            Title: VPN Runbook
            Category: Network
            Priority: 2
            ---
            Symptoms
            The client drops every 30 minutes.
            """);

        assertTrue(fm.isPresent());
        assertEquals("VPN Runbook", fm.get(DriveFrontMatter.TITLE));
        assertEquals("Network", fm.get(DriveFrontMatter.CATEGORY));
        assertEquals("2", fm.get(DriveFrontMatter.PRIORITY));
        assertTrue(fm.body().startsWith("Symptoms"));
        assertFalse(fm.body().contains("Title:"));
    }

    @Test
    void keysAreCaseInsensitive() {
        DriveFrontMatter fm = DriveFrontMatter.parse("TITLE: A\ncategory: B\n---\nbody");
        assertEquals("A", fm.get(DriveFrontMatter.TITLE));
        assertEquals("B", fm.get(DriveFrontMatter.CATEGORY));
    }

    @Test
    void unknownKeysArePreserved() {
        DriveFrontMatter fm = DriveFrontMatter.parse("Title: A\nRegion: EMEA\n---\nbody");
        assertEquals("EMEA", fm.get("region"));
    }

    @Test
    void documentWithoutFrontMatterKeepsAllContent() {
        String doc = "Just a plain runbook.\nNo metadata at all.";
        DriveFrontMatter fm = DriveFrontMatter.parse(doc);
        assertFalse(fm.isPresent());
        assertEquals(doc, fm.body());
    }

    @Test
    void separatorWithNonConformingLinesAboveIsNotTreatedAsMetadata() {
        // A document that merely starts with a dashed rule must not lose its opening.
        String doc = "Executive Summary\n---\nThe rest of the document.";
        DriveFrontMatter fm = DriveFrontMatter.parse(doc);
        assertFalse(fm.isPresent());
        assertTrue(fm.body().contains("Executive Summary"));
    }

    @Test
    void fallbackIsUsedForMissingKeys() {
        DriveFrontMatter fm = DriveFrontMatter.parse("Title: A\n---\nbody");
        assertEquals("Fallback", fm.getOrDefault(DriveFrontMatter.CATEGORY, "Fallback"));
    }

    @Test
    void handlesNullAndEmpty() {
        assertFalse(DriveFrontMatter.parse(null).isPresent());
        assertEquals("", DriveFrontMatter.parse("").body());
    }
}
