package com.shadowvault.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "evidence_items")
public class EvidenceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    @JsonIgnore
    private CaseRecord caseRecord;

    @Column(nullable = false)
    private Long victimId;

    @Column(nullable = false)
    private String evidenceType; // TEXT, IMAGE, AUDIO

    @Column(columnDefinition = "MEDIUMTEXT")
    private String description;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "evidence_severity_tags", joinColumns = @JoinColumn(name = "evidence_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "severity_tag")
    private Set<SeverityTag> severityTags = new HashSet<>();

    @Column(nullable = false)
    private int tagScore = 0;

    private String originalFileName;
    private String mimeType;

    @Column(nullable = false, length = 500)
    private String stegoImagePath;

    @Lob
    @Column(name = "stego_image_data", columnDefinition = "LONGBLOB")
    private byte[] stegoImageData;

    @Column(name = "master_wrapped_aes_key", columnDefinition = "MEDIUMTEXT")
    private String masterWrappedAesKey;

    @Column(name = "payload_size_bytes")
    private Integer payloadSizeBytes;

    @Column(name = "modified_slots")
    private Integer modifiedSlots;

    @Column(name = "image_width")
    private Integer imageWidth;

    @Column(name = "image_height")
    private Integer imageHeight;

    @Column(name = "stego_algorithm")
    private String stegoAlgorithm;

    @Column(columnDefinition = "MEDIUMTEXT", nullable = false)
    private String wrappedAesKey; // Base64 encoded RSA-4096 wrapped AES key

    @Column(nullable = false)
    private String iv; // Base64 encoded AES-GCM IV

    @Column(nullable = false)
    private String contentHash; // SHA-256 hex of original evidence payload

    @Column(nullable = false)
    private String prevChainHash; // Previous chainHash hex or "GENESIS"

    @Column(nullable = false)
    private String chainHash; // SHA-256(contentHash + prevChainHash + timestamp + caseId + victimId)

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public EvidenceItem() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public CaseRecord getCaseRecord() {
        return caseRecord;
    }

    public void setCaseRecord(CaseRecord caseRecord) {
        this.caseRecord = caseRecord;
    }

    public Long getVictimId() {
        return victimId;
    }

    public void setVictimId(Long victimId) {
        this.victimId = victimId;
    }

    public String getEvidenceType() {
        return evidenceType;
    }

    public void setEvidenceType(String evidenceType) {
        this.evidenceType = evidenceType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Set<SeverityTag> getSeverityTags() {
        return severityTags;
    }

    public void setSeverityTags(Set<SeverityTag> severityTags) {
        this.severityTags = severityTags;
    }

    public int getTagScore() {
        return tagScore;
    }

    public void setTagScore(int tagScore) {
        this.tagScore = tagScore;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public void setOriginalFileName(String originalFileName) {
        this.originalFileName = originalFileName;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public String getStegoImagePath() {
        return stegoImagePath;
    }

    public void setStegoImagePath(String stegoImagePath) {
        this.stegoImagePath = stegoImagePath;
    }

    public String getWrappedAesKey() {
        return wrappedAesKey;
    }

    public void setWrappedAesKey(String wrappedAesKey) {
        this.wrappedAesKey = wrappedAesKey;
    }

    public String getIv() {
        return iv;
    }

    public void setIv(String iv) {
        this.iv = iv;
    }

    public String getContentHash() {
        return contentHash;
    }

    public void setContentHash(String contentHash) {
        this.contentHash = contentHash;
    }

    public String getPrevChainHash() {
        return prevChainHash;
    }

    public void setPrevChainHash(String prevChainHash) {
        this.prevChainHash = prevChainHash;
    }

    public String getChainHash() {
        return chainHash;
    }

    public void setChainHash(String chainHash) {
        this.chainHash = chainHash;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public byte[] getStegoImageData() {
        return stegoImageData;
    }

    public void setStegoImageData(byte[] stegoImageData) {
        this.stegoImageData = stegoImageData;
    }

    public String getMasterWrappedAesKey() {
        return masterWrappedAesKey;
    }

    public void setMasterWrappedAesKey(String masterWrappedAesKey) {
        this.masterWrappedAesKey = masterWrappedAesKey;
    }

    public Integer getPayloadSizeBytes() {
        return payloadSizeBytes;
    }

    public void setPayloadSizeBytes(Integer payloadSizeBytes) {
        this.payloadSizeBytes = payloadSizeBytes;
    }

    public Integer getModifiedSlots() {
        return modifiedSlots;
    }

    public void setModifiedSlots(Integer modifiedSlots) {
        this.modifiedSlots = modifiedSlots;
    }

    public Integer getImageWidth() {
        return imageWidth;
    }

    public void setImageWidth(Integer imageWidth) {
        this.imageWidth = imageWidth;
    }

    public Integer getImageHeight() {
        return imageHeight;
    }

    public void setImageHeight(Integer imageHeight) {
        this.imageHeight = imageHeight;
    }

    public String getStegoAlgorithm() {
        return stegoAlgorithm;
    }

    public void setStegoAlgorithm(String stegoAlgorithm) {
        this.stegoAlgorithm = stegoAlgorithm;
    }
}
