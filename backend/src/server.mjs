import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import 'express-async-errors';

import { validateEnv } from './config/env.mjs';
import authRoutes from './routes/auth.routes.mjs';
import setupRoutes from './routes/setup.routes.mjs';
import bankRoutes from './routes/bank.routes.mjs';
import reportRoutes from './routes/report.routes.mjs';
import collectorRoutes from './routes/collector.routes.mjs';
import notificationRoutes from './routes/notification.routes.mjs';
import brandingRoutes from './routes/branding.routes.mjs';

dotenv.config();
validateEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

// Ensure upload directories exist
const uploadDirs = ['uploads/proofs', 'uploads/settings', 'uploads/education', 'uploads/cash-proofs', 'uploads/profile'];
for (const dir of uploadDirs) {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
}

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ecobank-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/collectors', collectorRoutes);
app.use('/api', bankRoutes);

app.use((err, _req, res, _next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected:', process.env.MONGO_URI?.replace(/\/\/.*@/, '//***@'));
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`EcoBank backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

export default app;
