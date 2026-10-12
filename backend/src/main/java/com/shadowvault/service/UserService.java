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
            userRepository.save(victim);
        }, () -> {
            User victim = new User("victim1", "victim1@shadowvault.local", passwordEncoder.encode("demo123"), Role.ROLE_VICTIM);
            victim.setEncryptedName(encryptionService.encryptIdentity("Priya Sharma"));
            victim.setEncryptedPhone(encryptionService.encryptIdentity("+91 98765 43210"));
            victim.setGuardianName(encryptionService.encryptIdentity("Anita Sharma"));
            victim.setGuardianPhone(encryptionService.encryptIdentity("+91 98765 43211"));
            victim.setGuardianUsername("guardian1");
            victim.setUnavailable(false);
            userRepository.save(victim);
        });

        // Idempotently seed or update authority1
        userRepository.findByUsername("authority1").ifPresentOrElse(authority -> {
            authority.setPassword(passwordEncoder.encode("demo123"));
            authority.setEncryptedName(encryptionService.encryptIdentity("Inspector Rajesh Verma"));
            authority.setEncryptedPhone(encryptionService.encryptIdentity("+91 98111 22334"));
            userRepository.save(authority);
        }, () -> {
            User authority = new User("authority1", "authority1@shadowvault.gov.in", passwordEncoder.encode("demo123"), Role.ROLE_AUTHORITY);
            authority.setEncryptedName(encryptionService.encryptIdentity("Inspector Rajesh Verma"));
            authority.setEncryptedPhone(encryptionService.encryptIdentity("+91 98111 22334"));
            userRepository.save(authority);
        });

        // Idempotently seed or update guardian1
        userRepository.findByUsername("guardian1").ifPresentOrElse(guardian -> {
            guardian.setPassword(passwordEncoder.encode("demo123"));
            guardian.setEncryptedName(encryptionService.encryptIdentity("Anita Sharma"));
            guardian.setEncryptedPhone(encryptionService.encryptIdentity("+91 98765 43211"));
            userRepository.save(guardian);
        }, () -> {
            User guardian = new User("guardian1", "guardian1@shadowvault.local", passwordEncoder.encode("demo123"), Role.ROLE_GUARDIAN);
            guardian.setEncryptedName(encryptionService.encryptIdentity("Anita Sharma"));
            guardian.setEncryptedPhone(encryptionService.encryptIdentity("+91 98765 43211"));
            userRepository.save(guardian);
        });
    }

    public RegisterResponse registerVictim(RegisterRequest req) {
        if (userRepository.existsByUsername(req.username)) {
            throw new IllegalArgumentException("Username is already taken");
        }
        if (userRepository.existsByEmail(req.email)) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User user = new User(req.username, req.email, passwordEncoder.encode(req.password), Role.ROLE_VICTIM);
        user.setEncryptedName(encryptionService.encryptIdentity(req.fullName));
        user.setEncryptedPhone(encryptionService.encryptIdentity(req.phone));
        user.setGuardianName(encryptionService.encryptIdentity(req.guardianName));
        user.setGuardianPhone(encryptionService.encryptIdentity(req.guardianPhone));
        user.setGuardianUsername(req.guardianUsername != null && !req.guardianUsername.isEmpty() ? req.guardianUsername : "guardian1");
        user.setUnavailable(false);

        userRepository.save(user);

        // Generate simulated 6-digit OTP
        String simulatedOtp = String.format("%06d", secureRandom.nextInt(1_000_000));
        String token = tokenProvider.generateToken(user.getUsername(), user.getRole().name());

        return new RegisterResponse(user.getId(), user.getUsername(), user.getEmail(), user.getRole().name(), simulatedOtp, token);
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
                encryptionService.decryptIdentity(user.getGuardianName()),
                encryptionService.decryptIdentity(user.getGuardianPhone())
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
        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
        public String username;

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        public String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        public String password;

        @NotBlank(message = "Full name is required")
        public String fullName;

        @NotBlank(message = "Phone number is required")
        public String phone;

        public String guardianName;
        public String guardianPhone;
        public String guardianUsername;
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
        public final String token;

        public RegisterResponse(Long id, String username, String email, String role, String simulatedOtp, String token) {
            this.id = id;
            this.username = username;
            this.email = email;
            this.role = role;
            this.simulatedOtp = simulatedOtp;
            this.token = token;
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

        public LoginResponse(String token, Long id, String username, String email, String role, boolean unavailable, String guardianName, String guardianPhone) {
            this.token = token;
            this.id = id;
            this.username = username;
            this.email = email;
            this.role = role;
            this.unavailable = unavailable;
            this.guardianName = guardianName;
            this.guardianPhone = guardianPhone;
        }
    }
}
