<template>
  <div class="min-h-screen bg-white dark:bg-gray-900 pb-10">
    <!-- Header -->
    <div class="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div class="max-w-md mx-auto px-4 h-16 flex items-center gap-3">
        <button @click="goBack" class="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ChevronLeft class="w-6 h-6 text-gray-700 dark:text-gray-200" />
        </button>
        <h1 class="text-lg font-bold text-gray-900 dark:text-white">Tentang Kami</h1>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-md mx-auto">
        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center py-20">
            <Loader2 class="w-8 h-8 text-green-600 animate-spin" />
        </div>

        <div v-else>
            <!-- Banner Image -->
            <div v-if="aboutUsImage" class="w-full h-64 relative">
                <img :src="getImgUrl(aboutUsImage)" class="w-full h-full object-cover" alt="About Us" />
                <div class="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-900 via-transparent to-transparent"></div>
            </div>
            
            <!-- Fallback Banner if no image -->
            <div v-else class="w-full h-56 bg-gradient-to-br from-green-500 to-teal-700 flex items-center justify-center relative overflow-hidden">
                <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div class="absolute bottom-0 left-0 w-32 h-32 bg-yellow-400/20 rounded-full -ml-10 -mb-10 blur-2xl"></div>
                <h1 class="text-4xl font-bold text-white relative z-10">EcoBank</h1>
            </div>

            <!-- Text Content -->
            <div class="px-6 py-6 space-y-6">
                <!-- Title/Brand (Optional) -->
                <div class="flex items-center gap-3 mb-2">
                    <div class="bg-green-100 dark:bg-green-900/50 p-2 rounded-xl">
                         <img src="//assets/ecobank-logo.png" class="w-8 h-8 object-contain" alt="Logo" />
                    </div>
                    <div>
                        <h2 class="font-bold text-xl text-gray-900 dark:text-white leading-none">Bank Sampah</h2>
                        <span class="text-sm text-green-600 dark:text-green-400 font-medium">GAS BERLIN</span>
                    </div>
                </div>

                <div v-if="aboutUsContent" class="prose dark:prose-invert max-w-none">
                    <p class="whitespace-pre-line text-gray-600 dark:text-gray-300 leading-relaxed text-base text-justify">
                        {{ aboutUsContent }}
                    </p>
                </div>
                
                <div v-else class="text-center py-10 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                    <Info class="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Belum ada informasi tentang kami.</p>
                </div>

                <!-- Footer / Version -->
                 <div class="pt-8 text-center border-t border-gray-100 dark:border-gray-800 mt-8">
                    <p class="text-xs text-gray-400 font-medium">Version 1.2.0 Build 2026</p>
                    <p class="text-[10px] text-gray-400/60 mt-1">© 2026 EcoBank Eco-System</p>
                </div>
            </div>
        </div>
    </div>

    <!-- ========================================== -->
    <!-- BOTTOM NAVIGATION BAR (Replicated)         -->
    <!-- ========================================== -->
    <div class="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 px-6 py-3 flex justify-around items-center z-50">
        <button 
          @click="router.push('/admin/dashboard?tab=home')"
          class="flex flex-col items-center gap-1 transition-all duration-300 text-gray-400 hover:text-gray-600"
        >
            <div class="p-1.5 rounded-xl transition-colors">
                <Home class="w-6 h-6" />
            </div>
            <span class="text-[10px] font-medium">Beranda</span>
        </button>

        <button 
          @click="router.push('/admin/dashboard?tab=tracker')"
          class="flex flex-col items-center gap-1 transition-all duration-300 text-gray-400 hover:text-gray-600"
        >
            <div class="p-1.5 rounded-xl transition-colors">
                <PieChart class="w-6 h-6" />
            </div>
            <span class="text-[10px] font-medium">Tracker</span>
        </button>

        <!-- SCAN CENTRE (Placeholder/Inactive) -->
        <div class="relative -mt-8 mb-1">
            <button 
              @click="router.push('/admin/dashboard?tab=scan')"
              class="w-14 h-14 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 flex items-center justify-center transform transition-all duration-300 active:scale-95"
            >
                <ScanLine class="w-6 h-6" />
            </button>
        </div>

        <button 
          @click="router.push('/admin/dashboard?tab=education')"
          class="flex flex-col items-center gap-1 transition-all duration-300 text-gray-400 hover:text-gray-600"
        >
            <div class="p-1.5 rounded-xl transition-colors">
                <BookOpen class="w-6 h-6" />
            </div>
            <span class="text-[10px] font-medium">Edukasi</span>
        </button>

        <button 
          @click="router.push('/admin/dashboard?tab=profile')"
          class="flex flex-col items-center gap-1 transition-all duration-300 text-gray-400 hover:text-gray-600"
        >
            <div class="p-1.5 rounded-xl transition-colors">
                <User class="w-6 h-6" />
            </div>
            <span class="text-[10px] font-medium">Profil</span>
        </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ChevronLeft, Loader2, Info, Home, PieChart, User, BookOpen, ScanLine } from 'lucide-vue-next';
import * as bankService from '@/services/bankService';
import { getImgUrl } from '@/utils/apiUrl';

const router = useRouter();
const loading = ref(true);
const aboutUsContent = ref('');
const aboutUsImage = ref('');

const goBack = () => {
    router.back();
};

const fetchSettings = async () => {
    loading.value = true;
    try {
        const res = await bankService.getSettings();
        aboutUsContent.value = res.data.aboutUsContent || '';
        aboutUsImage.value = res.data.aboutUsImage || '';
    } catch (e) {
        console.error("Failed to load settings", e);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    // Force scroll to top aggressively
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    
    // Retry after render
    setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, 10);
    
    // Retry after strict delay to overcome browser restoration
    setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, 100);

    fetchSettings();
});
</script>
