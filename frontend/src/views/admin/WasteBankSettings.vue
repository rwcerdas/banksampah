<template>
  <div class="waste-bank-settings">
    <div class="settings-header">
      <h1 class="page-title">⚙️ Pengaturan Bank Sampah</h1>
      <button @click="goToDashboard" class="btn-back">← Kembali ke Dashboard</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Memuat pengaturan...</p>
    </div>

    <!-- Settings Form -->
    <div v-else class="settings-content">
      <!-- Identitas Bank -->
      <div class="settings-card">
        <h2>Identitas Bank & Branding</h2>
        <p class="description">
          Mengatur logo, nama, dan tampilan aplikasi (sidebar, login, PWA install di HP).
        </p>

        <div class="form-group">
          <label>Logo Bank</label>
          <div class="image-upload-area" :class="{ 'has-image': logoUrl }">
            <input
              type="file"
              ref="logoInput"
              class="hidden-input"
              accept="image/png,image/jpeg,image/webp"
              @change="handleLogoUpload"
            />
            <div v-if="logoUrl" class="image-preview logo-preview">
              <img :src="getImgUrl(logoUrl)" alt="Logo Bank" />
              <button type="button" @click="removeLogo" class="btn-remove-image" title="Hapus Logo">
                <X :size="16" />
              </button>
            </div>
            <div v-else class="upload-placeholder" @click="triggerLogoInput">
              <div v-if="uploadingLogo" class="upload-spinner"></div>
              <div v-else class="upload-content">
                <UploadCloud :size="32" class="mb-2" />
                <span>Klik untuk upload logo</span>
                <small class="text-xs text-gray-500 mt-1">PNG/JPG, max 5MB. Disarankan 512×512 px untuk PWA.</small>
              </div>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="bankName">Nama Bank Sampah</label>
          <input id="bankName" v-model="bankName" type="text" class="form-control" placeholder="Bank Sampah RW 01" />
        </div>

        <div class="form-group">
          <label for="appShortName">Nama Singkat (PWA / ikon HP)</label>
          <input id="appShortName" v-model="appShortName" type="text" class="form-control" maxlength="12" placeholder="Maks 12 karakter" />
          <small class="helper-text">Tampil saat app di-install ke home screen HP.</small>
        </div>

        <div class="form-group">
          <label for="appTagline">Tagline / Subtitle</label>
          <input id="appTagline" v-model="appTagline" type="text" class="form-control" placeholder="Sistem Manajemen Bank Sampah" />
          <small class="helper-text">Tampil di halaman login di bawah nama bank.</small>
        </div>

        <div class="form-group">
          <label for="bankAddress">Alamat Bank</label>
          <textarea id="bankAddress" v-model="bankAddress" class="form-control" rows="2" placeholder="Alamat lengkap bank sampah" />
        </div>

        <div class="form-group">
          <label for="themeColor">Warna Tema (PWA)</label>
          <div class="flex items-center gap-3">
            <input id="themeColor" v-model="themeColor" type="color" class="h-10 w-14 rounded border border-gray-300 cursor-pointer" />
            <input v-model="themeColor" type="text" class="form-control max-w-[140px]" placeholder="#2563eb" />
          </div>
        </div>

        <div class="form-actions">
          <button type="button" @click="saveBranding" :disabled="savingBranding" class="btn-primary">
            <span v-if="!savingBranding">💾 Simpan Identitas & Branding</span>
            <span v-else><span class="spinner-small"></span> Menyimpan...</span>
          </button>
        </div>
      </div>

      <div class="settings-card">
        <h2>Markup Global</h2>
        <p class="description">
          Atur persentase markup yang akan diterapkan pada semua transaksi. 
          Markup ini adalah selisih antara harga dari pelapak dengan harga yang diterima nasabah.
        </p>

        <div class="form-group">
          <label for="markup">Markup Percentage (%)</label>
          <div class="input-with-suffix">
            <input 
              type="number" 
              id="markup" 
              v-model.number="markupPercentage"
              min="0"
              max="100"
              step="0.1"
              class="form-control"
              :disabled="saving"
            />
            <span class="suffix">%</span>
          </div>
          <small class="helper-text">
            Masukkan nilai antara 0 - 100. Contoh: Jika markup 10%, harga pelapak Rp 1,000 → nasabah dapat Rp 900.
          </small>
        </div>

        <div class="form-group">
          <label for="defaultCollector">Pengepul Default Form Penimbangan</label>
          <select 
            id="defaultCollector" 
            v-model="defaultCollector"
            class="form-control"
            :disabled="saving || loadingCollectors"
          >
            <option value="">(Tidak Ada Default - Pilih manual setiap transaksi)</option>
            <option v-for="c in collectors" :key="c._id" :value="c._id">
              {{ c.collectorName }}
            </option>
          </select>
          <small class="helper-text block mt-1">
            Pengepul ini akan terpilih secara otomatis saat membuka halaman <strong>Transaksi Baru</strong>.
          </small>
        </div>

        <!-- Preview Calculation -->
        <div v-if="markupPercentage > 0" class="preview-card">
          <h3>Preview Perhitungan</h3>
          <div class="calc-row">
            <span>Harga Pelapak:</span>
            <strong>Rp 1,000</strong>
          </div>
          <div class="calc-row markup-row">
            <span>Markup ({{ markupPercentage }}%):</span>
            <strong class="negative">- Rp {{ calculateMarkup(1000) }}</strong>
          </div>
          <div class="calc-row total-row">
            <span>Harga Nasabah:</span>
            <strong class="positive">Rp {{ calculateCustomerPrice(1000) }}</strong>
          </div>
        </div>

        <!-- Save Button -->
        <div class="form-actions">
          <button @click="saveSettings" :disabled="saving" class="btn-primary">
            <span v-if="!saving">💾 Simpan Pengaturan</span>
            <span v-else>
              <span class="spinner-small"></span> Menyimpan...
            </span>
          </button>
        </div>
      </div>

      <!-- Closing Book Card -->
      <div class="settings-card">
        <h2>Tutup Buku (Yearly Closing)</h2>
        <p class="description">
          Fitur ini akan mengakumulasi saldo akhir nasabah pada tahun yang dipilih menjadi 
          <strong>Saldo Awal</strong> untuk tahun berikutnya.
          <br>
          Contoh: Tutup Buku <strong>2024</strong> akan membuat transaksi "Saldo Awal 2025".
        </p>

        <div class="form-group">
          <label for="closingYear">Tahun Tutup Buku</label>
          <input 
            type="number" 
            id="closingYear" 
            v-model.number="closingYear"
            class="form-control"
            :disabled="processingClosing"
            placeholder="YYYY"
          />
        </div>

        <div class="form-actions">
          <button @click="handleClosing" :disabled="processingClosing || !closingYear" class="btn-danger">
            <span v-if="!processingClosing">🔒 Proses Tutup Buku</span>
            <span v-else>
              <span class="spinner-small"></span> Memproses...
            </span>
          </button>
        </div>
      </div>

      <!-- About Us Settings -->
      <div class="settings-card">
        <h2>Tentang Kami (Mobile App)</h2>
        <p class="description">
          Konten ini akan ditampilkan di menu <strong>Bantuan & Dukungan > Tentang Kami</strong> pada aplikasi mobile nasabah.
        </p>

        <div class="form-group">
          <label>Banner Image</label>
          <div class="image-upload-area" :class="{ 'has-image': aboutUsImage }">
            <input 
              type="file" 
              ref="fileInput" 
              class="hidden-input" 
              accept="image/*"
              @change="handleImageUpload"
            />
            
            
            <div v-if="aboutUsImage" class="image-preview">
                <img :src="getImgUrl(aboutUsImage)" alt="About Us Banner" />
                <button @click="removeImage" class="btn-remove-image" title="Hapus Gambar">
                    <X :size="16" />
                </button>
            </div>

            <div v-else class="upload-placeholder" @click="triggerFileInput">
                <div v-if="uploadingImage" class="upload-spinner"></div>
                <div v-else class="upload-content">
                    <UploadCloud :size="32" class="mb-2" />
                    <span>Klik untuk upload banner</span>
                    <small class="text-xs text-gray-500 mt-1">Max 5MB (JPG, PNG)</small>
                </div>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="aboutContent">Konten Deskripsi</label>
          <textarea 
            id="aboutContent" 
            v-model="aboutUsContent"
            class="form-control"
            rows="10"
            placeholder="Tulis deskripsi tentang bank sampah Anda di sini..."
          ></textarea>
          <small class="helper-text">
            Mendukung line break. Teks akan ditampilkan apa adanya.
          </small>
        </div>
        <div class="form-actions">
          <button @click="saveSettings" :disabled="saving" class="btn-primary">
            <span v-if="!saving">💾 Simpan Konten</span>
            <span v-else>
              <span class="spinner-small"></span> Menyimpan...
            </span>
          </button>
        </div>
      </div>

      <!-- Info Section -->
      <div class="info-card">
        <h3>ℹ️ Informasi Penting</h3>
        <ul>
          <li>Perubahan markup akan berlaku untuk <strong>transaksi baru</strong> setelah disimpan</li>
          <li>Transaksi yang sudah ada <strong>tidak akan terpengaruh</strong> oleh perubahan markup</li>
          <li>Markup 0% berarti harga nasabah = harga pelapak (tidak ada profit)</li>
          <li>Markup terlalu tinggi dapat mengurangi minat nasabah</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import bankService from '@/services/bankService';
