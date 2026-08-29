-- ============================================================================
-- Migration keamanan 001 — perbaikan RLS, bucket storage, dan constraint.
--
-- BELUM DIJALANKAN. Tinjau dulu, lalu jalankan pada project Supabase Anda.
-- Perubahan ini bersifat merusak sebagian (DROP POLICY / UPDATE bucket) dan
-- memengaruhi data produksi. Ambil backup atau uji di branch dulu.
--
-- Cakupan:
--   1. site_content: buat tabel + RLS (frontend memakainya, schema belum punya)
--   2. Kolom yang dipakai frontend tapi belum ada di schema
--   3. Bucket storage: tutup akses tulis anonim, batasi MIME dan ukuran
--   4. products: cegah insert anon, cegah self-approve
--   5. admin_users / sellers: tutup pembacaan anonim (email admin dan PII)
--   6. umkm_users: cegah insert sembarangan
--   7. SECURITY DEFINER: set search_path
--   8. Role check berbasis user_id, bukan email
--   9. CHECK constraint untuk harga dan panjang teks
--  10. UNIQUE (user_id) pada sellers agar upsert onConflict:'user_id' bekerja
--  11. Policy DELETE untuk admin non-super
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. site_content
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_content (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT site_content_value_len CHECK (length(value) <= 2000)
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_content_read_all" ON public.site_content;
CREATE POLICY "site_content_read_all" ON public.site_content
  FOR SELECT TO anon, authenticated USING (true);

-- Hanya admin/superadmin yang boleh menulis konten situs.
DROP POLICY IF EXISTS "site_content_admin_write" ON public.site_content;
CREATE POLICY "site_content_admin_write" ON public.site_content
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- 2. Kolom yang direferensikan frontend tetapi belum ada
-- ---------------------------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS lat NUMERIC,
  ADD COLUMN IF NOT EXISTS lng NUMERIC;

ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS lat NUMERIC,
  ADD COLUMN IF NOT EXISTS lng NUMERIC,
  ADD COLUMN IF NOT EXISTS maps_link TEXT;

-- ---------------------------------------------------------------------------
-- 10. sellers.user_id harus unik agar upsert onConflict:'user_id' valid
--     dan agar satu user tidak punya beberapa baris profil.
-- ---------------------------------------------------------------------------
-- Jalankan pemeriksaan ini lebih dulu; jika ada duplikat, bersihkan manual:
--   SELECT user_id, count(*) FROM public.sellers
--    WHERE user_id IS NOT NULL GROUP BY user_id HAVING count(*) > 1;
CREATE UNIQUE INDEX IF NOT EXISTS sellers_user_id_key
  ON public.sellers (user_id) WHERE user_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. Bucket storage: tutup tulis/hapus anonim, batasi MIME dan ukuran.
--    Sebelumnya satu policy FOR ALL USING (bucket_id='products') tanpa
--    TO authenticated membuat siapa pun dapat mengunggah, menimpa, dan
--    menghapus seluruh objek di bucket.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public Access Products Bucket" ON storage.objects;

DROP POLICY IF EXISTS "products_objects_read" ON storage.objects;
CREATE POLICY "products_objects_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'products');

DROP POLICY IF EXISTS "products_objects_insert" ON storage.objects;
CREATE POLICY "products_objects_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'products');

DROP POLICY IF EXISTS "products_objects_update_own" ON storage.objects;
CREATE POLICY "products_objects_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'products' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'products' AND owner = auth.uid());

DROP POLICY IF EXISTS "products_objects_delete_own" ON storage.objects;
CREATE POLICY "products_objects_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'products' AND (owner = auth.uid() OR public.is_admin()));

-- Penegakan tipe dan ukuran di sisi server; validasi klien bisa dilewati.
UPDATE storage.buckets
   SET file_size_limit = 5242880,
       allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
 WHERE id = 'products';

-- ---------------------------------------------------------------------------
-- 7. SECURITY DEFINER wajib punya search_path tetap, agar tidak bisa
--    dibajak lewat objek bernama sama di skema yang lebih dulu resolve.
-- 8. Role check dikunci ke user_id (auth.uid()), bukan email yang bisa
--    diubah sendiri oleh pengguna lewat auth.updateUser({ email }).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND role = 'superadmin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
  );
