package com.shadowvault;

import com.shadowvault.model.EvidenceItem;
import com.shadowvault.model.SeverityLevel;
import com.shadowvault.model.SeverityTag;
import com.shadowvault.service.SeverityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class SeverityServiceTest {

    private SeverityService severityService;

    @BeforeEach
    public void setup() {
        severityService = new SeverityService();
    }

    @Test
    public void testSeverityTagWeights() {
        assertEquals(30, SeverityTag.THREAT.getWeight());
        assertEquals(40, SeverityTag.PHYSICAL_HARM.getWeight());
        assertEquals(20, SeverityTag.REPEATED_INCIDENT.getWeight());
        assertEquals(10, SeverityTag.HARASSMENT.getWeight());
        assertEquals(25, SeverityTag.STALKING.getWeight());

        int itemTagScore = severityService.calculateItemTagScore(Set.of(SeverityTag.THREAT, SeverityTag.PHYSICAL_HARM));
        assertEquals(70, itemTagScore);
    }

    @Test
    public void testCaseSeverityCalculationFormula() {
        // Severity = sum of tag weights + 5 per item
        List<EvidenceItem> items = new ArrayList<>();

        EvidenceItem item1 = new EvidenceItem();
        item1.setTagScore(30); // e.g. THREAT (30)
        items.add(item1);

        EvidenceItem item2 = new EvidenceItem();
        item2.setTagScore(40); // e.g. PHYSICAL_HARM (40)
        items.add(item2);

        // Expected = 30 + 40 + (2 items * 5) = 80
        int caseScore = severityService.calculateCaseSeverityScore(items);
        assertEquals(80, caseScore);

        SeverityLevel level = severityService.determineSeverityLevel(caseScore);
        assertEquals(SeverityLevel.MEDIUM, level);
    }

    @Test
    public void testSeverityLevelThresholds() {
        // Low < 40
        assertEquals(SeverityLevel.LOW, severityService.determineSeverityLevel(0));
        assertEquals(SeverityLevel.LOW, severityService.determineSeverityLevel(39));

        // Medium 40-99
        assertEquals(SeverityLevel.MEDIUM, severityService.determineSeverityLevel(40));
        assertEquals(SeverityLevel.MEDIUM, severityService.determineSeverityLevel(99));

        // High 100-199
        assertEquals(SeverityLevel.HIGH, severityService.determineSeverityLevel(100));
        assertEquals(SeverityLevel.HIGH, severityService.determineSeverityLevel(199));

        // Critical 200+
        assertEquals(SeverityLevel.CRITICAL, severityService.determineSeverityLevel(200));
        assertEquals(SeverityLevel.CRITICAL, severityService.determineSeverityLevel(350));
    }
}
