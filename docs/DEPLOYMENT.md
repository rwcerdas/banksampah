# Panduan Deployment Production EcoBank

Tutorial memasang EcoBank di **VPS Ubuntu/Debian** dengan:

- Docker Compose (frontend, backend, MongoDB)
- **Nginx** di host sebagai reverse proxy
- **Let's Encrypt** (Certbot) untuk HTTPS gratis

Script otomatis: [`scripts/deploy.sh`](../scripts/deploy.sh)

## Arsitektur singkat

```
Pengguna (browser)
    │  HTTPS :443
    ▼
Nginx (host) + sertifikat Let's Encrypt
    │  proxy ke 127.0.0.1:8081
    ▼
Frontend container (nginx internal)
    ├── file statis Vue
    └── /api & /uploads  →  Backend container → MongoDB
```

Backend dan MongoDB **tidak** dibuka ke internet; hanya nginx host yang expose port 80/443.

## Persyaratan

| Item | Keterangan |
|------|------------|
| VPS | Ubuntu 22.04/24.04 atau Debian setara |
| Akses | Root atau user dengan `sudo` |
| Domain | Nama domain dengan **A record** mengarah ke IP VPS |
| Firewall | Port **80** dan **443** terbuka |
| RAM | Minimal 2 GB (disarankan 4 GB) |

### Siapkan DNS

Di penyedia domain, buat record:

| Tipe | Nama | Nilai |
|------|------|--------|
| A | `@` atau subdomain (mis. `banksampah`) | IP publik VPS Anda |

Tunggu DNS propagaasi (bisa beberapa menit hingga beberapa jam). Uji:

```bash
ping domain-anda.com
# atau
dig +short domain-anda.com
```

IP yang muncul harus sama dengan IP VPS.

### Buka firewall (contoh UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

## Instalasi otomatis (disarankan)

### 1. Login ke VPS

```bash
ssh user@IP_VPS_ANDA
```

### 2. Clone repository

```bash
sudo apt-get update
sudo apt-get install -y git
git clone https://github.com/rwcerdas/banksampah.git
cd banksampah
```

### 3. Jalankan script deploy

```bash
sudo bash scripts/deploy.sh
```

Script akan:

1. Memasang Docker + Compose (jika belum ada)
2. Memasang nginx + certbot (jika belum ada)
3. Meminta input: **domain**, **email SSL**, judul aplikasi, JWT, password Mongo
4. Menulis file `.env`
5. Build & menjalankan `docker-compose.prod.yml`
6. Mengonfigurasi nginx reverse proxy
7. Meminta sertifikat Let's Encrypt dan mengaktifkan HTTPS

### 4. Selesai

Buka `https://domain-anda.com` di browser. Wizard setup muncul pada kunjungan pertama — buat akun admin bank sampah.

## Perintah harian

Jalankan dari folder proyek (`banksampah/`):

| Tujuan | Perintah |
|--------|----------|
| Update kode + rebuild | `sudo bash scripts/deploy.sh update` |
| Lihat log | `sudo bash scripts/deploy.sh logs` |
| Restart layanan | `sudo bash scripts/deploy.sh restart` |
| Status container | `docker compose -f docker-compose.prod.yml ps` |
| Stop | `docker compose -f docker-compose.prod.yml down` |

### Backup data (volume MongoDB & upload)

```bash
# Contoh: salin volume MongoDB (nama volume bisa dicek dengan docker volume ls)
docker run --rm \
  -v banksampah_ecobank_mongo_data:/data:ro \
  -v "$(pwd)/backup:/backup" \
  alpine tar czf /backup/mongo-$(date +%F).tar.gz -C /data .

docker run --rm \
  -v banksampah_ecobank_uploads:/data:ro \
  -v "$(pwd)/backup:/backup" \
  alpine tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
```

Nama volume tergantung nama folder proyek; cek dengan:

```bash
docker volume ls | grep ecobank
```

## Instalasi manual (tanpa script)

Jika Anda ingin mengontrol setiap langkah:

```bash
cp .env.example .env
# Edit .env:
#   JWT_SECRET=... (wajib kuat)
#   MONGO_INITDB_ROOT_PASSWORD=... (wajib kuat)
#   VITE_API_BASE_URL=          (kosong untuk production)
#   VITE_APP_TITLE=EcoBank
#   DOMAIN=domain-anda.com
#   SSL_EMAIL=admin@domain-anda.com

docker compose -f docker-compose.prod.yml up -d --build
```

Salin template nginx:

```bash
sudo sed 's/__DOMAIN__/domain-anda.com/g' deploy/nginx-ecobank.conf.template \
  | sudo tee /etc/nginx/sites-available/ecobank
sudo ln -sfn /etc/nginx/sites-available/ecobank /etc/nginx/sites-enabled/ecobank
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

SSL:

```bash
sudo certbot --nginx -d domain-anda.com --email admin@domain-anda.com --agree-tos --redirect
```

## Troubleshooting

| Masalah | Penyebab umum | Solusi |
|---------|---------------|--------|
| Certbot gagal | DNS belum ke IP VPS / port 80 tertutup | Cek `dig`, buka firewall 80/443, ulangi `sudo certbot --nginx -d DOMAIN` |
| 502 Bad Gateway | Container frontend belum siap | `docker compose -f docker-compose.prod.yml ps` dan `logs` |
| Halaman kosong / API error | `VITE_API_BASE_URL` masih mengarah ke localhost | Pastikan di `.env` production: `VITE_API_BASE_URL=` (kosong), lalu rebuild frontend |
| Tidak bisa login setelah ganti password Mongo | Volume lama masih pakai password lama | Jangan ganti password root Mongo sembarangan; atau reset volume (data hilang): `docker compose -f docker-compose.prod.yml down -v` |
| Permission denied | Script tanpa sudo | Jalankan `sudo bash scripts/deploy.sh` |
| Port 8081 conflict | Proses lain memakai 8081 di localhost | Hentikan proses tersebut atau ubah mapping di `docker-compose.prod.yml` |

### Cek cepat kesehatan

```bash
curl -I http://127.0.0.1:8081
curl -I https://domain-anda.com
docker compose -f docker-compose.prod.yml logs --tail=100 backend
```

## Keamanan singkat

- Jangan commit file `.env`
- Ganti `JWT_SECRET` dan password Mongo dari nilai contoh
- Pastikan hanya port 22 (SSH), 80, dan 443 yang terbuka ke publik
- Perbarui VPS secara berkala: `sudo apt update && sudo apt upgrade`

## Bantuan

Jika stuck di langkah SSL atau Docker, kumpulkan:

1. Output `docker compose -f docker-compose.prod.yml ps`
2. Output `sudo nginx -t`
3. Pesan error Certbot

Lalu hubungi penulis buku EcoBank / pengelola teknis Anda.
