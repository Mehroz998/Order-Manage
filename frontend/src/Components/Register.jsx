import React, { useState, useRef, useEffect } from 'react';
import api from '../api/axios.js';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './auth.css';
import Toast from './Toast';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const timerRef = useRef();

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const validate = () => {
    if (!name || !email || !password || !confirmPassword) return 'All fields are required';
    if (!/^[A-Za-z\s]+$/.test(name.trim())) return 'Name must only contain letters';
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) return 'Enter a valid email';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const err = validate();
    if (err) return setError(err);
    setLoading(true);
    try {
      const res = await api.post('http://localhost:3000/api/users/register', { name, email, password, confirmPassword });
      if (res.data && res.data.success) {
        // Show success toast from backend then try auto-login and navigate after short delay
        const successMessage = res.data.message || 'Registration successful';
        setToast({ message: successMessage, type: 'success' });
        navigate('/login');
      } else {
        const msg = res.data?.message || 'Registration failed';
        setError(msg);
        setToast({ message: msg, type: 'error' });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Network error';
      setError(msg);
      setToast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h2 className="auth-title">Register</h2>
        {error && <div className="auth-error">{error}</div>}
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

        <label className="auth-label">Full name</label>
        <input
          className="auth-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
        />

        <label className="auth-label">Email</label>
        <input
          className="auth-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <label className="auth-label">Password</label>
        <input
          className="auth-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />

        <label className="auth-label">Confirm Password</label>
        <input
          className="auth-input"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm Password"
        />

        <button className="auth-btn" type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <div className="auth-foot">
          <span>Already have an account? </span>
          <Link to="/login">Login</Link>
        </div>
      </form>
    </div>
  );
}