$$;

-- PENTING: setelah fungsi di atas memakai user_id, setiap baris admin_users
-- WAJIB punya user_id terisi. Baris seed superadmin dibuat dengan user_id NULL
-- sehingga akan kehilangan hak akses. Tautkan dulu ke akun auth yang benar:
--
--   UPDATE public.admin_users a
--      SET user_id = u.id
--     FROM auth.users u
--    WHERE a.user_id IS NULL AND lower(u.email) = lower(a.email);
--
--   -- verifikasi tidak ada yang tertinggal:
--   SELECT email FROM public.admin_users WHERE user_id IS NULL;
--
-- Jalankan dua perintah itu SEBELUM COMMIT, atau segera setelahnya.

CREATE OR REPLACE FUNCTION public.handle_new_umkm_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users WHERE lower(email) = lower(NEW.email)
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

-- ---------------------------------------------------------------------------
-- 5. admin_users: hentikan enumerasi daftar email admin oleh anon.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin_users_read" ON public.admin_users;
CREATE POLICY "admin_users_read" ON public.admin_users
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "admin_users_super_all" ON public.admin_users;
CREATE POLICY "admin_users_super_all" ON public.admin_users
  FOR ALL TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- ---------------------------------------------------------------------------
-- 5b. sellers: phone dan NIB adalah PII, tidak boleh terbaca anon.
--     Katalog publik tidak membutuhkan tabel ini; nama usaha dan nomor
--     WhatsApp sudah tersalin ke kolom products.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "sellers_public_read" ON public.sellers;
DROP POLICY IF EXISTS "sellers_read_own_or_admin" ON public.sellers;
CREATE POLICY "sellers_read_own_or_admin" ON public.sellers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "sellers_own_rw" ON public.sellers;
CREATE POLICY "sellers_own_rw" ON public.sellers
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "sellers_admin_all" ON public.sellers;
CREATE POLICY "sellers_admin_all" ON public.sellers
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. products
--    - insert: hanya pengguna terautentikasi, atas nama diri sendiri, dan
--      selalu masuk sebagai pending (tidak bisa langsung approved)
--    - update pemilik: tidak boleh mengubah verified/status/user_id
--    - verifikasi: hanya admin
--    - read: publik hanya melihat yang approved
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "products_read_all" ON public.products;
CREATE POLICY "products_read_approved" ON public.products
  FOR SELECT TO anon, authenticated
  USING (status = 'approved' OR user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "products_insert_policy" ON public.products;
CREATE POLICY "products_insert_own_pending" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND verified = false
    AND status = 'pending'
  );

-- Pemilik boleh mengedit isi produknya, tetapi kolom keputusan moderasi
-- dijaga oleh trigger di bawah (WITH CHECK tidak bisa membaca nilai lama).
DROP POLICY IF EXISTS "products_own_rw" ON public.products;
CREATE POLICY "products_own_update" ON public.products
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "products_own_delete" ON public.products
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "products_admin_verify" ON public.products;
CREATE POLICY "products_admin_update" ON public.products
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 11. Admin non-super sebelumnya tidak punya policy DELETE, sehingga tombol
--     hapus di dashboard admin selalu gagal tanpa pesan.
DROP POLICY IF EXISTS "products_admin_all" ON public.products;
CREATE POLICY "products_admin_delete" ON public.products
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Trigger penjaga: hanya admin yang boleh mengubah verified/status/user_id.
-- Ini yang menutup celah self-approve, karena policy UPDATE saja tidak dapat
-- membandingkan nilai baru dengan nilai lama.
CREATE OR REPLACE FUNCTION public.guard_product_moderation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.verified IS DISTINCT FROM OLD.verified
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
    RAISE EXCEPTION 'Hanya admin yang dapat mengubah status verifikasi produk.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_guard_moderation ON public.products;
