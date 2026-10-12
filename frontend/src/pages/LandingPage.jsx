import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useLanguage } from "../context/LanguageContext";
import { SECRET_CODE } from "../config";

const blogPosts = [
  { id: 1, category: "TRAVEL", title: "Morning light in the hills of Coorg", excerpt: "There's something about the mist rolling over coffee plantations at 6am that makes you forget everything else.", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", date: "June 12, 2026", readTime: "4 min read", author: "Meera K." },
  { id: 2, category: "FOOD", title: "The perfect filter coffee ritual", excerpt: "It's not just a drink. It's the brass dabara, the slow pour, the smell that fills the whole kitchen.", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80", date: "June 8, 2026", readTime: "3 min read", author: "Meera K." },
  { id: 3, category: "PHOTOGRAPHY", title: "Shooting street portraits without a telephoto", excerpt: "The best street photos happen when you're close enough to see the subject's eyelashes.", image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80", date: "June 3, 2026", readTime: "6 min read", author: "Meera K." },
  { id: 4, category: "LIFESTYLE", title: "Slow Sundays: a case for doing nothing", excerpt: "No content, no productivity guilt, no screen time goals. Just a window, a book, and Sunday afternoon light.", image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80", date: "May 28, 2026", readTime: "2 min read", author: "Meera K." },
  { id: 5, category: "FOOD", title: "Banana leaf meals and the geometry of serving", excerpt: "Every item has a place. The pickle goes top left. The papad on the right.", image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80", date: "May 21, 2026", readTime: "5 min read", author: "Meera K." },
  { id: 6, category: "TRAVEL", title: "48 hours in Pondicherry: the French quarter on foot", excerpt: "You could spend a whole day just reading the street names. Rue Dumas, Rue Romain Rolland.", image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80", date: "May 15, 2026", readTime: "7 min read", author: "Meera K." },
];

export default function LandingPage() {
  const { t } = useLanguage();
  const [searchValue, setSearchValue] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (searchValue.toLowerCase().trim() === SECRET_CODE && !triggered) {
      setTriggered(true);
      setTimeout(() => navigate("/portal"), 400);
    }
  }, [searchValue, triggered, navigate]);

  const s = {
    page: { minHeight: "100vh", backgroundColor: "#faf9f6", fontFamily: "'Georgia','Times New Roman',serif", color: "#1a1a1a" },
    nav: { borderBottom: "1px solid #e8e3d9", padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px", backgroundColor: "#faf9f6", position: "sticky", top: 0, zIndex: 100 },
    navLeft: { display: "flex", gap: "28px", fontSize: "13px", fontFamily: "'Arial',sans-serif", color: "#555" },
    navLink: { cursor: "pointer", textDecoration: "none", color: "#555" },
    logo: { fontSize: "26px", fontWeight: "700", letterSpacing: "-0.5px", color: "#1a1a1a", position: "absolute", left: "50%", transform: "translateX(-50%)" },
    searchWrap: { position: "relative", display: "flex", alignItems: "center" },
    searchIcon: { position: "absolute", left: "10px", fontSize: "14px", color: "#999", pointerEvents: "none" },
    searchInput: { padding: "7px 12px 7px 32px", fontSize: "13px", border: `1px solid ${searchFocused ? "#aaa" : "#ddd"}`, borderRadius: "20px", backgroundColor: "#f2ede6", outline: "none", width: "180px", fontFamily: "'Arial',sans-serif", color: "#333" },
    hero: { textAlign: "center", padding: "40px 40px 48px", borderBottom: "1px solid #e8e3d9" },
    heroTag: { fontSize: "11px", letterSpacing: "3px", color: "#888", textTransform: "uppercase", fontFamily: "'Arial',sans-serif", marginBottom: "16px" },
    heroTitle: { fontSize: "clamp(36px,6vw,64px)", fontWeight: "700", letterSpacing: "-1px", lineHeight: "1.1", marginBottom: "16px" },
    heroSub: { fontSize: "17px", color: "#666", maxWidth: "480px", margin: "0 auto 24px", lineHeight: "1.6", fontStyle: "italic" },
    categoryRow: { display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" },
    categoryPill: { padding: "6px 16px", border: "1px solid #ddd", borderRadius: "20px", fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Arial',sans-serif", color: "#555", backgroundColor: "transparent" },
    main: { maxWidth: "1100px", margin: "0 auto", padding: "60px 40px" },
    sectionLabel: { fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", color: "#888", fontFamily: "'Arial',sans-serif", marginBottom: "32px", paddingBottom: "12px", borderBottom: "1px solid #e8e3d9" },
    featuredGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", marginBottom: "64px", paddingBottom: "64px", borderBottom: "1px solid #e8e3d9" },
    featuredImg: { width: "100%", height: "320px", objectFit: "cover", display: "block", marginBottom: "20px" },
    listGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "40px" },
    listImg: { width: "100%", height: "200px", objectFit: "cover", display: "block", marginBottom: "16px" },
    postCategory: { fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: "#888", fontFamily: "'Arial',sans-serif", marginBottom: "10px" },
    postTitle: { fontSize: "22px", fontWeight: "700", lineHeight: "1.3", marginBottom: "12px", cursor: "pointer" },
    postExcerpt: { fontSize: "15px", color: "#555", lineHeight: "1.7", marginBottom: "16px" },
    postMeta: { fontSize: "12px", color: "#999", fontFamily: "'Arial',sans-serif", display: "flex", gap: "12px" },
    footer: { borderTop: "1px solid #e8e3d9", padding: "40px", textAlign: "center", marginTop: "80px" },
    footerLogo: { fontSize: "22px", fontWeight: "700", marginBottom: "12px" },
    footerText: { fontSize: "13px", color: "#999", fontFamily: "'Arial',sans-serif", lineHeight: "1.8" },
  };

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div style={s.navLeft}>
          {["Travel", "Food", "Photography"].map(l => <span key={l} style={s.navLink}>{l}</span>)}
        </div>
        <div style={s.logo}>{t("heroTitle")}</div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={s.searchWrap}>
            <span style={s.searchIcon}>🔍</span>
            <input ref={inputRef} style={s.searchInput} type="text" placeholder={t("searchPlaceholder")}
              value={searchValue} onChange={e => setSearchValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && searchValue.toLowerCase().trim() === SECRET_CODE && !triggered) {
                  setTriggered(true);
                  navigate("/portal");
                }
              }}
              onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} autoComplete="off" />
          </div>
          <span style={{ ...s.navLink, fontSize: "13px", fontFamily: "'Arial',sans-serif" }}>About</span>
        </div>
      </nav>

      {/* PROMINENT LANGUAGE SWITCHER */}
      <div style={{ backgroundColor: "#f5f0e8", borderBottom: "1px solid #e8e3d9", padding: "8px 0" }}>
        <LanguageSwitcher style="tabs" />
      </div>

      <div style={s.hero}>
        <div style={s.heroTag}>{t("heroTag")}</div>
        <h1 style={s.heroTitle}>{t("heroTitle")}</h1>
        <p style={s.heroSub}>{t("heroSub")}</p>
        <div style={s.categoryRow}>
          {["All", "Travel", "Food", "Photography", "Lifestyle"].map(cat => (
            <button key={cat} style={s.categoryPill}>{cat}</button>
          ))}
        </div>
      </div>

      <main style={s.main}>
        <div style={s.sectionLabel}>{t("featuredStories")}</div>
        <div style={s.featuredGrid}>
          {blogPosts.slice(0, 2).map(post => (
            <div key={post.id}>
              <img src={post.image} alt={post.title} style={s.featuredImg} />
              <div style={s.postCategory}>{post.category}</div>
              <div style={s.postTitle}>{post.title}</div>
              <p style={s.postExcerpt}>{post.excerpt}</p>
              <div style={s.postMeta}><span>{post.date}</span><span>·</span><span>{post.readTime}</span><span>·</span><span>{post.author}</span></div>
            </div>
          ))}
        </div>
        <div style={s.sectionLabel}>{t("recentPosts")}</div>
        <div style={s.listGrid}>
          {blogPosts.slice(2).map(post => (
            <div key={post.id}>
              <img src={post.image} alt={post.title} style={s.listImg} />
              <div style={s.postCategory}>{post.category}</div>
              <div style={{ ...s.postTitle, fontSize: "18px" }}>{post.title}</div>
              <p style={{ ...s.postExcerpt, fontSize: "14px" }}>{post.excerpt}</p>
              <div style={s.postMeta}><span>{post.date}</span><span>·</span><span>{post.readTime}</span></div>
            </div>
          ))}
        </div>
      </main>

      <footer style={s.footer}>
        <div style={s.footerLogo}>{t("heroTitle")}</div>
        <div style={s.footerText}>A personal journal by Meera K. · Bengaluru, India<br />© 2026 · All rights reserved</div>
      </footer>
    </div>
  );
}