package com.servicedesk.ai.analytics.service;

import com.servicedesk.ai.analytics.model.DeflectionMetrics;
import com.servicedesk.ai.domain.repository.DeflectionEventJpaRepository;
import com.servicedesk.ai.domain.repository.KnowledgeDocumentJpaRepository;
import com.servicedesk.ai.domain.repository.SearchHistoryJpaRepository;
import com.servicedesk.ai.domain.settings.PlatformSettingsService;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Reports what the platform achieved, computed from recorded events.
 *
 * These figures were previously held in AtomicLong counters, which meant every
 * restart reset the deflection rate and cost saved to zero. They now come from
 * the deflection_analytics table, so the numbers describe a real period and
 * survive a redeploy.
 */
@Slf4j
@Service
public class DeflectionAnalyticsService {

    /**
     * Loaded cost of an agent handling one ticket. Tune per engagement.
     *
     * <p>These two are the environment defaults. Both are read through the settings
     * service at request time so an operator can agree a real cost figure with the
     * customer and apply it from the UI, rather than the savings headline being fixed
     * to a placeholder until someone redeploys.
     */
    @Value("${analytics.cost-per-ticket-usd:15.50}")
    private double costPerTicketUsd;

    /** Window used for the headline figures. */
    @Value("${analytics.reporting-window-days:30}")
    private int reportingWindowDays;

    private final Counter deflectionCounter;
    private final DeflectionEventJpaRepository deflectionRepository;
    private final SearchHistoryJpaRepository searchHistoryRepository;
    private final KnowledgeDocumentJpaRepository documentRepository;
    private final PlatformSettingsService settings;

    public DeflectionAnalyticsService(
        MeterRegistry registry,
        DeflectionEventJpaRepository deflectionRepository,
        SearchHistoryJpaRepository searchHistoryRepository,
        KnowledgeDocumentJpaRepository documentRepository,
        PlatformSettingsService settings
    ) {
        this.deflectionCounter = Counter.builder("servicedesk.ai.deflections.total")
            .description("Total number of successfully deflected ServiceNow incidents")
            .register(registry);
        this.deflectionRepository = deflectionRepository;
        this.searchHistoryRepository = searchHistoryRepository;
        this.documentRepository = documentRepository;
        this.settings = settings;
    }

    /** Kept for the Prometheus counter; the durable record is written by the telemetry service. */
    public void recordDeflectionEvent(boolean successful) {
        if (successful) {
            deflectionCounter.increment();
        }
    }

    public DeflectionMetrics computeCurrentMetrics() {
        int windowDays = settings.getInt("analytics.reporting-window-days", reportingWindowDays);
        Instant since = Instant.now().minus(windowDays, ChronoUnit.DAYS);

        long analyzed = safely(() -> deflectionRepository.countByCreatedAtAfter(since), 0L);
        long deflected = safely(() -> deflectionRepository.countByDeflectedTrueAndCreatedAtAfter(since), 0L);

        // The honest number: suggestions an agent confirmed resolved the problem. A high
        // confidence score only means the model believed itself.
        long confirmed = safely(() -> deflectionRepository.countByOutcomeAndCreatedAtAfter("SOLVED", since), 0L);

        double rate = analyzed > 0 ? (deflected * 100.0) / analyzed : 0.0;

        // Savings are claimed only for confirmed resolutions once any feedback exists.
        // Counting every above-threshold suggestion would overstate the benefit.
        long savedTickets = confirmed > 0 ? confirmed : deflected;
        double savings = savedTickets * settings.getDouble("analytics.cost-per-ticket-usd", costPerTicketUsd);

        Double avgConfidence = safely(() -> deflectionRepository.averageConfidenceSince(since), null);
        Double avgLatencyMs = safely(() -> deflectionRepository.averageLatencySince(since), null);
        long documents = safely(documentRepository::count, 0L);

        return DeflectionMetrics.builder()
            .totalIncidentsAnalyzed(analyzed)
            .ticketsDeflectedCount(deflected)
            // Reported alongside the deflected count so the savings figure can be traced:
            // without it a reader divides savings by the cost per ticket and gets a
            // different number than the one on the dashboard.
            .confirmedResolutionsCount(confirmed)
            .deflectionRatePercent(round(rate))
            .monthlyCostSavingsUSD(round(savings))
            .uploadedDocumentsCount(documents)
            .totalEmbeddingsCount(0L)   // filled in by the caller, which holds the vector port
            .averageConfidenceScore(avgConfidence != null ? round(avgConfidence) : 0.0)
            .averageResolutionTimeSeconds(avgLatencyMs != null ? round(avgLatencyMs / 1000.0) : 0.0)
            .calculatedAt(Instant.now())
            .build();
    }

