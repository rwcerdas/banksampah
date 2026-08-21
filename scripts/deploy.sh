#!/usr/bin/env bash
# ============================================================
# EcoBank — Script deployment production (Ubuntu/Debian)
# Penggunaan:
#   sudo bash scripts/deploy.sh           # instalasi / setup awal
#   sudo bash scripts/deploy.sh update    # tarik kode + rebuild
#   sudo bash scripts/deploy.sh logs      # lihat log container
#   sudo bash scripts/deploy.sh restart   # restart container
# ============================================================
set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
NGINX_SITE="ecobank"
NGINX_AVAILABLE="/etc/nginx/sites-available/${NGINX_SITE}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${NGINX_SITE}"

# Direktori root repo (parent dari scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT_DIR}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[PERINGATAN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

need_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    error "Jalankan script ini dengan sudo: sudo bash scripts/deploy.sh"
  fi
}

detect_os() {
  if [[ ! -f /etc/os-release ]]; then
    error "Tidak dapat mendeteksi OS. Script ini untuk Ubuntu/Debian."
  fi
  # shellcheck disable=SC1091
  . /etc/os-release
  case "${ID:-}" in
    ubuntu|debian) info "OS terdeteksi: ${PRETTY_NAME:-$ID}" ;;
    *) error "OS tidak didukung (${ID:-unknown}). Gunakan Ubuntu atau Debian." ;;
  esac
}

install_docker() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    info "Docker & Compose sudah terpasang."
    return
  fi
  info "Menginstal Docker Engine + Compose plugin..."
  apt-get update -y
  apt-get install -y ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  if [[ ! -f /etc/apt/keyrings/docker.gpg ]]; then
    curl -fsSL https://download.docker.com/linux/${ID}/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
  fi
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/${ID} ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
  info "Docker terpasang."
}

install_nginx_certbot() {
  if command -v nginx >/dev/null 2>&1 && command -v certbot >/dev/null 2>&1; then
    info "Nginx & Certbot sudah terpasang."
    return
  fi
  info "Menginstal nginx + certbot..."
  apt-get update -y
  apt-get install -y nginx certbot python3-certbot-nginx
  systemctl enable --now nginx
  info "Nginx & Certbot terpasang."
}

prompt_config() {
  echo ""
  echo "========================================"
  echo "  Konfigurasi EcoBank Production"
  echo "========================================"
  echo ""

  local default_domain default_email default_title
  default_domain="${DOMAIN:-}"
  default_email="${SSL_EMAIL:-}"
  default_title="${VITE_APP_TITLE:-EcoBank}"

  if [[ -f .env ]]; then
    # shellcheck disable=SC1091
    set -a; . ./.env; set +a
    default_domain="${DOMAIN:-$default_domain}"
    default_email="${SSL_EMAIL:-$default_email}"
    default_title="${VITE_APP_TITLE:-$default_title}"
  fi

  read -r -p "Domain (contoh: banksampah.contoh.id) [${default_domain}]: " DOMAIN_INPUT
  DOMAIN="${DOMAIN_INPUT:-$default_domain}"
  [[ -n "${DOMAIN}" ]] || error "Domain wajib diisi."

  read -r -p "Email untuk Let's Encrypt [${default_email}]: " EMAIL_INPUT
  SSL_EMAIL="${EMAIL_INPUT:-$default_email}"
  [[ -n "${SSL_EMAIL}" ]] || error "Email SSL wajib diisi."

  read -r -p "Judul aplikasi [${default_title}]: " TITLE_INPUT
  VITE_APP_TITLE="${TITLE_INPUT:-$default_title}"

  local existing_jwt="${JWT_SECRET:-}"
  if [[ -z "${existing_jwt}" || "${existing_jwt}" == "change-me-to-a-secure-random-string" ]]; then
    existing_jwt="$(openssl rand -hex 32)"
    info "JWT_SECRET digenerate otomatis."
  fi
  read -r -s -p "JWT_SECRET (Enter = pakai yang ada/generate): " JWT_INPUT || true
  echo ""
  JWT_SECRET="${JWT_INPUT:-$existing_jwt}"

  local default_mongo_user="${MONGO_INITDB_ROOT_USERNAME:-root}"
  local default_mongo_pass="${MONGO_INITDB_ROOT_PASSWORD:-}"
  read -r -p "Username MongoDB [${default_mongo_user}]: " MONGO_USER_INPUT
  MONGO_INITDB_ROOT_USERNAME="${MONGO_USER_INPUT:-$default_mongo_user}"

  if [[ -z "${default_mongo_pass}" || "${default_mongo_pass}" == "example" ]]; then
    default_mongo_pass="$(openssl rand -hex 16)"
    info "Password MongoDB digenerate otomatis (disimpan di .env)."
  fi
  read -r -s -p "Password MongoDB (Enter = pakai yang ada/generate): " MONGO_PASS_INPUT || true
  echo ""
  MONGO_INITDB_ROOT_PASSWORD="${MONGO_PASS_INPUT:-$default_mongo_pass}"

  read -r -s -p "GEMINI_API_KEY (opsional, Enter = kosong/lewati): " GEMINI_INPUT || true
  echo ""
  GEMINI_API_KEY="${GEMINI_INPUT:-${GEMINI_API_KEY:-}}"
}

