import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ShieldCheck, ShieldAlert, Trash2, Edit3, PlusCircle, Mail, Calendar, Crown, Search, CheckCircle2, Box, Users, BarChart3, Store, Palette } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import DashboardLayout from './ui/DashboardLayout';
import StatCard from './ui/StatCard';
import EditProductModal from './EditProductModal';
import { buildUmkmList } from '../lib/utils';

export default function SuperAdminDashboard({ products, categories, onVerifyProduct, onDeleteProduct, onProductUpdated, onAddProduct, onBack, currentUser, frozenUmkm = [], onDeleteUmkm, siteContent = {}, onSaveSiteContent }) {
  const [activePanel, setActivePanel] = useState('dashboard');
  const [adminUsers, setAdminUsers] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');
  const [settingsForm, setSettingsForm] = useState({
    hero_title: '', hero_desc: '', hero_image: '', hero_badge_title: '', hero_badge_subtitle: '', banner_title: '', banner_desc: '', banner_image: ''
  });

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

  const handleSaveSettings = async () => {
    if (!onSaveSiteContent) return;
    setSettingsSaving(true);
    setSettingsMsg('');
    try {
      await onSaveSiteContent(settingsForm);
      setSettingsMsg('Tampilan berhasil disimpan.');
    } catch (e) {
      setSettingsMsg(e.message || 'Gagal menyimpan.');
    } finally {
      setSettingsSaving(false);
    }
  };
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Product tab states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const userName = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Super Admin';

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    setLoading(true);
    try {
      if (!supabase || !isSupabaseConfigured) {
        setAdminUsers([]);
        return;
      }
      const { data, error } = await supabase.from('admin_users').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setAdminUsers(data || []);
    } catch (err) {
      console.error('Error fetching admin users:', err);
      setErrorMsg('Gagal memuat daftar admin.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminPassword.trim()) {
      setErrorMsg('Email dan Password harus diisi.');
      return;
    }
    if (newAdminPassword.length < 6) {
      setErrorMsg('Password admin minimal 6 karakter.');
      return;
    }

    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    const email = newAdminEmail.trim().toLowerCase();
    const pwd = newAdminPassword.trim();

    try {
      if (!supabase || !isSupabaseConfigured) {
        throw new Error('Supabase belum dikonfigurasi.');
      }
      // Insert ke admin_users (role detector)
      // NOTE: Auth user harus dibuat via Supabase Dashboard/Edge Function
      // (service role tidak boleh di client). Admin login via signUp biasa.
      const { error } = await supabase.from('admin_users').insert([{ email, role: 'admin' }]);
      if (error) {
        if (error.message?.includes('duplicate') || error.code === '23505') {
          setErrorMsg(`Email ${email} sudah terdaftar sebagai admin.`);
          setActionLoading(false);
          return;
        }
        throw error;
      }

      setSuccessMsg(`✅ Admin berhasil dibuat!\n\nKredensial untuk admin:\n• Email: ${email}\n• Password: ${pwd}\n\nAkun sudah aktif — admin dapat langsung login.`);
      setNewAdminEmail('');
      setNewAdminPassword('');
      fetchAdminUsers();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menambahkan admin.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveAdmin = async (adminId, email) => {
    if (!window.confirm(`Hapus ${email} sebagai admin?`)) return;
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (!supabase || !isSupabaseConfigured) throw new Error('Supabase belum dikonfigurasi.');
      const { error } = await supabase.from('admin_users').delete().eq('id', adminId);
      if (error) throw error;
      fetchAdminUsers();
      setSuccessMsg(`Admin berhasil dihapus: ${email}`);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menghapus admin.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerify = (productId, verified) => { if (onVerifyProduct) onVerifyProduct(productId, verified); };
  const handleDelete = (productId) => { if (window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) { if (onDeleteProduct) onDeleteProduct(productId); } };
  const handleEdit = (product) => { setEditingProduct(product); setShowEditModal(true); };
  const handleProductUpdated = (updatedProduct) => { if (onProductUpdated) onProductUpdated(updatedProduct); };

  const pendingCount = (products || []).filter(p => p.status === 'pending' || (!p.verified && p.status !== 'rejected')).length;
  const approvedCount = (products || []).filter(p => p.status === 'approved' || p.verified === true).length;

  const filteredProducts = (products || []).filter(item => {
    const seller = item.sellerName || item.seller_name || '';
    const matchSearch = searchQuery.trim()
      ? (item.title?.toLowerCase?.() ?? '').includes(searchQuery.toLowerCase()) ||
        seller.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    if (filterStatus === 'pending') return (!item.verified && item.status !== 'rejected') && matchSearch;
    if (filterStatus === 'approved') return (item.status === 'approved' || item.verified === true) && matchSearch;
    if (filterStatus === 'rejected') return item.status === 'rejected' && matchSearch;
    return matchSearch;
  });

  // Laporan: count per category
  const categoryCounts = categories.map(cat => ({
    ...cat,
    count: (products || []).filter(p => p.category === cat.id).length,
  }));

  const sidebarItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'products', label: 'Produk', icon: Package },
    { key: 'umkm', label: 'Kelola UMKM', icon: Store },
    { key: 'admins', label: 'Kelola Admin', icon: Users },
    { key: 'reports', label: 'Laporan', icon: BarChart3 },
    { key: 'settings', label: 'Tampilan Website', icon: Palette },
  ];

  const umkmList = buildUmkmList(products, frozenUmkm);

  const renderDashboard = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>
          Selamat Datang, {userName}
        </h3>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <StatCard icon={Package} label="Total Produk" value={products?.length || 0} color="#7C3AED" bg="#F5F3FF" />
        <StatCard icon={Store} label="Total UMKM" value={umkmList.length} color="#059669" bg="#ECFDF5" />
        <StatCard icon={Users} label="Total Admin" value={adminUsers.length} color="#2563EB" bg="#EFF6FF" />
        <StatCard icon={ShieldAlert} label="Menunggu Verifikasi" value={pendingCount} color="#D97706" bg="#FEF3C7" />
      </div>
    </div>
  );

  const renderUmkm = (onDeleteUmkm) => (
    <div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E293B', marginBottom: '16px' }}>
        Kelola UMKM ({umkmList.length})
      </h3>
      <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '20px' }}>
        Bekukan UMKM yang sudah tidak aktif/melanggar aturan. Produk dari UMKM yang dibekukan tidak tampil di katalog publik.
      </p>

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
                  background: umkm.frozen ? '#FEE2E2' : '#F5F3FF', color: umkm.frozen ? '#DC2626' : '#7C3AED',
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
                  onClick={() => {
                    if (window.confirm('Apakah Anda yakin ingin menghapus akun UMKM ini? Semua produk terkait juga akan dihapus.')) {
                      onDeleteUmkm?.(umkm.key);
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
              padding: '8px 16px', border: filterStatus === status ? '2px solid #7C3AED' : '1px solid #CBD5E1',
              borderRadius: '8px', background: filterStatus === status ? '#F5F3FF' : 'white',
              color: filterStatus === status ? '#7C3AED' : '#64748B', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer'
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
            const isVerified = product.verified || product.status === 'approved';
            const isRejected = product.status === 'rejected';

            return (
              <div key={product.id} style={{
                background: 'white', border: !isVerified ? (isRejected ? '1px solid #FECFCA' : '1px solid #FDE68A') : '1px solid #E2E8F0',
                borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(15, 44, 89, 0.08)'
              }}>
                <div style={{ height: '150px', background: '#F1F5F9', overflow: 'hidden' }}>
                  <img src={product.image || ''} alt={product.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>{product.title || '-'}</h4>
                    <span style={{
                      background: isVerified ? '#ECFDF5' : isRejected ? '#FEE2E2' : '#FEF3C7',
                      color: isVerified ? '#059669' : isRejected ? '#DC2626' : '#92400E',
                      padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap',
                      display: 'flex', alignItems: 'center', gap: '3px'
                    }}>
                      {isVerified ? <><ShieldCheck size={10} /> Verified</> : isRejected ? <><ShieldAlert size={10} /> Ditolak</> : 'Menunggu'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '10px' }}>
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
                      <button onClick={() => handleVerify(product.id, false)} style={{
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

  const renderAdmins = () => (
    <>
      <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <Crown size={20} color="#7C3AED" style={{ marginTop: '2px' }} />
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#5B21B6', margin: '0 0 4px' }}>Kelola Admin</h3>
            <p style={{ fontSize: '0.85rem', color: '#6B46C1', margin: 0 }}>
              Masukkan email dan password untuk admin baru, lalu tekan <strong>Tambah Admin</strong>.
              Setelah ditambahkan, sampaikan kredensial tersebut ke admin — mereka perlu <strong>mendaftar sendiri</strong> menggunakan email &amp; password itu melalui halaman login.
            </p>
          </div>
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E293B', margin: '0 0 16px' }}>Tambah Admin Baru</h3>
        {errorMsg && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={16} /> <span>{errorMsg}</span>
        </div>}
        {successMsg && <div style={{ background: '#DCFCE7', color: '#166534', padding: '12px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: '2px' }} /> <span style={{ whiteSpace: 'pre-line' }}>{successMsg}</span>
        </div>}
        <form onSubmit={handleAddAdmin} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#1E293B' }}>Email Admin</label>
            <input type="email" required placeholder="admin@example.com" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              onFocus={(e) => e.target.style.borderColor = '#7C3AED'} onBlur={(e) => e.target.style.borderColor = '#CBD5E1'} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#1E293B' }}>Password Admin</label>
            <input type="password" required placeholder="Minimal 6 karakter" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              onFocus={(e) => e.target.style.borderColor = '#7C3AED'} onBlur={(e) => e.target.style.borderColor = '#CBD5E1'} />
          </div>
          <button type="submit" disabled={actionLoading} style={{
            backgroundColor: '#7C3AED', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px',
            fontWeight: 600, fontSize: '0.9rem', cursor: actionLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', height: '43px'
          }}>
            <PlusCircle size={18} /> {actionLoading ? 'Menambah...' : 'Tambah Admin'}
          </button>
        </form>
      </div>

      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E293B', marginBottom: '16px' }}>Daftar Admin Terdaftar ({adminUsers.length})</h3>
        {loading ? <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>Memuat daftar admin...</div>
        : adminUsers.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', color: '#64748B' }}>
            <ShieldAlert size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p style={{ fontSize: '1.1rem', margin: 0 }}>Belum ada admin yang terdaftar.</p>
          </div>
        : <div style={{ display: 'grid', gap: '12px' }}>
            {adminUsers.map(admin => (
              <div key={admin.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', background: '#DDD6FE', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
                    <Mail size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1E293B' }}>{admin.email}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> <span>Ditambahkan: {new Date(admin.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleRemoveAdmin(admin.id, admin.email)} disabled={actionLoading} style={{
                  background: 'white', border: '1px solid #FECFCA', color: '#DC2626', padding: '8px 16px', borderRadius: '8px',
                  fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <Trash2 size={14} /> Hapus
                </button>
              </div>
            ))}
          </div>}
      </div>
    </>
  );

  const renderReports = () => (
    <div>
      <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1E293B', marginBottom: '20px' }}>Laporan</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard icon={Package} label="Total Produk" value={products?.length || 0} color="#7C3AED" bg="#F5F3FF" />
        <StatCard icon={Users} label="Total Admin" value={adminUsers.length} color="#2563EB" bg="#EFF6FF" />
        <StatCard icon={CheckCircle2} label="Terverifikasi" value={approvedCount} color="#059669" bg="#ECFDF5" />
        <StatCard icon={ShieldAlert} label="Menunggu" value={pendingCount} color="#D97706" bg="#FEF3C7" />
      </div>

      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E293B', margin: '0 0 16px' }}>Produk per Kategori</h4>
        {categoryCounts.map(cat => (
          <div key={cat.id} style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>
              <span>{cat.name}</span>
              <span>{cat.count} produk</span>
            </div>
            <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '4px',
                width: products?.length ? `${(cat.count / products.length) * 100}%` : '0%',
                background: 'linear-gradient(90deg, #7C3AED, #A78BFA)'
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: '8px',
    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
  };
  const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#1E293B' };

  const renderSettings = () => (
    <div style={{ maxWidth: '640px' }}>
      <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1E293B', marginBottom: '6px' }}>Tampilan Website</h3>
      <p style={{ fontSize: '0.9rem', color: '#64748B', marginBottom: '20px' }}>
        Ubah judul, deskripsi, dan gambar yang tampil di halaman utama portal.
      </p>

      {settingsMsg && (
        <div style={{
          background: settingsMsg.includes('Gagal') ? '#FEE2E2' : '#DCFCE7',
          color: settingsMsg.includes('Gagal') ? '#991B1B' : '#166534',
          padding: '12px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px'
        }}>
          {settingsMsg}
        </div>
      )}

      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E293B', margin: '0 0 8px', paddingBottom: '8px', borderBottom: '1px solid #E5E7EB' }}>
          Hero Section (Atas)
        </h4>
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Judul Hero</label>
          <input style={inputStyle} value={settingsForm.hero_title}
            onChange={(e) => setSettingsForm(prev => ({ ...prev, hero_title: e.target.value }))}
            placeholder="Pasar Digital Desa" />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Deskripsi Hero</label>
          <textarea rows={3} style={inputStyle} value={settingsForm.hero_desc}
            onChange={(e) => setSettingsForm(prev => ({ ...prev, hero_desc: e.target.value }))}
            placeholder="Dukung pertumbuhan ekonomi lokal..." />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>URL Gambar Hero</label>
          <input type="url" style={inputStyle} value={settingsForm.hero_image}
            onChange={(e) => setSettingsForm(prev => ({ ...prev, hero_image: e.target.value }))}
            placeholder="https://images.unsplash.com/..." />
          {settingsForm.hero_image && (
            <img src={settingsForm.hero_image} alt="Preview hero" onError={(e) => { e.target.style.display = 'none'; }}
              style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '8px', marginTop: '8px' }} />
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
          <div>
            <label style={labelStyle}>Badge Judul</label>
            <input style={inputStyle} value={settingsForm.hero_badge_title}
              onChange={(e) => setSettingsForm(prev => ({ ...prev, hero_badge_title: e.target.value }))}
              placeholder="150+ Pelaku UMKM" />
          </div>
          <div>
            <label style={labelStyle}>Badge Sub-judul</label>
            <input style={inputStyle} value={settingsForm.hero_badge_subtitle}
              onChange={(e) => setSettingsForm(prev => ({ ...prev, hero_badge_subtitle: e.target.value }))}
              placeholder="Terverifikasi Digital" />
          </div>
        </div>

        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E293B', margin: '20px 0 8px', paddingBottom: '8px', borderBottom: '1px solid #E5E7EB' }}>
          Banner Section
        </h4>
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Judul Banner</label>
          <input style={inputStyle} value={settingsForm.banner_title}
            onChange={(e) => setSettingsForm(prev => ({ ...prev, banner_title: e.target.value }))}
            placeholder="Potensi Desa Digital Kami" />
        </div>
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Deskripsi Banner</label>
          <textarea rows={3} style={inputStyle} value={settingsForm.banner_desc}
            onChange={(e) => setSettingsForm(prev => ({ ...prev, banner_desc: e.target.value }))}
            placeholder="Kami percaya bahwa teknologi dapat..." />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>URL Gambar Banner</label>
          <input type="url" style={inputStyle} value={settingsForm.banner_image}
            onChange={(e) => setSettingsForm(prev => ({ ...prev, banner_image: e.target.value }))}
            placeholder="https://images.unsplash.com/..." />
          {settingsForm.banner_image && (
            <img src={settingsForm.banner_image} alt="Preview banner" onError={(e) => { e.target.style.display = 'none'; }}
              style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '8px', marginTop: '8px' }} />
          )}
        </div>

        <button onClick={handleSaveSettings} disabled={settingsSaving} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          background: '#7C3AED', color: 'white', border: 'none', padding: '12px',
          borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem',
          cursor: settingsSaving ? 'not-allowed' : 'pointer', opacity: settingsSaving ? 0.75 : 1
        }}>
          <Palette size={18} />
          {settingsSaving ? 'Menyimpan...' : 'Simpan Tampilan'}
        </button>
      </div>
    </div>
  );

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      activeItem={activePanel}
      onSelectItem={setActivePanel}
      userName={userName}
      userRole="Super Admin"
      onBack={onBack}
      accentColor="#0F2C59"
    >
      {activePanel === 'dashboard' && renderDashboard()}
      {activePanel === 'products' && renderProducts()}
      {activePanel === 'umkm' && renderUmkm(onDeleteUmkm)}
      {activePanel === 'admins' && renderAdmins()}
      {activePanel === 'reports' && renderReports()}
      {activePanel === 'settings' && renderSettings()}

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