import { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export function isValidJwt(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.trim().split('.');
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    try {
      const saved = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (saved && isValidJwt(saved)) {
        return saved;
      }
      // If missing or invalid, purge any stale values
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      return null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const savedToken = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!savedToken || !isValidJwt(savedToken)) return null;
      const savedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const login = (jwtToken, userData) => {
    if (!isValidJwt(jwtToken)) return;
    setToken(jwtToken);
    setUser(userData);
    try {
      sessionStorage.setItem('token', jwtToken);
      sessionStorage.setItem('sv_session_active', '1');
      if (userData) {
        sessionStorage.setItem('user', JSON.stringify(userData));
      }
    } catch {}
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    } catch {}
  };

  const value = {
    token,
    user,
    isAuthenticated: !!token && isValidJwt(token),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
