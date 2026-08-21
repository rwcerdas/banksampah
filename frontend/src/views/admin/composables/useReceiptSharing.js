import { jsPDF } from 'jspdf';
import Swal from 'sweetalert2';
import { terbilang } from '@/utils/formatters';

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
}).format(value || 0);

const formatDateFull = (date) => new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
});

export function useReceiptSharing({ selectedTransaction, customer }) {
    const shareReceipt = async () => {
        if (!selectedTransaction.value) return;
        try {
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const trx = selectedTransaction.value;
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
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
                // Watermark Pattern
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

            let y = 20;
            const margin = 20;
            const contentWidth = pageWidth - (margin * 2);

            // 2. Header (Formal Enterprise Style)
            // Logo Left
            if (logoLoaded) {
                 doc.addImage(img, 'PNG', margin, y, 20, 20);
            }

            // Title Center-Right
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

            // Line Separator
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
            const dateStr = formatDateFull(dateVal);
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
            doc.text(`: ${trx._id.substring(0, 16).toUpperCase()}`, valX, y);

            doc.text("Tanggal", col2LabelX, y);
            doc.text(`: ${dateStr}`, col2ValX, y);
            y += 6;

            // Row 2
            doc.text("Nasabah", labelX, y);
            doc.text(`: ${customer.value?.name || '-'}`, valX, y);

            doc.text("Waktu", col2LabelX, y);
            doc.text(`: ${timeStr} WIB`, col2ValX, y);
            y += 6;

            // Row 3 (Merged logic)
            doc.text("Metode", labelX, y);
            doc.text(`: Tabungan`, valX, y);

            doc.text("No. Rekening", col2LabelX, y);
            doc.text(`: ${customer.value?.memberId || '-'}`, col2ValX, y);
            y += 15;

            // 4. Items Table (Green Header)
            const cols = [
                { header: 'Item', x: margin, w: 60 },
                { header: 'Berat (Kg)', x: margin + 60, w: 30, align: 'right' },
                { header: 'Harga/Kg', x: margin + 90, w: 40, align: 'right' },
                { header: 'Total (Rp)', x: margin + 130, w: 40, align: 'right' }
            ];

            // Header Background
            doc.setFillColor(22, 163, 74); // Green
            doc.rect(margin, y, contentWidth, 8, 'F');

            // Header Text
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

            // If no items (e.g. manual transaction), infer one
            if (items.length === 0) {
                items.push({
                    itemName: trx.title || 'Setor Sampah',
                    weight: trx.totalWeight || 0,
                    price: ((trx.amount || 0) / (trx.totalWeight || 1)), // Estimate
                    subtotal: trx.amount || 0
                });
            }

            items.forEach((item, i) => {
                const itemY = y + 6;

                cols.forEach((col, cIdx) => {
                    const xPos = col.align === 'right' ? col.x + col.w - 2 : col.x + 2;
                    let text = '';
                    if(cIdx === 0) text = item.itemName || item.name || '-';
                    if(cIdx === 1) text = (item.weight || 0).toString();
                    if(cIdx === 2) text = formatCurrency(item.price || item.customerPrice || 0).replace('Rp', '').trim();
                    if(cIdx === 3) text = formatCurrency(item.subtotal || (item.weight * item.price) || 0).replace('Rp', '').trim();

                    doc.text(text, xPos, itemY, { align: col.align || 'left' });
                });

                // Border bottom
                doc.setDrawColor(230);
                doc.line(margin, y + 8, pageWidth - margin, y + 8);

                totalAmount += Number(item.subtotal || (item.weight * item.price) || 0);
                y += 8;
            });

            // 5. Total
            y += 5;
            const finalTotal = trx.amount || totalAmount;

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(0); // BLACK COLOR requested
            // Moved label much further left (aligned with Price column) to avoid overlap with large numbers
            doc.text("Total Diterima:", margin + 90, y);

            doc.setFontSize(14);
            doc.setTextColor(0); // BLACK COLOR requested
            doc.text(formatCurrency(finalTotal), pageWidth - margin, y, { align: 'right' });

            // Terbilang
            y += 6;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(60);
            const textTerbilang = terbilang(finalTotal) + " Rupiah";
            doc.text(`(${textTerbilang})`, pageWidth - margin, y, { align: 'right' });

            y += 30;

            // 6. Footer (Signatures & Admin)
            const sigY = pageHeight - 50;

            doc.setFontSize(10);
            doc.setTextColor(60);
            doc.setFont('helvetica', 'normal');

            // Admin Signature
            doc.text("Petugas,", margin + 10, sigY, { align: 'center' });
            doc.text("Nasabah,", pageWidth - margin - 10, sigY, { align: 'center' });

            // Names - FIXED ADMIN NAME LOGIC
            const adminName = trx.officer || trx.adminName || (trx.admin && trx.admin.name) || "Admin Petugas";

            doc.setFont('helvetica', 'bold');
            doc.text("( " + adminName + " )", margin + 10, sigY + 25, { align: 'center' });
            doc.text("( " + (customer.value?.name || "Nasabah") + " )", pageWidth - margin - 10, sigY + 25, { align: 'center' });

            // Timestamp Footer
            const printTime = new Date().toLocaleString('id-ID');
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.setFont('helvetica', 'italic');
            doc.text(`Dicetak pada: ${printTime} oleh Sistem EcoBank`, pageWidth / 2, pageHeight - 10, { align: 'center' });

            // Save
            try {
                const pdfBlob = doc.output('blob');
                const file = new File([pdfBlob], `Bukti-Setor-${trx._id}.pdf`, { type: 'application/pdf' });

                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                     await navigator.share({
                         files: [file],
                         title: 'Bukti Setor Bank Sampah',
                         text: `Transaksi ${formatCurrency(trx.amount)}`
                     });
                } else {
                     doc.save(`Bukti-Setor-${trx._id}.pdf`);
                }
            } catch (outErr) {
                console.warn("Share/Save failed", outErr);
                doc.save(`Bukti-Setor-${trx._id}.pdf`);
            }
        } catch (e) {
            console.error("Receipt generation failed:", e);
            Swal.fire('Gagal', "Gagal memproses struk: " + e.message, 'error');
        }
    };

    return { shareReceipt };
}
