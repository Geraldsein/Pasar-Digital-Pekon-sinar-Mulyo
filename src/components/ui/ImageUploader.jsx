import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { ALLOWED_IMAGE_TYPES, safeImageUrl } from '../../lib/utils';

/**
 * Komponen upload gambar dengan drag-and-drop dan pilih file.
 * Mengembalikan base64 string via onChange(base64String).
 * Jika value sudah ada (URL atau base64), tampilkan preview.
 */
export default function ImageUploader({ value, onChange, label, disabled = false, accept = 'image/jpeg,image/png,image/webp' }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const processFile = (file) => {
    setError('');
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Format gambar harus JPG, PNG, atau WEBP.');
      return;
    }
    const MAX_MB = 5;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Ukuran file maksimal ${MAX_MB}MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    processFile(file);
    e.target.value = '';
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setError('');
  };

  const hasImage = value && (value.startsWith('data:') || value.startsWith('http://') || value.startsWith('https://') || value.startsWith('blob:'));

  const borderColor = dragging ? '#7C3AED' : disabled ? '#E2E8F0' : '#CBD5E1';
  const bg = dragging ? '#F5F3FF' : disabled ? '#F8FAFC' : '#FAFBFC';

  return (
    <div style={{ marginBottom: '0' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#1E293B' }}>
          {label}
        </label>
      )}

      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          border: `2px dashed ${borderColor}`,
          borderRadius: '10px',
          background: bg,
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'border-color 0.2s, background 0.2s',
          overflow: 'hidden',
          position: 'relative',
          minHeight: hasImage ? 'auto' : '110px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        {hasImage ? (
          <div style={{ width: '100%', position: 'relative' }}>
            <img
              src={safeImageUrl(value)}
              alt="Preview"
              onError={(e) => { e.target.style.display = 'none'; }}
              style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', display: 'block', borderRadius: '8px' }}
            />
            {!disabled && (
              <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                  style={{
                    background: 'rgba(255,255,255,0.92)', border: '1px solid #CBD5E1',
                    borderRadius: '6px', padding: '4px 10px', cursor: 'pointer',
                    fontSize: '0.75rem', fontWeight: 600, color: '#1E293B',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  <Upload size={12} /> Ganti
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  style={{
                    background: 'rgba(255,255,255,0.92)', border: '1px solid #FECFCA',
                    borderRadius: '6px', padding: '4px 8px', cursor: 'pointer',
                    color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div style={{
              width: '44px', height: '44px', borderRadius: '10px',
              background: dragging ? '#EDE9FE' : '#F1F5F9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: dragging ? '#7C3AED' : '#94A3B8',
              transition: 'all 0.2s'
            }}>
              {dragging ? <Upload size={22} /> : <ImageIcon size={22} />}
            </div>
            <div style={{ textAlign: 'center', padding: '0 12px 12px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: disabled ? '#94A3B8' : '#1E293B' }}>
                {disabled ? 'Upload gambar tidak tersedia' : 'Seret & lepas gambar di sini'}
              </div>
              {!disabled && (
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                  atau <span style={{ color: '#7C3AED', fontWeight: 600 }}>pilih dari file</span> · Maks. 5MB
                </div>
              )}
            </div>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={disabled}
        />
      </div>

      {error && (
        <div style={{ marginTop: '6px', fontSize: '0.78rem', color: '#DC2626', fontWeight: 500 }}>
          ⚠ {error}
        </div>
      )}
    </div>
  );
}
