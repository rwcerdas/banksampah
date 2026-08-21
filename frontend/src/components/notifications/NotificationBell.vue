<template>
  <div class="relative inline-block" ref="notificationContainer">
    <!-- 🔔 Icon Notifikasi -->
    <button
      @click="toggleDropdown"
      :class="[
        neumorphic
          ? 'notification-bell-neu'
          : 'relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition',
      ]"
      aria-label="Notifikasi"
      ref="bellButton"
    >
      <LucideBell :class="neumorphic ? 'w-[18px] h-[18px] text-gray-600 dark:text-slate-300' : 'w-6 h-6 text-gray-600'" />

      <!-- 🔴 Indikator notifikasi baru -->
      <span
        v-if="store.unreadCount > 0"
        class="absolute top-1 right-1 block w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse"
      ></span>
    </button>

    <teleport to="body">
      <transition name="fade-slide">
        <div
          v-if="isOpen && !isMobile"
          class="fixed z-[9999] w-72 sm:w-80 bg-white dark:bg-gray-900 shadow-xl rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden notif-fixed"
          :style="panelStyle"
        >
          <div class="flex justify-between items-center px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-100">Notifikasi</h3>
            <button
              @click="store.markAllAsRead"
              class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition"
              :disabled="store.isLoading || store.notifications.length === 0"
            >
              Tandai semua dibaca
            </button>
          </div>
          <ul class="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
            <li
              v-for="notif in store.notifications"
              :key="notif._id"
              class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <p class="text-sm text-gray-800 dark:text-gray-200">
                {{ notif.message }}
              </p>
              <span class="text-xs text-gray-400 dark:text-gray-500">
                {{ formatDate(notif.createdAt) }}
              </span>
            </li>
            <li
              v-if="!store.isLoading && store.notifications.length === 0"
              class="p-4 text-sm text-gray-500 dark:text-gray-400 text-center"
            >
              Tidak ada notifikasi
            </li>
          </ul>

        </div>
      </transition>
    </teleport>

    <!-- 📱 Dropdown Notifikasi (mobile: gunakan Teleport + fixed layer agar tidak tumpang tindih) -->
    <teleport to="body">
      <transition name="fade-slide">
        <div v-if="isOpen && isMobile" class="fixed inset-0 z-[2000]">
          <!-- overlay -->
          <div class="absolute inset-0 bg-black/30" @click="closeDropdown"></div>
          <!-- panel -->
          <div class="absolute top-14 right-3 left-3 w-auto bg-white dark:bg-gray-900 shadow-2xl rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <!-- 🔹 Header -->
            <div class="flex justify-between items-center px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-100">Notifikasi</h3>
              <button
                @click="store.markAllAsRead"
                class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition"
                :disabled="store.isLoading || store.notifications.length === 0"
              >
                Tandai semua dibaca
              </button>
            </div>

            <!-- 🔔 Daftar -->
            <ul class="max-h-[60vh] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
              <li
                v-for="notif in store.notifications"
                :key="notif._id"
                class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <p class="text-sm text-gray-800 dark:text-gray-200">
                  {{ notif.message }}
                </p>
                <span class="text-xs text-gray-400 dark:text-gray-500">
                  {{ formatDate(notif.createdAt) }}
                </span>
              </li>

              <li
                v-if="!store.isLoading && store.notifications.length === 0"
                class="p-4 text-sm text-gray-500 dark:text-gray-400 text-center"
              >
                Tidak ada notifikasi
              </li>
            </ul>


          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { RouterLink } from "vue-router";
import { useNotificationStore } from "@/stores/notificationStore";

defineProps({
  neumorphic: {
    type: Boolean,
    default: false,
  },
});

const store = useNotificationStore();
const isOpen = ref(false);
const notificationContainer = ref(null);
const isMobile = ref(false);
const bellButton = ref(null);
const panelStyle = ref({ top: '0px', right: '0px' });

function updatePanelPosition() {
  if (!bellButton.value) return;
  const rect = bellButton.value.getBoundingClientRect();
  const right = Math.max(0, window.innerWidth - rect.right);
  panelStyle.value = { top: `${rect.bottom + 8}px`, right: `${right}px` };
}

function toggleDropdown() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) updatePanelPosition();
}

function closeDropdown() {
  isOpen.value = false;
}

function formatDate(date) {
  return new Date(date).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function handleClickOutside(event) {
  if (isOpen.value && notificationContainer.value && !notificationContainer.value.contains(event.target)) {
    closeDropdown();
  }
}

onMounted(() => {
  if (!store.notifications.length) store.fetchNotifications();
  store.startAutoRefresh(15000);
  // Tambahkan event listener saat komponen di-mount
  document.addEventListener('click', handleClickOutside);
  const update = () => { isMobile.value = window.innerWidth < 768; };
  update();
  window.addEventListener('resize', update);
  const reposition = () => { if (isOpen.value) updatePanelPosition(); };
  window.addEventListener('resize', reposition);
  window.addEventListener('scroll', reposition, { passive: true });
  onBeforeUnmount(() => {
    window.removeEventListener('resize', reposition);
    window.removeEventListener('scroll', reposition);
  });
});

onBeforeUnmount(() => {
  store.stopAutoRefresh?.();
  // Hapus event listener saat komponen dihancurkan untuk mencegah memory leak
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', () => {});
});
</script>

<style scoped>
.notif-fixed {
  transform: translateZ(0);
  will-change: transform;
  isolation: isolate;
}
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}
.animate-pulse {
  animation: pulse 1.3s infinite;
}

@media (max-width: 767px) {
  .notification-bell-neu {
    position: relative;
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

  .notification-bell-neu:active {
    box-shadow: var(--neu-pressed, inset 4px 4px 8px #c8d0dc, inset -4px -4px 8px #ffffff);
    transform: scale(0.96);
  }
}
</style>
