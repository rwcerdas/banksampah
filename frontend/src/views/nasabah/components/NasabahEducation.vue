<template>
  <div class="px-4 py-6 sm:p-6 pb-nav-mobile space-y-6">
    <div v-if="loading" class="py-10 text-center">
        <div class="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
        <p class="text-sm text-gray-500">Memuat info...</p>
    </div>

    <div v-else class="space-y-8">
        <!-- Iterate over Categories -->
        <div v-for="category in educationSections" :key="category.key">
            <div v-if="category.items.length > 0">
                <h3 class="font-bold text-lg text-gray-900 dark:text-white mb-3 px-1 flex items-center gap-2">
                     <component :is="category.icon" class="w-5 h-5" :class="category.iconClass" />
                     {{ category.title }}
                </h3>

                <!-- CASE 1: Single Item (Berita) -->
                <div v-if="category.items.length === 1">
                    <div
                    v-for="article in category.items"
                    :key="article._id"
                    @click="openArticleModal(article)"
                    class="relative overflow-hidden rounded-2xl bg-[#1e405e] text-white shadow-xl cursor-pointer hover:shadow-2xl transition-all active:scale-[0.98] group w-full h-[150px] flex flex-col justify-center"
                    :class="!article.backgroundImageUrl ? (colorThemes[article.themeColor] || colorThemes['blue']) : ''"
                    :style="article.backgroundImageUrl ? `background: url('${article.backgroundImageUrl}') center center / cover no-repeat` : ''"
                    >
                        <!-- Overlay -->
                        <div v-if="article.backgroundImageUrl" class="absolute inset-0 bg-black/40 z-0"></div>

                        <!-- Decorative Elements -->
                        <div class="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                        <div class="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl -ml-5 -mb-5 pointer-events-none"></div>

                        <div class="p-4 flex justify-between items-center relative z-10 w-full h-full">
                            <!-- Text Content -->
                            <div class="flex-1 pr-4 min-w-0 flex flex-col justify-center h-full">
                                <div class="flex items-center gap-2 mb-2">
                                    <span class="text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-md bg-white/20 border border-white/10 backdrop-blur-md">
                                        {{ category.label }}
                                    </span>
                                </div>

                                <h3 class="font-serif italic text-xl leading-tight mb-2 text-white opacity-95 line-clamp-2">
                                    {{ article.title }}
                                </h3>
                                <p class="text-xs text-blue-100/80 font-light line-clamp-2">
                                    {{ article.content.substring(0, 70) }}...
                                </p>
                            </div>

                            <!-- Image -->
                            <div class="w-24 h-24 shrink-0 relative self-center">
                                <div class="absolute inset-0 bg-white/10 rounded-xl transform rotate-3 scale-90 opacity-50 group-hover:rotate-6 transition-transform"></div>
                                <img
                                    v-if="article.imageUrl"
                                    :src="getSafeImgUrl(article.imageUrl)"
                                    class="w-full h-full object-cover rounded-xl shadow-lg border-2 border-white/10 relative z-10"
                                />
                                <div v-else class="w-full h-full rounded-xl bg-white/10 flex items-center justify-center border-2 border-white/10 text-white/50 relative z-10">
                                     <BookOpen class="w-8 h-8" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- CASE 2: Multi Items (Carousel - 1-Up View for Exact Precision) -->
                <div v-else>
                    <!-- Carousel Container -->
                    <div
                        class="flex overflow-x-auto pb-4 snap-x scrollbar-hide scroll-smooth"
                        :ref="(el) => setCarouselRef(el, category.key)"
                        @scroll="onCarouselScroll($event, category.key)"
                    >
                        <div
                        v-for="article in category.items"
                        :key="article._id"
                        @click="openArticleModal(article)"
                        class="relative overflow-hidden rounded-2xl bg-[#1e405e] text-white shadow-xl cursor-pointer hover:shadow-2xl transition-all active:scale-[0.98] group shrink-0 h-[150px] flex flex-col justify-center snap-center w-full"
                        :class="!article.backgroundImageUrl ? (colorThemes[article.themeColor] || colorThemes['blue']) : ''"
                        :style="article.backgroundImageUrl ? `background: url('${getSafeImgUrl(article.backgroundImageUrl)}') center center / cover no-repeat` : ''"
                        >
                            <!-- Overlay -->
                            <div v-if="article.backgroundImageUrl" class="absolute inset-0 bg-black/40 z-0"></div>

                            <!-- Decorative Elements -->
                            <div class="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                            <div class="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl -ml-5 -mb-5 pointer-events-none"></div>

                            <div class="p-4 flex justify-between items-center relative z-10 w-full h-full">
                                <!-- Text Content -->
                                <div class="flex-1 pr-4 min-w-0 flex flex-col justify-center h-full">
                                    <div class="flex items-center gap-2 mb-2">
                                        <span class="text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-md bg-white/20 border border-white/10 backdrop-blur-md">
                                            {{ category.label }}
                                        </span>
                                    </div>

                                    <h3 class="font-serif italic text-xl leading-tight mb-2 text-white opacity-95 line-clamp-2">
                                        {{ article.title }}
                                    </h3>
                                    <p class="text-xs text-blue-100/80 font-light line-clamp-2">
                                        {{ article.content.substring(0, 70) }}...
                                    </p>
                                </div>

                                <!-- Image -->
                                <div class="w-24 h-24 shrink-0 relative self-center">
                                    <div class="absolute inset-0 bg-white/10 rounded-xl transform rotate-3 scale-90 opacity-50 group-hover:rotate-6 transition-transform"></div>
                                    <img
                                        v-if="article.imageUrl"
                                        :src="article.imageUrl"
                                        class="w-full h-full object-cover rounded-xl shadow-lg border-2 border-white/10 relative z-10"
                                    />
                                    <div v-else class="w-full h-full rounded-xl bg-white/10 flex items-center justify-center border-2 border-white/10 text-white/50 relative z-10">
                                         <BookOpen class="w-8 h-8" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Pagination Dots -->
                    <div class="flex justify-center gap-1.5 mt-[-8px] pb-2">
                        <button
                            v-for="(_, idx) in category.items"
                            :key="idx"
                            @click="scrollToSlide(category.key, idx)"
                            class="transition-all duration-300 rounded-full"
                            :class="activeSlide[category.key] === idx ? 'w-4 h-1.5 bg-green-600' : 'w-1.5 h-1.5 bg-gray-300 dark:bg-gray-700'"
                        ></button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  </div>

  <!-- EDUCATION ARTICLE MODAL -->
  <div v-if="selectedArticle" class="fixed inset-0 z-[60] flex items-start justify-center pt-8 sm:pt-12 pb-8 px-4">
      <!-- Backdrop - TRANSPARENT (No dark background) -->
      <div
        class="absolute inset-0 bg-white/95 backdrop-blur-sm transition-opacity"
        @click="selectedArticle = null"
      ></div>

      <!-- Modal Content (Card Style) - WITH SHADOW -->
      <div
        class="w-full max-w-[340px] rounded-[30px] shadow-2xl overflow-hidden relative z-10 flex flex-col animate-bounce-in transition-all duration-300"
        :class="showFullArticle ? 'h-[75vh]' : 'max-h-[75vh]'"
        style="background-color: white !important;"
      >

          <!-- Image Section (Top Half) -->
          <div class="relative bg-gray-100 transition-all duration-300" :class="showFullArticle ? 'h-48' : 'h-64'">
              <img
                v-if="selectedArticle.imageUrl"
                :src="selectedArticle.imageUrl"
                class="w-full h-full object-cover"
                alt="Promo Image"
              />
              <div v-else class="w-full h-full flex items-center justify-center bg-gray-200">
                  <BookOpen class="w-12 h-12 text-gray-400" />
              </div>

              <!-- Close Button -->
              <button
                @click="selectedArticle = null"
                class="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition z-20"
              >
                  <X class="w-5 h-5" />
              </button>
          </div>

          <!-- Blue Header Info Section -->
          <div class="p-6 -mt-4 relative rounded-t-[25px] z-10 text-white shrink-0 shadow-sm"
               :class="!selectedArticle.backgroundImageUrl ? (colorThemes[selectedArticle.themeColor] || colorThemes['blue']) : 'bg-[#2ca6e0]'"
               :style="selectedArticle.backgroundImageUrl ? `background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.8)); backdrop-filter: blur(10px); background-color: rgba(30, 64, 94, 0.9);` : ''"
          >
             <h2 class="text-xl font-bold leading-tight mb-2 line-clamp-2">
                 {{ selectedArticle.title }}
             </h2>
             <div class="text-xs text-white/80 font-medium mb-1">
                 Berlaku hingga 31 Des 2026
             </div>
          </div>

          <!-- Content Body (Scrollable) -->
          <div class="flex-1 overflow-hidden flex flex-col"
               :class="!selectedArticle.backgroundImageUrl ? (colorThemes[selectedArticle.themeColor] || colorThemes['blue']) : 'bg-[#1e405e]'"
          >
              <div class="flex-1 rounded-t-[25px] p-6 overflow-y-auto flex flex-col" style="background-color: white !important;">

                 <!-- PREVIEW MODE content -->
                 <div v-if="!showFullArticle" class="flex-1 flex flex-col justify-between">
                     <div>
                        <h4 class="font-bold text-gray-500 text-sm mb-3">Mekanisme:</h4>
                        <div class="text-sm text-gray-600 space-y-2 leading-relaxed line-clamp-3">
                            {{ selectedArticle.content }}
                        </div>
                     </div>

                     <!-- CTA Button -->
                     <div class="mt-8 flex justify-center">
                        <button
                            @click="showFullArticle = true"
                            class="bg-white border border-blue-200 text-blue-500 px-6 py-2 rounded-full text-xs font-bold shadow-sm hover:shadow-md transition active:scale-95 transform"
                        >
                            Lihat detail
                        </button>
                     </div>
                 </div>

                 <!-- FULL MODE content -->
                 <div v-else class="space-y-4 animate-fade-in">
                     <h4 class="font-bold text-gray-500 text-sm">Deskripsi Lengkap:</h4>
                     <div class="text-sm text-gray-600 space-y-2 leading-relaxed whitespace-pre-line text-justify">
                         {{ selectedArticle.content }}
                     </div>

                     <!-- Back Button -->
                     <div class="pt-6 flex justify-center pb-2">
                        <button
                            @click="showFullArticle = false"
                            class="text-gray-400 hover:text-gray-600 text-xs flex items-center gap-1 transition"
                        >
                            <ChevronUp class="w-4 h-4" /> Tutup
                        </button>
                     </div>
                 </div>

              </div>
          </div>
      </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { BookOpen, Newspaper, Lightbulb, Ticket, X, ChevronUp } from 'lucide-vue-next';
