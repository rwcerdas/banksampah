# Panduan Instalasi EcoBank (Lokal)

Panduan instalasi untuk menjalankan EcoBank di laptop/PC (development atau uji coba).

Untuk **server production** (domain, HTTPS, nginx), lihat [DEPLOYMENT.md](DEPLOYMENT.md).

## Persyaratan

- Docker Desktop (Mac/Windows) atau Docker Engine (Linux)
- RAM minimal 4 GB
- Port bebas: **5174** (frontend), **3001** (backend), **27018** (MongoDB)

## Langkah Instalasi

### 1. Clone repository

```bash
git clone https://github.com/rwcerdas/banksampah.git
cd banksampah
```

### 2. Konfigurasi environment

```bash
cp .env.example .env
```

Edit `.env` — minimal ubah `JWT_SECRET` ke string acak yang kuat.

Opsional: isi `GEMINI_API_KEY` untuk fitur AI Insight di laporan.

### 3. Jalankan aplikasi

```bash
docker compose up -d
```

Tunggu sekitar 30 detik hingga semua container berjalan.

Cek status:

```bash
docker compose ps
docker compose logs -f backend
```

### 4. Setup awal (pertama kali)

1. Buka http://localhost:5174
2. Isi wizard setup:
   - Nama bank sampah
   - Alamat
   - Akun admin (username + password)
3. Login sebagai admin

### 5. Mulai operasional

| Tugas | Menu |
|-------|------|
| Atur kategori & harga | Admin → Kategori & Harga |
| Daftarkan nasabah | Admin → Nasabah → Tambah |
| Penimbangan | Admin → Transaksi |
| Portal nasabah (HP) | Login sebagai nasabah → http://localhost:5174/nasabah |

## Install PWA di HP (Nasabah)

1. Buka `/nasabah` di browser Chrome/Safari
2. Ketuk **Add to Home Screen** / **Install App**
3. Nasabah bisa cek saldo seperti aplikasi native

## Production

Jangan hanya menjalankan `docker-compose.prod.yml` tanpa reverse proxy jika ingin HTTPS publik.

Gunakan script dan panduan lengkap:

```bash
sudo bash scripts/deploy.sh
```

Lihat: [DEPLOYMENT.md](DEPLOYMENT.md)

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Port sudah dipakai | Ubah mapping port di `docker-compose.yml` |
| Setup wizard tidak muncul | Pastikan MongoDB running: `docker compose logs backend` |
| Login gagal / data kotor | Reset volume: `docker compose down -v` lalu setup ulang |
| `JWT_SECRET` masih default | Edit `.env` lalu `docker compose up -d --force-recreate backend` |

## Support

Hubungi penulis buku EcoBank untuk bantuan teknis.
