package com.shadowvault.service;

import com.shadowvault.config.JwtTokenProvider;
import com.shadowvault.model.Role;
import com.shadowvault.model.User;
import com.shadowvault.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EncryptionService encryptionService;
    private final JwtTokenProvider tokenProvider;
    private final SecureRandom secureRandom = new SecureRandom();

    @org.springframework.beans.factory.annotation.Value("${shadowvault.authority.access-code:AUTH-2026}")
    private String authorityAccessCode;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       EncryptionService encryptionService,
                       JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.encryptionService = encryptionService;
        this.tokenProvider = tokenProvider;
    }

    @PostConstruct
    public void seedDemoUsers() {
        // Idempotently seed or update victim1
        userRepository.findByUsername("victim1").ifPresentOrElse(victim -> {
            victim.setPassword(passwordEncoder.encode("demo123"));
            victim.setEncryptedName(encryptionService.encryptIdentity("Priya Sharma"));
            victim.setEncryptedPhone(encryptionService.encryptIdentity("+91 98765 43210"));
            victim.setGuardianName(encryptionService.encryptIdentity("Anita Sharma"));
            victim.setGuardianPhone(encryptionService.encryptIdentity("+91 98765 43211"));
            victim.setGuardianUsername("guardian1");
            victim.setGuardianInviteCode("DEMO-GRD-2026");
            userRepository.save(victim);
        }, () -> {
            User victim = new User("victim1", "victim1@shadowvault.local", passwordEncoder.encode("demo123"), Role.ROLE_VICTIM);
            victim.setEncryptedName(encryptionService.encryptIdentity("Priya Sharma"));
            victim.setEncryptedPhone(encryptionService.encryptIdentity("+91 98765 43210"));
            victim.setGuardianName(encryptionService.encryptIdentity("Anita Sharma"));
            victim.setGuardianPhone(encryptionService.encryptIdentity("+91 98765 43211"));
            victim.setGuardianUsername("guardian1");
            victim.setGuardianInviteCode("DEMO-GRD-2026");
            victim.setUnavailable(false);
            userRepository.save(victim);
        });

        // Idempotently seed or update authority1
        userRepository.findByUsername("authority1").ifPresentOrElse(authority -> {
            authority.setPassword(passwordEncoder.encode("demo123"));
            authority.setEncryptedName(encryptionService.encryptIdentity("Inspector Rajesh Verma"));
            authority.setEncryptedPhone(encryptionService.encryptIdentity("+91 98111 22334"));
            authority.setDepartment("Cyber Crime Division");
            userRepository.save(authority);
        }, () -> {
            User authority = new User("authority1", "authority1@shadowvault.gov.in", passwordEncoder.encode("demo123"), Role.ROLE_AUTHORITY);
            authority.setEncryptedName(encryptionService.encryptIdentity("Inspector Rajesh Verma"));
            authority.setEncryptedPhone(encryptionService.encryptIdentity("+91 98111 22334"));
            authority.setDepartment("Cyber Crime Division");
            userRepository.save(authority);
        });

        // Idempotently seed or update guardian1
        userRepository.findByUsername("guardian1").ifPresentOrElse(guardian -> {
            guardian.setPassword(passwordEncoder.encode("demo123"));
            guardian.setEncryptedName(encryptionService.encryptIdentity("Anita Sharma"));
            guardian.setEncryptedPhone(encryptionService.encryptIdentity("+91 98765 43211"));
            guardian.setGuardianInviteCode("DEMO-GRD-2026");
            guardian.setLinkedVictimUsername("victim1");
            userRepository.save(guardian);
        }, () -> {
            User guardian = new User("guardian1", "guardian1@shadowvault.local", passwordEncoder.encode("demo123"), Role.ROLE_GUARDIAN);
            guardian.setEncryptedName(encryptionService.encryptIdentity("Anita Sharma"));
            guardian.setEncryptedPhone(encryptionService.encryptIdentity("+91 98765 43211"));
            guardian.setGuardianInviteCode("DEMO-GRD-2026");
            guardian.setLinkedVictimUsername("victim1");
            userRepository.save(guardian);
        });
    }

    public RegisterResponse registerVictim(RegisterRequest req) {
        if (req != null && req.role == null) {
            req.role = "ROLE_VICTIM";
        }
        return register(req);
    }

    public RegisterResponse register(RegisterRequest req) {
        if (req == null) {
            throw new IllegalArgumentException("Registration data is required");
        }
        if (req.username == null || req.username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (req.username.trim().length() < 3) {
            throw new IllegalArgumentException("Username must be at least 3 characters");
        }
        if (userRepository.existsByUsername(req.username.trim())) {
            throw new IllegalArgumentException("Username is already taken");
        }
        if (req.email == null || req.email.trim().isEmpty() || !req.email.contains("@")) {
            throw new IllegalArgumentException("A valid email is required");
        }
        if (userRepository.existsByEmail(req.email.trim())) {
            throw new IllegalArgumentException("Email is already registered");
        }
        if (req.password == null || req.password.trim().length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long");
        }
        if (req.fullName == null || req.fullName.trim().isEmpty()) {
            throw new IllegalArgumentException("Full name is required");
        }

        String roleStr = req.role != null ? req.role.trim().toUpperCase() : "VICTIM";
        if (roleStr.startsWith("ROLE_")) {
            roleStr = roleStr.substring(5);
        }

        if ("VICTIM".equals(roleStr)) {
            if (req.phone == null || req.phone.trim().isEmpty()) {
                throw new IllegalArgumentException("Phone number is required");
            }

            User user = new User(req.username.trim(), req.email.trim(), passwordEncoder.encode(req.password.trim()), Role.ROLE_VICTIM);
            user.setEncryptedName(encryptionService.encryptIdentity(req.fullName.trim()));
            user.setEncryptedPhone(encryptionService.encryptIdentity(req.phone.trim()));
            if (req.guardianName != null && !req.guardianName.trim().isEmpty()) {
                user.setGuardianName(encryptionService.encryptIdentity(req.guardianName.trim()));
            }
            if (req.guardianPhone != null && !req.guardianPhone.trim().isEmpty()) {
                user.setGuardianPhone(encryptionService.encryptIdentity(req.guardianPhone.trim()));
            }
            if (req.guardianUsername != null && !req.guardianUsername.trim().isEmpty()) {
                user.setGuardianUsername(req.guardianUsername.trim());
            }

            String inviteCode = generateGuardianInviteCode();
            user.setGuardianInviteCode(inviteCode);
            user.setUnavailable(false);
            userRepository.save(user);

            String simulatedOtp = String.format("%06d", secureRandom.nextInt(1_000_000));
            String token = tokenProvider.generateToken(user.getUsername(), user.getRole().name());

            return new RegisterResponse(
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    user.getRole().name(),
                    simulatedOtp,
                    inviteCode,
                    null,
                    null,
                    token,
                    "Registration successful. Use the simulated OTP to complete sign in and share your Guardian Invite Code with your trusted guardian."
            );
        } else if ("GUARDIAN".equals(roleStr)) {
            if (req.phone == null || req.phone.trim().isEmpty()) {
                throw new IllegalArgumentException("Phone number is required");
            }
            if (req.guardianInviteCode == null || req.guardianInviteCode.trim().isEmpty()) {
                throw new IllegalArgumentException("Victim's Guardian Invite Code is required");
            }

            User victim = userRepository.findByGuardianInviteCodeAndRole(req.guardianInviteCode.trim(), Role.ROLE_VICTIM)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid guardian invite code. No victim found with this code."));
            if (victim.getRole() != Role.ROLE_VICTIM) {
                throw new IllegalArgumentException("Invalid guardian invite code. The designated user is not a victim.");
            }

            User guardian = new User(req.username.trim(), req.email.trim(), passwordEncoder.encode(req.password.trim()), Role.ROLE_GUARDIAN);
            guardian.setEncryptedName(encryptionService.encryptIdentity(req.fullName.trim()));
            guardian.setEncryptedPhone(encryptionService.encryptIdentity(req.phone.trim()));
            guardian.setGuardianInviteCode(req.guardianInviteCode.trim());
            guardian.setLinkedVictimUsername(victim.getUsername());
            userRepository.save(guardian);

            // Link victim to guardian
            victim.setGuardianUsername(guardian.getUsername());
            victim.setGuardianName(encryptionService.encryptIdentity(req.fullName.trim()));
            victim.setGuardianPhone(encryptionService.encryptIdentity(req.phone.trim()));
            userRepository.save(victim);

            String token = tokenProvider.generateToken(guardian.getUsername(), guardian.getRole().name());

            return new RegisterResponse(
                    guardian.getId(),
                    guardian.getUsername(),
                    guardian.getEmail(),
                    guardian.getRole().name(),
                    null,
                    req.guardianInviteCode.trim(),
                    victim.getUsername(),
                    null,
                    token,
                    "Guardian registered and successfully linked to victim."
            );
        } else if ("AUTHORITY".equals(roleStr)) {
            if (req.department == null || req.department.trim().isEmpty()) {
                throw new IllegalArgumentException("Department is required");
            }
            if (req.authorityAccessCode == null || req.authorityAccessCode.trim().isEmpty()) {
                throw new IllegalArgumentException("Authority access code is required");
            }

            String expectedCode = (authorityAccessCode != null && !authorityAccessCode.trim().isEmpty())
                    ? authorityAccessCode.trim() : "AUTH-2026";
            if (!expectedCode.equals(req.authorityAccessCode.trim())) {
                throw new IllegalArgumentException("Invalid authority access code. Authorization rejected.");
            }

            User authority = new User(req.username.trim(), req.email.trim(), passwordEncoder.encode(req.password.trim()), Role.ROLE_AUTHORITY);
            authority.setEncryptedName(encryptionService.encryptIdentity(req.fullName.trim()));
            if (req.phone != null && !req.phone.trim().isEmpty()) {
                authority.setEncryptedPhone(encryptionService.encryptIdentity(req.phone.trim()));
            }
            authority.setDepartment(req.department.trim());
            userRepository.save(authority);

            String token = tokenProvider.generateToken(authority.getUsername(), authority.getRole().name());

            return new RegisterResponse(
                    authority.getId(),
                    authority.getUsername(),
                    authority.getEmail(),
                    authority.getRole().name(),
                    null,
                    null,
                    null,
                    authority.getDepartment(),
                    token,
                    "Authority account registered successfully."
            );
        } else {
            throw new IllegalArgumentException("Unknown role: " + req.role + ". Valid roles are Victim, Guardian, Authority.");
        }
    }

    private String generateGuardianInviteCode() {
        final String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        for (int attempts = 0; attempts < 30; attempts++) {
            StringBuilder sb = new StringBuilder("GRD-");
            for (int i = 0; i < 6; i++) {
                sb.append(chars.charAt(secureRandom.nextInt(chars.length())));
            }
            String code = sb.toString();
            if (!userRepository.existsByGuardianInviteCodeAndRole(code, Role.ROLE_VICTIM)) {
                return code;
            }
        }
        return "GRD-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    public LoginResponse login(String usernameOrEmail, String password) {
        if (usernameOrEmail == null || usernameOrEmail.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Username and password are required");
        }

        Optional<User> userOpt = userRepository.findByUsername(usernameOrEmail);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(usernameOrEmail);
        }

        if (userOpt.isEmpty() || !passwordEncoder.matches(password, userOpt.get().getPassword())) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        User user = userOpt.get();
        String token = tokenProvider.generateToken(user.getUsername(), user.getRole().name());

        return new LoginResponse(
                token,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                user.isUnavailable(),
                user.getGuardianName() != null ? encryptionService.decryptIdentity(user.getGuardianName()) : null,
                user.getGuardianPhone() != null ? encryptionService.decryptIdentity(user.getGuardianPhone()) : null,
                user.getGuardianInviteCode(),
                user.getLinkedVictimUsername(),
                user.getDepartment()
        );
    }

    public boolean toggleAvailability(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setUnavailable(!user.isUnavailable());
        userRepository.save(user);
        return user.isUnavailable();
    }

    public static class RegisterRequest {
        public String role;

        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
        public String username;

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        public String email;

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        public String password;

        @NotBlank(message = "Full name is required")
        public String fullName;

        public String phone;

        public String guardianName;
        public String guardianPhone;
        public String guardianUsername;
        public String guardianInviteCode;
        public String department;
        public String authorityAccessCode;
    }

    public static class LoginRequest {
        @NotBlank(message = "Username or email is required")
        public String username;

        public String email;

        @NotBlank(message = "Password is required")
        public String password;
    }

    public static class RegisterResponse {
        public final Long id;
        public final String username;
        public final String email;
        public final String role;
        public final String simulatedOtp;
        public final String guardianInviteCode;
        public final String linkedVictim;
        public final String department;
        public final String token;
        public final String message;

        public RegisterResponse(Long id, String username, String email, String role,
                                String simulatedOtp, String guardianInviteCode,
                                String linkedVictim, String department,
                                String token, String message) {
            this.id = id;
            this.username = username;
            this.email = email;
            this.role = role;
            this.simulatedOtp = simulatedOtp;
            this.guardianInviteCode = guardianInviteCode;
            this.linkedVictim = linkedVictim;
            this.department = department;
            this.token = token;
            this.message = message;
        }

        public RegisterResponse(Long id, String username, String email, String role, String simulatedOtp, String token) {
            this(id, username, email, role, simulatedOtp, null, null, null, token, "Registration successful");
        }
    }

    public static class LoginResponse {
        public final String token;
        public final Long id;
        public final String username;
        public final String email;
        public final String role;
        public final boolean unavailable;
        public final String guardianName;
        public final String guardianPhone;
        public final String guardianInviteCode;
        public final String linkedVictim;
        public final String department;

        public LoginResponse(String token, Long id, String username, String email, String role,
                             boolean unavailable, String guardianName, String guardianPhone,
                             String guardianInviteCode, String linkedVictim, String department) {
            this.token = token;
            this.id = id;
            this.username = username;
            this.email = email;
            this.role = role;
            this.unavailable = unavailable;
            this.guardianName = guardianName;
            this.guardianPhone = guardianPhone;
            this.guardianInviteCode = guardianInviteCode;
            this.linkedVictim = linkedVictim;
            this.department = department;
        }

        public LoginResponse(String token, Long id, String username, String email, String role, boolean unavailable, String guardianName, String guardianPhone) {
            this(token, id, username, email, role, unavailable, guardianName, guardianPhone, null, null, null);
        }
    }
}
