package com.shadowvault.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class EncryptionService {

    private static final String AES_GCM = "AES/GCM/NoPadding";
    private static final String RSA_OAEP = "RSA/ECB/OAEPWithSHA-256AndMGF1Padding";
    private static final int GCM_TAG_LENGTH = 128;
    private static final int IV_LENGTH = 12;

    private final SecretKey identityKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public EncryptionService(@Value("${shadowvault.identity.aes-key}") String identityKeyHex) {
        byte[] keyBytes = hexToBytes(identityKeyHex);
        if (keyBytes.length != 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, Math.min(keyBytes.length, 32));
            keyBytes = padded;
        }
        this.identityKey = new SecretKeySpec(keyBytes, "AES");
    }

    public SecretKey generateFreshAesKey() {
        try {
            KeyGenerator kg = KeyGenerator.getInstance("AES");
            kg.init(256, secureRandom);
            return kg.generateKey();
        } catch (Exception e) {
            throw new RuntimeException("Error generating fresh AES key", e);
        }
    }

    public byte[] generateIv() {
        byte[] iv = new byte[IV_LENGTH];
        secureRandom.nextBytes(iv);
        return iv;
    }

    public byte[] encryptAesGcm(SecretKey aesKey, byte[] iv, byte[] plaintext) {
        try {
            Cipher cipher = Cipher.getInstance(AES_GCM);
            cipher.init(Cipher.ENCRYPT_MODE, aesKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            return cipher.doFinal(plaintext);
        } catch (Exception e) {
            throw new RuntimeException("AES-GCM encryption failed", e);
        }
    }

    public byte[] decryptAesGcm(SecretKey aesKey, byte[] iv, byte[] ciphertext) {
        try {
            Cipher cipher = Cipher.getInstance(AES_GCM);
            cipher.init(Cipher.DECRYPT_MODE, aesKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            return cipher.doFinal(ciphertext);
        } catch (Exception e) {
            throw new RuntimeException("AES-GCM decryption failed", e);
        }
    }

    public byte[] wrapAesKey(SecretKey aesKey, PublicKey authorityPublicKey) {
        try {
            Cipher cipher = Cipher.getInstance(RSA_OAEP);
            cipher.init(Cipher.WRAP_MODE, authorityPublicKey);
            return cipher.wrap(aesKey);
        } catch (Exception e) {
            throw new RuntimeException("RSA key wrapping failed", e);
        }
    }

    public SecretKey unwrapAesKey(byte[] wrappedKeyBytes, PrivateKey authorityPrivateKey) {
        try {
            Cipher cipher = Cipher.getInstance(RSA_OAEP);
            cipher.init(Cipher.UNWRAP_MODE, authorityPrivateKey);
            return (SecretKey) cipher.unwrap(wrappedKeyBytes, "AES", Cipher.SECRET_KEY);
        } catch (Exception e) {
            throw new RuntimeException("RSA key unwrapping failed", e);
        }
    }

    public String encryptIdentity(String plaintext) {
        if (plaintext == null || plaintext.trim().isEmpty()) {
            return plaintext;
        }
        try {
            byte[] iv = generateIv();
            byte[] ciphertext = encryptAesGcm(identityKey, iv, plaintext.getBytes(StandardCharsets.UTF_8));
            ByteBuffer buffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            buffer.put(iv);
            buffer.put(ciphertext);
            return Base64.getEncoder().encodeToString(buffer.array());
        } catch (Exception e) {
            throw new RuntimeException("Error encrypting victim identity", e);
        }
    }

    public String decryptIdentity(String base64Encrypted) {
        if (base64Encrypted == null || base64Encrypted.trim().isEmpty()) {
            return base64Encrypted;
        }
        try {
            byte[] data = Base64.getDecoder().decode(base64Encrypted);
            if (data.length < IV_LENGTH) {
                return base64Encrypted;
            }
            byte[] iv = new byte[IV_LENGTH];
            byte[] ciphertext = new byte[data.length - IV_LENGTH];
            System.arraycopy(data, 0, iv, 0, IV_LENGTH);
            System.arraycopy(data, IV_LENGTH, ciphertext, 0, ciphertext.length);
            byte[] decrypted = decryptAesGcm(identityKey, iv, ciphertext);
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return base64Encrypted; // Return as-is if not encrypted
        }
    }

    public byte[] deriveKeyFromSecret(String secret) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return md.digest(secret.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 derivation failed", e);
        }
    }

    public byte[] encryptWithMasterSecret(byte[] data, String masterSecret) {
        byte[] keyBytes = deriveKeyFromSecret(masterSecret);
        SecretKey masterKey = new SecretKeySpec(keyBytes, "AES");
        byte[] iv = generateIv();
        byte[] ciphertext = encryptAesGcm(masterKey, iv, data);
        ByteBuffer buffer = ByteBuffer.allocate(iv.length + ciphertext.length);
        buffer.put(iv);
        buffer.put(ciphertext);
        return buffer.array();
    }

    public byte[] decryptWithMasterSecret(byte[] encryptedData, String masterSecret) {
        byte[] keyBytes = deriveKeyFromSecret(masterSecret);
        SecretKey masterKey = new SecretKeySpec(keyBytes, "AES");
        if (encryptedData.length < IV_LENGTH) {
            throw new IllegalArgumentException("Encrypted data too short");
        }
        byte[] iv = new byte[IV_LENGTH];
        byte[] ciphertext = new byte[encryptedData.length - IV_LENGTH];
        System.arraycopy(encryptedData, 0, iv, 0, IV_LENGTH);
        System.arraycopy(encryptedData, IV_LENGTH, ciphertext, 0, ciphertext.length);
        return decryptAesGcm(masterKey, iv, ciphertext);
    }

    public byte[] packPayload(byte[] wrappedKey, byte[] iv, byte[] ciphertext) {
        ByteBuffer buffer = ByteBuffer.allocate(4 + wrappedKey.length + 4 + iv.length + 4 + ciphertext.length);
        buffer.putInt(wrappedKey.length);
        buffer.put(wrappedKey);
        buffer.putInt(iv.length);
        buffer.put(iv);
        buffer.putInt(ciphertext.length);
        buffer.put(ciphertext);
        return buffer.array();
    }

    public EncryptedContainer unpackPayload(byte[] packedPayload) {
        ByteBuffer buffer = ByteBuffer.wrap(packedPayload);
        int wrappedKeyLen = buffer.getInt();
        byte[] wrappedKey = new byte[wrappedKeyLen];
        buffer.get(wrappedKey);

        int ivLen = buffer.getInt();
        byte[] iv = new byte[ivLen];
        buffer.get(iv);

        int ciphertextLen = buffer.getInt();
        byte[] ciphertext = new byte[ciphertextLen];
        buffer.get(ciphertext);

        return new EncryptedContainer(wrappedKey, iv, ciphertext);
    }

    public static class EncryptedContainer {
        public final byte[] wrappedKey;
        public final byte[] iv;
        public final byte[] ciphertext;

        public EncryptedContainer(byte[] wrappedKey, byte[] iv, byte[] ciphertext) {
            this.wrappedKey = wrappedKey;
            this.iv = iv;
            this.ciphertext = ciphertext;
        }
    }

    private byte[] hexToBytes(String hex) {
        int len = hex.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(hex.charAt(i), 16) << 4)
                    + Character.digit(hex.charAt(i + 1), 16));
        }
        return data;
    }
}
