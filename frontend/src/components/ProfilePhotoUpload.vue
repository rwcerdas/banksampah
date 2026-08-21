<template>
  <div class="flex flex-col items-center">
    <div class="relative" :class="sizes.avatar">
      <div
        class="w-full h-full rounded-full overflow-hidden flex items-center justify-center shadow-md border-4 border-white dark:border-gray-800 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold relative"
        :class="sizes.text"
      >
        <img
          v-if="photoUrl"
          :src="photoUrl"
          alt="Foto profil"
          class="w-full h-full object-cover"
        />
        <span v-else>{{ initials }}</span>

        <div
          v-if="isUploading"
          class="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white text-[10px] gap-1"
        >
          <Loader2 class="w-5 h-5 animate-spin" />
          <span>Mengunggah...</span>
        </div>
      </div>

      <button
        v-if="editable"
        type="button"
        @click="triggerFileInput"
        :disabled="isUploading"
        title="Ubah Foto Profil"
        :class="[
          'absolute bottom-0 right-0 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-800 transition cursor-pointer disabled:opacity-50',
          sizes.cam,
        ]"
      >
        <Camera class="w-4 h-4" />
      </button>

      <input
        ref="fileInputRef"
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        class="hidden"
        @change="handlePhotoUpload"
      />
    </div>

    <button
      v-if="editable && showDelete && photoUrl && !isUploading"
      type="button"
      @click="handleRemovePhoto"
      class="mt-2 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-medium hover:underline flex items-center gap-1"
    >
      <Trash2 class="w-3.5 h-3.5" />
      Hapus Foto
    </button>

    <p v-if="editable && showHint" class="text-[11px] text-gray-400 dark:text-gray-500 mt-2 text-center">
      Format: JPG, PNG, WEBP (Max 5MB)
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Camera, Loader2, Trash2 } from 'lucide-vue-next';
import { useUserStore } from '@/stores/userStore';
import api from '@/utils/api';
import { apiUrl, getImgUrl } from '@/utils/apiUrl';

const props = defineProps({
  displayName: { type: String, default: '' },
  size: { type: String, default: 'md' },
  editable: { type: Boolean, default: true },
  showHint: { type: Boolean, default: true },
  showDelete: { type: Boolean, default: true },
});

const emit = defineEmits(['uploaded', 'removed', 'error']);

const userStore = useUserStore();
const fileInputRef = ref(null);
const isUploading = ref(false);

const sizeMap = {
  sm: { avatar: 'w-20 h-20', icon: 'w-8 h-8', cam: 'w-7 h-7', text: 'text-lg' },
  md: { avatar: 'w-24 h-24', icon: 'w-10 h-10', cam: 'w-8 h-8', text: 'text-2xl' },
  lg: { avatar: 'w-28 h-28', icon: 'w-14 h-14', cam: 'w-9 h-9', text: 'text-3xl' },
};

const sizes = computed(() => sizeMap[props.size] || sizeMap.md);

const initials = computed(() => {
  const name = props.displayName || userStore.namaLengkap || userStore.username || 'U';
  return name.trim().charAt(0).toUpperCase();
});

const photoUrl = computed(() => {
  const url = userStore.user?.foto_url;
  return url ? getImgUrl(url) : '';
});

onMounted(async () => {
  if (userStore.token && !userStore.user?.foto_url) {
    try {
      await userStore.fetchProfile();
    } catch {
      // ignore
    }
  }
});

function triggerFileInput() {
  fileInputRef.value?.click();
}

async function handlePhotoUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    emit('error', 'Ukuran foto maksimal 5 MB');
    event.target.value = '';
    return;
  }

  const formData = new FormData();
  formData.append('foto', file);

  isUploading.value = true;
  try {
    const { data } = await api.post(apiUrl('auth/profile-photo'), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (data.foto_url) {
      userStore.updateProfilePhoto(data.foto_url);
      emit('uploaded', data.foto_url);
    }
  } catch (err) {
    const errMsg = err.response?.data?.message || err.message || 'Gagal mengunggah foto profil';
    emit('error', errMsg);
  } finally {
    isUploading.value = false;
    if (event.target) event.target.value = '';
  }
}

async function handleRemovePhoto() {
  if (!confirm('Apakah Anda yakin ingin menghapus foto profil?')) return;

  isUploading.value = true;
  try {
    await api.delete(apiUrl('auth/profile-photo'));
    userStore.updateProfilePhoto(null);
    emit('removed');
  } catch (err) {
    emit('error', 'Gagal menghapus foto profil');
  } finally {
    isUploading.value = false;
  }
}
</script>
