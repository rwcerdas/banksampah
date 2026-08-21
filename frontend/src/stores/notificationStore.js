import { defineStore } from "pinia";
import { ref, computed, watch, onUnmounted } from "vue";
import api from "@/utils/api";
import { apiUrl } from "@/utils/apiUrl";
import { appBadgeHelper } from "@/composables/useAppBadge";

export const useNotificationStore = defineStore("notificationStore", () => {
  // 🧠 State
  const notifications = ref([]);
  const isLoading = ref(false);
  const pagination = ref({
    total: 0,
    totalPages: 1,
    currentPage: 1,
  });
  let intervalId = null;

  // 🔴 Hitung jumlah unread
  const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length);

  // 🚀 Sync otomatis dengan PWA App Icon Badge setiap kali unreadCount berubah
  watch(unreadCount, (newVal) => {
    appBadgeHelper.updateAppBadge(newVal);
  }, { immediate: true });

  // 🚀 Logika untuk menampilkan nomor halaman pagination
  const displayPages = computed(() => {
    const total = pagination.value.totalPages || 1;
    const current = pagination.value.currentPage;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages = [1];
    if (current > 3) pages.push("...");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
  });

  // 📥 Ambil semua notifikasi (dengan fallback aman)
  async function fetchNotifications(page = 1) {
    isLoading.value = true;
    try {
      const { data } = await api.get(apiUrl(`notifications?page=${page}&limit=5`));
      
      // 🚀 Sesuaikan dengan struktur respons baru dari backend
      if (data && Array.isArray(data.data)) {
        notifications.value = data.data;
        if (data.pagination) {
          pagination.value = data.pagination;
        }
      } else {
        notifications.value = [];
      }

    } catch (err) {
      console.error("❌ Gagal memuat notifikasi:", err);
    } finally {
      isLoading.value = false;
    }
  }

  // ✅ Tandai satu notifikasi sebagai dibaca
  async function markAsRead(id) {
    try {
      await api.patch(apiUrl(`notifications/${id}/read`));
      const notif = notifications.value.find((n) => n._id === id);
      if (notif) notif.read = true;
    } catch (err) {
      console.error("❌ Gagal menandai notifikasi:", err);
    }
  }

  // ✅ Tandai semua sebagai dibaca
  async function markAllAsRead() {
    try {
      const unread = notifications.value.filter((n) => !n.read);
      if (!unread.length) return;

      await Promise.all(
        unread.map((n) => api.patch(apiUrl(`notifications/${n._id}/read`)))
      );

      notifications.value.forEach((n) => (n.read = true));
    } catch (err) {
      console.error("❌ Gagal menandai semua notifikasi:", err);
    }
  }

  // 🔄 Auto refresh interval (optional & safe)
  function startAutoRefresh(intervalMs = 15000) {
    fetchNotifications();
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(fetchNotifications, intervalMs);
  }

  function stopAutoRefresh() {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
  }

  // 🧹 Bersihkan interval kalau store di-unmount
  onUnmounted(stopAutoRefresh);

  return {
    notifications,
    unreadCount,
    displayPages, // 🚀 Expose displayPages ke komponen
    pagination,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    startAutoRefresh,
    stopAutoRefresh,
  };
});