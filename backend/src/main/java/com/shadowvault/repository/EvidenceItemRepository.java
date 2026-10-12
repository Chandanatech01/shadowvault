package com.shadowvault.repository;

import com.shadowvault.model.EvidenceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EvidenceItemRepository extends JpaRepository<EvidenceItem, Long> {
    List<EvidenceItem> findByCaseRecordIdOrderByIdAsc(Long caseRecordId);
    Optional<EvidenceItem> findTopByCaseRecordIdOrderByIdDesc(Long caseRecordId);
}
