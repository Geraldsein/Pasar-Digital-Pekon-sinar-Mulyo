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

export { formatRupiah, sanitizeText, validateEmail, validatePhone, truncateText, debounce, buildUmkmList };