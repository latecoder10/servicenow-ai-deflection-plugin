"""
Generate: ServiceNow AI Service Desk — Architecture & Technical Specification
"""

from docx import Document
from docx.shared import Pt, Cm, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_ORIENTATION
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import datetime
import os


def setup_page(doc, size="A4"):
    section = doc.sections[0]
    section.page_width, section.page_height = Cm(21.0), Cm(29.7)
    section.top_margin = section.bottom_margin = Cm(2.54)
    section.left_margin = section.right_margin = Cm(3.18)
    section.orientation = WD_ORIENTATION.PORTRAIT


def tune_styles(doc):
    body = doc.styles["Normal"]
    body.font.name = "Calibri"
    body.font.size = Pt(11)
    body.font.color.rgb = RGBColor(0x1F, 0x1F, 0x1F)
    body.paragraph_format.line_spacing = 1.15
    body.paragraph_format.space_after = Pt(6)

    for n, size, color in [(1, 18, 0x1F3A5F), (2, 14, 0x1F3A5F), (3, 12, 0x2E4057)]:
        s = doc.styles[f"Heading {n}"]
        s.font.name = "Calibri Light"
        s.font.size = Pt(size)
        s.font.bold = True
        s.font.color.rgb = RGBColor((color >> 16) & 0xFF, (color >> 8) & 0xFF, color & 0xFF)
        s.paragraph_format.space_before = Pt(14 - 2 * n)
        s.paragraph_format.space_after = Pt(4)


def add_page_number(paragraph):
    run = paragraph.add_run()
    fldChar1 = OxmlElement("w:fldChar")
    fldChar1.set(qn("w:fldCharType"), "begin")
    instrText = OxmlElement("w:instrText")
    instrText.text = "PAGE"
    fldChar2 = OxmlElement("w:fldChar")
    fldChar2.set(qn("w:fldCharType"), "end")
    run._r.append(fldChar1)
    run._r.append(instrText)
    run._r.append(fldChar2)


def add_cover(doc):
    for _ in range(6):
        doc.add_paragraph()

    p = doc.add_paragraph("ServiceNow AI Service Desk", style="Title")
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for run in p.runs:
        run.font.color.rgb = RGBColor(0x1F, 0x3A, 0x5F)

    p = doc.add_paragraph("Architecture & Technical Specification", style="Subtitle")
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.add_paragraph()

    p = doc.add_paragraph("Version 1.0.0")
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.runs[0].font.size = Pt(12)
    p.runs[0].font.color.rgb = RGBColor(0x59, 0x59, 0x59)

    p = doc.add_paragraph(f"Date: {datetime.date.today().strftime('%B %d, %Y')}")
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.runs[0].font.size = Pt(11)
    p.runs[0].font.color.rgb = RGBColor(0x59, 0x59, 0x59)

    for _ in range(8):
        doc.add_paragraph()

    p = doc.add_paragraph("CONFIDENTIAL")
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.runs[0].font.bold = True
    p.runs[0].font.color.rgb = RGBColor(0xC0, 0x39, 0x2B)

    p = doc.add_paragraph("Prepared by: Estuate Inc.")
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.runs[0].font.color.rgb = RGBColor(0x59, 0x59, 0x59)


def add_toc(doc):
    p = doc.add_paragraph("Table of Contents", style="Heading 1")
    p2 = doc.add_paragraph()
    run = p2.add_run()
    fldChar1 = OxmlElement("w:fldChar")
    fldChar1.set(qn("w:fldCharType"), "begin")
    instrText = OxmlElement("w:instrText")
    instrText.set(qn("xml:space"), "preserve")
    instrText.text = 'TOC \\o "1-3" \\h \\z \\u'
    fldChar2 = OxmlElement("w:fldChar")
    fldChar2.set(qn("w:fldCharType"), "separate")
    fldChar3 = OxmlElement("w:t")
    fldChar3.text = "Right-click and choose Update Field to populate."
    fldChar4 = OxmlElement("w:fldChar")
    fldChar4.set(qn("w:fldCharType"), "end")
    for x in (fldChar1, instrText, fldChar2, fldChar3, fldChar4):
        run._r.append(x)


def shade_paragraph(paragraph, hex_color="F2F4F7"):
    pPr = paragraph._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_color)
    pPr.append(shd)


