import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import BaseModal from "./ui/BaseModal";

export default function LocationModal({ product, onClose }) {
  if (!product) return null;

  const sellerAddress = product.location || `Dusun Krajan RT 03/RW 01, Desa Sukamaju, Kec. Digital, Kabupaten UMKM`;
  const encodedAddress = encodeURIComponent(`${product.sellerName} ${sellerAddress}`);
  const hasCoords = product.lat != null && product.lng != null;
  const lat = hasCoords ? Number(product.lat) : null;
  const lng = hasCoords ? Number(product.lng) : null;

  // Google Maps link: pakai koordinat jika ada, kalau tidak fallback ke pencarian alamat
  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

  // Embedded map: Google Maps embed pakai koordinat (tanpa API key), fallback ke OpenStreetMap
  const mapEmbedUrl = hasCoords
    ? `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`
    : `https://maps.google.com/maps?q=${encodedAddress}&z=15&output=embed`;

  return (
    <BaseModal isOpen={true} onClose={onClose} title="Peta & Lokasi UMKM">
      <div
        style={{
          background: 'linear-gradient(135deg, #0F2C59 0%, #1E40AF 100%)',
          color: 'white',
          padding: '24px 24px 18px',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
            <MapPin size={22} color="#FFFFFF" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'white' }}>Peta & Lokasi UMKM</h3>
            <p style={{ fontSize: '0.8rem', color: '#93C5FD', margin: 0 }}>Lokasi Penjual Resmi Desa Digital</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        <div className="seller-info-card">
          <img src={product.image} alt={product.title} className="seller-info-img" />
          <div style={{ flex: 1 }}>
            <div className="seller-info-label">{product.title}</div>
            <h4 className="seller-info-name">{product.sellerName}</h4>
            <div className="seller-info-addr">
              <MapPin size={14} color="#059669" />
              <span>{sellerAddress}</span>
            </div>
          </div>
        </div>

        <div className="map-container">
          <iframe
            title={`Peta Lokasi ${product.sellerName}`}
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            marginHeight="0"
            marginWidth="0"
            src={mapEmbedUrl}
            style={{ border: 0 }}
          />
          <div className="map-badge">
            <Navigation size={13} color="#60A5FA" />
            <span>Titik Lokasi UMKM Desa</span>
          </div>
        </div>

        <div className="action-grid">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textAlign: 'center' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path>
            </svg>
            <span>Buka Google Maps</span>
          </a>

          <a
            href={`https://wa.me/${product.sellerPhone}?text=Halo%20${encodeURIComponent(product.sellerName)},%20bisa%20kirimkan%20share%20location%20lokasi%20toko%20Anda%3F`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: '#325A70',
              color: 'white',
              textDecoration: 'none',
              padding: '12px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              textAlign: 'center'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            <span>Minta Share Loc</span>
          </a>
        </div>
      </div>
    </BaseModal>
  );
}
