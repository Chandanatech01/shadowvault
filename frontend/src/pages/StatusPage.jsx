import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PanicButton from "../components/PanicButton";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../config";

function StegoThumbnail({ itemId, token }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let objectUrl = null;
    const fetchBlob = async () => {
      try {
        const res = await axios.get(`${API_BASE}/cases/evidence/${itemId}/stego`, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        });
        if (active) {
          objectUrl = URL.createObjectURL(res.data);
          setImgSrc(objectUrl);
        }
      } catch (err) {
        // Fallback or ignore
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchBlob();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [itemId, token]);

  if (loading) {
    return (
      <div style={{ width: "90px", height: "90px", borderRadius: "8px", backgroundColor: "#1e1e2e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "#6b6b80" }}>
        Loading...
      </div>
    );
  }

  if (!imgSrc) {
    return (
      <div style={{ width: "90px", height: "90px", borderRadius: "8px", backgroundColor: "#161622", border: "1px dashed #3a3a4c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
        🖼️
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt="Stego carrier preview"
      style={{
        width: "90px",
        height: "90px",
        objectFit: "cover",
        borderRadius: "8px",
        border: "1px solid #7c3aed44",
        boxShadow: "0 2px 8px rgba(0,0,0,0.4)"
      }}
    />
  );
}

export default function StatusPage() {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState(null);
  const [unavailable, setUnavailable] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [tamperLoading, setTamperLoading] = useState(false);

  // Stego proof visibility per item
  const [showProofMap, setShowProofMap] = useState({});

  // Decrypt modal state
  const [decryptModalItem, setDecryptModalItem] = useState(null);
  const [decryptPassword, setDecryptPassword] = useState("");
  const [decryptLoading, setDecryptLoading] = useState(false);
  const [decryptError, setDecryptError] = useState("");
  const [decryptResult, setDecryptResult] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/login?redirect=/status");
      return;
    }
    fetchCaseStatus();
  }, [token]);

  const fetchCaseStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE}/cases/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCaseData(res.data);
      setUnavailable(res.data.unavailable);
    } catch (err) {
      console.error("Failed to load case status", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUnavailable = async () => {
    try {
      const res = await axios.post(`${API_BASE}/auth/toggle-availability`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnavailable(res.data.unavailable);
      setActionMsg(res.data.message);
      setTimeout(() => setActionMsg(""), 4000);
    } catch (err) {
      alert("Failed to toggle availability status");
    }
  };

  const handleRespondRequest = async (requestId, approve) => {
    try {
      await axios.post(
        `${API_BASE}/cases/requests/${requestId}/respond`,
        { approve },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActionMsg(approve ? "Access request APPROVED. Authority can now inspect decrypted evidence." : "Access request REJECTED.");
      fetchCaseStatus();
      setTimeout(() => setActionMsg(""), 4000);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to respond to request");
    }
  };

  const handleSimulateTamper = async () => {
    setTamperLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/dev/tamper-latest`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActionMsg(`⚠️ Simulated Tampering: ${res.data.message}`);
      fetchCaseStatus();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to simulate tampering");
    } finally {
      setTamperLoading(false);
    }
  };

  const handleDownloadStego = async (item) => {
    try {
      const res = await axios.get(`${API_BASE}/cases/evidence/${item.id}/stego`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "image/png" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `photo_${item.id}.png`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download stego image: " + (err.response?.data?.error || err.message));
    }
  };

  const handleOpenDecryptModal = (item) => {
    setDecryptModalItem(item);
    setDecryptPassword("");
    setDecryptError("");
    setDecryptResult(null);
  };

  const handleCloseDecryptModal = () => {
    setDecryptModalItem(null);
    setDecryptPassword("");
    setDecryptError("");
    setDecryptResult(null);
  };

  const handleDecryptSubmit = async (e) => {
    e.preventDefault();
    if (!decryptPassword) {
      setDecryptError("Please enter your login password");
      return;
    }
    setDecryptLoading(true);
    setDecryptError("");
    try {
      const res = await axios.post(
        `${API_BASE}/cases/evidence/${decryptModalItem.id}/decrypt`,
        { password: decryptPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDecryptResult(res.data);
    } catch (err) {
      setDecryptError(err.response?.data?.error || "Decryption failed. Please check your password.");
    } finally {
      setDecryptLoading(false);
    }
  };

  const toggleStegoProof = (id) => {
    setShowProofMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getSeverityBadgeColor = (level) => {
    switch (level) {
      case "LOW": return "#10b981";
      case "MEDIUM": return "#f59e0b";
      case "HIGH": return "#f97316";
      case "CRITICAL": return "#ef4444";
      default: return "#06b6d4";
    }
  };

  const s = {
    page: { minHeight: "100vh", backgroundColor: "#0a0a0f", color: "#e8e8f0", fontFamily: "'Inter','Segoe UI',sans-serif", display: "flex", flexDirection: "column" },
    nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", borderBottom: "1px solid #1e1e2e" },
    back: { fontSize: "13px", color: "#6b6b80", cursor: "pointer" },
    logoText: { fontSize: "18px", fontWeight: "700" },
    logoSpan: { color: "#7c3aed" },
    main: { maxWidth: "860px", margin: "0 auto", padding: "40px 24px 80px", width: "100%", boxSizing: "border-box" },
    headerCard: { backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "16px", padding: "28px", marginBottom: "24px" },
    topRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "20px" },
    caseId: { fontSize: "24px", fontWeight: "700", fontFamily: "monospace", color: "#c084fc", letterSpacing: "1px" },
    statusBadge: (color) => ({ display: "inline-block", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", backgroundColor: `${color}22`, color: color, border: `1px solid ${color}44` }),
    controlsRow: { display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", marginTop: "16px" },
    toggleBtn: (active) => ({ padding: "10px 18px", borderRadius: "10px", border: `1px solid ${active ? "#ef4444" : "#2a2a3a"}`, backgroundColor: active ? "rgba(239,68,68,0.15)" : "#161622", color: active ? "#ef4444" : "#e8e8f0", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }),
    tamperBtn: { padding: "10px 18px", borderRadius: "10px", border: "1px solid #dc2626", backgroundColor: "rgba(220,38,38,0.1)", color: "#f87171", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" },
    addBtn: { padding: "10px 18px", borderRadius: "10px", border: "none", backgroundColor: "#7c3aed", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" },
    sectionLabel: { fontSize: "13px", letterSpacing: "2px", textTransform: "uppercase", color: "#8b949e", fontFamily: "monospace", marginBottom: "16px", fontWeight: 600 },
    requestCard: { backgroundColor: "#161622", border: "1px solid #7c3aed44", borderRadius: "12px", padding: "18px 20px", marginBottom: "16px" },
    actionRow: { display: "flex", gap: "10px", marginTop: "12px" },
    approveBtn: { padding: "8px 18px", backgroundColor: "#10b981", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
    rejectBtn: { padding: "8px 18px", backgroundColor: "#ef4444", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
    timelineList: { display: "flex", flexDirection: "column", gap: "16px" },
    timelineCard: { backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "14px", padding: "20px" },
    monoHash: { fontFamily: "monospace", fontSize: "12px", color: "#06b6d4", wordBreak: "break-all" },
    tagPill: { display: "inline-block", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, backgroundColor: "rgba(124,58,237,0.15)", color: "#c084fc", marginRight: "6px", marginBottom: "4px" },
    alertBanner: { padding: "12px 16px", borderRadius: "10px", backgroundColor: "rgba(124,58,237,0.2)", border: "1px solid #7c3aed", color: "#e8e8f0", fontSize: "13px", marginBottom: "20px" },
    btnSmall: { padding: "8px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", transition: "all 0.15s ease", border: "none" },
    proofPanel: { marginTop: "14px", padding: "16px", borderRadius: "10px", backgroundColor: "#0c0c14", border: "1px solid #2d2248" },
    modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" },
    modalCard: { backgroundColor: "#141420", border: "1px solid #7c3aed66", borderRadius: "16px", maxWidth: "540px", width: "100%", padding: "28px", boxSizing: "border-box", boxShadow: "0 10px 30px rgba(0,0,0,0.6)" },
  };

  if (loading) {
    return (
      <div style={s.page}>
        <nav style={s.nav}>
          <span style={s.back} onClick={() => navigate("/portal")}>← Back to Portal</span>
          <span style={s.logoText}>Shadow<span style={s.logoSpan}>Vault</span></span>
        </nav>
        <div style={{ ...s.main, textAlign: "center", paddingTop: "80px" }}>Loading case status...</div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <PanicButton />
      <nav style={s.nav}>
        <span style={s.back} onClick={() => navigate("/portal")}>← Back to Portal</span>
        <span style={s.logoText}>Shadow<span style={s.logoSpan}>Vault</span></span>
        <LanguageSwitcher style="dropdown" />
      </nav>

      <div style={s.main}>
        {actionMsg && <div style={s.alertBanner}>{actionMsg}</div>}

        {/* CASE SUMMARY HEADER */}
        <div style={s.headerCard}>
          <div style={s.topRow}>
            <div>
              <div style={{ fontSize: "12px", color: "#6b6b80", fontFamily: "monospace", marginBottom: "4px" }}>CASE IDENTIFIER</div>
              <div style={s.caseId}>{caseData?.caseId || "N/A"}</div>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span style={s.statusBadge(getSeverityBadgeColor(caseData?.severityLevel))}>
                {caseData?.severityLevel || "STANDARD"} PRIORITY
              </span>
              <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#8b949e", border: "1px solid #2a2a3a", padding: "4px 10px", borderRadius: "14px" }}>
                Score: {caseData?.severityScore || 0}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ fontSize: "13px", color: "#8b949e" }}>
              Access Permission:{" "}
              <strong style={{ color: caseData?.accessGranted ? "#10b981" : "#f59e0b" }}>
                {caseData?.accessGranted ? "GRANTED (DECRYPTABLE)" : "RESTRICTED (MASKED)"}
              </strong>
            </div>

            <div style={{ fontSize: "13px", color: "#8b949e" }}>
              Victim Presence:{" "}
              <strong style={{ color: unavailable ? "#ef4444" : "#10b981" }}>
                {unavailable ? "UNAVAILABLE (GUARDIAN ESCALATION ACTIVE)" : "AVAILABLE (DIRECT CONSENT)"}
              </strong>
            </div>
          </div>

          <div style={s.controlsRow}>
            <button
              onClick={handleToggleUnavailable}
              style={s.toggleBtn(unavailable)}
            >
              {unavailable ? "🔴 Mark Self AVAILABLE" : "🛡️ Mark Self UNAVAILABLE"}
            </button>

            <button
              onClick={handleSimulateTamper}
              style={s.tamperBtn}
              disabled={tamperLoading || !caseData?.timeline?.length}
            >
              {tamperLoading ? "Corrupting..." : "🧪 Simulate Hash Chain Tampering"}
            </button>

            <button
              onClick={() => navigate("/victim")}
              style={s.addBtn}
            >
              + Add Evidence
            </button>
          </div>
        </div>

        {/* PENDING ACCESS REQUESTS */}
        {caseData?.requests && caseData.requests.length > 0 && (
          <div style={{ marginBottom: "32px" }}>
            <div style={s.sectionLabel}>⚠️ Official Investigation Access Requests</div>
            {caseData.requests.map((req) => (
              <div key={req.id} style={s.requestCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <span style={{ fontSize: "14px", fontWeight: 600 }}>Requester: {req.requesterUsername}</span>
                    <span style={{ fontSize: "12px", color: "#8b949e", marginLeft: "12px" }}>
                      Status: <strong style={{ color: req.status === "APPROVED" ? "#10b981" : req.status === "REJECTED" ? "#ef4444" : "#f59e0b" }}>{req.status}</strong>
                    </span>
                  </div>
                  <span style={{ fontSize: "11px", color: "#6b6b80", fontFamily: "monospace" }}>
                    {new Date(req.createdAt).toLocaleString()}
                  </span>
                </div>

                {req.reason && (
                  <p style={{ fontSize: "13px", color: "#a5b4fc", margin: "6px 0 12px", lineHeight: "1.4" }}>
                    Reason: "{req.reason}"
                  </p>
                )}

                {req.status === "PENDING" && (
                  <div style={s.actionRow}>
                    <button onClick={() => handleRespondRequest(req.id, true)} style={s.approveBtn}>
                      ✓ Grant Consent (Approve Access)
                    </button>
                    <button onClick={() => handleRespondRequest(req.id, false)} style={s.rejectBtn}>
                      ✕ Reject Access
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TIMELINE OF EVIDENCE ITEMS */}
        <div>
          <div style={s.sectionLabel}>
            📋 Tamper-Evident Hash Chain Timeline ({caseData?.timeline?.length || 0} items)
          </div>

          {(!caseData?.timeline || caseData.timeline.length === 0) ? (
            <div style={{ ...s.timelineCard, textAlign: "center", color: "#6b6b80", padding: "40px" }}>
              No evidence submitted yet. Click <strong>+ Add Evidence</strong> to submit an incident report.
            </div>
          ) : (
            <div style={s.timelineList}>
              {caseData.timeline.map((item, idx) => (
                <div key={item.id} style={s.timelineCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#7c3aed", marginRight: "8px" }}>
                        #{item.sequenceNumber || (idx + 1)}
                      </span>
                      <span style={{ fontSize: "14px", fontWeight: 600 }}>
                        {item.evidenceType === "IMAGE" ? "🖼️ Image File" : item.evidenceType === "AUDIO" ? "🎵 Audio Recording" : "📄 Statement / Text"}
                      </span>
                    </div>

                    <span style={{ fontSize: "11px", color: "#10b981", fontFamily: "monospace", border: "1px solid rgba(16,185,129,0.3)", padding: "2px 8px", borderRadius: "10px" }}>
                      ● {item.status || "CHAIN_LINKED"}
                    </span>
                  </div>

                  {item.description && (
                    <p style={{ fontSize: "13px", color: "#c9d1d9", marginBottom: "12px", lineHeight: "1.5" }}>
                      {item.description}
                    </p>
                  )}

                  {/* SEVERITY TAGS */}
                  <div style={{ marginBottom: "12px" }}>
                    {item.severityTags && item.severityTags.map((tag) => (
                      <span key={tag} style={s.tagPill}>
                        🏷️ {tag}
                      </span>
                    ))}
                    <span style={{ fontSize: "11px", color: "#8b949e", fontFamily: "monospace" }}>
                      Tag Score: +{item.tagScore}
                    </span>
                  </div>

                  {/* CRYPTOGRAPHIC HASH CHAIN PROOF */}
                  <div style={{ backgroundColor: "#0a0a0f", padding: "12px", borderRadius: "8px", border: "1px solid #1e1e2e", fontSize: "11px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <div>
                        <span style={{ color: "#6b6b80" }}>Content Hash: </span>
                        <span style={s.monoHash}>{item.contentHashPrefix}</span>
                      </div>
                      <div>
                        <span style={{ color: "#6b6b80" }}>Chain Hash: </span>
                        <span style={s.monoHash}>{item.chainHashPrefix}</span>
                      </div>
                    </div>
                    <div style={{ marginTop: "4px" }}>
                      <span style={{ color: "#6b6b80" }}>Prev Hash Link: </span>
                      <span style={{ ...s.monoHash, color: item.prevHashPrefix === "GENESIS" ? "#a78bfa" : "#06b6d4" }}>
                        {item.prevHashPrefix}
                      </span>
                    </div>
                  </div>

                  {/* STEGO ACTION BUTTONS */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "14px" }}>
                    <button
                      onClick={() => handleDownloadStego(item)}
                      style={{ ...s.btnSmall, backgroundColor: "#1e1e2e", color: "#e8e8f0", border: "1px solid #2a2a3a" }}
                    >
                      📥 Download hidden image
                    </button>
                    <button
                      onClick={() => handleOpenDecryptModal(item)}
                      style={{ ...s.btnSmall, backgroundColor: "#7c3aed", color: "#ffffff" }}
                    >
                      🔓 Decrypt and view
                    </button>
                    <button
                      onClick={() => toggleStegoProof(item.id)}
                      style={{
                        ...s.btnSmall,
                        backgroundColor: showProofMap[item.id] ? "rgba(124,58,237,0.25)" : "#161622",
                        color: "#a78bfa",
                        border: "1px solid #7c3aed44",
                      }}
                    >
                      🛡️ {showProofMap[item.id] ? "Hide Stego Proof" : "Stego Proof"}
                    </button>
                  </div>

                  {/* STEGO PROOF PANEL */}
                  {showProofMap[item.id] && (
                    <div style={s.proofPanel}>
                      <div style={{ fontWeight: 700, fontSize: "12px", color: "#a78bfa", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>🛡️ Stego Proof Verification</span>
                        <span style={{ color: "#10b981", fontSize: "11px", fontFamily: "monospace" }}>● Hidden with key-seeded adaptive LSB</span>
                      </div>

                      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flexWrap: "wrap" }}>
                        <StegoThumbnail itemId={item.id} token={token} />

                        <div style={{ flex: 1, minWidth: "220px", fontSize: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div>
                            <span style={{ color: "#8b949e" }}>Stego Carrier File: </span>
                            <span style={{ color: "#06b6d4", fontFamily: "monospace" }}>photo_{item.id}.png</span>
                          </div>
                          <div>
                            <span style={{ color: "#8b949e" }}>Payload Size: </span>
                            <span style={{ color: "#e8e8f0", fontFamily: "monospace", fontWeight: 600 }}>
                              {item.payloadSizeBytes ? `${item.payloadSizeBytes} bytes` : "Stored as LONGBLOB in MySQL"}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: "#8b949e" }}>Pixels / Channel Values Modified: </span>
                            <span style={{ color: "#e8e8f0", fontFamily: "monospace", fontWeight: 600 }}>
                              {item.modifiedSlots ? `${item.modifiedSlots} channels` : "Key-seeded adaptive slots"}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: "#8b949e" }}>Carrier Image Dimensions: </span>
                            <span style={{ color: "#e8e8f0", fontFamily: "monospace", fontWeight: 600 }}>
                              {item.imageWidth && item.imageHeight ? `${item.imageWidth} × ${item.imageHeight} px` : "250 × 250 px"}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: "#8b949e" }}>Embedding Engine: </span>
                            <span style={{ color: "#10b981", fontWeight: 600 }}>
                              {item.stegoAlgorithm || "Hidden with key-seeded adaptive LSB"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PASSWORD DECRYPT MODAL */}
      {decryptModalItem && (
        <div style={s.modalOverlay}>
          <div style={s.modalCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#c084fc" }}>
                🔓 Decrypt Evidence #{decryptModalItem.sequenceNumber}
              </div>
              <button
                onClick={handleCloseDecryptModal}
                style={{ background: "none", border: "none", color: "#8b949e", fontSize: "18px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {!decryptResult ? (
              <form onSubmit={handleDecryptSubmit}>
                <p style={{ fontSize: "13px", color: "#8b949e", marginBottom: "16px", lineHeight: "1.5" }}>
                  Enter your login password to extract the envelope from the stego carrier, unwrap the item key, and decrypt your evidence.
                </p>

                {decryptError && (
                  <div style={{ padding: "10px 14px", borderRadius: "8px", backgroundColor: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#fca5a5", fontSize: "12px", marginBottom: "16px" }}>
                    {decryptError}
                  </div>
                )}

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "11px", fontFamily: "monospace", color: "#8b949e", marginBottom: "6px" }}>
                    YOUR LOGIN PASSWORD
                  </label>
                  <input
                    type="password"
                    value={decryptPassword}
                    onChange={(e) => setDecryptPassword(e.target.value)}
                    placeholder="Enter login password"
                    required
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "8px",
                      border: "1px solid #2a2a3a",
                      backgroundColor: "#0d0d14",
                      color: "#fff",
                      fontSize: "14px",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={handleCloseDecryptModal}
                    style={{ padding: "10px 18px", borderRadius: "8px", border: "1px solid #2a2a3a", backgroundColor: "#161622", color: "#8b949e", fontSize: "13px", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={decryptLoading}
                    style={{ padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: "#7c3aed", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                  >
                    {decryptLoading ? "Decrypting..." : "Decrypt & Verify"}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "8px", backgroundColor: "rgba(16,185,129,0.15)", border: "1px solid #10b981", color: "#10b981", fontSize: "13px", fontWeight: 600, marginBottom: "16px" }}>
                  <span>✓</span> Integrity Hash Verified (Unbroken Authenticity)
                </div>

                <div style={{ fontSize: "12px", color: "#8b949e", marginBottom: "12px" }}>
                  Payload Type: <strong style={{ color: "#e8e8f0" }}>{decryptResult.evidenceType}</strong> ({decryptResult.originalFileName || "statement.txt"})
                </div>

                {decryptResult.evidenceType === "TEXT" && (
                  <div style={{ padding: "14px", borderRadius: "8px", backgroundColor: "#0a0a0f", border: "1px solid #1e1e2e", color: "#e8e8f0", fontSize: "13px", fontFamily: "monospace", whiteSpace: "pre-wrap", maxHeight: "250px", overflowY: "auto", marginBottom: "16px" }}>
                    {decryptResult.textData}
                  </div>
                )}

                {decryptResult.evidenceType === "IMAGE" && (
                  <div style={{ textAlign: "center", marginBottom: "16px" }}>
                    <img
                      src={decryptResult.previewUrl}
                      alt="Decrypted evidence preview"
                      style={{ maxWidth: "100%", maxHeight: "280px", borderRadius: "8px", border: "1px solid #1e1e2e" }}
                    />
                  </div>
                )}

                {decryptResult.evidenceType === "AUDIO" && (
                  <div style={{ textAlign: "center", marginBottom: "16px" }}>
                    <audio controls src={decryptResult.previewUrl} style={{ width: "100%" }} />
                  </div>
                )}

                <div style={{ fontSize: "11px", color: "#6b6b80", fontFamily: "monospace", wordBreak: "break-all", marginBottom: "16px" }}>
                  SHA-256: {decryptResult.contentHash}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={handleCloseDecryptModal}
                    style={{ padding: "8px 18px", borderRadius: "8px", border: "none", backgroundColor: "#7c3aed", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
