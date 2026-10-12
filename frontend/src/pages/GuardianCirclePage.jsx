import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PanicButton from "../components/PanicButton";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useLanguage } from "../context/LanguageContext";
import { addGuardian, listGuardians, removeGuardian, generateShares } from "../services/guardianApi";

const DEFAULT_THRESHOLD = 3;

export default function GuardianCirclePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [token] = useState(() => {
    try {
      return localStorage.getItem("sv-token") || null;
    } catch {
      return null;
    }
  });
  const [guardians, setGuardians] = useState([]);
  const [label, setLabel] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!token) return;
    listGuardians(token).then(setGuardians).catch(() => {});
  }, [token]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!label.trim()) return;
    setLoading(true);
    try {
      const result = await addGuardian({ token, guardianLabel: label, contactMethod: contact });
      setGuardians((prev) => [...prev, { guardianId: result.guardianId, guardianLabel: label, contactMethod: contact, shareIssued: false }]);
      setLabel("");
      setContact("");
    } catch {
      toast.error("Could not add guardian right now. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (guardianId) => {
    try {
      await removeGuardian(guardianId);
      setGuardians((prev) => prev.filter((g) => g.guardianId !== guardianId));
    } catch {
      toast.error("Could not remove guardian right now.");
    }
  };

  const handleGenerate = async () => {
    if (guardians.length < DEFAULT_THRESHOLD) return;
    setGenerating(true);
    try {
      await generateShares({ token, threshold: DEFAULT_THRESHOLD });
      toast.success("Shares generated. Share the printed codes with each guardian in person.");
      const updated = await listGuardians(token);
      setGuardians(updated);
    } catch {
      toast.error("Could not generate shares right now. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  const s = {
    page: { minHeight: "100vh", backgroundColor: "#0a0a0f", color: "#e8e8f0", fontFamily: "'Inter','Segoe UI',sans-serif" },
    nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", borderBottom: "1px solid #1e1e2e" },
    back: { fontSize: "13px", color: "#6b6b80", cursor: "pointer" },
    logoText: { fontSize: "18px", fontWeight: "700" },
    logoSpan: { color: "#7c3aed" },
    main: { maxWidth: "560px", margin: "0 auto", padding: "48px 24px" },
    title: { fontSize: "26px", fontWeight: "700", marginBottom: "10px" },
    desc: { fontSize: "14px", color: "rgba(232,232,240,0.55)", lineHeight: "1.6", marginBottom: "32px" },
    form: { display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" },
    input: { flex: "1 1 160px", backgroundColor: "#111118", border: "1px solid #2a2a3a", borderRadius: "10px", color: "#e8e8f0", padding: "12px 14px", fontSize: "14px", outline: "none" },
    addBtn: { padding: "12px 20px", backgroundColor: "#7c3aed", border: "none", borderRadius: "10px", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
    list: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" },
    row: { display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "12px", padding: "14px 16px" },
    rowLabel: { fontSize: "14px", fontWeight: "600" },
    rowContact: { fontSize: "12px", color: "#6b6b80", marginTop: "2px" },
    removeBtn: { fontSize: "12px", color: "#ef4444", background: "none", border: "none", cursor: "pointer" },
    empty: { fontSize: "13px", color: "#4b4b60", fontStyle: "italic", padding: "20px 0" },
    genBtn: { width: "100%", padding: "14px", backgroundColor: guardians.length >= DEFAULT_THRESHOLD ? "#10b981" : "#1a1a2e", border: `1px solid ${guardians.length >= DEFAULT_THRESHOLD ? "#10b981" : "#2a2a3a"}`, borderRadius: "12px", color: guardians.length >= DEFAULT_THRESHOLD ? "#fff" : "#4b4b60", fontSize: "14px", fontWeight: "600", cursor: guardians.length >= DEFAULT_THRESHOLD ? "pointer" : "not-allowed" },
    note: { fontSize: "12px", color: "#4b4b60", fontFamily: "monospace", marginTop: "12px", textAlign: "center" },
  };

  return (
    <div style={s.page}>
      <PanicButton />
      <nav style={s.nav}>
        <span style={s.back} onClick={() => navigate("/portal")}>{t("backToPortal")}</span>
        <span style={s.logoText}>Shadow<span style={s.logoSpan}>Vault</span></span>
        <LanguageSwitcher style="dropdown" />
      </nav>

      <div style={s.main}>
        <div style={s.title}>{t("guardianCircleTitle")}</div>
        <p style={s.desc}>{t("guardianCircleDesc")}</p>

        <form style={s.form} onSubmit={handleAdd}>
          <input
            style={s.input}
            placeholder={t("guardianLabelPlaceholder")}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <input
            style={s.input}
            placeholder={t("guardianContactPlaceholder")}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
          <button style={s.addBtn} type="submit" disabled={loading}>
            {loading ? "..." : t("addGuardian")}
          </button>
        </form>

        <div style={s.list}>
          {guardians.length === 0 && <div style={s.empty}>{t("noGuardiansYet")}</div>}
          {guardians.map((g) => (
            <div key={g.guardianId} style={s.row}>
              <div>
                <div style={s.rowLabel}>{g.guardianLabel}</div>
                {g.contactMethod && <div style={s.rowContact}>{g.contactMethod}</div>}
              </div>
              <button style={s.removeBtn} onClick={() => handleRemove(g.guardianId)}>{t("removeGuardian")}</button>
            </div>
          ))}
        </div>

        <button style={s.genBtn} onClick={handleGenerate} disabled={guardians.length < DEFAULT_THRESHOLD || generating}>
          {generating ? "..." : t("generateShares")}
        </button>
        <div style={s.note}>
          {t("thresholdNote").replace("{threshold}", DEFAULT_THRESHOLD).replace("{total}", guardians.length || DEFAULT_THRESHOLD)}
        </div>
      </div>
    </div>
  );
}
