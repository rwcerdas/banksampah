<template>
  <div class="fixed inset-0 z-[70] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl relative z-10 overflow-hidden">
      <!-- Header -->
      <div class="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gradient-to-r from-green-600 to-emerald-500">
        <div>
          <h3 class="text-xl font-bold text-white">
            {{ isEdit ? 'Edit Pengepul' : 'Tambah Pengepul Baru' }}
          </h3>
          <p class="text-green-100 text-sm mt-0.5">Isi data pengepul dengan lengkap</p>
        </div>
        <button @click="$emit('close')" class="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <!-- Kode Pengepul -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Kode Pengepul
            <span class="font-normal text-gray-400 ml-1">(otomatis jika dikosongkan)</span>
          </label>
          <input
            v-model="form.collectorCode"
            type="text"
            placeholder="Contoh: PG-001"
            :disabled="isEdit"
            class="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white text-sm
                   focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-400"
          />
        </div>

        <!-- Nama Pengepul -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Nama Pengepul <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.collectorName"
            type="text"
            required
            placeholder="Contoh: CV. Berkah Jaya"
            class="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white text-sm
                   focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <!-- Nomor Telepon -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Nomor Telepon</label>
          <input
            v-model="form.phone"
            type="text"
            placeholder="Contoh: 081234567890"
            class="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white text-sm
                   focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <!-- Alamat -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Alamat</label>
          <input
            v-model="form.address"
            type="text"
            placeholder="Alamat pengepul"
            class="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white text-sm
                   focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <!-- Catatan -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Catatan (Opsional)</label>
          <textarea
            v-model="form.notes"
            rows="2"
            placeholder="Catatan tambahan..."
            class="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white text-sm
                   focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          ></textarea>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-2">
          <button
            type="button"
            @click="$emit('close')"
            class="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300
                   hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold text-sm transition"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="saving || !form.collectorName.trim()"
            class="flex-1 py-2.5 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm
                   transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span v-if="saving" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ saving ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Tambah Pengepul') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { X } from 'lucide-vue-next';
import * as bankService from '@/services/bankService';
import Swal from 'sweetalert2';
import { confirmSave } from '@/utils/confirmDialog';

const props = defineProps({
  collector: { type: Object, default: null }, // null = mode tambah, object = mode edit
});
const emit = defineEmits(['close', 'saved']);

const isEdit = !!props.collector;
const saving = ref(false);

const form = ref({
  collectorCode: props.collector?.collectorCode || '',
  collectorName: props.collector?.collectorName || '',
  phone: props.collector?.phone || '',
  address: props.collector?.address || '',
  notes: props.collector?.notes || '',
});

const handleSubmit = async () => {
  if (!form.value.collectorName.trim()) return;

  const label = isEdit ? 'memperbarui data pengepul' : 'menambahkan pengepul baru';
  const ok = await confirmSave(label);
  if (!ok) return;

  saving.value = true;

  try {
    let result;
    if (isEdit) {
      result = await bankService.updateCollector(props.collector._id, {
        collectorName: form.value.collectorName,
        phone: form.value.phone,
        address: form.value.address,
        notes: form.value.notes,
      });
    } else {
      result = await bankService.createCollector(form.value);
    }
    emit('saved', result.data);
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || err.message });
  } finally {
    saving.value = false;
  }
};
</script>
