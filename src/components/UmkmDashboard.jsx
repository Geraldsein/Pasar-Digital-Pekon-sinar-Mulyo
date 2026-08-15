import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, Package, ShieldAlert, CheckCircle2, Edit3, Trash2, PlusCircle, Search, Box, Store, Navigation, Save } from 'lucide-react';
import DashboardLayout from './ui/DashboardLayout';
import StatCard from './ui/StatCard';
import EditProductModal from './EditProductModal';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function UmkmDashboard({ products, categories, currentUser, onAddProduct, onDeleteProduct, onProductUpdated, onBack }) {
  const [activePanel, setActivePanel] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Seller profile state
  const [businessName, setBusinessName] = useState('');
  const [nib, setNib] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  const owner = currentUser?.id;
  const userName = currentUser?.user_metadata?.full_name || currentUser?.username || currentUser?.email?.split('@')[0] || 'UMKM';

  const myProducts = useMemo(() =>
    (products || []).filter(p => p && p.user_id && p.user_id === owner),
    [products, owner]
  );

  // Load seller profile on mount
  useEffect(() => {
    if (!owner) { setProfileLoading(false); return; }
    const loadProfile = async () => {
      if (supabase && isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('sellers')
            .select('*')
            .eq('user_id', owner)
            .maybeSingle();
          if (!error && data) {
            setBusinessName(data.business_name || '');
            setNib(data.nib || '');
            setPhone(data.phone || '');
            setLocation(data.location || '');
            setLat(data.lat != null ? String(data.lat) : '');
            setLng(data.lng != null ? String(data.lng) : '');
          }
        } catch (e) { console.warn('Gagal memuat profil:', e); }
      }
      setProfileLoading(false);
    };
    loadProfile();
  }, [owner]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) { setProfileErr('Browser tidak mendukung geolokasi.'); return; }
    setLocating(true);
    setProfileErr('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      (err) => {
        setProfileErr('Gagal mengambil lokasi: ' + (err.message || 'izin ditolak'));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveProfile = async () => {
    if (!owner) return;
    if (!supabase || !isSupabaseConfigured) {
      setProfileErr('Supabase belum dikonfigurasi.');
      return;
    }
    setProfileSaving(true);
    setProfileErr('');
    setProfileMsg('');
    try {
      const payload = {
        user_id: owner,
        phone: phone || (currentUser?.email || ''),
        business_name: businessName || null,
        nib: nib || null,
        location: location || null,
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
      };
      const { error } = await supabase
        .from('sellers')
        .upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;
      setProfileMsg('Profil usaha berhasil disimpan.');
    } catch (e) {
      setProfileErr(e.message || 'Gagal menyimpan profil.');
    } finally {
      setProfileSaving(false);
    }
  };

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
    { key: 'profile', label: 'Profil Usaha', icon: Store },
  ];

  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: '8px',
    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
  };
  const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#1E293B' };

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
        Lengkapi <strong>Profil Usaha</strong> (termasuk lokasi Google Maps) agar pembeli dapat menemukan lokasi usaha Anda.
        Tambahkan produk baru, lalu pantau status verifikasinya di sini.
      </p>
    </div>
  );

  const renderProfile = () => (
    <div style={{ maxWidth: '640px' }}>
      <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1E293B', marginBottom: '6px' }}>Profil Usaha</h3>
      <p style={{ fontSize: '0.9rem', color: '#64748B', marginBottom: '20px' }}>
        Data ini dipakai untuk akun UMKM Anda. Lokasi usaha akan otomatis dipakai sebagai lokasi produk yang Anda tambahkan.
      </p>

      {profileErr && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
          {profileErr}
        </div>
      )}
      {profileMsg && (
        <div style={{ background: '#DCFCE7', color: '#166534', padding: '12px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
          {profileMsg}
        </div>
      )}

      {profileLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>Memuat profil...</div>
      ) : (
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={labelStyle}>Nama Usaha / UMKM</label>
              <input style={inputStyle} value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Nama usaha Anda" />
            </div>
            <div>
              <label style={labelStyle}>NIB</label>
              <input style={inputStyle} value={nib} onChange={(e) => setNib(e.target.value)} placeholder="Nomor Induk Berusaha" />
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>No. WhatsApp</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: '8px', overflow: 'hidden' }}>
              <span style={{ padding: '10px 0 10px 14px', fontSize: '0.9rem', color: '#94A3B8', fontWeight: 600, userSelect: 'none', background: '#F8FAFC', borderRight: '1px solid #E2E8F0' }}>+62</span>
              <input style={{ flex: 1, padding: '10px 12px', border: 'none', fontSize: '0.9rem', outline: 'none' }}
                value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="81234567890" />
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Alamat Usaha</label>
            <textarea rows={2} style={inputStyle} value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder="Dusun, Desa, Kecamatan, Kabupaten..." />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Lokasi Google Maps</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
              <input style={inputStyle} value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Latitude (mis. -8.375000)" />
              <input style={inputStyle} value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Longitude (mis. 115.225000)" />
            </div>
            <button
              onClick={handleGetLocation}
              disabled={locating}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#059669', color: 'white', border: 'none', padding: '10px 18px',
                borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: locating ? 'not-allowed' : 'pointer', opacity: locating ? 0.7 : 1
              }}
            >
              <Navigation size={16} />
              {locating ? 'Mengambil lokasi...' : 'Ambil Lokasi Saya (GPS)'}
            </button>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '6px' }}>
              Klik tombol untuk otomatis mengisi koordinat dari perangkat, atau isi manual.
            </p>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={profileSaving}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: '#1E40AF', color: 'white', border: 'none', padding: '12px', borderRadius: '10px',
              fontWeight: 700, fontSize: '0.95rem', cursor: profileSaving ? 'not-allowed' : 'pointer', opacity: profileSaving ? 0.75 : 1
            }}
          >
            <Save size={18} />
            {profileSaving ? 'Menyimpan...' : 'Simpan Profil Usaha'}
          </button>
        </div>
      )}
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
      {activePanel === 'profile' && renderProfile()}

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
