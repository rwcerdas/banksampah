#!/usr/bin/env node
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../backend/src/models/user.model.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const username = process.argv[2] || 'admin';
const password = process.argv[3] || 'admin12345';
const fullName = process.argv[4] || 'Administrator';

async function main() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27018/ecobank?authSource=admin');
  const existing = await User.findOne({ username });
  if (existing) {
    console.log('Admin already exists:', username);
    process.exit(0);
  }
  const hash = await bcrypt.hash(password, 10);
  await User.create({
    username,
    password_hash: hash,
    fullName,
    nama_lengkap: fullName,
    role: 'admin',
    isActive: true,
  });
  console.log('Admin created:', username);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
