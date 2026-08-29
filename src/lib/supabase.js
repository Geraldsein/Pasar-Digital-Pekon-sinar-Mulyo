import { createClient } from '@supabase/supabase-js';
import { ALLOWED_IMAGE_TYPES, IMAGE_EXT_BY_TYPE, MAX_IMAGE_BYTES } from './utils';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-id'));

// Initialize Supabase client (anon - for normal users)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
        storageKey: 'umkm-desa-auth',
      },
    })
  : null;

// NOTE: Service role key NEVER dipakai di client bundle — hanya via server/Edge Function.
// Superadmin role di-set manual di table admin_users (role='superadmin').

/**
 * Check if a user is admin/superadmin (from database)
 */
const getUserRoleFromDb = async (email) => {
  if (!email || !supabase || !isSupabaseConfigured) return null;
  try {
    const { data } = await supabase
      .from('admin_users')
      .select('role')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();
    return data?.role || null;
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Role check error:', error);
    return null;
  }
};

/**
 * Auto-detect user role based on email
 * Super Admin > Admin > UMKM (default)
 */
export const detectUserRole = async (email) => {
  if (!email) return 'umkm';

  // 1. Check role from database (admin_users table)
  const role = await getUserRoleFromDb(email);
  if (role === 'superadmin') return 'superadmin';
  if (role === 'admin') return 'admin';

  // 2. Default to UMKM
  return 'umkm';
};

/**
 * Ganti password: wajib verifikasi password lama, lalu cabut sesi perangkat lain.
 * Mencegah penyerang yang menumpang sesi curian mengambil alih akun tanpa tahu
 * password lama, dan memastikan sesi lama tidak tetap valid setelah rotasi.
 */
export const changePasswordWithReauth = async (email, currentPassword, newPassword) => {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Supabase belum dikonfigurasi.');
  }
  if (!email) throw new Error('Sesi tidak valid. Silakan login ulang.');

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: currentPassword,
  });
  if (reauthError) throw new Error('Password saat ini salah.');

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) throw new Error('Gagal mengubah password. Coba lagi.');

  // Cabut sesi di perangkat lain; sesi saat ini tetap aktif.
  await supabase.auth.signOut({ scope: 'others' });
};

/**
 * Upload gambar produk ke Supabase Storage dan kembalikan public URL.
 * Ekstensi diturunkan dari MIME (bukan nama file kiriman user) dan nama objek
 * dibuat acak, sehingga nama file user tidak pernah masuk ke path storage.
 */
export const uploadImageToStorage = async (file) => {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Penyimpanan gambar belum dikonfigurasi.');
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Format gambar harus JPG, PNG, atau WEBP.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Ukuran gambar maksimal 5MB.');
  }

  const fileExt = IMAGE_EXT_BY_TYPE[file.type];
  const filePath = `product-images/${Date.now()}_${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('products')
    .upload(filePath, file, { upsert: false, contentType: file.type });
  if (uploadError) throw new Error('Gagal mengunggah gambar. Coba lagi.');

  const { data } = supabase.storage.from('products').getPublicUrl(filePath);
  if (!data?.publicUrl) throw new Error('Gagal memperoleh URL gambar.');
  return data.publicUrl;
};
