#!/usr/bin/env bash
# Read-only copy from SatuData — does NOT modify SatuData repo
set -euo pipefail

SATUDATA="/Users/mac/Documents/rizky faisal/Docker/SatuData"
ECOBANK="/Users/mac/Documents/rizky faisal/Docker/EcoBank"

echo "==> Copying backend controllers..."
cp -r "$SATUDATA/backend/src/controllers/waste-bank/"* "$ECOBANK/backend/src/controllers/"
cp "$SATUDATA/backend/src/controllers/wasteBankEducation.controller.mjs" "$ECOBANK/backend/src/controllers/"
cp "$SATUDATA/backend/src/controllers/wasteBankCash.controller.mjs" "$ECOBANK/backend/src/controllers/"
cp "$SATUDATA/backend/src/controllers/wasteBankCollector.controller.mjs" "$ECOBANK/backend/src/controllers/"
cp "$SATUDATA/backend/src/controllers/wasteBankReport.controller.mjs" "$ECOBANK/backend/src/controllers/"

echo "==> Copying backend models..."
cp "$SATUDATA/backend/src/models/wasteBank"*.model.mjs "$ECOBANK/backend/src/models/"
cp "$SATUDATA/backend/src/models/wasteBankEducation.schema.mjs" "$ECOBANK/backend/src/models/"

echo "==> Copying backend routes..."
cp "$SATUDATA/backend/src/routes/wasteBank.routes.mjs" "$ECOBANK/backend/src/routes/bank.routes.mjs"
cp "$SATUDATA/backend/src/routes/wasteBankReport.routes.mjs" "$ECOBANK/backend/src/routes/report.routes.mjs"
cp "$SATUDATA/backend/src/routes/wasteBankCollector.routes.mjs" "$ECOBANK/backend/src/routes/collector.routes.mjs"

echo "==> Copying upload middlewares..."
cp "$SATUDATA/backend/src/middleware/uploadWithdrawalProof.mjs" "$ECOBANK/backend/src/middleware/"
cp "$SATUDATA/backend/src/middleware/uploadSettingsImage.mjs" "$ECOBANK/backend/src/middleware/"
cp "$SATUDATA/backend/src/middleware/uploadEducationImage.mjs" "$ECOBANK/backend/src/middleware/"
cp "$SATUDATA/backend/src/middleware/uploadCashProof.mjs" "$ECOBANK/backend/src/middleware/"
cp "$SATUDATA/backend/src/middleware/uploadProfilePhoto.mjs" "$ECOBANK/backend/src/middleware/"

echo "==> Copying utils and services..."
mkdir -p "$ECOBANK/backend/src/utils"
cp "$SATUDATA/backend/src/utils/waste-bank/dateRange.mjs" "$ECOBANK/backend/src/utils/dateRange.mjs"
cp "$SATUDATA/backend/src/services/auditTrail.service.mjs" "$ECOBANK/backend/src/services/"
cp "$SATUDATA/backend/src/models/auditTrail.model.mjs" "$ECOBANK/backend/src/models/"

echo "==> Copying scripts and templates..."
cp "$SATUDATA/backend/scripts/seed_wastebank_master.mjs" "$ECOBANK/scripts/seed-master.mjs"
cp "$SATUDATA/backend/templates/bank_sampah_template.csv" "$ECOBANK/backend/templates/"

echo "==> Copying backend tests..."
mkdir -p "$ECOBANK/backend/src/controllers/__tests__" "$ECOBANK/backend/src/utils/__tests__"
cp "$SATUDATA/backend/src/controllers/__tests__/wasteBank.contract.test.mjs" "$ECOBANK/backend/src/controllers/__tests__/bank.contract.test.mjs" 2>/dev/null || true
cp "$SATUDATA/backend/src/utils/__tests__/wasteBankDateRange.test.mjs" "$ECOBANK/backend/src/utils/__tests__/dateRange.test.mjs" 2>/dev/null || true

echo "==> Copying frontend waste-bank module..."
cp -r "$SATUDATA/frontend/src/views/modules/waste-bank/"* "$ECOBANK/frontend/src/views/admin/"
mkdir -p "$ECOBANK/frontend/src/views/nasabah/components"
cp "$SATUDATA/frontend/src/views/modules/waste-bank/NasabahDashboard.vue" "$ECOBANK/frontend/src/views/nasabah/"
cp "$SATUDATA/frontend/src/views/modules/waste-bank/WasteBankAbout.vue" "$ECOBANK/frontend/src/views/nasabah/About.vue"
cp "$SATUDATA/frontend/src/views/modules/waste-bank/ForceChangePassword.vue" "$ECOBANK/frontend/src/views/auth/"
cp -r "$SATUDATA/frontend/src/views/modules/waste-bank/nasabah-components/"* "$ECOBANK/frontend/src/views/nasabah/components/"

