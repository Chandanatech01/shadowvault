package com.shadowvault.model;

import jakarta.persistence.*;

@Entity
@Table(name = "system_keys")
public class SystemKey {

    @Id
    @Column(name = "key_name", length = 100)
    private String keyName;

    @Lob
    @Column(name = "public_key_bytes", columnDefinition = "LONGBLOB", nullable = false)
    private byte[] publicKeyBytes;

    @Lob
    @Column(name = "encrypted_private_key_bytes", columnDefinition = "LONGBLOB", nullable = false)
    private byte[] encryptedPrivateKeyBytes;

    @Column(name = "iv", length = 64, nullable = false)
    private String iv;

    public SystemKey() {}

    public SystemKey(String keyName, byte[] publicKeyBytes, byte[] encryptedPrivateKeyBytes, String iv) {
        this.keyName = keyName;
        this.publicKeyBytes = publicKeyBytes;
        this.encryptedPrivateKeyBytes = encryptedPrivateKeyBytes;
        this.iv = iv;
    }

    public String getKeyName() {
        return keyName;
    }

    public void setKeyName(String keyName) {
        this.keyName = keyName;
    }

    public byte[] getPublicKeyBytes() {
        return publicKeyBytes;
    }

    public void setPublicKeyBytes(byte[] publicKeyBytes) {
        this.publicKeyBytes = publicKeyBytes;
    }

    public byte[] getEncryptedPrivateKeyBytes() {
        return encryptedPrivateKeyBytes;
    }

    public void setEncryptedPrivateKeyBytes(byte[] encryptedPrivateKeyBytes) {
        this.encryptedPrivateKeyBytes = encryptedPrivateKeyBytes;
    }

    public String getIv() {
        return iv;
    }

    public void setIv(String iv) {
        this.iv = iv;
    }
}
