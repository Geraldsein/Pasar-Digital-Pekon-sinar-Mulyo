const formatRupiah = (num) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num);
};

const sanitizeText = (text) => {
  if (!text) return '';
  return text.replace(/[<>]/g, '');
};

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePhone = (phone) => {
  const re = /^(\+?62|0)[\d]{9,13}$/;
  return re.test(phone);
};

const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

const debounce = (func, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const IMAGE_EXT_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const MAX_TITLE_LENGTH = 120;
const MAX_DESC_LENGTH = 2000;
const MAX_UNIT_LENGTH = 24;
const MAX_TAG_LENGTH = 32;
const MAX_NAME_LENGTH = 80;
const MAX_NIB_LENGTH = 32;
const MAX_LOCATION_LENGTH = 200;
const MAX_NOTE_LENGTH = 200;
const MAX_SEARCH_LENGTH = 100;
const MAX_QUANTITY = 999;
const MAX_PRICE = 1_000_000_000;
const MAX_SITE_CONTENT_LENGTH = 2000;

// Hanya key ini yang boleh ditulis ke tabel site_content.
const SITE_CONTENT_KEYS = [
  'hero_title',
  'hero_desc',
  'hero_image',
  'hero_badge_title',
  'hero_badge_subtitle',
  'banner_title',
  'banner_desc',
  'banner_image',
];

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';

const safeImageUrl = (url, fallback = FALLBACK_IMAGE) => {
  if (typeof url !== 'string') return fallback;
  const value = url.trim();
  if (/^https:\/\/[^/\\]/i.test(value)) return value;
  if (/^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=\s]*$/i.test(value)) return value;
  // Batasi blob: ke bentuk yang dihasilkan createObjectURL (blob:<origin>/<uuid>),
  // agar helper ini tetap aman bila kelak dipakai untuk href.
  if (/^blob:https?:\/\/[^/\\]+\/[a-z0-9-]+$/i.test(value)) return value;
  return fallback;
};

const buildUmkmList = (products, frozenUmkm = []) => {
  const map = {};
  (products || []).forEach((p) => {
    const userId = p.user_id || '';
    const phone = p.sellerPhone || p.seller_phone || '';
    const sellerName = p.sellerName || p.seller_name || '';
    const businessName = p.businessName || p.business_name || sellerName || 'UMKM Tanpa Nama';
    // Key stabil: user_id lebih dulu, agar aksi hapus/bekukan menargetkan
    // baris yang benar walau nomor telepon diubah atau kosong.
    const key = userId || phone || sellerName || 'unknown';
    if (!map[key]) {
      map[key] = {
        key,
        userId,
        phone,
        name: businessName,
        sellerName,
        count: 0,
        frozen: frozenUmkm.includes(key) || (userId && frozenUmkm.includes(userId)),
      };
    }
    map[key].count++;
  });
  (frozenUmkm || []).forEach((frozenKey) => {
    if (!map[frozenKey]) {
      map[frozenKey] = { key: frozenKey, userId: frozenKey, phone: '', name: frozenKey, count: 0, frozen: true };
    }
  });
  return Object.values(map);
};

export {
  formatRupiah,
  sanitizeText,
  validateEmail,
  validatePhone,
  truncateText,
  debounce,
  buildUmkmList,
  ALLOWED_IMAGE_TYPES,
  IMAGE_EXT_BY_TYPE,
  MAX_IMAGE_BYTES,
  MAX_TITLE_LENGTH,
  MAX_DESC_LENGTH,
  MAX_UNIT_LENGTH,
  MAX_TAG_LENGTH,
  MAX_NAME_LENGTH,
  MAX_NIB_LENGTH,
  MAX_LOCATION_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_SEARCH_LENGTH,
  MAX_QUANTITY,
  MAX_PRICE,
  MAX_SITE_CONTENT_LENGTH,
  SITE_CONTENT_KEYS,
  FALLBACK_IMAGE,
  safeImageUrl,
};