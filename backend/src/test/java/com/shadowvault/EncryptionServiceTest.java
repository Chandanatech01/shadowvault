package com.shadowvault;

import com.shadowvault.service.EncryptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;

import static org.junit.jupiter.api.Assertions.*;

public class EncryptionServiceTest {

    private EncryptionService encryptionService;
    private KeyPair rsaKeyPair;

    @BeforeEach
    public void setup() throws Exception {
        String testKeyHex = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
        encryptionService = new EncryptionService(testKeyHex);

        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048); // Fast 2048 bits for unit test
        rsaKeyPair = kpg.generateKeyPair();
    }

    @Test
    public void testAesGcmEncryptionDecryptionRoundTrip() {
        SecretKey aesKey = encryptionService.generateFreshAesKey();
        byte[] iv = encryptionService.generateIv();
        byte[] original = "Confidential evidence message for testing AES-256-GCM!".getBytes(StandardCharsets.UTF_8);

        byte[] ciphertext = encryptionService.encryptAesGcm(aesKey, iv, original);
        assertNotNull(ciphertext);
        assertNotEquals(0, ciphertext.length);

        byte[] decrypted = encryptionService.decryptAesGcm(aesKey, iv, ciphertext);
        assertArrayEquals(original, decrypted);
    }

    @Test
    public void testRsaKeyWrappingUnwrapping() {
        SecretKey originalAesKey = encryptionService.generateFreshAesKey();

        byte[] wrappedKey = encryptionService.wrapAesKey(originalAesKey, rsaKeyPair.getPublic());
        assertNotNull(wrappedKey);

        SecretKey unwrappedAesKey = encryptionService.unwrapAesKey(wrappedKey, rsaKeyPair.getPrivate());
        assertNotNull(unwrappedAesKey);
        assertArrayEquals(originalAesKey.getEncoded(), unwrappedAesKey.getEncoded());
    }

    @Test
    public void testVictimIdentityEncryptionDecryption() {
        String originalName = "Ananya Patel";
        String originalPhone = "+91 99887 76655";

        String encName = encryptionService.encryptIdentity(originalName);
        String encPhone = encryptionService.encryptIdentity(originalPhone);

        assertNotNull(encName);
        assertNotEquals(originalName, encName);

        String decName = encryptionService.decryptIdentity(encName);
        String decPhone = encryptionService.decryptIdentity(encPhone);

        assertEquals(originalName, decName);
        assertEquals(originalPhone, decPhone);
    }

    @Test
    public void testPackAndUnpackPayload() {
        byte[] wrappedKey = new byte[256];
        byte[] iv = new byte[12];
        byte[] ciphertext = "sample encrypted ciphertext".getBytes(StandardCharsets.UTF_8);

        byte[] packed = encryptionService.packPayload(wrappedKey, iv, ciphertext);
        EncryptionService.EncryptedContainer container = encryptionService.unpackPayload(packed);

        assertArrayEquals(wrappedKey, container.wrappedKey);
        assertArrayEquals(iv, container.iv);
        assertArrayEquals(ciphertext, container.ciphertext);
    }
}
