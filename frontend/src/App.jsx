import { HashRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import PortalPage from "./pages/PortalPage";
import EvidencePage from "./pages/EvidencePage";
import StatusPage from "./pages/StatusPage";
import AuthorityPage from "./pages/AuthorityPage";
import GuardianPage from "./pages/GuardianPage";
import LoginPage from "./pages/LoginPage";
import GuardianCirclePage from "./pages/GuardianCirclePage";
import GuardianRecoveryPage from "./pages/GuardianRecoveryPage";

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/portal" element={<PortalPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Mandatory Route Guards */}
            <Route
              path="/evidence"
              element={
                <ProtectedRoute requiredRole="ROLE_VICTIM">
                  <EvidencePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/status"
              element={
                <ProtectedRoute requiredRole="ROLE_VICTIM">
                  <StatusPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/authority"
              element={
                <ProtectedRoute requiredRole="ROLE_AUTHORITY">
                  <AuthorityPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/guardian"
              element={
                <ProtectedRoute requiredRole="ROLE_GUARDIAN">
                  <GuardianPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/chat"
              element={
                <div style={{ backgroundColor: "#0a0a0f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ color: "#444", fontFamily: "system-ui,sans-serif" }}>Covert chat — coming soon.</p>
                </div>
              }
            />

            {/* Preserved routes for backward-compatibility */}
            <Route path="/guardians" element={<GuardianCirclePage />} />
            <Route path="/recover" element={<GuardianRecoveryPage />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
