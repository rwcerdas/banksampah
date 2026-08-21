import Swal from 'sweetalert2';

const defaults = {
  cancelButtonText: 'Batal',
  cancelButtonColor: '#6b7280',
  confirmButtonColor: '#059669',
  reverseButtons: true,
};

/**
 * Dialog konfirmasi umum — Ya/Tidak
 */
export async function confirmAction({
  title = 'Konfirmasi',
  text = 'Apakah Anda yakin ingin melanjutkan?',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  icon = 'question',
  danger = false,
} = {}) {
  const result = await Swal.fire({
    ...defaults,
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: danger ? '#dc2626' : defaults.confirmButtonColor,
  });
  return result.isConfirmed;
}

export async function confirmLogout() {
  return confirmAction({
    title: 'Keluar?',
    text: 'Anda yakin ingin keluar dari aplikasi?',
    confirmText: 'Ya, Keluar',
    icon: 'warning',
    danger: true,
  });
}

export async function confirmSave(actionLabel = 'menyimpan perubahan') {
  return confirmAction({
    title: 'Simpan Perubahan?',
    text: `Apakah Anda yakin ingin ${actionLabel}?`,
    confirmText: 'Ya, Simpan',
    icon: 'question',
  });
}

export async function confirmDelete(itemLabel = 'data ini') {
  return confirmAction({
    title: 'Hapus Data?',
    text: `Anda yakin ingin menghapus ${itemLabel}? Tindakan ini tidak dapat dibatalkan.`,
    confirmText: 'Ya, Hapus',
    icon: 'warning',
    danger: true,
  });
}
