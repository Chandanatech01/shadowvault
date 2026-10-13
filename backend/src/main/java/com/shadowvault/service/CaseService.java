package com.shadowvault.service;

import com.shadowvault.config.RsaKeyManager;
import com.shadowvault.model.*;
import com.shadowvault.repository.CaseRepository;
import com.shadowvault.repository.EvidenceItemRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;

@Service
public class CaseService {

    public static final int MAX_EVIDENCE_SIZE_BYTES = 200 * 1024; // 200 KB

    private final CaseRepository caseRepository;
    private final EvidenceItemRepository evidenceItemRepository;
    private final EncryptionService encryptionService;
    private final StegoService stegoService;
    private final HashChainService hashChainService;
    private final SeverityService severityService;
    private final RsaKeyManager rsaKeyManager;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${shadowvault.master.key-secret:master-fallback-secret-2026-shadowvault-secure-test-key-32b}")
    private String masterKeySecret;

    public CaseService(CaseRepository caseRepository,
                       EvidenceItemRepository evidenceItemRepository,
                       EncryptionService encryptionService,
                       StegoService stegoService,
                       HashChainService hashChainService,
                       SeverityService severityService,
                       RsaKeyManager rsaKeyManager) {
        this.caseRepository = caseRepository;
        this.evidenceItemRepository = evidenceItemRepository;
        this.encryptionService = encryptionService;
        this.stegoService = stegoService;
        this.hashChainService = hashChainService;
        this.severityService = severityService;
        this.rsaKeyManager = rsaKeyManager;
    }

    @Transactional
    public CaseRecord getOrCreateActiveCase(User victim) {
        List<CaseRecord> existing = caseRepository.findByVictimIdOrderByCreatedAtDesc(victim.getId());
        if (!existing.isEmpty()) {
            return existing.get(0);
        }

        String caseId = "CASE-" + (100000 + secureRandom.nextInt(900000));
        CaseRecord newCase = new CaseRecord(caseId, victim, "Incident Case " + caseId);
        return caseRepository.save(newCase);
    }

