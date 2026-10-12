import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PanicButton from "../components/PanicButton";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../config";

export default function GuardianPage() {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");

  const isGuardian = user?.role === "ROLE_GUARDIAN";

  useEffect(() => {
    if (!token || !isGuardian) {
      navigate("/login?redirect=/guardian");
      return;
    }
    fetchRequests();
    const timer = setInterval(fetchRequests, 10000);
    return () => clearInterval(timer);
  }, [token, isGuardian]);

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API_BASE}/guardian/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data);
    } catch (err) {
      console.error("Failed to load guardian requests", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId, approve) => {
    try {
      const res = await axios.post(
        `${API_BASE}/guardian/requests/${requestId}/respond`,
        { approve },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActionMsg(approve ? "Access APPROVED by Guardian. Case unlocked for investigating authority." : "Access request REJECTED.");
      fetchRequests();
      setTimeout(() => setActionMsg(""), 4000);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to process request");
    }
  };

  const s = {
    page: { minHeight: "100vh", backgroundColor: "#0a0a0f", color: "#e8e8f0", fontFamily: "'Inter','Segoe UI',sans-serif", display: "flex", flexDirection: "column" },
    nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", borderBottom: "1px solid #1e1e2e" },
    logoText: { fontSize: "18px", fontWeight: "700" },
    logoSpan: { color: "#7c3aed" },
    main: { maxWidth: "800px", margin: "0 auto", padding: "40px 24px 80px", width: "100%", boxSizing: "border-box" },
    header: { marginBottom: "28px" },
    title: { fontSize: "24px", fontWeight: "700", letterSpacing: "-0.5px" },
    sub: { fontSize: "13px", color: "#8b949e", marginTop: "4px" },
    card: { backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "16px", padding: "24px", marginBottom: "20px" },
    reqBox: { backgroundColor: "#161622", border: "1px solid #2a2a3a", borderRadius: "12px", padding: "20px", marginBottom: "16px" },
    approveBtn: (enabled) => ({ padding: "10px 20px", backgroundColor: enabled ? "#10b981" : "#2a2a3a", border: "none", borderRadius: "8px", color: enabled ? "#fff" : "#6b6b80", fontSize: "13px", fontWeight: "600", cursor: enabled ? "pointer" : "not-allowed" }),
    rejectBtn: { padding: "10px 20px", backgroundColor: "#ef4444", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
  };

  return (
    <div style={s.page}>
      <PanicButton />
      <nav style={s.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={s.logoText}>Shadow<span style={s.logoSpan}>Vault</span></span>
          <span style={{ fontSize: "12px", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", padding: "2px 8px", borderRadius: "10px", fontFamily: "monospace" }}>
            GUARDIAN ESCALATION
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "13px", color: "#8b949e" }}>Guardian: <strong>{user?.username}</strong></span>
          <button style={{ padding: "6px 12px", backgroundColor: "#161622", border: "1px solid #2a2a3a", borderRadius: "6px", color: "#e8e8f0", fontSize: "12px", cursor: "pointer" }} onClick={logout}>
            Sign Out
          </button>
        </div>
      </nav>

      <div style={s.main}>
        <div style={s.header}>
          <h1 style={s.title}>🛡️ Trust-Based Guardian Approvals</h1>
          <p style={s.sub}>
            As a designated guardian, you can approve evidence access if the victim is marked unavailable, or if an urgent request has been pending for over 2 minutes.
          </p>
        </div>

        {actionMsg && (
          <div style={{ padding: "12px 16px", borderRadius: "10px", backgroundColor: "rgba(16,185,129,0.2)", border: "1px solid #10b981", color: "#34d399", fontSize: "13px", marginBottom: "20px" }}>
            {actionMsg}
          </div>
        )}

        <div style={s.card}>
          <div style={{ fontSize: "12px", color: "#8b949e", letterSpacing: "1px", textTransform: "uppercase", fontFamily: "monospace", marginBottom: "16px" }}>
            Pending Requests for Your Ward ({requests.length})
          </div>

          {requests.length === 0 ? (
            <div style={{ textAlign: "center", padding: "36px", color: "#6b6b80" }}>
              No pending authority access requests requiring guardian approval.
            </div>
          ) : (
            requests.map((req) => (
              <div key={req.id} style={s.reqBox}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ fontSize: "16px", fontWeight: "700", fontFamily: "monospace", color: "#c084fc" }}>
                    Case: {req.caseId}
                  </div>
                  <span style={{ fontSize: "11px", color: "#f59e0b", fontFamily: "monospace", border: "1px solid rgba(245,158,11,0.3)", padding: "2px 8px", borderRadius: "10px" }}>
                    PENDING APPROVAL
                  </span>
                </div>

                <div style={{ fontSize: "13px", color: "#c9d1d9", marginBottom: "6px" }}>
                  Investigating Authority: <strong>{req.requesterUsername}</strong>
                </div>
                <div style={{ fontSize: "13px", color: "#8b949e", marginBottom: "14px" }}>
                  Reason: {req.reason || "Official investigation"}
                </div>

                {/* ESCALATION STATUS */}
                <div style={{ padding: "10px 14px", backgroundColor: "#0a0a0f", borderRadius: "8px", border: "1px solid #1e1e2e", marginBottom: "16px", fontSize: "12px" }}>
                  {req.victimUnavailable ? (
                    <div style={{ color: "#34d399", fontWeight: 600 }}>
                      ✓ Ward is marked UNAVAILABLE. Guardian authorization is ACTIVE.
                    </div>
                  ) : req.canApprove ? (
                    <div style={{ color: "#34d399", fontWeight: 600 }}>
                      ✓ Request pending over 2 minutes. Urgent guardian escalation is ACTIVE.
                    </div>
                  ) : (
                    <div style={{ color: "#f59e0b" }}>
                      ⏳ Ward is currently available. Auto-escalation activates in {req.secondsRemaining}s if unaddressed.
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    style={s.approveBtn(req.canApprove)}
                    onClick={() => handleRespond(req.id, true)}
                    disabled={!req.canApprove}
                  >
                    ✓ Guardian Approve Access
                  </button>
                  <button
                    style={s.rejectBtn}
                    onClick={() => handleRespond(req.id, false)}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
