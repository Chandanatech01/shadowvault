import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import PanicButton from "../components/PanicButton";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../config";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/portal";
  const { t } = useLanguage();
  const { login } = useAuth();

  const [tab, setTab] = useState("login"); // 'login' or 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registeredOtp, setRegisteredOtp] = useState(null);

  // Login form - blank defaults, no automatic login
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });

  // Register form
  const [regForm, setRegForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    username: "",
    password: "",
    guardianName: "",
    guardianPhone: "",
    guardianUsername: "guardian1",
  });

  const handleLogin = async (overrideCreds) => {
    setError("");
    setLoading(true);
    const creds = overrideCreds || loginForm;
    if (!creds.username || !creds.password) {
      setError("Please enter username and password.");
      setLoading(false);
      return;
    }
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, creds);
      if (res.data.token) {
        login(res.data.token, res.data.user);
        if (res.data.user?.role === "ROLE_AUTHORITY") {
          navigate("/authority");
        } else if (res.data.user?.role === "ROLE_GUARDIAN") {
          navigate("/guardian");
        } else {
          navigate(redirect);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regForm.username || !regForm.password || !regForm.email || !regForm.fullName) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/register`, regForm);
      if (res.data.simulatedOtp) {
        setRegisteredOtp(res.data.simulatedOtp);
        if (res.data.token) {
          login(res.data.token, res.data.user);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const s = {
    page: { minHeight: "100vh", backgroundColor: "#0a0a0f", color: "#e8e8f0", fontFamily: "'Inter','Segoe UI',sans-serif", display: "flex", flexDirection: "column" },
    nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", borderBottom: "1px solid #1e1e2e" },
    back: { fontSize: "13px", color: "#6b6b80", cursor: "pointer" },
    logoText: { fontSize: "18px", fontWeight: "700" },
    logoSpan: { color: "#7c3aed" },
    main: { maxWidth: "460px", margin: "40px auto", padding: "0 20px 80px", width: "100%", boxSizing: "border-box" },
    card: { backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "16px", padding: "32px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" },
    title: { fontSize: "22px", fontWeight: "700", marginBottom: "8px", textAlign: "center" },
    sub: { fontSize: "13px", color: "rgba(232,232,240,0.5)", textAlign: "center", marginBottom: "24px", lineHeight: "1.5" },
    tabs: { display: "flex", backgroundColor: "#0a0a0f", padding: "4px", borderRadius: "10px", marginBottom: "24px", border: "1px solid #1e1e2e" },
    tabBtn: (active) => ({ flex: 1, padding: "9px", borderRadius: "8px", border: "none", backgroundColor: active ? "#7c3aed" : "transparent", color: active ? "#fff" : "#8b949e", fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }),
    label: { display: "block", fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase", color: "#6b6b80", fontFamily: "monospace", marginBottom: "6px" },
    input: { width: "100%", padding: "11px 14px", backgroundColor: "#0a0a0f", border: "1px solid #2a2a3a", borderRadius: "8px", color: "#e8e8f0", fontSize: "14px", outline: "none", marginBottom: "16px", boxSizing: "border-box" },
    submitBtn: { width: "100%", padding: "14px", backgroundColor: "#7c3aed", border: "none", borderRadius: "10px", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer", marginTop: "8px", transition: "all 0.2s" },
    quickRow: { marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #1e1e2e", textAlign: "center" },
    quickTitle: { fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: "#8b949e", fontFamily: "monospace", marginBottom: "12px", fontWeight: 600 },
    demoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" },
    demoBtn: { padding: "10px 6px", backgroundColor: "#161622", border: "1px solid #2a2a3a", borderRadius: "8px", color: "#e8e8f0", fontSize: "11px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" },
    otpBox: { backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "12px", padding: "20px", textAlign: "center", marginBottom: "20px" },
    otpVal: { fontSize: "28px", fontWeight: "700", fontFamily: "monospace", color: "#34d399", letterSpacing: "4px", margin: "8px 0" },
    errBox: { backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px", color: "#ef4444", fontSize: "13px", marginBottom: "16px", textAlign: "center" },
  };

  return (
    <div style={s.page}>
      <PanicButton />
      <nav style={s.nav}>
        <span style={s.back} onClick={() => navigate("/portal")}>← Back to Portal</span>
        <span style={s.logoText}>Shadow<span style={s.logoSpan}>Vault</span></span>
        <LanguageSwitcher style="dropdown" />
      </nav>

      <div style={s.main}>
        <div style={s.card}>
          <div style={s.title}>
            {tab === "login" ? "Account Login" : "Victim Registration"}
          </div>
          <p style={s.sub}>
            Private by default. Your identity is encrypted and revealed only with your approval.
          </p>

          {registeredOtp && (
            <div style={s.otpBox}>
              <div style={{ fontSize: "12px", color: "#10b981", fontWeight: 600 }}>SIMULATED OTP RECEIVED</div>
              <div style={s.otpVal}>{registeredOtp}</div>
              <div style={{ fontSize: "12px", color: "rgba(232,232,240,0.6)" }}>Your account is verified and ready.</div>
              <button
                style={{ ...s.submitBtn, backgroundColor: "#10b981", marginTop: "12px" }}
                onClick={() => navigate(redirect)}
              >
                Proceed to Portal →
              </button>
            </div>
          )}

          {!registeredOtp && (
            <>
              <div style={s.tabs}>
                <button id="tab-login" style={s.tabBtn(tab === "login")} onClick={() => { setTab("login"); setError(""); }}>Login</button>
                <button id="tab-register" style={s.tabBtn(tab === "register")} onClick={() => { setTab("register"); setError(""); }}>Register</button>
              </div>

              {error && <div style={s.errBox}>⚠️ {error}</div>}

              {tab === "login" ? (
                <div>
                  <label style={s.label}>Username or Email</label>
                  <input
                    id="login-username-input"
                    style={s.input}
                    type="text"
                    placeholder="Enter your username"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  />

                  <label style={s.label}>Password</label>
                  <input
                    id="login-password-input"
                    style={s.input}
                    type="password"
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  />

                  <button id="login-submit-btn" style={s.submitBtn} onClick={() => handleLogin()} disabled={loading}>
                    {loading ? "Authenticating..." : "Login →"}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegister}>
                  <label style={s.label}>Full Name (AES Encrypted)</label>
                  <input
                    style={s.input}
                    type="text"
                    placeholder="e.g. Priya Sharma"
                    value={regForm.fullName}
                    onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                    required
                  />

                  <label style={s.label}>Phone Number (AES Encrypted)</label>
                  <input
                    style={s.input}
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    required
                  />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={s.label}>Username</label>
                      <input
                        style={s.input}
                        type="text"
                        placeholder="e.g. victim2"
                        value={regForm.username}
                        onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label style={s.label}>Email</label>
                      <input
                        style={s.input}
                        type="email"
                        placeholder="e.g. victim2@mail.com"
                        value={regForm.email}
                        onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <label style={s.label}>Password</label>
                  <input
                    style={s.input}
                    type="password"
                    placeholder="Choose password"
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    required
                  />

                  <div style={{ padding: "12px", backgroundColor: "#0a0a0f", borderRadius: "10px", border: "1px solid #1e1e2e", marginBottom: "16px" }}>
                    <div style={{ fontSize: "11px", letterSpacing: "1px", color: "#06b6d4", fontFamily: "monospace", marginBottom: "10px", textTransform: "uppercase" }}>
                      🛡️ Designated Guardian Details
                    </div>
                    <label style={s.label}>Guardian Name</label>
                    <input
                      style={s.input}
                      type="text"
                      placeholder="e.g. Anita Sharma"
                      value={regForm.guardianName}
                      onChange={(e) => setRegForm({ ...regForm, guardianName: e.target.value })}
                    />

                    <label style={s.label}>Guardian Phone</label>
                    <input
                      style={{ ...s.input, marginBottom: "0" }}
                      type="text"
                      placeholder="e.g. +91 98765 43211"
                      value={regForm.guardianPhone}
                      onChange={(e) => setRegForm({ ...regForm, guardianPhone: e.target.value })}
                    />
                  </div>

                  <button style={s.submitBtn} type="submit" disabled={loading}>
                    {loading ? "Registering..." : "Register & Generate OTP →"}
                  </button>
                </form>
              )}

              {/* DEMO ACCOUNTS QUICK SWITCH */}
              <div style={s.quickRow}>
                <div style={s.quickTitle}>Demo accounts</div>
                <div style={s.demoGrid}>
                  <button
                    id="demo-victim1-btn"
                    style={s.demoBtn}
                    onClick={() => handleLogin({ username: "victim1", password: "demo123" })}
                  >
                    <span>👤</span>
                    <span style={{ fontWeight: 600 }}>victim1</span>
                    <span style={{ color: "#6b6b80", fontSize: "10px" }}>Victim</span>
                  </button>
                  <button
                    id="demo-authority1-btn"
                    style={s.demoBtn}
                    onClick={() => handleLogin({ username: "authority1", password: "demo123" })}
                  >
                    <span>⚖️</span>
                    <span style={{ fontWeight: 600 }}>authority1</span>
                    <span style={{ color: "#6b6b80", fontSize: "10px" }}>Authority</span>
                  </button>
                  <button
                    id="demo-guardian1-btn"
                    style={s.demoBtn}
                    onClick={() => handleLogin({ username: "guardian1", password: "demo123" })}
                  >
                    <span>🛡️</span>
                    <span style={{ fontWeight: 600 }}>guardian1</span>
                    <span style={{ color: "#6b6b80", fontSize: "10px" }}>Guardian</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
