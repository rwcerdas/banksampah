<template>
  <div class="flex h-dvh overflow-hidden bg-slate-100 dark:bg-black">
    <!-- Sidebar overlay mobile -->
    <div
      v-if="isSidebarOpen && windowWidth < 1024"
      class="fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden"
      @click="toggleSidebar"
    />

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed lg:relative inset-y-0 left-0 z-50 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 text-gray-800 dark:text-slate-300 flex flex-col transition-all duration-300 ease-in-out pr-2',
        isSidebarOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0',
      ]"
    >
      <div class="flex items-center h-20 shrink-0 px-4 justify-start transition-all duration-300">
        <img
          v-if="brandingStore.logoSrc"
          :src="brandingStore.logoSrc"
          alt="Logo"
          class="transition-all duration-300 object-contain"
          :class="isSidebarOpen ? 'h-10 w-auto' : 'h-10 w-10 mx-auto'"
        />
        <div
          v-else
          class="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shrink-0 text-sm"
          :class="isSidebarOpen ? 'h-10 w-10' : 'h-10 w-10 mx-auto'"
        >
          {{ brandingStore.initials }}
        </div>
        <h1
          v-if="isSidebarOpen"
          class="text-lg font-bold text-gray-800 dark:text-white ml-2 truncate"
        >
          {{ brandingStore.displayName }}
        </h1>
      </div>

      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          @click="closeSidebarOnMobile"
          :class="[
            'flex items-center py-2.5 px-3 rounded-lg transition duration-200 mb-1',
            isSidebarOpen ? '' : 'justify-center',
            isRouteActive(item.path)
              ? 'bg-blue-100 dark:bg-gray-900 text-blue-700 dark:text-white font-semibold'
              : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-900',
          ]"
          :title="item.label"
        >
          <component :is="item.icon" class="w-5 h-5 shrink-0" />
          <span v-if="isSidebarOpen" class="ml-3 text-sm truncate">{{ item.label }}</span>
        </router-link>
      </nav>
    </aside>

    <!-- Collapse toggle -->
    <div
      class="hidden lg:flex absolute top-24 left-[15.8rem] z-50 items-center justify-center w-6 h-6 bg-gray-100 dark:bg-gray-900 rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition"
      @click="toggleSidebar"
      :title="isSidebarOpen ? 'Perkecil Sidebar' : 'Perluas Sidebar'"
      :style="isSidebarOpen ? '' : 'left:5rem'"
    >
      <component
        :is="isSidebarOpen ? ChevronsLeft : ChevronsRight"
        class="w-4 h-4 text-gray-600 dark:text-slate-300"
      />
    </div>

    <!-- Main area -->
    <div class="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
      <header class="sticky top-0 z-40 flex items-center justify-between border-none px-4 pb-2 pt-header-safe shrink-0 bg-transparent pb-1">
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <button
            class="lg:hidden shrink-0 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900"
            @click="toggleSidebar"
          >
            <Menu class="w-5 h-5 text-gray-700 dark:text-slate-300" />
          </button>
          <div class="hidden lg:block min-w-0">
            <h2 class="text-sm font-bold text-gray-800 dark:text-white truncate">{{ pageTitle }}</h2>
            <p class="text-[11px] text-gray-500 dark:text-gray-400 truncate">Panel Admin Bank Sampah</p>
          </div>
        </div>

        <div class="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
          <ThemeToggle />
          <NotificationBell />

          <div class="relative z-[60]" ref="userMenuContainer">
            <button
              type="button"
              @click="toggleUserMenu"
              class="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition focus:outline-none"
            >
              <img
                class="h-8 w-8 rounded-full object-cover shrink-0 ring-2 ring-indigo-500/20"
                :src="avatarUrl"
                alt="User avatar"
                @error="onAvatarError"
              />
              <div class="hidden sm:block text-left">
                <div class="font-semibold text-sm text-gray-700 dark:text-white truncate max-w-[120px]">
                  {{ userStore.namaLengkap || userStore.username }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 capitalize">Admin</div>
              </div>
            </button>

            <teleport to="body">
              <transition name="fade-slide">
                <div
                  v-if="isUserMenuOpen"
                  class="fixed z-[9999] right-4 top-16 mt-2 pt-safe w-52 bg-white dark:bg-gray-900 rounded-lg shadow-lg ring-1 ring-black/5 dark:ring-gray-700"
                >
                  <div class="py-2">
                    <button
                      @click="openChangePasswordModal"
                      class="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <KeyRound class="w-4 h-4" />
                      <span>Ganti Password</span>
                    </button>
                    <button
                      @click="forceReload"
                      :disabled="isReloading"
                      class="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60"
                    >
                      <RefreshCw :class="['w-4 h-4', isReloading ? 'animate-spin' : '']" />
                      <span>{{ isReloading ? `Memperbarui... ${progress}%` : 'Perbarui Aplikasi' }}</span>
                    </button>
                    <button
                      @click="logout"
                      class="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <LogOut class="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </transition>
            </teleport>
          </div>
        </div>
      </header>

      <main
        ref="mainContentRef"
        class="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden px-0 pt-0 pb-nav-mobile md:p-6 md:pb-6 scroll-smooth"
      >
        <router-view v-slot="{ Component }">
          <transition name="slide-fade" mode="out-in">
            <div :key="$route.path" class="flex-1 flex flex-col w-full">
              <component :is="Component" />
            </div>
          </transition>
        </router-view>

        <ChangePasswordModal
          :show="showChangePasswordModal"
          :preventClose="userStore.mustChangePassword"
          @close="showChangePasswordModal = false"
        />
      </main>
    </div>

    <BottomNav class="md:hidden fixed bottom-0 left-0 w-full z-50" />

    <!-- PWA reload overlay -->
    <div v-if="isReloading" class="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div class="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 text-center border border-gray-100 dark:border-gray-800">
        <div class="flex justify-center mb-4">
          <div class="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
            <RefreshCw class="w-6 h-6 animate-spin" />
          </div>
        </div>
        <h3 class="text-base font-bold text-gray-900 dark:text-white mb-2">Memperbarui Aplikasi</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">Sedang memuat versi terbaru...</p>
        <div class="relative w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
          <div
            class="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300 ease-out"
            :style="{ width: `${progress}%` }"
          />
        </div>
        <div class="text-right text-xs font-semibold text-blue-600 dark:text-blue-400">{{ progress }}%</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Menu, LogOut, ChevronsLeft, ChevronsRight, KeyRound, RefreshCw,
  Recycle, Users, Scale, Wallet, AlertTriangle, History, FileText,
  Coins, BookOpen, Settings, Truck,
} from 'lucide-vue-next';
import { useUserStore } from '@/stores/userStore';
import { getImgUrl } from '@/utils/apiUrl';
import ThemeToggle from '@/components/ThemeToggle.vue';
import NotificationBell from '@/components/notifications/NotificationBell.vue';
import ChangePasswordModal from '@/components/ChangePasswordModal.vue';
import BottomNav from '@/components/layouts/BottomNav.vue';
import { usePwaUpdateBanner } from '@/composables/usePwaUpdateBanner';
import { confirmLogout } from '@/utils/confirmDialog';
import { useBrandingStore } from '@/stores/brandingStore';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const brandingStore = useBrandingStore();
const isSidebarOpen = ref(typeof window !== 'undefined' ? window.innerWidth > 1024 : true);
const isUserMenuOpen = ref(false);
const showChangePasswordModal = ref(false);
const userMenuContainer = ref(null);
const mainContentRef = ref(null);
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024);
const avatarFallback = ref(false);

