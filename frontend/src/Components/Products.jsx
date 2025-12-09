import React, { useEffect, useState } from 'react';
import axios from '../api/axios.js';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './auth.css';
import Toast from './Toast';
import ProductModal from './ProductModal';

export default function Products() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get('http://localhost:3000/api/products',{
          headers:{ 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        });
        if (res.data?.success) setProducts(res.data.data || []);
        else setError(res.data?.message || 'Failed to load products');
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);


  const handleOrderClick = (product) => {
    if (!user) {
      setToast({ message: 'Please login to place an order', type: 'error' });
      return;
    }
    setSelected(product);
  };

  const handleConfirmOrder = async (quantity) => {
    if (!user || !selected) return;
    setLoading(true);
    try {
      const payload = { user_id: user.id, product_id: selected.id, quantity };
      const res = await axios.post('http://localhost:3000/api/orders', payload);
      // backend returns success flag; only update UI when success === true
      if (res.data && res.data.success) {
        const msg = res.data?.message || 'Order placed';
        setToast({ message: msg, type: 'success' });
        setProducts((prev) => prev.map(p => p.id === selected.id ? { ...p, count: Math.max(0, (p.count ?? 1) - quantity) } : p));
        setSelected(null);
      } else {
        const msg = res.data?.message || 'Order failed';
        setToast({ message: msg, type: 'error' });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Order failed';
      setToast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async (e) => {
    e.preventDefault()
    try{
        let result = await axios.post('http://localhost:3000/api/users/logout',
          {refreshToken: localStorage.getItem("refreshToken")},
          { withCredentials: true },{
            headers:{ 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
          });
        if(result.data.success){
            navigate('/login');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        }   
    }catch(err){
      console.log(err);
    }   
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card products">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 className="auth-title">Products</h2>
          <div>
            {
              user.role === 'admin' && (
              <button className="auth-btn" onClick={() => navigate('/admin/dashboard')} style={{ width: 'auto', padding: '8px 14px' }}>
                Dashboard
              </button>
              )
            }
            <button className="auth-btn" onClick={() => navigate('/orders')} style={{ width: 'auto', padding: '8px 14px', marginLeft:'10px'}}>
                My Orders
            </button>
            <button className="auth-btn" onClick={(e)=>handleLogout(e)} style={{ width: 'auto', padding: '8px 14px', marginLeft:'10px' }}>
                Logout
            </button>
          </div>
        </div>
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
        {loading && <p>Loading...</p>}
        {error && <div className="auth-error">{error}</div>}
        {!loading && !error && (
          <div className="products-grid">
            {products.length === 0 && <div>No products available</div>}
            {products.map((p) => (
              <div key={p.id} className="product-card">
                <div className="product-media">
                  <img src={p.images || p.image || 'https://via.placeholder.com/300x200?text=No+Image'} alt={p.product_name || p.name} />
                </div>
                <div className="product-body">
                  <h3 className="product-title">{(p.product_name || p.name || '').replace(/\b\w/g, c => c.toUpperCase())}</h3>
                  <div className="product-meta">
                    <span className="product-price">${p.price}</span>
                    <span className="product-stock">{p.count ? `${p.count} in stock` : 'In stock'}</span>
                  </div>
                  <div className="product-actions">
                    <button className="auth-btn" onClick={() => handleOrderClick(p)} disabled={p.count === 0 || loading}>
                      {p.count === 0 ? 'Sold out' : 'Order'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {selected && (
          <ProductModal
            product={selected}
            onClose={() => setSelected(null)}
            onConfirm={handleConfirmOrder}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}
