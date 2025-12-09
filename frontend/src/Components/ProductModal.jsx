import React, { useState } from 'react';

export default function ProductModal({ product, onClose, onConfirm, loading }) {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const max = product.count ?? Infinity;
  const increment = () => setQuantity((q) => Math.min(max, q + 1));
  const decrement = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="modal-media">
          <img src={product.images || product.image || 'https://via.placeholder.com/600x400?text=No+Image'} alt={product.product_name || product.name} />
        </div>
        <div className="modal-body">
          <h3>{(product.product_name || product.name || '').replace(/\b\w/g, c => c.toUpperCase())}</h3>
          <p className="modal-price">Price: <strong>${product.price}</strong></p>
          <p className="modal-stock">{product.count ? `${product.count} in stock` : 'In stock'}</p>

          <div className="quantity-control">
            <button onClick={decrement} aria-label="Decrease quantity">−</button>
            <input aria-label="Quantity" value={quantity} onChange={(e) => {
              const v = Math.max(1, Number(e.target.value || 1));
              setQuantity(Math.min(max, v));
            }} />
            <button onClick={increment} aria-label="Increase quantity">+</button>
          </div>

          {product.count && quantity > product.count && (
            <div style={{ color: '#b00020', marginTop: 8 }}>Quantity exceeds available stock</div>
          )}

          <div style={{ marginTop: 12 }}>
            <button className="auth-btn" onClick={() => onConfirm(quantity)} disabled={loading || (product.count && quantity > product.count)}>
              {loading ? 'Placing order...' : (product.count && quantity > product.count) ? 'Too many' : 'Confirm Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
