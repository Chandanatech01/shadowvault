import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PanicButton from "../components/PanicButton";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../config";

export default function AuthorityPage() {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCaseReport, setSelectedCaseReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  const isAuthority = user?.role === "ROLE_AUTHORITY";

  useEffect(() => {
    if (!token || !isAuthority) {
      navigate("/login?redirect=/authority");
      return;
    }
    fetchCases();
  }, [token, isAuthority]);

  const fetchCases = async () => {
    try {
      const res = await axios.get(`${API_BASE}/authority/cases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCases(res.data);
    } catch (err) {
      console.error("Failed to load authority cases", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async (caseId) => {
    try {
      const res = await axios.post(
        `${API_BASE}/authority/cases/${caseId}/request-access`,
        { reason: "Official investigation by legal authority" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActionMsg(`Access requested for ${caseId}. Request forwarded to victim.`);
      fetchCases();
      setTimeout(() => setActionMsg(""), 4000);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to request access");
    }
  };

  const handleViewEvidence = async (caseId) => {
    setReportLoading(true);
    setSelectedCaseReport(null);
    try {
      const res = await axios.get(`${API_BASE}/authority/cases/${caseId}/evidence`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedCaseReport(res.data);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to decrypt and view evidence");
    } finally {
      setReportLoading(false);
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
    logoText: { fontSize: "18px", fontWeight: "700" },
    logoSpan: { color: "#7c3aed" },
    main: { maxWidth: "1050px", margin: "0 auto", padding: "40px 24px 80px", width: "100%", boxSizing: "border-box" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "16px" },
    title: { fontSize: "24px", fontWeight: "700", letterSpacing: "-0.5px" },
    sub: { fontSize: "13px", color: "#8b949e", marginTop: "4px" },
    card: { backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "16px", padding: "24px", marginBottom: "24px" },
    caseRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: "1px solid #1e1e2e", flexWrap: "wrap", gap: "12px" },
    caseId: { fontSize: "16px", fontWeight: "700", fontFamily: "monospace", color: "#c084fc" },
    badge: (color) => ({ padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", backgroundColor: `${color}22`, color: color, border: `1px solid ${color}44` }),
    reqBtn: { padding: "8px 16px", backgroundColor: "#1e1e2e", border: "1px solid #7c3aed", borderRadius: "8px", color: "#c084fc", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
    viewBtn: { padding: "8px 16px", backgroundColor: "#10b981", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
    pendingPill: { padding: "6px 14px", borderRadius: "8px", backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", fontSize: "12px", fontFamily: "monospace" },
    modalOverlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" },
    modalBox: { backgroundColor: "#111118", border: "1px solid #2a2a3a", borderRadius: "16px", maxWidth: "800px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "32px", boxSizing: "border-box" },
    victimBox: { backgroundColor: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: "12px", padding: "20px", marginBottom: "24px" },
    integrityBanner: (valid) => ({ padding: "14px 18px", borderRadius: "10px", backgroundColor: valid ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", border: `1px solid ${valid ? "#10b981" : "#ef4444"}`, color: valid ? "#34d399" : "#f87171", fontWeight: "700", fontSize: "14px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }),
  };

  return (
    <div style={s.page}>
      <PanicButton />
      <nav style={s.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={s.logoText}>Shadow<span style={s.logoSpan}>Vault</span></span>
          <span style={{ fontSize: "12px", color: "#06b6d4", border: "1px solid #06b6d444", padding: "2px 8px", borderRadius: "10px", fontFamily: "monospace" }}>
            AUTHORITY PORTAL
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "13px", color: "#8b949e" }}>Logged in as: <strong>{user?.username}</strong></span>
          <button style={{ padding: "6px 12px", backgroundColor: "#161622", border: "1px solid #2a2a3a", borderRadius: "6px", color: "#e8e8f0", fontSize: "12px", cursor: "pointer" }} onClick={logout}>
            Sign Out
          </button>
        </div>
      </nav>

      <div style={s.main}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>⚖️ Investigation Case Review</h1>
            <p style={s.sub}>
              Cases sorted dynamically by severity. Evidence and victim identity are cryptographically locked until approved.
            </p>
          </div>
        </div>

        {actionMsg && (
          <div style={{ padding: "12px 16px", borderRadius: "10px", backgroundColor: "rgba(16,185,129,0.2)", border: "1px solid #10b981", color: "#34d399", fontSize: "13px", marginBottom: "20px" }}>
            {actionMsg}
          </div>
        )}

        <div style={s.card}>
          <div style={{ fontSize: "12px", color: "#8b949e", letterSpacing: "1px", textTransform: "uppercase", fontFamily: "monospace", marginBottom: "16px" }}>
            Active Cases ({cases.length})
          </div>

          {cases.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px", color: "#6b6b80" }}>
              No cases recorded in the vault yet.
            </div>
          ) : (
            cases.map((c) => (
              <div key={c.id} style={s.caseRow}>
                <div>
                  <div style={s.caseId}>{c.caseId}</div>
                  <div style={{ fontSize: "12px", color: "#8b949e", marginTop: "4px" }}>
                    Evidence Items: <strong>{c.evidenceCount}</strong> · Created: {new Date(c.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div>
                  <span style={s.badge(getSeverityBadgeColor(c.severityLevel))}>
                    ● {c.severityLevel} ({c.severityScore} pts)
                  </span>
                </div>

                <div>
                  {c.accessGranted ? (
                    <button style={s.viewBtn} onClick={() => handleViewEvidence(c.caseId)}>
                      🔓 View Decrypted Evidence
                    </button>
                  ) : c.requestStatus === "PENDING" ? (
                    <span style={s.pendingPill}>⏳ Awaiting Approval</span>
                  ) : (
                    <button style={s.reqBtn} onClick={() => handleRequestAccess(c.caseId)}>
                      🔑 Request Access
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* MODAL FOR DECRYPTED EVIDENCE */}
        {selectedCaseReport && (
          <div style={s.modalOverlay} onClick={() => setSelectedCaseReport(null)}>
            <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div style={{ fontSize: "20px", fontWeight: "700" }}>
                  Case Dossier: <span style={{ color: "#c084fc", fontFamily: "monospace" }}>{selectedCaseReport.caseId}</span>
                </div>
                <button
                  style={{ background: "none", border: "none", color: "#8b949e", fontSize: "20px", cursor: "pointer" }}
                  onClick={() => setSelectedCaseReport(null)}
                >
                  ✕
                </button>
              </div>

              {/* OVERALL INTEGRITY STATUS BANNER */}
              <div style={s.integrityBanner(selectedCaseReport.chainValid)}>
                <span>{selectedCaseReport.chainValid ? "🛡️" : "⚠️"}</span>
                <div>
                  <div>CHAIN STATUS: {selectedCaseReport.overallIntegrity}</div>
                  {!selectedCaseReport.chainValid && (
                    <div style={{ fontSize: "12px", fontWeight: "400", marginTop: "4px" }}>
                      Tampering detected at item #{selectedCaseReport.firstBrokenIndex + 1} (Evidence ID: {selectedCaseReport.firstBrokenId}). All subsequent items compromised.
                    </div>
                  )}
                </div>
              </div>

              {/* VICTIM IDENTITY REVEALED */}
              <div style={s.victimBox}>
                <div style={{ fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: "#c084fc", fontFamily: "monospace", marginBottom: "12px", fontWeight: 700 }}>
                  👤 Victim Identity (Revealed Post-Approval)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
                  <div><span style={{ color: "#8b949e" }}>Full Name: </span><strong>{selectedCaseReport.victimName}</strong></div>
                  <div><span style={{ color: "#8b949e" }}>Phone: </span><strong>{selectedCaseReport.victimPhone}</strong></div>
                  <div><span style={{ color: "#8b949e" }}>Email: </span><strong>{selectedCaseReport.victimEmail}</strong></div>
                  <div><span style={{ color: "#8b949e" }}>Guardian: </span><strong>{selectedCaseReport.guardianName} ({selectedCaseReport.guardianPhone})</strong></div>
                </div>
              </div>

              {/* DECRYPTED EVIDENCE ITEMS */}
              <div style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "#8b949e", marginBottom: "16px", fontFamily: "monospace" }}>
                Decrypted Evidence Chain ({selectedCaseReport.items.length} items)
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {selectedCaseReport.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: "#161622",
                      border: `1px solid ${item.verified ? "#1e1e2e" : "#ef4444"}`,
                      borderRadius: "12px",
                      padding: "18px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 700 }}>
                        Item #{item.sequenceNumber} ({item.evidenceType})
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "6px",
                          backgroundColor: item.verified ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                          color: item.verified ? "#10b981" : "#ef4444",
                          border: `1px solid ${item.verified ? "#10b98144" : "#ef444444"}`,
                        }}
                      >
                        {item.status}
                      </span>
                    </div>

                    {item.failureReason && (
                      <div style={{ padding: "8px 12px", backgroundColor: "rgba(239,68,68,0.1)", borderRadius: "6px", color: "#f87171", fontSize: "12px", marginBottom: "10px" }}>
                        ⚠️ {item.failureReason}
                      </div>
                    )}

                    <div style={{ fontSize: "13px", color: "#e8e8f0", backgroundColor: "#0a0a0f", padding: "12px", borderRadius: "8px", border: "1px solid #1e1e2e", marginBottom: "10px", whiteSpace: "pre-wrap" }}>
                      {item.textPreview || "[Binary payload decrypted]"}
                    </div>

                    <div style={{ fontSize: "11px", color: "#6b6b80", fontFamily: "monospace" }}>
                      <div>Content Hash: <span style={{ color: "#06b6d4" }}>{item.contentHash}</span></div>
                      <div>Chain Hash: <span style={{ color: "#c084fc" }}>{item.chainHash}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
