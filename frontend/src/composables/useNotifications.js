import { ref, computed } from 'vue';
import api from '@/utils/api';
import { apiUrl } from '@/utils/apiUrl';

export function useNotifications() {
  const showNotificationModal = ref(false);
  const notifications = ref([]);

  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length);

  const fetchNotifications = async () => {
    try {
      const res = await api.get(apiUrl('notifications'));
      notifications.value = res.data?.data || res.data || [];
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  };

  const activateNotifications = async () => {
    await fetchNotifications();
  };

  return {
    showNotificationModal,
    notifications,
    unreadCount,
    fetchNotifications,
    activateNotifications,
  };
}
