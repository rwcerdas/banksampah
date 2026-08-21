/**
 * Composable untuk menampilkan notifikasi toast global.
 */
export function useToast() {
  /**
   * Menampilkan toast.
   * @param {string} message - Pesan yang akan ditampilkan.
   * @param {'success' | 'error' | 'info'} type - Jenis toast.
   * @param {number} duration - Durasi dalam milidetik.
   */
  const showToast = (message, type = 'info', duration = 3000) => {
    window.dispatchEvent(
      new CustomEvent('show-toast', { detail: { message, type, duration } })
    );
  };

  /**
   * Shortcut untuk menampilkan toast sukses.
   * @param {string} message
   * @param {number} duration
   */
  const success = (message, duration = 3000) => showToast(message, 'success', duration);

  /**
   * Shortcut untuk menampilkan toast error.
   * @param {string} message
   * @param {number} duration
   */
  const error = (message, duration = 3000) => showToast(message, 'error', duration);

  return { showToast, success, error };
}