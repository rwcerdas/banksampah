import { ref, computed } from 'vue';
import api from '@/utils/api';
import { apiUrl } from '@/utils/apiUrl';
import { initFirebaseMessagingForUser } from '@/lib/firebaseMessaging';
import Swal from 'sweetalert2';

export function useNotifications() {
    const showNotificationModal = ref(false);
    const notifications = ref([]);

    const unreadCount = computed(() => notifications.value.filter(n => !n.read).length);

    const fetchNotifications = async () => {
        try {
            const res = await api.get(apiUrl('notifications'));
            notifications.value = res.data?.data || res.data || [];
        } catch (e) {
            console.error("Failed to fetch notifications", e);
        }
    };

    const activateNotifications = async () => {
        try {
            await initFirebaseMessagingForUser();
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Notifikasi diaktifkan',
                showConfirmButton: false,
                timer: 1500
            });
        } catch (error) {
            console.error("Failed to enable notifications:", error);
            Swal.fire('Error', 'Gagal mengaktifkan notifikasi. Pastikan izin browser diberikan.', 'error');
        }
    };

    return {
        showNotificationModal,
        notifications,
        unreadCount,
        fetchNotifications,
        activateNotifications
    };
}