const { forceReload, isReloading, progress } = usePwaUpdateBanner();

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard Bank Sampah', icon: Recycle },
  { path: '/admin/customers', label: 'Nasabah', icon: Users },
  { path: '/admin/transactions', label: 'Transaksi Penimbangan', icon: Scale },
  { path: '/admin/cash', label: 'Kas Pengurus', icon: Wallet },
  { path: '/admin/withdrawals', label: 'Permintaan Penarikan', icon: AlertTriangle },
  { path: '/admin/history', label: 'Riwayat Transaksi', icon: History },
  { path: '/admin/reports', label: 'Laporan Penimbangan', icon: FileText },
  { path: '/admin/categories', label: 'Kategori & Harga', icon: Coins },
  { path: '/admin/collectors', label: 'Pengepul', icon: Truck },
  { path: '/admin/education', label: 'Edukasi & Berita', icon: BookOpen },
  { path: '/admin/settings', label: 'Pengaturan', icon: Settings },
];

const pageTitle = computed(() => {
  const item = navItems.find((n) => route.path === n.path || route.path.startsWith(n.path + '/'));
  return item?.label || route.meta.title || 'Admin';
});

const avatarUrl = computed(() => {
  if (avatarFallback.value) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userStore.namaLengkap || userStore.username || 'Admin')}&background=4f46e5&color=fff`;
  }
  if (userStore.fotoUrl) return getImgUrl(userStore.fotoUrl);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(userStore.namaLengkap || userStore.username || 'Admin')}&background=4f46e5&color=fff`;
});

function onAvatarError() {
  avatarFallback.value = true;
}

function isRouteActive(itemPath) {
  return route.path === itemPath || route.path.startsWith(itemPath + '/');
}

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value;
}

function closeSidebarOnMobile() {
  if (windowWidth.value < 1024) isSidebarOpen.value = false;
}

function toggleUserMenu() {
  isUserMenuOpen.value = !isUserMenuOpen.value;
}

function openChangePasswordModal() {
  isUserMenuOpen.value = false;
  showChangePasswordModal.value = true;
}

async function logout() {
  isUserMenuOpen.value = false;
  const ok = await confirmLogout();
  if (!ok) return;
  userStore.logout();
  router.push('/login');
}

function handleClickOutside(event) {
  if (userMenuContainer.value && !userMenuContainer.value.contains(event.target)) {
    isUserMenuOpen.value = false;
  }
}

function handleResize() {
  windowWidth.value = window.innerWidth;
  if (window.innerWidth < 1024) isSidebarOpen.value = false;
  else if (window.innerWidth >= 1024 && !isSidebarOpen.value) isSidebarOpen.value = true;
}

onMounted(async () => {
  userStore.fetchProfile();
  if (userStore.mustChangePassword) showChangePasswordModal.value = true;

  window.addEventListener('resize', handleResize);
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  document.removeEventListener('click', handleClickOutside);
});

watch(
  () => route.path,
  () => {
    if (mainContentRef.value) mainContentRef.value.scrollTop = 0;
  }
);
</script>

<style scoped>
aside {
  scrollbar-width: thin;
  scrollbar-color: #d1d5db transparent;
}
aside::-webkit-scrollbar {
  width: 6px;
}
aside::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 8px;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
