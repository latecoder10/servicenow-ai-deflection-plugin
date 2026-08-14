package com.servicedesk.ai.api.dto.response;

/**
 * One record that informed a suggestion, so the agent can see where the answer
 * came from rather than trusting an unattributed number of sources.
 *
 * @param recordNumber human-readable identifier, e.g. INC0010042 or KB0001234
 * @param recordType   "incident" or "kb_knowledge"; drives how the UI labels it
 * @param title        short description of the source record
 * @param url          deep link into the ServiceNow instance, null when unresolvable
 * @param relevance    similarity score for this source, 0-1
 */
public record SourceReference(
    String recordNumber,
    String recordType,
    String title,
    String url,
    double relevance
) {}
