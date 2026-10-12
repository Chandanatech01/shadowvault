package com.shadowvault.service;

import com.shadowvault.model.EvidenceItem;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;

@Service
public class HashChainService {

    public static final String GENESIS_HASH = "GENESIS";

    public String computeContentHash(byte[] rawEvidenceBytes) {
        return sha256Hex(rawEvidenceBytes);
    }

    public String computeChainHash(String contentHash, String prevChainHash, Instant timestamp, String caseId, Long victimId) {
        String data = contentHash + prevChainHash + timestamp.toEpochMilli() + caseId + victimId;
        return sha256Hex(data.getBytes(StandardCharsets.UTF_8));
    }

    public ChainVerificationResult verifyChain(List<EvidenceItem> items, String caseId, Long victimId) {
        if (items == null || items.isEmpty()) {
            return new ChainVerificationResult(true, -1, null, new ArrayList<>());
        }

        List<ItemVerificationStatus> itemStatuses = new ArrayList<>();
        boolean chainValid = true;
        int firstBrokenIndex = -1;
        Long firstBrokenId = null;

        String expectedPrevHash = GENESIS_HASH;

        for (int i = 0; i < items.size(); i++) {
            EvidenceItem item = items.get(i);
            boolean itemValid = true;
            String reason = "OK";

            // Verify prevChainHash linkage
            if (!item.getPrevChainHash().equalsIgnoreCase(expectedPrevHash)) {
                itemValid = false;
                reason = "Broken linkage: prevChainHash does not match previous item chainHash";
            } else {
                // Recompute chainHash
                String recomputedChainHash = computeChainHash(
                        item.getContentHash(),
                        item.getPrevChainHash(),
                        item.getCreatedAt(),
                        caseId,
                        victimId
                );
                if (!recomputedChainHash.equalsIgnoreCase(item.getChainHash())) {
                    itemValid = false;
                    reason = "ChainHash mismatch: record integrity altered";
                }
            }

            if (!itemValid && firstBrokenIndex == -1) {
                firstBrokenIndex = i;
                firstBrokenId = item.getId();
                chainValid = false;
            }

            itemStatuses.add(new ItemVerificationStatus(
                    item.getId(),
                    itemValid,
                    itemValid ? "VERIFIED" : "TAMPERED",
                    reason,
                    item.getContentHash(),
                    item.getChainHash()
            ));

            // Chain progression uses the current item's stored chainHash
            expectedPrevHash = item.getChainHash();
        }

        return new ChainVerificationResult(chainValid, firstBrokenIndex, firstBrokenId, itemStatuses);
    }

    public String sha256Hex(byte[] bytes) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(bytes);
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 calculation failed", e);
        }
    }

    public static class ChainVerificationResult {
        public final boolean valid;
        public final int firstBrokenIndex;
        public final Long firstBrokenId;
        public final List<ItemVerificationStatus> itemStatuses;

        public ChainVerificationResult(boolean valid, int firstBrokenIndex, Long firstBrokenId, List<ItemVerificationStatus> itemStatuses) {
            this.valid = valid;
            this.firstBrokenIndex = firstBrokenIndex;
            this.firstBrokenId = firstBrokenId;
            this.itemStatuses = itemStatuses;
        }
    }

    public static class ItemVerificationStatus {
        public final Long evidenceId;
        public final boolean verified;
        public final String status;
        public final String detail;
        public final String contentHash;
        public final String chainHash;

        public ItemVerificationStatus(Long evidenceId, boolean verified, String status, String detail, String contentHash, String chainHash) {
            this.evidenceId = evidenceId;
            this.verified = verified;
            this.status = status;
            this.detail = detail;
            this.contentHash = contentHash;
            this.chainHash = chainHash;
        }
    }
}
