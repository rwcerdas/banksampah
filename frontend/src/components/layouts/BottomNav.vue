<template>
  <nav
    :class="[
      isNavHidden ? 'translate-y-[120%] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100',
      'fixed bottom-0 left-0 right-0 z-40 md:hidden pb-safe transition-all duration-300 ease-in-out',
      'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80',
    ]"
  >
    <div class="flex justify-around items-center h-[3.75rem] max-w-lg mx-auto relative px-2">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex flex-col items-center justify-center flex-1 transition-all duration-300 ease-out"
        :class="isActive(item.path) ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'"
      >
        <div class="relative group mt-1 transition-all duration-200">
          <component
            :is="item.icon"
            class="transition-all duration-300 w-[22px] h-[22px]"
            :class="isActive(item.path) ? 'scale-110 -translate-y-0.5 drop-shadow-sm' : ''"
          />
        </div>
        <span
          class="text-[10px] mt-1 font-medium transition-all duration-300 whitespace-nowrap"
          :class="{ 'font-bold': isActive(item.path) }"
        >
          {{ item.label }}
        </span>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { Home, Users, Scale, DollarSign } from 'lucide-vue-next';

const route = useRoute();

const navItems = [
  { path: '/admin/dashboard', icon: Home, label: 'Dashboard' },
  { path: '/admin/customers', icon: Users, label: 'Nasabah' },
  { path: '/admin/transactions', icon: Scale, label: 'Transaksi' },
  { path: '/admin/cash', icon: DollarSign, label: 'Kas' },
];

function isActive(itemPath) {
  return route.path === itemPath || route.path.startsWith(itemPath + '/');
}

const isNavHidden = ref(false);
let lastScrollY = 0;
let scrollContainerEl = null;

function handleScroll() {
  const currentScrollY = scrollContainerEl ? scrollContainerEl.scrollTop : window.scrollY;
  const diff = currentScrollY - lastScrollY;

  if (currentScrollY <= 30) {
    isNavHidden.value = false;
  } else if (diff > 8 && currentScrollY > 60) {
    isNavHidden.value = true;
  } else if (diff < -8) {
    isNavHidden.value = false;
  }

  lastScrollY = currentScrollY;
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
  scrollContainerEl = document.querySelector('main.overflow-y-auto') || document.querySelector('.overflow-y-auto');
  if (scrollContainerEl) {
    scrollContainerEl.addEventListener('scroll', handleScroll, { passive: true });
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
  if (scrollContainerEl) {
    scrollContainerEl.removeEventListener('scroll', handleScroll);
  }
});
</script>
