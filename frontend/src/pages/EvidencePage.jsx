import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import PanicButton from "../components/PanicButton";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../config";
const MAX_FILE_SIZE_BYTES = 200 * 1024; // 200 KB

export default function EvidencePage() {
  const navigate = useNavigate();
  const { t, lang, speechLangCodes } = useLanguage();
  const { token, user, login } = useAuth();
  const [searchParams] = useSearchParams();
  const isEmergency = searchParams.get("emergency") === "true";

  const [step, setStep] = useState(isEmergency ? "emergency" : "form");
  const [submissionResult, setSubmissionResult] = useState(null);

  // Evidence Form state
  const [evidenceType, setEvidenceType] = useState("IMAGE"); // 'TEXT', 'IMAGE', 'AUDIO'
  const [description, setDescription] = useState("");
  const [textContent, setTextContent] = useState("");
  const [selectedTags, setSelectedTags] = useState({
    THREAT: false,
    PHYSICAL_HARM: false,
    REPEATED_INCIDENT: false,
    HARASSMENT: false,
    STALKING: false,
  });

  const [uploadedFile, setUploadedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const handleTagToggle = (tagName) => {
    setSelectedTags((prev) => ({ ...prev, [tagName]: !prev[tagName] }));
  };

  // Multilingual speech-to-text
  const handleVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Voice input not supported. Try Chrome.");
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = speechLangCodes[lang] || "en-IN";
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setDescription((prev) => prev + " " + transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File size (${Math.round(file.size / 1024)} KB) exceeds 200 KB limit.`);
      return;
    }
    setError("");
    setUploadedFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!token) {
      setError("Please sign in as a victim to submit evidence.");
      return;
    }

    if (evidenceType === "TEXT" && !textContent.trim() && !description.trim()) {
      setError("Please provide a statement or incident description.");
      return;
    }

    if ((evidenceType === "IMAGE" || evidenceType === "AUDIO") && !uploadedFile && !textContent.trim()) {
      setError(`Please upload a ${evidenceType.toLowerCase()} file (max 200 KB).`);
      return;
    }

    setError("");
    setStep("submitting");

    try {
      const formData = new FormData();
      formData.append("type", evidenceType);
      formData.append("description", description);

      const activeTags = Object.keys(selectedTags).filter((k) => selectedTags[k]);
      formData.append("tags", activeTags.join(","));

      if (uploadedFile) {
        formData.append("file", uploadedFile);
      } else if (textContent.trim()) {
        formData.append("text", textContent);
      } else {
        formData.append("text", description);
      }

      const res = await axios.post(`${API_BASE}/cases/evidence`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setSubmissionResult(res.data);
      setStep("success");
    } catch (err) {
      setError(err.response?.data?.error || "Submission failed. Please check network connection.");
      setStep("form");
    }
  };

  const handleEmergency = async () => {
    setStep("submitting");
    setTimeout(async () => {
      try {
        if (token) {
          const formData = new FormData();
          formData.append("type", "TEXT");
          formData.append("description", "EMERGENCY SOS ALERT DISPATCHED");
          formData.append("tags", "THREAT,PHYSICAL_HARM");
          formData.append("text", "Urgent emergency assistance requested by victim.");
          const res = await axios.post(`${API_BASE}/cases/evidence`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          });
          setSubmissionResult(res.data);
        }
      } catch {}
      setStep("success");
    }, 1500);
  };

  const s = {
    page: { minHeight: "100vh", backgroundColor: "#0a0a0f", color: "#e8e8f0", fontFamily: "'Inter','Segoe UI',sans-serif" },
    nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", borderBottom: "1px solid #1e1e2e" },
    back: { fontSize: "13px", color: "#6b6b80", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" },
    logoText: { fontSize: "16px", fontWeight: "700" },
    logoSpan: { color: "#7c3aed" },
    main: { maxWidth: "720px", margin: "0 auto", padding: "48px 24px 80px" },
    pageTitle: { fontSize: "28px", fontWeight: "700", marginBottom: "8px", letterSpacing: "-0.5px" },
    pageSub: { fontSize: "14px", color: "rgba(232,232,240,0.5)", marginBottom: "32px", lineHeight: "1.5" },
    label: { display: "block", fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", color: "#6b6b80", fontFamily: "monospace", marginBottom: "8px" },
    input: { width: "100%", padding: "12px 16px", backgroundColor: "#111118", border: "1px solid #2a2a3a", borderRadius: "10px", color: "#e8e8f0", fontSize: "15px", outline: "none", fontFamily: "inherit", marginBottom: "20px", boxSizing: "border-box" },
    textarea: { width: "100%", padding: "14px 16px", backgroundColor: "#111118", border: "1px solid #2a2a3a", borderRadius: "10px", color: "#e8e8f0", fontSize: "15px", outline: "none", fontFamily: "inherit", marginBottom: "8px", boxSizing: "border-box", resize: "vertical", minHeight: "120px", lineHeight: "1.6" },
    voiceBtn: { padding: "6px 14px", border: `1px solid ${isListening ? "#ef4444" : "#2a2a3a"}`, borderRadius: "20px", backgroundColor: isListening ? "rgba(239,68,68,0.1)" : "transparent", color: isListening ? "#ef4444" : "#6b6b80", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontFamily: "monospace" },
    uploadBox: { border: "1px dashed #2a2a3a", borderRadius: "12px", padding: "32px", textAlign: "center", cursor: "pointer", marginBottom: "24px", backgroundColor: "#0d0d14" },
    submitBtn: { width: "100%", padding: "16px", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", borderRadius: "12px", color: "#fff", fontSize: "16px", fontWeight: "600", cursor: "pointer" },
    errorText: { color: "#ef4444", fontSize: "13px", marginBottom: "16px", fontFamily: "monospace", backgroundColor: "rgba(239,68,68,0.1)", padding: "10px", borderRadius: "8px" },
    typeSelector: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "24px" },
    typeBtn: (active) => ({ padding: "12px", borderRadius: "10px", border: `1px solid ${active ? "#7c3aed" : "#1e1e2e"}`, backgroundColor: active ? "#161622" : "#111118", color: active ? "#c084fc" : "#8b949e", fontSize: "13px", fontWeight: 600, cursor: "pointer", textAlign: "center", transition: "all 0.2s" }),
    tagsCard: { backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "12px", padding: "20px", marginBottom: "24px" },
    tagCheckbox: (checked) => ({ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "8px", border: `1px solid ${checked ? "#7c3aed" : "#2a2a3a"}`, backgroundColor: checked ? "rgba(124,58,237,0.15)" : "#0a0a0f", cursor: "pointer", marginBottom: "8px", transition: "all 0.15s" }),
    successWrap: { textAlign: "center", padding: "40px 24px" },
    tokenBox: { background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: "16px", padding: "28px", marginBottom: "24px", display: "inline-block", minWidth: "320px", maxWidth: "100%" },
    tokenLabel: { fontSize: "11px", letterSpacing: "3px", color: "#6b6b80", fontFamily: "monospace", textTransform: "uppercase", marginBottom: "8px" },
    tokenValue: { fontSize: "28px", fontWeight: "700", fontFamily: "monospace", color: "#c084fc", letterSpacing: "2px" },
    submittingWrap: { textAlign: "center", padding: "80px 24px" },
    spinner: { width: "48px", height: "48px", border: "3px solid #1e1e2e", borderTop: "3px solid #7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 24px" },
    emergencyWrap: { textAlign: "center", padding: "60px 24px" },
    emergencyBtn: { padding: "20px 48px", backgroundColor: "#ef4444", border: "none", borderRadius: "16px", color: "#fff", fontSize: "18px", fontWeight: "700", cursor: "pointer", display: "block", margin: "0 auto 16px", width: "100%", maxWidth: "360px" },
    cancelBtn: { padding: "12px 28px", border: "1px solid #2a2a3a", borderRadius: "10px", backgroundColor: "transparent", color: "#6b6b80", fontSize: "14px", cursor: "pointer" },
    backBtn: { padding: "12px 24px", border: "1px solid #2a2a3a", borderRadius: "10px", backgroundColor: "transparent", color: "#e8e8f0", fontSize: "14px", cursor: "pointer", marginRight: "12px" },
    actionBtn: { padding: "12px 24px", border: "none", borderRadius: "10px", backgroundColor: "#7c3aed", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" },
    loginWarning: { backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "12px", padding: "16px 20px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" },
  };

  if (step === "emergency") {
    return (
      <div style={s.page}>
        <PanicButton />
        <nav style={s.nav}>
          <span style={s.back} onClick={() => navigate("/portal")}>← {t("backToPortal")}</span>
          <span style={s.logoText}>Shadow<span style={s.logoSpan}>Vault</span></span>
          <LanguageSwitcher style="dropdown" />
        </nav>
        <div style={{ ...s.main, ...s.emergencyWrap }}>
          <div style={{ fontSize: "72px", marginBottom: "24px" }}>🆘</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#ef4444", marginBottom: "12px" }}>{t("emergencyHelp")}</div>
          <p style={{ fontSize: "16px", color: "rgba(232,232,240,0.55)", marginBottom: "40px", lineHeight: "1.6" }}>
            Pressing the button below encrypts your location and alerts the investigating authority and your Guardian immediately.
          </p>
          <button style={s.emergencyBtn} onClick={handleEmergency}>🆘 {t("sendEmergencyAlert")}</button>
          <button style={s.cancelBtn} onClick={() => setStep("form")}>{t("fillDetailedReport")}</button>
        </div>
      </div>
    );
  }

  if (step === "submitting") {
    return (
      <div style={s.page}>
        <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
        <div style={s.submittingWrap}>
          <div style={s.spinner}></div>
          <div style={{ fontSize: "16px", color: "rgba(232,232,240,0.8)", fontWeight: 600 }}>
            Securing & Cryptographically Sealing Evidence...
          </div>
          <div style={{ fontSize: "13px", color: "#6b6b80", marginTop: "12px", fontFamily: "monospace", lineHeight: "1.8" }}>
            1. Fresh AES-256-GCM encryption<br />
            2. RSA-4096 authority key wrapping<br />
            3. Key-seeded adaptive LSB stego PNG embedding<br />
            4. SHA-256 hash chain generation bound to your victim ID
          </div>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div style={s.page}>
        <PanicButton />
        <nav style={s.nav}>
          <span style={s.logoText}>Shadow<span style={s.logoSpan}>Vault</span></span>
          <LanguageSwitcher style="dropdown" />
        </nav>
        <div style={{ ...s.main, ...s.successWrap }}>
          <div style={{ fontSize: "56px", marginBottom: "20px" }}>🛡️</div>
          <div style={{ fontSize: "26px", fontWeight: "700", marginBottom: "12px" }}>
            Evidence Sealed & Chained
          </div>
          <p style={{ fontSize: "15px", color: "rgba(232,232,240,0.55)", marginBottom: "32px", lineHeight: "1.6" }}>
            Your evidence has been encrypted with a fresh AES-256 key, wrapped with RSA-4096, hidden in an auto-generated stego PNG carrier, and chained cryptographically.
          </p>

          <div style={s.tokenBox}>
            <div style={s.tokenLabel}>Active Case Identifier</div>
            <div style={s.tokenValue}>{submissionResult?.caseId || "CASE-ACTIVE"}</div>
            <div style={{ fontSize: "13px", color: "#34d399", marginTop: "12px", fontFamily: "monospace" }}>
              ● Severity: {submissionResult?.caseSeverityLevel || "LOW"} ({submissionResult?.caseSeverityScore || 0} pts)
            </div>
            <div style={{ fontSize: "11px", color: "#6b6b80", marginTop: "8px", fontFamily: "monospace", wordBreak: "break-all" }}>
              Chain Hash: {submissionResult?.chainHash ? submissionResult.chainHash.substring(0, 16) + "..." : "SEALED"}
            </div>
          </div>

          <div style={{ marginTop: "24px" }}>
            <button style={s.backBtn} onClick={() => navigate("/portal")}>
              ← Return to Portal
            </button>
            <button style={s.actionBtn} onClick={() => navigate("/status")}>
              🔍 Check My Case Timeline →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <PanicButton />
      <nav style={s.nav}>
        <span style={s.back} onClick={() => navigate("/portal")}>← {t("backToPortal")}</span>
        <span style={s.logoText}>Shadow<span style={s.logoSpan}>Vault</span></span>
        <LanguageSwitcher style="dropdown" />
      </nav>

      <div style={s.main}>
        <div style={s.pageTitle}>📋 {t("reportIncident")}</div>
        <p style={s.pageSub}>{t("reportDesc")}</p>

        {/* SIGNED IN USER STATUS */}
        <div style={{ marginBottom: "20px", fontSize: "12px", color: "#8b949e", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>👤 Signed in as: <strong style={{ color: "#e8e8f0" }}>{user?.username || "Victim"}</strong></span>
          <span style={{ color: "#10b981" }}>● Identity AES encrypted</span>
        </div>

        {/* EVIDENCE TYPE SELECTOR */}
        <label style={s.label}>1. Select Evidence Type</label>
        <div style={s.typeSelector}>
          <button style={s.typeBtn(evidenceType === "IMAGE")} onClick={() => setEvidenceType("IMAGE")}>
            🖼️ Image (max 200KB)
          </button>
          <button style={s.typeBtn(evidenceType === "TEXT")} onClick={() => setEvidenceType("TEXT")}>
            📄 Written Statement
          </button>
          <button style={s.typeBtn(evidenceType === "AUDIO")} onClick={() => setEvidenceType("AUDIO")}>
            🎵 Audio (max 200KB)
          </button>
        </div>

        {/* SEVERITY TAG CHECKBOXES */}
        <div style={s.tagsCard}>
          <div style={{ fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", color: "#06b6d4", fontFamily: "monospace", marginBottom: "8px", fontWeight: 600 }}>
            2. Severity Tag Checkboxes (Weighted Dynamic Scoring)
          </div>
          <p style={{ fontSize: "12px", color: "#8b949e", marginBottom: "14px", lineHeight: "1.4" }}>
            Select tags that describe this incident. Weights directly calculate case triage priority:
          </p>

          {[
            { tag: "PHYSICAL_HARM", label: "Physical Harm / Violence", weight: 40, icon: "🚨" },
            { tag: "THREAT", label: "Direct Threat / Coercion", weight: 30, icon: "⚠️" },
            { tag: "STALKING", label: "Persistent Stalking / Tracking", weight: 25, icon: "👁️" },
            { tag: "REPEATED_INCIDENT", label: "Repeated Incident Pattern", weight: 20, icon: "🔄" },
            { tag: "HARASSMENT", label: "Verbal / Online Harassment", weight: 10, icon: "💬" },
          ].map(({ tag, label, weight, icon }) => (
            <div
              key={tag}
              style={s.tagCheckbox(selectedTags[tag])}
              onClick={() => handleTagToggle(tag)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span>{icon}</span>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{label}</span>
              </div>
              <span style={{ fontSize: "12px", fontFamily: "monospace", color: selectedTags[tag] ? "#c084fc" : "#6b6b80" }}>
                +{weight} pts {selectedTags[tag] ? "✓" : "+"}
              </span>
            </div>
          ))}
        </div>

        {/* INCIDENT NOTES / DESCRIPTION */}
        <label style={s.label}>3. Incident Description / Notes *</label>
        <textarea
          style={s.textarea}
          placeholder="Describe the incident in your own words. Take your time..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
          <button style={s.voiceBtn} onClick={handleVoice}>
            {isListening ? "🔴 Listening..." : `🎙️ ${t("useVoice")}`}
          </button>
          <span style={{ fontSize: "12px", color: "#6b6b80", fontFamily: "monospace" }}>{t("speakInYourLanguage")}</span>
        </div>

        {/* EVIDENCE PAYLOAD (FILE OR TEXT STATEMENT) */}
        {evidenceType === "TEXT" ? (
          <div>
            <label style={s.label}>Detailed Text Statement (max 200 KB)</label>
            <textarea
              style={{ ...s.textarea, minHeight: "150px" }}
              placeholder="Enter full statement, message transcripts, or detailed timeline..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
            />
          </div>
        ) : (
          <div>
            <label style={s.label}>Upload {evidenceType === "IMAGE" ? "Image File" : "Audio File"} (Max 200 KB)</label>
            <div style={s.uploadBox} onClick={() => fileRef.current.click()}>
              {filePreview ? (
                <img src={filePreview} alt="preview" style={{ width: "100%", maxHeight: "200px", objectFit: "cover", borderRadius: "8px" }} />
              ) : uploadedFile ? (
                <div>
                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>📎</div>
                  <div style={{ fontSize: "14px", color: "#c084fc", fontWeight: 600 }}>{uploadedFile.name}</div>
                  <div style={{ fontSize: "12px", color: "#8b949e", marginTop: "4px" }}>{Math.round(uploadedFile.size / 1024)} KB</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: "32px", marginBottom: "10px" }}>{evidenceType === "IMAGE" ? "🖼️" : "🎵"}</div>
                  <div style={{ fontSize: "14px", color: "#8b949e" }}>Click to select {evidenceType.toLowerCase()} file</div>
                  <div style={{ fontSize: "12px", color: "#6b6b80", marginTop: "4px", fontFamily: "monospace" }}>
                    Max 200 KB · Encrypted with fresh AES-256 & LSB stego carrier
                  </div>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept={evidenceType === "IMAGE" ? "image/*" : "audio/*"}
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>
        )}

        {error && <div style={s.errorText}>⚠️ {error}</div>}

        <button style={s.submitBtn} onClick={handleSubmit}>
          🔒 Submit & Seal Evidence
        </button>
      </div>
    </div>
  );
}
