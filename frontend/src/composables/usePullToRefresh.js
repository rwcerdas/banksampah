import { computed, ref } from 'vue';

export function usePullToRefresh(refresh) {
  const isDragging = ref(false);
  const startY = ref(0);
  const currentY = ref(0);
  const isRefreshing = ref(false);

  const pullDistance = computed(() => {
    if (!isDragging.value) return 0;
    const distance = currentY.value - startY.value;
    return distance > 0 ? Math.min(distance * 0.5, 120) : 0;
  });

  const reset = () => {
    isDragging.value = false;
    currentY.value = 0;
    startY.value = 0;
  };

  const refreshData = async () => {
    isRefreshing.value = true;
    try {
      await refresh();
    } finally {
      isRefreshing.value = false;
      reset();
    }
  };

  const handleTouchStart = (event) => {
    if (window.scrollY !== 0) return;
    isDragging.value = true;
    startY.value = event.touches[0].clientY;
    currentY.value = startY.value;
  };

  const handleTouchMove = (event) => {
    if (!isDragging.value) return;
    const y = event.touches[0].clientY;
    if (y < startY.value) {
      reset();
      return;
    }
    currentY.value = y;
  };

  const handleTouchEnd = async () => {
    if (!isDragging.value) return;
    if (pullDistance.value > 60) {
      await refreshData();
      return;
    }
    reset();
  };

  return {
    isDragging,
    isRefreshing,
    pullDistance,
    refreshData,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
