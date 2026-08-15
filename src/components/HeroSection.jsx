import React from "react";
import { Search, BadgeCheck } from "lucide-react";

export default function HeroSection({
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearchSubmit) onSearchSubmit();
  };

  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-grid">
          {/* Left Text */}
          <div className="hero-content">
            <h1 className="hero-title">Pasar Digital Desa</h1>

            <p className="hero-desc">
              Dukung pertumbuhan ekonomi lokal dengan berbelanja produk unggulan
              langsung dari pengrajin dan petani desa kami. Kualitas autentik,
              harga terbaik.
            </p>

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

          {/* Right Banner Image */}
          <div className="hero-image-wrapper">
            <img
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80"
              alt="Pasar Digital Desa"
              className="hero-img"
            />

            <div className="hero-float-badge">
              <div className="badge-icon-box">
                <BadgeCheck size={22} />
              </div>
              <div>
                <div className="badge-text-title">Pelaku UMKM</div>
                <div className="badge-text-sub">Terverifikasi Digital</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
