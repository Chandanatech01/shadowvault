// src/styles/guardianTheme.js
// Shared design tokens for the Guardian Circle pages (setup / recovery).
// Kept consistent with the existing ShadowVault dark theme used across
// LandingPage / PortalPage / EvidencePage / ChatPage.

export const colors = {
  bg: '#0a0a0f',
  bgPanel: '#13131a',
  bgInput: '#1a1a24',
  border: '#26262f',
  borderFocus: '#7c3aed',
  text: '#f4f4f6',
  textDim: '#9999a8',
  textFaint: '#6b6b78',
  purple: '#7c3aed',
  purpleSoft: 'rgba(124, 58, 237, 0.12)',
  cyan: '#06b6d4',
  green: '#10b981',
  red: '#ef4444',
  redSoft: 'rgba(239, 68, 68, 0.12)',
};

export const fonts = {
  body: "'Inter', 'Segoe UI', sans-serif",
};

export const page = {
  minHeight: '100vh',
  width: '100%',
  background: `radial-gradient(ellipse 80% 50% at 50% -10%, ${colors.purpleSoft}, transparent), ${colors.bg}`,
  fontFamily: fonts.body,
  color: colors.text,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '64px 20px',
  boxSizing: 'border-box',
};

export const card = {
  width: '100%',
  maxWidth: '420px',
  background: colors.bgPanel,
  border: `1px solid ${colors.border}`,
  borderRadius: '16px',
  padding: '36px 32px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
  boxSizing: 'border-box',
};

export const eyebrow = {
  fontSize: '12px',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: colors.cyan,
  fontWeight: 600,
  marginBottom: '10px',
};

export const heading = {
  fontSize: '26px',
  fontWeight: 700,
  margin: '0 0 8px 0',
  letterSpacing: '-0.01em',
};

export const subtext = {
  fontSize: '14px',
  color: colors.textDim,
  lineHeight: 1.6,
  margin: 0,
};

export const label = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: colors.textDim,
  marginBottom: '6px',
  marginTop: '18px',
};

export const input = {
  width: '100%',
  background: colors.bgInput,
  border: `1px solid ${colors.border}`,
  borderRadius: '10px',
  padding: '12px 14px',
  fontSize: '14px',
  color: colors.text,
  fontFamily: fonts.body,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s ease',
};

export const inputFocus = {
  borderColor: colors.borderFocus,
};

export const select = {
  ...input,
  appearance: 'none',
  cursor: 'pointer',
};

export const primaryButton = {
  width: '100%',
  marginTop: '26px',
  padding: '13px 16px',
  borderRadius: '10px',
  border: 'none',
  background: colors.purple,
  color: '#fff',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: fonts.body,
  transition: 'background 0.15s ease, transform 0.1s ease',
};

export const primaryButtonHover = {
  background: '#6d28d9',
};

export const secondaryButton = {
  width: '100%',
  marginTop: '12px',
  padding: '13px 16px',
  borderRadius: '10px',
  border: `1px solid ${colors.border}`,
  background: 'transparent',
  color: colors.text,
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: fonts.body,
  transition: 'border-color 0.15s ease',
};

export const linkRow = {
  marginTop: '22px',
  textAlign: 'center',
  fontSize: '13px',
  color: colors.textFaint,
};

export const link = {
  color: colors.cyan,
  textDecoration: 'none',
  fontWeight: 600,
  cursor: 'pointer',
};

export const backLink = {
  fontSize: '13px',
  color: colors.textFaint,
  textDecoration: 'none',
  marginBottom: '28px',
  display: 'inline-block',
};

export const banner = (variant) => ({
  marginTop: '18px',
  padding: '12px 14px',
  borderRadius: '10px',
  fontSize: '13px',
  lineHeight: 1.5,
  background: variant === 'error' ? colors.redSoft : 'rgba(16, 185, 129, 0.12)',
  color: variant === 'error' ? colors.red : colors.green,
  border: `1px solid ${variant === 'error' ? colors.red : colors.green}`,
});

export const errorText = {
  fontSize: '12px',
  color: colors.red,
  marginTop: '6px',
};

// --- Dashboard-specific tokens ---

export const dashboardPage = {
  minHeight: '100vh',
  width: '100%',
  background: colors.bg,
  fontFamily: fonts.body,
  color: colors.text,
  padding: '32px 24px 64px',
  boxSizing: 'border-box',
};

export const dashboardHeader = {
  maxWidth: '1000px',
  margin: '0 auto 24px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: '12px',
};

export const dashboardShell = {
  maxWidth: '1000px',
  margin: '0 auto',
};

export const tabBar = {
  display: 'flex',
  gap: '6px',
  borderBottom: `1px solid ${colors.border}`,
  marginBottom: '24px',
  overflowX: 'auto',
};

export const tabButton = (active) => ({
  padding: '10px 16px',
  fontSize: '13px',
  fontWeight: 600,
  fontFamily: fonts.body,
  background: 'transparent',
  border: 'none',
  borderBottom: active ? `2px solid ${colors.purple}` : '2px solid transparent',
  color: active ? colors.text : colors.textDim,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
});

export const sectionCard = {
  background: colors.bgPanel,
  border: `1px solid ${colors.border}`,
  borderRadius: '14px',
  padding: '20px 22px',
  marginBottom: '16px',
};

export const sectionTitle = {
  fontSize: '15px',
  fontWeight: 700,
  margin: '0 0 4px 0',
};

export const sectionSubtext = {
  fontSize: '13px',
  color: colors.textDim,
  margin: '0 0 16px 0',
  lineHeight: 1.5,
};

export const rowItem = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 0',
  borderTop: `1px solid ${colors.border}`,
  flexWrap: 'wrap',
};

export const mono = {
  fontFamily: "'SFMono-Regular', Consolas, monospace",
  fontSize: '12px',
  color: colors.cyan,
};

export const badge = (variant) => {
  const map = {
    new: { bg: 'rgba(239,68,68,0.14)', fg: colors.red },
    pending: { bg: 'rgba(234,179,8,0.14)', fg: '#eab308' },
    active: { bg: 'rgba(124,58,237,0.14)', fg: colors.purple },
    resolved: { bg: 'rgba(16,185,129,0.14)', fg: colors.green },
    default: { bg: 'rgba(153,153,168,0.14)', fg: colors.textDim },
  };
  const c = map[variant] || map.default;
  return {
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 9px',
    borderRadius: '999px',
    background: c.bg,
    color: c.fg,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };
};

export const smallButton = {
  padding: '7px 13px',
  borderRadius: '8px',
  border: `1px solid ${colors.border}`,
  background: 'transparent',
  color: colors.text,
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: fonts.body,
};

export const smallButtonPrimary = {
  ...smallButton,
  border: 'none',
  background: colors.purple,
  color: '#fff',
};

export const textarea = {
  ...input,
  minHeight: '70px',
  resize: 'vertical',
  fontFamily: fonts.body,
};

export const emptyState = {
  fontSize: '13px',
  color: colors.textFaint,
  padding: '24px 0',
  textAlign: 'center',
};