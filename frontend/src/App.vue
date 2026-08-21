<template>
  <div v-if="isLoaded" class="min-h-dvh bg-slate-100 dark:bg-black text-gray-800 dark:text-white flex flex-col">
    <OfflineBlocker v-if="isOffline" />
    <RouterView />
    <PwaUpdateBanner />
    <ToastContainer />
  </div>
  <div v-else class="flex items-center justify-center min-h-dvh text-gray-500">
    <span class="animate-pulse">Memuat tampilan...</span>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { RouterView } from 'vue-router';
import { jwtDecode } from 'jwt-decode';
import { useThemeStore } from '@/stores/themeStore';
import PwaUpdateBanner from './components/PwaUpdateBanner.vue';
import OfflineBlocker from './components/OfflineBlocker.vue';
import ToastContainer from './components/ui/ToastContainer.vue';
import { usePwaInstall } from '@/composables/usePwaInstall';

const isLoaded = ref(false);
const isOffline = ref(typeof navigator !== 'undefined' ? !navigator.onLine : false);

function loadFromToken() {
  const token = localStorage.getItem('token');
  if (!token) {
    isLoaded.value = true;
    return;
  }
  try {
    jwtDecode(token);
  } catch (err) {
    console.error('JWT decode error:', err);
  } finally {
    isLoaded.value = true;
  }
}

function updateNetworkStatus() {
  isOffline.value = !navigator.onLine;
}

loadFromToken();

const themeStore = useThemeStore();
themeStore.initTheme();

onMounted(() => {
  const { initPwaListener } = usePwaInstall();
  initPwaListener();
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
});

onBeforeUnmount(() => {
  window.removeEventListener('online', updateNetworkStatus);
  window.removeEventListener('offline', updateNetworkStatus);
});
</script>
