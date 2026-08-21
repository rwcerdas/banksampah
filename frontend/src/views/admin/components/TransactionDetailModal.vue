<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <!-- Backdrop -->
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div 
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
        aria-hidden="true"
        @click="$emit('close')"
      ></div>

      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <!-- Modal Panel -->
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
        
        <!-- Header -->
        <div class="bg-gray-50 px-4 py-3 sm:px-6 flex justify-between items-center border-b border-gray-200">
          <div>
            <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
              Detail Transaksi
            </h3>
            <p class="mt-1 text-sm text-gray-500">
              {{ transaction?.transactionId || 'ID not generated' }}
            </p>
          </div>
          <div class="flex items-center space-x-2">
            <span 
              class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
              :class="{
                'bg-green-100 text-green-800': transaction?.status === 'COMPLETED',
                'bg-red-100 text-red-800': ['CANCELLED', 'VOIDED'].includes(transaction?.status)
              }"
            >
              {{ ['CANCELLED', 'VOIDED'].includes(transaction?.status) ? 'Dibatalkan' : 'Selesai' }}
            </span>
            <button 
              type="button" 
              class="text-gray-400 hover:text-gray-500 focus:outline-none"
              @click="$emit('close')"
            >
              <span class="sr-only">Close</span>
              <XIcon class="h-6 w-6" />
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 max-h-[70vh] overflow-y-auto">
          
          <div v-if="transaction">
            <!-- Voided Status Banner -->
            <div v-if="['CANCELLED', 'VOIDED'].includes(transaction.status)" class="text-center py-5 bg-red-50 rounded-xl border border-red-100 mb-6">
               <div class="text-2xl font-black text-red-700 mb-1 line-through opacity-50">
                 {{ formatCurrency(transaction.totalValue) }}
               </div>
               <p class="text-xs text-red-600 uppercase font-bold flex items-center justify-center gap-1.5 mb-3 tracking-widest text-[10px]">
                 ⚠️ TRANSAKSI DIBATALKAN
               </p>
               
               <div class="px-6 py-3 bg-white rounded-lg shadow-sm border border-red-50 mx-4 text-left">
                  <div class="text-[10px] text-gray-400 uppercase font-bold mb-1">Alasan Pembatalan:</div>
                  <p class="text-xs text-gray-700 font-medium italic">"{{ transaction.voidReason || 'Tidak ada alasan dicatat' }}"</p>
                  <div class="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center text-[9px] text-gray-400 font-medium">
                     <div class="flex items-center gap-1">Petugas: {{ transaction.voidedBy || 'system' }}</div>
                     <div class="flex items-center gap-1">Waktu: {{ formatDate(transaction.voidedAt) }}</div>
                  </div>
               </div>
            </div>
            <!-- Customer Info -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-blue-50 p-4 rounded-lg">
              <div>
                <h4 class="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">Informasi Nasabah</h4>
                <div class="flex items-start space-x-3">
                  <UserIcon class="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ transaction.customerName }}</p>
                    <p class="text-sm text-gray-500">No. Rek: {{ transaction.customerAccountNumber }}</p>
                  </div>
                </div>
              </div>
              <div class="md:text-right">
                 <h4 class="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">Tanggal & Petugas</h4>
                 <p class="text-sm text-gray-900">{{ formatDate(transaction.transactionDate) }}</p>
                 <p class="text-sm text-gray-500">Petugas: {{ transaction.officer }}</p>
              </div>
            </div>

            <!-- Items Table -->
            <div class="mb-6">
              <h4 class="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <PackageIcon class="h-4 w-4 mr-2" />
                Rincian Item Sampah
              </h4>
              <div class="overflow-x-auto border rounded-lg">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                      <th scope="col" class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Berat (Kg)</th>
                      <th scope="col" class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Harga/Kg</th>
                      <th scope="col" class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="(item, index) in transaction.items" :key="index">
                      <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ item.itemName }}</td>
                      <td class="px-4 py-3 text-sm text-gray-500">{{ item.categoryCode }}</td>
                      <td class="px-4 py-3 text-sm text-gray-900 text-right">{{ item.weight }}</td>
                      <td class="px-4 py-3 text-sm text-gray-500 text-right">{{ formatCurrency(item.customerPrice) }}</td>
                      <td class="px-4 py-3 text-sm font-medium text-gray-900 text-right">{{ formatCurrency(item.subtotal) }}</td>
                    </tr>
                  </tbody>
                  <tfoot class="bg-gray-50">
                    <tr>
                      <td colspan="2" class="px-4 py-3 text-sm font-medium text-gray-900 text-right">Total</td>
                      <td class="px-4 py-3 text-sm font-bold text-gray-900 text-right">{{ transaction.totalWeight }}</td>
                      <td></td>
                      <td class="px-4 py-3 text-sm font-bold text-green-600 text-right">{{ formatCurrency(transaction.totalValue) }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- Financial Logic & Summary -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <!-- Left: Notes & Photo -->
              <div>
                <div v-if="transaction.notes" class="mb-4">
                  <h4 class="text-sm font-medium text-gray-700 mb-1">Catatan:</h4>
                  <p class="text-sm text-gray-600 bg-gray-50 p-2 rounded border">{{ transaction.notes }}</p>
                </div>
                
                <div v-if="transaction.photoUrl" class="mb-4">
                  <h4 class="text-sm font-medium text-gray-700 mb-1">Bukti Foto:</h4>
                  <img :src="getImageUrl(transaction.photoUrl)" alt="Bukti Transaksi" class="h-32 w-auto rounded border hover:opacity-90 cursor-pointer object-cover" />
                </div>
              </div>

              <!-- Right: Financial Breakdown -->
              <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Ringkasan Keuangan</h4>
                
                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Total Harga Pelapak:</span>
                    <span class="font-medium text-gray-900">{{ formatCurrency(transaction.totalValue + transaction.totalProfit) }}</span>
                  </div>
                  
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600 flex items-center">
                      Potongan Kas 
                      <span class="ml-1 text-xs bg-gray-200 px-1 rounded">{{ transaction.markupPercentage }}%</span>:
                    </span>
                    <span class="font-medium text-red-600">- {{ formatCurrency(transaction.totalProfit) }}</span>
                  </div>

                  <div class="border-t border-gray-300 my-2 pt-2 flex justify-between items-center text-base">
                    <span class="font-bold text-gray-900">Total Diterima Nasabah:</span>
                    <span class="font-bold text-green-600 text-lg">{{ formatCurrency(transaction.totalValue) }}</span>
                  </div>

                  <div class="mt-4 pt-3 border-t border-dashed border-gray-300">
                    <div class="flex justify-between items-center bg-white p-2 rounded border">
                      <span class="text-sm text-gray-600">Metode Pembayaran:</span>
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :class="transaction.paymentMethod === 'SAVINGS' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'">
                        {{ transaction.paymentMethod === 'SAVINGS' ? 'Tabungan (Masuk Saldo)' : 'Tunai (CASH)' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
          
          <div v-else class="text-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            <p class="mt-2 text-sm text-gray-500">Memuat detail transaksi...</p>
          </div>

        </div>

        <!-- Footer -->
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button 
            type="button" 
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
            @click="printReceipt"
          >
            <PrinterIcon class="h-4 w-4 mr-2" />
            Cetak Struk
          </button>
          
          <button 
            type="button" 
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            @click="$emit('close')"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { XIcon, UserIcon, PackageIcon, PrinterIcon } from 'lucide-vue-next';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { terbilang } from '@/utils/formatters';
import { getImgUrl } from '@/utils/apiUrl';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  transaction: {
    type: Object,
    default: null
  }
});

defineEmits(['close']);

const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value || 0);
};

