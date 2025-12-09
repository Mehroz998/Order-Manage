import React, { useEffect, useState } from 'react';
import axios from '../api/axios.js';
import { useNavigate } from 'react-router-dom';
import './admin.css';
import Toast from './Toast';

export default function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const fetchAllOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/api/orders',{
        headers:{ 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
      setOrders(res.data?.orders || res.data?.data || []);
    } catch (err) {
      setToast({ message: 'Failed to load orders', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-wrap">
      <div className="admin-container">
        <div className="list-header">
          <h2>All Orders</h2>
          <button className="btn-back" onClick={() => navigate('/admin/dashboard')}>← Back</button>
        </div>
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

        {loading ? (
          <p>Loading orders...</p>
        ) : orders.length === 0 ? (
          <p>No orders found</p>
        ) : (
          <div className="list-table-wrap">
            <table className="list-table">
              <thead>
                <tr>
                  <th>S:No</th>
                  <th>Order ID</th>
                  <th>User ID</th>
                  <th>Product ID</th>
                  <th>Quantity</th>
                  <th>Total Price</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o,index) => (
                  <tr key={o.id || o.order_id}>
                    <td>{index+1}</td>
                    <td>{o.id || o.order_id}</td>
                    <td>{o.user_id}</td>
                    <td>{o.product_id}</td>
                    <td>{o.quantity}</td>
                    <td>${o.total_price}</td>
                    <td><span className="status-badge">{o.status || 'Pending'}</span></td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
