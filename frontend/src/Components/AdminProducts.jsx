import React, { useEffect, useState } from 'react';
import axios from '../api/axios.js';
import { useNavigate } from 'react-router-dom';
import './admin.css';
import Toast from './Toast';
import AddProductModal from './AddProductModal';

export default function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ product_name: '', price: '', count: '', image: null, imagePreview: null });
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/api/products',{
        headers:{ 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
      setProducts(res.data?.data || []);
    } catch (err) {
      setToast({ message: 'Failed to load products', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditing(product.id);
    setFormData({
      product_name: product.product_name || '',
      price: product.price || '',
      count: product.count || '',
      image: null,
      imagePreview: product.images || product.image || null
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, image: reader.result, imagePreview: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (productId) => {
    try {
      const res = await axios.put(`http://localhost:3000/api/products/update/${productId}`, formData,{
        headers:{ 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
      if (res.data?.product) {
        setToast({ message: 'Product updated', type: 'success' });
        fetchProducts();
        setEditing(null);
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Update failed', type: 'error' });
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.post(`http://localhost:3000/api/products/delete/${productId}`,{
        headers:{ 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }  
      });
      setToast({ message: 'Product deleted successfully', type: 'success' });
      setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Delete failed', type: 'error' });
    }
  };

  return (
    <div className="admin-wrap">
      <div className="admin-container">
        <div className="list-header">
          <h2>Products</h2>
          <div className="header-actions">
            <button className="btn-back" onClick={() => setShowAddModal(true)}>+ Add Product</button>
            <button className="btn-back" onClick={() => navigate('/admin/dashboard')}>← Back</button>
          </div>
        </div>
        <AddProductModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); fetchProducts(); }} />
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

        {loading ? (
          <p>Loading products...</p>
        ) : products.length === 0 ? (
          <p>No products found</p>
        ) : (
          <div className="list-table-wrap">
            <table className="list-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>
                      {editing === p.id ? (
                        formData.imagePreview ? (
                          <img src={formData.imagePreview} alt="preview" style={{ width: 60, height: 40, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 60, height: 40, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No</div>
                        )
                      ) : (
                        <img src={p.images || p.image || 'https://via.placeholder.com/60x40?text=No'} alt={p.product_name} style={{ width: 60, height: 40, objectFit: 'cover' }} />
                      )}
                    </td>
                    <td>
                      {editing === p.id ? (
                        <>
                          <input
                            value={formData.product_name}
                            onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                            className="edit-input"
                          />
                          <div style={{ marginTop: 6 }}>
                            <input type="file" accept="image/*" onChange={handleImageChange} />
                          </div>
                        </>
                      ) : (
                        p.product_name
                      )}
                    </td>
                    <td>
                      {editing === p.id ? (
                        <input
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="edit-input"
                          type="number"
                        />
                      ) : (
                        `$${p.price}`
                      )}
                    </td>
                    <td>
                      {editing === p.id ? (
                        <input
                          value={formData.count}
                          onChange={(e) => setFormData({ ...formData, count: e.target.value })}
                          className="edit-input"
                          type="number"
                        />
                      ) : (
                        p.count
                      )}
                    </td>
                    <td>
                      {editing === p.id ? (
                        <>
                          <button className="btn-success" onClick={() => handleSave(p.id)}>Save</button>
                          <button className="btn-cancel" onClick={() => setEditing(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button className="btn-primary" onClick={() => handleEdit(p)}>Edit</button>
                          <button className="btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                        </>
                      )}
                    </td>
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