    /**
     * Where the knowledge base is failing people.
     *
     * Ranked by how often a question was asked and answered poorly, which is a better
     * guide to what to write next than raw volume alone.
     */
    public Map<String, Object> knowledgeGaps(int windowDays, long minOccurrences) {
        Instant since = Instant.now().minus(Math.max(1, windowDays), ChronoUnit.DAYS);
        Map<String, Object> out = new LinkedHashMap<>();

        List<Map<String, Object>> unanswered = new ArrayList<>();
        for (Object[] row : safely(() -> searchHistoryRepository.queriesWithNoResultsSince(since), List.<Object[]>of())) {
            unanswered.add(Map.of("query", str(row[0]), "occurrences", num(row[1])));
        }

        List<Map<String, Object>> lowConfidence = new ArrayList<>();
        for (Object[] row : safely(() -> deflectionRepository.unresolvedThemesSince(since, minOccurrences), List.<Object[]>of())) {
            lowConfidence.add(Map.of(
                "query", str(row[0]),
                "occurrences", num(row[1]),
                "averageConfidence", row[2] != null ? round(((Number) row[2]).doubleValue()) : 0.0));
        }

        List<Map<String, Object>> byCategory = new ArrayList<>();
        for (Object[] row : safely(() -> deflectionRepository.categoryBreakdownSince(since), List.<Object[]>of())) {
            long total = num(row[1]);
            long met = num(row[2]);
            byCategory.add(Map.of(
                "category", str(row[0]),
                "questions", total,
                "aboveThreshold", met,
                "deflectionRatePercent", total > 0 ? round((met * 100.0) / total) : 0.0,
                "averageConfidence", row[3] != null ? round(((Number) row[3]).doubleValue()) : 0.0));
        }

        out.put("windowDays", windowDays);
        out.put("noResults", unanswered);
        out.put("recurringLowConfidence", lowConfidence);
        out.put("byCategory", byCategory);
        out.put("interpretation",
            "noResults are questions the corpus could not answer at all. recurringLowConfidence "
                + "are questions asked repeatedly where the answer stayed below the deflection "
                + "threshold. Both indicate an article worth writing.");
        return out;
    }

    /** The most asked questions in a window, whether or not they were answered well. */
    public List<Map<String, Object>> topQuestions(int windowDays, int limit) {
        Instant since = Instant.now().minus(Math.max(1, windowDays), ChronoUnit.DAYS);
        List<Map<String, Object>> out = new ArrayList<>();

        for (Object[] row : safely(() -> searchHistoryRepository.mostFrequentQueriesSince(since), List.<Object[]>of())) {
            if (out.size() >= limit) {
                break;
            }
            out.add(Map.of(
                "query", str(row[0]),
                "occurrences", num(row[1]),
                "averageTopScore", row[2] != null ? round(((Number) row[2]).doubleValue()) : 0.0));
        }
        return out;
    }

    /**
     * Analytics must never take down the dashboard. A failed aggregate degrades that one
     * figure rather than failing the whole response.
     */
    /**
     * Deflection rate over time.
     *
     * <p>Two series are returned per bucket. {@code deflectionRatePercent} is what the
     * engine offered above the confidence threshold; {@code confirmedRatePercent} is what
     * an agent then said actually solved the problem. Charting only the first flatters
     * the platform, because a confident wrong answer counts towards it.
     *
     * @param granularity DAY or HOUR. Anything else is treated as DAY rather than
     *                    reaching date_trunc, which would otherwise take an
     *                    unvalidated string straight into native SQL.
     */
    public Map<String, Object> deflectionTrend(int windowDays, String granularity) {
        boolean hourly = "HOUR".equalsIgnoreCase(granularity);
        String unit = hourly ? "hour" : "day";

        int safeWindow = Math.max(1, Math.min(windowDays, 365));
        Instant since = Instant.now().minus(safeWindow, ChronoUnit.DAYS);

        List<Map<String, Object>> points = new ArrayList<>();
        for (Object[] row : safely(() -> deflectionRepository.deflectionTrend(unit, since), List.<Object[]>of())) {
            long queries = num(row[1]);
            long deflected = num(row[2]);
            long confirmed = num(row[3]);

            Map<String, Object> point = new LinkedHashMap<>();
            point.put("bucket", row[0] == null ? null : row[0].toString());
            point.put("queries", queries);
            point.put("deflected", deflected);
            point.put("confirmed", confirmed);
            point.put("deflectionRatePercent", queries > 0 ? round((deflected * 100.0) / queries) : 0.0);
            point.put("confirmedRatePercent", queries > 0 ? round((confirmed * 100.0) / queries) : 0.0);
            point.put("averageConfidence",
                row[4] != null ? round(((Number) row[4]).doubleValue()) : 0.0);
            points.add(point);
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("granularity", hourly ? "HOUR" : "DAY");
        out.put("windowDays", safeWindow);
        out.put("pointCount", points.size());
        out.put("points", points);
        // A single bucket is not a trend. Saying so lets the UI explain an honest-looking
        // flat line instead of the reader assuming the chart is broken.
        out.put("sufficientForTrend", points.size() > 1);
        return out;
    }

    private <T> T safely(java.util.function.Supplier<T> query, T fallback) {
        try {
            T value = query.get();
            return value != null ? value : fallback;
        } catch (Exception e) {
            log.warn("Analytics query failed, reporting the fallback: {}", e.getMessage());
            return fallback;
        }
    }

    private static double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private static String str(Object o) {
        return o == null ? "" : String.valueOf(o);
    }

    private static long num(Object o) {
        return o instanceof Number n ? n.longValue() : 0L;
    }
}
