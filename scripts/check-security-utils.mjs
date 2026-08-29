import assert from 'node:assert/strict';
import { safeImageUrl, ALLOWED_IMAGE_TYPES, IMAGE_EXT_BY_TYPE, FALLBACK_IMAGE } from '../src/lib/utils.js';

// safeImageUrl: hanya https, data:image, blob yang lolos
assert.equal(safeImageUrl('https://example.com/a.jpg'), 'https://example.com/a.jpg');
assert.equal(safeImageUrl('data:image/png;base64,AAAA'), 'data:image/png;base64,AAAA');
assert.ok(safeImageUrl('blob:http://localhost/abc').startsWith('blob:'));

// skema berbahaya harus jatuh ke fallback
assert.equal(safeImageUrl('javascript:alert(1)'), FALLBACK_IMAGE);
assert.equal(safeImageUrl('JaVaScRiPt:alert(1)'), FALLBACK_IMAGE);
assert.equal(safeImageUrl('http://example.com/a.jpg'), FALLBACK_IMAGE);
assert.equal(safeImageUrl('data:text/html;base64,AAAA'), FALLBACK_IMAGE);
assert.equal(safeImageUrl('data:image/svg+xml;base64,AAAA'), FALLBACK_IMAGE);
assert.equal(safeImageUrl(''), FALLBACK_IMAGE);
assert.equal(safeImageUrl(null), FALLBACK_IMAGE);
assert.equal(safeImageUrl(undefined), FALLBACK_IMAGE);
assert.equal(safeImageUrl({}), FALLBACK_IMAGE);

// fallback kustom (dipakai form untuk menolak URL)
assert.equal(safeImageUrl('javascript:alert(1)', null), null);

// allowlist MIME upload: SVG dan tipe non-gambar harus ditolak
assert.deepEqual(ALLOWED_IMAGE_TYPES, ['image/jpeg', 'image/png', 'image/webp']);
assert.ok(!ALLOWED_IMAGE_TYPES.includes('image/svg+xml'));
assert.ok(!ALLOWED_IMAGE_TYPES.includes('text/html'));

// ekstensi diturunkan dari MIME, bukan dari nama file
assert.equal(IMAGE_EXT_BY_TYPE['image/jpeg'], 'jpg');
assert.equal(IMAGE_EXT_BY_TYPE['image/svg+xml'], undefined);

console.log('security-utils checks passed');