    @Transactional
    public EvidenceItem uploadEvidence(CaseRecord caseRecord,
                                       User victim,
                                       String evidenceType,
                                       String description,
                                       Set<SeverityTag> tags,
                                       byte[] rawBytes,
                                       String originalFileName,
                                       String mimeType) {
        if (rawBytes == null || rawBytes.length == 0) {
            throw new IllegalArgumentException("Evidence data cannot be empty");
        }
        if (rawBytes.length > MAX_EVIDENCE_SIZE_BYTES) {
            throw new IllegalArgumentException("Evidence exceeds maximum size of 200 KB (size: " + rawBytes.length + " bytes)");
        }

        try {
            // (a) AES-256-GCM encrypt with a fresh key
            SecretKey aesKey = encryptionService.generateFreshAesKey();
            byte[] iv = encryptionService.generateIv();
            byte[] ciphertext = encryptionService.encryptAesGcm(aesKey, iv, rawBytes);

            // (b) Wrap AES key with RSA-4096 authority public key
            PublicKey authorityPubKey = rsaKeyManager.getAuthorityPublicKey();
            byte[] wrappedKey = encryptionService.wrapAesKey(aesKey, authorityPubKey);

            // Store a second wrap of each item's AES key under KEY_ENCRYPTION_SECRET for victim decrypt
            byte[] masterWrappedKey = encryptionService.encryptWithMasterSecret(aesKey.getEncoded(), masterKeySecret);

            // (c) Hide encrypted payload with length header inside auto-generated PNG carrier using key-seeded adaptive LSB
            byte[] packedPayload = encryptionService.packPayload(wrappedKey, iv, ciphertext);
            BufferedImage carrier = stegoService.createCarrierImage(packedPayload.length);
            stegoService.embedPayload(carrier, packedPayload, wrappedKey);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(carrier, "PNG", baos);
            byte[] stegoPngBytes = baos.toByteArray();

            // (d) contentHash = SHA-256; chainHash = SHA256(contentHash + prevChainHash + timestamp + caseId + victimId)
            String contentHash = hashChainService.computeContentHash(rawBytes);

            Optional<EvidenceItem> lastItemOpt = evidenceItemRepository.findTopByCaseRecordIdOrderByIdDesc(caseRecord.getId());
            String prevChainHash = lastItemOpt.map(EvidenceItem::getChainHash).orElse(HashChainService.GENESIS_HASH);

            Instant timestamp = Instant.now();
            String chainHash = hashChainService.computeChainHash(
                    contentHash,
                    prevChainHash,
                    timestamp,
                    caseRecord.getCaseId(),
                    victim.getId()
            );

            // Compute tag score
            int tagScore = severityService.calculateItemTagScore(tags);

            EvidenceItem item = new EvidenceItem();
            item.setCaseRecord(caseRecord);
            item.setVictimId(victim.getId());
            item.setEvidenceType(evidenceType);
            item.setDescription(encryptionService.encryptIdentity(description));
            item.setSeverityTags(tags != null ? tags : new HashSet<>());
            item.setTagScore(tagScore);
            item.setOriginalFileName(originalFileName);
            item.setMimeType(mimeType);

            // Persist as LONGBLOB in MySQL
            item.setStegoImageData(stegoPngBytes);
            item.setMasterWrappedAesKey(Base64.getEncoder().encodeToString(masterWrappedKey));
            item.setPayloadSizeBytes(packedPayload.length);
            item.setModifiedSlots((packedPayload.length + 4) * 8);
            item.setImageWidth(carrier.getWidth());
            item.setImageHeight(carrier.getHeight());
            item.setStegoAlgorithm("Hidden with key-seeded adaptive LSB");
            item.setStegoImagePath("db://stego/" + caseRecord.getCaseId() + "_" + System.currentTimeMillis() + ".png");

            item.setWrappedAesKey(Base64.getEncoder().encodeToString(wrappedKey));
            item.setIv(Base64.getEncoder().encodeToString(iv));
            item.setContentHash(contentHash);
            item.setPrevChainHash(prevChainHash);
            item.setChainHash(chainHash);
            item.setCreatedAt(timestamp);

            // Optional disk backup
            try {
                String filePrefix = "stego_" + caseRecord.getCaseId() + "_" + System.currentTimeMillis();
                File stegoPngFile = stegoService.embedAndSave(packedPayload, wrappedKey, filePrefix);
                item.setStegoImagePath(stegoPngFile.getAbsolutePath());
            } catch (Exception ignored) {}

            evidenceItemRepository.save(item);

            // Recalculate case severity score: sum of tag weights + 5 per item
            List<EvidenceItem> allItems = evidenceItemRepository.findByCaseRecordIdOrderByIdAsc(caseRecord.getId());
            int newScore = severityService.calculateCaseSeverityScore(allItems);
            caseRecord.setSeverityScore(newScore);
            caseRecord.setSeverityLevel(severityService.determineSeverityLevel(newScore));
            caseRecord.setUpdatedAt(timestamp);
            caseRepository.save(caseRecord);

            return item;
        } catch (Exception e) {
            throw new RuntimeException("Evidence upload pipeline failed: " + e.getMessage(), e);
        }
    }

