import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ShieldAlert, ShieldCheck, CheckCircle2, Edit3, Trash2, PlusCircle, Search, Box, Store, Snowflake, Palette, Lock, Pencil, X } from 'lucide-react';
import ImageUploader from './ui/ImageUploader';
import DashboardLayout from './ui/DashboardLayout';
import StatCard from './ui/StatCard';
import EditProductModal from './EditProductModal';
import { buildUmkmList, safeImageUrl } from '../lib/utils';
import { changePasswordWithReauth } from '../lib/supabase';

export default function AdminDashboard({ products, categories, onVerifyProduct, onDeleteProduct, onProductUpdated, onAddProduct, onBack, currentUser, frozenUmkm = [], onToggleFreezeUmkm, onDeleteUmkm, siteContent = {}, onSaveSiteContent }) {
  const [activePanel, setActivePanel] = useState('dashboard');
  const [pendingProducts, setPendingProducts] = useState([]);
  const [approvedProducts, setApprovedProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const userName = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Admin';

  useEffect(() => {
    const pending = (products || []).filter(p => !p.verified);
    const approved = (products || []).filter(p => p.verified);
    setPendingProducts(pending);
    setApprovedProducts(approved);
  }, [products]);

  const openRejectModal = (productId) => { setRejectModal(productId); setRejectReason(''); };
  const confirmReject = () => {
    if (!rejectReason.trim()) return;
    if (onVerifyProduct) onVerifyProduct(rejectModal, false, rejectReason.trim());
    setRejectModal(null);
    setRejectReason('');
  };
  const handleVerify = (productId, verified) => { if (onVerifyProduct) onVerifyProduct(productId, verified); };
  const handleDelete = (productId) => { if (window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) { if (onDeleteProduct) onDeleteProduct(productId); } };
  const handleEdit = (product) => { setEditingProduct(product); setShowEditModal(true); };
  const handleProductUpdated = (updatedProduct) => { if (onProductUpdated) onProductUpdated(updatedProduct); };

  const getStatus = (p) => {
    if (p.verified) return { label: 'Verified', color: '#059669', bg: '#ECFDF5' };
    if (p.status === 'rejected') return { label: 'Ditolak', color: '#DC2626', bg: '#FEE2E2' };
    return { label: 'Menunggu', color: '#D97706', bg: '#FEF3C7' };
  };

  const filteredProducts = (products || []).filter(p => {
    const q = searchQuery.toLowerCase();
    const title = p?.title?.toLowerCase?.() ?? '';
    const seller = p?.sellerName?.toLowerCase?.() ?? p?.seller_name?.toLowerCase?.() ?? '';
    const matchSearch = title.includes(q) || seller.includes(q);
    if (filterStatus === 'pending') return (!p.verified && p.status !== 'rejected') && matchSearch;
    if (filterStatus === 'approved') return (p.verified || p.status === 'approved') && matchSearch;
    if (filterStatus === 'rejected') return p.status === 'rejected' && matchSearch;
    return matchSearch;
  });



  const filteredPending = pendingProducts.filter(p => {
    const q = searchQuery.toLowerCase();
    const title = p?.title?.toLowerCase?.() ?? '';
    const seller = p?.sellerName?.toLowerCase?.() ?? p?.seller_name?.toLowerCase?.() ?? '';
    return title.includes(q) || seller.includes(q);
  });

  const sidebarItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'verification', label: 'Verifikasi', icon: ShieldAlert },
    { key: 'products', label: 'Produk', icon: Package },
    { key: 'umkm', label: 'Kelola UMKM', icon: Store },
    { key: 'settings', label: 'Tampilan Website', icon: Palette },
    { key: 'password', label: 'Ganti Password', icon: Lock },
  ];

  const umkmList = buildUmkmList(products, frozenUmkm);

  const [settingsForm, setSettingsForm] = useState({
    hero_title: '', hero_desc: '', hero_image: '', hero_badge_title: '', hero_badge_subtitle: '', banner_title: '', banner_desc: '', banner_image: ''
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [originalSettingsForm, setOriginalSettingsForm] = useState(null);
  const [pwCurrent, setPwCurrent] = useState('');
  const [umkmErr, setUmkmErr] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');

  useEffect(() => {
    if (siteContent && Object.keys(siteContent).length > 0) {
      setSettingsForm({
        hero_title: siteContent.hero_title || '',
        hero_desc: siteContent.hero_desc || '',
        hero_image: siteContent.hero_image || '',
        hero_badge_title: siteContent.hero_badge_title || '',
        hero_badge_subtitle: siteContent.hero_badge_subtitle || '',
        banner_title: siteContent.banner_title || '',
        banner_desc: siteContent.banner_desc || '',
        banner_image: siteContent.banner_image || '',
      });
    }
  }, [siteContent]);

  const handleEditSettings = () => {
    setOriginalSettingsForm({ ...settingsForm });
    setIsEditingSettings(true);
    setSettingsMsg('');
  };

  const handleCancelSettings = () => {
    if (originalSettingsForm) setSettingsForm({ ...originalSettingsForm });
    setIsEditingSettings(false);
    setSettingsMsg('');
  };

  const handleSaveSettings = async () => {
    if (!onSaveSiteContent) return;
    setSettingsSaving(true);
    setSettingsMsg('');
    try {
      await onSaveSiteContent(settingsForm);
      setSettingsMsg('Tampilan berhasil disimpan.');
      setIsEditingSettings(false);
    } catch (e) {
      setSettingsMsg(e.message || 'Gagal menyimpan.');
    } finally {
      setSettingsSaving(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: '8px',
    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
  };
  const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#1E293B' };

  const renderSettings = () => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Tampilan Website</h3>
        {!isEditingSettings && (
          <button onClick={handleEditSettings} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#0F2C59', color: 'white', border: 'none', padding: '10px 20px',
            borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer'
          }}>
            <Pencil size={15} /> Edit Tampilan
          </button>
        )}
      </div>
      <p style={{ fontSize: '0.9rem', color: '#64748B', marginBottom: '20px' }}>
        {isEditingSettings
          ? 'Mode edit aktif — ubah konten lalu tekan Simpan.'
          : 'Tekan "Edit Tampilan" untuk mengubah judul, deskripsi, dan gambar portal.'}
      </p>

      {settingsMsg && (
        <div style={{
          background: settingsMsg.includes('Gagal') ? '#FEE2E2' : '#DCFCE7',
          color: settingsMsg.includes('Gagal') ? '#991B1B' : '#166534',
          padding: '12px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          {settingsMsg.includes('Gagal') ? '❌' : '✅'} {settingsMsg}
        </div>
      )}

      {!isEditingSettings && (
        <div style={{
          background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: '10px',
          padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '0.82rem', color: '#854D0E', fontWeight: 500
        }}>
          <Lock size={14} /> Form terkunci. Klik <strong style={{ margin: '0 3px' }}>Edit Tampilan</strong> di atas untuk mulai mengubah.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px', alignItems: 'start' }}>

        {/* --- Hero Section --- */}
        <div style={{ background: 'white', border: `1px solid ${isEditingSettings ? '#93C5FD' : '#E2E8F0'}`, borderRadius: '12px', padding: '24px', transition: 'border-color 0.2s' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E293B', margin: '0 0 16px', paddingBottom: '8px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🖼 Hero Section <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748B' }}>(Banner Utama Atas)</span>
          </h4>
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Judul Hero</label>
            <input style={{ ...inputStyle, background: isEditingSettings ? 'white' : '#F8FAFC', color: isEditingSettings ? '#1E293B' : '#64748B' }}
              value={settingsForm.hero_title} readOnly={!isEditingSettings}
              onChange={(e) => setSettingsForm(prev => ({ ...prev, hero_title: e.target.value }))}
              placeholder="Pasar Digital Desa" />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Deskripsi Hero</label>
            <textarea rows={3} style={{ ...inputStyle, background: isEditingSettings ? 'white' : '#F8FAFC', color: isEditingSettings ? '#1E293B' : '#64748B', resize: 'vertical' }}
              value={settingsForm.hero_desc} readOnly={!isEditingSettings}
              onChange={(e) => setSettingsForm(prev => ({ ...prev, hero_desc: e.target.value }))}
              placeholder="Dukung pertumbuhan ekonomi lokal..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={labelStyle}>Badge Judul</label>
              <input style={{ ...inputStyle, background: isEditingSettings ? 'white' : '#F8FAFC', color: isEditingSettings ? '#1E293B' : '#64748B' }}
                value={settingsForm.hero_badge_title} readOnly={!isEditingSettings}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, hero_badge_title: e.target.value }))}
                placeholder="150+ Pelaku UMKM" />
            </div>
            <div>
              <label style={labelStyle}>Badge Sub-judul</label>
              <input style={{ ...inputStyle, background: isEditingSettings ? 'white' : '#F8FAFC', color: isEditingSettings ? '#1E293B' : '#64748B' }}
                value={settingsForm.hero_badge_subtitle} readOnly={!isEditingSettings}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, hero_badge_subtitle: e.target.value }))}
                placeholder="Terverifikasi Digital" />
            </div>
          </div>
          <ImageUploader
            label="Gambar Hero"
            value={settingsForm.hero_image}
            onChange={(val) => setSettingsForm(prev => ({ ...prev, hero_image: val }))}
            disabled={!isEditingSettings}
          />
        </div>

        {/* --- Banner Section --- */}
        <div style={{ background: 'white', border: `1px solid ${isEditingSettings ? '#93C5FD' : '#E2E8F0'}`, borderRadius: '12px', padding: '24px', transition: 'border-color 0.2s' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E293B', margin: '0 0 16px', paddingBottom: '8px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📢 Banner Section <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748B' }}>(Promosi Tengah)</span>
          </h4>
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Judul Banner</label>
            <input style={{ ...inputStyle, background: isEditingSettings ? 'white' : '#F8FAFC', color: isEditingSettings ? '#1E293B' : '#64748B' }}
              value={settingsForm.banner_title} readOnly={!isEditingSettings}
              onChange={(e) => setSettingsForm(prev => ({ ...prev, banner_title: e.target.value }))}
              placeholder="Potensi Desa Digital Kami" />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Deskripsi Banner</label>
            <textarea rows={3} style={{ ...inputStyle, background: isEditingSettings ? 'white' : '#F8FAFC', color: isEditingSettings ? '#1E293B' : '#64748B', resize: 'vertical' }}
              value={settingsForm.banner_desc} readOnly={!isEditingSettings}
              onChange={(e) => setSettingsForm(prev => ({ ...prev, banner_desc: e.target.value }))}
              placeholder="Kami percaya bahwa teknologi dapat..." />
          </div>
          <ImageUploader
            label="Gambar Banner"
            value={settingsForm.banner_image}
            onChange={(val) => setSettingsForm(prev => ({ ...prev, banner_image: val }))}
            disabled={!isEditingSettings}
          />
        </div>
      </div>

      {/* Tombol Aksi */}
      {isEditingSettings && (
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={handleSaveSettings} disabled={settingsSaving} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            background: '#0F2C59', color: 'white', border: 'none', padding: '13px',
            borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem',
            cursor: settingsSaving ? 'not-allowed' : 'pointer', opacity: settingsSaving ? 0.75 : 1
          }}>
            <Palette size={18} />
            {settingsSaving ? 'Menyimpan...' : 'Simpan Tampilan'}
          </button>
          <button onClick={handleCancelSettings} disabled={settingsSaving} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            background: 'white', color: '#64748B', border: '1px solid #CBD5E1', padding: '13px 28px',
            borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer'
          }}>
            <X size={16} /> Batal
          </button>
        </div>
      )}
    </div>
  );

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwErr("");
    setPwMsg("");
    if (!pwCurrent || !pwNew || !pwConfirm) { setPwErr("Semua field harus diisi."); return; }
    if (pwNew.length < 12) { setPwErr("Password minimal 12 karakter."); return; }
    if (pwNew !== pwConfirm) { setPwErr("Konfirmasi password tidak cocok."); return; }
    if (pwNew === pwCurrent) { setPwErr("Password baru harus berbeda dari password saat ini."); return; }
    setPwLoading(true);
    try {
      await changePasswordWithReauth(currentUser?.email, pwCurrent, pwNew);
      setPwMsg("Password berhasil diubah. Sesi di perangkat lain telah dikeluarkan.");
      setPwCurrent("");
      setPwNew("");
      setPwConfirm("");
    } catch (err) {
      setPwErr(err.message || "Gagal mengubah password.");
    } finally {
      setPwLoading(false);
    }
  };

  const pwInputStyle = {
    width: "100%", padding: "10px 14px", border: "1px solid #CBD5E1", borderRadius: "8px",
    fontSize: "0.9rem", outline: "none", boxSizing: "border-box"
  };
  const pwLabelStyle = { display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "#1E293B" };

  const renderPassword = () => (
    <div style={{ maxWidth: "440px" }}>
      <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1E293B", marginBottom: "6px" }}>Ganti Password</h3>
      <p style={{ fontSize: "0.9rem", color: "#64748B", marginBottom: "20px" }}>
        Ubah password akun Admin Anda.
      </p>
      {pwMsg && <div style={{ background: "#DCFCE7", color: "#166534", padding: "12px 14px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "16px" }}>{pwMsg}</div>}
      {pwErr && <div style={{ background: "#FEE2E2", color: "#991B1B", padding: "12px 14px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "16px" }}>{pwErr}</div>}
      <form onSubmit={handleChangePassword} style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "24px" }}>
        <div style={{ marginBottom: "16px" }}>
          <label style={pwLabelStyle}>Password Saat Ini</label>
          <input type="password" required value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} placeholder="Password lama Anda" style={pwInputStyle} />
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label style={pwLabelStyle}>Password Baru</label>
          <input type="password" required minLength={12} value={pwNew} onChange={(e) => setPwNew(e.target.value)} placeholder="Minimal 12 karakter" style={pwInputStyle} />
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label style={pwLabelStyle}>Konfirmasi Password Baru</label>
          <input type="password" required value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} placeholder="Ulangi password baru" style={pwInputStyle} />
        </div>
        <button type="submit" disabled={pwLoading} style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          background: "#0F2C59", color: "white", border: "none", padding: "12px",
          borderRadius: "10px", fontWeight: 700, fontSize: "0.95rem",
          cursor: pwLoading ? "not-allowed" : "pointer", opacity: pwLoading ? 0.75 : 1
        }}>
          <Lock size={18} /> {pwLoading ? "Menyimpan..." : "Ubah Password"}
        </button>
      </form>
    </div>
  );

  const renderDashboard = () => (
    <div>
      <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1E293B', marginBottom: '20px' }}>
        Selamat Datang, {userName}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard icon={Package} label="Total Produk" value={products?.length || 0} color="#1E40AF" bg="#EFF6FF" />
        <StatCard icon={Store} label="Total UMKM" value={umkmList.length} color="#7C3AED" bg="#F5F3FF" />
        <StatCard icon={ShieldAlert} label="Menunggu Verifikasi" value={pendingProducts.length} color="#D97706" bg="#FEF3C7" />
        <StatCard icon={CheckCircle2} label="Terverifikasi" value={approvedProducts.length} color="#059669" bg="#ECFDF5" />
      </div>
    </div>
  );

  const renderVerification = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#92400E', margin: 0 }}>
          Produk Menunggu Verifikasi ({filteredPending.length})
        </h3>
        <div style={{ flex: 1, minWidth: '250px', maxWidth: '360px', position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={18} />
          <input type="text" placeholder="Cari produk pending..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 40px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
        </div>
      </div>

      {filteredPending.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <ShieldCheck size={48} style={{ color: '#CBD5E1', marginBottom: '16px' }} />
          <p style={{ fontSize: '1.1rem', color: '#64748B' }}>Tidak ada produk yang menunggu verifikasi.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredPending.map(product => (
            <div key={product.id} style={{ background: 'white', border: '1px solid #FDE68A', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(15, 44, 89, 0.08)' }}>
              <div style={{ height: '150px', background: '#F1F5F9', overflow: 'hidden' }}>
                <img src={safeImageUrl(product.image)} alt={product.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>{product.title || '-'}</h4>
                  <span style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap' }}>Menunggu</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '8px' }}>Oleh: {product.sellerName || product.seller_name || '-'}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '12px' }}>
                  Kategori: {categories.find(c => c.id === product.category)?.name || product.category} • NIB: {product.nib || '-'}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleVerify(product.id, true)} style={{
                    flex: 1, background: '#059669', color: 'white', border: 'none', padding: '10px', borderRadius: '8px',
                    fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}>
                    <CheckCircle2 size={16} /> Verifikasi
                  </button>
                  <button onClick={() => openRejectModal(product.id)} style={{
                    flex: 1, background: '#DC2626', color: 'white', border: 'none', padding: '10px', borderRadius: '8px',
                    fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}>
                    <ShieldAlert size={16} /> Tolak
                  </button>
                </div>
              </div>
            </div>
          ))}
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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {['all', 'pending', 'approved', 'rejected'].map(status => (
            <button key={status} onClick={() => setFilterStatus(status)} style={{
              padding: '8px 16px', border: filterStatus === status ? '2px solid #0F2C59' : '1px solid #CBD5E1',
              borderRadius: '8px', background: filterStatus === status ? '#EFF6FF' : 'white',
              color: filterStatus === status ? '#0F2C59' : '#64748B', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer'
            }}>
              {status === 'all' ? 'Semua' : status === 'pending' ? 'Menunggu' : status === 'approved' ? 'Terverifikasi' : 'Ditolak'}
            </button>
          ))}
          <button onClick={onAddProduct} style={{
            background: '#059669', color: 'white', border: 'none', padding: '10px 18px',
            borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <PlusCircle size={16} /> Tambah
          </button>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <Box size={48} style={{ color: '#CBD5E1', marginBottom: '16px' }} />
          <p style={{ fontSize: '1.1rem', color: '#64748B' }}>Tidak ada produk ditemukan.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredProducts.map(product => {
            const status = getStatus(product);
            const isVerified = product.verified || product.status === 'approved';
            const isRejected = product.status === 'rejected';

            return (
              <div key={product.id} style={{
                background: 'white', border: isVerified ? '1px solid #E2E8F0' : isRejected ? '1px solid #FECFCA' : '1px solid #FDE68A',
                borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(15, 44, 89, 0.08)'
              }}>
                <div style={{ height: '150px', background: '#F1F5F9', overflow: 'hidden' }}>
                  <img src={safeImageUrl(product.image)} alt={product.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>{product.title || '-'}</h4>
                    <span style={{
                      background: status.bg, color: status.color, padding: '2px 8px', borderRadius: '4px',
                      fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '3px'
                    }}>
                      {product.verified && <ShieldCheck size={10} />}
                      {status.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '12px' }}>
                    {product.sellerName || product.seller_name || '-'} — {categories.find(c => c.id === product.category)?.name || product.category}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                    {!isVerified && (
                      <button onClick={() => handleVerify(product.id, true)} style={{
                        flex: 1, background: '#059669', color: 'white', border: 'none', padding: '8px', borderRadius: '6px',
                        fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                      }}>
                        <CheckCircle2 size={14} /> Verifikasi
                      </button>
                    )}
                    {!isRejected && (
                      <button onClick={() => openRejectModal(product.id)} style={{
                        flex: 1, background: '#DC2626', color: 'white', border: 'none', padding: '8px', borderRadius: '6px',
                        fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                      }}>
                        <ShieldAlert size={14} /> Tolak
                      </button>
                    )}
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

  const renderUmkm = (onDeleteUmkm) => (
    <div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E293B', marginBottom: '16px' }}>
        Kelola UMKM ({umkmList.length})
      </h3>
      <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '20px' }}>
        Bekukan UMKM yang sudah tidak aktif/melanggar aturan. Produk dari UMKM yang dibekukan tidak tampil di katalog publik.
      </p>

      {umkmErr && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
          {umkmErr}
        </div>
      )}

      {umkmList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <Store size={48} style={{ color: '#CBD5E1', marginBottom: '16px' }} />
          <p style={{ fontSize: '1.1rem', color: '#64748B' }}>Belum ada UMKM terdaftar.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {umkmList.map(umkm => (
            <div key={umkm.key} style={{
              background: 'white', border: `1px solid ${umkm.frozen ? '#FECACA' : '#E2E8F0'}`,
              borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(15, 44, 89, 0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
                  background: umkm.frozen ? '#FEE2E2' : '#EFF6FF', color: umkm.frozen ? '#DC2626' : '#1E40AF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Store size={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {umkm.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    {umkm.phone || umkm.key} • {umkm.count} produk
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                  background: umkm.frozen ? '#FEE2E2' : '#ECFDF5',
                  color: umkm.frozen ? '#DC2626' : '#059669'
                }}>
                  {umkm.frozen ? 'Dibekukan' : 'Aktif'}
                </span>
                <button
                  onClick={() => onToggleFreezeUmkm && onToggleFreezeUmkm(umkm.userId)}
                  style={{
                    padding: '8px 14px', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                    border: umkm.frozen ? '1px solid #059669' : '1px solid #DC2626',
                    background: umkm.frozen ? '#ECFDF5' : 'white',
                    color: umkm.frozen ? '#059669' : '#DC2626',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <Snowflake size={14} />
                  {umkm.frozen ? 'Aktifkan' : 'Bekukan'}
                </button>
                <button
                  onClick={async () => {
                    if (!window.confirm('Apakah Anda yakin ingin menghapus akun UMKM ini? Semua produk terkait juga akan dihapus.')) return;
                    try {
                      await onDeleteUmkm?.(umkm.userId);
                      setUmkmErr('');
                    } catch (err) {
                      setUmkmErr(err.message || 'Gagal menghapus akun UMKM.');
                    }
                  }}
                  style={{
                    padding: '8px 14px', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                    border: '1px solid #DC2626', background: 'white', color: '#DC2626',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <Trash2 size={14} />
                  Hapus Akun
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      activeItem={activePanel}
      onSelectItem={setActivePanel}
      userName={userName}
      userRole="Admin"
      onBack={onBack}
      accentColor="#0F2C59"
    >
      {activePanel === 'dashboard' && renderDashboard()}
      {activePanel === 'verification' && renderVerification()}
      {activePanel === 'products' && renderProducts()}
      {activePanel === 'umkm' && renderUmkm(onDeleteUmkm)}
      {activePanel === 'settings' && renderSettings()}
      {activePanel === 'password' && renderPassword()}

      {showEditModal && editingProduct && (
        <EditProductModal
          product={editingProduct}
          categories={categories}
          onClose={() => { setShowEditModal(false); setEditingProduct(null); }}
          onProductUpdated={handleProductUpdated}
        />
      )}

      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
          onClick={() => setRejectModal(null)}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', maxWidth: '440px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 800, color: '#DC2626' }}>Tolak Produk</h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.9rem', color: '#64748B' }}>
              Tuliskan alasan penolakan agar UMKM memahami perbaikan yang diperlukan.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Contoh: Foto produk tidak jelas, deskripsi kurang lengkap..."
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setRejectModal(null)} style={{
                background: 'white', border: '1px solid #CBD5E1', padding: '10px 20px',
                borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', color: '#64748B'
              }}>
                Batal
              </button>
              <button onClick={confirmReject} disabled={!rejectReason.trim()} style={{
                background: '#DC2626', color: 'white', border: 'none', padding: '10px 20px',
                borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem',
                cursor: rejectReason.trim() ? 'pointer' : 'not-allowed', opacity: rejectReason.trim() ? 1 : 0.5
              }}>
                Tolak Produk
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}