const formatNumber = (value) => {
  return new Intl.NumberFormat('id-ID').format(value || 0);
};

const formatWeight = (value) => {
  return parseFloat(value || 0).toFixed(2);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

const getImageUrl = (url) => {
  if (!url) return '';
  const clean = url.replace(/^https?:\/\/localhost:300[01]/, '');
  return getImgUrl(clean.startsWith('/') ? clean : `/${clean}`);
};

const printReceipt = async () => {
  if (!props.transaction) return;
  
  const trx = props.transaction;
  const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Watermark (Repeating Logo)
  const logoUrl = '//assets/ecobank-logo.png';
  const img = new Image();
  let logoLoaded = false;
  
  try {
      img.src = logoUrl;
      await new Promise((resolve) => {
          img.onload = () => { logoLoaded = true; resolve(); };
          img.onerror = resolve; 
      });
  } catch (e) {
      console.warn("Logo load error", e);
  }

  if (logoLoaded && img.width > 0) {
      if (doc.GState) {
          doc.setGState(new doc.GState({ opacity: 0.05 }));
          const wmSize = 40;
          const gap = 40;
          for (let x = -20; x < pageWidth; x += (wmSize + gap)) {
              for (let y = -20; y < pageHeight; y += (wmSize + gap)) {
                   doc.addImage(img, 'PNG', x, y, wmSize, wmSize);
              }
          }
          doc.setGState(new doc.GState({ opacity: 1.0 }));
      }
  }

  // 1b. VOID Stamp for cancelled transactions
  if (['CANCELLED', 'VOIDED'].includes(trx.status)) {
      if (doc.GState) doc.setGState(new doc.GState({ opacity: 0.1 }));
      doc.setFontSize(60);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(200, 0, 0); // SUBTLE RED
      doc.text("VOID / BATAL", pageWidth / 2, pageHeight / 2, { 
          align: 'center', 
          angle: 45 
      });
      if (doc.GState) doc.setGState(new doc.GState({ opacity: 1.0 }));
  }

  let y = 20;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // 2. Header (Formal Enterprise Style)
  if (logoLoaded) {
       doc.addImage(img, 'PNG', margin, y, 20, 20);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(22, 163, 74); // Green-600
  doc.text("BANK SAMPAH GAS BERLIN", margin + 25, y + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text("RW 09 Kelurahan Bakti Jaya, Kecamatan Setu", margin + 25, y + 14);
  doc.text("Kota Tangerang Selatan, Banten", margin + 25, y + 19);

  y += 30;

  doc.setDrawColor(22, 163, 74);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // 3. Info Section
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text("BUKTI SETOR BANK SAMPAH", pageWidth / 2, y, { align: 'center' });
  y += 15;

  const dateVal = trx.createdAt || trx.date || trx.transactionDate;
  const dateObj = new Date(dateVal);
  const dateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50);

  const labelX = margin;
  const valX = margin + 35;
  const col2LabelX = pageWidth / 2 + 10;
  const col2ValX = pageWidth / 2 + 45;

  // Row 1
  doc.text("ID Transaksi", labelX, y);
  doc.text(`: ${trx.transactionId || trx._id?.substring(0, 16).toUpperCase()}`, valX, y);
  
  doc.text("Tanggal", col2LabelX, y);
  doc.text(`: ${dateStr}`, col2ValX, y);
  y += 6;

  // Row 2
  doc.text("Nasabah", labelX, y);
  doc.text(`: ${trx.customerName || '-'}`, valX, y);
  
  doc.text("Waktu", col2LabelX, y);
  doc.text(`: ${timeStr} WIB`, col2ValX, y);
  y += 6;

  // Row 3
  doc.text("Metode", labelX, y);
  doc.text(`: ${trx.paymentMethod === 'CASH' ? 'Tunai' : 'Tabungan'}`, valX, y);
  
  doc.text("No. Rekening", col2LabelX, y);
  doc.text(`: ${trx.customerAccountNumber || '-'}`, col2ValX, y);
  y += 15;

  // 4. Items Table (Green Header)
  const cols = [
      { header: 'Item', x: margin, w: 60 },
      { header: 'Berat (Kg)', x: margin + 60, w: 30, align: 'right' },
      { header: 'Harga/Kg', x: margin + 90, w: 40, align: 'right' },
      { header: 'Total (Rp)', x: margin + 130, w: 40, align: 'right' }
  ];

  doc.setFillColor(22, 163, 74);
  doc.rect(margin, y, contentWidth, 8, 'F');

  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  cols.forEach(col => {
      const xPos = col.align === 'right' ? col.x + col.w - 2 : col.x + 2;
      doc.text(col.header, xPos, y + 5.5, { align: col.align || 'left' });
  });
  y += 8;

  // Rows
  doc.setTextColor(40);
  doc.setFont('helvetica', 'normal');
  
  let totalAmount = 0;
  const items = trx.items || [];

  items.forEach((item, i) => {
      const itemY = y + 6;
      cols.forEach((col, cIdx) => {
          const xPos = col.align === 'right' ? col.x + col.w - 2 : col.x + 2;
          let text = '';
          if(cIdx === 0) text = item.itemName || item.name || '-';
          if(cIdx === 1) text = formatWeight(item.weight);
          if(cIdx === 2) text = formatNumber(item.customerPrice || item.price);
          if(cIdx === 3) text = formatNumber(item.subtotal);
          
          doc.text(text, xPos, itemY, { align: col.align || 'left' });
      });
      
      doc.setDrawColor(230);
      doc.line(margin, y + 8, pageWidth - margin, y + 8);
      
      totalAmount += Number(item.subtotal || 0);
      y += 8;
  });

  // 5. Total
  y += 5;
  const finalTotal = trx.totalValue || totalAmount;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0); // BLACK COLOR
  // Moved label much further left (aligned with Price column) to avoid overlap with large numbers
  doc.text("Total Diterima:", margin + 90, y);
  
  doc.setFontSize(14);
  doc.setTextColor(0); // BLACK COLOR
  doc.text(formatCurrency(finalTotal), pageWidth - margin, y, { align: 'right' });

  // Terbilang
  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(60);
  const textTerbilang = terbilang(finalTotal) + " Rupiah";
  doc.text(`(${textTerbilang})`, pageWidth - margin, y, { align: 'right' });

  y += 30;

  // 6. Footer
  const sigY = pageHeight - 50;
  
  doc.setFontSize(10);
  doc.setTextColor(60);
  doc.setFont('helvetica', 'normal');

  doc.text("Petugas,", margin + 10, sigY, { align: 'center' });
  doc.text("Nasabah,", pageWidth - margin - 10, sigY, { align: 'center' });

  // Admin Name Fix
  const adminName = trx.officer || trx.adminName || (trx.admin && trx.admin.name) || "Admin Petugas";

  doc.setFont('helvetica', 'bold');
  doc.text("( " + adminName + " )", margin + 10, sigY + 25, { align: 'center' });
  doc.text("( " + (trx.customerName || "Nasabah") + " )", pageWidth - margin - 10, sigY + 25, { align: 'center' });

  const printTime = new Date().toLocaleString('id-ID');
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setFont('helvetica', 'italic');
  doc.text(`Dicetak pada: ${printTime} oleh Sistem EcoBank`, pageWidth / 2, pageHeight - 10, { align: 'center' });

  doc.save(`Bukti-Setor-${trx.transactionId}.pdf`);
};
</script>

<style scoped>
@media print {
  /* Print specific styles can go here */
}
</style>
