# ShadowVault — Viva Voce Questions & Answers

This document provides 25 comprehensive viva questions and concise technical answers covering the security, cryptography, architecture, and design decisions behind **ShadowVault**.

---

### Q1: What is the core problem ShadowVault solves?
**Answer:** ShadowVault is a covert, privacy-first incident reporting and evidence vault designed for victims of domestic abuse and harassment. It eliminates digital traces on the victim's device using a decoy lifestyle blog cover, conceals evidence using steganography, safeguards records with military-grade envelope encryption (AES-256-GCM + RSA-4096), and ensures tamper-evident court admissibility via cryptographic SHA-256 hash chains.

---

### Q2: How does the decoy blog and secret portal unlock mechanism work?
**Answer:** The root path (`/`) serves *The Daily Mosaic*, a fully functional lifestyle and recipes blog. The vault portal remains completely invisible to casual observers or abusers inspecting the victim's browser history. Typing the pre-configured secret trigger code (`shadow123`) into the blog's search bar redirects the user to the covert vault router (`#/portal`).

---

### Q3: Why is AES-256-GCM used instead of standard AES-CBC?
**Answer:** AES-256 in Galois/Counter Mode (GCM) is an **Authenticated Encryption with Associated Data (AEAD)** cipher. Unlike CBC mode, GCM provides both confidentiality and data authenticity simultaneously. It generates a 128-bit authentication tag; any unauthorized bit flipping or corruption immediately triggers an `AEADBadTagException` during decryption, preventing chosen-ciphertext and padding oracle attacks.

---

### Q4: What is the role of the 96-bit Initialization Vector (IV) in AES-GCM?
**Answer:** AES-GCM requires a unique IV (nonce) for every encryption operation. ShadowVault generates a cryptographically secure random 12-byte (96-bit) IV using `SecureRandom` for each evidence file. Reusing an IV with the same key destroys GCM's authenticity guarantee and leaks information about the plaintext.

---

### Q5: How does Envelope Encryption work in ShadowVault?
**Answer:** Rather than encrypting all files directly with a single static master key:
1. A unique, random 256-bit symmetric AES Data Encryption Key (DEK) is generated for each uploaded evidence file.
2. The file is encrypted using this DEK.
3. The DEK itself is encrypted (wrapped) using an RSA-4096 public Master Key.
4. The wrapped DEK is stored alongside the encrypted payload in the database. Only authorized authorities with the RSA-4096 private key can unwrap the DEK and decrypt the evidence.

---

### Q6: Why combine AES-256-GCM with RSA-4096 instead of using RSA alone?
**Answer:** RSA is computationally expensive and cannot directly encrypt data larger than its key modulus (minus padding overhead, ~470 bytes for RSA-4096 with OAEP). AES-256-GCM handles large arbitrary binary files (images, audio, documents) with hardware-accelerated symmetric speed, while RSA-4096 securely manages key distribution and role separation.

---

### Q7: What is Adaptive Least Significant Bit (LSB) Steganography?
**Answer:** LSB steganography conceals the encrypted ciphertext within the least significant bit of RGB color channels of an innocuous PNG carrier image. Because flipping the least significant bit alters the color component by at most 1/255th, the visual modification is imperceptible to the human eye. "Adaptive" means the carrier image dimensions are dynamically sized to ensure sufficient pixel capacity for the payload.

---

### Q8: Why must steganography use lossless image formats like PNG rather than JPEG?
**Answer:** JPEG uses lossy discrete cosine transform (DCT) compression which discards high-frequency pixel details during saving, destroying the hidden bits embedded in the least significant bit positions. PNG uses lossless Deflate compression, guaranteeing byte-for-byte fidelity of every pixel and preserving the hidden payload intact.

---

### Q9: How is the Cryptographic Hash Chain structured for a case?
**Answer:** Each evidence item in a case forms an immutable block in a sequential chain:
- **Block 1 (Genesis):** `Hash_1 = SHA-256(1 || "GENESIS_ROOT" || FileHash_1 || Timestamp_1)`
- **Block N:** `Hash_N = SHA-256(N || Hash_{N-1} || FileHash_N || Timestamp_N)`
Each record permanently binds its sequence index, the hash of the preceding record (`previous_hash`), the hash of the encrypted payload, and the submission timestamp.

---

### Q10: How does the system detect evidence tampering?
**Answer:** During verification, the system recalculates the expected hash chain from Block 1 forward to Block N:
1. If an adversary modifies an evidence payload or timestamp, its local hash changes.
2. Because Block $N+1$ includes Block $N$'s hash, all subsequent link hashes fail validation.
3. The verification algorithm flags the chain as `TAMPERED` and pinpoints the exact sequence number where the cryptographic link was broken.

---

### Q11: How does the Dynamic Severity Scoring algorithm operate?
**Answer:** The scoring engine evaluates multi-factor incident metadata:
- **Incident Category Weight:** Physical assault (50 pts), Stalking (40 pts), Threats (35 pts), Harassment (25 pts), Property damage (20 pts).
- **Keyword Risk Analysis:** High-risk indicators ("weapon", "kill", "hospital", "repeated", "child") add 15 points per trigger.
- **Evidence Diversity:** Uploading multiple media types (text + image + audio) adds corroboration weight.
Cases are categorized into three response tiers: `LOW` (<50), `MEDIUM` (50–99), or `HIGH` (≥100).

---

