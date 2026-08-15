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

        </div>
      </div>
    </section>
  );
}
