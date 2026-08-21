<template>
  <div class="w-full max-w-md mx-auto p-8 rounded-2xl shadow-xl bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700">
    <div class="text-center mb-8">
      <div class="w-16 h-16 mx-auto mb-4 rounded-2xl overflow-hidden shadow-lg shadow-blue-500/20 bg-white flex items-center justify-center">
        <img
          v-if="brandingStore.logoSrc"
          :src="brandingStore.logoSrc"
          alt="Logo"
          class="w-full h-full object-contain p-1"
        />
        <div v-else class="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
          {{ brandingStore.initials }}
        </div>
      </div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ brandingStore.displayName }}</h1>
      <p class="text-sm text-gray-500 mt-1">{{ brandingStore.tagline }}</p>
    </div>

    <form @submit.prevent="doLogin" class="space-y-4">
      <div>
        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Username</label>
        <input v-model="username" type="text" required class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Username admin / nasabah" />
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Password</label>
        <input v-model="password" type="password" required class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <button type="submit" :disabled="loading" class="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold disabled:opacity-60 shadow-lg shadow-blue-500/20">
        {{ loading ? 'Memproses...' : 'Masuk' }}
      </button>
      <p v-if="msg" class="text-sm text-red-600 text-center">{{ msg }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import { useBrandingStore } from '@/stores/brandingStore';

const router = useRouter();
const userStore = useUserStore();
const brandingStore = useBrandingStore();
const username = ref('');
const password = ref('');
const loading = ref(false);
const msg = ref('');

async function doLogin() {
  loading.value = true;
  msg.value = '';
  try {
    const data = await userStore.login(username.value, password.value);
    if (data.user?.mustChangePassword) {
      router.push('/force-change-password');
      return;
    }
    router.push(data.user?.role === 'nasabah' ? '/nasabah' : '/admin/dashboard');
  } catch (err) {
    msg.value = err.message || 'Login gagal';
  } finally {
    loading.value = false;
  }
}
</script>
