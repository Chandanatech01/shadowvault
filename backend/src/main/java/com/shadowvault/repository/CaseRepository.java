package com.shadowvault.repository;

import com.shadowvault.model.CaseRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CaseRepository extends JpaRepository<CaseRecord, Long> {
    Optional<CaseRecord> findByCaseId(String caseId);
    List<CaseRecord> findByVictimIdOrderByCreatedAtDesc(Long victimId);
    List<CaseRecord> findAllByOrderBySeverityScoreDesc();
}