echo "==> Copying frontend composables..."
cp -r "$SATUDATA/frontend/src/views/modules/waste-bank/composables/"* "$ECOBANK/frontend/src/composables/" 2>/dev/null || true

echo "==> Copying frontend components..."
mkdir -p "$ECOBANK/frontend/src/components/waste-bank"
cp -r "$SATUDATA/frontend/src/components/waste-bank/"* "$ECOBANK/frontend/src/components/waste-bank/"
cp "$SATUDATA/frontend/src/components/ChangePasswordModal.vue" "$ECOBANK/frontend/src/components/"
cp "$SATUDATA/frontend/src/components/ProfilePhotoUpload.vue" "$ECOBANK/frontend/src/components/"
cp "$SATUDATA/frontend/src/components/ThemeToggle.vue" "$ECOBANK/frontend/src/components/"
mkdir -p "$ECOBANK/frontend/src/components/ui" "$ECOBANK/frontend/src/components/notifications"
cp "$SATUDATA/frontend/src/components/ui/ToastContainer.vue" "$ECOBANK/frontend/src/components/ui/"
cp "$SATUDATA/frontend/src/components/notifications/NotificationBell.vue" "$ECOBANK/frontend/src/components/notifications/"
cp "$SATUDATA/frontend/src/components/PwaUpdateBanner.vue" "$ECOBANK/frontend/src/components/"
cp "$SATUDATA/frontend/src/components/OfflineBlocker.vue" "$ECOBANK/frontend/src/components/"

echo "==> Copying frontend services and utils..."
cp "$SATUDATA/frontend/src/services/wasteBankService.js" "$ECOBANK/frontend/src/services/bankService.js"
cp "$SATUDATA/frontend/src/services/wasteBankReportService.js" "$ECOBANK/frontend/src/services/bankReportService.js"
cp "$SATUDATA/frontend/src/utils/priceListExport.js" "$ECOBANK/frontend/src/utils/"
cp "$SATUDATA/frontend/src/utils/reportPdfGenerator.js" "$ECOBANK/frontend/src/utils/"
cp "$SATUDATA/frontend/src/utils/formatters.js" "$ECOBANK/frontend/src/utils/"
cp "$SATUDATA/frontend/src/utils/api.js" "$ECOBANK/frontend/src/utils/"
cp "$SATUDATA/frontend/src/utils/apiUrl.js" "$ECOBANK/frontend/src/utils/"
cp "$SATUDATA/frontend/src/composables/useWasteBankInsights.js" "$ECOBANK/frontend/src/composables/"
cp "$SATUDATA/frontend/src/composables/useToast.js" "$ECOBANK/frontend/src/composables/"
cp "$SATUDATA/frontend/src/composables/usePwaInstall.js" "$ECOBANK/frontend/src/composables/"
cp "$SATUDATA/frontend/src/composables/usePwaUpdateBanner.js" "$ECOBANK/frontend/src/composables/"
cp "$SATUDATA/frontend/src/composables/useAppBadge.js" "$ECOBANK/frontend/src/composables/"

echo "==> Copying stores..."
cp "$SATUDATA/frontend/src/stores/userStore.js" "$ECOBANK/frontend/src/stores/"
cp "$SATUDATA/frontend/src/stores/themeStore.js" "$ECOBANK/frontend/src/stores/"
cp "$SATUDATA/frontend/src/stores/notificationStore.js" "$ECOBANK/frontend/src/stores/"

echo "==> Copying frontend config..."
cp "$SATUDATA/frontend/tailwind.config.js" "$ECOBANK/frontend/"
cp "$SATUDATA/frontend/postcss.config.js" "$ECOBANK/frontend/" 2>/dev/null || true
cp "$SATUDATA/frontend/nginx.conf" "$ECOBANK/frontend/" 2>/dev/null || true
cp "$SATUDATA/frontend/entrypoint.sh" "$ECOBANK/frontend/" 2>/dev/null || true
cp "$SATUDATA/frontend/Dockerfile" "$ECOBANK/frontend/"
cp "$SATUDATA/frontend/index.html" "$ECOBANK/frontend/"
cp "$SATUDATA/backend/Dockerfile" "$ECOBANK/backend/"

echo "==> Bootstrap copy complete (read-only from SatuData)"
