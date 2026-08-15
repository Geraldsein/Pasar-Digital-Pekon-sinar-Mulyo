import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-id'));

// Initialize Supabase client (anon - for normal users)
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

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
    console.warn('Role check error:', error);
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
