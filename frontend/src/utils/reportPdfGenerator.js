import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate formal enterprise-level PDF report for weighing summary
 * @param {Object} reportData - Report data from API
 */
export const generateWeighingReportPDF = async (reportData, options = {}) => {
    // Initialize PDF with explicit A4 size (210mm x 297mm)
    const doc = new jsPDF('p', 'mm', 'a4');

    // Extract options
    const printedBy = options.printedBy || 'System';

    // Explicitly check and fallback page dimensions if necessary
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    let yPos = 12; // Start position - reduced from 20 to 12 for more dominant header
    const primaryColor = [41, 128, 185];
    const textColor = [44, 62, 80];

    // Generate Doc ID once for footer use
    const docId = `BS-LAP-${reportData.summary.dateRange.start.replace(/-/g, '').substring(0, 6)}-${Date.now().toString().slice(-3)}`;

    // ======================
    // FOOTER FUNCTION (for all pages)
    // ======================
    const addFooter = (pageNum) => {
        const printDate = new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Draw separator line above footer
        doc.setDrawColor(200, 200, 200); // Light gray
        doc.setLineWidth(0.3);
        doc.line(15, pageHeight - 12, pageWidth - 15, pageHeight - 12);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(120, 120, 120);
        doc.text(`Halaman ${pageNum}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
        doc.text(`Dicetak: ${printDate} | Oleh: ${printedBy}`, 15, pageHeight - 8);
        doc.text(`Doc ID: ${docId}`, pageWidth - 15, pageHeight - 8, { align: 'right' });
    };

    // Add footer to first page
    let currentPage = 1;
    addFooter(currentPage);

    // ======================
    // HEADER WITH LOGOS
    // ======================

    // Colors
    const secondaryColor = [39, 174, 96]; // Green

    const logoSize = 30; // Gas Berlin logo size
    const logoRwSize = 25; // RW logo size (slightly smaller)
    const headerTextStartY = yPos + 10; // Center text vertically with logos

    // Logo (left side) - aligned with title
    // Capturing logo for stamp usage later
    let stampLogoImg = null;

    // Logo (left side) - aligned with title
    try {
        const logoImg = await loadImage('//assets/ecobank-logo.png');
        if (logoImg) {
            stampLogoImg = logoImg; // Store for stamp
            doc.addImage(logoImg, 'PNG', 15, yPos, logoSize, logoSize);
        }
    } catch (error) {
        console.warn('Left logo could not be loaded:', error);
    }

    // Logo RW (right side) - aligned with left logo
    try {
        const logoRwImg = await loadImage('/logo-rw.png');
        if (logoRwImg) {
            // Position on right side with smaller size, vertically centered with left logo
            const rwYOffset = (logoSize - logoRwSize) / 2; // Center vertically
            doc.addImage(logoRwImg, 'PNG', pageWidth - 15 - logoRwSize, yPos + rwYOffset, logoRwSize, logoRwSize);
        }
    } catch (error) {
        console.warn('Right logo could not be loaded:', error);
    }

    // Header Text (center) - vertically centered with logos
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...textColor);
    doc.text('BANK SAMPAH GAS BERLIN RW 09', pageWidth / 2, headerTextStartY, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Kelurahan Bakti Jaya, Kecamatan Setu,', pageWidth / 2, headerTextStartY + 6, { align: 'center' });
    doc.text('Kota Tangerang Selatan, Provinsi Banten', pageWidth / 2, headerTextStartY + 11, { align: 'center' });

    // Decorative line
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.8);
    doc.line(15, yPos + logoSize + 3, pageWidth - 15, yPos + logoSize + 3);

    yPos += logoSize + 15;

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    doc.text('LAPORAN PENIMBANGAN', pageWidth / 2, yPos, { align: 'center' });

    yPos += 8; // Adjusted for better spacing

    // Period
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    const periodText = `Periode: ${formatDate(reportData.summary.dateRange.start)} s/d ${formatDate(reportData.summary.dateRange.end)}`;
    doc.text(periodText, pageWidth / 2, yPos, { align: 'center' });

    yPos += 18; // Increased from 12 to 18 for better spacing

    // ======================
    // EXECUTIVE SUMMARY
    // ======================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setFillColor(...primaryColor);
    doc.setTextColor(255, 255, 255);
    doc.rect(15, yPos, pageWidth - 30, 8, 'F');
    doc.text('RINGKASAN PENIMBANGAN', 17, yPos + 5.5);

    yPos += 13;

    // Summary boxes
    const boxWidth = (pageWidth - 40) / 4;
    const boxHeight = 18;
    const boxY = yPos;

    // Box 1: Customers
    drawSummaryBox(doc, 15, boxY, boxWidth, boxHeight,
        'Jumlah Nasabah',
        reportData.summary.customers.uniqueCustomers.toString(),
        `${reportData.summary.customers.totalTransactions} transaksi`,
        secondaryColor
    );

    // Box 2: Weight
    drawSummaryBox(doc, 15 + boxWidth + 2, boxY, boxWidth, boxHeight,
        'Total Berat',
        `${reportData.summary.weight.total.toFixed(2)} Kg`,
        'Total keseluruhan',
        primaryColor
    );

    // Box 3: Savings
    drawSummaryBox(doc, 15 + (boxWidth + 2) * 2, boxY, boxWidth, boxHeight,
        'Tabungan Nasabah',
        formatRupiah(reportData.summary.financial.customerSavings),
        'Disimpan di sistem',
        [243, 156, 18]
    );

    // Box 4: Profit
    drawSummaryBox(doc, 15 + (boxWidth + 2) * 3, boxY, boxWidth, boxHeight,
        'Kas Pengurus',
        formatRupiah(reportData.summary.financial.totalProfit),
        'Profit margin  ',
        [155, 89, 182]
    );

    yPos += boxHeight + 10;

    // ======================
    // DETAIL BERAT PER ITEM
    // ======================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setFillColor(...secondaryColor);
    doc.setTextColor(255, 255, 255);
    doc.rect(15, yPos, pageWidth - 30, 7, 'F');
    doc.text('DETAIL BERAT PER JENIS ITEM', 17, yPos + 5);

    yPos += 10;

    // Table for weight by item
    const weightTableData = reportData.details.weightByItem.map((item, index) => [
        index + 1,
        item.itemName,
        `${item.weight.toFixed(2)} Kg`,
        `${item.percentage}%`,
        formatRupiah(item.value)
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['No', 'Nama Item', 'Berat', '% Total', 'Nilai']],
        body: weightTableData.length > 0 ? weightTableData : [['—', 'Tidak ada data', '—', '—', '—']],
        theme: 'striped',
        headStyles: {
            fillColor: secondaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 10
        },
        bodyStyles: {
            fontSize: 9
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        margin: { left: 15, right: 15 },
        didDrawPage: (data) => {
            // Add footer to each new page created by autoTable
            if (data.pageNumber > currentPage) {
                currentPage = data.pageNumber;
                addFooter(currentPage);
            }
        }
    });

    // Safe update of yPos
    yPos = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 10 : yPos + 20;

    // Check if new page needed, prevent blank pages
    const footerReserve = 20; // Reserve space for footer
    if (yPos > pageHeight - footerReserve - 80) { // 80 is approx height of next section header + table
        doc.addPage();
        currentPage++;
        addFooter(currentPage);
        yPos = 20;
    }

    // ======================
    // DISTRIBUSI PENGEPUL
    // ======================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setFillColor(...primaryColor);
    doc.setTextColor(255, 255, 255);
    doc.rect(15, yPos, pageWidth - 30, 7, 'F');
    doc.text('DISTRIBUSI PENYALURAN KE PENGEPUL', 17, yPos + 5);

    yPos += 10;

    // Table for collector distribution
    const collectorTableData = reportData.details.collectorDistribution.map((collector, index) => [
        index + 1,
        collector.collectorName,
        `${collector.weight.toFixed(2)} Kg`,
        `${collector.percentage}%`,
        `${collector.transactionCount} kali`
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['No', 'Nama Pengepul', 'Total Berat', '% Total', 'Frekuensi']],
        body: collectorTableData.length > 0 ? collectorTableData : [['—', 'Belum ada data terdistribusi', '—', '—', '—']],
        theme: 'striped',
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 10
        },
        bodyStyles: {
            fontSize: 9
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        margin: { left: 15, right: 15 },
        didDrawPage: (data) => {
            // Add footer to each new page created by autoTable
            if (data.pageNumber > currentPage) {
                currentPage = data.pageNumber;
                addFooter(currentPage);
            }
        }
    });

    // Safe update of yPos
    yPos = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 10 : yPos + 20;

    // Check if new page needed, prevent blank pages
    if (yPos > pageHeight - footerReserve - 60) { // 60 is approx height of next section header + table
        doc.addPage();
        currentPage++;
        addFooter(currentPage);
        yPos = 20;
    }

    // ======================
    // RINCIAN KEUANGAN
    // ======================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setFillColor(243, 156, 18);
    doc.setTextColor(255, 255, 255);
    doc.rect(15, yPos, pageWidth - 30, 7, 'F');
    doc.text('RINCIAN KEUANGAN', 17, yPos + 5);

    yPos += 10;

    const financialData = [
        ['Total Nilai Transaksi', formatRupiah(reportData.summary.financial.totalTransactionValue)],
        ['Tabungan Nasabah (Savings)', formatRupiah(reportData.summary.financial.customerSavings)],
        ['Pembayaran Tunai (Cash)', formatRupiah(reportData.summary.financial.cashPayments)],
        ['', ''], // divider
        ['Total Profit/Kas Pengurus', formatRupiah(reportData.summary.financial.totalProfit)],
        ['Pemasukan Kas dari Penjualan', formatRupiah(reportData.summary.financial.managementCash || 0)]
    ];

    autoTable(doc, {
        startY: yPos,
        body: financialData,
        theme: 'plain',
        bodyStyles: {
            fontSize: 10,
            textColor: textColor
        },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 80 },
            1: { halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 15, right: 15 },
        didDrawCell: (data) => {
            // Draw separator line for last total row
            if (data.row.index === 4) {
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.5);
                doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
            }
        },
        didDrawPage: (data) => {
            // Add footer to each new page created by autoTable
            if (data.pageNumber > currentPage) {
                currentPage = data.pageNumber;
                addFooter(currentPage);
            }
        }
    });

    // Safe update of yPos
    yPos = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 15 : yPos + 20;

    // ======================
    // SIGNATURE SECTION
    // ======================
    // Much tighter spacing - only 10mm gap instead of 40mm
    const signatureHeight = 35;
    const minBottomMargin = 15;
    const signatureStartY = pageHeight - minBottomMargin - signatureHeight;

    // Add new page if not enough space for signature, prevent blank pages
    if (yPos > signatureStartY - 5) {
        doc.addPage();
        currentPage++;
        addFooter(currentPage);
        yPos = 20;
    }

    // Place signature much closer to content (reduce gap)
    const finalSignatureY = Math.max(yPos + 10, signatureStartY); // Changed from +5 to +10

    // Signature area - left-aligned clean layout with space for manual signature
    const sigLeftEdge = pageWidth - 85; // Consistent left edge

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...textColor);

    // "Mengetahui," at the top (left-aligned) - Moved UP 5mm to avoid overlapping with stamp
    doc.text('Mengetahui,', sigLeftEdge, finalSignatureY - 5);

    // Signature line with MORE space (25mm below "Mengetahui," for manual signature)
    const signatureLineY = finalSignatureY + 25;
    doc.setDrawColor(...textColor);
    doc.setLineWidth(0.5);
    const lineLength = 60; // 60mm line width
    doc.line(sigLeftEdge, signatureLineY, sigLeftEdge + lineLength, signatureLineY);

    // "Ketua Bank Sampah Gas Berlin RW 09" centered below line (5mm spacing)
    const titleText = 'Ketua Bank Sampah Gas Berlin RW 09';
    doc.text(titleText, sigLeftEdge + (lineLength / 2), signatureLineY + 5, { align: 'center' });

    // ==========================================
    // OFFICIAL STAMP IMPLEMENTATION (RECTANGULAR)
    // ==========================================
    const addOfficialStamp = (x, y) => {
        const width = 55;
        const height = 22;
        const stampColor = [16, 152, 121]; // Emerald Green
        const opacityVal = 0.6; // Slightly more visible for rectangle

        // Start drawing from top-left relative to center point (x,y)
        const startX = x - (width / 2);
        const startY = y - (height / 2);

        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: opacityVal }));
        doc.setDrawColor(...stampColor);
        doc.setLineWidth(1.0);

        // Draw Main Rectangle with rounded corners
        doc.roundedRect(startX, startY, width, height, 1, 1, 'S');

        // Draw Inner Rectangle (creates double border effect)
        doc.setLineWidth(0.4);
        doc.roundedRect(startX + 1.5, startY + 1.5, width - 3, height - 3, 0.5, 0.5, 'S');

        // Draw Divider Line (Vertical) - separating Logo and Text
        // Position: 20mm from left
        const dividerX = startX + 20;
        doc.line(dividerX, startY + 1.5, dividerX, startY + height - 1.5);

        // Draw Logo (Left side)
        if (stampLogoImg) {
            // Position logo centrally in the left box (20mm width)
            // Logo size: 14x14mm
            const logoSize = 14;
            const logoX = startX + (20 - logoSize) / 2;
            const logoY = startY + (height - logoSize) / 2;
            doc.addImage(stampLogoImg, 'PNG', logoX, logoY, logoSize, logoSize);
        }

        // Draw Text (Right side)
        doc.setTextColor(...stampColor);
        doc.setFont('helvetica', 'bold');

        // "BANK SAMPAH"
        doc.setFontSize(9);
        doc.text('BANK SAMPAH', startX + 23, startY + 8);

        // "RW 09"
        doc.setFontSize(14); // Emphasize RW 09
        doc.text('RW 09', startX + 23, startY + 14);

        // "GASBERLIN" (Bottom)
        doc.setFontSize(8);
        doc.text('GASBERLIN', startX + 23, startY + 18.5);

        doc.restoreGraphicsState();
    };

    // Call stamp function - positioned exactly on signature line
    // Center logic: Signature line Y is signatureLineY.
    // Center X is sigLeftEdge + (lineLength / 2).
    // Call stamp function
    // MOVED UP FURTHER: signatureLineY - 15 (creates ~4mm gap above line)
    // OLD: signatureLineY - 10 (overlapped slightly)
    const stampX = sigLeftEdge + (lineLength / 2);
    const stampY = signatureLineY - 15;

    addOfficialStamp(stampX, stampY);

    // Update yPos after signature
    yPos = finalSignatureY + 35;

    // ======================
    // AI INSIGHT SECTION (AFTER SIGNATURE)
    // ======================
    const aiInsight = options.aiInsight || null;

    if (aiInsight && aiInsight.trim() !== '') {
        // Calculate ACTUAL height needed for AI insights
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        const maxWidth = pageWidth - 40;
        const lines = doc.splitTextToSize(aiInsight, maxWidth);
        const lineHeight = 5.5;
        const actualInsightHeight = 15 + (lines.length * lineHeight) + 12 + 10; // header + content + padding + buffer

        // Check if AI insights will overflow into footer area, prevent blank pages
        // DO NOT create blank pages - only move if content truly doesn't fit
        const footerReserve = 30; // Reserve 30mm for footer - increased from 20mm for better spacing
        if (yPos + actualInsightHeight > pageHeight - footerReserve) {
            // Move to new page
            doc.addPage();
            currentPage++;
            addFooter(currentPage);
            yPos = 20;
        }

        // Track start Y position for black frame border
        let aiFrameStartY = yPos;

        // Header bar with icon
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setFillColor(16, 152, 121); // Emerald/teal color
        doc.setTextColor(255, 255, 255);
        doc.rect(15, yPos, pageWidth - 30, 10, 'F');
        doc.text('AI INSIGHT & ANALISIS', pageWidth / 2, yPos + 7, { align: 'center' });

        yPos += 18; // Increased from 12 to 18 for better spacing between title and content

        // Smart line-by-line rendering with markdown support and page break handling
        let currentY = yPos;
        const leftMargin = 20;
        const bulletLeftMargin = 24; // Indent for bullets
        const lineSpacing = 6; // Space between lines

        // Parse and render each line
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // Check if we need a new page BEFORE rendering this line
            if (currentY + lineSpacing > pageHeight - footerReserve) {
                // Draw frame for current page before moving to next
                const currentPageFrameHeight = currentY - aiFrameStartY + 5;
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.5);
                doc.rect(15, aiFrameStartY, pageWidth - 30, currentPageFrameHeight, 'S');

                doc.addPage();
                currentPage++;
                addFooter(currentPage);
                currentY = 20;

                // Redraw header on new page
                const newPageFrameStart = currentY;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(13);
                doc.setFillColor(16, 152, 121);
                doc.setTextColor(255, 255, 255);
                doc.rect(15, currentY, pageWidth - 30, 10, 'F');
                doc.text('AI INSIGHT & ANALISIS', pageWidth / 2, currentY + 7, { align: 'center' });
                currentY += 18;

                // Update frame start for new page
                aiFrameStartY = newPageFrameStart;
            }

            // Determine if this line starts with a dash (bullet point)
            const isDash = line.trim().startsWith('-');
            const xPos = isDash ? bulletLeftMargin : leftMargin;

            // Clean the line (remove leading dash if present)
            let cleanLine = isDash ? line.trim().substring(1).trim() : line.trim();

            // Parse markdown bold: **text** -> render with bold
            // Split by ** markers
            const parts = cleanLine.split('**');

            if (parts.length > 1) {
                // Has bold markers
                let currentXpos = xPos;

                for (let j = 0; j < parts.length; j++) {
                    const part = parts[j];
                    if (part === '') continue;

                    // Odd indices are bold (between **)
                    const isBold = j % 2 === 1;

                    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
                    doc.setFontSize(11);
                    doc.setTextColor(...textColor);

                    // Measure text width to know where next part starts
                    const textWidth = doc.getTextWidth(part);
                    doc.text(part, currentXpos, currentY);
                    currentXpos += textWidth;
                }
            } else {
                // No bold markers, render normally
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.setTextColor(...textColor);

                // Add bullet point if this is a dash line
                if (isDash) {
                    doc.text('•', leftMargin, currentY); // Bullet character
                }

                doc.text(cleanLine, xPos, currentY);
            }

            currentY += lineSpacing;
        }

        // Draw black border frame around entire AI insights section
        const aiFrameEndY = currentY + 5;
        const aiFrameTotalHeight = aiFrameEndY - aiFrameStartY;

        doc.setDrawColor(0, 0, 0); // Black color
        doc.setLineWidth(0.5); // Thin, subtle border - reduced from 1.5 to 0.5
        doc.rect(15, aiFrameStartY, pageWidth - 30, aiFrameTotalHeight, 'S'); // S = stroke only

        yPos = currentY + 5;
    }

    // No standalone footer section - footer is added via addFooter() function

    // Save PDF
    const filename = `Laporan_Penimbangan_${reportData.summary.dateRange.start}_${reportData.summary.dateRange.end}.pdf`;
    doc.save(filename);
};

// ======================
// HELPER FUNCTIONS
// ======================

/**
 * Load image as base64
 */
const loadImage = (src) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
            console.warn(`Failed to load image: ${src}`);
            resolve(null); // Return null instead of rejecting
        };
        img.src = src;
    });
};

/**
 * Draw summary box
 */
const drawSummaryBox = (doc, x, y, width, height, label, value, subtitle, color) => {
    // Ensure all coordinates are finite numbers
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width) || !Number.isFinite(height)) {
        console.warn('Invalid coordinates in drawSummaryBox', { x, y, width, height });
        return;
    }

    // Box border
    doc.setDrawColor(...color);
    doc.setLineWidth(0.5);
    doc.rect(x, y, width, height);

    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(label, x + width / 2, y + 4, { align: 'center' });

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...color);
    doc.text(value, x + width / 2, y + 10, { align: 'center' });

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(subtitle, x + width / 2, y + 14, { align: 'center' });
};

/**
 * Format date to Indonesian
 */
const formatDate = (dateString) => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
};

/**
 * Format currency to Rupiah
 */
const formatRupiah = (amount) => {
    try {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    } catch (e) {
        return 'Rp 0';
    }
};

/**
 * Generate formal PDF report for Dinas Lingkungan Hidup (DLH)
 * Uses pelapakPrice for item values. Excludes kas pengurus, tabungan nasabah, cash payment details.
 * @param {Object} reportData - DLH report data from API
 * @param {Object} options - { printedBy }
 */
export const generateDLHReportPDF = async (reportData, options = {}) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const printedBy = options.printedBy || 'System';
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    let yPos = 12;
    const primaryColor = [41, 128, 185];
    const dlhColor = [39, 174, 96]; // Green — DLH identity
    const textColor = [44, 62, 80];

    const docId = `BS-DLH-${reportData.summary.dateRange.start.replace(/-/g, '').substring(0, 6)}-${Date.now().toString().slice(-3)}`;

    // Footer function
    const addFooter = (pageNum) => {
        const printDate = new Date().toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(15, pageHeight - 12, pageWidth - 15, pageHeight - 12);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(120, 120, 120);
        doc.text(`Halaman ${pageNum}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
        doc.text(`Dicetak: ${printDate} | Oleh: ${printedBy}`, 15, pageHeight - 8);
        doc.text(`Doc ID: ${docId}`, pageWidth - 15, pageHeight - 8, { align: 'right' });
    };

    let currentPage = 1;
    addFooter(currentPage);

    // === HEADER ===
    const logoSize = 30;
    const logoRwSize = 25;
    const headerTextStartY = yPos + 10;
    let stampLogoImg = null;

    try {
        const logoImg = await loadImage('//assets/ecobank-logo.png');
        if (logoImg) {
            stampLogoImg = logoImg;
            doc.addImage(logoImg, 'PNG', 15, yPos, logoSize, logoSize);
        }
    } catch (e) { console.warn('Left logo could not be loaded:', e); }

    try {
        const logoRwImg = await loadImage('/logo-rw.png');
        if (logoRwImg) {
            const rwYOffset = (logoSize - logoRwSize) / 2;
            doc.addImage(logoRwImg, 'PNG', pageWidth - 15 - logoRwSize, yPos + rwYOffset, logoRwSize, logoRwSize);
        }
    } catch (e) { console.warn('Right logo could not be loaded:', e); }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...textColor);
    doc.text('BANK SAMPAH GAS BERLIN RW 09', pageWidth / 2, headerTextStartY, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Kelurahan Bakti Jaya, Kecamatan Setu,', pageWidth / 2, headerTextStartY + 6, { align: 'center' });
    doc.text('Kota Tangerang Selatan, Provinsi Banten', pageWidth / 2, headerTextStartY + 11, { align: 'center' });

    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.8);
    doc.line(15, yPos + logoSize + 3, pageWidth - 15, yPos + logoSize + 3);

    yPos += logoSize + 15;

    // === TITLE ===
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...dlhColor);
    doc.text('LAPORAN PENIMBANGAN SAMPAH', pageWidth / 2, yPos, { align: 'center' });

    yPos += 7;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.text('GAS BERLIN RW 09', pageWidth / 2, yPos, { align: 'center' });

    yPos += 6;
    const periodText = `Periode: ${formatDate(reportData.summary.dateRange.start)} s/d ${formatDate(reportData.summary.dateRange.end)}`;
    doc.text(periodText, pageWidth / 2, yPos, { align: 'center' });

    yPos += 18;

    // === SUMMARY BOXES (3 box only — no kas/tabungan) ===
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setFillColor(...dlhColor);
    doc.setTextColor(255, 255, 255);
    doc.rect(15, yPos, pageWidth - 30, 8, 'F');
    doc.text('RINGKASAN PENIMBANGAN', 17, yPos + 5.5);
    yPos += 13;

    const boxWidth = (pageWidth - 36) / 3;
    const boxHeight = 18;

    drawSummaryBox(doc, 15, yPos, boxWidth, boxHeight,
        'Jumlah Nasabah',
        reportData.summary.customers.uniqueCustomers.toString(),
        `${reportData.summary.customers.totalTransactions} transaksi`,
        dlhColor
    );
    drawSummaryBox(doc, 15 + boxWidth + 3, yPos, boxWidth, boxHeight,
        'Total Berat',
        `${reportData.summary.weight.total.toFixed(2)} Kg`,
        'Total keseluruhan',
        primaryColor
    );
    drawSummaryBox(doc, 15 + (boxWidth + 3) * 2, yPos, boxWidth, boxHeight,
        'Nilai Sampah (Pengepul)',
        formatRupiah(reportData.summary.pelapakValue.totalValue),
        'Berdasarkan harga pengepul',
        [155, 89, 182]
    );

    yPos += boxHeight + 10;

    // === PER-COLLECTOR SECTIONS ===
    // New structure: reportData.byCollector[] — one section per collector
    const byCollector = reportData.byCollector || [];

    // Alternating header colors for each collector section
    const collectorColors = [
        [39, 174, 96],   // green (DLH color)
        [52, 152, 219],  // blue
        [155, 89, 182],  // purple
        [230, 126, 34],  // orange
        [26, 188, 156],  // teal
    ];

    for (let ci = 0; ci < byCollector.length; ci++) {
        const group = byCollector[ci];
        const sectionColor = collectorColors[ci % collectorColors.length];

        // Section header — Collector name
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setFillColor(...sectionColor);
        doc.setTextColor(255, 255, 255);
        doc.rect(15, yPos, pageWidth - 30, 8, 'F');
        doc.text(`PENGEPUL: ${group.collectorName.toUpperCase()}`, 17, yPos + 5.5);

        // Right-aligned mini stats in header
        const statsText = `${group.totalWeight.toFixed(2)} Kg  |  ${formatRupiah(group.totalPelapakValue)}  |  ${group.transactionCount} transaksi`;
        doc.setFontSize(8);
        doc.text(statsText, pageWidth - 17, yPos + 5.5, { align: 'right' });

        yPos += 10;

        const itemRows = group.weightByItem.map((item, idx) => [
            idx + 1,
            item.itemName,
            `${item.weight.toFixed(2)} Kg`,
            formatRupiah(item.avgPelapakPrice),
            formatRupiah(item.pelapakValue),
            `${item.percentage}%`
        ]);

        // Add subtotal row
        itemRows.push([
            '', 'TOTAL', `${group.totalWeight.toFixed(2)} Kg`, '—', formatRupiah(group.totalPelapakValue), '100%'
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['No', 'Nama Item', 'Berat', 'Harga Satuan', 'Total Nilai', '%']],
            body: itemRows.length > 1 ? itemRows : [['—', 'Tidak ada data', '—', '—', '—', '—']],
            theme: 'striped',
            headStyles: {
                fillColor: sectionColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 9
            },
            bodyStyles: { fontSize: 9 },
            alternateRowStyles: { fillColor: [245, 250, 245] },
            // Bold the subtotal row (last row)
            didParseCell: (data) => {
                if (data.row.index === itemRows.length - 1) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [220, 240, 220];
                }
            },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                2: { halign: 'right' },
                3: { halign: 'right' },
                4: { halign: 'right', fontStyle: 'bold' },
                5: { halign: 'right', cellWidth: 15 }
            },
            margin: { left: 15, right: 15 },
            didDrawPage: (data) => {
                if (data.pageNumber > currentPage) {
                    currentPage = data.pageNumber;
                    addFooter(currentPage);
                }
            }
        });

        yPos = (doc.lastAutoTable?.finalY ?? yPos + 20) + 8;

        // Page break before next collector if not enough space
        const footerReserve = 20;
        if (ci < byCollector.length - 1 && yPos > pageHeight - footerReserve - 50) {
            doc.addPage(); currentPage++; addFooter(currentPage); yPos = 20;
        }
    }

    // Fallback: no byCollector data
    if (byCollector.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text('Tidak ada data transaksi pada periode ini.', pageWidth / 2, yPos + 5, { align: 'center' });
        yPos += 20;
    }

    const footerReserve = 20;
    if (yPos > pageHeight - footerReserve - 60) {
        doc.addPage(); currentPage++; addFooter(currentPage); yPos = 20;
    }


    // === CATATAN ===
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setFillColor(236, 240, 241);
    doc.setTextColor(...textColor);
    doc.rect(15, yPos, pageWidth - 30, 7, 'F');
    doc.text('CATATAN', 17, yPos + 5);
    yPos += 12;

    const notes = [
        '1. Nilai sampah dihitung berdasarkan harga pengepul (harga pasar sampah), bukan harga yang dibayarkan kepada nasabah.',
        '2. Data bersumber dari sistem pencatatan digital Bank Sampah Gas Berlin RW 09.'
    ];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...textColor);
    notes.forEach(note => {
        const lines = doc.splitTextToSize(note, pageWidth - 35);
        doc.text(lines, 17, yPos);
        yPos += lines.length * 5 + 2;
    });

    yPos += 5;

    // === TANDA TANGAN ===
    const signatureHeight = 35;
    const minBottomMargin = 15;
    const signatureStartY = pageHeight - minBottomMargin - signatureHeight;

    if (yPos > signatureStartY - 5) {
        doc.addPage(); currentPage++; addFooter(currentPage); yPos = 20;
    }

    const finalSignatureY = Math.max(yPos + 10, signatureStartY);
    const sigLeftEdge = pageWidth - 85;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...textColor);
    doc.text('Mengetahui,', sigLeftEdge, finalSignatureY - 5);

    const signatureLineY = finalSignatureY + 25;
    doc.setDrawColor(...textColor);
    doc.setLineWidth(0.5);
    const lineLength = 60;
    doc.line(sigLeftEdge, signatureLineY, sigLeftEdge + lineLength, signatureLineY);
    const titleText = 'Ketua Bank Sampah Gas Berlin RW 09';
    doc.text(titleText, sigLeftEdge + (lineLength / 2), signatureLineY + 5, { align: 'center' });

    // Stamp
    const addOfficialStamp = (x, y) => {
        const width = 55, height = 22;
        const stampColor = [16, 152, 121];
        const startX = x - width / 2, startY = y - height / 2;
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.6 }));
        doc.setDrawColor(...stampColor);
        doc.setLineWidth(1.0);
        doc.roundedRect(startX, startY, width, height, 1, 1, 'S');
        doc.setLineWidth(0.4);
        doc.roundedRect(startX + 1.5, startY + 1.5, width - 3, height - 3, 0.5, 0.5, 'S');
        const dividerX = startX + 20;
        doc.line(dividerX, startY + 1.5, dividerX, startY + height - 1.5);
        if (stampLogoImg) {
            const lSize = 14;
            doc.addImage(stampLogoImg, 'PNG', startX + (20 - lSize) / 2, startY + (height - lSize) / 2, lSize, lSize);
        }
        doc.setTextColor(...stampColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('BANK SAMPAH', startX + 23, startY + 8);
        doc.setFontSize(14);
        doc.text('RW 09', startX + 23, startY + 14);
        doc.setFontSize(8);
        doc.text('GASBERLIN', startX + 23, startY + 18.5);
        doc.restoreGraphicsState();
    };

    addOfficialStamp(sigLeftEdge + lineLength / 2, signatureLineY - 15);

    // Save PDF
    const filename = `Laporan_DLH_${reportData.summary.dateRange.start}_${reportData.summary.dateRange.end}.pdf`;
    doc.save(filename);
};

