import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import BaseModal from "./ui/BaseModal";
import { safeImageUrl } from '../lib/utils';

export default function WhatsAppModal({ product, onClose }) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  if (!product) return null;

  const totalPrice = product.price * quantity;

  const handleOpenWhatsApp = () => {
    const message = `Halo ${product.sellerName}, saya ingin memesan produk dari Portal UMKM Desa:
- *Produk*: ${product.title}
- *Jumlah*: ${quantity} ${product.unit}
- *Total Harga*: Rp ${totalPrice.toLocaleString('id-ID')}
${note ? `- *Catatan*: ${note}` : ''}

Mohon konfirmasi ketersediaan barang. Terima kasih!`;

    const encodedMessage = encodeURIComponent(message);
    // Normalize phone: keep digits only
    let phone = String(product.sellerPhone || '').replace(/\D/g, '');
    // Invalid if too short (Indonesian numbers are at least 9 digits + 62 = 11)
    const valid = phone.length >= 10 && phone.length <= 15;
    if (!valid) {
      alert('Nomor WhatsApp penjual tidak tersedia. Hubungi penjual langsung.');
      onClose();
      return;
    }
    if (phone.startsWith('0')) phone = '62' + phone.slice(1);
    if (!phone.startsWith('62')) phone = '62' + phone;
    const waUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    window.open(waUrl, '_blank');
    onClose();
  };

  return (
    <BaseModal isOpen={true} onClose={onClose} title="Pemesanan via WhatsApp">
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>

          <button className="modal-close-btn" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <h3 className="modal-header-title">Pemesanan via WhatsApp</h3>
          <p className="text-muted text-sm" style={{ marginBottom: '16px' }}>
            Pesanan Anda akan langsung terkirim ke WhatsApp penjual resmi.
          </p>

          <div className="form-field">
            <div className="modal-order-summary">
              <img src={safeImageUrl(product.image)} alt={product.title} className="modal-product-img" />
              <div style={{ flex: 1 }}>
                <h4 className="font-bold" style={{ fontSize: "1rem", color: "#1E293B", margin: '0 0 4px' }}>
                  {product.title}
                </h4>
                <div className="text-muted text-sm" style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: '4px' }}>
                  <span>{product.sellerName}</span>
                  <CheckCircle2 size={14} color="#2563EB" />
                </div>
                <div className="font-bold" style={{ fontSize: "0.95rem", color: "#1E40AF" }}>
                  Rp {product.price.toLocaleString('id-ID')} {product.unit}
                </div>
              </div>
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Jumlah Pesanan:</label>
            <div className="qty-controls">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="qty-btn"
              >
                -
              </button>
              <span className="qty-value">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="qty-btn"
              >
                +
              </button>
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Catatan Tambahan (Opsional):</label>
            <input
              type="text"
              placeholder="Misal: Alamat pengiriman / varian warna..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="form-input"
            />
          </div>

          <button onClick={handleOpenWhatsApp} className="btn-wa-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.74a9 9 0 1 1-5.56-5.56m5.56 5.56a9 9 0 1 0 5.56 5.56zm-5.56-5.56a9 9 0 1 0-5.56-5.56M9 12a3 3 0 1 0 6 0m6 6a3 3 0 1 0-6 0m-6-6a3 3 0 1 0 6 0m-6-6a3 3 0 1 0 6 0"></path>
            </svg>
            <span>Lanjutkan ke WhatsApp (Total: Rp {totalPrice.toLocaleString('id-ID')})</span>
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
