import React, { useState, useRef } from 'react';
import { Store } from 'lucide-react';
import BaseModal from "./ui/BaseModal";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export default function AuthModal({ onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [nib, setNib] = useState('');
  const [phoneSuffix, setPhoneSuffix] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const failedAttempts = useRef(0);
  const lockedUntil = useRef(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        const now = Date.now();
        if (now < lockedUntil.current) {
          const wait = Math.ceil((lockedUntil.current - now) / 1000);
          throw new Error(`Terlalu banyak percobaan gagal. Coba lagi dalam ${wait} detik.`);
        }

        if (!email || !password) {
          throw new Error('Email dan password tidak boleh kosong');
        }

        if (!supabase || !isSupabaseConfigured) {
          throw new Error('Supabase belum dikonfigurasi. Isi .env lalu restart.');
        }

        // Real Supabase login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: password
        });

        if (error) {
          failedAttempts.current += 1;
          if (failedAttempts.current >= 5) {
            lockedUntil.current = Date.now() + 60_000;
            failedAttempts.current = 0;
          }
          throw new Error('Email atau password salah.');
        }
        if (data.user) {
          failedAttempts.current = 0;
          // Role will be determined by App.jsx via detectUserRole
          if (onAuthSuccess) onAuthSuccess(data.user);
        }
      } else {
        if (!fullName || !email || !password || !confirmPassword || !businessName || !phoneSuffix) {
          throw new Error('Semua field wajib harus diisi');
        }
        if (password !== confirmPassword) {
          throw new Error('Password dan konfirmasi password tidak cocok');
        }
        if (password.length < 12) {
          throw new Error('Password minimal 12 karakter');
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password: password,
          options: { data: { full_name: fullName } }
        });

        if (error) {
          throw new Error('Pendaftaran gagal. Periksa data Anda atau gunakan email lain.');
        }

        if (!data.session) {
          setInfoMsg('Cek email Anda untuk mengonfirmasi pendaftaran, lalu login.');
          return;
        }

        if (data.user) {
          // Simpan profil seller ke tabel sellers
          await supabase.from('sellers').insert({
            phone: '62' + phoneSuffix,
            user_id: data.user.id,
            business_name: businessName,
            nib: nib || null
          });
          if (onAuthSuccess) onAuthSuccess(data.user);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrorMsg('');
    setInfoMsg('');
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setBusinessName('');
    setNib('');
    setPhoneSuffix('');
  };

  return (
    <BaseModal isOpen={true} onClose={onClose} title="Pasar Digital Desa">
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          width: '64px', height: '64px',
          background: 'linear-gradient(135deg, #0F2C59 0%, #1E40AF 100%)',
          color: 'white', borderRadius: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', fontSize: '1.5rem'
        }}>
          <Store size={32} />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1E293B', margin: '0 0 8px' }}>
          Pasar Digital Desa
        </h2>
        <p style={{ color: '#64748B', fontSize: '0.95rem', margin: 0 }}>
          Pasar Digital Produk Lokal
        </p>
      </div>

      <div style={{
        background: 'white', border: '1px solid #E5E7EB',
        borderRadius: '16px', padding: '32px', marginBottom: '0'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1E293B', margin: '0 0 8px' }}>
            {isLogin ? 'Masuk ke Akun' : 'Daftar sebagai Pelaku UMKM'}
          </h3>
          <p style={{ color: '#64748B', fontSize: '0.95rem', margin: '4px 0 0' }}>
            {isLogin ? 'Khusus pelaku UMKM, admin, dan pengelola' : 'Khusus pelaku UMKM untuk mengelola produk di portal ini'}
          </p>
        </div>

        {errorMsg && (
          <div style={{
            background: '#FEE2E2', color: '#991B1B', padding: '12px 14px',
            borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div style={{
            background: '#DBEAFE', color: '#1E40AF', padding: '12px 14px',
            borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px'
          }}>
            <span>{infoMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="fullName" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px', color: '#1E293B' }}>
                Nama Lengkap
              </label>
              <input
                type="text" id="fullName" required
                placeholder="Nama lengkap Anda"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {!isLogin && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="businessName" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px', color: '#1E293B' }}>
                  Nama UMKM / Toko
                </label>
                <input
                  type="text" id="businessName" required
                  placeholder="Nama usaha Anda"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label htmlFor="nib" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px', color: '#1E293B' }}>
                    NIB
                  </label>
                  <input
                    type="text" id="nib"
                    placeholder="Nomor Induk Berusaha"
                    value={nib}
                    onChange={(e) => setNib(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label htmlFor="phoneSuffix" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px', color: '#1E293B' }}>
                    No. WhatsApp
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden' }}>
                    <span style={{ padding: '12px 0 12px 14px', fontSize: '0.9rem', color: '#94A3B8', fontWeight: 600, userSelect: 'none', background: '#F8FAFC', borderRight: '1px solid #E2E8F0' }}>+62</span>
                    <input
                      type="tel" id="phoneSuffix" required
                      placeholder="81234567890"
                      value={phoneSuffix}
                      onChange={(e) => setPhoneSuffix(e.target.value.replace(/\D/g, ''))}
                      style={{ flex: 1, padding: '12px', border: 'none', fontSize: '0.95rem', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="email" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px', color: '#1E293B' }}>
              Email
            </label>
            <input
              type="email" id="email" required
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '20px', position: 'relative' }}>
            <label htmlFor="password" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px', color: '#1E293B' }}>
              Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', paddingRight: '44px', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-4.47 0-8.26-3.63-9.9-8.1A9.9 9.9 0 0 1 4.1 4.1A10.07 10.07 0 0 1 17.94 17.94z" />
                  <path d="M1 1l22 22" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {!isLogin && (
            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px', color: '#1E293B' }}>
                Konfirmasi Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px 12px 16px', paddingRight: '44px', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {showConfirmPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-4.47 0-8.26-3.63-9.9-8.1A9.9 9.9 0 0 1 4.1 4.1A10.07 10.07 0 0 1 17.94 17.94z" />
                      <path d="M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', backgroundColor: '#1E40AF', color: 'white', border: 'none',
            padding: '14px', borderRadius: '10px', fontWeight: 700, fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.8 : 1,
          }}>
            {loading ? 'Memproses...' : (isLogin ? 'Masuk' : 'Daftar')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 12px' }}>
            {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}
          </p>
          <button onClick={toggleMode} style={{
            background: 'none', border: 'none', color: '#1E40AF', fontSize: '0.9rem',
            fontWeight: 700, cursor: 'pointer', textDecoration: 'underline'
          }}>
            {isLogin ? 'Daftar sebagai Pelaku UMKM' : 'Masuk ke Akun'}
          </button>
        </div>

        {!isLogin && (
          <div style={{
            textAlign: 'center', marginTop: '16px', padding: '12px',
            background: '#F0FDF4', borderRadius: '10px', border: '1px solid #BBF7D0'
          }}>
            <p style={{ fontSize: '0.85rem', color: '#166534', margin: 0 }}>
              💚 Ingin belanja? <strong>Tidak perlu daftar</strong> — langsung klik "Beli via WhatsApp" pada produk yang diinginkan.
            </p>
          </div>
        )}

        {isLogin && (
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#94A3B8', margin: '20px 0 0', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
            Login menggunakan akun yang sudah terdaftar.
          </p>
        )}
      </div>
    </BaseModal>
  );
}