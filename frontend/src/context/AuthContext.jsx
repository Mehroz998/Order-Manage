import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = (userData) => {
    setUser(userData);
    // ensure axios Authorization header is set from any stored token
    const token = localStorage.getItem('accessToken');
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    // remove stored tokens and axios header
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // Listen for refresh-failed event from axios interceptor to force logout
  useEffect(() => {
    const handleRefreshFailed = () => {
      // Clear auth state and redirect to login
      logout();
      try {
        window.location.href = '/login';
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener('auth:refreshFailed', handleRefreshFailed);
    return () => window.removeEventListener('auth:refreshFailed', handleRefreshFailed);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
