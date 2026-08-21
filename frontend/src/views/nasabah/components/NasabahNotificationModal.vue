<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('update:show', false)"></div>

    <div class="relative bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
      <div class="px-4 py-3 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
        <h3 class="font-bold text-gray-900 dark:text-white">Notifikasi</h3>
        <button class="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" @click="$emit('update:show', false)">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="overflow-y-auto p-0 flex-1">
        <div v-if="notifications.length === 0" class="flex flex-col items-center justify-center py-12 text-gray-400">
          <Bell class="w-12 h-12 mb-2 opacity-20" />
          <p class="text-xs">Belum ada notifikasi</p>
        </div>

        <div v-else class="divide-y dark:divide-gray-800">
          <div
            v-for="notification in notifications"
            :key="notification._id"
            class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition relative"
            :class="{ 'bg-green-50/50 dark:bg-green-900/10': !notification.read }"
          >
            <div class="flex gap-3">
              <div class="mt-1">
                <div class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                  <Bell class="w-4 h-4" />
                </div>
              </div>
              <div class="flex-1">
                <p class="text-sm text-gray-800 dark:text-gray-200 leading-snug" v-html="notification.message"></p>
                <span class="text-[10px] text-gray-400 mt-1 block">
                  {{ relativeTime(notification.createdAt) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Bell, X } from 'lucide-vue-next';
import { DateTime } from 'luxon';

defineProps({
  show: Boolean,
  notifications: {
    type: Array,
    default: () => [],
  },
});

defineEmits(['update:show']);

const relativeTime = (value) => DateTime.fromISO(value).setLocale('id').toRelative();
</script>
