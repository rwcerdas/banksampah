<script setup>
import { usePwaUpdateBanner } from '../composables/usePwaUpdateBanner'

const { needRefresh, closeBanner, reloadApp, isReloading, progress } = usePwaUpdateBanner()
</script>

<template>
  <Transition name="slide-fade">
    <div
      v-if="needRefresh"
      class="fixed bottom-4 inset-x-0 z-[80] flex justify-center px-4 pointer-events-none"
    >
      <div
        class="pointer-events-auto max-w-md w-full bg-slate-900 text-slate-50 dark:bg-slate-900/95 border border-slate-700/70 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3"
      >
        <div class="flex-1">
          <p class="text-sm font-medium">
            Versi baru EcoBank RW09 tersedia.
          </p>
          <p class="text-xs text-slate-300 mt-0.5 hidden sm:block">
            Klik <span class="font-semibold">Muat ulang</span> untuk menggunakan versi terbaru aplikasi.
          </p>
        </div>

        <button
          type="button"
          class="text-xs font-semibold px-3 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          @click="reloadApp"
        >
          Muat ulang
        </button>

        <button
          type="button"
          class="text-xs text-slate-300 hover:text-white focus:outline-none"
          @click="closeBanner"
          aria-label="Tutup"
        >
          Nanti
        </button>
      </div>
    </div>
  </Transition>
  <div v-if="isReloading" class="fixed bottom-0 left-0 right-0 z-[85]">
    <div class="h-1 bg-slate-700/30">
      <div class="h-1 bg-emerald-500" :style="{ width: progress + '%' }"></div>
    </div>
  </div>
</template>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s ease-out;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
