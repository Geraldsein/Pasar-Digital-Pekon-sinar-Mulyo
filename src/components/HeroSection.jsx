import React from 'react';
import { Search, BadgeCheck } from 'lucide-react';

export default function HeroSection({
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  heroTitle = 'Pasar Digital Desa',
  heroDesc = 'Dukung pertumbuhan ekonomi lokal dengan berbelanja produk unggulan langsung dari pengrajin dan petani desa kami. Kualitas autentik, harga terbaik.',
  heroImage = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
  heroBadgeTitle = '150+ Pelaku UMKM',
  heroBadgeSubtitle = 'Terverifikasi Digital',
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearchSubmit) onSearchSubmit();
  };

  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-grid">
          <div className="hero-content">
            <h1 className="hero-title">{heroTitle}</h1>
            <p className="hero-desc">{heroDesc}</p>
            <form onSubmit={handleSubmit} className="search-bar">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                className="search-input"
                placeholder="Cari produk desa (misal: Kerajinan Bambu)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="btn-search">
                <Search size={18} />
                <span>Cari</span>
              </button>
            </form>
          </div>

          <div className="hero-image-wrapper">
            <img src={heroImage} alt={heroTitle} className="hero-img" />
            <div className="hero-float-badge">
              <div className="badge-icon-box">
                <BadgeCheck size={22} />
              </div>
              <div>
                <div className="badge-text-title">{heroBadgeTitle}</div>
                <div className="badge-text-sub">{heroBadgeSubtitle}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}