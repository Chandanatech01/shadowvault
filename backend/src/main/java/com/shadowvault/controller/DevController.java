package com.shadowvault.controller;

import com.shadowvault.model.EvidenceItem;
import com.shadowvault.repository.EvidenceItemRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.RandomAccessFile;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/dev")
@Profile("dev")
public class DevController {

    private final EvidenceItemRepository evidenceItemRepository;

    public DevController(EvidenceItemRepository evidenceItemRepository) {
        this.evidenceItemRepository = evidenceItemRepository;
    }

    @PostMapping("/tamper/{evidenceId}")
    @Transactional
    public ResponseEntity<?> tamperEvidenceItem(@PathVariable Long evidenceId) {
        Optional<EvidenceItem> itemOpt = evidenceItemRepository.findById(evidenceId);
        if (itemOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Evidence item not found: " + evidenceId));
        }

        EvidenceItem item = itemOpt.get();
        return performTampering(item);
    }

    @PostMapping("/tamper-latest")
    @Transactional
    public ResponseEntity<?> tamperLatestItem() {
        var items = evidenceItemRepository.findAll();
        if (items.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "No evidence items available to tamper"));
        }
        EvidenceItem item = items.get(items.size() - 1);
        return performTampering(item);
    }

    private ResponseEntity<?> performTampering(EvidenceItem item) {
        try {
            // 1. Physically corrupt the stego image file by flipping bytes in carrier
            File stegoFile = new File(item.getStegoImagePath());
            if (stegoFile.exists()) {
                try (RandomAccessFile raf = new RandomAccessFile(stegoFile, "rw")) {
                    long length = raf.length();
                    if (length > 100) {
                        raf.seek(length / 2);
                        raf.write(new byte[]{(byte) 0xFF, (byte) 0x00, (byte) 0xAA, (byte) 0x55});
                    }
                }
            }

            // 2. Corrupt contentHash in DB
            String originalHash = item.getContentHash();
            String corruptedHash = "deadbeef" + (originalHash.length() > 8 ? originalHash.substring(8) : "12345678");
            item.setContentHash(corruptedHash);
            evidenceItemRepository.save(item);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Evidence item " + item.getId() + " corrupted successfully. Verification will detect tampering.",
                    "evidenceId", item.getId(),
                    "originalHashPrefix", originalHash.substring(0, Math.min(10, originalHash.length())),
                    "corruptedHashPrefix", corruptedHash.substring(0, 10)
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to corrupt evidence: " + e.getMessage()));
        }
    }
}
