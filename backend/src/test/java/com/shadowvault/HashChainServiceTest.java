package com.shadowvault;

import com.shadowvault.model.EvidenceItem;
import com.shadowvault.service.HashChainService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class HashChainServiceTest {

    private HashChainService hashChainService;

    @BeforeEach
    public void setup() {
        hashChainService = new HashChainService();
    }

    @Test
    public void testContentHashComputation() {
        byte[] data1 = "first evidence item".getBytes(StandardCharsets.UTF_8);
        byte[] data2 = "second evidence item".getBytes(StandardCharsets.UTF_8);

        String hash1 = hashChainService.computeContentHash(data1);
        String hash2 = hashChainService.computeContentHash(data2);

        assertNotNull(hash1);
        assertNotNull(hash2);
        assertEquals(64, hash1.length());
        assertNotEquals(hash1, hash2);
    }

    @Test
    public void testValidChainVerification() {
        String caseId = "CASE-100200";
        Long victimId = 1L;

        List<EvidenceItem> items = new ArrayList<>();

        // Item 1 (Genesis)
        EvidenceItem item1 = new EvidenceItem();
        item1.setId(1L);
        item1.setContentHash(hashChainService.computeContentHash("Item 1".getBytes(StandardCharsets.UTF_8)));
        item1.setPrevChainHash(HashChainService.GENESIS_HASH);
        item1.setCreatedAt(Instant.ofEpochMilli(1000000));
        item1.setChainHash(hashChainService.computeChainHash(
                item1.getContentHash(), item1.getPrevChainHash(), item1.getCreatedAt(), caseId, victimId
        ));
        items.add(item1);

        // Item 2
        EvidenceItem item2 = new EvidenceItem();
        item2.setId(2L);
        item2.setContentHash(hashChainService.computeContentHash("Item 2".getBytes(StandardCharsets.UTF_8)));
        item2.setPrevChainHash(item1.getChainHash());
        item2.setCreatedAt(Instant.ofEpochMilli(2000000));
        item2.setChainHash(hashChainService.computeChainHash(
                item2.getContentHash(), item2.getPrevChainHash(), item2.getCreatedAt(), caseId, victimId
        ));
        items.add(item2);

        // Item 3
        EvidenceItem item3 = new EvidenceItem();
        item3.setId(3L);
        item3.setContentHash(hashChainService.computeContentHash("Item 3".getBytes(StandardCharsets.UTF_8)));
        item3.setPrevChainHash(item2.getChainHash());
        item3.setCreatedAt(Instant.ofEpochMilli(3000000));
        item3.setChainHash(hashChainService.computeChainHash(
                item3.getContentHash(), item3.getPrevChainHash(), item3.getCreatedAt(), caseId, victimId
        ));
        items.add(item3);

        HashChainService.ChainVerificationResult result = hashChainService.verifyChain(items, caseId, victimId);

        assertTrue(result.valid);
        assertEquals(-1, result.firstBrokenIndex);
        assertNull(result.firstBrokenId);
        assertEquals(3, result.itemStatuses.size());
        for (var status : result.itemStatuses) {
            assertTrue(status.verified);
            assertEquals("VERIFIED", status.status);
        }
    }

    @Test
    public void testTamperedChainDetection() {
        String caseId = "CASE-100200";
        Long victimId = 1L;

        List<EvidenceItem> items = new ArrayList<>();

        EvidenceItem item1 = new EvidenceItem();
        item1.setId(1L);
        item1.setContentHash(hashChainService.computeContentHash("Item 1".getBytes(StandardCharsets.UTF_8)));
        item1.setPrevChainHash(HashChainService.GENESIS_HASH);
        item1.setCreatedAt(Instant.ofEpochMilli(1000000));
        item1.setChainHash(hashChainService.computeChainHash(
                item1.getContentHash(), item1.getPrevChainHash(), item1.getCreatedAt(), caseId, victimId
        ));
        items.add(item1);

        EvidenceItem item2 = new EvidenceItem();
        item2.setId(2L);
        item2.setContentHash(hashChainService.computeContentHash("Item 2".getBytes(StandardCharsets.UTF_8)));
        item2.setPrevChainHash(item1.getChainHash());
        item2.setCreatedAt(Instant.ofEpochMilli(2000000));
        item2.setChainHash(hashChainService.computeChainHash(
                item2.getContentHash(), item2.getPrevChainHash(), item2.getCreatedAt(), caseId, victimId
        ));
        items.add(item2);

        // Simulate tampering on Item 2: modify contentHash
        item2.setContentHash("deadbeef00000000000000000000000000000000000000000000000000000000");

        HashChainService.ChainVerificationResult result = hashChainService.verifyChain(items, caseId, victimId);

        assertFalse(result.valid);
        assertEquals(1, result.firstBrokenIndex, "Item index 1 (item2) must be detected as first broken item");
        assertEquals(2L, result.firstBrokenId);
        assertEquals("TAMPERED", result.itemStatuses.get(1).status);
    }
}
