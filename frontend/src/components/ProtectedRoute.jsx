import { Navigate, useLocation } from "react-router-dom";
import { useAuth, isValidJwt } from "../context/AuthContext";

export default function ProtectedRoute({ children, requiredRole }) {
  const { token, user, logout } = useAuth();
  const location = useLocation();

  if (!token || !isValidJwt(token)) {
    if (token) {
      logout();
    }
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    if (user?.role === "ROLE_AUTHORITY") {
      return <Navigate to="/authority" replace />;
    }
    if (user?.role === "ROLE_GUARDIAN") {
      return <Navigate to="/guardian" replace />;
    }
    return <Navigate to="/portal" replace />;
  }

  return children;
}
