package com.shadowvault.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.file.Files;
import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;

@Component
public class RsaKeyManager {

    @Value("${shadowvault.keys.path:./data/keys}")
    private String keysDirPath;

    private PublicKey authorityPublicKey;
    private PrivateKey authorityPrivateKey;

    @PostConstruct
    public void init() {
        try {
            File dir = new File(keysDirPath);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            File pubFile = new File(dir, "authority_public.key");
            File privFile = new File(dir, "authority_private.key");

            if (pubFile.exists() && privFile.exists()) {
                byte[] pubBytes = Files.readAllBytes(pubFile.toPath());
                byte[] privBytes = Files.readAllBytes(privFile.toPath());

                KeyFactory keyFactory = KeyFactory.getInstance("RSA");
                this.authorityPublicKey = keyFactory.generatePublic(new X509EncodedKeySpec(pubBytes));
                this.authorityPrivateKey = keyFactory.generatePrivate(new PKCS8EncodedKeySpec(privBytes));
            } else {
                KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
                kpg.initialize(4096, new SecureRandom());
                KeyPair kp = kpg.generateKeyPair();
                this.authorityPublicKey = kp.getPublic();
                this.authorityPrivateKey = kp.getPrivate();

                try (FileOutputStream fos = new FileOutputStream(pubFile)) {
                    fos.write(this.authorityPublicKey.getEncoded());
                }
                try (FileOutputStream fos = new FileOutputStream(privFile)) {
                    fos.write(this.authorityPrivateKey.getEncoded());
                }
            }
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
