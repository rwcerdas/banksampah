<template>
  <div class="h-dvh flex flex-col overflow-hidden bg-slate-100 dark:bg-black">
    <header class="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between pt-safe">
      <div class="flex items-center gap-3 min-w-0">
        <img v-if="brandingStore.logoSrc" :src="brandingStore.logoSrc" alt="Logo" class="w-10 h-10 object-contain rounded-lg" />
        <div v-else class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
          {{ brandingStore.initials }}
        </div>
        <div class="min-w-0">
          <h1 class="text-sm font-bold text-gray-900 dark:text-white truncate">{{ brandingStore.displayName }}</h1>
          <p v-if="brandingStore.bank_address" class="text-[10px] text-gray-500 truncate">{{ brandingStore.bank_address }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <ThemeToggle />
        <NotificationBell />
      </div>
    </header>
    <main class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-nav-mobile scroll-smooth">
      <router-view v-slot="{ Component }">
        <transition name="slide-fade" mode="out-in">
          <component :is="Component" :key="$route.path" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import ThemeToggle from '@/components/ThemeToggle.vue';
import NotificationBell from '@/components/notifications/NotificationBell.vue';
import { useBrandingStore } from '@/stores/brandingStore';

const brandingStore = useBrandingStore();
</script>
