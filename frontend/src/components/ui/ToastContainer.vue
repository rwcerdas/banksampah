<template>
  <div class="fixed top-5 right-5 z-[100] space-y-3">
    <transition-group name="toast-fade">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="toastClasses[toast.type]"
        class="flex items-center gap-3 max-w-sm w-full p-4 rounded-lg shadow-lg border"
      >
        <component :is="toastIcons[toast.type]" class="w-5 h-5 flex-shrink-0" />
        <span class="text-sm font-medium">{{ toast.message }}</span>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, h } from 'vue';
import { CheckCircle2, XCircle, Info } from 'lucide-vue-next';

const toasts = ref([]);

const toastClasses = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const toastIcons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

let toastIdCounter = 0;

const addToast = (event) => {
  const { message, type = 'info', duration = 3000 } = event.detail;
  const id = toastIdCounter++;
  toasts.value.unshift({ id, message, type });

  setTimeout(() => {
    removeToast(id);
  }, duration);
};

const removeToast = (id) => {
  toasts.value = toasts.value.filter((toast) => toast.id !== id);
};

onMounted(() => {
  window.addEventListener('show-toast', addToast);
});

onBeforeUnmount(() => {
  window.removeEventListener('show-toast', addToast);
});
</script>

<style scoped>
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.4s ease;
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
.toast-fade-move {
  transition: transform 0.4s ease;
}
</style>