CREATE TRIGGER products_guard_moderation
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.guard_product_moderation();

-- ---------------------------------------------------------------------------
-- 6. umkm_users: baris diisi oleh trigger; anon tidak perlu bisa insert.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "umkm_users_insert" ON public.umkm_users;
CREATE POLICY "umkm_users_insert_own" ON public.umkm_users
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "umkm_users_read_admin" ON public.umkm_users;
CREATE POLICY "umkm_users_read_admin" ON public.umkm_users
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "umkm_users_own_read" ON public.umkm_users;
CREATE POLICY "umkm_users_own_read" ON public.umkm_users
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "umkm_users_super_all" ON public.umkm_users;
CREATE POLICY "umkm_users_super_all" ON public.umkm_users
  FOR ALL TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- ---------------------------------------------------------------------------
-- categories: baca publik wajar, tapi batasi ke SELECT saja secara eksplisit.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "categories_read_all" ON public.categories;
CREATE POLICY "categories_read_all" ON public.categories
  FOR SELECT TO anon, authenticated USING (true);

-- ---------------------------------------------------------------------------
-- 9. CHECK constraint: batas harga dan panjang teks ditegakkan di database,
--    bukan hanya di form. Jalankan query pemeriksaan lebih dulu bila tabel
--    sudah berisi data yang melanggar, karena ALTER akan gagal.
--      SELECT id FROM public.products
--       WHERE price <= 0 OR price > 1000000000
--          OR length(title) > 120 OR length("desc") > 2000;
--    Catatan: ADD CONSTRAINT tidak idempoten. Bila migration dijalankan ulang,
--    hapus dulu constraint lama atau lewati blok ini.
-- ---------------------------------------------------------------------------
ALTER TABLE public.products
  ADD CONSTRAINT products_price_range CHECK (price > 0 AND price <= 1000000000),
  ADD CONSTRAINT products_title_len CHECK (length(title) <= 120),
  ADD CONSTRAINT products_desc_len CHECK ("desc" IS NULL OR length("desc") <= 2000),
  ADD CONSTRAINT products_unit_len CHECK (length(unit) <= 24),
  ADD CONSTRAINT products_tag_len CHECK (tag IS NULL OR length(tag) <= 32),
  ADD CONSTRAINT products_status_valid CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.sellers
  ADD CONSTRAINT sellers_business_name_len CHECK (business_name IS NULL OR length(business_name) <= 80),
  ADD CONSTRAINT sellers_nib_len CHECK (nib IS NULL OR length(nib) <= 32),
  ADD CONSTRAINT sellers_location_len CHECK (location IS NULL OR length(location) <= 200);

COMMIT;

-- ============================================================================
-- Setelah migration:
--   1. Isi admin_users.user_id (lihat catatan di bagian 8) — tanpa ini,
--      is_admin()/is_superadmin() akan selalu false dan panel admin terkunci.
--   2. Aktifkan di Supabase Dashboard → Authentication:
--      - Confirm email: ON
--      - Password minimum length: 12
--      - Password strength: huruf besar/kecil + angka + simbol
--      - Prevent leaked passwords (HaveIBeenPwned): ON
--      - Rate limiting untuk sign-in
--   3. Commit source Edge Function create_admin ke repo, dan pastikan ia
--      memverifikasi JWT pemanggil dengan is_superadmin() di sisi server.
--   4. Jalankan ulang: select * from pg_policies where schemaname = 'public';
--      untuk memastikan tidak ada policy yang tertinggal tanpa TO/WITH CHECK.
-- ============================================================================

