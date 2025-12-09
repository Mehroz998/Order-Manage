import React, { useEffect, useState } from 'react';
import axios from '../api/axios.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './admin.css';
import Toast from './Toast';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [stats, setStats] = useState({ users: 0, products: 0, orders: 0 });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [usersRes, productsRes, ordersRes] = await Promise.all([
          axios.get('http://localhost:3000/api/users'),
          axios.get('http://localhost:3000/api/products'),
          axios.get('http://localhost:3000/api/orders')
        ]);
        setStats({
          users: usersRes.data?.count || 0,
          products: productsRes.data?.count || 0,
          orders: ordersRes.data?.count || 0
        });
      } catch (err) {
        console.log('Stats fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const StatCard = ({ title, count, onClick }) => (
    <div className="stat-card" onClick={onClick} role="button" tabIndex={0}>
      <h3>{title}</h3>
      <p className="stat-number">{count}</p>
    </div>
  );

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:3000/api/users/logout',
        {refreshToken: localStorage.getItem("refreshToken")}, 
        {
        headers:{
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
    } catch (err) {
      console.log('Logout error:', err);
    } finally {
      logout();
      setToast({ message: 'Logged out successfully', type: 'success' });
      setTimeout(() => navigate('/login'), 1400);
    }
  };

  return (
    <div className="admin-wrap">
      <div className="admin-container">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <div className="header-actions">
            <button className="btn-primary" onClick={() => navigate('/products')}>🛍️ Shop Products</button>
            <button className="btn-primary" onClick={handleLogout}>🚪 Logout</button>
          </div>
        </div>
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

        {loading ? (
          <p>Loading stats...</p>
        ) : (
          <div className="stats-grid">
            <StatCard
              title="Total Users"
              count={stats.users}
              onClick={() => navigate('/admin/users')}
            />
            <StatCard
              title="Total Products"
              count={stats.products}
              onClick={() => navigate('/admin/products')}
            />
            <StatCard
              title="Total Orders"
              count={stats.orders}
              onClick={() => navigate('/admin/orders')}
            />
          </div>
        )}
      </div>
    </div>
  );
}
