import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PanicButton from "../components/PanicButton";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../config";

export default function StatusPage() {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState(null);
  const [unavailable, setUnavailable] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [tamperLoading, setTamperLoading] = useState(false);

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
              <div style={{ fontSize: "13px", color: "#8b949e", marginTop: "4px" }}>
                Created: {caseData?.createdAt ? new Date(caseData.createdAt).toLocaleString() : "Just now"}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "12px", color: "#6b6b80", fontFamily: "monospace", marginBottom: "4px" }}>DYNAMIC SEVERITY</div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end" }}>
                <span style={s.statusBadge(getSeverityBadgeColor(caseData?.severityLevel))}>
                  ● {caseData?.severityLevel || "LOW"} ({caseData?.severityScore || 0} pts)
                </span>
              </div>
              <div style={{ fontSize: "11px", color: "#6b6b80", marginTop: "4px", fontFamily: "monospace" }}>
                Formula: Tags + 5 per evidence
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #1e1e2e", paddingTop: "16px" }}>
            <div style={s.controlsRow}>
              <button
                style={s.toggleBtn(unavailable)}
                onClick={handleToggleUnavailable}
                title="If marked unavailable, authority access requests can be approved by your designated guardian"
              >
                <span>{unavailable ? "🔴 Unavailable" : "🟢 Available"}</span>
                <span style={{ fontSize: "11px", color: "#8b949e" }}>
                  ({unavailable ? "Escalates to Guardian" : "You review requests"})
                </span>
              </button>

              <button
                style={s.tamperBtn}
                onClick={handleSimulateTamper}
                disabled={tamperLoading || !caseData?.timeline?.length}
                title="Corrupts the latest evidence item to test tamper detection"
              >
                ⚡ Simulate Tampering (Demo)
              </button>

              <button
                style={s.addBtn}
                onClick={() => navigate("/evidence")}
              >
                + Add Evidence
              </button>
            </div>
          </div>
        </div>

        {/* PENDING ACCESS REQUESTS SECTION */}
        {caseData?.requests && caseData.requests.filter(r => r.status === "PENDING").length > 0 && (
          <div style={{ marginBottom: "32px" }}>
            <div style={s.sectionLabel}>⚖️ Pending Authority Access Requests</div>
            {caseData.requests.filter(r => r.status === "PENDING").map(req => (
              <div key={req.id} style={s.requestCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#e8e8f0" }}>
                    Investigation Request from: <span style={{ color: "#c084fc" }}>{req.requesterUsername}</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "#f59e0b", fontFamily: "monospace", border: "1px solid #f59e0b44", padding: "2px 8px", borderRadius: "10px" }}>
                    PENDING APPROVAL
                  </span>
                </div>
                <div style={{ fontSize: "13px", color: "#8b949e", lineHeight: "1.5" }}>
                  Reason: {req.reason || "Official case review"}
                </div>
                <div style={{ fontSize: "12px", color: "#6b6b80", marginTop: "4px", fontFamily: "monospace" }}>
                  Requested: {new Date(req.createdAt).toLocaleString()}
                </div>
                <div style={s.actionRow}>
                  <button style={s.approveBtn} onClick={() => handleRespondRequest(req.id, true)}>
                    ✓ Approve Access
                  </button>
                  <button style={s.rejectBtn} onClick={() => handleRespondRequest(req.id, false)}>
                    ✕ Reject
                  </button>
                </div>
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
                    {item.severityTags && item.severityTags.map(tag => (
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
