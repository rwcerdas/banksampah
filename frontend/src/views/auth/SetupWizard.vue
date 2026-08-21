<template>
  <div class="w-full max-w-lg mx-auto p-8 rounded-2xl shadow-xl bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700">
    <div class="text-center mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Setup Awal Bank Sampah</h1>
      <p class="text-sm text-gray-500 mt-2">Konfigurasi awal bank sampah Anda</p>
    </div>

    <form @submit.prevent="submit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-1">Nama Bank Sampah *</label>
        <input v-model="form.bankName" required class="w-full px-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-600" placeholder="Bank Sampah RW 01" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Alamat</label>
        <input v-model="form.bankAddress" class="w-full px-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-600" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Markup Pengurus (%)</label>
        <input v-model.number="form.markupPercentage" type="number" min="0" max="50" class="w-full px-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-600" />
      </div>
      <hr class="border-gray-200 dark:border-gray-700" />
      <div>
        <label class="block text-sm font-medium mb-1">Nama Admin *</label>
        <input v-model="form.adminFullName" class="w-full px-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-600" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Username Admin *</label>
        <input v-model="form.adminUsername" required class="w-full px-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-600" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Password Admin *</label>
        <input v-model="form.adminPassword" type="password" required minlength="8" class="w-full px-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-600" />
      </div>
      <button type="submit" :disabled="loading" class="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold disabled:opacity-60 shadow-lg shadow-blue-500/20">
        {{ loading ? 'Menyimpan...' : 'Selesai & Login' }}
      </button>
      <p v-if="error" class="text-sm text-red-600 text-center">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/utils/api';
import { useBrandingStore } from '@/stores/brandingStore';

const router = useRouter();
const brandingStore = useBrandingStore();
const loading = ref(false);
const error = ref('');
const form = ref({
  bankName: '',
  bankAddress: '',
  markupPercentage: 10,
  adminFullName: 'Administrator',
  adminUsername: '',
  adminPassword: '',
});

async function submit() {
  loading.value = true;
  error.value = '';
  try {
    await api.post('/api/setup/initialize', form.value);
    await brandingStore.refresh();
    router.push('/login');
  } catch (err) {
    error.value = err.response?.data?.message || 'Setup gagal';
  } finally {
    loading.value = false;
  }
}
</script>
