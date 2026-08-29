import React, { useState, useRef } from "react";
import { X, AlertCircle, Save, UploadCloud, Trash2, Link as LinkIcon } from "lucide-react";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_TITLE_LENGTH,
  MAX_DESC_LENGTH,
  MAX_UNIT_LENGTH,
  MAX_TAG_LENGTH,
  MAX_NAME_LENGTH,
  MAX_PRICE,
  safeImageUrl,
} from "../lib/utils";
import { uploadImageToStorage } from "../lib/supabase";

export default function EditProductModal({ product, categories, onClose, onProductUpdated }) {
  const [title, setTitle] = useState(product.title);
  const [category, setCategory] = useState(product.category);
  const [price, setPrice] = useState(String(product.price));
  const [unit, setUnit] = useState(product.unit);
  const [desc, setDesc] = useState(product.desc);
  const [sellerName, setSellerName] = useState(product.sellerName);
  const [phoneSuffix, setPhoneSuffix] = useState(product.sellerPhone?.replace(/^62/, "") || "");
  const [tag, setTag] = useState(product.tag || "");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Image states
  const [uploadMode, setUploadMode] = useState("url");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState(product.image);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Drag & Drop handlers
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (e.dataTransfer.files?.[0]) handleFileSelected(e.dataTransfer.files[0]); };
  const handleFileChange = (e) => { if (e.target.files?.[0]) handleFileSelected(e.target.files[0]); };

  const handleFileSelected = (file) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) { setErrorMsg("Format gambar harus JPG, PNG, atau WEBP."); return; }
    if (file.size > MAX_IMAGE_BYTES) { setErrorMsg("Ukuran gambar maksimal 5MB."); return; }
    setErrorMsg("");
    setImageFile(file);
    // Preview lokal saja; yang disimpan ke DB nanti adalah URL hasil upload.
    setImagePreview(URL.createObjectURL(file));
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
      if (!title || !price || !desc) throw new Error("Nama produk, harga, dan deskripsi harus diisi.");
      if (Number(price) <= 0) throw new Error("Harga harus lebih dari 0.");
      if (Number(price) > MAX_PRICE) throw new Error("Harga maksimal Rp 1.000.000.000.");
      if (title.length > MAX_TITLE_LENGTH) throw new Error(`Nama produk maksimal ${MAX_TITLE_LENGTH} karakter.`);
      if (desc.length > MAX_DESC_LENGTH) throw new Error(`Deskripsi maksimal ${MAX_DESC_LENGTH} karakter.`);
      if (unit.length > MAX_UNIT_LENGTH) throw new Error(`Satuan maksimal ${MAX_UNIT_LENGTH} karakter.`);
      if (tag.length > MAX_TAG_LENGTH) throw new Error(`Tag maksimal ${MAX_TAG_LENGTH} karakter.`);
      if (sellerName.length > MAX_NAME_LENGTH) throw new Error(`Nama penjual maksimal ${MAX_NAME_LENGTH} karakter.`);

      let finalImage = product.image;
      if (uploadMode === "file" && imageFile) {
        // Gambar diunggah ke Storage; data URL tidak pernah masuk ke database.
        finalImage = await uploadImageToStorage(imageFile);
      } else if (uploadMode === "url" && imageUrlInput.trim()) {
        finalImage = safeImageUrl(imageUrlInput.trim(), null);
        if (!finalImage) throw new Error("URL gambar harus diawali https://");
      }

      const updatedProduct = {
        ...product,
        title, category, price: Number(price), unit, desc,
        sellerName,
        sellerPhone: "62" + phoneSuffix,
        tag: tag || null,
        image: finalImage,
      };

      if (onProductUpdated) onProductUpdated(updatedProduct);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Gagal mengupdate produk.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
        <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>

        <h3 className="modal-header-title" style={{ textAlign: "left", marginBottom: "20px" }}>Edit Produk</h3>

        {errorMsg && (
          <div style={{ background: "#FEE2E2", color: "#991B1B", padding: "10px 14px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertCircle size={16} /> <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Nama Produk</label>
            <input type="text" required maxLength={MAX_TITLE_LENGTH} value={title} onChange={(e) => setTitle(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "0.9rem" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Kategori</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "0.9rem" }}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Tag (Opsional)</label>
              <input type="text" placeholder="Terlaris, Baru" maxLength={MAX_TAG_LENGTH} value={tag} onChange={(e) => setTag(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "0.9rem" }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Harga (Rp)</label>
              <input type="number" required min={1} max={MAX_PRICE} value={price} onChange={(e) => setPrice(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "0.9rem" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Satuan</label>
              <input type="text" required maxLength={MAX_UNIT_LENGTH} value={unit} onChange={(e) => setUnit(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "0.9rem" }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Nama Penjual</label>
              <input type="text" required maxLength={MAX_NAME_LENGTH} value={sellerName} onChange={(e) => setSellerName(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "0.9rem" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>No. WhatsApp</label>
              <div style={{ display: "flex", alignItems: "center", border: "1px solid #CBD5E1", borderRadius: "8px", overflow: "hidden" }}>
                <span style={{ padding: "9px 0 9px 12px", fontSize: "0.9rem", color: "#94A3B8", fontWeight: 600, userSelect: "none", background: "#F8FAFC", borderRight: "1px solid #E2E8F0" }}>+62</span>
                <input type="text" required maxLength={15} placeholder="xxxxxxxxxxx" value={phoneSuffix} onChange={(e) => setPhoneSuffix(e.target.value.replace(/\D/g, ""))}
                  style={{ width: "100%", padding: "9px 12px", border: "none", fontSize: "0.9rem", outline: "none" }} />
              </div>
            </div>
          </div>

          {/* IMAGE UPLOAD */}
          <div style={{ marginBottom: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Foto Produk</label>
              <div style={{ display: "flex", gap: "4px", background: "#F1F5F9", padding: "2px", borderRadius: "6px" }}>
                <button type="button" onClick={() => setUploadMode("file")} style={{
                  border: "none", background: uploadMode === "file" ? "white" : "transparent",
                  color: uploadMode === "file" ? "#0F2C59" : "#64748B", padding: "3px 8px",
                  borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                  boxShadow: uploadMode === "file" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                }}>Upload File</button>
                <button type="button" onClick={() => setUploadMode("url")} style={{
                  border: "none", background: uploadMode === "url" ? "white" : "transparent",
                  color: uploadMode === "url" ? "#0F2C59" : "#64748B", padding: "3px 8px",
                  borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                  boxShadow: uploadMode === "url" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                }}>URL Link</button>
              </div>
            </div>

            {uploadMode === "file" ? (
              <div>
                {imagePreview ? (
                  <div style={{ position: "relative", borderRadius: "10px", overflow: "hidden", border: "1px solid #CBD5E1", height: "160px", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={safeImageUrl(imagePreview)} alt="Preview" style={{ height: "100%", width: "100%", objectFit: "cover" }} />
                    <button type="button" onClick={handleRemoveImage} title="Hapus gambar" style={{
                      position: "absolute", top: "8px", right: "8px", background: "rgba(239, 68, 68, 0.9)", color: "white",
                      border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Trash2 size={16} />
                    </button>
                    <div style={{ position: "absolute", bottom: "8px", left: "8px", background: "rgba(15, 44, 89, 0.85)", color: "white", fontSize: "0.75rem", padding: "4px 10px", borderRadius: "6px" }}>
                      ✓ Gambar Siap
                    </div>
                  </div>
                ) : (
                  <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{ border: `2px dashed ${isDragging ? "#2563EB" : "#CBD5E1"}`, background: isDragging ? "#EFF6FF" : "#F8FAFC", borderRadius: "12px", padding: "24px 16px", textAlign: "center", cursor: "pointer", transition: "all 0.2s ease" }}>
                    <input type="file" ref={fileInputRef} accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} style={{ display: "none" }} />
                    <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                      <UploadCloud size={24} />
                    </div>
                    <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1E293B", marginBottom: "4px" }}>Tarik & Lepas Gambar ke Sini</p>
                    <p style={{ fontSize: "0.8rem", color: "#64748B", marginBottom: "8px" }}>atau <span style={{ color: "#2563EB", textDecoration: "underline" }}>Pilih File dari Perangkat</span></p>
                    <p style={{ fontSize: "0.725rem", color: "#94A3B8" }}>Format: PNG, JPG, WEBP (Maksimal 5MB)</p>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <LinkIcon size={18} style={{ position: "absolute", left: "12px", top: "11px", color: "#94A3B8" }} />
                <input type="url" placeholder="https://images.unsplash.com/..." value={imageUrlInput} onChange={(e) => setImageUrlInput(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px 9px 38px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "0.9rem" }} />
              </div>
            )}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>Deskripsi</label>
            <textarea rows={3} required maxLength={MAX_DESC_LENGTH} value={desc} onChange={(e) => setDesc(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "0.9rem", outline: "none" }} />
          </div>

          <button type="submit" disabled={loading} style={{
            width: "100%", backgroundColor: "#1E40AF", color: "white", border: "none",
            padding: "12px", borderRadius: "10px", fontWeight: 700, fontSize: "0.95rem",
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.75 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
          }}>
            <Save size={18} />
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </form>
      </div>
    </div>
  );
}