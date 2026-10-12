import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useLanguage } from "../context/LanguageContext";

const API_BASE = "http://localhost:8080/api";

export default function DeadMansSwitch({ token }) {
  const { t } = useLanguage();
  const [enabled, setEnabled] = useState(false);
  const [interval, setIntervalHours] = useState(24);
  const [checkedIn, setCheckedIn] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!enabled || !timeLeft) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [enabled]);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleEnable = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/checkin/enable`, { token, intervalHours: interval });
      setEnabled(true);
      setTimeLeft(interval * 3600);
    } catch {
      setEnabled(true);
      setTimeLeft(interval * 3600);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/checkin/reset`, { token });
    } catch { }
    setTimeLeft(interval * 3600);
    setCheckedIn(true);
    setTimeout(() => { setCheckedIn(false); }, 3000);
    setLoading(false);
  };

  const s = {
    wrap: { marginTop: "2rem", backgroundColor: "#0f0f1a", border: "1px solid #2a2a3a", borderRadius: "16px", padding: "1.5rem", maxWidth: "440px", margin: "2rem auto 0", textAlign: "left" },
    header: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" },
    title: { fontSize: "14px", fontWeight: "600", color: "#e8e8f0" },
    badge: { fontSize: "10px", letterSpacing: "2px", color: "#7c3aed", fontFamily: "monospace", textTransform: "uppercase", border: "1px solid rgba(124,58,237,0.3)", padding: "2px 8px", borderRadius: "10px" },
    desc: { fontSize: "13px", color: "rgba(232,232,240,0.45)", lineHeight: "1.6", marginBottom: "1.2rem" },
    row: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" },
    select: { backgroundColor: "#111118", border: "1px solid #2a2a3a", borderRadius: "8px", color: "#e8e8f0", padding: "8px 12px", fontSize: "13px", outline: "none", cursor: "pointer" },
    enableBtn: { padding: "10px 20px", backgroundColor: "#7c3aed", border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: "600", cursor: "pointer", flex: 1 },
    timerWrap: { textAlign: "center", padding: "1rem 0" },
    timerVal: { fontSize: "2rem", fontFamily: "monospace", fontWeight: "700", color: timeLeft < 3600 ? "#ef4444" : "#c084fc", letterSpacing: "2px" },
    timerLabel: { fontSize: "11px", color: "#6b6b80", fontFamily: "monospace", letterSpacing: "1px", marginTop: "4px" },
    checkInBtn: { width: "100%", padding: "14px", backgroundColor: checkedIn ? "#10b981" : "#1a1a2e", border: `1px solid ${checkedIn ? "#10b981" : "#7c3aed"}`, borderRadius: "12px", color: checkedIn ? "#fff" : "#c084fc", fontSize: "15px", fontWeight: "600", cursor: "pointer", marginTop: "1rem", transition: "all 0.2s" },
    note: { fontSize: "11px", color: "#3a3a4a", fontFamily: "monospace", marginTop: "0.75rem", textAlign: "center", lineHeight: "1.6" },
  };

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <span style={{ fontSize: "1.2rem" }}>⏱️</span>
        <span style={s.title}>{t("deadMansSwitch")}</span>
        <span style={s.badge}>{t("safetyFeature")}</span>
      </div>

      <p style={s.desc}>{t("deadManDesc")}</p>

      {!enabled ? (
        <>
          <div style={s.row}>
            <span style={{ fontSize: "13px", color: "#6b6b80" }}>{t("alertIfNoCheckin")}</span>
            <select style={s.select} value={interval} onChange={e => setIntervalHours(Number(e.target.value))}>
              <option value={12}>{t("hours12")}</option>
              <option value={24}>{t("hours24")}</option>
              <option value={48}>{t("hours48")}</option>
            </select>
          </div>
          <button style={s.enableBtn} onClick={handleEnable} disabled={loading}>
            {loading ? "Activating..." : `⚡ ${t("activateSafetyTimer")}`}
          </button>
        </>
      ) : (
        <>
          <div style={s.timerWrap}>
            <div style={s.timerVal}>{timeLeft !== null ? formatTime(timeLeft) : "--:--:--"}</div>
            <div style={s.timerLabel}>{t("timeUntilAutoAlert")}</div>
          </div>

          <button style={s.checkInBtn} onClick={handleCheckIn} disabled={loading}>
            {checkedIn ? `✅ ${t("checkedIn")}` : `👋 ${t("imSafe")}`}
          </button>

          <p style={s.note}>
            {t("tapImSafe")}<br />
            {t("ngoAlertedAuto")}
          </p>
        </>
      )}
    </div>
  );
}
