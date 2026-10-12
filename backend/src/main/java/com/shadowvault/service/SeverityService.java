package com.shadowvault.service;

import com.shadowvault.model.EvidenceItem;
import com.shadowvault.model.SeverityLevel;
import com.shadowvault.model.SeverityTag;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;

@Service
public class SeverityService {

    public int calculateItemTagScore(Collection<SeverityTag> tags) {
        if (tags == null) return 0;
        return tags.stream().mapToInt(SeverityTag::getWeight).sum();
    }

    public int calculateCaseSeverityScore(List<EvidenceItem> items) {
        if (items == null || items.isEmpty()) {
            return 0;
        }
        int tagSum = items.stream().mapToInt(EvidenceItem::getTagScore).sum();
        int itemBaseBonus = items.size() * 5;
        return tagSum + itemBaseBonus;
    }

    public SeverityLevel determineSeverityLevel(int score) {
        return SeverityLevel.fromScore(score);
    }
}
