import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get first letter of email for avatar
  const avatarLetter = user?.email ? user.email[0].toUpperCase() : 'U';

  return (
    <nav
      className="d-flex justify-content-between align-items-center px-4 px-md-5 py-3"
      style={{ backgroundColor: '#161b22', borderBottom: '1px solid #30363d', position: 'sticky', top: 0, zIndex: 100 }}
    >
      {/* Logo */}
      <Link to="/dashboard" style={{ textDecoration: 'none' }}>
        <h5 className="m-0" style={{ color: '#9d4edd', fontWeight: 700, letterSpacing: '1px' }}>
          Shadow<span style={{ color: '#2dd4bf' }}>Vault</span>
        </h5>
      </Link>

      {/* Nav links — hidden on mobile */}
      <div className="d-none d-md-flex gap-4">
        <Link to="/dashboard" style={{ color: '#8b949e', textDecoration: 'none', fontSize: '0.9rem' }}
          onMouseOver={e => e.target.style.color = '#fff'}
          onMouseOut={e => e.target.style.color = '#8b949e'}
        >
          Dashboard
        </Link>
        <Link to="/history" style={{ color: '#8b949e', textDecoration: 'none', fontSize: '0.9rem' }}
          onMouseOver={e => e.target.style.color = '#fff'}
          onMouseOut={e => e.target.style.color = '#8b949e'}
        >
          History
        </Link>
      </div>

      {/* User profile dropdown */}
      <div className="position-relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="d-flex align-items-center gap-2 border-0 bg-transparent"
          style={{ cursor: 'pointer' }}
        >
          {/* Avatar circle with first letter */}
          <div
            className="d-flex align-items-center justify-content-center rounded-circle"
            style={{ width: 36, height: 36, backgroundColor: '#9d4edd', color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}
          >
            {avatarLetter}
          </div>
          <span style={{ color: '#c9d1d9', fontSize: '0.9rem' }} className="d-none d-md-inline">
            {user?.email || 'User'}
          </span>
          <span style={{ color: '#8b949e', fontSize: '0.7rem' }}>▼</span>
        </button>

        {/* Dropdown menu */}
        {dropdownOpen && (
          <div
            className="position-absolute end-0 mt-2 rounded shadow"
            style={{ backgroundColor: '#21262d', border: '1px solid #30363d', minWidth: '180px', zIndex: 200 }}
          >
            {/* User info */}
            <div className="px-3 py-2" style={{ borderBottom: '1px solid #30363d' }}>
              <small style={{ color: '#8b949e' }}>Signed in as</small>
              <p className="mb-0 text-light" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                {user?.email || 'User'}
              </p>
            </div>

            {/* Dashboard link */}
            <Link
              to="/dashboard"
              className="d-block px-3 py-2 text-decoration-none"
              style={{ color: '#c9d1d9', fontSize: '0.9rem' }}
              onClick={() => setDropdownOpen(false)}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#30363d'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              📊 Dashboard
            </Link>

            {/* History link */}
            <Link
              to="/history"
              className="d-block px-3 py-2 text-decoration-none"
              style={{ color: '#c9d1d9', fontSize: '0.9rem' }}
              onClick={() => setDropdownOpen(false)}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#30363d'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              🕒 History
            </Link>

            {/* Divider */}
            <div style={{ borderTop: '1px solid #30363d' }} />

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="d-block w-100 text-start px-3 py-2 border-0 bg-transparent"
              style={{ color: '#f85149', fontSize: '0.9rem', cursor: 'pointer' }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#30363d'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
