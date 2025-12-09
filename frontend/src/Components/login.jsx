import React, { useState, useRef, useEffect } from 'react';
import api from '../api/axios.js';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './auth.css';
import Toast from './Toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    if (!email || !password) return 'All fields are required';
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) return 'Enter a valid email';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const err = validate();
    if (err) return setError(err);
    setLoading(true);
    try {
      const res = await api.post('http://localhost:3000/api/users/login', 
        { email, password },
        { withCredentials: true }
      );
      console.log(res)
      if (res.data && res.data.success) {
        const user = res.data.data.user;
        const tokens = res.data.data.tokens;
        // Save tokens (if needed)
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        login(user);
        // show success toast from backend message then navigate shortly after
        const successMessage = res.data.message || 'Login successful';
        setToast({ message: successMessage, type: 'success' });
        timerRef.current = setTimeout(() => {
          if (user.role === 'admin') navigate('/admin/dashboard');
          else navigate('/products');
        }, 1400);
      } else {
        const msg = res.data?.message || 'Login failed';
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
        <h2 className="auth-title">Login</h2>
        {error && <div className="auth-error">{error}</div>}
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
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
          placeholder="Your password"
        />
        <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>

        <button className="auth-btn" type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className="auth-foot">
          <span>Don't have an account? </span>
          <Link to="/register">Register</Link>
        </div>
      </form>
    </div>
  );
}
