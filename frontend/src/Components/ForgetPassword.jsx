import React, { useState, useRef, useEffect } from 'react';
import api from '../api/axios.js';
import { useNavigate } from 'react-router-dom';
import './auth.css';
import Toast from './Toast';

export default function ForgetPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [stage, setStage] = useState('email'); // 'email' | 'otp' | 'reset'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const timerRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const validateEmail = (e) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(e);
  };

  setTimeout(()=>{
    if(stage==='otp' && countdown>0){
      setCountdown(countdown-1)
    }
  },1000)

  const handleSendOtp = async (ev) => {
    ev.preventDefault();
    setError('');
    if (!email) return setError('Email is required');
    if (!validateEmail(email)) return setError('Enter a valid email');
    setLoading(true);
    try {
      // Expect backend endpoint to send OTP to email
      await api.post('http://localhost:3000/api/otp/generate-otp', { email });
      setToast({ message: 'OTP sent to your email', type: 'success' });
      setStage('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
      setToast({ message: err.response?.data?.message || 'Failed to send OTP', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOtp = async (ev) => {
    ev.preventDefault();
    setError('');
    if (!otp) return setError('Please enter the OTP');
    setLoading(true);
    try {
      // Backend should verify OTP; here we call verify endpoint
      const res = await api.post('http://localhost:3000/api/otp/verify-otp', { email, otp });
      console.log(res)
      if(res.data && !res.data.success){
        setToast({ message: 'Invalid Otp.', type: 'error' });
        throw new Error(res.data.message || 'Invalid OTP');
      }
      setToast({ message: 'OTP verified. Enter new password.', type: 'success' });
      setStage('reset');
      setCountdown(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
      setToast({ message: err.response?.data?.message || 'Invalid OTP', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (ev) => {
    ev.preventDefault();
    setError('');
    if (!password || !confirmPassword) return setError('Fill both password fields');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirmPassword) return setError('Passwords do not match');
    setLoading(true);
    try {
      // Backend should accept email, otp and new password and reset it
      await api.put('http://localhost:3000/api/users/forget-password', { email, password, confirmPassword });
      setToast({ message: 'Password reset successful. Redirecting to login...', type: 'success' });
      timerRef.current = setTimeout(() => navigate('/login'), 1600);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
      setToast({ message: err.response?.data?.message || 'Failed to reset password', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={stage === 'email' ? handleSendOtp : stage === 'otp' ? handleConfirmOtp : handleReset} noValidate>
        <h2 className="auth-title">Forgot Password</h2>
        {error && <div className="auth-error">{error}</div>}
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

        <label className="auth-label">Email</label>
        <input
          className="auth-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={stage !== 'email'}
        />

        {stage !== 'email' && (
          <>
            <label className="auth-label">OTP</label>
            <input
              className="auth-input"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
            />
            {stage === 'otp' && countdown===0?<div className='otp-num' onClick={handleSendOtp}>Resend Code</div>:<div  className={`otp-num ${stage!=='otp'&&'hide'}`}>{countdown}</div>}
          </>
        )}

        {stage === 'reset' && (
          <>
            <label className="auth-label">New Password</label>
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
            />

            <label className="auth-label">Confirm Password</label>
            <input
              className="auth-input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button type="submit" className="btn-back" disabled={loading}>
            {loading ? 'Please wait...' : stage === 'email' ? 'Send OTP' : stage === 'otp' ? 'Confirm OTP' : 'Reset Password'}
          </button>
          <button type="button" className="btn-back" onClick={() => navigate('/login')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