import { apiUrl, getImgUrl } from '@/utils/apiUrl';
import { UploadCloud, X } from 'lucide-vue-next';
import Swal from 'sweetalert2';
import { confirmAction, confirmSave } from '@/utils/confirmDialog';
import { useBrandingStore } from '@/stores/brandingStore';

const router = useRouter();
const brandingStore = useBrandingStore();

// State
const loading = ref(false);
const saving = ref(false);
const savingBranding = ref(false);
const markupPercentage = ref(0);
const defaultCollector = ref('');
const aboutUsContent = ref('');
const aboutUsImage = ref('');
const uploadingImage = ref(false);
const fileInput = ref(null);

const bankName = ref('');
const bankAddress = ref('');
const logoUrl = ref('');
const appShortName = ref('');
const appTagline = ref('');
const themeColor = ref('#2563eb');
const uploadingLogo = ref(false);
const logoInput = ref(null);


const collectors = ref([]);
const loadingCollectors = ref(false);

// Load settings and master data
const loadSettings = async () => {
  loading.value = true;
  loadingCollectors.value = true;
  
  try {
    // Fetch master collectors
    const colRes = await bankService.getCollectors();
    collectors.value = colRes.data || [];

    const response = await bankService.getSettings();
    markupPercentage.value = response.data.globalMarkupPercentage || 0;
    
    // Convert legacy name to ID if needed
    let defCol = response.data.defaultCollector || '';
    if (defCol && !defCol.match(/^[0-9a-fA-F]{24}$/)) {
        // Assume it's a legacy string, try to map
        const mapped = collectors.value.find(c => c.collectorName.toLowerCase() === defCol.toLowerCase());
        if (mapped) defCol = mapped._id;
        else defCol = '';
    }
    defaultCollector.value = defCol;

    aboutUsContent.value = response.data.aboutUsContent || '';
    aboutUsImage.value = response.data.aboutUsImage || '';

    bankName.value = response.data.bank_name || '';
    bankAddress.value = response.data.bank_address || '';
    logoUrl.value = response.data.logo_url || '';
    appShortName.value = response.data.app_short_name || '';
    appTagline.value = response.data.app_tagline || '';
    themeColor.value = response.data.theme_color || '#2563eb';
  } catch (error) {
    console.error('Error loading settings or collectors:', error);
    alert('Gagal memuat pengaturan. Silakan coba lagi.');
  } finally {
    loading.value = false;
    loadingCollectors.value = false;
  }
};

