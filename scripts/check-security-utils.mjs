import assert from 'node:assert/strict';
import {
  safeImageUrl,
  buildUmkmList,
  ALLOWED_IMAGE_TYPES,
  IMAGE_EXT_BY_TYPE,
  SITE_CONTENT_KEYS,
  MAX_PRICE,
  MAX_QUANTITY,
  FALLBACK_IMAGE,
} from '../src/lib/utils.js';

// ── safeImageUrl: skema yang diizinkan ─────────────────────────────────────
assert.equal(safeImageUrl('https://example.com/a.jpg'), 'https://example.com/a.jpg');
assert.equal(safeImageUrl('data:image/png;base64,AAAA'), 'data:image/png;base64,AAAA');
assert.equal(safeImageUrl('blob:http://localhost:5173/8f14e45f-ceea-467a-9575-3b2c1d0e7a11'),
  'blob:http://localhost:5173/8f14e45f-ceea-467a-9575-3b2c1d0e7a11');

// ── safeImageUrl: skema berbahaya harus jatuh ke fallback ──────────────────
assert.equal(safeImageUrl('javascript:alert(1)'), FALLBACK_IMAGE);
assert.equal(safeImageUrl('JaVaScRiPt:alert(1)'), FALLBACK_IMAGE);
assert.equal(safeImageUrl('  javascript:alert(1)'), FALLBACK_IMAGE);
assert.equal(safeImageUrl('\tjavascript:alert(1)'), FALLBACK_IMAGE);
assert.equal(safeImageUrl('http://example.com/a.jpg'), FALLBACK_IMAGE);
assert.equal(safeImageUrl('//evil.com/a.jpg'), FALLBACK_IMAGE);
assert.equal(safeImageUrl('https:/\\evil.com'), FALLBACK_IMAGE);
assert.equal(safeImageUrl('https://'), FALLBACK_IMAGE);
assert.equal(safeImageUrl('data:text/html;base64,AAAA'), FALLBACK_IMAGE);
assert.equal(safeImageUrl('data:image/svg+xml;base64,AAAA'), FALLBACK_IMAGE);
// blob: hanya bentuk createObjectURL; blob:javascript: harus ditolak agar
// helper ini tetap aman bila kelak dipakai pada atribut href.
assert.equal(safeImageUrl('blob:javascript:alert(1)'), FALLBACK_IMAGE);
assert.equal(safeImageUrl(''), FALLBACK_IMAGE);
assert.equal(safeImageUrl(null), FALLBACK_IMAGE);
assert.equal(safeImageUrl(undefined), FALLBACK_IMAGE);
assert.equal(safeImageUrl({}), FALLBACK_IMAGE);
assert.equal(safeImageUrl(['https://x.test/a.jpg']), FALLBACK_IMAGE);

// fallback kustom: form memakai null untuk menolak URL yang tidak valid
assert.equal(safeImageUrl('javascript:alert(1)', null), null);
assert.equal(safeImageUrl('https://ok.test/a.jpg', null), 'https://ok.test/a.jpg');

// ── Allowlist MIME upload ──────────────────────────────────────────────────
assert.deepEqual(ALLOWED_IMAGE_TYPES, ['image/jpeg', 'image/png', 'image/webp']);
assert.ok(!ALLOWED_IMAGE_TYPES.includes('image/svg+xml'));
assert.ok(!ALLOWED_IMAGE_TYPES.includes('text/html'));

// Ekstensi diturunkan dari MIME, bukan dari nama file kiriman pengguna
assert.equal(IMAGE_EXT_BY_TYPE['image/jpeg'], 'jpg');
assert.equal(IMAGE_EXT_BY_TYPE['image/svg+xml'], undefined);

// ── buildUmkmList: key harus user_id agar hapus/bekukan tepat sasaran ──────
const products = [
  { user_id: 'u-1', seller_phone: '628111', business_name: 'Toko A' },
  { user_id: 'u-1', seller_phone: '628111', business_name: 'Toko A' },
  { user_id: 'u-2', seller_phone: '628222', business_name: 'Toko B' },
];
const list = buildUmkmList(products, ['u-2']);
assert.equal(list.length, 2);

const a = list.find((x) => x.userId === 'u-1');
const b = list.find((x) => x.userId === 'u-2');
assert.equal(a.key, 'u-1', 'key wajib user_id, bukan nomor telepon');
assert.equal(a.count, 2);
assert.equal(a.frozen, false);
assert.equal(b.frozen, true, 'frozenUmkm dicocokkan dengan user_id');
assert.equal(b.phone, '628222');

// Produk tanpa user_id tidak boleh menabrak entri lain
const noId = buildUmkmList([{ seller_phone: '628333', business_name: 'Toko C' }]);
assert.equal(noId[0].userId, '');
assert.equal(noId[0].key, '628333');

// ── Batas nilai ────────────────────────────────────────────────────────────
assert.equal(MAX_PRICE, 1_000_000_000);
assert.equal(MAX_QUANTITY, 999);

// site_content hanya menerima key yang dikenal
assert.ok(SITE_CONTENT_KEYS.includes('hero_title'));
assert.ok(!SITE_CONTENT_KEYS.includes('__proto__'));
assert.ok(!SITE_CONTENT_KEYS.includes('is_admin'));

console.log('security-utils checks passed');
