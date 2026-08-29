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

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';

const safeImageUrl = (url, fallback = FALLBACK_IMAGE) => {
  if (typeof url !== 'string') return fallback;
  const value = url.trim();
  if (/^https:\/\//i.test(value)) return value;
  if (/^data:image\/(jpeg|png|webp);base64,/i.test(value)) return value;
  if (/^blob:/i.test(value)) return value;
  return fallback;
};

const buildUmkmList = (products, frozenUmkm = []) => {
  const map = {};
  (products || []).forEach((p) => {
    const phone = p.sellerPhone || p.seller_phone || '';
    const sellerName = p.sellerName || p.seller_name || '';
    const businessName = p.businessName || p.business_name || sellerName || 'UMKM Tanpa Nama';
    const key = phone || sellerName || 'unknown';
    if (!map[key]) {
      map[key] = {
        key,
        phone,
        name: businessName,
        sellerName,
        count: 0,
        frozen: frozenUmkm.includes(key) || (phone && frozenUmkm.includes(phone)),
      };
    }
    map[key].count++;
  });
  (frozenUmkm || []).forEach((phone) => {
    if (!map[phone]) {
      map[phone] = { key: phone, phone, name: phone, count: 0, frozen: true };
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
  FALLBACK_IMAGE,
  safeImageUrl,
};