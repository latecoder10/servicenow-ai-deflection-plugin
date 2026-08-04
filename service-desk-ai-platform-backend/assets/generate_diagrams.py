"""Generate flow diagram images for AI Service Desk Knowledge Intelligence Platform requirements document."""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "output", "diagrams")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Color palette
NAVY = "#1F3A5F"
BLUE = "#2980B9"
LIGHT_BLUE = "#D6EAF8"
GREEN = "#27AE60"
LIGHT_GREEN = "#D5F5E3"
ORANGE = "#E67E22"
LIGHT_ORANGE = "#FDEBD0"
RED = "#E74C3C"
LIGHT_RED = "#FADBD8"
GRAY = "#95A5A6"
LIGHT_GRAY = "#F2F3F4"
WHITE = "#FFFFFF"
PURPLE = "#8E44AD"
LIGHT_PURPLE = "#E8DAEF"


def draw_box(ax, x, y, w, h, text, color=BLUE, text_color="white", fontsize=9, shape="round"):
    if shape == "round":
        box = FancyBboxPatch((x - w/2, y - h/2), w, h,
                             boxstyle="round,pad=0.05", facecolor=color, edgecolor="white", linewidth=1.5)
    elif shape == "diamond":
        box = FancyBboxPatch((x - w/2, y - h/2), w, h,
                             boxstyle="round,pad=0.05", facecolor=color, edgecolor="white", linewidth=1.5)
    else:
        box = FancyBboxPatch((x - w/2, y - h/2), w, h,
                             boxstyle="square,pad=0.05", facecolor=color, edgecolor="white", linewidth=1.5)
    ax.add_patch(box)
    ax.text(x, y, text, ha='center', va='center', fontsize=fontsize,
            color=text_color, fontweight='bold', wrap=True)


def draw_arrow(ax, x1, y1, x2, y2, color=GRAY, style='->', label=None):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle=style, color=color, lw=1.5))
    if label:
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        ax.text(mx + 0.02, my, label, fontsize=7, color=color, ha='left', va='center')


def generate_system_architecture():
    fig, ax = plt.subplots(1, 1, figsize=(10, 7))
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    ax.set_facecolor(WHITE)

    # Title
    ax.text(0.5, 0.95, "AI Service Desk System Architecture (Hexagonal Architecture)", ha='center', va='top', fontsize=13, fontweight='bold', color=NAVY)

    # Client / Portal
    draw_box(ax, 0.5, 0.86, 0.35, 0.05, "ServiceNow Self-Service Portal / End-User Client", NAVY, fontsize=9)

    # REST Controller Layer
    draw_box(ax, 0.5, 0.74, 0.45, 0.06, "SuggestionController & API Layer (/api/v1/suggestions)", BLUE, fontsize=9)
    draw_arrow(ax, 0.5, 0.835, 0.5, 0.77)

    # Core Application Service
    draw_box(ax, 0.5, 0.60, 0.50, 0.07, "SuggestionEngineService & Confidence Calculator\n(Application Use Cases / CQRS)", PURPLE, fontsize=9)
    draw_arrow(ax, 0.5, 0.71, 0.5, 0.635)

    # Outbound Adapters (Hexagonal Ports)
    draw_box(ax, 0.18, 0.43, 0.26, 0.07, "SpringAiEmbeddingAdapter\n(Pinecone Vector Search)", GREEN, fontsize=8)
    draw_box(ax, 0.50, 0.43, 0.26, 0.07, "SpringAiLlmAdapter\n(Gemini 3.6 Flash RAG)", ORANGE, fontsize=8)
    draw_box(ax, 0.82, 0.43, 0.26, 0.07, "ServiceNowRestAdapter\n(Circuit Breaker + OAuth2)", RED, fontsize=8)

    draw_arrow(ax, 0.35, 0.565, 0.22, 0.465)
    draw_arrow(ax, 0.50, 0.565, 0.50, 0.465)
    draw_arrow(ax, 0.65, 0.565, 0.78, 0.465)

    # External Infrastructure Systems
    draw_box(ax, 0.18, 0.26, 0.22, 0.06, "Pinecone Vector DB\n(768-dim Index)", LIGHT_GREEN, GREEN, fontsize=8)
    draw_box(ax, 0.50, 0.26, 0.22, 0.06, "Google Gemini 3.6\n(LLM & Reranker)", LIGHT_ORANGE, ORANGE, fontsize=8)
    draw_box(ax, 0.82, 0.26, 0.22, 0.06, "ServiceNow ITSM\n(Incident & KB REST)", LIGHT_RED, RED, fontsize=8)

    draw_arrow(ax, 0.18, 0.395, 0.18, 0.29)
    draw_arrow(ax, 0.50, 0.395, 0.50, 0.29)
    draw_arrow(ax, 0.82, 0.395, 0.82, 0.29)

    # Database & Cache Layer
    draw_box(ax, 0.33, 0.12, 0.28, 0.05, "PostgreSQL (Audit Logs & Metrics)", LIGHT_BLUE, NAVY, fontsize=8)
    draw_box(ax, 0.67, 0.12, 0.28, 0.05, "Redis (Rate Limiting & Cache)", LIGHT_PURPLE, PURPLE, fontsize=8)

    draw_arrow(ax, 0.40, 0.23, 0.35, 0.145)
    draw_arrow(ax, 0.60, 0.23, 0.65, 0.145)

    fig.tight_layout()
    fig.savefig(f"{OUTPUT_DIR}/system_architecture.png", dpi=200, bbox_inches='tight', facecolor=WHITE)
    plt.close()
    print("Generated: system_architecture.png")


