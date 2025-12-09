import React, { useState } from 'react';
import axios from '../api/axios.js'
import './admin.css';

export default function AddProductModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({ product_name: '', price: '', count: '', image: null });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageMode, setImageMode] = useState('upload'); // 'upload' or 'url'
  const MAX_IMAGE_SIZE_KB = 600; // preferred max size in KB (adjustable)

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    // quick size check
    const sizeKB = Math.round(file.size / 1024);
    // If file is small enough, just read and set
    if (sizeKB <= MAX_IMAGE_SIZE_KB) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Otherwise try to compress/rescale on client
    compressImageFile(file, MAX_IMAGE_SIZE_KB)
      .then((dataUrl) => {
        // dataUrl may still be larger if cannot compress enough
        const finalKB = Math.round((dataUrl.length * (3/4)) / 1024); // approximate
        if (finalKB > MAX_IMAGE_SIZE_KB) {
          setError(`File is too large (${(sizeKB/1024).toFixed(2)} MB). After compression it's ${(finalKB/1024).toFixed(2)} MB which still exceeds ${ (MAX_IMAGE_SIZE_KB/1024).toFixed(2) } MB.`);
        }
        setFormData(prev => ({ ...prev, image: dataUrl }));
        setImagePreview(dataUrl);
      })
      .catch((err) => {
        console.error('Compression error', err);
        setError(`Failed to process image. File size ${(sizeKB/1024).toFixed(2)} MB.`);
      });
  };

  // Compress image file to be under maxKB (approx). Returns dataURL string.
  const compressImageFile = (file, maxKB = 600) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = (e) => reject(e);
      reader.onload = () => {
        const img = new Image();
        img.onload = async () => {
          try {
            // start with original dimensions
            let canvas = document.createElement('canvas');
            let ctx = canvas.getContext('2d');
            let [width, height] = [img.width, img.height];

            // scale down large images proportionally to a max width
            const MAX_DIMENSION = 1600;
            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
              const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
              width = Math.round(width * ratio);
              height = Math.round(height * ratio);
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // try reducing quality iteratively
            let quality = 0.92;
            let dataUrl = canvas.toDataURL('image/jpeg', quality);
            const targetBytes = maxKB * 1024;
            // approximate bytes from base64 length
            const approxBytes = (str) => Math.round((str.length * (3/4)));

            let tries = 0;
            while (approxBytes(dataUrl) > targetBytes && quality > 0.4 && tries < 8) {
              quality -= 0.12; // reduce quality
              dataUrl = canvas.toDataURL('image/jpeg', Math.max(0.35, quality));
              tries += 1;
            }

            // if still too big, scale down dimensions further
            while (approxBytes(dataUrl) > targetBytes && (width > 400 || height > 400) && tries < 14) {
              width = Math.round(width * 0.8);
              height = Math.round(height * 0.8);
              canvas.width = width;
              canvas.height = height;
              ctx.drawImage(img, 0, 0, width, height);
              dataUrl = canvas.toDataURL('image/jpeg', Math.max(0.35, quality));
              tries += 1;
            }

            resolve(dataUrl);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = (e) => reject(e);
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, image: url }));
    setImagePreview(url || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.product_name || !formData.price || !formData.count) {
      setError('All fields are required');
      return;
    }

    if (isNaN(formData.price) || formData.price <= 0) {
      setError('Price must be a valid positive number');
      return;
    }

    if (isNaN(formData.count) || formData.count < 0) {
      setError('Stock count must be a valid non-negative number');
      return;
    }

    setLoading(true);
    try {
      const postData = {
        product_name: formData.product_name,
        price: parseFloat(formData.price),
        count: parseInt(formData.count, 10)
      };
      
      if (formData.image) {
        postData.image = formData.image;
      }

      await axios.post('http://localhost:3000/api/products', postData,{
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      setFormData({ product_name: '', price: '', count: '', image: null });
      setImagePreview(null);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Product</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Product Name</label>
            <input
              type="text"
              name="product_name"
              value={formData.product_name}
              onChange={handleChange}
              placeholder="Enter product name"
              required
            />
          </div>

          <div className="form-group">
            <label>Price</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="Enter price"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label>Stock Count</label>
            <input
              type="number"
              name="count"
              value={formData.count}
              onChange={handleChange}
              placeholder="Enter stock count"
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label>Product Image (Optional)</label>
            <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="radio" name="imageMode" value="upload" checked={imageMode === 'upload'} onChange={() => setImageMode('upload')} /> Upload
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="radio" name="imageMode" value="url" checked={imageMode === 'url'} onChange={() => setImageMode('url')} /> URL
              </label>
            </div>

            {imageMode === 'upload' ? (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  placeholder="Upload product image"
                />
              </>
            ) : (
              <>
                <input
                  type="url"
                  name="imageUrl"
                  placeholder="https://example.com/image.jpg"
                  onChange={handleImageUrlChange}
                />
              </>
            )}

            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Product'}
            </button>
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
