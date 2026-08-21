<template>
  <transition name="fade">
    <div v-if="show" class="fixed inset-0 flex items-center justify-center bg-black/50 z-50" @click.self="!preventClose && $emit('close')">
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <h3 class="text-lg font-bold mb-4 text-gray-800 dark:text-gray-200">
          {{ preventClose ? 'Wajib Ganti Password' : 'Ganti Password' }}
        </h3>
        <p v-if="preventClose" class="text-sm text-red-600 dark:text-red-400 mb-4">
          Anda harus mengganti password default dengan password baru yang lebih aman untuk melanjutkan.
        </p>
        <form @submit.prevent="submitChangePassword">
          <div class="space-y-4">
            <div>
              <label for="currentPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Password Saat Ini</label>
              <input
                id="currentPassword"
                v-model="form.currentPassword"
                type="password"
                class="mt-1 w-full border dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label for="newPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Password Baru</label>
              <input
                id="newPassword"
                v-model="form.newPassword"
                type="password"
                class="mt-1 w-full border dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Konfirmasi Password Baru</label>
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                type="password"
                class="mt-1 w-full border dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
              <p v-if="passwordMismatch" class="text-red-500 text-xs mt-1">Password baru tidak cocok.</p>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button v-if="!preventClose" type="button" @click="$emit('close')" class="px-4 py-2 border dark:border-slate-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
              Batal
            </button>
            <button
              type="submit"
              :disabled="loading || passwordMismatch || !isFormValid"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              <span v-if="loading">Menyimpan...</span>
              <span v-else>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed } from 'vue';
import api from '@/utils/api';
import { useToast } from '@/composables/useToast';

const props = defineProps({
  show: Boolean,
  preventClose: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);
const { showToast } = useToast();

const form = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});
const loading = ref(false);

const passwordMismatch = computed(() => {
  return form.value.newPassword && form.value.confirmPassword && form.value.newPassword !== form.value.confirmPassword;
});

const isFormValid = computed(() => {
  return form.value.currentPassword && form.value.newPassword && form.value.confirmPassword;
});

async function submitChangePassword() {
  if (passwordMismatch.value || !isFormValid.value) return;

  loading.value = true;
  try {
    const response = await api.put('/api/auth/change-password', {
      currentPassword: form.value.currentPassword,
      newPassword: form.value.newPassword,
    });
    showToast(response.data.message, 'success');
    emit('close');
    
    // Jika sedang force change password, reload halaman agar state auth ter-refresh
    if (props.preventClose) {
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  } catch (err) {
    showToast(err.response?.data?.message || 'Gagal mengubah password.', 'error');
  } finally {
    loading.value = false;
    // Reset form
    form.value.currentPassword = '';
    form.value.newPassword = '';
    form.value.confirmPassword = '';
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>