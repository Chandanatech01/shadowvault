package com.shadowvault.controller;

import com.shadowvault.model.*;
import com.shadowvault.repository.AccessRequestRepository;
import com.shadowvault.repository.CaseRepository;
import com.shadowvault.repository.EvidenceItemRepository;
import com.shadowvault.service.AccessRequestService;
import com.shadowvault.service.CaseService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.*;

@RestController
@RequestMapping("/api/cases")
public class CaseController {

    private final CaseService caseService;
    private final AccessRequestService accessRequestService;
    private final CaseRepository caseRepository;
    private final AccessRequestRepository accessRequestRepository;
    private final EvidenceItemRepository evidenceItemRepository;
    private final PasswordEncoder passwordEncoder;

    public CaseController(CaseService caseService,
                          AccessRequestService accessRequestService,
                          CaseRepository caseRepository,
                          AccessRequestRepository accessRequestRepository,
                          EvidenceItemRepository evidenceItemRepository,
                          PasswordEncoder passwordEncoder) {
        this.caseService = caseService;
        this.accessRequestService = accessRequestService;
        this.caseRepository = caseRepository;
        this.accessRequestRepository = accessRequestRepository;
        this.evidenceItemRepository = evidenceItemRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('VICTIM', 'ROLE_VICTIM')")
    public ResponseEntity<?> getMyCase(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        CaseRecord caseRecord = caseService.getOrCreateActiveCase(user);
        List<CaseService.TimelineItemDto> timeline = caseService.getCaseTimeline(caseRecord);
        List<AccessRequest> requests = accessRequestRepository.findByCaseRecordVictimIdOrderByCreatedAtDesc(user.getId());

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", caseRecord.getId());
        map.put("caseId", caseRecord.getCaseId());
        map.put("title", caseRecord.getTitle());
        map.put("status", caseRecord.getStatus());
        map.put("severityScore", caseRecord.getSeverityScore());
        map.put("severityLevel", caseRecord.getSeverityLevel());
        map.put("accessGranted", caseRecord.isAccessGranted());
        map.put("createdAt", caseRecord.getCreatedAt());
        map.put("unavailable", user.isUnavailable());
        map.put("timeline", timeline);
        map.put("requests", requests.stream().map(req -> Map.of(
                "id", req.getId(),
                "requesterUsername", req.getRequester().getUsername(),
                "reason", req.getReason() != null ? req.getReason() : "",
                "status", req.getStatus(),
                "createdAt", req.getCreatedAt(),
                "approvedByRole", req.getApprovedByRole() != null ? req.getApprovedByRole() : ""
        )).toList());

        return ResponseEntity.ok(map);
    }

    @PostMapping("/evidence")
    @PreAuthorize("hasAnyRole('VICTIM', 'ROLE_VICTIM')")
    public ResponseEntity<?> uploadEvidence(@AuthenticationPrincipal User user,
                                            @RequestParam("type") String type,
                                            @RequestParam(value = "description", required = false) String description,
                                            @RequestParam(value = "tags", required = false) String tagsStr,
                                            @RequestParam(value = "file", required = false) MultipartFile file,
                                            @RequestParam(value = "text", required = false) String text) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        try {
            CaseRecord caseRecord = caseService.getOrCreateActiveCase(user);

            byte[] rawBytes;
            String fileName = "evidence.txt";
            String mimeType = "text/plain";

            if (file != null && !file.isEmpty()) {
                rawBytes = file.getBytes();
                fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload.bin";
                mimeType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
            } else if (text != null && !text.trim().isEmpty()) {
                rawBytes = text.getBytes(StandardCharsets.UTF_8);
                fileName = "statement.txt";
                mimeType = "text/plain";
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Please provide a file or text content"));
            }

            Set<SeverityTag> tagSet = new HashSet<>();
            if (tagsStr != null && !tagsStr.trim().isEmpty()) {
                String[] parts = tagsStr.split(",");
                for (String part : parts) {
                    try {
                        tagSet.add(SeverityTag.valueOf(part.trim().toUpperCase()));
                    } catch (Exception ignored) {}
                }
            }

            EvidenceItem item = caseService.uploadEvidence(
                    caseRecord,
                    user,
                    type.toUpperCase(),
                    description,
                    tagSet,
                    rawBytes,
                    fileName,
                    mimeType
            );

            int sequenceNumber = evidenceItemRepository.findByCaseRecordIdOrderByIdAsc(caseRecord.getId()).size();
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("success", true);
            resp.put("id", item.getId());
            resp.put("evidenceId", item.getId());
            resp.put("caseId", caseRecord.getCaseId());
            resp.put("sequenceNumber", sequenceNumber);
            resp.put("contentHash", item.getContentHash());
            resp.put("chainHash", item.getChainHash());
            resp.put("prevChainHash", item.getPrevChainHash());
            resp.put("tagScore", item.getTagScore());
            resp.put("caseSeverityScore", caseRecord.getSeverityScore());
            resp.put("caseSeverityLevel", caseRecord.getSeverityLevel());
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to upload evidence: " + e.getMessage()));
        }
    }

    @GetMapping("/evidence/{id}/stego")
    public ResponseEntity<?> downloadStegoImage(@PathVariable Long id, @AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(404).build();
        }
        Optional<EvidenceItem> itemOpt = evidenceItemRepository.findById(id);
        if (itemOpt.isEmpty()) {
            return ResponseEntity.status(404).build();
        }
        EvidenceItem item = itemOpt.get();
        if (!item.getVictimId().equals(user.getId())) {
            return ResponseEntity.status(404).build();
        }

        byte[] pngBytes = item.getStegoImageData();
        if (pngBytes == null || pngBytes.length == 0) {
            if (item.getStegoImagePath() != null) {
                try {
                    pngBytes = Files.readAllBytes(new File(item.getStegoImagePath()).toPath());
                } catch (Exception ignored) {}
            }
        }
        if (pngBytes == null || pngBytes.length == 0) {
            return ResponseEntity.status(404).build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"photo_" + id + ".png\"")
                .body(pngBytes);
    }

    public static class DecryptEvidenceRequest {
        private String password;
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    @PostMapping("/evidence/{id}/decrypt")
    public ResponseEntity<?> decryptEvidenceItem(@PathVariable Long id,
                                                 @RequestBody DecryptEvidenceRequest request,
                                                 @AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Not found"));
        }
        Optional<EvidenceItem> itemOpt = evidenceItemRepository.findById(id);
        if (itemOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Evidence item not found"));
        }
        EvidenceItem item = itemOpt.get();
        if (!item.getVictimId().equals(user.getId())) {
            return ResponseEntity.status(404).body(Map.of("error", "Not found"));
        }

        if (request == null || request.getPassword() == null ||
            !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid password"));
        }

        try {
            Map<String, Object> decrypted = caseService.decryptEvidenceForVictim(item);
            return ResponseEntity.ok(decrypted);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Decryption failed: " + e.getMessage()));
        }
    }

    @PostMapping("/requests/{requestId}/respond")
    @PreAuthorize("hasAnyRole('VICTIM', 'ROLE_VICTIM')")
    public ResponseEntity<?> respondToRequest(@AuthenticationPrincipal User user,
                                              @PathVariable Long requestId,
                                              @RequestBody Map<String, Boolean> body) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        boolean approve = Boolean.TRUE.equals(body.get("approve"));
        try {
            AccessRequest req = accessRequestService.respondByVictim(requestId, user, approve);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "id", req.getId(),
                    "requestId", req.getId(),
                    "status", req.getStatus(),
                    "accessGranted", req.getCaseRecord().isAccessGranted()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
