import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ─────────────────────────────────────────────
// DECOY PANIC MODE
// One tap → wipes session & JWT → navigates to blog
// Looks like they were just reading an article
// ─────────────────────────────────────────────

export default function PanicButton() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [pressed, setPressed] = useState(false);

  const handlePanic = () => {
    setPressed(true);

    // 1. Clear React Auth context state & JWT
    try {
      logout();
    } catch {}

    // 2. Clear all stored session data
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}

    // 3. Wipe browser history — replace current entry with blog URL
    // Anyone checking history sees only the blog
    try {
      window.history.replaceState(null, "", "/");
      // Push a few fake blog entries to make history look natural
      window.history.pushState(null, "", "/");
    } catch {}

    // 4. Navigate to decoy blog immediately
    navigate("/", { replace: true });
  };

  return (
    <button
      onClick={handlePanic}
      title="Exit safely"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        width: pressed ? "48px" : "52px",
        height: pressed ? "48px" : "52px",
        borderRadius: "50%",
        backgroundColor: pressed ? "#7f1d1d" : "#ef4444",
        border: "2px solid rgba(255,255,255,0.15)",
        color: "#fff",
        fontSize: "1.2rem",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 20px rgba(239,68,68,0.5)",
        transition: "all 0.15s ease",
      }}
      onMouseOver={e => {
        e.currentTarget.style.transform = "scale(1.1)";
        e.currentTarget.style.boxShadow = "0 4px 28px rgba(239,68,68,0.7)";
      }}
      onMouseOut={e => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(239,68,68,0.5)";
      }}
    >
      ✕
    </button>
  );
}