def generate_data_flow():
    fig, ax = plt.subplots(1, 1, figsize=(10, 8))
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    ax.set_facecolor(WHITE)

    ax.text(0.5, 0.97, "AI Incident Deflection & RAG Processing Flow", ha='center', va='top', fontsize=13, fontweight='bold', color=NAVY)

    # Flow Steps
    steps = [
        (0.5, 0.88, "1. User types issue on pre-ticket form", NAVY),
        (0.5, 0.78, "2. Generate Vector Embedding (Text-Embedding-004)", BLUE),
        (0.5, 0.68, "3. Query Pinecone Vector DB (Similarity Search Top-10)", GREEN),
        (0.5, 0.58, "4. Cross-Encoder Reranking (Select Top-5 Chunks)", PURPLE),
        (0.5, 0.48, "5. Synthesize Step-by-Step Solution via Gemini 3.6 Flash", ORANGE),
        (0.5, 0.38, "6. Evaluate Multi-Factor Confidence Score (Threshold >= 75%)", RED),
    ]

    for i, (x, y, text, color) in enumerate(steps):
        draw_box(ax, x, y, 0.65, 0.06, text, color, fontsize=9)
        if i < len(steps) - 1:
            draw_arrow(ax, x, y - 0.03, x, steps[i+1][1] + 0.03)

    # Decision Branches
    # High Confidence -> Deflected
    draw_box(ax, 0.25, 0.24, 0.38, 0.07, "✓ Deflection Successful (>= 75%)\nReturn Instant Solution (No Ticket Created)", GREEN, fontsize=8)
    draw_arrow(ax, 0.35, 0.35, 0.25, 0.275, color=GREEN, label="Passed")

    # Low Confidence -> Create Incident
    draw_box(ax, 0.75, 0.24, 0.38, 0.07, "✗ Deflection Failed (< 75%)\nAuto-Create ServiceNow Incident", RED, fontsize=8)
    draw_arrow(ax, 0.65, 0.35, 0.75, 0.275, color=RED, label="Failed")

    # Final ROI Outcome
    draw_box(ax, 0.5, 0.10, 0.60, 0.05, "Log Metrics & Compute ROI Savings ($15.50 / Deflection)", LIGHT_BLUE, NAVY, fontsize=8)
    draw_arrow(ax, 0.25, 0.205, 0.42, 0.125)
    draw_arrow(ax, 0.75, 0.205, 0.58, 0.125)

    fig.tight_layout()
    fig.savefig(f"{OUTPUT_DIR}/data_flow.png", dpi=200, bbox_inches='tight', facecolor=WHITE)
    plt.close()
    print("Generated: data_flow.png")


