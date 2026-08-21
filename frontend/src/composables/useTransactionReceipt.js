import jsPDF from 'jspdf';
import { terbilang } from '@/utils/formatters';

export function useTransactionReceipt({ selectedTransaction, formatCurrency, formatWeight, formatNumber, formatDate }) {
  const generateReceiptPDF = async () => {
    if (!selectedTransaction.value) return;

    const trx = selectedTransaction.value;
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
    const dateStr = formatDate(dateVal); // Use local formatDate
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
    return doc;
  };

  return { generateReceiptPDF };
}