### Q12: What role does the Severity Score play in the workflow?
**Answer:** In the authority review queue, cases are prioritized dynamically so that high-danger incidents receive immediate attention. Furthermore, `HIGH` severity cases can automatically trigger guardian notification escalation if configured by the victim.

---

### Q13: How is Role-Based Access Control (RBAC) enforced?
**Answer:** Spring Security evaluates every incoming HTTP request using JWT tokens containing role claims:
- `ROLE_VICTIM`: Can submit evidence, view own cases, and grant/deny access requests.
- `ROLE_AUTHORITY`: Can view masked case queues, request access, and review approved decrypted dossiers.
- `ROLE_GUARDIAN`: Can review escalated cases and approve access on behalf of incapacitated victims.
Endpoints are protected with explicit authority matchers in `SecurityConfig.java`.

---

### Q14: How is victim privacy preserved in the Authority Queue?
**Answer:** In the authority dashboard, victim names and contact information are strictly masked (e.g., `VICTIM-***`). Authorities can observe only the Case ID, incident category, severity tier, and submission timestamp. Plaintext identity is never revealed until explicit consent is granted.

---

### Q15: What is the Two-Party Consent Protocol for evidence access?
**Answer:** An authority cannot unilaterally decrypt evidence. They must create an `AccessRequest` in `PENDING` state. The victim inspects the request in their dashboard and must explicitly click "Approve". Only upon approval is the case access status updated to `APPROVED`, unlocking the decryption endpoint.

---

### Q16: What is the Guardian Escalation protocol?
**Answer:** If a victim is unreachable, silenced, or incapacitated by an aggressor, an emergency access request can be routed to the victim's designated trusted Guardian (`ROLE_GUARDIAN`). The guardian can evaluate the urgency and approve access, creating an independent verifiable audit trail.

---

### Q17: What does the Emergency Panic Button do?
**Answer:** Clicking the "Quick Exit" panic button or pressing the `Escape` key immediately:
1. Clears JWT tokens from `localStorage` and `sessionStorage`.
2. Flushes in-memory auth state.
3. Redirects the browser instantly to the innocent *The Daily Mosaic* blog home page, preventing an approaching abuser from seeing the portal.

---

### Q18: Why is OTP verification simulated rather than sending real SMS messages?
**Answer:** 
1. **Safety:** Sending an SMS with the word "ShadowVault" or "Incident Code" to a shared or monitored mobile phone could alert an abuser, placing the victim in direct physical danger.
2. **Offline Resilience & Cost:** Simulated OTP allows fully zero-dependency, zero-cost operation without requiring paid third-party telecom gateways (e.g., Twilio).

---

### Q19: Why was MySQL 8 chosen as the persistent database?
**Answer:**
1. **ACID Transactional Guarantees:** Critical for maintaining strict sequential consistency across multi-item hash chain insertion.
2. **Binary Data Storage:** Native support for `LONGBLOB` columns for storing encrypted binary payloads and wrapped keys.
3. **Enterprise Compliance:** Universal court and law enforcement standard for chain of custody and forensic audits.

---

### Q20: How do you verify that zero plaintext PII is stored in the database?
**Answer:** Running `SELECT username, encrypted_name, encrypted_phone FROM users;` proves that personal names and phone numbers are stored strictly as base64-encoded AES-256 ciphertexts. Similarly, querying `SELECT payload_blob, wrapped_aes_key FROM evidence_items;` confirms all media content is encrypted.

---

### Q21: How are JSON Web Tokens (JWT) secured?
**Answer:** JWTs are signed using HMAC-SHA256 with a 64-character (512-bit) high-entropy secret key loaded from environment variables. Tokens carry a short expiration window (24 hours), identify the subject username and authority role, and are validated on every request by a stateless `JwtAuthenticationFilter`.

---

### Q22: Why is the tamper endpoint isolated behind the `dev` Spring profile?
**Answer:** The `/api/dev/tamper/{id}` endpoint intentionally corrupts database payloads to demonstrate hash-chain breakages during audits. In production (`@Profile("!dev")`), exposing such an endpoint would represent a critical vulnerability. In default mode, the bean is unregistered and Spring returns `404 Not Found`.

---

### Q23: How do Spring Boot unit tests differ from Testcontainers tests?
**Answer:** Unit tests mock or isolate services (e.g., in-memory H2 or isolated cryptographic logic) for rapid local feedback. Testcontainers spins up a real, ephemeral Dockerized MySQL 8 instance with exact production engine semantics, testing connection pooling, dialect behavior, and BLOB constraints.

---

### Q24: What happens to uploaded files on free-tier cloud platforms (e.g., Render, Railway)?
**Answer:** Free cloud tiers run on ephemeral containers. When the container sleeps, restarts, or deploys a new commit, local filesystem state in `./data` is reset unless a persistent disk volume is attached. In production deployments, `DATA_DIR` is mounted to AWS S3, Google Cloud Storage, or an attached persistent block volume.

---

### Q25: How does ShadowVault support legal chain-of-custody requirements?
**Answer:** Under Federal Rules of Evidence Rule 902(13) and Rule 902(14) (Certified Records Generated by an Electronic Process):
1. Records are mathematically proven authentic through cryptographic hash chains.
2. Timestamp and SHA-256 digests prove evidence existed in that exact state at submission time.
3. Any alteration invalidates the entire chain, guaranteeing provable integrity.
