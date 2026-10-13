package com.shadowvault.config;

import com.shadowvault.model.SystemKey;
import com.shadowvault.repository.SystemKeyRepository;
import com.shadowvault.service.EncryptionService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.file.Files;
import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Optional;

@Component
public class RsaKeyManager {

    private static final String KEY_NAME = "AUTHORITY_RSA";

    @Value("${shadowvault.keys.path:./data/keys}")
    private String keysDirPath;

    @Value("${shadowvault.master.key-secret:master-fallback-secret-2026-shadowvault-secure-test-key-32b}")
    private String masterSecret;

    private final SystemKeyRepository systemKeyRepository;
    private final EncryptionService encryptionService;

    private PublicKey authorityPublicKey;
    private PrivateKey authorityPrivateKey;

    public RsaKeyManager(SystemKeyRepository systemKeyRepository, EncryptionService encryptionService) {
        this.systemKeyRepository = systemKeyRepository;
        this.encryptionService = encryptionService;
    }

    @PostConstruct
    public void init() {
        try {
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");

            // 1. Check database for existing encrypted RSA key pair
            Optional<SystemKey> keyOpt = systemKeyRepository.findById(KEY_NAME);
            if (keyOpt.isPresent()) {
                SystemKey sysKey = keyOpt.get();
                byte[] pubBytes = sysKey.getPublicKeyBytes();
                byte[] encPrivBytes = sysKey.getEncryptedPrivateKeyBytes();

                byte[] privBytes = encryptionService.decryptWithMasterSecret(encPrivBytes, masterSecret);
                this.authorityPublicKey = keyFactory.generatePublic(new X509EncodedKeySpec(pubBytes));
                this.authorityPrivateKey = keyFactory.generatePrivate(new PKCS8EncodedKeySpec(privBytes));
                return;
            }

            // 2. Check disk for legacy keys or generate a fresh 4096-bit RSA pair
            File dir = new File(keysDirPath);
            File pubFile = new File(dir, "authority_public.key");
            File privFile = new File(dir, "authority_private.key");

            if (pubFile.exists() && privFile.exists()) {
                byte[] pubBytes = Files.readAllBytes(pubFile.toPath());
                byte[] privBytes = Files.readAllBytes(privFile.toPath());

                this.authorityPublicKey = keyFactory.generatePublic(new X509EncodedKeySpec(pubBytes));
                this.authorityPrivateKey = keyFactory.generatePrivate(new PKCS8EncodedKeySpec(privBytes));
            } else {
                KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
                kpg.initialize(4096, new SecureRandom());
                KeyPair kp = kpg.generateKeyPair();
                this.authorityPublicKey = kp.getPublic();
                this.authorityPrivateKey = kp.getPrivate();

                // Save to disk if directory accessible
                try {
                    if (!dir.exists()) {
                        dir.mkdirs();
                    }
                    try (FileOutputStream fos = new FileOutputStream(pubFile)) {
                        fos.write(this.authorityPublicKey.getEncoded());
                    }
                    try (FileOutputStream fos = new FileOutputStream(privFile)) {
                        fos.write(this.authorityPrivateKey.getEncoded());
                    }
                } catch (Exception ignored) {}
            }

            // 3. Encrypt private key with master secret and store in database
            byte[] encPriv = encryptionService.encryptWithMasterSecret(this.authorityPrivateKey.getEncoded(), masterSecret);
            SystemKey systemKey = new SystemKey(KEY_NAME, this.authorityPublicKey.getEncoded(), encPriv, "AES-GCM");
            systemKeyRepository.save(systemKey);

        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize RSA-4096 authority key pair", e);
        }
    }

    public PublicKey getAuthorityPublicKey() {
        return authorityPublicKey;
    }

    public PrivateKey getAuthorityPrivateKey() {
        return authorityPrivateKey;
    }
}
