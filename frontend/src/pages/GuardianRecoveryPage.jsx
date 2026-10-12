import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useLanguage } from "../context/LanguageContext";
import { submitShare, getRecoveryStatus } from "../services/guardianApi";

// This page is reached by a GUARDIAN, not the victim — via a link she gives
// them directly (offline), e.g. #/recover?token=SV-XXXX-XX
// It never asks for the victim's identity and never shows evidence content
// until enough guardians have submitted their share.
export default function GuardianRecoveryPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [guardianId, setGuardianId] = useState("");
  const [shareValue, setShareValue] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !guardianId || !shareValue) return;
    setLoading(true);
    try {
      const result = await submitShare({ token, guardianId, shareValue });
      setStatus(result);
      if (result.thresholdMet) {
        toast.success(t("recoveryThresholdMet"));
      } else {
        toast.info(t("recoveryWaiting"));
      }
    } catch {
      toast.error("Could not submit share. Check the code and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!token) return;
    try {
      const result = await getRecoveryStatus(token);
      setStatus(result);
    } catch {
      toast.error("Could not check status right now.");
    }
  };

  const s = {
    page: { minHeight: "100vh", backgroundColor: "#0a0a0f", color: "#e8e8f0", fontFamily: "'Inter','Segoe UI',sans-serif" },
    nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", borderBottom: "1px solid #1e1e2e" },
    back: { fontSize: "13px", color: "#6b6b80", cursor: "pointer" },
    logoText: { fontSize: "18px", fontWeight: "700" },
    logoSpan: { color: "#7c3aed" },
    main: { maxWidth: "480px", margin: "0 auto", padding: "56px 24px" },
    title: { fontSize: "24px", fontWeight: "700", marginBottom: "10px" },
    desc: { fontSize: "14px", color: "rgba(232,232,240,0.55)", lineHeight: "1.6", marginBottom: "28px" },
    label: { fontSize: "12px", color: "#6b6b80", marginBottom: "6px", display: "block" },
    input: { width: "100%", backgroundColor: "#111118", border: "1px solid #2a2a3a", borderRadius: "10px", color: "#e8e8f0", padding: "12px 14px", fontSize: "14px", outline: "none", marginBottom: "18px", boxSizing: "border-box" },
    submitBtn: { width: "100%", padding: "14px", backgroundColor: "#7c3aed", border: "none", borderRadius: "12px", color: "#fff", fontSize: "15px", fontWeight: "600", cursor: "pointer" },
    statusBox: { marginTop: "24px", backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "12px", padding: "16px", fontSize: "13px", color: "rgba(232,232,240,0.7)", textAlign: "center" },
    refreshBtn: { marginTop: "10px", fontSize: "12px", color: "#7c3aed", background: "none", border: "none", cursor: "pointer" },
  };

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <span style={s.back} onClick={() => navigate("/")}>← Home</span>
        <span style={s.logoText}>Shadow<span style={s.logoSpan}>Vault</span></span>
        <LanguageSwitcher style="dropdown" />
      </nav>

      <div style={s.main}>
        <div style={s.title}>{t("recoveryTitle")}</div>
        <p style={s.desc}>{t("recoveryDesc")}</p>

        <form onSubmit={handleSubmit}>
          <label style={s.label}>{t("caseToken")}</label>
          <input style={s.input} value={token} onChange={(e) => setToken(e.target.value)} placeholder="SV-XXXX-XX" />

          <label style={s.label}>Guardian ID</label>
          <input style={s.input} value={guardianId} onChange={(e) => setGuardianId(e.target.value)} placeholder="Given to you by the victim" />

          <label style={s.label}>{t("enterYourShare")}</label>
          <input style={s.input} value={shareValue} onChange={(e) => setShareValue(e.target.value)} placeholder="Your share code" />

          <button style={s.submitBtn} type="submit" disabled={loading}>
            {loading ? "..." : t("submitShare")}
          </button>
        </form>

        {status && (
          <div style={s.statusBox}>
            {t("sharesReceived").replace("{count}", status.sharesReceived ?? "?").replace("{threshold}", status.threshold ?? "?")}
            <br />
            {status.thresholdMet ? t("recoveryThresholdMet") : t("recoveryWaiting")}
            <br />
            <button style={s.refreshBtn} onClick={handleRefresh}>Refresh status</button>
          </div>
        )}
      </div>
    </div>
  );
}
