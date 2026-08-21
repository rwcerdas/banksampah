# EcoBank

Sistem manajemen **Bank Sampah** mandiri: panel admin + portal nasabah (PWA) untuk operasional sehari-hari.

## Stack

- Frontend: Vue 3 + Vite + Tailwind + PWA
- Backend: Express + Mongoose
- Database: MongoDB 7
- Container: Docker Compose

## Mulai Cepat (Lokal)

```bash
cp .env.example .env
docker compose up -d
```

Buka di browser:

- Frontend: http://localhost:5174
- Backend API: http://localhost:3001

Kunjungan pertama membuka **Setup Wizard** untuk membuat akun admin dan kategori default.

### Peta port (hindari bentrok dengan proyek lain)

| Layanan        | Dev EcoBank | Prod (di balik nginx) |
|----------------|-------------|------------------------|
| Frontend       | **5174**    | 127.0.0.1:**8081**     |
| Backend        | **3001**    | internal Docker saja   |
| MongoDB        | **27018**   | internal Docker saja   |
| Web publik     | —           | **80 / 443** (nginx)   |

## Dokumentasi

- [Panduan instalasi lokal](docs/INSTALL.md) — untuk development / uji di laptop
- [Panduan deployment production](docs/DEPLOYMENT.md) — VPS + nginx + Let's Encrypt
- [Panduan admin](docs/ADMIN-GUIDE.md) — ringkasan menu operasional

## Development tanpa Docker (opsional)

```bash
# Terminal 1 — MongoDB (atau: docker compose up mongodb)
# Terminal 2
cd backend && npm install && npm run dev

# Terminal 3
cd frontend && npm install && npm run dev
```

## Production (ringkas)

Di VPS Ubuntu/Debian dengan domain yang sudah mengarah ke IP server:

```bash
git clone https://github.com/rwcerdas/banksampah.git
cd banksampah
sudo bash scripts/deploy.sh
```

Detail lengkap ada di [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Lisensi

Proprietary — disertakan bersama produk buku EcoBank.
