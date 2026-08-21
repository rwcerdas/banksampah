// src/composables/usePwaUpdateBanner.js
import { ref } from 'vue'
import { registerSW } from 'virtual:pwa-register'

const needRefresh = ref(false)
const isReloading = ref(false)
const progress = ref(0)

// helper dari vite-plugin-pwa
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('[PWA] Versi baru tersedia, tampilkan banner')
    needRefresh.value = true
  },
  onOfflineReady() {
    console.log('[PWA] App siap digunakan secara offline')
  }
})

function closeBanner() {
  needRefresh.value = false
}

function reloadApp() {
  isReloading.value = true
  progress.value = 10
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Memuat ulang aplikasi untuk versi terbaru…' } }))
  updateSW(true)
  const step = setInterval(() => {
    progress.value = Math.min(100, progress.value + 15)
    if (progress.value >= 100) {
      clearInterval(step)
      try {
        location.reload()
      } catch (_) {}
    }
  }, 250)
}

export function usePwaUpdateBanner() {
  return {
    needRefresh,
    isReloading,
    progress,
    closeBanner,
    reloadApp,
    forceReload: () => reloadApp()
  }
}
