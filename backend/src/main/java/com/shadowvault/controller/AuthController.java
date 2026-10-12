package com.shadowvault.controller;

import com.shadowvault.model.User;
import com.shadowvault.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@jakarta.validation.Valid @RequestBody UserService.RegisterRequest request) {
        UserService.RegisterResponse res = userService.registerVictim(request);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Registration successful. Use the simulated OTP to complete sign in.",
                "simulatedOtp", res.simulatedOtp,
                "token", res.token,
                "user", Map.of(
                        "id", res.id,
                        "username", res.username,
                        "email", res.email,
                        "role", res.role
                )
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username") != null ? body.get("username") : body.get("email");
        String password = body.get("password");

        UserService.LoginResponse res = userService.login(username, password);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "token", res.token,
                "user", Map.of(
                        "id", res.id,
                        "username", res.username,
                        "email", res.email,
                        "role", res.role,
                        "unavailable", res.unavailable,
                        "guardianName", res.guardianName != null ? res.guardianName : "",
                        "guardianPhone", res.guardianPhone != null ? res.guardianPhone : ""
                )
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "role", user.getRole().name(),
                "unavailable", user.isUnavailable(),
                "guardianName", user.getGuardianName() != null ? user.getGuardianName() : "",
                "guardianPhone", user.getGuardianPhone() != null ? user.getGuardianPhone() : ""
        ));
    }

    @PostMapping("/toggle-availability")
    public ResponseEntity<?> toggleAvailability(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        boolean newStatus = userService.toggleAvailability(user.getId());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "unavailable", newStatus,
                "message", newStatus ? "Status updated: You are currently marked as unavailable." : "Status updated: You are currently marked as available."
        ));
    }
}
