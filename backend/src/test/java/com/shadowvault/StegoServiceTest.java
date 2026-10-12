package com.shadowvault;

import com.shadowvault.service.StegoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.awt.image.BufferedImage;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;

import static org.junit.jupiter.api.Assertions.*;

public class StegoServiceTest {

    private StegoService stegoService;

    @BeforeEach
    public void setup() {
        stegoService = new StegoService();
    }

    @Test
    public void testStegoEmbedAndExtractRoundTripText() {
        byte[] payload = "Steganographic hidden evidence string payload!".getBytes(StandardCharsets.UTF_8);
        byte[] keyMaterial = "secret-wrapped-aes-key-bytes".getBytes(StandardCharsets.UTF_8);

        BufferedImage carrier = stegoService.createCarrierImage(payload.length);
        stegoService.embedPayload(carrier, payload, keyMaterial);

        byte[] extracted = stegoService.extractPayload(carrier, keyMaterial);
        assertNotNull(extracted);
        assertArrayEquals(payload, extracted);
        assertEquals(new String(payload, StandardCharsets.UTF_8), new String(extracted, StandardCharsets.UTF_8));
    }

    @Test
    public void testStegoEmbedAndExtractBinaryPayload() {
        byte[] payload = new byte[4096]; // 4 KB binary payload
        new SecureRandom().nextBytes(payload);
        byte[] keyMaterial = new byte[32];
        new SecureRandom().nextBytes(keyMaterial);

        BufferedImage carrier = stegoService.createCarrierImage(payload.length);
        stegoService.embedPayload(carrier, payload, keyMaterial);

        byte[] extracted = stegoService.extractPayload(carrier, keyMaterial);
        assertNotNull(extracted);
        assertArrayEquals(payload, extracted);
    }

    @Test
    public void testStegoExtractionWithWrongKeyFails() {
        byte[] payload = "Critical secret payload".getBytes(StandardCharsets.UTF_8);
        byte[] keyMaterial = "correct-key-seed".getBytes(StandardCharsets.UTF_8);
        byte[] wrongKeyMaterial = "wrong-key-seed-diff".getBytes(StandardCharsets.UTF_8);

        BufferedImage carrier = stegoService.createCarrierImage(payload.length);
        stegoService.embedPayload(carrier, payload, keyMaterial);

        // With wrong key, either length decode fails or payload does not match
        try {
            byte[] extracted = stegoService.extractPayload(carrier, wrongKeyMaterial);
            assertFalse(java.util.Arrays.equals(payload, extracted), "Extraction with wrong key should not recover payload");
        } catch (IllegalArgumentException expected) {
            // Decoded corrupted length or out of bounds slot is also expected
            assertTrue(true);
        }
    }
}