    public List<TimelineItemDto> getCaseTimeline(CaseRecord caseRecord) {
        List<EvidenceItem> items = evidenceItemRepository.findByCaseRecordIdOrderByIdAsc(caseRecord.getId());
        List<TimelineItemDto> timeline = new ArrayList<>();

        for (int i = 0; i < items.size(); i++) {
            EvidenceItem item = items.get(i);
            String contentPrefix = item.getContentHash().substring(0, Math.min(10, item.getContentHash().length())) + "...";
            String chainPrefix = item.getChainHash().substring(0, Math.min(10, item.getChainHash().length())) + "...";
            String prevPrefix = item.getPrevChainHash().equals(HashChainService.GENESIS_HASH) ? "GENESIS" : item.getPrevChainHash().substring(0, Math.min(8, item.getPrevChainHash().length())) + "...";

            timeline.add(new TimelineItemDto(
                    item.getId(),
                    i + 1,
                    item.getEvidenceType(),
                    encryptionService.decryptIdentity(item.getDescription()),
                    item.getSeverityTags(),
                    item.getTagScore(),
                    item.getCreatedAt(),
                    contentPrefix,
                    chainPrefix,
                    prevPrefix,
                    "CHAIN_LINKED",
                    item.getPayloadSizeBytes(),
                    item.getModifiedSlots(),
                    item.getImageWidth(),
                    item.getImageHeight(),
                    item.getStegoAlgorithm() != null ? item.getStegoAlgorithm() : "Hidden with key-seeded adaptive LSB"
            ));
        }

        return timeline;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> decryptEvidenceForVictim(EvidenceItem item) {
        try {
            byte[] wrappedKeyBytes = Base64.getDecoder().decode(item.getWrappedAesKey());
            byte[] extractedPackedPayload;

            if (item.getStegoImageData() != null && item.getStegoImageData().length > 0) {
                extractedPackedPayload = stegoService.extractPayloadFromBytes(item.getStegoImageData(), wrappedKeyBytes);
            } else {
                File stegoFile = new File(item.getStegoImagePath());
                extractedPackedPayload = stegoService.extractPayloadFromFile(stegoFile, wrappedKeyBytes);
            }

            EncryptionService.EncryptedContainer container = encryptionService.unpackPayload(extractedPackedPayload);

            if (item.getMasterWrappedAesKey() == null) {
                throw new IllegalStateException("Master-wrapped AES key not available for evidence item " + item.getId());
            }

            byte[] masterWrappedKeyBytes = Base64.getDecoder().decode(item.getMasterWrappedAesKey());
            byte[] rawAesKeyBytes = encryptionService.decryptWithMasterSecret(masterWrappedKeyBytes, masterKeySecret);
            SecretKey aesKey = new SecretKeySpec(rawAesKeyBytes, "AES");

            byte[] decryptedData = encryptionService.decryptAesGcm(aesKey, container.iv, container.ciphertext);

            String recomputedContentHash = hashChainService.computeContentHash(decryptedData);
            boolean verified = recomputedContentHash.equalsIgnoreCase(item.getContentHash());

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("evidenceId", item.getId());
            result.put("evidenceType", item.getEvidenceType());
            result.put("originalFileName", item.getOriginalFileName());
            result.put("mimeType", item.getMimeType());
            result.put("verified", verified);
            result.put("contentHash", item.getContentHash());
            result.put("recomputedHash", recomputedContentHash);

            if ("TEXT".equalsIgnoreCase(item.getEvidenceType())) {
                result.put("textData", new String(decryptedData, StandardCharsets.UTF_8));
            } else {
                String b64 = Base64.getEncoder().encodeToString(decryptedData);
                String mime = item.getMimeType() != null ? item.getMimeType() : ("IMAGE".equalsIgnoreCase(item.getEvidenceType()) ? "image/png" : "audio/wav");
                result.put("previewUrl", "data:" + mime + ";base64," + b64);
                result.put("base64Data", b64);
            }
            return result;
        } catch (Exception e) {
            throw new RuntimeException("Decryption failed: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public DecryptedCaseReport getDecryptedCaseForAuthority(CaseRecord caseRecord) {
        if (!caseRecord.isAccessGranted()) {
            throw new IllegalStateException("Access not granted for case: " + caseRecord.getCaseId());
        }

        PrivateKey authorityPrivKey = rsaKeyManager.getAuthorityPrivateKey();
        List<EvidenceItem> items = evidenceItemRepository.findByCaseRecordIdOrderByIdAsc(caseRecord.getId());
        List<DecryptedEvidenceDto> decryptedItems = new ArrayList<>();

        boolean wholeChainValid = true;
        int firstBrokenIndex = -1;
        Long firstBrokenId = null;

        String expectedPrevChain = HashChainService.GENESIS_HASH;

        for (int i = 0; i < items.size(); i++) {
            EvidenceItem item = items.get(i);
            boolean itemVerified = true;
            String status = "VERIFIED";
            String failureReason = null;
            byte[] decryptedData = null;
            String textPreview = null;

            try {
                // 1. Extract stego payload from LONGBLOB (or file fallback)
                byte[] wrappedKeyBytes = Base64.getDecoder().decode(item.getWrappedAesKey());
                byte[] extractedPackedPayload;
                if (item.getStegoImageData() != null && item.getStegoImageData().length > 0) {
                    extractedPackedPayload = stegoService.extractPayloadFromBytes(item.getStegoImageData(), wrappedKeyBytes);
                } else {
                    File stegoFile = new File(item.getStegoImagePath());
                    extractedPackedPayload = stegoService.extractPayloadFromFile(stegoFile, wrappedKeyBytes);
                }

                EncryptionService.EncryptedContainer container = encryptionService.unpackPayload(extractedPackedPayload);

                // 2. Unwrap AES key with RSA-4096 private key
                SecretKey aesKey = encryptionService.unwrapAesKey(container.wrappedKey, authorityPrivKey);

                // 3. Decrypt ciphertext
                decryptedData = encryptionService.decryptAesGcm(aesKey, container.iv, container.ciphertext);

                // 4. Recompute contentHash
                String recomputedContentHash = hashChainService.computeContentHash(decryptedData);
                if (!recomputedContentHash.equalsIgnoreCase(item.getContentHash())) {
                    itemVerified = false;
                    status = "TAMPERED";
                    failureReason = "Content hash mismatch (decrypted data has been altered)";
                }

                // 5. Verify prevChainHash linkage
                if (!item.getPrevChainHash().equalsIgnoreCase(expectedPrevChain)) {
                    itemVerified = false;
                    status = "TAMPERED";
                    failureReason = failureReason != null ? failureReason : "Broken chain linkage: prevChainHash does not match previous item";
                }

                // 6. Recompute chainHash
                String recomputedChainHash = hashChainService.computeChainHash(
                        item.getContentHash(),
                        item.getPrevChainHash(),
                        item.getCreatedAt(),
                        caseRecord.getCaseId(),
                        item.getVictimId()
                );
                if (!recomputedChainHash.equalsIgnoreCase(item.getChainHash())) {
                    itemVerified = false;
                    status = "TAMPERED";
                    failureReason = failureReason != null ? failureReason : "Chain hash mismatch: block integrity altered";
                }

                if ("TEXT".equalsIgnoreCase(item.getEvidenceType()) && decryptedData != null) {
                    textPreview = new String(decryptedData, StandardCharsets.UTF_8);
                } else if (decryptedData != null) {
                    textPreview = "[Binary " + item.getEvidenceType() + " payload: " + decryptedData.length + " bytes]";
                }

            } catch (Exception e) {
                itemVerified = false;
                status = "TAMPERED";
                failureReason = "Stego extraction or cryptographic decryption failed: " + e.getMessage();
            }

            if (!itemVerified && wholeChainValid) {
                wholeChainValid = false;
                firstBrokenIndex = i;
                firstBrokenId = item.getId();
            }

            expectedPrevChain = item.getChainHash();

            decryptedItems.add(new DecryptedEvidenceDto(
                    item.getId(),
                    i + 1,
                    item.getEvidenceType(),
                    encryptionService.decryptIdentity(item.getDescription()),
                    item.getSeverityTags(),
                    item.getTagScore(),
                    item.getOriginalFileName(),
                    item.getMimeType(),
                    item.getCreatedAt(),
                    item.getContentHash(),
                    item.getPrevChainHash(),
                    item.getChainHash(),
                    status,
                    itemVerified,
                    failureReason,
                    textPreview,
                    decryptedData != null ? Base64.getEncoder().encodeToString(decryptedData) : null
            ));
        }

        User victim = caseRecord.getVictim();
        String overallIntegrity = wholeChainValid ? "VERIFIED" : "TAMPERED";

        return new DecryptedCaseReport(
                caseRecord.getId(),
                caseRecord.getCaseId(),
                caseRecord.getTitle(),
                caseRecord.getStatus(),
                caseRecord.getSeverityScore(),
                caseRecord.getSeverityLevel(),
                caseRecord.getCreatedAt(),
                encryptionService.decryptIdentity(victim.getEncryptedName()),
                encryptionService.decryptIdentity(victim.getEncryptedPhone()),
                victim.getEmail(),
                encryptionService.decryptIdentity(victim.getGuardianName()),
                encryptionService.decryptIdentity(victim.getGuardianPhone()),
                overallIntegrity,
                wholeChainValid,
                firstBrokenIndex,
                firstBrokenId,
                decryptedItems
        );
    }

    public static class TimelineItemDto {
        public final Long id;
        public final int sequenceNumber;
        public final String evidenceType;
        public final String description;
        public final Set<SeverityTag> severityTags;
        public final int tagScore;
        public final Instant createdAt;
        public final String contentHashPrefix;
        public final String chainHashPrefix;
        public final String prevHashPrefix;
        public final String status;
        public final Integer payloadSizeBytes;
        public final Integer modifiedSlots;
        public final Integer imageWidth;
        public final Integer imageHeight;
        public final String stegoAlgorithm;

        public TimelineItemDto(Long id, int sequenceNumber, String evidenceType, String description,
                               Set<SeverityTag> severityTags, int tagScore, Instant createdAt,
                               String contentHashPrefix, String chainHashPrefix, String prevHashPrefix,
                               String status, Integer payloadSizeBytes, Integer modifiedSlots,
                               Integer imageWidth, Integer imageHeight, String stegoAlgorithm) {
            this.id = id;
            this.sequenceNumber = sequenceNumber;
            this.evidenceType = evidenceType;
            this.description = description;
            this.severityTags = severityTags;
            this.tagScore = tagScore;
            this.createdAt = createdAt;
            this.contentHashPrefix = contentHashPrefix;
            this.chainHashPrefix = chainHashPrefix;
            this.prevHashPrefix = prevHashPrefix;
            this.status = status;
            this.payloadSizeBytes = payloadSizeBytes;
            this.modifiedSlots = modifiedSlots;
            this.imageWidth = imageWidth;
            this.imageHeight = imageHeight;
            this.stegoAlgorithm = stegoAlgorithm;
        }

        // Backward-compatible constructor
        public TimelineItemDto(Long id, int sequenceNumber, String evidenceType, String description,
                               Set<SeverityTag> severityTags, int tagScore, Instant createdAt,
                               String contentHashPrefix, String chainHashPrefix, String prevHashPrefix, String status) {
            this(id, sequenceNumber, evidenceType, description, severityTags, tagScore, createdAt,
                 contentHashPrefix, chainHashPrefix, prevHashPrefix, status, null, null, null, null, "Hidden with key-seeded adaptive LSB");
        }
    }

    public static class DecryptedEvidenceDto {
        public final Long id;
        public final int sequenceNumber;
        public final String evidenceType;
        public final String description;
        public final Set<SeverityTag> severityTags;
        public final int tagScore;
        public final String originalFileName;
        public final String mimeType;
        public final Instant createdAt;
        public final String contentHash;
        public final String prevChainHash;
        public final String chainHash;
        public final String status; // VERIFIED or TAMPERED
        public final boolean verified;
        public final String failureReason;
        public final String textPreview;
        public final String dataBase64;

        public DecryptedEvidenceDto(Long id, int sequenceNumber, String evidenceType, String description,
                                    Set<SeverityTag> severityTags, int tagScore, String originalFileName,
                                    String mimeType, Instant createdAt, String contentHash, String prevChainHash,
                                    String chainHash, String status, boolean verified, String failureReason,
                                    String textPreview, String dataBase64) {
            this.id = id;
            this.sequenceNumber = sequenceNumber;
            this.evidenceType = evidenceType;
            this.description = description;
            this.severityTags = severityTags;
            this.tagScore = tagScore;
            this.originalFileName = originalFileName;
            this.mimeType = mimeType;
            this.createdAt = createdAt;
            this.contentHash = contentHash;
            this.prevChainHash = prevChainHash;
            this.chainHash = chainHash;
            this.status = status;
            this.verified = verified;
            this.failureReason = failureReason;
            this.textPreview = textPreview;
            this.dataBase64 = dataBase64;
        }
    }

    public static class DecryptedCaseReport {
        public final Long id;
        public final String caseId;
        public final String title;
        public final String status;
        public final int severityScore;
        public final SeverityLevel severityLevel;
        public final Instant createdAt;
        public final String victimName;
        public final String victimPhone;
        public final String victimEmail;
        public final String guardianName;
        public final String guardianPhone;
        public final String overallIntegrity;
        public final boolean chainValid;
        public final int firstBrokenIndex;
        public final Long firstBrokenId;
        public final List<DecryptedEvidenceDto> items;

        public DecryptedCaseReport(Long id, String caseId, String title, String status, int severityScore,
                                   SeverityLevel severityLevel, Instant createdAt, String victimName,
                                   String victimPhone, String victimEmail, String guardianName,
                                   String guardianPhone, String overallIntegrity, boolean chainValid,
                                   int firstBrokenIndex, Long firstBrokenId, List<DecryptedEvidenceDto> items) {
            this.id = id;
            this.caseId = caseId;
            this.title = title;
            this.status = status;
            this.severityScore = severityScore;
            this.severityLevel = severityLevel;
            this.createdAt = createdAt;
            this.victimName = victimName;
            this.victimPhone = victimPhone;
            this.victimEmail = victimEmail;
            this.guardianName = guardianName;
            this.guardianPhone = guardianPhone;
            this.overallIntegrity = overallIntegrity;
            this.chainValid = chainValid;
            this.firstBrokenIndex = firstBrokenIndex;
            this.firstBrokenId = firstBrokenId;
            this.items = items;
        }
    }
}
