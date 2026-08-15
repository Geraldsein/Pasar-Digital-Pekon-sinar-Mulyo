import React from 'react';

export default function BannerSection({ onLearnMore }) {
  return (
    <section className="container banner-section" id="tentang">
      <div className="banner-card">
        <div className="banner-grid">
          {/* Left Text & Stats */}
          <div>
            <h2 className="banner-title">Potensi Desa Digital Kami</h2>
            <p className="banner-desc">
              Kami percaya bahwa teknologi dapat mempertemukan kearifan lokal dengan pasar yang lebih luas. Melalui platform ini, kami berkomitmen untuk memberdayakan setiap pelaku UMKM di desa agar dapat bersaing secara global sambil tetap menjaga keaslian budaya kami.
            </p>

            <div className="banner-stats">
              <div>
                <div className="stat-number">500+</div>
                <div className="stat-label">Produk Terdaftar</div>
              </div>
              <div>
                <div className="stat-number">25</div>
                <div className="stat-label">Kelompok Tani</div>
              </div>
            </div>

            <button className="btn-banner-cta" onClick={onLearnMore}>
              Pelajari Selengkapnya
            </button>
          </div>

          {/* Right Angled Image Frame */}
          <div className="banner-img-container">
            <div className="banner-img-frame">
              <img
                src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80"
                alt="Kebanggaan Lokal"
                className="banner-img"
              />
            </div>
            <div className="banner-badge-bottom">
              Kebanggaan Lokal
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
