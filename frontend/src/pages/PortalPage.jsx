import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PanicButton from "../components/PanicButton";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

export default function PortalPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, token, logout } = useAuth();
  const [hoveredCard, setHoveredCard] = useState(null);

  const cards = [
    { id: "evidence", icon: "📋", title: t("reportIncident"), desc: t("reportDesc"), action: t("submitReport"), route: "/evidence" },
    { id: "chat", icon: "💬", title: t("talkToCounselor"), desc: t("chatDesc"), action: t("startChat"), route: "/chat" },
    { id: "status", icon: "🔍", title: t("checkMyCase"), desc: t("statusDesc"), action: t("checkStatus"), route: "/status" },
  ];

  const s = {
    page: { minHeight: "100vh", backgroundColor: "#0a0a0f", color: "#e8e8f0", fontFamily: "'Inter','Segoe UI',sans-serif", display: "flex", flexDirection: "column" },
    nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", borderBottom: "1px solid #1e1e2e" },
    logoWrap: { display: "flex", alignItems: "center", gap: "10px" },
    logoIcon: { width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" },
    logoText: { fontSize: "18px", fontWeight: "700" },
    logoSpan: { color: "#7c3aed" },
    hero: { textAlign: "center", padding: "64px 40px 48px" },
    heroBadge: { display: "inline-block", fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.3)", padding: "5px 14px", borderRadius: "20px", marginBottom: "20px", fontFamily: "monospace" },
    heroTitle: { fontSize: "clamp(32px,5vw,52px)", fontWeight: "700", letterSpacing: "-1px", marginBottom: "16px", lineHeight: "1.1" },
    heroSub: { fontSize: "16px", color: "rgba(232,232,240,0.55)", maxWidth: "480px", margin: "0 auto 12px", lineHeight: "1.6" },
    safeNote: { fontSize: "13px", color: "rgba(16,185,129,0.7)", fontFamily: "monospace" },
    cardsSection: { maxWidth: "900px", margin: "0 auto", padding: "0 40px 80px", width: "100%" },
    cardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "20px" },
    safeBar: { borderTop: "1px solid #1e1e2e", padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "center", gap: "24px", marginTop: "auto", flexWrap: "wrap" },
    safeItem: { display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#4b4b60", fontFamily: "monospace" },
  };

  return (
    <div style={s.page}>
      <PanicButton />

      <nav style={s.nav}>
        <div style={s.logoWrap}>
          <div style={s.logoIcon}>🛡️</div>
          <span style={s.logoText}>Shadow<span style={s.logoSpan}>Vault</span></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <LanguageSwitcher style="dropdown" />
          {token && user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span id="portal-username" style={{ fontSize: "12px", color: "#c084fc", fontWeight: 600, fontFamily: "monospace" }}>
                👤 {user.username}
              </span>
              <button
                id="portal-logout-btn"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                style={{
                  padding: "5px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(239,68,68,0.5)",
                  backgroundColor: "rgba(239,68,68,0.15)",
                  color: "#ef4444",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              id="portal-signin-btn"
              onClick={() => navigate("/login")}
              style={{
                padding: "5px 14px",
                borderRadius: "8px",
                border: "1px solid #7c3aed",
                backgroundColor: "rgba(124,58,237,0.15)",
                color: "#c084fc",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Sign In
            </button>
          )}
          <span style={{ fontSize: "12px", fontFamily: "monospace", padding: "4px 12px", borderRadius: "20px", border: "1px solid #2a2a3a", color: "#6b6b80" }}>🔒 {t("secureSession")}</span>
        </div>
      </nav>

      <div style={s.hero}>
        <div style={s.heroBadge}>{t("youAreSafeHere")}</div>
        <h1 style={s.heroTitle}>{t("yourSafetyYourSilence")}</h1>
        <p style={s.heroSub}>{t("portalDesc")}</p>
        <div style={s.safeNote}>🟢 End-to-end encrypted · Private by default · Close anytime</div>
      </div>

      <div style={s.cardsSection}>
        <div style={s.cardGrid}>
          {cards.map(card => (
            <div key={card.id}
              onMouseEnter={() => setHoveredCard(card.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => navigate(card.route)}
              style={{
                backgroundColor: hoveredCard === card.id ? "#161622" : "#111118",
                border: `1px solid ${hoveredCard === card.id ? "#7c3aed" : "#1e1e2e"}`,
                borderRadius: "16px", padding: "28px", cursor: "pointer",
                transform: hoveredCard === card.id ? "translateY(-2px)" : "none",
                transition: "all 0.2s",
              }}>
              <span style={{ fontSize: "32px", marginBottom: "16px", display: "block" }}>{card.icon}</span>
              <div style={{ fontSize: "17px", fontWeight: "600", marginBottom: "8px" }}>{card.title}</div>
              <div style={{ fontSize: "14px", color: "rgba(232,232,240,0.5)", lineHeight: "1.6", marginBottom: "20px" }}>{card.desc}</div>
              <div style={{ fontSize: "13px", color: "#7c3aed", fontWeight: "500" }}>{card.action}</div>
            </div>
          ))}

          {/* Emergency card */}
          <div
            onMouseEnter={() => setHoveredCard("emergency")}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => navigate("/evidence?emergency=true")}
            style={{
              backgroundColor: hoveredCard === "emergency" ? "#1a0a0a" : "#110a0a",
              border: `1px solid ${hoveredCard === "emergency" ? "#ef4444" : "#2a1515"}`,
              borderRadius: "16px", padding: "28px", cursor: "pointer",
              gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "24px",
              transform: hoveredCard === "emergency" ? "translateY(-2px)" : "none",
              transition: "all 0.2s",
            }}>
            <div style={{ fontSize: "40px" }}>🆘</div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#ef4444", marginBottom: "4px" }}>{t("emergencyTitle")}</div>
              <div style={{ fontSize: "14px", color: "rgba(232,232,240,0.5)" }}>{t("emergencyDesc")}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={s.safeBar}>
        {["🔐 AES-256 Encrypted", "🛡️ Private by Default", "🖼️ Stego Protected", "📵 No Network Trace"].map(item => (
          <div key={item} style={s.safeItem}>{item}</div>
        ))}
      </div>
    </div>
  );
}
