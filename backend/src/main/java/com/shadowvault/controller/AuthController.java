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
        UserService.RegisterResponse res = userService.register(request);

        Map<String, Object> userMap = new java.util.LinkedHashMap<>();
        userMap.put("id", res.id);
        userMap.put("username", res.username);
        userMap.put("email", res.email);
        userMap.put("role", res.role);
        if (res.department != null) userMap.put("department", res.department);
        if (res.guardianInviteCode != null) userMap.put("guardianInviteCode", res.guardianInviteCode);
        if (res.linkedVictim != null) userMap.put("linkedVictim", res.linkedVictim);

        Map<String, Object> resp = new java.util.LinkedHashMap<>();
        resp.put("success", true);
        resp.put("message", res.message);
        resp.put("token", res.token);
        resp.put("username", res.username);
        resp.put("role", res.role);
        if (res.simulatedOtp != null) resp.put("simulatedOtp", res.simulatedOtp);
        if (res.guardianInviteCode != null) resp.put("guardianInviteCode", res.guardianInviteCode);
        if (res.linkedVictim != null) resp.put("linkedVictim", res.linkedVictim);
        resp.put("user", userMap);

        return ResponseEntity.ok(resp);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username") != null ? body.get("username") : body.get("email");
        String password = body.get("password");

        UserService.LoginResponse res = userService.login(username, password);

        Map<String, Object> userMap = new java.util.LinkedHashMap<>();
        userMap.put("id", res.id);
        userMap.put("username", res.username);
        userMap.put("email", res.email);
        userMap.put("role", res.role);
        userMap.put("unavailable", res.unavailable);
        userMap.put("guardianName", res.guardianName != null ? res.guardianName : "");
        userMap.put("guardianPhone", res.guardianPhone != null ? res.guardianPhone : "");
        if (res.guardianInviteCode != null) userMap.put("guardianInviteCode", res.guardianInviteCode);
        if (res.department != null) userMap.put("department", res.department);
        if (res.linkedVictim != null) userMap.put("linkedVictim", res.linkedVictim);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "token", res.token,
                "user", userMap
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        Map<String, Object> map = new java.util.LinkedHashMap<>();
        map.put("id", user.getId());
        map.put("username", user.getUsername());
        map.put("email", user.getEmail());
        map.put("role", user.getRole().name());
        map.put("unavailable", user.isUnavailable());
        map.put("guardianName", user.getGuardianName() != null ? user.getGuardianName() : "");
        map.put("guardianPhone", user.getGuardianPhone() != null ? user.getGuardianPhone() : "");
        if (user.getGuardianInviteCode() != null) map.put("guardianInviteCode", user.getGuardianInviteCode());
        if (user.getDepartment() != null) map.put("department", user.getDepartment());
        if (user.getLinkedVictimUsername() != null) map.put("linkedVictim", user.getLinkedVictimUsername());
        return ResponseEntity.ok(map);
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
