# ============================================================
# 🧱 STAGE 1 — Build Vue App (Vite)
# ============================================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy all source files
COPY . .

# Inject placeholder env untuk diganti runtime
RUN echo "VITE_API_BASE_URL=VITE_API_BASE_URL_PLACEHOLDER" > .env.production && \
    echo "VITE_APP_TITLE=VITE_APP_TITLE_PLACEHOLDER" >> .env.production

# Build Vite production files
RUN npm run build

# ============================================================
# 🌐 STAGE 2 — Serve with Nginx
# ============================================================
FROM nginx:alpine

# Copy build output
COPY --from=builder /app/dist /usr/share/nginx/html

# Pastikan service worker Firebase Messaging tersedia di root (untuk production)
COPY --from=builder /app/public/firebase-messaging-sw.js /usr/share/nginx/html/firebase-messaging-sw.js

# Fix permissions for nginx worker to read files
RUN chmod -R 755 /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy runtime environment injector script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Nginx runs on port 80 (Traefik handles HTTPS)
EXPOSE 80

# Default entrypoint
ENTRYPOINT ["/entrypoint.sh"]
