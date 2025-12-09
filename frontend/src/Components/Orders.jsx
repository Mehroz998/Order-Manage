import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios.js';
import { useAuth } from '../context/AuthContext';
import './auth.css';

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [total_price, setTotal_price] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`http://localhost:3000/api/orders/${user.id}`,{
          headers:{ 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        });
        if (res.data?.success || res.data?.orders) {
          setOrders(res.data.orders || []);
          setTotal_price(res.data.total_price || 0);
        } else {
          setError(res.data?.message || 'Failed to load orders');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  console.log(orders);

  return (
    <div className="auth-wrap">
      <div className="auth-card orders">
        <div className="orders-header">
          <h2 className="auth-title">My Orders</h2>
          <Link to="/products" className="auth-btn" style={{ width: 'auto', padding: '8px 12px' }}>
            ← Back to Products
          </Link>
        </div>

        {loading && <p>Loading orders...</p>}
        {error && <div className="auth-error">{error}</div>}

        {!loading && !error && orders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>No orders yet</p>
            <Link to="/products" className="auth-btn">Browse Products</Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <table className="orders-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price per unit</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.order_id}>
                  <td>{order.product_name}</td>
                  <td>{order.quantity}</td>
                  <td>${order.price}</td>
                  <td>${order.total_price}</td>
                  <td><span className="status-badge">{order.status || 'Pending'}</span></td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <h2 style={{marginTop:'20px'}}>Total Price : {total_price}</h2>
      </div>
    </div>
  );
}
