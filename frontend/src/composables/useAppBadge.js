/**
 * PWA App Icon Notification Badging Helper (W3C Badging API)
 * 
 * Mengelola tampilan badge angka atau titik merah pada ikon aplikasi di Home Screen HP / Taskbar Desktop
 * ketika aplikasi diinstal sebagai Progressive Web App (PWA).
 */

export function useAppBadge() {
  /**
   * Memperbarui atau memasang badge pada ikon aplikasi.
   * @param {number|string} count - Jumlah notifikasi yang belum dibaca
   */
  async function updateAppBadge(count) {
    if (typeof navigator === 'undefined') return;

    const numCount = typeof count === 'number' ? count : parseInt(count || 0, 10);

    // Jika unread > 0, pasang angka atau dot badge
    if (numCount > 0) {
      if ('setAppBadge' in navigator) {
        try {
          await navigator.setAppBadge(numCount);
        } catch (err) {
          console.debug('[AppBadge] Gagal memasang app badge:', err.message);
        }
      }
    } else {
      // Jika unread 0 atau tidak valid, hapus badge
      await clearAppBadge();
    }
  }

  /**
   * Menghapus badge dari ikon aplikasi.
   */
  async function clearAppBadge() {
    if (typeof navigator === 'undefined') return;

    if ('clearAppBadge' in navigator) {
      try {
        await navigator.clearAppBadge();
      } catch (err) {
        console.debug('[AppBadge] Gagal menghapus app badge:', err.message);
      }
    } else if ('setAppBadge' in navigator) {
      // Fallback untuk beberapa browser yang mendukung setAppBadge(0) sebagai clear
      try {
        await navigator.setAppBadge(0);
      } catch (err) {
        // Abaikan jika error
      }
    }
  }

  return {
    updateAppBadge,
    clearAppBadge,
  };
}

// Export singleton helper untuk pemanggilan langsung di luar komponen Vue (misal di Pinia Store / vanilla js)
export const appBadgeHelper = useAppBadge();
