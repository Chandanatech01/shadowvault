package com.shadowvault.controller;

import com.shadowvault.model.AccessRequest;
import com.shadowvault.model.CaseRecord;
import com.shadowvault.model.User;
import com.shadowvault.repository.AccessRequestRepository;
import com.shadowvault.repository.CaseRepository;
import com.shadowvault.service.AccessRequestService;
import com.shadowvault.service.CaseService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/authority")
@PreAuthorize("hasAnyRole('AUTHORITY', 'ROLE_AUTHORITY')")
public class AuthorityController {

    private final CaseRepository caseRepository;
    private final AccessRequestRepository accessRequestRepository;
    private final AccessRequestService accessRequestService;
    private final CaseService caseService;

    public AuthorityController(CaseRepository caseRepository,
                               AccessRequestRepository accessRequestRepository,
                               AccessRequestService accessRequestService,
                               CaseService caseService) {
        this.caseRepository = caseRepository;
        this.accessRequestRepository = accessRequestRepository;
        this.accessRequestService = accessRequestService;
        this.caseService = caseService;
    }

    @GetMapping("/cases")
    public ResponseEntity<?> getAllCases(@AuthenticationPrincipal User user) {
        List<CaseRecord> cases = caseRepository.findAllByOrderBySeverityScoreDesc();
        List<Map<String, Object>> response = new ArrayList<>();

        for (CaseRecord c : cases) {
            Optional<AccessRequest> latestReq = accessRequestRepository.findTopByCaseRecordIdAndStatusOrderByCreatedAtDesc(c.getId(), "PENDING");
            String reqStatus = "NONE";
            Long reqId = null;
            if (c.isAccessGranted()) {
                reqStatus = "APPROVED";
            } else if (latestReq.isPresent()) {
                reqStatus = "PENDING";
                reqId = latestReq.get().getId();
            }

            // Strictly anonymous at this stage: NO victim identity or raw evidence shown
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", c.getId());
            map.put("caseId", c.getCaseId());
            map.put("evidenceCount", c.getEvidenceItems().size());
            map.put("severityScore", c.getSeverityScore());
            map.put("severityLevel", c.getSeverityLevel());
            map.put("status", c.getStatus());
            map.put("accessGranted", c.isAccessGranted());
            map.put("requestStatus", reqStatus);
            map.put("requestId", reqId != null ? reqId : 0L);
            map.put("createdAt", c.getCreatedAt());
            map.put("updatedAt", c.getUpdatedAt() != null ? c.getUpdatedAt() : c.getCreatedAt());
            response.add(map);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/cases/{caseId}/request-access")
    public ResponseEntity<?> requestAccess(@AuthenticationPrincipal User user,
                                           @PathVariable String caseId,
                                           @RequestBody(required = false) Map<String, String> body) {
        CaseRecord caseRecord = caseRepository.findByCaseId(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));

        String reason = body != null ? body.get("reason") : "Official investigation access request";
        try {
            AccessRequest req = accessRequestService.requestAccess(caseRecord.getId(), user, reason);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "id", req.getId(),
                    "requestId", req.getId(),
                    "status", req.getStatus(),
                    "message", "Access request submitted. Awaiting victim or guardian approval."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/cases/{caseId}/evidence")
    public ResponseEntity<?> getViewEvidence(@AuthenticationPrincipal User user,
                                             @PathVariable String caseId) {
        CaseRecord caseRecord = caseRepository.findByCaseId(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));

        if (!caseRecord.isAccessGranted()) {
            return ResponseEntity.status(403).body(Map.of(
                    "error", "Access not granted for this case. Evidence remains encrypted."
            ));
        }

        try {
            CaseService.DecryptedCaseReport report = caseService.getDecryptedCaseForAuthority(caseRecord);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "Failed to decrypt and verify evidence: " + e.getMessage()
            ));
        }
    }
}
