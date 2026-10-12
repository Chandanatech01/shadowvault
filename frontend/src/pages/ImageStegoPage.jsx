import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const ImageStegoPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('encrypt');

  // Encrypt state
  const [encImage, setEncImage] = useState(null);
  const [encPreview, setEncPreview] = useState(null);
  const [encMessage, setEncMessage] = useState('');
  const [encKey, setEncKey] = useState('');
  const [encLoading, setEncLoading] = useState(false);
  const [encSuccess, setEncSuccess] = useState(false);
  const [encError, setEncError] = useState('');
  const [stegoBlob, setStegoBlob] = useState(null);

  // Email state
  const [receiverEmail, setReceiverEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailError, setEmailError] = useState('');

  // Decrypt state
  const [decImage, setDecImage] = useState(null);
  const [decPreview, setDecPreview] = useState(null);
  const [decKey, setDecKey] = useState('');
  const [decLoading, setDecLoading] = useState(false);
  const [decMessage, setDecMessage] = useState('');
  const [decError, setDecError] = useState('');

  // Redirect to login if no token
  //useEffect(() => {
    //if (!localStorage.getItem('token')) {
     // navigate('/login');
   // }
  //}, [navigate]);

  // Handle encrypt image preview
  const handleEncImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEncImage(file);
    setEncPreview(URL.createObjectURL(file));
    setEncSuccess(false);
    setEncError('');
    setStegoBlob(null);
  };

  // Handle decrypt image preview
  const handleDecImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setDecImage(file);
    setDecPreview(URL.createObjectURL(file));
    setDecMessage('');
    setDecError('');
  };

  // ENCRYPT API call
  const handleEncrypt = async () => {
    if (!encImage) { setEncError('Please upload an image.'); return; }
    if (!encMessage.trim()) { setEncError('Please enter a secret message.'); return; }
    if (!encKey.trim()) { setEncError('Please enter a stego key.'); return; }

    setEncLoading(true);
    setEncError('');
    setEncSuccess(false);
    setStegoBlob(null);

    // ===== TEMPORARY: fake success for UI testing =====
    setTimeout(() => {
      const fakeBlob = new Blob(['fake image data'], { type: 'image/png' });
      setStegoBlob(fakeBlob);
      setEncSuccess(true);
      setEncLoading(false);
    }, 1500);
    return;
    // ===== END TEMPORARY =====

    try {
      const formData = new FormData();
      formData.append('image', encImage);
      formData.append('message', encMessage);
      formData.append('stegoKey', encKey);

      const response = await fetch('http://localhost:8080/api/stego/encrypt', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Encryption failed');

      const blob = await response.blob();
      setStegoBlob(blob);
      setEncSuccess(true);
    } catch (err) {
      setEncError('Encryption failed. Please check your inputs and try again.');
    } finally {
      setEncLoading(false);
    }
  };

  // Download stego image
  const handleDownload = () => {
    if (!stegoBlob) return;
    const url = URL.createObjectURL(stegoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stego-image.png';
    a.click();
    URL.revokeObjectURL(url);
  };

  // SEND EMAIL API call
  const handleSendEmail = async () => {
    if (!stegoBlob) { setEmailError('No stego image to send.'); return; }
    if (!receiverEmail.trim()) { setEmailError('Please enter a receiver email.'); return; }

    setEmailLoading(true);
    setEmailError('');
    setEmailSuccess('');

    try {
      const formData = new FormData();
      formData.append('image', stegoBlob, 'stego-image.png');
      formData.append('receiverEmail', receiverEmail);

      const response = await fetch('http://localhost:8080/api/stego/send-email', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Email sending failed');

      const data = await response.json();
      setEmailSuccess(data.message || 'Email sent successfully!');
    } catch (err) {
      setEmailError('Failed to send email. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  };

  // DECRYPT API call
  const handleDecrypt = async () => {
    if (!decImage) { setDecError('Please upload a stego image.'); return; }
    if (!decKey.trim()) { setDecError('Please enter the stego key.'); return; }

    setDecLoading(true);
    setDecError('');
    setDecMessage('');

    try {
      const formData = new FormData();
      formData.append('image', decImage);
      formData.append('stegoKey', decKey);

      const response = await fetch('http://localhost:8080/api/stego/decrypt', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Decryption failed');

      const data = await response.json();
      setDecMessage(data.message);
    } catch (err) {
      setDecError('Wrong key or invalid image!');
    } finally {
      setDecLoading(false);
    }
  };

  // Shared input style
  const inputStyle = {
    backgroundColor: '#0d1117',
    border: '1px solid #30363d',
    color: '#e6edf3',
    borderRadius: '8px',
    padding: '0.6rem 0.9rem',
    width: '100%',
    fontSize: '0.9rem',
    outline: 'none',
  };

  const labelStyle = {
    color: '#8b949e',
    fontSize: '0.82rem',
    marginBottom: '6px',
    display: 'block',
    letterSpacing: '0.5px',
  };

  const cardStyle = {
    backgroundColor: '#161b22',
    border: '1px solid #21262d',
    borderRadius: '14px',
    padding: '1.8rem',
  };

  return (
    <div style={{ backgroundColor: '#0a0d14', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Navbar />

      <div className="container py-4" style={{ maxWidth: '860px' }}>

        {/* Page header */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: '0.85rem', padding: 0, marginBottom: '0.5rem' }}
          >
            ← Back to Dashboard
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 44, height: 44, borderRadius: '10px',
              backgroundColor: 'rgba(157,78,221,0.15)',
              border: '1px solid rgba(157,78,221,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
            }}>🖼️</div>
            <div>
              <h4 style={{ color: '#e6edf3', fontWeight: 700, margin: 0 }}>Image Steganography</h4>
              <p style={{ color: '#8b949e', fontSize: '0.82rem', margin: 0 }}>Hide or reveal secret messages inside images</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          backgroundColor: '#161b22',
          border: '1px solid #21262d',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '1.5rem',
          width: 'fit-content',
        }}>
          {['encrypt', 'decrypt'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.5rem 1.8rem',
                borderRadius: '7px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                backgroundColor: activeTab === tab ? '#9d4edd' : 'transparent',
                color: activeTab === tab ? '#fff' : '#8b949e',
                transition: 'all 0.2s',
              }}
            >
              {tab === 'encrypt' ? '🔒 Encrypt' : '🔓 Decrypt'}
            </button>
          ))}
        </div>

        {/* ══════════════ ENCRYPT TAB ══════════════ */}
        {activeTab === 'encrypt' && (
          <div style={cardStyle}>
            <div className="row g-4">

              {/* Left: Upload + Preview */}
              <div className="col-12 col-md-5">
                <label style={labelStyle}>UPLOAD IMAGE</label>
                <div
                  onClick={() => document.getElementById('enc-file').click()}
                  style={{
                    border: '2px dashed #30363d',
                    borderRadius: '10px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: '#0d1117',
                    transition: 'border-color 0.2s',
                    minHeight: "240px",
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = '#9d4edd'}
                  onMouseOut={e => e.currentTarget.style.borderColor = '#30363d'}
                >
                  {encPreview ? (
                    <img src={encPreview} alt="preview" style={{ maxWidth: '100%', maxHeight: "200px", borderRadius: '6px', objectFit: 'contain' }} />
                  ) : (
                    <>
                      <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🖼️</div>
                      <div style={{ color: '#8b949e', fontSize: '0.9rem' }}>Click to upload image</div>
                      <div style={{ color: '#484f58', fontSize: '0.75rem', marginTop: '4px' }}>PNG, JPG, BMP supported</div>
                    </>
                  )}
                </div>
                <input id="enc-file" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleEncImageChange} />
                {encImage && (
                  <div style={{ color: '#8b949e', fontSize: '0.75rem', marginTop: '6px' }}>📎 {encImage.name}</div>
                )}
              </div>

              {/* Right: Inputs */}
              <div className="col-12 col-md-7">
                <div className="mb-3">
                  <label style={labelStyle}>SECRET MESSAGE</label>
                  <textarea
                    rows={4}
                    placeholder="Type your secret message here..."
                    value={encMessage}
                    onChange={e => setEncMessage(e.target.value)}
                    style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }}
                  />
                </div>

                <div className="mb-4">
                  <label style={labelStyle}>STEGO KEY</label>
                  <input
                    type="password"
                    placeholder="Enter a secret key"
                    value={encKey}
                    onChange={e => setEncKey(e.target.value)}
                    style={inputStyle}
                  />
                  <div style={{ color: '#484f58', fontSize: '0.75rem', marginTop: '5px' }}>
                    Keep this key safe — you'll need it to decrypt
                  </div>
                </div>

                {/* Error */}
                {encError && (
                  <div style={{ backgroundColor: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: '8px', padding: '0.7rem 1rem', color: '#f85149', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    ⚠️ {encError}
                  </div>
                )}

                {/* Encrypt button */}
                <button
                  onClick={handleEncrypt}
                  disabled={encLoading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#9d4edd',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: encLoading ? 'not-allowed' : 'pointer',
                    opacity: encLoading ? 0.7 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {encLoading ? (
                    <span>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Encrypting...
                    </span>
                  ) : '🔒 Encrypt Message'}
                </button>
              </div>
            </div>

            {/* Success section */}
            {encSuccess && stegoBlob && (
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid #21262d', paddingTop: '1.5rem' }}>

                {/* Success alert */}
                <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#10b981', fontSize: '0.9rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ✅ Encryption Successful! Your message is hidden inside the image.
                </div>

                {/* Download button */}
                <button
                  onClick={handleDownload}
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    backgroundColor: '#0d1117',
                    color: '#10b981',
                    border: '1px solid rgba(16,185,129,0.4)',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    marginBottom: '1.2rem',
                  }}
                >
                  ⬇️ Download Stego Image
                </button>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem' }}>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#21262d' }} />
                  <span style={{ color: '#484f58', fontSize: '0.8rem' }}>OR SEND VIA EMAIL</span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#21262d' }} />
                </div>

                {/* Email section */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="email"
                    placeholder="Receiver's email address"
                    value={receiverEmail}
                    onChange={e => setReceiverEmail(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    onClick={handleSendEmail}
                    disabled={emailLoading}
                    style={{
                      padding: '0.6rem 1.2rem',
                      backgroundColor: '#21262d',
                      color: '#2dd4bf',
                      border: '1px solid rgba(45,212,191,0.3)',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: emailLoading ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                      opacity: emailLoading ? 0.7 : 1,
                    }}
                  >
                    {emailLoading ? (
                      <span><span className="spinner-border spinner-border-sm me-1" />Sending...</span>
                    ) : '📧 Send Email'}
                  </button>
                </div>

                {emailSuccess && (
                  <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', padding: '0.65rem 1rem', color: '#10b981', fontSize: '0.875rem', marginTop: '0.75rem' }}>
                    ✅ {emailSuccess}
                  </div>
                )}
                {emailError && (
                  <div style={{ backgroundColor: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: '8px', padding: '0.65rem 1rem', color: '#f85149', fontSize: '0.875rem', marginTop: '0.75rem' }}>
                    ⚠️ {emailError}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ DECRYPT TAB ══════════════ */}
        {activeTab === 'decrypt' && (
          <div style={cardStyle}>
            <div className="row g-4">

              {/* Left: Upload */}
              <div className="col-12 col-md-5">
                <label style={labelStyle}>UPLOAD STEGO IMAGE</label>
                <div
                  onClick={() => document.getElementById('dec-file').click()}
                  style={{
                    border: '2px dashed #30363d',
                    borderRadius: '10px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: '#0d1117',
                    minHeight: "240px",
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = '#2dd4bf'}
                  onMouseOut={e => e.currentTarget.style.borderColor = '#30363d'}
                >
                  {decPreview ? (
                    <img src={decPreview} alt="preview" style={{ maxWidth: '100%', maxHeight: "200px", borderRadius: '6px', objectFit: 'contain' }} />
                  ) : (
                    <>
                      <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔍</div>
                      <div style={{ color: '#8b949e', fontSize: '0.82rem' }}>Click to upload stego image</div>
                      <div style={{ color: '#484f58', fontSize: '0.75rem', marginTop: '4px' }}>The image containing hidden data</div>
                    </>
                  )}
                </div>
                <input id="dec-file" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleDecImageChange} />
                {decImage && (
                  <div style={{ color: '#8b949e', fontSize: '0.75rem', marginTop: '6px' }}>📎 {decImage.name}</div>
                )}
              </div>

              {/* Right: Key + button */}
              <div className="col-12 col-md-7 d-flex flex-column justify-content-between">
                <div>
                  <div className="mb-4">
                    <label style={labelStyle}>STEGO KEY</label>
                    <input
                      type="password"
                      placeholder="Enter the stego key used during encryption"
                      value={decKey}
                      onChange={e => setDecKey(e.target.value)}
                      style={inputStyle}
                    />
                    <div style={{ color: '#484f58', fontSize: '0.75rem', marginTop: '5px' }}>
                      Must match the key used when encrypting
                    </div>
                  </div>

                  {/* Error */}
                  {decError && (
                    <div style={{ backgroundColor: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: '8px', padding: '0.7rem 1rem', color: '#f85149', fontSize: '0.875rem', marginBottom: '1rem' }}>
                      ❌ {decError}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleDecrypt}
                  disabled={decLoading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#2dd4bf',
                    color: '#0a0d14',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: decLoading ? 'not-allowed' : 'pointer',
                    opacity: decLoading ? 0.7 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {decLoading ? (
                    <span>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Decrypting...
                    </span>
                  ) : '🔓 Decrypt Message'}
                </button>

                {/* Decrypted message result */}
                {decMessage && (
                  <div style={{ marginTop: '1.2rem', backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '1rem 1.2rem' }}>
                    <div style={{ color: '#10b981', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '1px', marginBottom: '8px' }}>
                      🔓 SECRET MESSAGE REVEALED
                    </div>
                    <div style={{ color: '#e6edf3', fontSize: '0.95rem', lineHeight: 1.7, wordBreak: 'break-word' }}>
                      {decMessage}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageStegoPage;