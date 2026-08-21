<template>
  <div class="education-page">
    <div class="page-header">
      <h1 class="page-title flex items-center gap-2.5">
        <BookOpen class="w-7 h-7 text-emerald-600 shrink-0" />
        Edukasi & Berita
      </h1>
      <button @click="openModal()" class="btn-primary flex items-center gap-2">
        <Plus class="w-4 h-4" />
        Buat Artikel Baru
      </button>
    </div>

    <!-- Articles Table -->
    <div class="card">
      <div v-if="loading" class="p-8 text-center">
        <div class="spinner mx-auto"></div>
        <p class="mt-2 text-gray-500">Memuat data...</p>
      </div>

      <div v-else class="table-container">
        <table class="w-full">
          <thead>
            <tr>
              <th class="text-left p-4">Judul</th>
              <th class="text-left p-4">Kategori</th>
              <th class="text-left p-4">Status</th>
              <th class="text-left p-4">Tanggal</th>
              <th class="text-right p-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="article in articles" :key="article._id" class="border-b hover:bg-gray-50">
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <img 
                    v-if="article.imageUrl" 
                    :src="getSafeImgUrl(article.imageUrl)" 
                    class="w-10 h-10 rounded object-cover bg-gray-100"
                    alt="Cover"
                  />
                  <div class="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400" v-else>
                    <ImageIcon class="w-5 h-5" />
                  </div>
                  <span class="font-medium text-gray-800">{{ article.title }}</span>
                </div>
              </td>
              <td class="p-4">
                <span class="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">
                  {{ article.category }}
                </span>
              </td>
              <td class="p-4">
                <span 
                  class="px-2 py-1 rounded text-xs font-bold"
                  :class="article.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'"
                >
                  {{ article.status }}
                </span>
              </td>
              <td class="p-4 text-sm text-gray-500">
                {{ formatDate(article.createdAt) }}
              </td>
              <td class="p-4 text-right space-x-2">
                <button @click="openModal(article)" class="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
                <button @click="confirmDelete(article)" class="text-red-600 hover:text-red-800 text-sm font-medium">Hapus</button>
              </td>
            </tr>
            <tr v-if="articles.length === 0">
              <td colspan="5" class="p-8 text-center text-gray-500">
                Belum ada artikel. Silakan buat baru!
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div class="p-6 border-b flex justify-between items-center">
          <h2 class="text-xl font-bold">{{ isEditing ? 'Edit Artikel' : 'Buat Artikel Baru' }}</h2>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <form @submit.prevent="saveArticle" class="p-6 space-y-4">
          <!-- Title -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Judul Artikel</label>
            <input 
              v-model="form.title" 
              type="text" 
              required
              class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
              placeholder="Contoh: Manfaat Memilah Sampah Plastik"
            />
          </div>

          <!-- Category & Status -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select 
                v-model="form.category"
                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="NEWS">Berita</option>
                <option value="TIPS">Tips & Trik</option>
                <option value="ANNOUNCEMENT">Pengumuman</option>
              </select>
            </div>
             <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                v-model="form.status"
                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="PUBLISHED">Published (Tayang)</option>
                <option value="DRAFT">Draft (Simpan)</option>
              </select>
            </div>
          </div>

          <!-- Image Upload -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Gambar Artikel</label>
            
            <div class="flex items-start gap-4">
              <!-- Preview -->
              <div v-if="form.imageUrl" class="relative group w-32 h-32 rounded-lg overflow-hidden border">
                <img :src="getSafeImgUrl(form.imageUrl)" class="w-full h-full object-cover bg-gray-50" />
                <button 
                  type="button"
                  @click="form.imageUrl = ''"
                  class="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm"
                  title="Hapus Gambar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              <!-- Upload Button -->
              <div class="flex-1">
                <input 
                  type="file" 
                  ref="fileInput" 
                  accept="image/*" 
                  class="hidden" 
                  @change="handleFileChange"
                />
                <button 
                  type="button" 
                  @click="triggerFileInput"
                  :disabled="uploadingImage"
                  class="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                >
                  <Upload v-if="!uploadingImage" class="w-4 h-4" />
                  <span v-else class="spinner-sm border-gray-500 border-t-transparent mr-1"></span>
                  {{ uploadingImage ? 'Mengupload...' : 'Upload Gambar Baru' }}
                </button>
                <p class="text-xs text-gray-500 mt-2">
                  Format: JPG, PNG, WEBP. Maks 5MB. <br>
                  Atau gunakan URL eksternal di bawah ini.
                </p>
                
                <input 
                  v-model="form.imageUrl" 
                  type="text" 
                  class="w-full mt-2 px-3 py-1.5 border rounded text-xs text-gray-600 focus:outline-none focus:border-green-500"
                  placeholder="Atau tempel URL gambar di sini..."
                />
              </div>
            </div>
          </div>

          <!-- Background Image & Theme Color -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Background Image Upload -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Background Card (Opsional)</label>
              <div class="flex items-start gap-3">
                <div v-if="form.backgroundImageUrl" class="relative group w-24 h-16 rounded-lg overflow-hidden border shrink-0">
                  <img :src="getSafeImgUrl(form.backgroundImageUrl)" class="w-full h-full object-cover bg-gray-50" />
                  <button type="button" @click="form.backgroundImageUrl = ''" class="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm"><X class="w-3 h-3" /></button>
                </div>
                <div class="flex-1">
                   <button type="button" @click="triggerBackgroundInput" :disabled="uploadingBackground" class="w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:bg-gray-50 text-left truncate">
                      {{ uploadingBackground ? 'Mengupload...' : (form.backgroundImageUrl ? 'Ganti Gambar' : 'Upload Gambar') }}
                   </button>
                   <input type="file" ref="bgInput" accept="image/*" class="hidden" @change="handleBackgroundFileChange" />
                </div>
                <input 
                  v-model="form.backgroundImageUrl" 
                  type="text" 
                  class="w-full mt-2 px-3 py-1.5 border rounded text-xs text-gray-600 focus:outline-none focus:border-green-500"
                  placeholder="Atau tempel URL background di sini..."
                />
              </div>
            </div>

            <!-- Theme Color Selection (Validation: Only if no BG image usually, but can exist as fallback) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tema Warna (Fallback)</label>
              <div class="flex gap-2 flex-wrap">
                 <button 
                    v-for="color in themeColors" 
                    :key="color.value"
                    type="button"
                    @click="form.themeColor = color.value"
                    class="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 relative"
                    :class="[color.bgClass, form.themeColor === color.value ? 'border-gray-600 scale-110 shadow-md ring-2 ring-offset-2 ring-gray-300' : 'border-transparent']"
                    :title="color.label"
                 >
                    <Check v-if="form.themeColor === color.value" class="w-4 h-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-md" />
                 </button>
              </div>
              <p class="text-[10px] text-gray-500 mt-1">Dipakai jika tidak ada background image.</p>
            </div>
          </div>

          <!-- Content -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Isi Artikel</label>
            <textarea 
              v-model="form.content" 
              required
              rows="8"
              class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="Tulis isi artikel di sini..."
            ></textarea>
            <p class="text-xs text-gray-500 mt-1">Tips: Gunakan enter untuk paragraf baru.</p>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t mt-6">
            <button type="button" @click="closeModal" class="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">
              Batal
            </button>
            <button type="submit" :disabled="saving" class="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
              <span v-if="saving" class="spinner-sm"></span>
              {{ saving ? 'Menyimpan...' : 'Simpan Artikel' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Upload, Image as ImageIcon, Check, X, BookOpen, Plus } from 'lucide-vue-next';
import bankService from '@/services/bankService';
import { getImgUrl } from '@/utils/apiUrl';
import Swal from 'sweetalert2';
import { confirmSave } from '@/utils/confirmDialog';

// State
const articles = ref([]);
const loading = ref(true);
const showModal = ref(false);
const saving = ref(false);
const uploadingImage = ref(false);
const uploadingBackground = ref(false);
const isEditing = ref(false);
const fileInput = ref(null);
const bgInput = ref(null);

const themeColors = [
    { value: 'blue', label: 'Biru (Default)', bgClass: 'bg-gradient-to-br from-blue-600 to-blue-800' },
    { value: 'green', label: 'Hijau', bgClass: 'bg-gradient-to-br from-green-600 to-green-800' },
    { value: 'purple', label: 'Ungu', bgClass: 'bg-gradient-to-br from-purple-600 to-purple-800' },
    { value: 'orange', label: 'Oranye', bgClass: 'bg-gradient-to-br from-orange-500 to-red-600' },
    { value: 'dark', label: 'Gelap', bgClass: 'bg-gradient-to-br from-gray-700 to-gray-900' },
];

const form = ref({
  id: null,
  title: '',
  category: 'NEWS',
  status: 'PUBLISHED',
  imageUrl: '',
  backgroundImageUrl: '',
  themeColor: 'blue',
  content: ''
});

// Load Data
const loadArticles = async () => {
  loading.value = true;
  try {
    const res = await bankService.getEducationArticles({ limit: 50 });
    articles.value = res.data; // adjust if paginated response structure differs
  } catch (error) {
    console.error('Error loading articles:', error);
    Swal.fire('Error', 'Gagal memuat artikel', 'error');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadArticles();
});

// Modal Logic
const openModal = (article = null) => {
  if (article) {
    isEditing.value = true;
    form.value = { 
      id: article._id,
      title: article.title,
      category: article.category,
      status: article.status,
      imageUrl: article.imageUrl,
      backgroundImageUrl: article.backgroundImageUrl,
      themeColor: article.themeColor || 'blue',
      content: article.content
    };
  } else {
    isEditing.value = false;
    form.value = {
      id: null,
      title: '',
      category: 'NEWS',
      status: 'PUBLISHED',
      imageUrl: '',
      backgroundImageUrl: '',
      themeColor: 'blue',
      content: ''
    };
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

// File Upload Logic
const triggerFileInput = () => {
  fileInput.value.click();
};

const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Basic validation
  if (file.size > 5 * 1024 * 1024) {
    Swal.fire('Error', 'Ukuran file maks 5MB', 'error');
    return;
  }

  uploadingImage.value = true;
  try {
    const formData = new FormData();
    formData.append('image', file);

    const res = await bankService.uploadEducationImage(formData);
    
    // Save relative path directly
    form.value.imageUrl = res.url;

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Gambar berhasil diupload',
      showConfirmButton: false,
      timer: 1500
    });
  } catch (error) {
    console.error('Upload error:', error);
    Swal.fire('Error', 'Gagal mengupload gambar', 'error');
  } finally {
    uploadingImage.value = false;
    // Reset input
    if (fileInput.value) fileInput.value.value = '';
  }
};

