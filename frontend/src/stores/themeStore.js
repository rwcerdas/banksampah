import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useThemeStore = defineStore('theme', () => {
  // State: Cek localStorage atau default ke mode terang (false)
  const isDarkMode = ref(JSON.parse(localStorage.getItem('isDarkMode') || 'false'));

  // Fungsi untuk menerapkan kelas ke elemen <html>
  function applyTheme(isDark) {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  // Aksi untuk mengubah tema
  function toggleTheme() {
    isDarkMode.value = !isDarkMode.value;
    applyTheme(isDarkMode.value);
  }

  // Aksi untuk inisialisasi tema saat aplikasi dimuat
  function initTheme() {
    applyTheme(isDarkMode.value);
  }

  // Watcher: Setiap kali isDarkMode berubah, simpan ke localStorage dan terapkan tema
  watch(isDarkMode, (newVal) => {
    localStorage.setItem('isDarkMode', JSON.stringify(newVal));
    applyTheme(newVal);
  });

  return {
    isDarkMode,
    toggleTheme,
    initTheme,
  };
});