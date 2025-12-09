import React, { useEffect, useState } from 'react';
import axios from '../api/axios.js';
import { useNavigate } from 'react-router-dom';
import './admin.css';
import Toast from './Toast';
import AddUserModal from './AddUserModal';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: '' });
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/api/users',{
        headers:{ 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
      setUsers(res.data?.data || []);
    } catch (err) {
      setToast({ message: 'Failed to load users', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditing(user.id);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || ''
    });
  };

  const handleSave = async (userId) => {
    try {
      const res = await axios.put(`http://localhost:3000/api/users/update/${userId}`, formData,{
        headers:{ 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
      // backend returns { message, user }
      if (res.status === 200 && res.data?.user) {
        const updatedUser = res.data.user;
        setToast({ message: res.data.message || 'User updated', type: 'success' });
        setUsers(prev => prev.map(u => (u.id === userId ? { ...u, ...updatedUser } : u)));
        setEditing(null);
      } else if (res.data?.message) {
        setToast({ message: res.data.message, type: 'error' });
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Update failed', type: 'error' });
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await axios.delete(`http://localhost:3000/api/users/delete/${userId}`,{
        headers:{ 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
      if (res.data?.success || res.status === 200) {
        setToast({ message: 'User deleted successfully', type: 'success' });
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Delete failed', type: 'error' });
    }
  };

  return (
    <div className="admin-wrap">
      <div className="admin-container">
        <div className="list-header">
          <h2>Users</h2>
          <div className="header-actions">
            <button className="btn-back" onClick={() => setShowAddModal(true)}>+ Add User</button>
            <button className="btn-back" onClick={() => navigate('/admin/dashboard')}>← Back</button>
          </div>
        </div>
        <AddUserModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); fetchUsers(); }} />
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

        {loading ? (
          <p>Loading users...</p>
        ) : users.length === 0 ? (
          <p>No users found</p>
        ) : (
          <div className="list-table-wrap">
            <table className="list-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    {editing === u.id ? (
                      <>
                        <td>
                          <input type="text" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} />
                        </td>
                        <td>
                          <input type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} />
                        </td>
                        <td>
                          <select value={formData.role} onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}>
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td><span className="role-badge">{u.role}</span></td>
                      </>
                    )}
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      {editing === u.id ? (
                        <>
                          <button className="btn-primary" onClick={() => handleSave(u.id)}>Save</button>
                          <button className="btn-back" onClick={() => setEditing(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button className="btn-primary" onClick={() => handleEdit(u)}>Edit</button>
                          <button className="btn-danger" onClick={() => handleDelete(u.id)}>Delete</button>
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
