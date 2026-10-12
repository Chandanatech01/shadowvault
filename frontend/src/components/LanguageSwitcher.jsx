import { useLanguage, languages } from "../context/LanguageContext";

export default function LanguageSwitcher({ style = "tabs" }) {
  const { lang, changeLang } = useLanguage();

  if (style === "tabs") {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: "4px",
        flexWrap: "wrap",
        padding: "8px 16px",
        backgroundColor: "rgba(0,0,0,0.3)",
        borderRadius: "30px",
        margin: "12px auto",
        width: "fit-content",
      }}>
        {languages.map((l) => (
          <button
            key={l.code}
            onClick={() => changeLang(l.code)}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: lang === l.code ? "1px solid #7c3aed" : "1px solid transparent",
              backgroundColor: lang === l.code ? "rgba(124,58,237,0.2)" : "transparent",
              color: lang === l.code ? "#c084fc" : "#8b949e",
              fontSize: "13px",
              fontWeight: lang === l.code ? "600" : "400",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {l.native}
          </button>
        ))}
      </div>
    );
  }

  // Dropdown style for compact spaces
  return (
    <select
      value={lang}
      onChange={(e) => changeLang(e.target.value)}
      style={{
        padding: "6px 12px",
        borderRadius: "8px",
        border: "1px solid #2a2a3a",
        backgroundColor: "#111118",
        color: "#e8e8f0",
        fontSize: "13px",
        cursor: "pointer",
        outline: "none",
      }}
    >
      {languages.map((l) => (
        <option key={l.code} value={l.code}>
          {l.native} ({l.label})
        </option>
      ))}
    </select>
  );
}
