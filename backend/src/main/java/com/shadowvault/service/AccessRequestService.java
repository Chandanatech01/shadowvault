package com.shadowvault.service;

import com.shadowvault.model.AccessRequest;
import com.shadowvault.model.CaseRecord;
import com.shadowvault.model.User;
import com.shadowvault.repository.AccessRequestRepository;
import com.shadowvault.repository.CaseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class AccessRequestService {

    private final AccessRequestRepository accessRequestRepository;
    private final CaseRepository caseRepository;

    public AccessRequestService(AccessRequestRepository accessRequestRepository, CaseRepository caseRepository) {
        this.accessRequestRepository = accessRequestRepository;
        this.caseRepository = caseRepository;
    }

    @Transactional
    public AccessRequest requestAccess(Long caseRecordId, User authority, String reason) {
        CaseRecord caseRecord = caseRepository.findById(caseRecordId)
                .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseRecordId));

        if (caseRecord.isAccessGranted()) {
            throw new IllegalStateException("Access already granted for this case");
        }

        Optional<AccessRequest> pending = accessRequestRepository.findTopByCaseRecordIdAndStatusOrderByCreatedAtDesc(caseRecordId, "PENDING");
        if (pending.isPresent()) {
            return pending.get();
        }

        AccessRequest request = new AccessRequest(caseRecord, authority, reason != null ? reason : "Official investigation access request");
        return accessRequestRepository.save(request);
    }

    @Transactional
    public AccessRequest respondByVictim(Long requestId, User victim, boolean approve) {
        AccessRequest request = accessRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Access request not found: " + requestId));

        if (!request.getCaseRecord().getVictim().getId().equals(victim.getId())) {
            throw new IllegalArgumentException("You are not authorized to respond to this request");
        }

        if (!"PENDING".equalsIgnoreCase(request.getStatus())) {
            throw new IllegalStateException("Request is already " + request.getStatus());
        }

        request.setRespondedAt(Instant.now());
        if (approve) {
            request.setStatus("APPROVED");
            request.setApprovedByRole("VICTIM");
            request.setApprovedByUsername(victim.getUsername());

            CaseRecord caseRecord = request.getCaseRecord();
            caseRecord.setAccessGranted(true);
            caseRecord.setStatus("UNDER_REVIEW");
            caseRepository.save(caseRecord);
        } else {
            request.setStatus("REJECTED");
        }

        return accessRequestRepository.save(request);
    }

    @Transactional
    public boolean isGuardianLinkedToVictim(User guardian, User victim) {
        if (guardian == null || victim == null) {
            return false;
        }
        // 1. Linked by shared Guardian Invite Code
        if (guardian.getGuardianInviteCode() != null && victim.getGuardianInviteCode() != null
                && guardian.getGuardianInviteCode().equalsIgnoreCase(victim.getGuardianInviteCode())) {
            return true;
        }
        // 2. Linked by victim's designated guardian username
        if (victim.getGuardianUsername() != null
                && victim.getGuardianUsername().equalsIgnoreCase(guardian.getUsername())) {
            return true;
        }
        // 3. Linked by guardian's linked victim username
        if (guardian.getLinkedVictimUsername() != null
                && guardian.getLinkedVictimUsername().equalsIgnoreCase(victim.getUsername())) {
            return true;
        }
        return false;
    }

    @Transactional
    public AccessRequest respondByGuardian(Long requestId, User guardian, boolean approve) {
        AccessRequest request = accessRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Access request not found: " + requestId));

        CaseRecord caseRecord = request.getCaseRecord();
        User victim = caseRecord.getVictim();

        // Enforce real link: guardian must be linked to this victim
        if (!isGuardianLinkedToVictim(guardian, victim)) {
            throw new IllegalArgumentException("You are not registered as the guardian for this victim");
        }

        if (!"PENDING".equalsIgnoreCase(request.getStatus())) {
            throw new IllegalStateException("Request is already " + request.getStatus());
        }

        // Trust-based rule check: victim is unavailable OR request pending > 2 minutes
        boolean victimUnavailable = victim.isUnavailable();
        long pendingSeconds = Duration.between(request.getCreatedAt(), Instant.now()).getSeconds();
        boolean pendingOverTwoMinutes = pendingSeconds >= 120;

        if (!victimUnavailable && !pendingOverTwoMinutes) {
            long remainingSeconds = 120 - pendingSeconds;
            throw new IllegalStateException("Guardian cannot override while victim is available. Time remaining before escalation: " + remainingSeconds + "s");
        }

        request.setRespondedAt(Instant.now());
        if (approve) {
            request.setStatus("APPROVED");
            request.setApprovedByRole("GUARDIAN");
            request.setApprovedByUsername(guardian.getUsername());

            caseRecord.setAccessGranted(true);
            caseRecord.setStatus("UNDER_REVIEW");
            caseRepository.save(caseRecord);
        } else {
            request.setStatus("REJECTED");
        }

        return accessRequestRepository.save(request);
    }

    public List<AccessRequest> getRequestsForVictim(Long victimId) {
        return accessRequestRepository.findByCaseRecordVictimIdOrderByCreatedAtDesc(victimId);
    }

    public List<AccessRequest> getPendingRequestsForGuardian(User guardian) {
        if (guardian == null) {
            return List.of();
        }
        return accessRequestRepository.findByStatusOrderByCreatedAtDesc("PENDING").stream()
                .filter(req -> isGuardianLinkedToVictim(guardian, req.getCaseRecord().getVictim()))
                .toList();
    }

    public List<AccessRequest> getPendingRequestsForGuardian(String guardianUsername) {
        if (guardianUsername == null || guardianUsername.trim().isEmpty()) {
            return List.of();
        }
        return accessRequestRepository.findByStatusOrderByCreatedAtDesc("PENDING").stream()
                .filter(req -> guardianUsername.equalsIgnoreCase(req.getCaseRecord().getVictim().getGuardianUsername()))
                .toList();
    }
}