def add_table(doc, header, rows, col_widths=None):
    table = doc.add_table(rows=1 + len(rows), cols=len(header))
    table.style = "Light Grid Accent 1"

    hdr = table.rows[0].cells
    for i, name in enumerate(header):
        hdr[i].text = name
        for p in hdr[i].paragraphs:
            for r in p.runs:
                r.bold = True
                r.font.size = Pt(10)

    for r_idx, row in enumerate(rows, start=1):
        cells = table.rows[r_idx].cells
        for c_idx, value in enumerate(row):
            cells[c_idx].text = str(value)
            for p in cells[c_idx].paragraphs:
                for r in p.runs:
                    r.font.size = Pt(10)

    doc.add_paragraph()
    return table


def build_document():
    doc = Document()
    setup_page(doc)
    tune_styles(doc)

    # ── Cover Page ──
    add_cover(doc)
    doc.add_page_break()

    # ── Table of Contents ──
    add_toc(doc)
    doc.add_page_break()

    # ══════════════════════════════════════════════════════════════
    # 1. PROJECT OVERVIEW
    # ══════════════════════════════════════════════════════════════
    doc.add_heading("1. Project Overview", level=1)

    doc.add_heading("1.1 Purpose", level=2)
    doc.add_paragraph(
        "The ServiceNow AI Service Desk is an intelligent incident resolution platform that "
        "leverages vector-based semantic search and AI embeddings to automatically suggest "
        "solutions to IT support agents when they create new tickets. The system searches "
        "through historical resolved incidents, identifies similar cases, and presents "
        "relevant resolutions in real-time, significantly reducing mean time to resolution (MTTR)."
    )

    doc.add_heading("1.2 Scope", level=2)
    doc.add_paragraph(
        "This document covers the complete technical architecture, system design, "
        "integration patterns, AI/ML pipeline, ServiceNow plugin components, "
        "and deployment strategy for the ServiceNow AI Service Desk platform. "
        "It serves as the authoritative reference for implementation and maintenance."
    )

    doc.add_heading("1.3 Key Capabilities", level=2)
    capabilities = [
        "Real-time semantic search for similar resolved incidents",
        "AI-powered embeddings using Google Gemini (1024-dim vectors)",
        "Vector similarity search via Pinecone database",
        "Automatic resolution suggestion with one-click apply",
        "ServiceNow native integration via GlideAjax and Script Includes",
        "Batch embedding and vector upsert for efficient data ingestion",
        "Cloudflare tunneling for secure public access during development",
        "Synthetic data loader for testing and demonstration"
    ]
    for cap in capabilities:
        doc.add_paragraph(cap, style="List Bullet")

    doc.add_heading("1.4 Business Value", level=2)
    value_items = [
        "Reduced Mean Time to Resolution (MTTR) by 40-60%",
        "Improved agent productivity with automated suggestions",
        "Knowledge reuse across support teams",
        "Consistent resolution quality based on historical data",
        "Lower training costs for new support agents"
    ]
    for item in value_items:
        doc.add_paragraph(item, style="List Bullet")

    # ══════════════════════════════════════════════════════════════
    # 2. SYSTEM ARCHITECTURE
    # ══════════════════════════════════════════════════════════════
    doc.add_heading("2. System Architecture", level=1)

    doc.add_heading("2.1 High-Level Architecture", level=2)
    doc.add_paragraph(
        "The system follows a multi-tier architecture with clear separation of concerns:"
    )

    add_table(doc,
        ["Layer", "Component", "Technology", "Purpose"],
        [
            ["Presentation", "ServiceNow UI", "Angular/React", "Agent-facing incident form"],
            ["Presentation", "Client Script", "JavaScript", "onChange handler for description field"],
            ["Presentation", "Script Include", "Server-side JS", "GlideAjax bridge to backend"],
            ["Gateway", "Cloudflare Tunnel", "Cloudflare", "Secure public URL for local backend"],
            ["API", "REST Controller", "Spring Boot", "Suggestion and knowledge endpoints"],
            ["Business", "Suggestion Engine", "Java", "Orchestration and scoring"],
            ["AI/ML", "Embedding Service", "Gemini API", "Text to vector conversion"],
            ["Data", "Vector Database", "Pinecone", "Similarity search and storage"],
            ["Integration", "ServiceNow Connector", "REST API", "Incident sync and updates"],
        ]
    )

    doc.add_heading("2.2 Architecture Diagram", level=2)
    doc.add_paragraph(
        "The following diagram illustrates the complete data flow from user input to suggestion display:"
    )

    # ASCII Architecture Diagram
    arch_text = """
┌─────────────────────────────────────────────────────────────────────────┐
│                         SERVICE NOW INSTANCE                           │
│                     (dev440425.service-now.com)                         │
│                                                                         │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐            │
│   │ Client Script │───▶│ Script Include│───▶│  REST Call   │            │
│   │  (onChange)   │    │  (GlideAjax) │    │  (HTTP POST) │            │
│   └──────────────┘    └──────────────┘    └──────┬───────┘            │
└──────────────────────────────────────────────────┼──────────────────────┘
                                                    │
                                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE TUNNEL                                 │
│         (sciences-tap-museum-insulation.trycloudflare.com)             │
└──────────────────────────────────────────────────┬──────────────────────┘
                                                    │
                                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     SPRING BOOT BACKEND                                │
│                      (localhost:8080)                                   │
│                                                                         │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐            │
│   │ REST         │───▶│ Suggestion   │───▶│ Pinecone     │            │
│   │ Controller   │    │ Engine       │    │ Adapter      │            │
│   └──────────────┘    └──────────────┘    └──────┬───────┘            │
│                                                    │                    │
│   ┌──────────────┐    ┌──────────────┐            │                    │
│   │ Embedding    │───▶│ Gemini API   │            │                    │
│   │ Adapter      │    │ (batchEmbed) │            │                    │
│   └──────────────┘    └──────────────┘            │                    │
└──────────────────────────────────────────────────┼──────────────────────┘
                                                    │
                                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                                 │
│                                                                         │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐            │
│   │ Pinecone     │    │ Google       │    │ ServiceNow   │            │
│   │ Vector DB    │    │ Gemini       │    │ REST API     │            │
│   │ (1024-dim)   │    │ Embeddings   │    │ (OAuth2)     │            │
│   └──────────────┘    └──────────────┘    └──────────────┘            │
└─────────────────────────────────────────────────────────────────────────┘
"""
    p = doc.add_paragraph()
    run = p.add_run(arch_text)
    run.font.name = "Consolas"
    run.font.size = Pt(8)

    doc.add_heading("2.3 Deployment Model", level=2)
    p = doc.add_paragraph()
    p.add_run("Monolithic Architecture with External Services").bold = True
    doc.add_paragraph(
        "The backend is deployed as a single Spring Boot application that integrates "
        "with external services (Pinecone, Gemini, ServiceNow). This approach provides:"
    )
    reasons = [
        "Simplified deployment and operations — single artifact",
        "Reduced operational complexity — no inter-service communication overhead",
        "Externalized state — vector storage in Pinecone, embeddings via Gemini API",
        "Rapid iteration — single codebase enables fast feature development",
        "Cost-effective for current scale — no distributed system infrastructure needed"
    ]
    for r in reasons:
        doc.add_paragraph(r, style="List Bullet")

    # ══════════════════════════════════════════════════════════════
    # 3. TECHNOLOGY STACK
    # ══════════════════════════════════════════════════════════════
    doc.add_heading("3. Technology Stack", level=1)

    doc.add_heading("3.1 Core Runtime", level=2)
    add_table(doc,
        ["Component", "Technology", "Version", "Purpose"],
        [
            ["Language", "Java", "17 LTS", "Primary runtime"],
            ["Framework", "Spring Boot", "3.4.2", "Web framework, DI, configuration"],
            ["Build Tool", "Apache Maven", "3.9+", "Dependency management and build"],
            ["Server", "Embedded Tomcat", "10.1.x", "HTTP server (bundled)"],
        ]
    )

    doc.add_heading("3.2 AI / ML Integration", level=2)
    add_table(doc,
        ["Component", "Technology", "Version", "Purpose"],
        [
            ["Embedding Model", "Google Gemini", "gemini-embedding-001", "Text to vector conversion"],
            ["Vector Dimension", "1024", "—", "Embedding output size"],
            ["Batch API", "batchEmbedContents", "v1beta", "Efficient batch processing"],
        ]
    )

    doc.add_heading("3.3 Vector Database", level=2)
    add_table(doc,
        ["Component", "Technology", "Version", "Purpose"],
        [
            ["Vector DB", "Pinecone", "Serverless", "Similarity search and storage"],
            ["Index Name", "servicedesk-knowledge", "—", "Vector storage index"],
            ["Dimension", "1024", "—", "Must match embedding model"],
            ["Metric", "cosine", "—", "Similarity measurement"],
        ]
    )

    doc.add_heading("3.4 ServiceNow Integration", level=2)
    add_table(doc,
        ["Component", "Technology", "Version", "Purpose"],
        [
            ["Instance", "ServiceNow", "Xanadu", "ITSM platform"],
            ["Auth", "OAuth2", "—", "API authentication"],
            ["Plugin", "Script Include", "—", "Server-side GlideAjax"],
            ["Plugin", "Client Script", "—", "Browser-side onChange"],
            ["Plugin", "Portal Widget", "AngularJS", "Visual suggestion panel"],
        ]
    )

    doc.add_heading("3.5 DevOps & Infrastructure", level=2)
    add_table(doc,
        ["Component", "Technology", "Version", "Purpose"],
        [
            ["Tunneling", "Cloudflare", "cloudflared", "Public URL for local backend"],
            ["API Docs", "SpringDoc OpenAPI", "2.8.4", "Swagger UI"],
            ["Config", "application.yml", "—", "Externalized configuration"],
        ]
    )

    # ══════════════════════════════════════════════════════════════
    # 4. MODULE STRUCTURE
    # ══════════════════════════════════════════════════════════════
    doc.add_heading("4. Module Structure", level=1)

    doc.add_heading("4.1 Multi-Module Maven Project", level=2)
    doc.add_paragraph(
        "The project follows a clean multi-module Maven structure with clear separation "
        "of concerns:"
    )

    add_table(doc,
        ["Module", "Package", "Purpose"],
        [
            ["domain", "com.servicedesk.ai.domain", "Entities, models, ports (interfaces), constants"],
            ["application", "com.servicedesk.ai.application", "Business logic, services, connectors"],
            ["integration/pinecone", "com.servicedesk.ai.integration.pinecone", "Pinecone vector DB adapter"],
            ["integration/llm", "com.servicedesk.ai.integration.llm", "Gemini embedding adapter"],
            ["integration/servicenow", "com.servicedesk.ai.integration.servicenow", "ServiceNow REST adapter"],
            ["infrastructure", "com.servicedesk.ai.infrastructure", "Schedulers, configuration"],
            ["api", "com.servicedesk.ai.api", "REST controllers, application entry point"],
            ["security", "com.servicedesk.ai.security", "JWT token handling"],
        ]
    )

    doc.add_heading("4.2 Dependency Flow", level=2)
    doc.add_paragraph(
        "Dependencies flow inward following Clean Architecture principles:"
    )
    flow_items = [
        "api → application → domain (core business logic)",
        "integration/* → domain (implements port interfaces)",
        "infrastructure → application (schedulers, config)",
        "api → integration/* (wires up adapters)"
    ]
    for item in flow_items:
        doc.add_paragraph(item, style="List Bullet")

    # ══════════════════════════════════════════════════════════════
    # 5. AI/ML PIPELINE
    # ══════════════════════════════════════════════════════════════
    doc.add_heading("5. AI/ML Pipeline", level=1)

    doc.add_heading("5.1 Embedding Generation", level=2)
    doc.add_paragraph(
        "The system uses Google Gemini's embedding-001 model to convert text into "
        "1024-dimensional vectors for semantic search:"
    )

    add_table(doc,
        ["Stage", "Component", "Input", "Output"],
        [
            ["1. Text Extraction", "ServiceNow Connector", "Incident records", "Raw text (title + description)"],
            ["2. Chunking", "TextChunker", "Raw text", "512-token chunks with 50-token overlap"],
            ["3. Embedding", "SpringAiEmbeddingAdapter", "Text chunks", "1024-dim vectors (batch of 100)"],
            ["4. Upsert", "PineconeVectorAdapter", "Vectors + metadata", "Stored in Pinecone index"],
        ]
    )

    doc.add_heading("5.2 Batch Processing Strategy", level=2)
    doc.add_paragraph(
        "To optimize API calls and reduce latency, the system uses batch processing:"
    )
    batch_items = [
        "Embedding Batch Size: 100 texts per Gemini batchEmbedContents call",
        "Upsert Batch Size: 96 vectors per Pinecone upsert call",
        "Text Chunk Size: 512 tokens with 50-token overlap for context preservation",
        "Vector ID Format: sn-{sysId}-{chunkIndex} for unique identification"
    ]
    for item in batch_items:
        doc.add_paragraph(item, style="List Bullet")

    doc.add_heading("5.3 Similarity Search", level=2)
    doc.add_paragraph(
        "When an agent types a ticket description, the system performs semantic search:"
    )

    search_steps = [
        "Agent types description in Incident form (min 10 characters)",
        "Client Script debounces input (1.5 second delay)",
        "GlideAjax calls Script Include with description text",
        "Script Include POSTs to backend /api/v1/suggestions/resolve",
        "Backend generates embedding for query text via Gemini",
        "Pinecone performs cosine similarity search (top 3 results)",
        "Results returned with relevance scores and metadata",
        "Client Script renders suggestion cards in blue panel"
    ]
    for i, step in enumerate(search_steps, 1):
        doc.add_paragraph(f"{i}. {step}")

    doc.add_heading("5.4 Relevance Scoring", level=2)
    doc.add_paragraph(
        "Each suggestion includes a relevance score based on cosine similarity:"
    )

    add_table(doc,
        ["Score Range", "Interpretation", "Action"],
        [
            ["0.9 - 1.0", "Excellent match", "Highly recommended resolution"],
            ["0.7 - 0.9", "Good match", "Suggested resolution"],
            ["0.5 - 0.7", "Moderate match", "Possible relevance"],
            ["0.0 - 0.5", "Low match", "Not displayed (below threshold)"],
        ]
    )

    # ══════════════════════════════════════════════════════════════
    # 6. SERVICENOW PLUGIN ARCHITECTURE
    # ══════════════════════════════════════════════════════════════
    doc.add_heading("6. ServiceNow Plugin Architecture", level=1)

    doc.add_heading("6.1 Component Overview", level=2)
    doc.add_paragraph(
        "The ServiceNow plugin consists of three main components that work together "
        "to provide real-time suggestions:"
    )

    add_table(doc,
        ["Component", "Type", "Purpose", "File"],
        [
            ["AIServiceDeskClient", "Script Include", "Server-side GlideAjax handler", "01-script-include.js"],
            ["AI_Suggestion_On_Type", "Client Script", "onChange handler for description", "02-client-script.js"],
            ["ai-suggestion-panel", "Portal Widget", "Visual suggestion display", "widget/*"],
        ]
    )

    doc.add_heading("6.2 Script Include (Server-Side)", level=2)
    doc.add_paragraph(
        "The Script Include extends AbstractAjaxProcessor and provides the "
        "getSuggestions() function that GlideAjax calls:"
    )

    add_table(doc,
        ["Function", "Parameters", "Returns", "Purpose"],
        [
            ["getSuggestions", "sysparm_description", "JSON", "Fetches similar incidents from backend"],
        ]
    )

    doc.add_paragraph("Key implementation details:")
    script_details = [
        "Extends AbstractAjaxProcessor for GlideAjax compatibility",
        "Uses sn_ws.RESTMessageV2 for HTTP calls to backend",
        "Handles connection timeouts (10 seconds)",
        "Returns structured JSON with suggestions array",
        "Logs errors to System Logs with [AI Service Desk] prefix"
    ]
    for detail in script_details:
        doc.add_paragraph(detail, style="List Bullet")

    doc.add_heading("6.3 Client Script (Browser-Side)", level=2)
    doc.add_paragraph(
        "The Client Script runs in the browser and triggers on description field changes:"
    )

    add_table(doc,
        ["Function", "Trigger", "Behavior"],
        [
            ["onChange", "Description field changes", "Debounces input, triggers search after 1.5s"],
            ["searchAISuggestions", "After debounce", "Calls GlideAjax with description"],
            ["displayAISuggestions", "On response", "Renders suggestion cards in blue panel"],
            ["applyAIResolution", "Button click", "Copies resolution to form fields"],
            ["dismissAICard", "Button click", "Hides individual suggestion card"],
        ]
    )

    doc.add_heading("6.4 Portal Widget (Optional)", level=2)
    doc.add_paragraph(
        "For a richer experience in Service Portal, an AngularJS widget provides:"
    )
    widget_features = [
        "Responsive card layout for suggestions",
        "Relevance score badges with color coding",
        "One-click resolution application",
        "Dismiss functionality for irrelevant suggestions",
        "Integration with g_form API for field updates"
    ]
    for feature in widget_features:
        doc.add_paragraph(feature, style="List Bullet")

    # ══════════════════════════════════════════════════════════════
    # 7. DATA FLOW
    # ══════════════════════════════════════════════════════════════
    doc.add_heading("7. Data Flow", level=1)

    doc.add_heading("7.1 Ingestion Flow (Historical Data)", level=2)
    doc.add_paragraph(
        "The ingestion pipeline processes historical incidents from ServiceNow:"
    )

    add_table(doc,
        ["Step", "Component", "Action", "Output"],
        [
            ["1", "ServiceNowSyncScheduler", "Triggers sync on schedule", "Sync request"],
            ["2", "ServiceNowKnowledgeConnector", "Fetches incidents from ServiceNow", "Incident records"],
            ["3", "TextChunker", "Splits text into 512-token chunks", "Text chunks"],
            ["4", "SpringAiEmbeddingAdapter", "Generates embeddings via Gemini batch API", "1024-dim vectors"],
            ["5", "PineconeVectorAdapter", "Upserts vectors in batches of 96", "Stored vectors"],
        ]
    )

    doc.add_heading("7.2 Query Flow (Real-Time Suggestions)", level=2)
    doc.add_paragraph(
        "When an agent creates a new ticket:"
    )

    add_table(doc,
        ["Step", "Component", "Action", "Output"],
        [
            ["1", "Client Script", "Detects description change", "Debounced input"],
            ["2", "GlideAjax", "Calls Script Include", "Server request"],
            ["3", "Script Include", "POSTs to backend API", "REST request"],
            ["4", "SuggestionEngineService", "Orchestrates search", "Query processing"],
            ["5", "SpringAiEmbeddingAdapter", "Embeds query text", "Query vector"],
            ["6", "PineconeVectorAdapter", "Performs similarity search", "Matching vectors"],
            ["7", "Response", "Returns suggestions with scores", "JSON response"],
            ["8", "Client Script", "Renders suggestion cards", "UI update"],
        ]
    )

    doc.add_heading("7.3 Resolution Application Flow", level=2)
    doc.add_paragraph(
        "When agent clicks 'Apply Resolution':"
    )

    add_table(doc,
        ["Step", "Component", "Action", "Result"],
        [
            ["1", "Client Script", "Gets selected suggestion", "Resolution text"],
            ["2", "g_form.setValue", "Sets resolution_notes field", "Form update"],
            ["3", "g_form.setValue", "Sets state to '6' (Resolved)", "Status change"],
            ["4", "g_form.setValue", "Sets close_code", "Closure reason"],
            ["5", "Info Message", "Displays confirmation", "User feedback"],
        ]
    )

    # ══════════════════════════════════════════════════════════════
    # 8. API SPECIFICATION
    # ══════════════════════════════════════════════════════════════
    doc.add_heading("8. API Specification", level=1)

    doc.add_heading("8.1 Suggestion Resolution", level=2)
    p = doc.add_paragraph()
    p.add_run("POST ").bold = True
    p.add_run("/api/v1/suggestions/resolve")
    p.add_run("  —  ").italic = True
    p.add_run("Get similar incidents for a query")

    add_table(doc,
        ["Parameter", "Type", "Required", "Description"],
        [
            ["query", "string", "Yes", "Ticket description or search query"],
            ["maxResults", "integer", "No", "Maximum results (default: 3)"],
            ["minConfidenceThreshold", "double", "No", "Minimum relevance score (0-100)"],
        ]
    )

    doc.add_heading("8.2 Knowledge Search", level=2)
    p = doc.add_paragraph()
    p.add_run("GET ").bold = True
    p.add_run("/api/v1/knowledge/search")
    p.add_run("  —  ").italic = True
    p.add_run("Search knowledge base")

    add_table(doc,
        ["Parameter", "Type", "Required", "Description"],
        [
            ["query", "string", "Yes", "Search query"],
            ["topK", "integer", "No", "Number of results (default: 5)"],
        ]
    )

    doc.add_heading("8.3 Knowledge Sync", level=2)
    p = doc.add_paragraph()
    p.add_run("POST ").bold = True
    p.add_run("/api/v1/knowledge/sync")
    p.add_run("  —  ").italic = True
    p.add_run("Trigger sync from ServiceNow to Pinecone")

    doc.add_heading("8.4 Load Synthetic Data", level=2)
    p = doc.add_paragraph()
    p.add_run("POST ").bold = True
    p.add_run("/api/v1/knowledge/load-synthetic")
    p.add_run("  —  ").italic = True
    p.add_run("Load 20 sample incidents into ServiceNow")

    doc.add_heading("8.5 Health Check", level=2)
    p = doc.add_paragraph()
    p.add_run("GET ").bold = True
    p.add_run("/actuator/health")
    p.add_run("  —  ").italic = True
    p.add_run("System availability status")

    # ══════════════════════════════════════════════════════════════
    # 9. CONFIGURATION
    # ══════════════════════════════════════════════════════════════
    doc.add_heading("9. Configuration", level=1)

    doc.add_heading("9.1 Environment Variables", level=2)
    add_table(doc,
        ["Variable", "Default", "Description"],
        [
            ["GOOGLE_AI_API_KEY", "—", "Google Gemini API key"],
            ["PINECONE_API_KEY", "—", "Pinecone API key"],
            ["PINECONE_INDEX_NAME", "servicedesk-knowledge", "Pinecone index name"],
            ["SERVICENOW_INSTANCE_URL", "https://dev440425.service-now.com", "ServiceNow instance"],
            ["SERVICENOW_USERNAME", "—", "ServiceNow admin username"],
            ["SERVICENOW_PASSWORD", "—", "ServiceNow admin password"],
            ["SERVER_PORT", "8080", "Backend server port"],
        ]
    )

    doc.add_heading("9.2 AppConstants.java", level=2)
    doc.add_paragraph(
        "All constants are centralized in AppConstants.java for consistency:"
    )

    add_table(doc,
        ["Constant", "Value", "Purpose"],
        [
            ["VECTOR_ID_PREFIX", "sn-", "Prefix for vector IDs"],
            ["DEFAULT_NAMESPACE", "default", "Pinecone namespace"],
            ["EMBEDDING_BATCH_SIZE", "100", "Gemini batch size"],
            ["UPSERT_BATCH_SIZE", "96", "Pinecone upsert batch size"],
            ["CHUNK_SIZE", "512", "Text chunk size in tokens"],
            ["CHUNK_OVERLAP", "50", "Overlap between chunks"],
            ["MIN_RELEVANCE_SCORE", "0.7", "Minimum score threshold"],
        ]
    )

    # ══════════════════════════════════════════════════════════════
    # 10. DEPLOYMENT
    # ══════════════════════════════════════════════════════════════
    doc.add_heading("10. Deployment & Operations", level=1)

    doc.add_heading("10.1 Prerequisites", level=2)
    prereqs = [
        "Java 17+ runtime (Eclipse Temurin recommended)",
        "Maven 3.9+ for building from source",
        "Node.js 18+ for Cloudflare tunnel",
        "ServiceNow developer instance (free tier OK)",
        "Google Cloud project with Gemini API enabled",
        "Pinecone account (free tier OK)"
    ]
    for p_item in prereqs:
        doc.add_paragraph(p_item, style="List Bullet")

    doc.add_heading("10.2 Deployment Steps", level=2)
    add_table(doc,
        ["Step", "Command", "Purpose"],
        [
            ["1", "mvn clean install -DskipTests", "Build the project"],
            ["2", "mvn spring-boot:run -pl api", "Start the backend"],
            ["3", "cloudflared tunnel --url http://localhost:8080", "Start Cloudflare tunnel"],
            ["4", "curl http://localhost:8080/actuator/health", "Verify backend"],
            ["5", "curl https://<tunnel-url>/actuator/health", "Verify tunnel"],
            ["6", "POST /api/v1/knowledge/load-synthetic", "Load sample data"],
            ["7", "POST /api/v1/knowledge/sync", "Sync to vector DB"],
        ]
    )

    doc.add_heading("10.3 ServiceNow Setup", level=2)
    add_table(doc,
        ["Component", "Navigation", "Key Settings"],
        [
            ["Script Include", "System Definition > Script Includes", "Client Callable: ☑"],
            ["Client Script", "System Definition > Client Scripts", "Type: onChange, Field: description"],
            ["REST Message", "System Web Services > Outbound > REST Message", "Endpoint: tunnel URL"],
            ["Portal Widget", "Service Portal > Widgets", "HTML, CSS, Client Script"],
        ]
    )

    # ══════════════════════════════════════════════════════════════
    # 11. TESTING
    # ══════════════════════════════════════════════════════════════
    doc.add_heading("11. Testing Strategy", level=1)

    doc.add_heading("11.1 Test Levels", level=2)
    add_table(doc,
        ["Level", "Scope", "Tools"],
        [
            ["Unit", "Individual components", "JUnit 5, Mockito"],
            ["Integration", "API endpoints", "MockMvc, TestRestTemplate"],
            ["E2E", "Full user flow", "Manual testing in ServiceNow"],
        ]
    )

    doc.add_heading("11.2 Verification Checklist", level=2)
    checklist = [
        "Backend health check returns UP",
        "Cloudflare tunnel is accessible",
        "API returns suggestions for test query",
        "ServiceNow Script Include is client-callable",
        "Client Script triggers on description change",
        "GlideAjax calls return 200 status",
        "Suggestion panel appears in Incident form",
        "Apply Resolution updates form fields"
    ]
    for item in checklist:
        doc.add_paragraph(item, style="List Bullet")

    # ══════════════════════════════════════════════════════════════
    # 12. TROUBLESHOOTING
    # ══════════════════════════════════════════════════════════════
    doc.add_heading("12. Troubleshooting", level=1)

    doc.add_heading("12.1 Common Issues", level=2)
    add_table(doc,
        ["Issue", "Symptoms", "Fix"],
        [
            ["Backend not running", "Health check fails", "Run: mvn spring-boot:run -pl api"],
            ["Tunnel URL changed", "ServiceNow 403/500", "Update URL in Script Include"],
            ["Script Include not callable", "GlideAjax fails", "Check Client Callable checkbox"],
            ["No suggestions appear", "Empty panel", "Load synthetic data and sync"],
            ["Pinecone connection failed", "Vector search error", "Check PINECONE_API_KEY"],
            ["Gemini API error", "Embedding failure", "Check GOOGLE_AI_API_KEY"],
        ]
    )

    doc.add_heading("12.2 Debug Steps", level=2)
    debug_steps = [
        "Check browser Console (F12) for JavaScript errors",
        "Check ServiceNow System Logs for [AI Service Desk] errors",
        "Verify tunnel URL is correct and accessible",
        "Test API endpoint directly via curl or Postman",
        "Check backend logs for connection errors"
    ]
    for step in debug_steps:
        doc.add_paragraph(step, style="List Bullet")

    # ══════════════════════════════════════════════════════════════
    # 13. ROADMAP
    # ══════════════════════════════════════════════════════════════
    doc.add_heading("13. Roadmap", level=1)

    roadmap = [
        ("Phase 1 — Current", "Core suggestion engine with Pinecone + Gemini integration"),
        ("Phase 2 — Enhanced UI", "Service Portal widget with rich card layout"),
        ("Phase 3 — Analytics", "Suggestion acceptance/rejection tracking"),
        ("Phase 4 — ML Feedback", "Reinforcement learning from agent choices"),
        ("Phase 5 — Multi-Tenant", "Support for multiple ServiceNow instances"),
    ]
    for phase, desc in roadmap:
        p = doc.add_paragraph()
        p.add_run(f"{phase}: ").bold = True
        p.add_run(desc)

    # ── Footer ──
    section = doc.sections[0]
    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer.add_run("ServiceNow AI Service Desk — Confidential  |  ").font.size = Pt(8)
    add_page_number(footer)

    return doc


if __name__ == "__main__":
    output_dir = os.path.join(os.path.dirname(__file__), "..", "..", "output")
    os.makedirs(output_dir, exist_ok=True)

    doc = build_document()
    output_path = os.path.join(output_dir, "ServiceNow_AI_Service_Desk_Architecture.docx")
    doc.save(output_path)
    print(f"Document saved: {output_path}")
