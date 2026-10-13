package com.shadowvault.repository;

import com.shadowvault.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    List<User> findByGuardianUsername(String guardianUsername);
    Optional<User> findByGuardianInviteCode(String guardianInviteCode);
    boolean existsByGuardianInviteCode(String guardianInviteCode);
    Optional<User> findByGuardianInviteCodeAndRole(String guardianInviteCode, com.shadowvault.model.Role role);
    boolean existsByGuardianInviteCodeAndRole(String guardianInviteCode, com.shadowvault.model.Role role);
}
