import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const formatRupiah = (val) => {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(val || 0);
};

/**
 * Generate PDF Price List (Compact 1-page format with fillable form fields)
 */
export const generatePriceListPDF = async (items, mode = 'collector', markupPercentage = 0) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 12;

    const primaryColor = [41, 128, 185];
    const textColor = [44, 62, 80];

    // Footer
    const addFooter = (pageNum) => {
        const printDate = new Date().toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(10, pageHeight - 10, pageWidth - 10, pageHeight - 10);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(120, 120, 120);
        doc.text(`Halaman ${pageNum}`, pageWidth / 2, pageHeight - 6, { align: 'center' });
        doc.text(`Dicetak: ${printDate}`, 10, pageHeight - 6);
        doc.text(`Bank Sampah Gas Berlin RW 09`, pageWidth - 10, pageHeight - 6, { align: 'right' });
    };

    addFooter(1);

    // Compact 1-line 10pt Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...textColor);
    const headerTitle = mode === 'collector'
        ? 'DAFTAR HARGA BARANG PENGEPUL'
        : 'DAFTAR HARGA BARANG NASABAH';
    doc.text(headerTitle, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8.5;

    // Fillable Form Fields (Nama & Alamat) right at the top
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(50, 50, 50);
    doc.text('Nama     :', 10, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text('.....................................................................................................................................................', 28, yPos);
    yPos += 5.5;

    doc.setFont('helvetica', 'bold');
    doc.text('Alamat   :', 10, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text('.....................................................................................................................................................', 28, yPos);
    yPos += 5.5;

    // Table
    const tableRows = items.map((item, idx) => {
        const catName = item.categoryId?.categoryName || '-';
        const pelapakPrice = item.pelapakPrice || 0;
        if (mode === 'collector') {
            return [idx + 1, item.itemCode, catName, item.itemName, formatRupiah(pelapakPrice), '', ''];
        } else {
            const custPrice = Math.round(pelapakPrice * (1 - (markupPercentage / 100)));
            return [idx + 1, item.itemCode, catName, item.itemName, formatRupiah(custPrice), '', ''];
        }
    });

    const priceHeader = mode === 'collector' ? 'Harga Pengepul / Kg' : 'Harga Nasabah / Kg';
    const head = [['No', 'Kode', 'Kategori', 'Nama Barang', priceHeader, 'Jumlah', 'Keterangan']];

    // Total width = 190mm (Fits A4 width 210mm with 10mm margins)
    // Kolom Jumlah (38mm) dibuat lebih panjang dari Keterangan (32mm) dan Harga (28mm)
    const colStyles = {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'center', cellWidth: 14, fontStyle: 'bold' },
        2: { halign: 'center', cellWidth: 23 },
        3: { cellWidth: 47 },
        4: { halign: 'center', fontStyle: 'bold', cellWidth: 28 },
        5: { cellWidth: 38 },
        6: { cellWidth: 32 }
    };

    autoTable(doc, {
        startY: yPos,
        head: head,
        body: tableRows.length > 0 ? tableRows : [['-', '-', '-', 'Tidak ada data barang', '-', '-', '-']],
        theme: 'grid',
        styles: {
            lineWidth: 0.2,
            lineColor: [160, 160, 160]
        },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            fontSize: 8,
            cellPadding: 1,
            lineWidth: 0.25,
            lineColor: [100, 100, 100],
            halign: 'center'
        },
        bodyStyles: {
            fontSize: 7.2,
            cellPadding: 0.6,
            textColor: [40, 40, 40]
        },
        alternateRowStyles: { fillColor: [248, 251, 254] },
        columnStyles: colStyles,
        margin: { left: 10, right: 10, bottom: 10 },
        didDrawPage: (data) => {
            if (doc.internal.getNumberOfPages() > 1) {
                addFooter(doc.internal.getNumberOfPages());
            }
        }
    });

    const fileName = mode === 'collector' ? 'Daftar_Harga_Pengepul.pdf' : 'Daftar_Harga_Nasabah.pdf';
    doc.save(fileName);
};

/**
 * Generate Excel Price List
 */
export const generatePriceListExcel = (items, mode = 'collector', markupPercentage = 0) => {
    const excelData = items.map((item, idx) => {
        const catName = item.categoryId?.categoryName || '-';
        const pelapakPrice = item.pelapakPrice || 0;
        const priceLabel = mode === 'collector' ? 'Harga Pengepul (Rp/Kg)' : 'Harga Nasabah (Rp/Kg)';
        const priceVal = mode === 'collector' ? pelapakPrice : Math.round(pelapakPrice * (1 - (markupPercentage / 100)));

        return {
            'No': idx + 1,
            'Kode Barang': item.itemCode,
            'Kategori': catName,
            'Nama Barang': item.itemName,
            [priceLabel]: priceVal,
            'Jumlah': '',
            'Keterangan': ''
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    const sheetTitle = mode === 'collector' ? 'Harga Pengepul' : 'Harga Nasabah';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetTitle);

    const fileName = mode === 'collector' ? 'Daftar_Harga_Pengepul.xlsx' : 'Daftar_Harga_Nasabah.xlsx';
    XLSX.writeFile(workbook, fileName);
};
