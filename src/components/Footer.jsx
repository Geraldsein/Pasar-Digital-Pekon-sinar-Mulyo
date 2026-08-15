import React, { useState } from "react";
import { Share2, Globe, ShieldCheck, Truck, X } from "lucide-react";

const INFO_CONTENT = {
  privasi: {
    title: "Kebijakan Privasi",
    body: "Data pribadi Anda (nama, email, nomor HP) hanya digunakan untuk keperluan pendaftaran UMKM, verifikasi produk, dan komunikasi layanan. Kami tidak membagikan data Anda kepada pihak ketiga tanpa persetujuan. Data disimpan aman di Supabase dengan enkripsi dan proteksi RLS."
  },
  syarat: {
    title: "Syarat & Ketentuan",
    body: "Dengan mendaftar sebagai UMKM, Anda menyetujui: (1) Produk yang ditampilkan adalah produk asli usaha Anda; (2) Informasi harga dan stok harus akurat; (3) Produk yang melanggar hukum atau etika akan ditolak/dihapus tanpa pemberitahuan; (4) Pihak pengelola berhak meninjau dan memverifikasi setiap produk sebelum tampil di katalog publik."
  },
  bantuan: {
    title: "Bantuan",
    body: "Butuh bantuan? Hubungi kami melalui:\n\n• Email: sinarmulyo95@gmail.com\n• Jam layanan: Senin–Jumat, 08.00–16.00 WIB\n\nKami siap membantu pendaftaran akun, verifikasi produk, dan kendala teknis lainnya."
  },
  website: {
    title: "Website Resmi Desa",
    body: "Portal ini adalah bagian dari ekosistem digital desa. Informasi resmi desa (profil, pemerintahan, layanan publik) dapat diakses melalui website resmi desa atau kantor balai desa setempat."
  }
};

export default function Footer({ onOpenAuth }) {
  const [info, setInfo] = useState(null);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleShare = async () => {
    const shareData = {
      title: "Pasar Digital Desa",
      text: "Belanja produk UMKM desa di Pasar Digital Desa!",
      url: window.location.href
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Tautan portal berhasil disalin!");
      }
    } catch {
      /* user membatalkan share */
    }
  };

  return (
    <footer className="footer" id="kontak">
      <div className="container">
        <div className="footer-top-grid">
          {/* Brand Info */}
          <div>
            <div className="footer-brand">UMKM Desa</div>
            <p className="footer-desc">
              Membangun kemandirian ekonomi desa melalui digitalisasi dan
              pemberdayaan produk lokal yang berkualitas.
            </p>
            <div className="footer-socials">
              <button className="social-btn" title="Bagikan Portal" onClick={handleShare}>
                <Share2 size={18} />
              </button>
              <button className="social-btn" title="Website Resmi Desa" onClick={() => setInfo('website')}>
                <Globe size={18} />
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="footer-title">Tautan Cepat</h4>
            <ul className="footer-links">
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onOpenAuth) onOpenAuth();
                    else scrollTo("kategori");
                  }}
                >
                  Daftar UMKM
                </a>
              </li>
              <li>
                <a href="#produk" onClick={(e) => { e.preventDefault(); scrollTo("produk"); }}>
                  Cara Belanja
                </a>
              </li>
              <li>
                <a href="#tentang" onClick={(e) => { e.preventDefault(); scrollTo("tentang"); }}>
                  Profil Desa
                </a>
              </li>
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h4 className="footer-title">Bantuan</h4>
            <ul className="footer-links">
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); setInfo('privasi'); }}>
                  Kebijakan Privasi
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); setInfo('syarat'); }}>
                  Syarat & Ketentuan
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); setInfo('bantuan'); }}>
                  Bantuan
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div>© 2026 UMKM Desa Digital. Seluruh Hak Cipta Dilindungi.</div>

          <div className="footer-badges">
            <div className="footer-badge-item" title="Seluruh transaksi melalui WhatsApp diarahkan ke penjual terverifikasi">
              <ShieldCheck size={16} color="#059669" />
              <span>Transaksi Aman</span>
            </div>
            <div className="footer-badge-item" title="Produk dikirim oleh penjual lokal di desa">
              <Truck size={16} color="#2563EB" />
              <span>Pengiriman Lokal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Modal */}
      {info && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: "20px"
          }}
          onClick={() => setInfo(null)}
        >
          <div
            style={{
              background: "white", borderRadius: "16px", padding: "28px",
              maxWidth: "440px", width: "100%", position: "relative",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setInfo(null)}
              style={{
                position: "absolute", top: "14px", right: "14px",
                background: "none", border: "none", cursor: "pointer",
                color: "#64748B", padding: "4px"
              }}
              aria-label="Tutup"
            >
              <X size={20} />
            </button>
            <h3 style={{ margin: "0 0 12px", fontSize: "1.2rem", fontWeight: 800, color: "#0F172A" }}>
              {INFO_CONTENT[info].title}
            </h3>
            <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.7, color: "#475569", whiteSpace: "pre-line" }}>
              {INFO_CONTENT[info].body}
            </p>
          </div>
        </div>
      )}
    </footer>
  );
}