const triggerBackgroundInput = () => {
    bgInput.value.click();
};

const handleBackgroundFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    Swal.fire('Error', 'Ukuran file maks 5MB', 'error');
    return;
  }

  uploadingBackground.value = true;
  try {
    const formData = new FormData();
    formData.append('image', file);
    const res = await bankService.uploadEducationImage(formData);
    form.value.backgroundImageUrl = res.url;
    
    Swal.fire({
      toast: true, title: 'Background berhasil diupload', icon: 'success', position: 'top-end', showConfirmButton: false, timer: 1500
    });
  } catch (error) {
    console.error('Upload bg error:', error);
    Swal.fire('Error', 'Gagal upload background', 'error');
  } finally {
    uploadingBackground.value = false;
    if (bgInput.value) bgInput.value.value = '';
  }
};

// CRUD Operations
const saveArticle = async () => {
  const label = isEditing.value ? 'memperbarui artikel edukasi' : 'menyimpan artikel edukasi baru';
  const ok = await confirmSave(label);
  if (!ok) return;

  saving.value = true;
  try {
    if (isEditing.value) {
      await bankService.updateEducationArticle(form.value.id, form.value);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Artikel berhasil diperbarui',
        showConfirmButton: false,
        timer: 1500
      });
    } else {
      await bankService.createEducationArticle(form.value);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Artikel berhasil dibuat',
        showConfirmButton: false,
        timer: 1500
      });
    }
    closeModal();
    loadArticles();
  } catch (error) {
    console.error('Error saving article:', error);
    Swal.fire('Error', 'Gagal menyimpan artikel', 'error');
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async (article) => {
  const result = await Swal.fire({
    title: 'Hapus Artikel?',
    text: `Anda yakin ingin menghapus "${article.title}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal'
  });

  if (result.isConfirmed) {
    try {
      await bankService.deleteEducationArticle(article._id);
      Swal.fire('Terhapus!', 'Artikel telah dihapus.', 'success');
      loadArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      Swal.fire('Error', 'Gagal menghapus artikel', 'error');
    }
  }
};

// Helper
const getSafeImgUrl = (url) => {
  if (!url) return '';
  const cleanUrl = url.replace(/^https?:\/\/localhost:300[01]/, '');
  return getImgUrl(cleanUrl);
};

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.btn-primary {
  background-color: #22c55e;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-primary:hover {
  background-color: #16a34a;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top-color: #22c55e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