def generate_fallback_strategy():
    fig, ax = plt.subplots(1, 1, figsize=(10, 8))
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    ax.set_facecolor(WHITE)

    ax.text(0.5, 0.97, "Resilience4j Circuit Breaker & ServiceNow Fallback Strategy", ha='center', va='top', fontsize=13, fontweight='bold', color=NAVY)

    # Level 1: Circuit Breaker States
    ax.text(0.05, 0.88, "CIRCUIT STATES", fontsize=10, fontweight='bold', color=NAVY)
    draw_box(ax, 0.30, 0.85, 0.22, 0.05, "CLOSED\n(Normal Operations)", GREEN, fontsize=8)
    draw_box(ax, 0.58, 0.85, 0.22, 0.05, "OPEN\n(50% Failure Rate)", RED, fontsize=8)
    draw_box(ax, 0.85, 0.85, 0.22, 0.05, "HALF-OPEN\n(Testing Recovery)", ORANGE, fontsize=8)
    draw_arrow(ax, 0.41, 0.85, 0.47, 0.85, label="fails > 50%")
    draw_arrow(ax, 0.69, 0.85, 0.74, 0.85, label="after 10s")

    # Level 2: Failover Queue Buffer
    ax.text(0.05, 0.72, "FAILOVER QUEUE", fontsize=10, fontweight='bold', color=NAVY)
    draw_box(ax, 0.35, 0.69, 0.35, 0.05, "ServiceNow Unresponsive?\n→ Buffer Incident in Local DB Queue", PURPLE, fontsize=8)
    draw_box(ax, 0.75, 0.69, 0.30, 0.05, "Return Queued Ticket ID\nTo End-User", LIGHT_PURPLE, PURPLE, fontsize=8)
    draw_arrow(ax, 0.525, 0.69, 0.60, 0.69)

    # Level 3: Scheduled Sync Retry
    ax.text(0.05, 0.56, "RETRY ENGINE", fontsize=10, fontweight='bold', color=NAVY)
    draw_box(ax, 0.35, 0.53, 0.35, 0.05, "Scheduled Sync Task (@Scheduled)\nEvery 60s Poll Queued Items", BLUE, fontsize=8)
    draw_box(ax, 0.75, 0.53, 0.30, 0.05, "Push to ServiceNow REST API\nWhen Health Recovered", LIGHT_GREEN, GREEN, fontsize=8)
    draw_arrow(ax, 0.525, 0.53, 0.60, 0.53)

    # Resilience Parameters
    ax.text(0.05, 0.38, "RESILIENCE METRICS", fontsize=10, fontweight='bold', color=NAVY)
    draw_box(ax, 0.25, 0.32, 0.22, 0.05, "Sliding Window\n10 Requests", LIGHT_BLUE, NAVY, fontsize=7)
    draw_box(ax, 0.52, 0.32, 0.22, 0.05, "Wait Duration\n10,000 ms", LIGHT_ORANGE, ORANGE, fontsize=7)
    draw_box(ax, 0.79, 0.32, 0.22, 0.05, "Failure Threshold\n50%", LIGHT_RED, RED, fontsize=7)

    fig.tight_layout()
    fig.savefig(f"{OUTPUT_DIR}/fallback_strategy.png", dpi=200, bbox_inches='tight', facecolor=WHITE)
    plt.close()
    print("Generated: fallback_strategy.png")


def generate_extraction_pipeline():
    fig, ax = plt.subplots(1, 1, figsize=(10, 7))
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    ax.set_facecolor(WHITE)

    ax.text(0.5, 0.97, "Knowledge Base Ingestion & Vector Indexing Pipeline", ha='center', va='top', fontsize=13, fontweight='bold', color=NAVY)

    # Ingestion Sources
    draw_box(ax, 0.5, 0.87, 0.65, 0.05, "Document Ingestion: PDF Runbooks, Word SOPs, ServiceNow KB & Confluence", NAVY, fontsize=9)

    # Tika Parsing
    draw_box(ax, 0.5, 0.74, 0.55, 0.06, "Apache Tika Unified Parser (Metadata + Content Extraction)", BLUE, fontsize=9)
    draw_arrow(ax, 0.5, 0.845, 0.5, 0.77)

    # Sliding Window Chunker
    draw_box(ax, 0.5, 0.60, 0.55, 0.06, "SlidingWindowChunker (512 Token Chunks + 64 Token Overlap)", PURPLE, fontsize=9)
    draw_arrow(ax, 0.5, 0.71, 0.5, 0.63)

    # Spring AI Embedder
    draw_box(ax, 0.5, 0.46, 0.55, 0.06, "SpringAiEmbeddingAdapter (Text-Embedding-004 Model)", ORANGE, fontsize=9)
    draw_arrow(ax, 0.5, 0.57, 0.5, 0.49)

    # Upsert to Pinecone
    draw_box(ax, 0.5, 0.32, 0.55, 0.06, "PineconeVectorAdapter (Batch Upsert to 768-dim Vector Index)", GREEN, fontsize=9)
    draw_arrow(ax, 0.5, 0.43, 0.5, 0.35)

    # Metadata & Vector Store Confirmation
    draw_box(ax, 0.25, 0.16, 0.38, 0.06, "Pinecone Vector Index\n(Indexed Chunks + Embeddings)", LIGHT_GREEN, GREEN, fontsize=8)
    draw_box(ax, 0.75, 0.16, 0.38, 0.06, "PostgreSQL Metadata Store\n(Doc ID, Version, Source Type)", LIGHT_BLUE, NAVY, fontsize=8)
    draw_arrow(ax, 0.42, 0.29, 0.28, 0.19)
    draw_arrow(ax, 0.58, 0.29, 0.72, 0.19)

    fig.tight_layout()
    fig.savefig(f"{OUTPUT_DIR}/extraction_pipeline.png", dpi=200, bbox_inches='tight', facecolor=WHITE)
    plt.close()
    print("Generated: extraction_pipeline.png")


if __name__ == "__main__":
    generate_system_architecture()
    generate_data_flow()
    generate_fallback_strategy()
    generate_extraction_pipeline()
    print(f"\nAll diagrams saved to {OUTPUT_DIR}/")
