import React, { useState, useEffect, useRef } from "react";
import { Store, PlusCircle, LogOut, User, ShieldCheck, Crown } from "lucide-react";

const getRoleConfig = (role) => {
  switch (role) {
    case 'superadmin':
      return {
        label: 'Super Admin',
        badgeBg: '#F5F3FF',
        badgeColor: '#7C3AED',
        btnBg: '#7C3AED',
        btnText: 'Super Admin',
        icon: Crown
      };
    case 'admin':
      return {
        label: 'Admin',
        badgeBg: '#FEF3C7',
        badgeColor: '#D97706',
        btnBg: '#DC2626',
        btnText: 'Admin',
        icon: ShieldCheck
      };
    case 'umkm':
      return {
        label: 'UMKM',
        badgeBg: '#DBEAFE',
        badgeColor: '#2563EB',
        btnBg: '#059669',
        btnText: '+ Tambah Produk',
        icon: PlusCircle
      };
    default:
      return {
        label: 'User',
        badgeBg: '#F1F5F9',
        badgeColor: '#64748B',
        btnBg: '#1E40AF',
        btnText: 'Masuk',
        icon: User
      };
  }
};

export default function Navbar({
  onNavClick,
  activeNav = "beranda",
  currentUser,
  onOpenAuth,
  onOpenUmkmDashboard,
  onLogout,
  onOpenAdmin,
  onOpenSuperAdmin,
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setIsScrolled(currentY > 10);

      // Mobile: navbar selalu tampil (hamburger harus selalu bisa ditekan)
      if (window.innerWidth <= 900) {
        setNavHidden(false);
        lastScrollY.current = currentY;
        return;
      }

      // Desktop: auto-hide tetap aktif
      if (currentY > 80 && currentY > lastScrollY.current) {
        setNavHidden(true);
      } else {
        setNavHidden(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // close menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const roleConfig = currentUser ? getRoleConfig(currentUser.role) : getRoleConfig(null);

  const navLinks = [
    { id: "beranda", label: "Beranda" },
    { id: "kategori", label: "Kategori" },
    { id: "tentang", label: "Tentang Kami" },
    { id: "kontak", label: "Kontak" },
  ];

  const handleNavClick = (id) => {
    setMenuOpen(false);
    onNavClick(id);
  };

  return (
    <header className={`navbar-header${isScrolled ? " scrolled" : ""}${navHidden ? " nav-hidden" : ""}`}>
      <div className="container navbar-container">
        <a href="#" className="navbar-brand">
          <div className="navbar-logo-icon">
            <Store size={20} />
          </div>
          <span>Pasar Digital Desa</span>
        </a>

        {/* Desktop nav */}
        <nav className="hide-mobile">
          <ul className="navbar-links">
            {navLinks.map(({ id, label }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className={`navbar-link ${activeNav === id ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); onNavClick(id); }}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {currentUser ? (
            <>
              {/* Compact dashboard buttons (icon only) for admin/superadmin */}
              {currentUser.role === 'superadmin' && onOpenSuperAdmin && (
                <button
                  onClick={onOpenSuperAdmin}
                  title="Dashboard Super Admin"
                  className="hide-mobile"
                  style={{
                    width: "38px", height: "38px",
                    backgroundColor: roleConfig.btnBg,
                    color: "white",
                    borderRadius: "10px",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Crown size={18} />
                </button>
              )}

              {currentUser.role === 'admin' && onOpenAdmin && (
                <button
                  onClick={onOpenAdmin}
                  title="Dashboard Admin"
                  className="hide-mobile"
                  style={{
                    width: "38px", height: "38px",
                    backgroundColor: roleConfig.btnBg,
                    color: "white",
                    borderRadius: "10px",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ShieldCheck size={18} />
                </button>
              )}

              {/* UMKM: compact dashboard icon */}
              {currentUser.role === 'umkm' && onOpenUmkmDashboard && (
                <button
                  onClick={onOpenUmkmDashboard}
                  title="Dashboard UMKM"
                  className="hide-mobile"
                  style={{
                    width: "38px", height: "38px",
                    backgroundColor: roleConfig.btnBg,
                    color: "white",
                    borderRadius: "10px",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Store size={18} />
                </button>
              )}

              {/* Compact Avatar */}
              <div
                title={currentUser.user_metadata?.full_name || currentUser.username || currentUser.email}
                className="navbar-user-avatar"
                style={{ background: roleConfig.btnBg }}
              >
                {(currentUser.user_metadata?.full_name || currentUser.username || currentUser.email || "U").charAt(0).toUpperCase()}
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                title="Keluar / Logout"
                style={{
                  background: "none",
                  border: "1px solid #CBD5E1",
                  borderRadius: "8px",
                  padding: "8px",
                  cursor: "pointer",
                  color: "#64748B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <button className="hide-mobile" onClick={onOpenAuth} style={{
                background: 'none', border: '1px solid #CBD5E1', color: '#64748B',
                padding: '7px 16px', borderRadius: '8px', fontWeight: 500, fontSize: '0.85rem', cursor: 'pointer'
              }}>
                Login Admin
              </button>
              <button className="show-mobile" onClick={onOpenAuth} style={{
                background: 'none', border: '1px solid #CBD5E1', color: '#64748B',
                padding: '6px 12px', borderRadius: '8px', fontWeight: 500, fontSize: '0.8rem', cursor: 'pointer'
              }}>
                Login
              </button>
            </>
          )}

          {/* Hamburger Toggle */}
          <button
            className="show-mobile"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 4px',
              color: '#1E293B',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <>
          <div className="mobile-nav-overlay" onClick={() => setMenuOpen(false)} />
          <div className="mobile-nav-menu">
            {navLinks.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className={`mobile-nav-link ${activeNav === id ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); handleNavClick(id); }}
              >
                {label}
              </a>
            ))}
            {currentUser && ['superadmin', 'admin', 'umkm'].includes(currentUser.role) && (
              <a
                href="#"
                className="mobile-nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  setMenuOpen(false);
                  if (currentUser.role === 'superadmin' && onOpenSuperAdmin) onOpenSuperAdmin();
                  else if (currentUser.role === 'admin' && onOpenAdmin) onOpenAdmin();
                  else if (currentUser.role === 'umkm' && onOpenUmkmDashboard) onOpenUmkmDashboard();
                }}
              >
                {currentUser.role === 'superadmin' ? 'Dashboard Super Admin' :
                 currentUser.role === 'admin' ? 'Dashboard Admin' : 'Dashboard UMKM'}
              </a>
            )}
          </div>
        </>
      )}
    </header>
  );
}
