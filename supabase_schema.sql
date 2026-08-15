-- ===== EXTENSIONS =====
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== STORAGE BUCKET =====
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access Products Bucket" ON storage.objects
FOR ALL USING (bucket_id = 'products');

-- ===== CATEGORIES =====
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sub TEXT,
  icon TEXT,
  bg TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed kategori
INSERT INTO public.categories (id, name, sub, icon, bg, color) VALUES
('makanan',   'Makanan',   'Camilan & Bahan Pokok', 'Utensils', '#EFF6FF', '#2563EB'),
('kerajinan', 'Kerajinan', 'Anyaman & Seni',         'Palette', '#ECFDF5', '#059669'),
('pertanian', 'Pertanian', 'Hasil Bumi Seger',       'Tractor',  '#EFF6FF', '#2563EB'),
('jasa',      'Jasa',      'Layanan Lokal',          'Wrench',  '#F5F3FF', '#7C3AED')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, sub=EXCLUDED.sub, icon=EXCLUDED.icon, bg=EXCLUDED.bg, color=EXCLUDED.color;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_read_all" ON public.categories;
CREATE POLICY "categories_read_all" ON public.categories FOR SELECT USING (true);

-- ===== ADMIN USERS =====
CREATE TABLE IF NOT EXISTS public.admin_users (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL UNIQUE,
  role       TEXT NOT NULL CHECK (role IN ('superadmin','admin')),
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Security Definer functions to prevent RLS infinite recursion
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE email = auth.email() AND role = 'superadmin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE email = auth.email()
  );
$$;

DROP POLICY IF EXISTS "admin_users_read" ON public.admin_users;
CREATE POLICY "admin_users_read" ON public.admin_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_users_super_all" ON public.admin_users;
CREATE POLICY "admin_users_super_all" ON public.admin_users FOR ALL USING (public.is_superadmin());

-- Seed Super Admin
INSERT INTO public.admin_users (email, role, assigned_by)
VALUES ('superadmin@umkmdesa.id', 'superadmin', NULL)
ON CONFLICT (email) DO NOTHING;

-- ===== SELLERS (UMKM profiles + frozen) =====
CREATE TABLE IF NOT EXISTS public.sellers (
  phone       TEXT PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  nib         TEXT,
  frozen      BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sellers_public_read" ON public.sellers;
CREATE POLICY "sellers_public_read" ON public.sellers FOR SELECT USING (true);

DROP POLICY IF EXISTS "sellers_own_rw" ON public.sellers;
CREATE POLICY "sellers_own_rw" ON public.sellers FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "sellers_admin_all" ON public.sellers;
CREATE POLICY "sellers_admin_all" ON public.sellers FOR ALL USING (public.is_superadmin());

-- ===== PRODUCTS =====
CREATE TABLE IF NOT EXISTS public.products (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title           TEXT NOT NULL,
  category        TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  price           NUMERIC NOT NULL,
  unit            TEXT NOT NULL,
  tag             TEXT,
  "desc"          TEXT,
  verified        BOOLEAN DEFAULT FALSE,
  status          TEXT DEFAULT 'pending',     -- 'pending'|'approved'|'rejected'
  image           TEXT,                       -- URL dari Supabase Storage
  seller_name     TEXT,
  seller_phone    TEXT,
  business_name   TEXT,
  nib             TEXT,
  location        TEXT,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_verified ON public.products(verified);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_public_read" ON public.products;
DROP POLICY IF EXISTS "products_own_rw" ON public.products;
DROP POLICY IF EXISTS "products_admin_all" ON public.products;
DROP POLICY IF EXISTS "products_admin_verify" ON public.products;
DROP POLICY IF EXISTS "products_insert_policy" ON public.products;
DROP POLICY IF EXISTS "products_read_all" ON public.products;

CREATE POLICY "products_read_all" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_insert_policy" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "products_own_rw" ON public.products FOR ALL USING (user_id = auth.uid());
CREATE POLICY "products_admin_all" ON public.products FOR ALL USING (public.is_superadmin());
CREATE POLICY "products_admin_verify" ON public.products FOR UPDATE USING (public.is_admin());

-- ===== UMKM USERS =====
-- Tabel ini mencatat setiap user yang mendaftar sebagai UMKM (bukan admin/superadmin)
CREATE TABLE IF NOT EXISTS public.umkm_users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.umkm_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "umkm_users_read_admin" ON public.umkm_users;
CREATE POLICY "umkm_users_read_admin" ON public.umkm_users FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "umkm_users_own_read" ON public.umkm_users;
CREATE POLICY "umkm_users_own_read" ON public.umkm_users FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "umkm_users_insert" ON public.umkm_users;
CREATE POLICY "umkm_users_insert" ON public.umkm_users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "umkm_users_super_all" ON public.umkm_users;
CREATE POLICY "umkm_users_super_all" ON public.umkm_users FOR ALL USING (public.is_superadmin());

-- Trigger: otomatis insert ke umkm_users saat user baru sign up (jika bukan admin)
CREATE OR REPLACE FUNCTION public.handle_new_umkm_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Hanya insert jika user ini bukan admin/superadmin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users WHERE email = NEW.email
  ) THEN
    INSERT INTO public.umkm_users (user_id, email, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    )
    ON CONFLICT (email) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_umkm_user();