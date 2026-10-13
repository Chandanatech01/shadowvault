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
  const [selectedRole, setSelectedRole] = useState("VICTIM"); // 'VICTIM', 'GUARDIAN', 'AUTHORITY'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [regSuccess, setRegSuccess] = useState(null);

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
    guardianInviteCode: "",
    department: "",
    authorityAccessCode: "",
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
      setError(err.response?.data?.message || err.response?.data?.error || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side validations
    if (!regForm.fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!regForm.username.trim() || regForm.username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (!regForm.email.trim() || !regForm.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!regForm.password || regForm.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (selectedRole === "VICTIM") {
      if (!regForm.phone.trim()) {
        setError("Phone number is required.");
        return;
      }
    } else if (selectedRole === "GUARDIAN") {
      if (!regForm.phone.trim()) {
        setError("Phone number is required.");
        return;
      }
      if (!regForm.guardianInviteCode.trim()) {
        setError("Victim's Guardian Invite Code is required.");
        return;
      }
    } else if (selectedRole === "AUTHORITY") {
      if (!regForm.department.trim()) {
        setError("Official department name is required.");
        return;
      }
      if (!regForm.authorityAccessCode.trim()) {
        setError("Authority Access Code is required.");
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        role: selectedRole,
        fullName: regForm.fullName.trim(),
        username: regForm.username.trim(),
        email: regForm.email.trim(),
        password: regForm.password,
        phone: regForm.phone.trim(),
        guardianName: regForm.guardianName.trim(),
        guardianPhone: regForm.guardianPhone.trim(),
        guardianInviteCode: regForm.guardianInviteCode.trim(),
        department: regForm.department.trim(),
        authorityAccessCode: regForm.authorityAccessCode.trim(),
      };

      const res = await axios.post(`${API_BASE}/auth/register`, payload);
      if (res.data.token) {
        login(res.data.token, res.data.user);
      }
      setRegSuccess({
        role: selectedRole,
        username: res.data.username || regForm.username.trim(),
        simulatedOtp: res.data.simulatedOtp,
        guardianInviteCode: res.data.guardianInviteCode,
        linkedVictim: res.data.linkedVictim,
        department: res.data.user?.department || regForm.department.trim(),
        message: res.data.message,
      });
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Registration failed. Please check details and try again.");
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
    main: { maxWidth: "480px", margin: "40px auto", padding: "0 20px 80px", width: "100%", boxSizing: "border-box" },
    card: { backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "16px", padding: "32px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" },
    title: { fontSize: "22px", fontWeight: "700", marginBottom: "8px", textAlign: "center" },
    sub: { fontSize: "13px", color: "rgba(232,232,240,0.5)", textAlign: "center", marginBottom: "24px", lineHeight: "1.5" },
    tabs: { display: "flex", backgroundColor: "#0a0a0f", padding: "4px", borderRadius: "10px", marginBottom: "20px", border: "1px solid #1e1e2e" },
    tabBtn: (active) => ({ flex: 1, padding: "9px", borderRadius: "8px", border: "none", backgroundColor: active ? "#7c3aed" : "transparent", color: active ? "#fff" : "#8b949e", fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }),
    roleTabs: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", backgroundColor: "#0a0a0f", padding: "4px", borderRadius: "10px", marginBottom: "20px", border: "1px solid #1e1e2e" },
    roleBtn: (active) => ({ padding: "8px 4px", borderRadius: "8px", border: "none", backgroundColor: active ? "#2563eb" : "transparent", color: active ? "#fff" : "#8b949e", fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }),
    label: { display: "block", fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase", color: "#6b6b80", fontFamily: "monospace", marginBottom: "6px" },
    input: { width: "100%", padding: "11px 14px", backgroundColor: "#0a0a0f", border: "1px solid #2a2a3a", borderRadius: "8px", color: "#e8e8f0", fontSize: "14px", outline: "none", marginBottom: "16px", boxSizing: "border-box" },
    submitBtn: { width: "100%", padding: "14px", backgroundColor: "#7c3aed", border: "none", borderRadius: "10px", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer", marginTop: "8px", transition: "all 0.2s" },
    otpBox: { backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "12px", padding: "20px", textAlign: "center", marginBottom: "20px" },
    otpVal: { fontSize: "28px", fontWeight: "700", fontFamily: "monospace", color: "#34d399", letterSpacing: "4px", margin: "8px 0" },
    errBox: { backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "12px", color: "#ef4444", fontSize: "13px", marginBottom: "16px", textAlign: "center", lineHeight: "1.4" },
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
            {tab === "login" ? "Account Sign In" : "User Registration"}
          </div>
          <p style={s.sub}>
            Private by default. Real cryptographic authentication protecting sensitive civil records.
          </p>

          {regSuccess && (
            <div>
              {regSuccess.role === "VICTIM" && (
                <div style={s.otpBox}>
                  <div style={{ fontSize: "12px", color: "#10b981", fontWeight: 700, letterSpacing: "1px" }}>SIMULATED OTP RECEIVED</div>
                  <div style={s.otpVal}>{regSuccess.simulatedOtp}</div>
                  <div style={{ fontSize: "12px", color: "rgba(232,232,240,0.7)", marginBottom: "16px" }}>
                    Your victim account <strong>{regSuccess.username}</strong> is verified.
                  </div>

                  <div style={{ backgroundColor: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: "10px", padding: "16px", marginTop: "12px", textAlign: "center" }}>
                    <div style={{ fontSize: "11px", letterSpacing: "1.5px", color: "#c084fc", fontWeight: 700, fontFamily: "monospace", textTransform: "uppercase" }}>
                      🛡️ One-Time Guardian Invite Code
                    </div>
                    <div id="guardian-invite-code-display" style={{ fontSize: "24px", fontWeight: 800, fontFamily: "monospace", color: "#f0abfc", letterSpacing: "3px", margin: "10px 0" }}>
                      {regSuccess.guardianInviteCode}
                    </div>
                    <div style={{ fontSize: "12px", color: "rgba(232,232,240,0.8)", lineHeight: "1.5" }}>
                      Give this code to your guardian. They must enter it when registering to link directly to your emergency safety network.
                    </div>
                  </div>

                  <button
                    id="victim-proceed-btn"
                    style={{ ...s.submitBtn, backgroundColor: "#10b981", marginTop: "20px" }}
                    onClick={() => navigate(redirect)}
                  >
                    Proceed to Portal →
                  </button>
                </div>
              )}

              {regSuccess.role === "GUARDIAN" && (
                <div style={{ ...s.otpBox, borderColor: "rgba(6,182,212,0.4)", backgroundColor: "rgba(6,182,212,0.1)" }}>
                  <div style={{ fontSize: "12px", color: "#06b6d4", fontWeight: 700, letterSpacing: "1px" }}>GUARDIAN LINKED SUCCESSFULLY</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#fff", margin: "14px 0" }}>
                    Linked Ward: <span id="linked-ward-display" style={{ color: "#38bdf8", fontFamily: "monospace" }}>{regSuccess.linkedVictim}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(232,232,240,0.7)", lineHeight: "1.5" }}>
                    You can approve evidence access if your ward is marked unavailable or after a 2-minute timeout.
                  </div>
                  <button
                    id="guardian-proceed-btn"
                    style={{ ...s.submitBtn, backgroundColor: "#06b6d4", marginTop: "18px" }}
                    onClick={() => navigate("/guardian")}
                  >
                    Proceed to Guardian Portal →
                  </button>
                </div>
              )}

              {regSuccess.role === "AUTHORITY" && (
                <div style={{ ...s.otpBox, borderColor: "rgba(168,85,247,0.4)", backgroundColor: "rgba(168,85,247,0.1)" }}>
                  <div style={{ fontSize: "12px", color: "#a855f7", fontWeight: 700, letterSpacing: "1px" }}>OFFICIAL AUTHORITY REGISTERED</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#fff", margin: "14px 0" }}>
                    Department: <span style={{ color: "#c084fc" }}>{regSuccess.department}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(232,232,240,0.7)", lineHeight: "1.5" }}>
                    Authorized to inspect case queues, submit access requests, and cryptographically verify evidence chains.
                  </div>
                  <button
                    id="authority-proceed-btn"
                    style={{ ...s.submitBtn, backgroundColor: "#a855f7", marginTop: "18px" }}
                    onClick={() => navigate("/authority")}
                  >
                    Proceed to Authority Dashboard →
                  </button>
                </div>
              )}
            </div>
          )}

          {!regSuccess && (
            <>
              <div style={s.tabs}>
                <button id="tab-login" style={s.tabBtn(tab === "login")} onClick={() => { setTab("login"); setError(""); }}>Login</button>
                <button id="tab-register" style={s.tabBtn(tab === "register")} onClick={() => { setTab("register"); setError(""); }}>Register</button>
              </div>

              {error && <div id="auth-error-box" style={s.errBox}>⚠️ {error}</div>}

              {tab === "login" ? (
                <div>
                  <label style={s.label}>Username or Email</label>
                  <input
                    id="login-username-input"
                    style={s.input}
                    type="text"
                    placeholder="Enter your registered username"
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
                  <label style={s.label}>Select Registration Role</label>
                  <div style={s.roleTabs}>
                    <button
                      type="button"
                      id="role-victim-btn"
                      style={s.roleBtn(selectedRole === "VICTIM")}
                      onClick={() => { setSelectedRole("VICTIM"); setError(""); }}
                    >
                      <span>👤</span> Victim
                    </button>
                    <button
                      type="button"
                      id="role-guardian-btn"
                      style={s.roleBtn(selectedRole === "GUARDIAN")}
                      onClick={() => { setSelectedRole("GUARDIAN"); setError(""); }}
                    >
                      <span>🛡️</span> Guardian
                    </button>
                    <button
                      type="button"
                      id="role-authority-btn"
                      style={s.roleBtn(selectedRole === "AUTHORITY")}
                      onClick={() => { setSelectedRole("AUTHORITY"); setError(""); }}
                    >
                      <span>⚖️</span> Authority
                    </button>
                  </div>

                  <label style={s.label}>Full Name {selectedRole !== "AUTHORITY" && "(AES-256 Encrypted)"}</label>
                  <input
                    id="reg-fullname-input"
                    style={s.input}
                    type="text"
                    placeholder={selectedRole === "AUTHORITY" ? "e.g. Officer Vikram Singh" : "e.g. Priya Sharma"}
                    value={regForm.fullName}
                    onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                    required
                  />

                  {selectedRole === "AUTHORITY" ? (
                    <div>
                      <label style={s.label}>Department / Organization</label>
                      <input
                        id="reg-department-input"
                        style={s.input}
                        type="text"
                        placeholder="e.g. Cyber Crime Investigation Cell"
                        value={regForm.department}
                        onChange={(e) => setRegForm({ ...regForm, department: e.target.value })}
                        required
                      />
                    </div>
                  ) : (
                    <div>
                      <label style={s.label}>Phone Number (AES-256 Encrypted)</label>
                      <input
                        id="reg-phone-input"
                        style={s.input}
                        type="text"
                        placeholder="e.g. +91 98765 43210"
                        value={regForm.phone}
                        onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                        required
                      />
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={s.label}>Username</label>
                      <input
                        id="reg-username-input"
                        style={s.input}
                        type="text"
                        placeholder="Choose username"
                        value={regForm.username}
                        onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label style={s.label}>Email</label>
                      <input
                        id="reg-email-input"
                        style={s.input}
                        type="email"
                        placeholder="user@domain.com"
                        value={regForm.email}
                        onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <label style={s.label}>Password (Min 8 Characters, BCrypt Hashed)</label>
                  <input
                    id="reg-password-input"
                    style={s.input}
                    type="password"
                    placeholder="Enter at least 8 characters"
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    required
                  />

                  {/* ROLE SPECIFIC FIELDS */}
                  {selectedRole === "VICTIM" && (
                    <div style={{ padding: "14px", backgroundColor: "#0a0a0f", borderRadius: "10px", border: "1px solid #1e1e2e", marginBottom: "16px" }}>
                      <div style={{ fontSize: "11px", letterSpacing: "1px", color: "#06b6d4", fontFamily: "monospace", marginBottom: "10px", textTransform: "uppercase" }}>
                        🛡️ Designated Guardian Contact (Optional)
                      </div>
                      <label style={s.label}>Guardian Name</label>
                      <input
                        id="reg-guardian-name-input"
                        style={s.input}
                        type="text"
                        placeholder="e.g. Anita Sharma"
                        value={regForm.guardianName}
                        onChange={(e) => setRegForm({ ...regForm, guardianName: e.target.value })}
                      />

                      <label style={s.label}>Guardian Phone</label>
                      <input
                        id="reg-guardian-phone-input"
                        style={{ ...s.input, marginBottom: "8px" }}
                        type="text"
                        placeholder="e.g. +91 98765 43211"
                        value={regForm.guardianPhone}
                        onChange={(e) => setRegForm({ ...regForm, guardianPhone: e.target.value })}
                      />

                      <div style={{ fontSize: "11px", color: "#6b6b80", lineHeight: "1.4" }}>
                        * A one-time Guardian Invite Code will be generated upon registration. Give it to your guardian to link their account.
                      </div>
                    </div>
                  )}

                  {selectedRole === "GUARDIAN" && (
                    <div style={{ padding: "14px", backgroundColor: "#0a0a0f", borderRadius: "10px", border: "1px solid #1e1e2e", marginBottom: "16px" }}>
                      <div style={{ fontSize: "11px", letterSpacing: "1px", color: "#f59e0b", fontFamily: "monospace", marginBottom: "10px", textTransform: "uppercase" }}>
                        🔑 Victim Linking
                      </div>
                      <label style={s.label}>Victim's Guardian Invite Code (Required)</label>
                      <input
                        id="reg-invite-code-input"
                        style={{ ...s.input, marginBottom: "8px", fontFamily: "monospace", color: "#f0abfc", letterSpacing: "1px" }}
                        type="text"
                        placeholder="e.g. GRD-7X9K2M"
                        value={regForm.guardianInviteCode}
                        onChange={(e) => setRegForm({ ...regForm, guardianInviteCode: e.target.value.toUpperCase() })}
                        required
                      />
                      <div style={{ fontSize: "11px", color: "#6b6b80", lineHeight: "1.4" }}>
                        * Enter the invite code provided by your ward to establish a verified guardian link.
                      </div>
                    </div>
                  )}

                  {selectedRole === "AUTHORITY" && (
                    <div style={{ padding: "14px", backgroundColor: "#0a0a0f", borderRadius: "10px", border: "1px solid #1e1e2e", marginBottom: "16px" }}>
                      <div style={{ fontSize: "11px", letterSpacing: "1px", color: "#a855f7", fontFamily: "monospace", marginBottom: "10px", textTransform: "uppercase" }}>
                        🏛️ Official Verification
                      </div>
                      <label style={s.label}>Authority Access Code (Required)</label>
                      <input
                        id="reg-access-code-input"
                        style={{ ...s.input, marginBottom: "8px", fontFamily: "monospace", color: "#c084fc", letterSpacing: "1px" }}
                        type="password"
                        placeholder="Enter agency authorization code"
                        value={regForm.authorityAccessCode}
                        onChange={(e) => setRegForm({ ...regForm, authorityAccessCode: e.target.value })}
                        required
                      />
                      <div style={{ fontSize: "11px", color: "#6b6b80", lineHeight: "1.4" }}>
                        * Regulated access restricted to authorized personnel (default code: AUTH-2026).
                      </div>
                    </div>
                  )}

                  <button id="register-submit-btn" style={s.submitBtn} type="submit" disabled={loading}>
                    {loading ? "Registering..." : selectedRole === "VICTIM" ? "Register as Victim & Get Invite Code →" : selectedRole === "GUARDIAN" ? "Register & Link as Guardian →" : "Register Official Authority →"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
