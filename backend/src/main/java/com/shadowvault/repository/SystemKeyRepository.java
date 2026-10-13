package com.shadowvault.repository;

import com.shadowvault.model.SystemKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemKeyRepository extends JpaRepository<SystemKey, String> {
}
