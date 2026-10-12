package com.shadowvault.repository;

import com.shadowvault.model.AccessRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccessRequestRepository extends JpaRepository<AccessRequest, Long> {
    List<AccessRequest> findByCaseRecordVictimIdOrderByCreatedAtDesc(Long victimId);
    List<AccessRequest> findByCaseRecordIdOrderByCreatedAtDesc(Long caseRecordId);
    Optional<AccessRequest> findTopByCaseRecordIdAndStatusOrderByCreatedAtDesc(Long caseRecordId, String status);
    List<AccessRequest> findByStatusOrderByCreatedAtDesc(String status);
}
