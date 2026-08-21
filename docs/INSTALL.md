# EcoBank Installation Guide

Panduan instalasi untuk pembeli buku EcoBank.

## Persyaratan

- Docker Desktop (Mac/Windows) atau Docker Engine (Linux)
- RAM minimal 4 GB
- Port bebas: **5174** (frontend), **3001** (backend), **27018** (MongoDB)

## Langkah Instalasi

### 1. Clone repository

```bash
git clone https://github.com/YOUR_ORG/EcoBank.git
cd EcoBank
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

Tunggu ~30 detik hingga semua container running.

### 4. Setup awal (first run)

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
2. Tap **Add to Home Screen** / **Install App**
3. Nasabah bisa cek saldo seperti aplikasi native

## Production

```bash
docker compose -f docker-compose.prod.yml up -d
```

Frontend di port **8081**, backend di **3001**.

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Port sudah dipakai | Ubah port di `docker-compose.yml` |
| Setup wizard tidak muncul | Pastikan MongoDB running, cek `docker compose logs backend` |
| Login gagal | Reset DB: `docker compose down -v` lalu setup ulang |

## Support

Hubungi penulis buku EcoBank untuk bantuan teknis.
