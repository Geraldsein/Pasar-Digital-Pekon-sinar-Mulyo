import React from "react";

export default function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ background: bg, color }}>
        <Icon size={24} />
      </div>
      <div>
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-label">{label}</div>
      </div>
    </div>
  );
}
