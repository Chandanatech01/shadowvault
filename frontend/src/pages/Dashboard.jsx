import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const features = [
  { emoji: '🖼️', title: 'Image Steganography', desc: 'Hide secret messages inside ordinary images using Adaptive LSB encryption with AES-256 protection.', route: '/image-stego' },
  { emoji: '🎵', title: 'Audio Steganography', desc: 'Embed hidden text inside MP3 audio files. Sounds completely normal to the human ear.', route: '/audio-stego' },
  { emoji: '💬', title: 'Secret Chat', desc: 'Real-time messaging where every message is hidden inside a shared image. WhatsApp style.', route: '/secret-chat' },
  { emoji: '🔳', title: 'QR Steganography', desc: 'One QR code carries two meanings — public content for normal scanners, hidden secret for our app.', route: '/qr-stego' },
  { emoji: '🔍', title: 'Analyse Image', desc: 'AI-powered steganalysis detects hidden data inside any image with a confidence percentage.', route: '/analyse' },
  { emoji: '🕒', title: 'History', desc: 'View all your past encrypt, decrypt and chat activities with timestamps and status.', route: '/history' },
];

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  const username = user?.email ? user.email.split('@')[0] : 'User';
  const avatarLetter = user?.email ? user.email[0].toUpperCase() : 'U';

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  useEffect(() => {
    const close = (e) => { if (!e.target.closest('#avatar-btn')) setDropdownOpen(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  return (
    <div style={{
      backgroundColor: '#0a0d14',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* dot grid */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'radial-gradient(circle, #ffffff08 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* NAVBAR */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 2rem', height: '62px',
        backgroundColor: 'rgba(22,27,34,0.95)',
        borderBottom: '1px solid #21262d',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 38, height: 38, borderRadius: '10px',
            background: 'linear-gradient(135deg, #9d4edd, #2dd4bf)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
          }}>🔐</div>
          <span style={{ color: '#e6edf3', fontWeight: 800, fontSize: '1.35rem' }}>
            Shadow<span style={{ color: '#9d4edd' }}>Vault</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <span onClick={() => navigate('/history')}
            style={{ color: '#8b949e', fontSize: '0.9rem', cursor: 'pointer' }}
            onMouseOver={e => e.target.style.color = '#e6edf3'}
            onMouseOut={e => e.target.style.color = '#8b949e'}
          >History</span>

          <div style={{ position: 'relative' }}>
            <button id="avatar-btn"
              onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'linear-gradient(135deg, #9d4edd, #2dd4bf)',
                color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >{avatarLetter}</button>

            {dropdownOpen && (
              <div style={{
                position: 'absolute', right: 0, top: '48px',
                backgroundColor: '#161b22', border: '1px solid #30363d',
                borderRadius: '10px', minWidth: '190px', zIndex: 999,
                overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #21262d' }}>
                  <div style={{ color: '#8b949e', fontSize: '0.72rem', marginBottom: '2px' }}>Signed in as</div>
                  <div style={{ color: '#e6edf3', fontSize: '0.88rem', fontWeight: 600 }}>{user?.email}</div>
                </div>
                {[
                  { label: '📊  Dashboard', action: () => { navigate('/dashboard'); setDropdownOpen(false); } },
                  { label: '🕒  History', action: () => { navigate('/history'); setDropdownOpen(false); } },
                ].map((item, i) => (
                  <div key={i} onClick={item.action}
                    style={{ padding: '10px 16px', color: '#c9d1d9', fontSize: '0.9rem', cursor: 'pointer' }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#21262d'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >{item.label}</div>
                ))}
                <div style={{ borderTop: '1px solid #21262d' }} />
                <div onClick={handleLogout}
                  style={{ padding: '10px 16px', color: '#f85149', fontSize: '0.9rem', cursor: 'pointer' }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#21262d'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >🚪  Logout</div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* MAIN */}
      <div style={{ padding: '1.5rem 2rem', position: 'relative', zIndex: 1 }}>

        {/* Welcome */}
        <div style={{ marginBottom: '1.2rem' }}>
          <div style={{ color: '#2dd4bf', fontSize: '0.82rem', marginBottom: '3px' }}>{getGreeting()},</div>
          <div style={{ color: '#e6edf3', fontSize: '1.5rem', fontWeight: 700 }}>{username} 👋</div>
          <div style={{ color: '#8b949e', fontSize: '0.82rem', marginTop: '3px' }}>What would you like to hide today?</div>
        </div>

        {/* Stats bar */}
        <div style={{
          display: 'flex', backgroundColor: '#161b22',
          border: '1px solid #21262d', borderRadius: '12px',
          marginBottom: '1.2rem', overflow: 'hidden',
        }}>
          {[
            { label: 'ENCRYPTION', value: 'AES-256', color: '#9d4edd' },
            { label: 'ALGORITHM', value: 'Adaptive LSB', color: '#2dd4bf' },
            { label: 'SECURITY', value: 'Double Layer', color: '#f59e0b' },
            { label: 'STATUS', value: '● Active', color: '#10b981' },
          ].map((stat, i) => (
            <div key={i} style={{
              flex: 1, padding: '0.75rem 1.1rem',
              borderRight: i < 3 ? '1px solid #21262d' : 'none',
            }}>
              <div style={{ color: '#8b949e', fontSize: '0.63rem', letterSpacing: '1.5px', marginBottom: '4px' }}>{stat.label}</div>
              <div style={{ color: stat.color, fontSize: '0.88rem', fontWeight: 700 }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Label */}
        <div style={{ color: '#8b949e', fontSize: '0.68rem', letterSpacing: '2.5px', marginBottom: '1rem' }}>
          CHOOSE A FEATURE
        </div>

        {/* 3x2 GRID — uses auto rows so cards are equal and all visible */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
        }}>
          {features.map((f, i) => {
            const isHovered = hoveredCard === i;
            return (
              <div key={i}
                onClick={() => navigate(f.route)}
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  backgroundColor: '#161b22',
                  border: `1.5px solid ${isHovered ? '#9d4edd' : '#5b21b633'}`,
                  borderRadius: '14px',
                  padding: '1.4rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '200px',
                  transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
                  transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
                  boxShadow: isHovered ? '0 6px 24px rgba(157,78,221,0.15)' : 'none',
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 52, height: 52, borderRadius: '12px',
                  backgroundColor: '#0d1117', border: '1px solid #30363d',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.6rem', flexShrink: 0,
                }}>{f.emoji}</div>

                {/* Text */}
                <div style={{ flex: 1, marginTop: '1rem' }}>
                  <div style={{ color: '#e6edf3', fontWeight: 700, fontSize: '1.05rem', marginBottom: '7px' }}>
                    {f.title}
                  </div>
                  <div style={{ color: '#8b949e', fontSize: '0.875rem', lineHeight: 1.6 }}>
                    {f.desc}
                  </div>
                </div>

                {/* Footer */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #21262d',
                }}>
                  <span style={{ color: isHovered ? '#9d4edd' : '#8b949e', fontSize: '0.85rem', fontWeight: 600, transition: 'color 0.2s' }}>
                    Open feature
                  </span>
                  <span style={{
                    color: isHovered ? '#9d4edd' : '#30363d', fontSize: '1.1rem',
                    transition: 'all 0.2s',
                    transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                    display: 'inline-block',
                  }}>→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;