import { getImgUrl } from '@/utils/apiUrl';

const props = defineProps({
  articles: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const selectedArticle = ref(null);
const showFullArticle = ref(false);
const activeSlide = ref({});
const carouselRefs = ref({});

const colorThemes = {
    blue: 'bg-gradient-to-br from-blue-600 to-blue-800',
    purple: 'bg-gradient-to-br from-purple-600 to-purple-800',
    emerald: 'bg-gradient-to-br from-emerald-600 to-emerald-800',
    orange: 'bg-gradient-to-br from-orange-500 to-red-600',
    teal: 'bg-gradient-to-br from-teal-500 to-cyan-700',
};

const educationSections = computed(() => {
    // Filter articles by category (Case Insensitive)
    const filters = {
        news: (a) => (a.category?.toUpperCase() === 'NEWS' || !a.category || a.category?.toUpperCase() === 'ANNOUNCEMENT'),
        tips: (a) => a.category?.toUpperCase() === 'TIPS',
        promo: (a) => a.category?.toUpperCase() === 'PROMO'
    };

    return [
        {
            key: 'news',
            title: 'Berita & Info Terkini',
            icon: Newspaper,
            iconClass: 'text-blue-600',
            label: 'Info Terbaru',
            items: props.articles.filter(filters.news)
        },
        {
            key: 'tips',
            title: 'Tips & Trik Mengelola Sampah',
            icon: Lightbulb,
            iconClass: 'text-yellow-500',
            label: 'Edukasi',
            items: props.articles.filter(filters.tips)
        },
        {
            key: 'promo',
            title: 'Promo Spesial',
            icon: Ticket,
            iconClass: 'text-purple-600',
            label: 'Hot Promo',
            items: props.articles.filter(filters.promo)
        }
    ];
});

const openArticleModal = (article) => {
    selectedArticle.value = article;
    showFullArticle.value = false;
};

const getSafeImgUrl = (url) => {
    return getImgUrl(url);
};

// Carousel Logic
const setCarouselRef = (el, key) => {
    if (el) carouselRefs.value[key] = el;
};

const onCarouselScroll = (event, key) => {
    const el = event.target;
    // Simple logic to determine active slide index
    const index = Math.round(el.scrollLeft / el.offsetWidth);
    if (activeSlide.value[key] !== index) {
        activeSlide.value[key] = index;
    }
};

const scrollToSlide = (key, index) => {
    const el = carouselRefs.value[key];
    if (el) {
        el.scrollTo({
            left: index * el.offsetWidth,
            behavior: 'smooth'
        });
    }
};
</script>

<style scoped>
/* Animations */
@keyframes bounce-in {
  0% { transform: scale(0.9); opacity: 0; }
  60% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); }
}
.animate-bounce-in {
  animation: bounce-in 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
}

@keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
    animation: fade-in 0.3s ease-out forwards;
}

/* Hide scrollbar for carousel */
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
