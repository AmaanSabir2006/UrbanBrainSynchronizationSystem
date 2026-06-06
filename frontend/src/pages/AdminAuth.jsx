// AdminAuth.jsx
import React, { useState } from 'react';

const AdminAuth = ({ onLoginSuccess }) => {
  const [viewState, setViewState] = useState('login'); // 'login', 'forgot', 'otp'
  
  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Common input styling to match the URBS theme
  const inputStyle = {
    width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '4px',
    border: '1px solid rgba(1, 65, 28, 0.2)', outline: 'none',
    fontSize: '14px', color: '#01411C', boxSizing: 'border-box'
  };

  const buttonStyle = {
    width: '100%', padding: '12px', borderRadius: '4px',
    background: '#01411C', color: '#FFFFFF', border: 'none',
    cursor: 'pointer', fontWeight: '700', fontSize: '13px', letterSpacing: '1px'
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        onLoginSuccess(); // Function passed from parent App.jsx to unlock the dashboard
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Network connection failed.");
    }
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError(null); setMessage(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/request-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setViewState('otp');
        setMessage("Authorization code dispatched to secure inbox.");
      }
    } catch (err) {
      setError("Failed to connect to authorization server.");
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError(null); setMessage(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/reset-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp_code: otpCode, new_password: newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setViewState('login');
        setMessage("Credentials updated. Please initialize login sequence.");
        setPassword('');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Verification failed.");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F8F9FA' }}>
      <div style={{ width: '400px', background: '#FFFFFF', padding: '40px', borderRadius: '8px', boxShadow: '0px 10px 30px rgba(0,0,0,0.05)', borderTop: '4px solid #01411C' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ color: '#01411C', margin: '0 0 5px 0', letterSpacing: '2px', fontSize: '20px' }}>URBS SECURE PORTAL</h2>
          <div style={{ fontSize: '11px', color: '#555555', fontWeight: '700', letterSpacing: '1px' }}>ADMINISTRATIVE ACCESS ONLY</div>
        </div>

        {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '12px', fontWeight: '700' }}>{error}</div>}
        {message && <div style={{ background: '#ECFCCB', color: '#3F6212', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '12px', fontWeight: '700' }}>{message}</div>}

        {/* LOGIN VIEW */}
        {viewState === 'login' && (
          <form onSubmit={handleLogin}>
            <input style={inputStyle} type="text" placeholder="Admin Username" value={username} onChange={e => setUsername(e.target.value)} required />
            <input style={inputStyle} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            <button style={buttonStyle} type="submit">INITIALIZE SESSION</button>
            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <span onClick={() => setViewState('forgot')} style={{ color: '#D97706', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Forgot Password?</span>
            </div>
          </form>
        )}

        {/* REQUEST OTP VIEW */}
        {viewState === 'forgot' && (
          <form onSubmit={handleRequestOTP}>
            <p style={{ fontSize: '13px', color: '#555', marginBottom: '20px' }}>Enter your registered administrative email to receive a 6-digit reset protocol code.</p>
            <input style={inputStyle} type="email" placeholder="Registered Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <button style={buttonStyle} type="submit">DISPATCH OTP CODE</button>
            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <span onClick={() => setViewState('login')} style={{ color: '#01411C', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Return to Login</span>
            </div>
          </form>
        )}

        {/* VERIFY OTP VIEW */}
        {viewState === 'otp' && (
          <form onSubmit={handleVerifyOTP}>
            <p style={{ fontSize: '13px', color: '#555', marginBottom: '20px' }}>Enter the 6-digit code sent to your inbox and define your new passphrase.</p>
            <input style={{ ...inputStyle, textAlign: 'center', letterSpacing: '5px', fontSize: '18px', fontWeight: 'bold' }} type="text" placeholder="000000" maxLength="6" value={otpCode} onChange={e => setOtpCode(e.target.value)} required />
            <input style={inputStyle} type="password" placeholder="New Passphrase" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            <button style={buttonStyle} type="submit">SYNCHRONIZE CREDENTIALS</button>
          </form>
        )}

      </div>
    </div>
  );
};

export default AdminAuth;