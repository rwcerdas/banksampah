<template>
  <div class="fixed inset-0 z-[9999] bg-red-500 flex flex-col items-center justify-center p-6 text-white text-center animate-in fade-in duration-300">
    <!-- Icon -->
    <div class="mb-6 bg-white/20 p-6 rounded-full backdrop-blur-sm">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-24 h-24 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="1" y1="1" x2="23" y2="23"></line>
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
        <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
        <line x1="12" y1="20" x2="12.01" y2="20"></line>
      </svg>
    </div>

    <!-- Main Text -->
    <h1 class="text-3xl font-black mb-2 tracking-tight uppercase drop-shadow-md">
      TIDAK ADA INTERNET
    </h1>

    <!-- Sub Text -->
    <p class="text-white/90 text-lg mb-8 max-w-xs leading-relaxed font-medium">
      Cek paket data atau WiFi HP Anda. Aplikasi butuh internet untuk bekerja.
    </p>

    <!-- Button -->
    <button 
      @click="reloadPage" 
      class="w-full max-w-xs bg-white text-red-600 font-extrabold text-lg py-4 rounded-xl shadow-xl hover:bg-gray-50 active:scale-95 transition transform"
    >
      COBA LAGI
    </button>
  </div>
</template>

<script setup>
function reloadPage() {
  window.location.reload();
}
</script>
