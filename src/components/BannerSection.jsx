import React from 'react';

export default function BannerSection({ onLearnMore }) {
  return (
    <section className="container banner-section" id="tentang">
      <div className="banner-card">
        <div className="banner-grid">
          {/* Left Text */}
          <div>
            <h2 className="banner-title">Potensi Desa Digital Kami</h2>
            <p className="banner-desc">
              Kami percaya bahwa teknologi dapat mempertemukan kearifan lokal dengan pasar yang lebih luas. Melalui platform ini, kami berkomitmen untuk memberdayakan setiap pelaku UMKM di desa agar dapat bersaing secara global sambil tetap menjaga keaslian budaya kami.
            </p>

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