write_env() {
  info "Menulis file .env ..."
  cat > .env <<EOF
# Digenerate oleh scripts/deploy.sh — jangan commit file ini
DOMAIN=${DOMAIN}
SSL_EMAIL=${SSL_EMAIL}
JWT_SECRET=${JWT_SECRET}
GEMINI_API_KEY=${GEMINI_API_KEY}
VITE_APP_TITLE=${VITE_APP_TITLE}
# Production: same-origin (kosong)
VITE_API_BASE_URL=
MONGO_INITDB_ROOT_USERNAME=${MONGO_INITDB_ROOT_USERNAME}
MONGO_INITDB_ROOT_PASSWORD=${MONGO_INITDB_ROOT_PASSWORD}
MONGO_URI=mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@mongodb:27017/ecobank?authSource=admin
EOF
  chmod 600 .env
  info "File .env siap (izin 600)."
}

start_compose() {
  info "Build & jalankan container production..."
  docker compose -f "${COMPOSE_FILE}" up -d --build
  info "Menunggu layanan siap..."
  sleep 8
  docker compose -f "${COMPOSE_FILE}" ps
}

configure_nginx() {
  local template="${ROOT_DIR}/deploy/nginx-ecobank.conf.template"
  [[ -f "${template}" ]] || error "Template nginx tidak ditemukan: ${template}"

  info "Mengonfigurasi nginx untuk ${DOMAIN} ..."
  sed "s/__DOMAIN__/${DOMAIN}/g" "${template}" > "${NGINX_AVAILABLE}"

  ln -sfn "${NGINX_AVAILABLE}" "${NGINX_ENABLED}"
  # Hapus default site jika bentrok
  if [[ -L /etc/nginx/sites-enabled/default ]]; then
    rm -f /etc/nginx/sites-enabled/default
    warn "Site default nginx dinonaktifkan."
  fi

  nginx -t
  systemctl reload nginx
  info "Nginx dikonfigurasi (HTTP)."
}

obtain_ssl() {
  info "Meminta sertifikat Let's Encrypt untuk ${DOMAIN} ..."
  warn "Pastikan DNS A record ${DOMAIN} sudah mengarah ke IP server ini."

  if certbot --nginx \
      -d "${DOMAIN}" \
      --email "${SSL_EMAIL}" \
      --agree-tos \
      --no-eff-email \
      --non-interactive \
      --redirect; then
    info "Sertifikat SSL berhasil dipasang."
  else
    warn "Certbot gagal (mode non-interaktif). Coba manual:"
    echo "  sudo certbot --nginx -d ${DOMAIN} --email ${SSL_EMAIL}"
    warn "Penyebab umum: DNS belum propagaasi, port 80/443 tertutup, atau firewall."
  fi
}

print_success() {
  echo ""
  echo "========================================"
  echo -e "  ${GREEN}EcoBank siap!${NC}"
  echo "========================================"
  echo "  URL      : https://${DOMAIN}"
  echo "  Setup    : buka URL di atas → wizard admin"
  echo ""
  echo "  Perintah berguna:"
  echo "    sudo bash scripts/deploy.sh update"
  echo "    sudo bash scripts/deploy.sh logs"
  echo "    sudo bash scripts/deploy.sh restart"
  echo "    docker compose -f ${COMPOSE_FILE} ps"
  echo "========================================"
}

cmd_update() {
  need_root
  detect_os
  [[ -f .env ]] || error "File .env belum ada. Jalankan deploy penuh dulu."
  info "Menarik update dari git (jika remote ada)..."
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git pull --ff-only || warn "git pull gagal — lanjut rebuild dengan kode lokal."
  fi
  docker compose -f "${COMPOSE_FILE}" up -d --build
  info "Update selesai."
}

cmd_logs() {
  need_root
  docker compose -f "${COMPOSE_FILE}" logs -f --tail=200
}

cmd_restart() {
  need_root
  docker compose -f "${COMPOSE_FILE}" restart
  systemctl reload nginx || true
  info "Container & nginx di-restart/reload."
}

cmd_install() {
  need_root
  detect_os
  install_docker
  install_nginx_certbot
  prompt_config
  write_env
  start_compose
  configure_nginx
  obtain_ssl
  print_success
}

main() {
  local action="${1:-install}"
  case "${action}" in
    install|"") cmd_install ;;
    update)     cmd_update ;;
    logs)       cmd_logs ;;
    restart)    cmd_restart ;;
    *)
      echo "Penggunaan: sudo bash scripts/deploy.sh [install|update|logs|restart]"
      exit 1
      ;;
  esac
}

main "$@"
