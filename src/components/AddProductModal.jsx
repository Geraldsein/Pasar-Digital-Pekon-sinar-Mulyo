import React, { useState, useEffect, useRef } from "react";
import { UploadCloud } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export default function AddProductModal({
  categories,
  onClose,
  onProductAdded,
  currentUser,
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0]?.id || "makanan");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("/pcs");
  const [desc, setDesc] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [phoneSuffix, setPhoneSuffix] = useState("");
  const [nib, setNib] = useState("");
  const [tag, setTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");

  // Auto-fill seller data from profile on mount
  const fullName = currentUser?.user_metadata?.full_name || '';
  useEffect(() => {
    if (!currentUser?.id || !supabase || !isSupabaseConfigured) return;
    const loadSeller = async () => {
      try {
        const { data } = await supabase
          .from('sellers')
          .select('*')
          .eq('user_id', currentUser.id)
          .maybeSingle();
        if (data) {
          setBusinessName(data.business_name || '');
          setNib(data.nib || '');
          if (data.phone) {
            setPhoneSuffix(data.phone.startsWith('62') ? data.phone.slice(2) : data.phone);
          }
          setSellerName(fullName);
        }
      } catch (e) {
        console.warn("Gagal memuat profil penjual:", e);
      }
    };
    loadSeller();
  }, [currentUser?.id, fullName]);

  const fileInputRef = useRef(null);

  // Image states
  const [uploadMode, setUploadMode] = useState("file"); // 'file' or 'url'
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Handle Drag & Drop Events
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file) => {
    if (file.type === "image/svg+xml" || file.name.endsWith(".svg")) {
      setErrorMsg("Format SVG tidak diizinkan. Gunakan JPG, PNG, atau WEBP.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMsg("File harus berupa gambar (JPG, PNG, WEBP, dll).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Ukuran gambar maksimal adalah 5MB.");
      return;
    }

    setErrorMsg("");
    setImageFile(file);

    // Create local preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (Number(price) <= 0) {
        throw new Error("Harga harus lebih dari 0.");
      }

      let finalImageUrl =
        "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80";

      // Upload image to Supabase Storage if configured
      if (uploadMode === "file" && imageFile) {
        setUploadProgress("Mengunggah gambar...");

        if (supabase && isSupabaseConfigured) {
          try {
            const fileExt = imageFile.name.split(".").pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `product-images/${fileName}`;

            const { data: uploadData, error: uploadError } =
              await supabase.storage
                .from("products")
                .upload(filePath, imageFile, { upsert: true });

            if (!uploadError && uploadData) {
              const { data: publicUrlData } = supabase.storage
                .from("products")
                .getPublicUrl(filePath);

              if (publicUrlData && publicUrlData.publicUrl) {
                finalImageUrl = publicUrlData.publicUrl;
              }
            } else {
              console.warn("Storage upload error, fallback to base64 preview:", uploadError);
              finalImageUrl = imagePreview;
            }
          } catch (storageErr) {
            console.warn("Storage upload error, fallback to base64 preview:", storageErr);
            finalImageUrl = imagePreview;
          }
        } else {
          finalImageUrl = imagePreview;
        }
      } else if (uploadMode === "url" && imageUrlInput.trim()) {
        finalImageUrl = imageUrlInput.trim();
      } else if (uploadMode === "file" && imagePreview) {
        finalImageUrl = imagePreview;
      }

      setUploadProgress("Menyimpan data produk...");

      // Ambil lokasi dari profil usaha akun UMKM (set di Profil Usaha)
      let sellerLocation = null;
      let sellerLat = null;
      let sellerLng = null;
      if (supabase && isSupabaseConfigured && currentUser?.id) {
        try {
          const { data: sellerRow } = await supabase
            .from("sellers")
            .select("location, lat, lng")
            .eq("user_id", currentUser.id)
            .maybeSingle();
          if (sellerRow) {
            sellerLocation = sellerRow.location || null;
            sellerLat = sellerRow.lat != null ? sellerRow.lat : null;
            sellerLng = sellerRow.lng != null ? sellerRow.lng : null;
          }
        } catch (e) { console.warn("Gagal ambil lokasi penjual:", e); }
      }

      const newProductData = {
        title,
        category,
        price: Number(price),
        unit,
        tag: tag || null,
        verified: false,
        status: "pending",
        desc,
        owner: currentUser?.email || null,
        businessName: businessName || title,
        business_name: businessName || title,
        nib,
        sellerName: sellerName || "Penjual Desa",
        seller_name: sellerName || "Penjual Desa",
        sellerPhone: "62" + phoneSuffix,
        seller_phone: "62" + phoneSuffix,
        location: sellerLocation,
        lat: sellerLat,
        lng: sellerLng,
        image: finalImageUrl,
        user_id: currentUser?.id || null,
      };

      if (!supabase || !isSupabaseConfigured) {
        throw new Error('Supabase belum dikonfigurasi. Isi .env lalu restart.');
      }

      const supabasePayload = {
          title: newProductData.title,
          category: newProductData.category,
          price: newProductData.price,
          unit: newProductData.unit,
          tag: newProductData.tag,
          desc: newProductData.desc,
          verified: newProductData.verified,
          status: newProductData.status,
          image: newProductData.image,
          seller_name: newProductData.seller_name,
          seller_phone: newProductData.seller_phone,
          business_name: newProductData.business_name,
          nib: newProductData.nib,
          location: newProductData.location,
          lat: newProductData.lat,
          lng: newProductData.lng,
          user_id: newProductData.user_id,
        };

      const { data, error } = await supabase
        .from("products")
        .insert([supabasePayload])
        .select("*");

      if (error) {
        throw new Error(error.message || 'Gagal menambahkan produk.');
      }
      if (onProductAdded && data && data[0]) {
        onProductAdded({ ...data[0], sellerName: data[0].seller_name, sellerPhone: data[0].seller_phone, businessName: data[0].business_name });
      }

      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Gagal menambahkan produk.");
    } finally {
      setLoading(false);
      setUploadProgress("");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "560px", maxHeight: "90vh", overflowY: "auto" }}
      >
        <button className="modal-close-btn" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 7l-8 8-8-8" />
            <path d="M4 7l8 8 8-8" />
            <path d="M12 3v18" />
            <path d="M12 12h.01" />
          </svg>
          <h3 className="modal-header-title" style={{ margin: 0 }}>
            Tambah Produk UMKM Baru
          </h3>
        </div>

        {errorMsg && (
          <div
            style={{
              background: "#FEE2E2",
              color: "#991B1B",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "14px" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              Nama Produk
            </label>
            <input
              type="text"
              required
              placeholder="Misal: Keripik Singkong Balado Khas Desa"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "1px solid #CBD5E1",
                borderRadius: "8px",
                fontSize: "0.9rem",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "14px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              >
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1px solid #CBD5E1",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                }}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              >
                Tag / Label (Opsional)
              </label>
              <input
                type="text"
                placeholder="Misal: Terlaris, Baru"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1px solid #CBD5E1",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "12px",
              marginBottom: "14px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              >
                Harga (Rp)
              </label>
              <input
                type="number"
                required
                min={0}
                placeholder="Misal: 25000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1px solid #CBD5E1",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              >
                Satuan
              </label>
              <input
                type="text"
                required
                placeholder="/pcs, /kg, /buah"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1px solid #CBD5E1",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                }}
              />
            </div>
          </div>

          {/* IMAGE UPLOAD / DRAG & DROP SECTION */}
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                Foto Produk
              </label>

              {/* Toggle Mode Upload */}
              <div
                style={{
                  display: "flex",
                  gap: "4px",
                  background: "#F1F5F9",
                  padding: "2px",
                  borderRadius: "6px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setUploadMode("file")}
                  style={{
                    border: "none",
                    background: uploadMode === "file" ? "white" : "transparent",
                    color: uploadMode === "file" ? "#0F2C59" : "#64748B",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow:
                      uploadMode === "file"
                        ? "0 1px 3px rgba(0,0,0,0.1)"
                        : "none",
                  }}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode("url")}
                  style={{
                    border: "none",
                    background: uploadMode === "url" ? "white" : "transparent",
                    color: uploadMode === "url" ? "#0F2C59" : "#64748B",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow:
                      uploadMode === "url"
                        ? "0 1px 3px rgba(0,0,0,0.1)"
                        : "none",
                  }}
                >
                  URL Link
                </button>
              </div>
            </div>

            {uploadMode === "file" ? (
              <div>
                {imagePreview ? (
                  <div
                    style={{
                      position: "relative",
                      borderRadius: "10px",
                      overflow: "hidden",
                      border: "1px solid #CBD5E1",
                      height: "160px",
                      background: "#F8FAFC",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={imagePreview}
                      alt="Preview Produk"
                      style={{
                        height: "100%",
                        width: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      title="Hapus gambar"
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        background: "rgba(239, 68, 68, 0.9)",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: "32px",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                    <div
                      style={{
                        position: "absolute",
                        bottom: "8px",
                        left: "8px",
                        background: "rgba(15, 44, 89, 0.85)",
                        color: "white",
                        fontSize: "0.75rem",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      ✓ Gambar Siap Diunggah (
                      {imageFile
                        ? (imageFile.size / 1024).toFixed(0) + " KB"
                        : "Preview"}
                      )
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() =>
                      fileInputRef.current && fileInputRef.current.click()
                    }
                    style={{
                      border: `2px dashed ${isDragging ? "#2563EB" : "#CBD5E1"}`,
                      backgroundColor: isDragging ? "#EFF6FF" : "#F8FAFC",
                      borderRadius: "12px",
                      padding: "24px 16px",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />

                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        background: "#EFF6FF",
                        color: "#2563EB",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 10px",
                      }}
                    >
                      <UploadCloud size={24} />
                    </div>

                    <p
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        color: "#1E293B",
                        marginBottom: "4px",
                      }}
                    >
                      Tarik & Lepas Gambar ke Sini
                    </p>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "#64748B",
                        marginBottom: "8px",
                      }}
                    >
                      atau{" "}
                      <span
                        style={{
                          color: "#2563EB",
                          textDecoration: "underline",
                        }}
                      >
                        Pilih File dari Perangkat
                      </span>
                    </p>
                    <p style={{ fontSize: "0.725rem", color: "#94A3B8" }}>
                      Format: PNG, JPG, WEBP (Maksimal 5MB)
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "11px",
                    color: "#94A3B8",
                  }}
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72" />
                </svg>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px 9px 38px",
                    border: "1px solid #CBD5E1",
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                  }}
                />
              </div>
            )}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              Deskripsi Produk
            </label>
            <textarea
              rows={3}
              required
              placeholder="Penjelasan keunggulan dan kearifan lokal produk..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "1px solid #CBD5E1",
                borderRadius: "8px",
                fontSize: "0.9rem",
                outline: "none",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              backgroundColor: "#1E40AF",
              color: "white",
              border: "none",
              padding: "12px",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.75 : 1,
            }}
          >
            {loading
              ? uploadProgress || "Menyimpan Produk..."
              : "Simpan & Publikasikan Produk"}
          </button>
        </form>
      </div>
    </div>
  );
}