package com.servicedesk.ai.integration.servicenow;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static com.servicedesk.ai.integration.servicenow.ServiceNowRestAdapter.stripHtml;
import static org.junit.jupiter.api.Assertions.*;

/**
 * ServiceNow knowledge bodies arrive as rich text. Whatever survives cleanup is what
 * gets embedded, so entity noise degrades retrieval as well as display.
 */
class HtmlCleanupTest {

    @Test
    @DisplayName("Numeric entities are decoded, not embedded verbatim")
    void numericEntitiesAreDecoded() {
        String out = stripHtml("press CTRL &#43; F5 and type &#34;ipconfig /flushdns&#34;");

        assertEquals("press CTRL + F5 and type \"ipconfig /flushdns\"", out);
        assertFalse(out.contains("&#"), "an entity left in place becomes noise in the embedding");
    }

    @Test
    @DisplayName("Hex entities are decoded too")
    void hexEntitiesAreDecoded() {
        assertEquals("A+B", stripHtml("A&#x2B;B"));
    }

    @Test
    @DisplayName("Named entities are decoded")
    void namedEntitiesAreDecoded() {
        assertEquals("Start > Command Prompt & it's ready now",
            stripHtml("Start &gt; Command Prompt &amp; it&#39;s ready&nbsp;now"));
    }

    @Test
    @DisplayName("Block tags become spaces rather than running words together")
    void blockTagsBecomeWhitespace() {
        assertEquals("First step Second step Third",
            stripHtml("<p>First step</p><p>Second step</p><li>Third</li>"));
    }

    @Test
    @DisplayName("Line breaks separate words")
    void lineBreaksSeparateWords() {
        assertEquals("one two", stripHtml("one<br/>two"));
    }

    @Test
    @DisplayName("Trailing tabs and newlines are removed from titles")
    void raggedWhitespaceIsNormalised() {
        assertEquals("Deleted Email Recovery", stripHtml("Deleted Email Recovery\t\t"));
        assertEquals("Email Interruption Tonight", stripHtml("Email Interruption Tonight\n\t\t"));
    }

    @Test
    @DisplayName("Null and blank input are safe")
    void nullAndBlankAreSafe() {
        assertEquals("", stripHtml(null));
        assertEquals("", stripHtml("   "));
    }
}
