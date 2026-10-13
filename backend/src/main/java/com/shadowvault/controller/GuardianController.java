package com.shadowvault.controller;

import com.shadowvault.model.AccessRequest;
import com.shadowvault.model.User;
import com.shadowvault.service.AccessRequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/guardian")
@PreAuthorize("hasAnyRole('GUARDIAN', 'ROLE_GUARDIAN')")
public class GuardianController {

    private final AccessRequestService accessRequestService;

    public GuardianController(AccessRequestService accessRequestService) {
        this.accessRequestService = accessRequestService;
    }

    @GetMapping("/requests")
    public ResponseEntity<?> getPendingRequests(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        List<AccessRequest> requests = accessRequestService.getPendingRequestsForGuardian(user);
        List<Map<String, Object>> result = new ArrayList<>();

        for (AccessRequest req : requests) {
            User victim = req.getCaseRecord().getVictim();
            long pendingSec = Duration.between(req.getCreatedAt(), Instant.now()).getSeconds();
            boolean canApprove = victim.isUnavailable() || pendingSec >= 120;
            long secondsRemaining = Math.max(0, 120 - pendingSec);

            result.add(Map.of(
                    "id", req.getId(),
                    "caseId", req.getCaseRecord().getCaseId(),
                    "requesterUsername", req.getRequester().getUsername(),
                    "reason", req.getReason() != null ? req.getReason() : "",
                    "createdAt", req.getCreatedAt(),
                    "status", req.getStatus(),
                    "victimUnavailable", victim.isUnavailable(),
                    "canApprove", canApprove,
                    "secondsRemaining", secondsRemaining
            ));
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/requests/{requestId}/respond")
    public ResponseEntity<?> respondToRequest(@AuthenticationPrincipal User user,
                                              @PathVariable Long requestId,
                                              @RequestBody Map<String, Boolean> body) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        boolean approve = Boolean.TRUE.equals(body.get("approve"));
        try {
            AccessRequest req = accessRequestService.respondByGuardian(requestId, user, approve);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "requestId", req.getId(),
                    "status", req.getStatus(),
                    "approvedBy", "GUARDIAN",
                    "accessGranted", req.getCaseRecord().isAccessGranted()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
