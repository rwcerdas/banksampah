#!/usr/bin/env bash
# Adapt copied files for EcoBank standalone (does not touch SatuData)
set -euo pipefail
ECOBANK="/Users/mac/Documents/rizky faisal/Docker/EcoBank"

echo "==> Fixing backend import paths..."
find "$ECOBANK/backend/src/controllers" -name '*.mjs' -exec sed -i '' \
  -e "s|from '../../models/|from '../models/|g" \
  -e "s|from '../../services/|from '../services/|g" \
  -e "s|from '../../utils/|from '../utils/|g" \
  -e "s|from '../../middleware/|from '../middleware/|g" \
  -e "s|from '../../utils/waste-bank/dateRange.mjs'|from '../utils/dateRange.mjs'|g" \
  -e "s|role: 'nasabah'|role: 'nasabah'|g" \
  {} +

find "$ECOBANK/backend/src/controllers" -name '*.mjs' -exec sed -i '' \
  -e "s|ai-insight.service.mjs|aiInsight.service.mjs|g" \
  {} +

echo "==> Fixing frontend API paths..."
find "$ECOBANK/frontend/src" -type f \( -name '*.js' -o -name '*.vue' \) -exec sed -i '' \
  -e "s|/api/waste-bank/reports|/api/reports|g" \
  -e "s|/api/waste-bank/collectors|/api/collectors|g" \
  -e "s|/api/waste-bank|/api|g" \
  -e "s|wasteBankService|bankService|g" \
  -e "s|wasteBankReportService|bankReportService|g" \
  -e "s|@/services/wasteBankService|@/services/bankService|g" \
  -e "s|@/services/wasteBankReportService|@/services/bankReportService|g" \
  -e "s|admin-banksampah|admin|g" \
  -e "s|/waste-bank/nasabah|/nasabah|g" \
  -e "s|/waste-bank/dashboard|/admin/dashboard|g" \
  -e "s|/waste-bank/|/admin/|g" \
  -e "s|SatuData|EcoBank|g" \
  -e "s|logo-gasberlin.png|/assets/ecobank-logo.png|g" \
  {} + 2>/dev/null || true

echo "==> Adapt complete"