const saveBranding = async () => {
  if (!bankName.value.trim()) {
    Swal.fire({ icon: 'warning', title: 'Validasi', text: 'Nama bank sampah wajib diisi' });
    return;
  }

  const ok = await confirmSave('menyimpan identitas dan branding bank');
  if (!ok) return;

  savingBranding.value = true;
  try {
    await bankService.updateSettings({
      bank_name: bankName.value.trim(),
      bank_address: bankAddress.value.trim(),
      logo_url: logoUrl.value,
      app_short_name: appShortName.value.trim() || bankName.value.trim().slice(0, 12),
      app_tagline: appTagline.value.trim(),
      theme_color: themeColor.value,
    });
    await brandingStore.refresh();
    Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Identitas bank berhasil disimpan!', timer: 2000, showConfirmButton: false });
  } catch (error) {
    console.error('Error saving branding:', error);
    Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.message || 'Gagal menyimpan identitas bank' });
  } finally {
    savingBranding.value = false;
  }
};

// Save settings
const saveSettings = async () => {
  if (markupPercentage.value < 0 || markupPercentage.value > 100) {
    Swal.fire({ icon: 'warning', title: 'Validasi', text: 'Markup percentage harus antara 0-100' });
    return;
  }

  const ok = await confirmSave('menyimpan pengaturan bank sampah');
  if (!ok) return;

  saving.value = true;
  
  try {
    await bankService.updateSettings({
      globalMarkupPercentage: markupPercentage.value,
      defaultCollector: defaultCollector.value,
      aboutUsContent: aboutUsContent.value,
      aboutUsImage: aboutUsImage.value
    });
    
    Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Pengaturan berhasil disimpan!', timer: 2000, showConfirmButton: false });
  } catch (error) {
    console.error('Error saving settings:', error);
    Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menyimpan pengaturan. Silakan coba lagi.' });
  } finally {
    saving.value = false;
  }
};

// Closing Book Logic
const closingYear = ref(new Date().getFullYear() - 1);
const processingClosing = ref(false);

