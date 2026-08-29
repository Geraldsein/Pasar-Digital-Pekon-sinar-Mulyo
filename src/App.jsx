import React, { useState, useEffect, useMemo } from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import CategorySection from "./components/CategorySection";
import ProductSection from "./components/ProductSection";
import BannerSection from "./components/BannerSection";
import Footer from "./components/Footer";
import AnimatedSection from "./components/AnimatedSection";
import WhatsAppModal from "./components/WhatsAppModal";
import AuthModal from "./components/AuthModal";
import AddProductModal from "./components/AddProductModal";
import LocationModal from "./components/LocationModal";
import AdminDashboard from "./components/AdminDashboard";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import UmkmDashboard from "./components/UmkmDashboard";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import {
  CATEGORIES as INITIAL_CATEGORIES,
} from "./data/products";
import { supabase, isSupabaseConfigured, detectUserRole } from "./lib/supabase";

export default function App() {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedLocationProduct, setSelectedLocationProduct] = useState(null);
  const [activeNav, setActiveNav] = useState("beranda");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAdminDashboard, setAdminViewInternal] = useState(false);
  const [showSuperAdminDashboard, setShowSuperAdminDashboard] = useState(false);
  const [showUmkmDashboard, setShowUmkmDashboard] = useState(false);
  const [siteContent, setSiteContent] = useState({
    hero_title: 'Pasar Digital Desa',
    hero_desc: 'Dukung pertumbuhan ekonomi lokal dengan berbelanja produk unggulan langsung dari pengrajin dan petani desa kami. Kualitas autentik, harga terbaik.',
    hero_image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    hero_badge_title: '150+ Pelaku UMKM',
    hero_badge_subtitle: 'Terverifikasi Digital',
    banner_title: 'Potensi Desa Digital Kami',
    banner_desc: 'Kami percaya bahwa teknologi dapat mempertemukan kearifan lokal dengan pasar yang lebih luas. Melalui platform ini, kami berkomitmen untuk memberdayakan setiap pelaku UMKM di desa agar dapat bersaing secara global sambil tetap menjaga keaslian budaya kami.',
    banner_image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80'
  });
  const [frozenUmkm, setFrozenUmkm] = useState([]);
  const [umkmUsers, setUmkmUsers] = useState([]);

  // ── Fetch daftar akun UMKM (hanya untuk admin/superadmin) ───────────────
  const fetchUmkmUsers = async () => {
    try {
      if (!supabase || !isSupabaseConfigured) return;
      const { data, error } = await supabase
        .from('sellers')
        .select('phone, user_id, business_name, nib, frozen, created_at')
        .order('created_at', { ascending: false })
        .range(0, 199);
      if (!error && data) setUmkmUsers(data);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error fetching UMKM users:', err);
    }
  };

  // ── Hapus akun UMKM ─────────────────────────────────────────────────────
  const handleDeleteUmkmUser = async (userId, email) => {
    if (!supabase || !isSupabaseConfigured) {
      throw new Error('Supabase belum dikonfigurasi.');
    }
    // 1. Hapus produk milik user ini
    const { error: productErr } = await supabase.from('products').delete().eq('user_id', userId);
    if (productErr) throw new Error('Gagal menghapus produk UMKM ini.');
    // 2. Hapus dari tabel sellers (profil UMKM)
    const { error: sellerErr } = await supabase.from('sellers').delete().eq('user_id', userId);
    if (sellerErr) throw new Error('Gagal menghapus profil UMKM ini.');
    // Update state lokal
    setUmkmUsers(prev => prev.filter(u => u.email !== email));
    setProducts(prev => prev.filter(p => p.user_id !== userId && p.userEmail !== email));
  };

  const handleToggleFreezeUmkm = (key) => {
    setFrozenUmkm((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Supabase Auth Listener & Session Check
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await applyUserWithRole(session.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await applyUserWithRole(session.user);
      } else {
        setCurrentUser(null);
        setAdminViewInternal(false);
        setShowSuperAdminDashboard(false);
        setShowUmkmDashboard(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const applyUserWithRole = async (user) => {
    const email = user.email || user.user_metadata?.email;
    const role = await detectUserRole(email);
    setCurrentUser({ ...user, role });

    if (role === 'superadmin') {
      setShowSuperAdminDashboard(true);
      fetchUmkmUsers();
    } else if (role === 'admin') {
      setAdminViewInternal(true);
      fetchUmkmUsers();
    } else if (role === 'umkm') {
      setShowUmkmDashboard(true);
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut({ scope: 'global' });
    }
    setCurrentUser(null);
    setAdminViewInternal(false);
    setShowSuperAdminDashboard(false);
    setShowUmkmDashboard(false);
  };

  const handleAuthSuccess = async (user) => {
    const email = user.email || user.user_metadata?.email;
    const role = await detectUserRole(email);
    const userWithRole = { ...user, role };
    setCurrentUser(userWithRole);
    setShowAuthModal(false);

    if (role === 'superadmin') {
      setShowSuperAdminDashboard(true);
      fetchUmkmUsers();
    } else if (role === 'admin') {
      setAdminViewInternal(true);
      fetchUmkmUsers();
    } else if (role === 'umkm') {
      setShowUmkmDashboard(true);
    }
  };

  // Fetch Supabase data if configured
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      // If Supabase not configured, show empty state
      setProducts([]);
      setCategories([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch categories
        const { data: catData, error: catErr } = await supabase
          .from("categories")
          .select("*");
        if (!catErr && catData && catData.length > 0) {
          setCategories(catData);
        }

        // Fetch products
        const { data: prodData, error: prodErr } = await supabase
          .from("products")
          .select("*")
          .order("id", { ascending: false })
          .range(0, 499);
        if (!prodErr && prodData) {
          const normalized = prodData.map((p) => ({
            ...p,
            sellerName: p.sellerName || p.seller_name || "Penjual Desa",
            sellerPhone: p.sellerPhone || p.seller_phone || "",
            businessName: p.businessName || p.business_name || p.sellerName || p.seller_name || "UMKM Desa",
          }));
          setProducts(normalized);
        }
      } catch (err) {
        if (import.meta.env.DEV) console.warn("Supabase fetch error:", err);
      } finally {
        setLoading(false);
      }

      // Fetch site content
      try {
        const { data: contentData } = await supabase
          .from("site_content")
          .select("key, value");
        if (contentData && contentData.length > 0) {
          const obj = {};
          contentData.forEach((row) => { obj[row.key] = row.value; });
          setSiteContent((prev) => ({ ...prev, ...obj }));
        }
      } catch (err) {
        if (import.meta.env.DEV) console.warn("site_content fetch error:", err);
      }
    };

    fetchData();
  }, []);

  const handleProductAdded = (newProduct) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  const handleVerifyProduct = async (productId, verified, rejectionReason) => {
    const newVerified = verified;
    const snapshot = products;
    // Optimistic UI state update (matches string or number IDs)
    setProducts((prev) =>
      prev.map((p) =>
        String(p.id) === String(productId)
          ? {
              ...p,
              verified: newVerified,
              status: verified ? 'approved' : 'rejected',
              rejection_reason: verified ? null : (rejectionReason || null),
            }
          : p
      )
    );

    try {
      if (supabase && isSupabaseConfigured) {
        const updatePayload = { 
          verified: newVerified, 
          status: verified ? 'approved' : 'rejected',
          updated_at: new Date().toISOString()
        };
        if (!verified && rejectionReason) {
          updatePayload.rejection_reason = rejectionReason;
        }
        if (verified) {
          updatePayload.rejection_reason = null;
        }
        const { error } = await supabase
          .from('products')
          .update(updatePayload)
          .eq('id', productId);
        if (error) throw error;
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Verify product failed:', err);
      setProducts(snapshot);
      alert('Gagal memperbarui status produk. Perubahan dibatalkan.');
    }
  };

  const handleDeleteProduct = async (productId) => {
    const snapshot = products;
    // Optimistic UI state update
    setProducts((prev) => prev.filter((p) => String(p.id) !== String(productId)));

    try {
      if (supabase && isSupabaseConfigured) {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', productId);
        if (error) throw error;
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Delete product failed:', err);
      setProducts(snapshot);
      alert('Gagal menghapus produk. Perubahan dibatalkan.');
    }
  };

  const handleProductUpdated = async (updatedProduct) => {
    const snapshot = products;
    // Optimistic UI state update
    setProducts((prev) =>
      prev.map((p) =>
        String(p.id) === String(updatedProduct.id) ? { ...p, ...updatedProduct } : p
      )
    );

    try {
      if (supabase && isSupabaseConfigured) {
        const { error } = await supabase
          .from('products')
          .update({ ...updatedProduct, updated_at: new Date().toISOString() })
          .eq('id', updatedProduct.id);
        if (error) throw error;
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Update product failed:', err);
      setProducts(snapshot);
      alert('Gagal menyimpan perubahan produk. Perubahan dibatalkan.');
    }
  };

  const handleSaveSiteContent = async (content) => {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      const rows = Object.entries(content).map(([key, value]) => ({
        key,
        value: String(value),
      }));
      const { error } = await supabase
        .from('site_content')
        .upsert(rows, { onConflict: 'key' });
      if (error) throw error;
      setSiteContent((prev) => ({ ...prev, ...content }));
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Save site content failed:', err);
      alert('Gagal menyimpan konten situs. Coba lagi.');
    }
  };

  // Filter products based on search query and selected category
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((item) => {
      const isApproved = item.status === "approved" || item.verified !== false;
      const matchCategory = selectedCategory
        ? item.category === selectedCategory
        : true;
      const matchSearch = query
        ? (item.title ?? '').toLowerCase().includes(query) ||
          (item.desc ?? '').toLowerCase().includes(query) ||
          (item.sellerName ?? '').toLowerCase().includes(query)
        : true;

      return isApproved && matchCategory && matchSearch && !frozenUmkm.includes(item.sellerPhone);
    });
  }, [products, selectedCategory, searchQuery, frozenUmkm]);

  const activeCategoryObj = categories.find((c) => c.id === selectedCategory);

  const handleNavClick = (sectionId) => {
    setActiveNav(sectionId);
    if (sectionId === "beranda") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSearchSubmit = () => {
    const productEl = document.getElementById("produk");
    if (productEl) {
      productEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (showAdminDashboard && currentUser?.role === 'admin') {
    return (
      <div className="app-container">
        <ErrorBoundary>
          <AdminDashboard
            products={products}
            categories={categories}
            onVerifyProduct={handleVerifyProduct}
            onDeleteProduct={handleDeleteProduct}
            onProductUpdated={handleProductUpdated}
            onAddProduct={() => setShowAddProductModal(true)}
            onBack={() => setAdminViewInternal(false)}
            currentUser={currentUser}
            frozenUmkm={frozenUmkm}
            onToggleFreezeUmkm={handleToggleFreezeUmkm}
            umkmUsers={umkmUsers}
            onDeleteUmkm={handleDeleteUmkmUser}
            onRefreshUmkmUsers={fetchUmkmUsers}
            siteContent={siteContent}
            onSaveSiteContent={handleSaveSiteContent}
          />
        </ErrorBoundary>
        {showAddProductModal && (
          <AddProductModal
            categories={categories}
            currentUser={currentUser}
            onClose={() => setShowAddProductModal(false)}
            onProductAdded={handleProductAdded}
          />
        )}
      </div>
    );
  }

  if (showSuperAdminDashboard && currentUser?.role === 'superadmin') {
    return (
      <div className="app-container">
        <ErrorBoundary>
          <SuperAdminDashboard
            products={products}
            categories={categories}
            onVerifyProduct={handleVerifyProduct}
            onDeleteProduct={handleDeleteProduct}
            onProductUpdated={handleProductUpdated}
            onAddProduct={() => setShowAddProductModal(true)}
            onBack={() => setShowSuperAdminDashboard(false)}
            currentUser={currentUser}
            frozenUmkm={frozenUmkm}
            onDeleteUmkm={handleDeleteUmkmUser}
            onRefreshUmkmUsers={fetchUmkmUsers}
            siteContent={siteContent}
            onSaveSiteContent={handleSaveSiteContent}
          />
        </ErrorBoundary>
        {showAddProductModal && (
          <AddProductModal
            categories={categories}
            currentUser={currentUser}
            onClose={() => setShowAddProductModal(false)}
            onProductAdded={handleProductAdded}
          />
        )}
      </div>
    );
  }

  if (showUmkmDashboard && currentUser?.role === 'umkm') {
    return (
      <div className="app-container">
        <ErrorBoundary>
          <UmkmDashboard
            products={products}
            categories={categories}
            onAddProduct={() => setShowAddProductModal(true)}
            onDeleteProduct={handleDeleteProduct}
            onProductUpdated={handleProductUpdated}
            onBack={() => setShowUmkmDashboard(false)}
            currentUser={currentUser}
          />
        </ErrorBoundary>
        {showAddProductModal && (
          <AddProductModal
            categories={categories}
            currentUser={currentUser}
            onClose={() => setShowAddProductModal(false)}
            onProductAdded={handleProductAdded}
          />
        )}
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar
        onNavClick={handleNavClick}
        activeNav={activeNav}
        currentUser={currentUser}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenAddProduct={() => setShowAddProductModal(true)}
        onLogout={handleLogout}
        onOpenAdmin={() => setAdminViewInternal(true)}
        onOpenSuperAdmin={() => setShowSuperAdminDashboard(true)}
        onOpenUmkmDashboard={() => setShowUmkmDashboard(true)}
      />

      <HeroSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        heroTitle={siteContent.hero_title}
        heroDesc={siteContent.hero_desc}
        heroImage={siteContent.hero_image}
        heroBadgeTitle={siteContent.hero_badge_title}
        heroBadgeSubtitle={siteContent.hero_badge_subtitle}
      />

      <AnimatedSection className="section-kategori">
        <CategorySection
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(catId) => {
            setSelectedCategory(catId);
            handleSearchSubmit();
          }}
        />
      </AnimatedSection>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#64748B" }}>
          Memuat data produk dari Supabase...
        </div>
      ) : (
        <AnimatedSection animation="slide-left" delay={100}>
          <ProductSection
            products={filteredProducts}
            activeCategoryName={activeCategoryObj ? activeCategoryObj.name : null}
            searchQuery={searchQuery}
            onBuyProduct={(product) => setSelectedProduct(product)}
            onOpenLocation={(product) => setSelectedLocationProduct(product)}
          />
        </AnimatedSection>
      )}

      <AnimatedSection animation="fade-up" delay={200}>
      <BannerSection
        onLearnMore={() =>
          alert(
            "Informasi Potensi Desa Digital: Portal UMKM Desa memberdayakan ratusan petani dan pengrajin lokal untuk go digital.",
          )
        }
        bannerTitle={siteContent.banner_title}
        bannerDesc={siteContent.banner_desc}
        bannerImage={siteContent.banner_image}
      />
      </AnimatedSection>

      <Footer onOpenAuth={() => setShowAuthModal(true)} />

      {selectedProduct && (
        <WhatsAppModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {selectedLocationProduct && (
        <LocationModal
          product={selectedLocationProduct}
          onClose={() => setSelectedLocationProduct(null)}
        />
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {showAddProductModal && (
        <AddProductModal
          categories={categories}
          currentUser={currentUser}
          onClose={() => setShowAddProductModal(false)}
          onProductAdded={handleProductAdded}
        />
      )}
    </div>
  );
}