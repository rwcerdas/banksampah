# EcoBank

Standalone Bank Sampah management system — admin panel + mobile nasabah app.

## Quick Start

```bash
cp .env.example .env
docker compose up -d
```

Open:
- Frontend: http://localhost:5174
- Backend API: http://localhost:3001
- MongoDB (host): localhost:27018

### Port map (hindari bentrok SatuData)

| Service  | SatuData | EcoBank |
|----------|----------|---------|
| Frontend | 5173     | **5174** |
| Backend  | 3000     | **3001** |
| MongoDB  | 27017    | **27018** |
| Prod web | —        | **8081** |

First visit opens **Setup Wizard** to create admin account and seed default categories.

## Stack

- Frontend: Vue 3 + Vite + Tailwind + PWA
- Backend: Express + Mongoose
- Database: MongoDB 7

## Development (without Docker)

```bash
# Terminal 1 - MongoDB (or use docker compose up mongodb)
# Terminal 2
cd backend && npm install && npm run dev

# Terminal 3
cd frontend && npm install && npm run dev
```

## Documentation

See [docs/INSTALL.md](docs/INSTALL.md) for detailed installation guide for book buyers.

## License

Proprietary — bundled with EcoBank book product.
