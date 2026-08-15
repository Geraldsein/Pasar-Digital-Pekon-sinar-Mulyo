import React, { useState } from "react";
import { ArrowLeft, Menu, X, Store } from "lucide-react";

export default function DashboardLayout({
  sidebarItems,
  activeItem,
  onSelectItem,
  userName = "Admin",
  userRole = "Admin",
  onBack,
  accentColor = "#0F2C59",
  children,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <div className="dashboard-sidebar" style={{ background: accentColor }}>
      <div className="dashboard-sidebar-brand">
        <div className="dashboard-sidebar-logo">
          <Store size={20} color="#fff" />
        </div>
        <div>
          <div className="dashboard-sidebar-title">Pasar Digital Desa</div>
          <div className="dashboard-sidebar-sub">{userRole} Panel</div>
        </div>
      </div>

      <nav className="dashboard-sidebar-nav">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.key;
          return (
            <button
              key={item.key}
              className={`dashboard-sidebar-item${isActive ? " active" : ""}`}
              onClick={() => {
                onSelectItem(item.key);
                setMobileOpen(false);
              }}
              style={isActive ? { background: "rgba(255,255,255,0.15)", color: "#fff" } : undefined}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="dashboard-sidebar-footer">
        <button className="dashboard-sidebar-back" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Kembali ke Website</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="dashboard-layout">
      {/* Desktop sidebar */}
      <aside className="dashboard-sidebar-desktop">{sidebar}</aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="dashboard-sidebar-overlay" onClick={() => setMobileOpen(false)}>
          <aside onClick={(e) => e.stopPropagation()}>{sidebar}</aside>
        </div>
      )}

      <div className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <button className="dashboard-menu-btn" onClick={() => setMobileOpen(true)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="dashboard-header-title">
            {sidebarItems.find((i) => i.key === activeItem)?.label || "Dashboard"}
          </div>

          <div className="dashboard-header-user">
            <div className="dashboard-user-avatar" style={{ background: accentColor }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="dashboard-user-info">
              <div className="dashboard-user-name">{userName}</div>
              <div className="dashboard-user-role" style={{ color: accentColor }}>
                {userRole}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