/**
 * Generate formal PDF report for Nasabah breakdown (Customer Prices)
 * @param {Object} reportData - Report data from API containing details.customerBreakdown
 * @param {Object} options - { printedBy }
 */
export const generateNasabahReportPDF = async (reportData, options = {}) => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape mode
    const printedBy = options.printedBy || 'System';
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    let yPos = 12;
    const primaryColor = [41, 128, 185]; // Blue
    const textColor = [44, 62, 80];

    const docId = `BS-NSB-${reportData.summary.dateRange.start.replace(/-/g, '').substring(0, 6)}-${Date.now().toString().slice(-3)}`;

    // Footer function
    const addFooter = (pageNum) => {
        const printDate = new Date().toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(15, pageHeight - 12, pageWidth - 15, pageHeight - 12);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(120, 120, 120);
        doc.text(`Halaman ${pageNum}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
        doc.text(`Dicetak: ${printDate} | Oleh: ${printedBy}`, 15, pageHeight - 8);
        doc.text(`Doc ID: ${docId}`, pageWidth - 15, pageHeight - 8, { align: 'right' });
    };

    let currentPage = 1;
    addFooter(currentPage);

    // === HEADER ===
    const logoSize = 30;
    const logoRwSize = 25;
    const headerTextStartY = yPos + 10;
    let stampLogoImg = null;

    try {
        const logoImg = await loadImage('//assets/ecobank-logo.png');
        if (logoImg) {
            stampLogoImg = logoImg;
            doc.addImage(logoImg, 'PNG', 15, yPos, logoSize, logoSize);
        }
    } catch (e) { console.warn('Left logo could not be loaded:', e); }

    try {
        const logoRwImg = await loadImage('/logo-rw.png');
        if (logoRwImg) {
            const rwYOffset = (logoSize - logoRwSize) / 2;
            doc.addImage(logoRwImg, 'PNG', pageWidth - 15 - logoRwSize, yPos + rwYOffset, logoRwSize, logoRwSize);
        }
    } catch (e) { console.warn('Right logo could not be loaded:', e); }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...textColor);
    doc.text('BANK SAMPAH GAS BERLIN RW 09', pageWidth / 2, headerTextStartY, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Kelurahan Bakti Jaya, Kecamatan Setu,', pageWidth / 2, headerTextStartY + 6, { align: 'center' });
    doc.text('Kota Tangerang Selatan, Provinsi Banten', pageWidth / 2, headerTextStartY + 11, { align: 'center' });

    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.8);
    doc.line(15, yPos + logoSize + 3, pageWidth - 15, yPos + logoSize + 3);

    yPos += logoSize + 15;

    // === TITLE ===
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    doc.text('LAPORAN PENIMBANGAN NASABAH', pageWidth / 2, yPos, { align: 'center' });

    yPos += 7;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.text('BERDASARKAN HARGA NASABAH', pageWidth / 2, yPos, { align: 'center' });

    yPos += 6;
    const periodText = `Periode: ${formatDate(reportData.summary.dateRange.start)} s/d ${formatDate(reportData.summary.dateRange.end)}`;
    doc.text(periodText, pageWidth / 2, yPos, { align: 'center' });

    yPos += 18;

    // === SUMMARY BOXES ===
    const boxWidth = (pageWidth - 36) / 3;
    const boxHeight = 18;

    const customerBreakdown = reportData.details?.customerBreakdown || [];

    drawSummaryBox(doc, 15, yPos, boxWidth, boxHeight,
        'Nasabah Aktif',
        customerBreakdown.length.toString() || reportData.summary.customers.uniqueCustomers.toString(),
        `${reportData.summary.customers.totalTransactions} transaksi`,
        primaryColor
    );
    drawSummaryBox(doc, 15 + boxWidth + 3, yPos, boxWidth, boxHeight,
        'Total Sampah',
        `${reportData.summary.weight.total.toFixed(2)} Kg`,
        'Total penimbangan',
        [39, 174, 96]
    );
    drawSummaryBox(doc, 15 + (boxWidth + 3) * 2, yPos, boxWidth, boxHeight,
        'Total Uang Nasabah',
        formatRupiah(reportData.summary.financial.totalTransactionValue),
        'Total yang Diterima Warga',
        [243, 156, 18]
    );

    yPos += boxHeight + 15;

    // Build Table Rows
    const tableRows = [];
    for (const cust of customerBreakdown) {
        const items = cust.items || [];
        if (items.length === 0) continue;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            tableRows.push([
                i === 0 ? cust.customerAccountNumber : '',
                item.date || '-',
                i === 0 ? cust.customerName : '',
                item.itemName,
                `${item.weight.toFixed(2)} Kg`,
                formatRupiah(item.avgCustomerPrice),
                formatRupiah(item.value)
            ]);
        }
        tableRows.push([
            '',
            '',
            `Total ${cust.customerName}`,
            `${items.length} Jenis`,
            `${cust.totalWeight.toFixed(2)} Kg`,
            '—',
            formatRupiah(cust.totalValue)
        ]);
    }

    autoTable(doc, {
        startY: yPos,
        head: [['No. Rekening', 'Tanggal', 'Nama Nasabah', 'Jenis Sampah', 'Berat', 'Harga Nasabah', 'Uang Didapat']],
        body: tableRows.length > 0 ? tableRows : [['—', '—', 'Tidak ada data penimbangan', '—', '—', '—', '—']],
        theme: 'striped',
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9
        },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 251, 254] },
        didParseCell: (data) => {
            if (data.row.raw[2] && typeof data.row.raw[2] === 'string' && data.row.raw[2].startsWith('Total ')) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [225, 238, 250];
            }
        },
        columnStyles: {
            0: { cellWidth: 35, fontStyle: 'bold' },
            1: { cellWidth: 28, halign: 'center' },
            2: { cellWidth: 55, fontStyle: 'bold' },
            3: { cellWidth: 60 },
            4: { halign: 'right', cellWidth: 25 },
            5: { halign: 'right', cellWidth: 32 },
            6: { halign: 'right', fontStyle: 'bold', cellWidth: 32 }
        },
        margin: { left: 15, right: 15 },
        didDrawPage: (data) => {
            if (data.pageNumber > currentPage) {
                currentPage = data.pageNumber;
                addFooter(currentPage);
            }
        }
    });

    yPos = (doc.lastAutoTable?.finalY ?? yPos + 20) + 15;

    // Page break if signature doesn't fit
    const footerReserve = 40;
    if (yPos > pageHeight - footerReserve - 50) {
        doc.addPage(); currentPage++; addFooter(currentPage); yPos = 30;
    }

    // Signature
    const printDateStr = new Date().toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...textColor);

    const lineLength = 65;
    const sigLeftEdge = pageWidth - 15 - lineLength;
    const sigCenter = sigLeftEdge + lineLength / 2;

    doc.text(`Tangerang Selatan, ${printDateStr}`, sigCenter, yPos, { align: 'center' });
    doc.text('Pengurus Bank Sampah Gas Berlin', sigCenter, yPos + 5, { align: 'center' });

    const signatureLineY = yPos + 32;
    doc.setDrawColor(...textColor);
    doc.setLineWidth(0.4);
    doc.line(sigLeftEdge, signatureLineY, sigLeftEdge + lineLength, signatureLineY);
    doc.setFont('helvetica', 'bold');
    doc.text(printedBy, sigCenter, signatureLineY + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Admin / Petugas', sigCenter, signatureLineY + 9, { align: 'center' });

    // Stamp
    const addOfficialStamp = (x, y) => {
        const width = 55, height = 22;
        const stampColor = [16, 152, 121];
        const startX = x - width / 2, startY = y - height / 2;
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.6 }));
        doc.setDrawColor(...stampColor);
        doc.setLineWidth(1.0);
        doc.roundedRect(startX, startY, width, height, 1, 1, 'S');
        doc.setLineWidth(0.4);
        doc.roundedRect(startX + 1.5, startY + 1.5, width - 3, height - 3, 0.5, 0.5, 'S');
        const dividerX = startX + 20;
        doc.line(dividerX, startY + 1.5, dividerX, startY + height - 1.5);
        if (stampLogoImg) {
            const lSize = 14;
            doc.addImage(stampLogoImg, 'PNG', startX + (20 - lSize) / 2, startY + (height - lSize) / 2, lSize, lSize);
        }
        doc.setTextColor(...stampColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('BANK SAMPAH', startX + 23, startY + 8);
        doc.setFontSize(14);
        doc.text('RW 09', startX + 23, startY + 14);
        doc.setFontSize(8);
        doc.text('GASBERLIN', startX + 23, startY + 18.5);
        doc.restoreGraphicsState();
    };

    addOfficialStamp(sigCenter, signatureLineY - 15);

    // Save PDF
    const filename = `Laporan_Nasabah_${reportData.summary.dateRange.start}_${reportData.summary.dateRange.end}.pdf`;
    doc.save(filename);
};

export default {
    generateWeighingReportPDF,
    generateDLHReportPDF,
    generateNasabahReportPDF
};
