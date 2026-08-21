<template>
  <button
    type="button"
    @click="themeStore.toggleTheme"
    :class="[
      neumorphic
        ? 'theme-toggle-neu'
        : 'p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition',
    ]"
    :title="themeStore.isDarkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'"
  >
    <transition name="fade-fast" mode="out-in">
      <Sun v-if="themeStore.isDarkMode" class="w-[18px] h-[18px] text-yellow-400" />
      <Moon v-else class="w-[18px] h-[18px] text-gray-600 dark:text-slate-300" />
    </transition>
  </button>
</template>

<script setup>
import { useThemeStore } from '@/stores/themeStore';
import { Sun, Moon } from 'lucide-vue-next';

defineProps({
  neumorphic: {
    type: Boolean,
    default: false,
  },
});

const themeStore = useThemeStore();
</script>

<style scoped>
.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity 0.15s ease;
}

.fade-fast-enter-from,
.fade-fast-leave-to {
  opacity: 0;
}

@media (max-width: 767px) {
  .theme-toggle-neu {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.875rem;
    border: none;
    background: var(--neu-surface, #e8edf3);
    box-shadow: var(--neu-flat, 5px 5px 10px #c8d0dc, -5px -5px 10px #ffffff);
    cursor: pointer;
    transition: box-shadow 0.18s ease, transform 0.18s ease;
  }

  .theme-toggle-neu:active {
    box-shadow: var(--neu-pressed, inset 4px 4px 8px #c8d0dc, inset -4px -4px 8px #ffffff);
    transform: scale(0.96);
  }
}
</style>
