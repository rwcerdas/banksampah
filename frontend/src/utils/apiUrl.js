/**
 * ✅ Helper global untuk membangun URL API yang konsisten.
 * Menjamin semua request otomatis mengarah ke prefix /api/
 * tanpa duplikasi slash atau kesalahan format base URL.
 *
 * Contoh hasil:
 *   apiUrl('households')              → http://localhost:3000/api/households
 *   apiUrl('/households?page=1')     → http://localhost:3000/api/households?page=1
 *   apiUrl('/api/auth/login')        → http://localhost:3000/api/auth/login
 *   apiUrl('api/auth/login')         → http://localhost:3000/api/auth/login
 *   apiUrl('http://example.com/foo') → http://example.com/foo
 */
export function apiUrl(path = "") {
  // ✅ FIX: Allow empty string (relative path) by checking undefined explicitly
  const envBase = import.meta.env.VITE_API_BASE_URL;
  const base = (envBase !== undefined ? envBase : 'http://localhost:3001').replace(/\/+$/, '');

  // kalau path sudah berupa URL absolut (misal http:// atau https://)
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  // hapus semua slash awal & hapus prefix "api/" ganda di awal
  let cleanPath = String(path || "").replace(/^\/+/, "").replace(/^api\/+/i, "");

  // gabungkan
  return `${base}/api/${cleanPath}`;
}

/**
 * ✅ Helper untuk membangun URL Static Images/Files
 * Mengarah langsung ke root (tanpa /api)
 * Contoh: getImgUrl('uploads/proofs/123.jpg') -> http://localhost:3000/uploads/proofs/123.jpg
 */
export function getImgUrl(path = "") {
  // ✅ FIX: Allow empty string (relative path) by checking undefined explicitly
  const envBase = import.meta.env.VITE_API_BASE_URL;
  const base = (envBase !== undefined ? envBase : 'http://localhost:3001').replace(/\/+$/, '');

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  // Ensure path starts with /
  let cleanPath = String(path || "").replace(/^\/+/, "");
  return `${base}/${cleanPath}`;
}