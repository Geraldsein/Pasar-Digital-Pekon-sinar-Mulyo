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
  const [frozenUmkm] = useState([]);
  const [umkmUsers, setUmkmUsers] = useState([]);

  // ── Fetch daftar akun UMKM ──────────────────────────────────────────────
  const fetchUmkmUsers = async () => {
    try {
      if (!supabase || !isSupabaseConfigured) return;
      const { data, error } = await supabase
        .from('umkm_users')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setUmkmUsers(data);
    } catch (err) {
      console.error('Error fetching UMKM users:', err);
    }
  };

  // ── Hapus akun UMKM ─────────────────────────────────────────────────────
  const handleDeleteUmkmUser = async (userId, email) => {
    try {
      if (!supabase || !isSupabaseConfigured) return;
      // 1. Hapus produk milik user ini
      await supabase.from('products').delete().eq('user_id', userId);
      // 2. Hapus dari tabel umkm_users
      await supabase.from('umkm_users').delete().eq('user_id', userId);
      // 3. Hapus auth user via Supabase Dashboard / Edge Function
      // (service role tidak boleh dipakai di client bundle)
      // Update state lokal
      setUmkmUsers(prev => prev.filter(u => u.email !== email));
      setProducts(prev => prev.filter(p => p.user_id !== userId && p.userEmail !== email));
    } catch (err) {
      console.error('Error deleting UMKM user:', err);
      throw err;
    }
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
    } else if (role === 'admin') {
      setAdminViewInternal(true);
    } else if (role === 'umkm') {
      setShowUmkmDashboard(true);
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
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
          .order("id", { ascending: false });
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
        console.warn("Supabase fetch error, fallback to mock data:", err);
      } finally {
        setLoading(false);
      }

      // Fetch site content
      try {
        const { data: contentData } = await supabase
          .from("site_content")
          .select("*");
        if (contentData && contentData.length > 0) {
          const obj = {};
          contentData.forEach((row) => { obj[row.key] = row.value; });
          setSiteContent((prev) => ({ ...prev, ...obj }));
        }
      } catch { /* ignore */ }
    };

    fetchData();
  }, []);

  // ── Load umkm users (Supabase) ──────────────────────────────────────────
  useEffect(() => {
    fetchUmkmUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupabaseConfigured]);

  const handleProductAdded = (newProduct) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  const handleVerifyProduct = async (productId, verified, rejectionReason) => {
    const newVerified = verified;
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
        if (error) {
          console.warn('Supabase update warning:', error.message || error);
        }
      }
    } catch (err) {
      console.error('Error verifying product in Supabase:', err);
    }
  };

  const handleDeleteProduct = async (productId) => {
    // Optimistic UI state update
    setProducts((prev) => prev.filter((p) => String(p.id) !== String(productId)));

    try {
      if (supabase && isSupabaseConfigured) {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', productId);
        if (error) {
          console.warn('Supabase delete warning:', error.message || error);
        }
      }
    } catch (err) {
      console.error('Error deleting product in Supabase:', err);
    }
  };

  const handleProductUpdated = async (updatedProduct) => {
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
        if (error) {
          console.warn('Supabase update warning:', error.message || error);
        }
      }
    } catch (err) {
      console.error('Error updating product in Supabase:', err);
    }
  };

  const handleSaveSiteContent = async (content) => {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      for (const [key, value] of Object.entries(content)) {
        await supabase.from('site_content').upsert(
          { key, value: String(value) },
          { onConflict: 'key' }
        );
      }
      setSiteContent((prev) => ({ ...prev, ...content }));
    } catch (err) {
      console.error('Error saving site content:', err);
    }
  };

  // Filter products based on search query and selected category
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const isApproved = item.status === "approved" || item.verified !== false;
      const matchCategory = selectedCategory
        ? item.category === selectedCategory
        : true;
      const matchSearch = searchQuery.trim()
        ? item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.sellerName.toLowerCase().includes(searchQuery.toLowerCase())
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