const handleClosing = async () => {
  if (!closingYear.value) return;
  
  const ok = await confirmAction({
    title: 'Tutup Buku?',
    text: `PERINGATAN: Anda akan melakukan Tutup Buku untuk tahun ${closingYear.value}. Sistem akan menghitung saldo akhir semua nasabah per 31 Des ${closingYear.value} dan membuat transaksi Saldo Awal di 1 Jan ${closingYear.value + 1}. Lanjutkan?`,
    confirmText: 'Ya, Tutup Buku',
    icon: 'warning',
    danger: true,
  });
  if (!ok) return;

  processingClosing.value = true;
  try {
    const result = await bankService.closingBook(closingYear.value);
    Swal.fire({ icon: 'success', title: 'Berhasil', html: `${result.message}<br>Memproses ${result.data.processedCustomers} nasabah.` });
  } catch (error) {
    console.error('Closing error:', error);
    Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal tutup buku: ' + (error.response?.data?.message || error.message) });
  } finally {
    processingClosing.value = false;
  }
};

const triggerLogoInput = () => logoInput.value?.click();

const handleLogoUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    Swal.fire({ icon: 'warning', title: 'Validasi', text: 'Ukuran file maksimal 5MB' });
    return;
  }
  uploadingLogo.value = true;
  const formData = new FormData();
  formData.append('image', file);
  try {
    const response = await bankService.uploadSettingsImage(formData);
    logoUrl.value = response.url;
  } catch (error) {
    console.error('Logo upload failed:', error);
    Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal mengupload logo' });
  } finally {
    uploadingLogo.value = false;
    event.target.value = '';
  }
};

const removeLogo = () => {
  logoUrl.value = '';
};

// Image Upload Logic
const triggerFileInput = () => {
    fileInput.value.click();
};

const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB');
        return;
    }

    uploadingImage.value = true;
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await bankService.uploadSettingsImage(formData);
        aboutUsImage.value = response.url;
    } catch (error) {
        console.error('Upload failed:', error);
        alert('Gagal mengupload gambar');
    } finally {
        uploadingImage.value = false;
        // Reset input
        event.target.value = '';
    }
};

const removeImage = () => {
    aboutUsImage.value = '';
};

// Calculations
const calculateMarkup = (price) => {
  const markup = price * (markupPercentage.value / 100);
  return Math.round(markup).toLocaleString('id-ID');
};

const calculateCustomerPrice = (price) => {
  const customerPrice = price * (1 - markupPercentage.value / 100);
  return Math.round(customerPrice).toLocaleString('id-ID');
};

// Navigation
const goToDashboard = () => {
  router.push({ name: 'WasteBankDashboard' });
};

onMounted(() => {
  loadSettings();
});
</script>

<style scoped>
.waste-bank-settings {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.btn-back {
  padding: 10px 20px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #e2e8f0;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top-color: #22c55e;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-card,
.info-card {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.settings-card h2,
.info-card h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
}

.description {
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.input-with-suffix {
  position: relative;
  display: flex;
  align-items: center;
}

.form-control {
  flex: 1;
  padding: 12px 16px;
  padding-right: 50px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.form-control:disabled {
  background: #f8fafc;
  cursor: not-allowed;
}

.suffix {
  position: absolute;
  right: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #64748b;
}

.helper-text {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
}

.preview-card {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
}

.preview-card h3 {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin: 0 0 16px 0;
}

.calc-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
}

.calc-row.markup-row {
  color: #64748b;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  margin: 8px 0;
  padding: 12px 0;
}

.calc-row.total-row {
  font-size: 16px;
  font-weight: 600;
}

.calc-row .negative {
  color: #ef4444;
}

.calc-row .positive {
  color: #22c55e;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  padding: 12px 32px;
  background: #22c55e;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #16a34a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.btn-primary:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.spinner-small {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.info-card ul {
  margin: 0;
  padding-left: 20px;
}

.info-card li {
  color: #475569;
  font-size: 14px;
  line-height: 1.8;
  margin-bottom: 8px;
}

.info-card li strong {
  color: #1e293b;
}

.btn-danger {
  padding: 12px 32px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-danger:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}


.image-upload-area {
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
  background: #f8fafc;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-upload-area.has-image {
  border: none;
  background: transparent;
  padding: 0;
}

.hidden-input {
  display: none;
}

.upload-placeholder {
  width: 100%;
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
}

.upload-placeholder:hover {
  background: #f1f5f9;
  color: #22c55e;
  border-color: #22c55e;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.image-preview {
  position: relative;
  width: 100%;
}

.image-preview img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  max-height: 300px;
  object-fit: contain;
  background-color: #f8fafc;
}

.image-preview.logo-preview img {
  max-height: 160px;
  padding: 8px;
}

.btn-remove-image {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-remove-image:hover {
  background: rgba(239, 68, 68, 0.9);
  transform: scale(1.1);
}

.upload-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #22c55e;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

textarea.form-control {
  resize: vertical;
  min-height: 120px;
}
</style>
