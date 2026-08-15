import React, { useState, useMemo } from 'react';
import { LayoutDashboard, Package, ShieldAlert, CheckCircle2, Edit3, Trash2, PlusCircle, Search, Box } from 'lucide-react';
import DashboardLayout from './ui/DashboardLayout';
import StatCard from './ui/StatCard';
import EditProductModal from './EditProductModal';

export default function UmkmDashboard({ products, categories, currentUser, onAddProduct, onDeleteProduct, onProductUpdated, onBack }) {
  const [activePanel, setActivePanel] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const owner = currentUser?.id;
  const userName = currentUser?.user_metadata?.full_name || currentUser?.username || currentUser?.email?.split('@')[0] || 'UMKM';

  const myProducts = useMemo(() =>
    (products || []).filter(p => p && p.user_id && p.user_id === owner),
    [products, owner]
  );

  const handleEdit = (product) => { setEditingProduct(product); setShowEditModal(true); };
  const handleDelete = (productId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      if (onDeleteProduct) onDeleteProduct(productId);
    }
  };
  const handleProductUpdated = (updatedProduct) => { if (onProductUpdated) onProductUpdated(updatedProduct); };

  const getStatus = (p) => {
    if (p.verified) return { label: 'Terverifikasi', color: '#059669', bg: '#ECFDF5' };
    return { label: 'Menunggu', color: '#D97706', bg: '#FEF3C7' };
  };

  const filteredProducts = myProducts.filter(p => {
    const q = searchQuery.toLowerCase();
    const title = p.title?.toLowerCase?.() ?? '';
    const seller = p.sellerName?.toLowerCase?.() ?? '';
    const matchSearch = title.includes(q) || seller.includes(q);
    if (filterStatus === 'pending') return !p.verified && matchSearch;
    if (filterStatus === 'approved') return p.verified && matchSearch;
    return matchSearch;
  });

  const sidebarItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'products', label: 'Produk Saya', icon: Package },
  ];

  const renderDashboard = () => (
    <div>
      <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1E293B', marginBottom: '20px' }}>
        Selamat Datang, {userName}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard icon={Package} label="Total Produk Saya" value={myProducts.length} color="#059669" bg="#ECFDF5" />
        <StatCard icon={ShieldAlert} label="Menunggu Verifikasi" value={myProducts.filter(p => !p.verified).length} color="#D97706" bg="#FEF3C7" />
        <StatCard icon={CheckCircle2} label="Terverifikasi" value={myProducts.filter(p => p.verified).length} color="#2563EB" bg="#EFF6FF" />
      </div>
      <p style={{ fontSize: '0.9rem', color: '#64748B', marginTop: '20px' }}>
        Tambahkan produk baru, lalu pantau status verifikasinya di sini. Produk yang sudah terverifikasi akan tampil di katalog publik.
      </p>
    </div>
  );

  const renderProducts = () => (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={18} />
          <input type="text" placeholder="Cari produk..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 40px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {['all', 'pending', 'approved'].map(status => (
            <button key={status} onClick={() => setFilterStatus(status)} style={{
              padding: '8px 16px', border: filterStatus === status ? '2px solid #059669' : '1px solid #CBD5E1',
              borderRadius: '8px', background: filterStatus === status ? '#ECFDF5' : 'white',
              color: filterStatus === status ? '#059669' : '#64748B', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer'
            }}>
              {status === 'all' ? 'Semua' : status === 'pending' ? 'Menunggu' : 'Terverifikasi'}
            </button>
          ))}
          <button onClick={onAddProduct} style={{
            background: '#059669', color: 'white', border: 'none', padding: '10px 18px',
            borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <PlusCircle size={16} /> Tambah Produk
          </button>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <Box size={48} style={{ color: '#CBD5E1', marginBottom: '16px' }} />
          <p style={{ fontSize: '1.1rem', color: '#64748B' }}>Belum ada produk. Klik "Tambah Produk" untuk mulai.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredProducts.map(product => {
            const status = getStatus(product);
            return (
              <div key={product.id} style={{
                background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(15, 44, 89, 0.08)'
              }}>
                <div style={{ height: '150px', background: '#F1F5F9', overflow: 'hidden' }}>
                  <img src={product.image || ''} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>{product.title}</h4>
                    <span style={{
                      background: status.bg, color: status.color, padding: '2px 8px', borderRadius: '4px',
                      fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap'
                    }}>
                      {status.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '12px' }}>
                    {product.sellerName}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleEdit(product)} style={{
                      flex: 1, background: '#1E40AF', color: 'white', border: 'none', padding: '8px', borderRadius: '6px',
                      fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                    }}>
                      <Edit3 size={14} /> Edit
                    </button>
                    <button onClick={() => handleDelete(product.id)} style={{
                      flex: 1, background: 'white', border: '1px solid #E5E7EB', color: '#DC2626', padding: '8px', borderRadius: '6px',
                      fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                    }}>
                      <Trash2 size={14} /> Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      activeItem={activePanel}
      onSelectItem={setActivePanel}
      userName={currentUser?.user_metadata?.full_name || currentUser?.username || currentUser?.email?.split('@')[0] || 'UMKM'}
      userRole="UMKM"
      onBack={onBack}
      accentColor="#059669"
    >
      {activePanel === 'dashboard' && renderDashboard()}
      {activePanel === 'products' && renderProducts()}

      {showEditModal && editingProduct && (
        <EditProductModal
          product={editingProduct}
          categories={categories}
          onClose={() => { setShowEditModal(false); setEditingProduct(null); }}
          onProductUpdated={handleProductUpdated}
        />
      )}
    </DashboardLayout>
  );
}