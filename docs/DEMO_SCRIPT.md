# ShadowVault: 5-Minute Live Demo Script

This walkthrough guides you through a complete 5-minute interactive demonstration of ShadowVault, showcasing covert access, cryptographic envelope encryption, steganographic concealment, dynamic severity prioritization, zero-knowledge identity masking, victim/guardian consent, tamper-evident hash chaining, and deliberate tamper detection.

---

## ⏱️ Demo Timeline Overview

| Time | Action | Feature Highlight |
|---|---|---|
| **0:00 - 0:45** | Decoy Blog & Covert Unlock | Steganographic operational security & Panic Button |
| **0:45 - 1:45** | Victim Incident Submission | Client AES-256 + RSA-4096 envelope + Dynamic severity |
| **1:45 - 2:45** | Authority Case Investigation | Identity masking & Cryptographic access request |
| **2:45 - 3:45** | Dual-Path Consent & Guardian Escalation | Victim self-approval & Guardian fallback authorization |
| **3:45 - 5:00** | Decryption, Hash Chain & Tamper Demo | Real-time integrity audit & Tamper detection alert |

---

## 🚀 Pre-Demo Checklist

1. Ensure MySQL 8 is running locally or via Docker.
2. Launch the application:
   - **Windows:** Double-click `start.bat`
   - **Linux/macOS:** `./start.sh`
   - **Docker:** `docker compose up`
3. Open a browser to `http://localhost:8080/`.

---

## 📝 Step-by-Step Walkthrough

### Step 1: The Decoy Blog & Covert Portal Unlock (0:00 - 0:45)
1. **Show the Landing Page:**
   - Notice the website appears as **"The Daily Mosaic"**, an innocent lifestyle and travel blog.
   - Explain: *"An abuser inspecting the victim's device sees only travel stories, recipes, and normal browsing history."*
2. **Demonstrate Operational Security (OpSec):**
   - Click the search bar at the top-right.
   - Type normal words (e.g., `coffee`) → Nothing suspicious happens.
3. **Trigger the Covert Portal:**
   - In the search bar, type the secret unlock code: **`shadow123`**.
   - The UI instantly and silently transitions to the dark, high-security **ShadowVault Portal** (`/#/portal`).
4. **Panic Button Test:**
   - Point out the red **"PANIC ESCAPE"** button always visible in the top corner.
   - Click it → The browser clears session state and immediately redirects back to the decoy blog.
   - Unlock again with `shadow123` to continue.

---

### Step 2: Victim Sign-In & Evidence Upload (0:45 - 1:45)
1. **Access Victim Portal:**
   - Click **"Report an Incident"** or **"Sign In"**.
   - In the login modal, click the quick demo account button: **`victim1`** (auto-fills password `demo123`).
   - Click **Login →**.
2. **Submit Incident Evidence:**
   - Navigate to **"Report an Incident"** (`/#/evidence`).
   - Enter a description: `"Perpetrator left a physical threatening note on my front door."`
   - Select Severity Tags: Check **[x] Threat** and **[x] Physical Harm**.
   - Type or upload evidence:
     - Type a testimony statement or choose a sample image.
   - Click **"Submit Encrypted Evidence"**.
3. **Inspect Real-Time Crypto Pipeline:**
   - The screen shows the cryptographic pipeline:
     - ✅ **AES-256-GCM:** Content encrypted with an ephemeral key.
     - ✅ **RSA-4096:** AES key wrapped with authority public key.
     - ✅ **LSB Steganography:** Ciphertext embedded into an innocuous carrier PNG.
     - ✅ **SHA-256 Hash Chain:** Linked to the genesis block or previous item.
     - ✅ **Dynamic Severity Scoring:** Case severity dynamically updated to **HIGH**.
   - Note the assigned Case ID (e.g., `CASE-XXXXXX`).

---

### Step 3: Authority Investigation & Identity Masking (1:45 - 2:45)
1. **Switch to Authority Role:**
   - In the navbar, click **Sign Out**.
   - Click **Sign In**, and select **`authority1`** demo button (password `demo123`).
   - Click **Login →** (redirects to `/#/authority`).
2. **Review Priority Queue:**
   - Point out the investigation queue:
     - Cases are automatically prioritized by **Dynamic Severity Score**.
     - Notice: **The victim's name, phone, and evidence are completely hidden.**
     - The authority sees only: `Case ID`, `Severity Tier`, `Timestamp`, and `Item Count`.
3. **Submit Access Request:**
   - Click **"🔑 Request Access"** on the victim's case.
   - State reason: `"Official police cyber unit formal investigation"`.
   - The status updates immediately to **⏳ Awaiting Approval**.

---

### Step 4: Dual-Path Consent: Victim Approval & Guardian Escalation (2:45 - 3:45)

#### Path A: Direct Victim Approval
1. Sign out and log back in as **`victim1`**.
2. Click **"Check My Case"** (`/#/status`).
3. Notice the **Pending Authority Access Request** banner.
4. Click **"✓ Approve Access"**.
5. The case status updates to **Access Granted**.

#### Path B: Guardian Fallback (Emergency Escalation)
1. In the status screen, demonstrate the **"🟢 Available / 🔴 Unavailable"** toggle:
   - Click the button to switch to **"🔴 Unavailable"**.
   - Explain: *"If a victim is detained, in hospital, or incapacitated, their designated trusted guardian can authorize emergency access without waiting."*
2. Log in as **`guardian1`** (demo password `demo123`):
   - Navigate to Guardian Escalation (`/#/guardian`).
   - Show the ward's pending request with the banner: `✓ Ward is marked UNAVAILABLE. Guardian authorization is ACTIVE.`
   - Guardian clicks **"✓ Guardian Approve Access"**.

---

### Step 5: Decryption, Hash Chain Audit & Tamper Detection (3:45 - 5:00)

1. **Authority Inspection:**
   - Sign back in as **`authority1`**.
   - On the approved case, click **"🔓 View Decrypted Evidence"**.
   - An interactive dossier opens:
     - 👤 **Victim Identity Unmasked:** `Priya Sharma` (+91 98765 43210) is now visible post-approval.
     - 🛡️ **Chain Status:** Displays **VERIFIED** with green badges on every evidence link.
     - 📄 **Decrypted Statement:** Plaintext testimony rendered after RSA-4096 + AES-256-GCM unwrapping.
2. **Simulate Deliberate Evidence Tampering:**
   - Close the dossier.
   - Switch back to **`victim1`** (`/#/status`).
   - Click the **"⚡ Simulate Tampering (Demo)"** button.
   - Behind the scenes, the backend dev endpoint deliberately flips bytes in the steganography carrier image and alters the content hash.
3. **Demonstrate Tamper Detection Engine:**
   - Log back into **`authority1`** (`/#/authority`).
   - Click **"🔓 View Decrypted Evidence"**.
   - **Result:**
     - The banner immediately flashes red: **⚠️ CHAIN STATUS: TAMPERED**.
     - Pinpoints the exact failure: `Tampering detected at item sequence #X (Evidence ID: Y). Cryptographic chain broken.`
     - Red alert tags illustrate that court admissibility is preserved by detecting unauthorized alteration.

---

## 🎯 Summary Takeaway for Judges & Reviewers

1. **Covert First:** The victim is safe from discovery on their device.
2. **Zero Plaintext Storage:** Database stores only AES-256 and RSA-4096 ciphertexts across users, phone numbers, and testimonies.
3. **Provable Integrity:** Merkle-style hash chains ensure evidence cannot be altered silently.
4. **Victim Sovereignty:** Evidence can never be decrypted by police, NGO, or authority without explicit victim or guardian consent.
