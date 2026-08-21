#!/bin/sh
set -e

echo "🚀 Starting SatuData Frontend Runtime Configuration"

JS_DIR="/usr/share/nginx/html/assets"
# 🔍 Cari file utama build dari Vite (bukan lib seperti html2canvas)
echo "🧩 Melakukan replacement pada SEMUA file JS di $JS_DIR"
echo "🌐 Mengganti placeholder dengan:"
echo "   VITE_API_BASE_URL=$VITE_API_BASE_URL"
echo "   VITE_APP_TITLE=$VITE_APP_TITLE"

# 🧠 Ganti placeholder di SEMUA file JS (untuk menangani code splitting)
# Perbaiki: Jangan gunakan $(find ...) langsung di loop karena spasi file (aman), tapi globbing lebih aman.
# Gunakan find -exec sed untuk keamanan dan performa
find "$JS_DIR" -type f -name "*.js" -exec sed -i "s|VITE_API_BASE_URL_PLACEHOLDER|${VITE_API_BASE_URL}|g" {} +
find "$JS_DIR" -type f -name "*.js" -exec sed -i "s|VITE_APP_TITLE_PLACEHOLDER|${VITE_APP_TITLE}|g" {} +

echo "✅ Konfigurasi environment runtime selesai!"
if [ "$#" -gt 0 ]; then
  exec "$@"
else
  exec nginx -g "daemon off;"
fi