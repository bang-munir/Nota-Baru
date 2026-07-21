import React, { useState, useMemo } from 'react';
import { Transaction, Product } from '../types';
import { formatRupiah, formatDateIndo, isToday, isThisWeek, isThisMonth, isThisYear } from '../utils';
import { 
  FileText, 
  Calendar, 
  ArrowUpRight, 
  Download, 
  Eye, 
  BookOpen, 
  Printer, 
  Filter,
  HelpCircle,
  Package
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface ReportsViewProps {
  transactions: Transaction[];
  products: Product[];
}

type ReportType = 'semua' | 'mingguan' | 'bulanan' | 'custom';

export default function ReportsView({ transactions, products }: ReportsViewProps) {
  const [activeReportType, setActiveReportType] = useState<ReportType>('semua');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // System reference date for filtering
  const SYSTEM_DATE = '2026-07-14';

  // Filter transactions based on selected range
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        switch (activeReportType) {
          case 'mingguan':
            return isThisWeek(t.date, SYSTEM_DATE);
          case 'bulanan':
            return isThisMonth(t.date, SYSTEM_DATE);
          case 'custom':
            if (!startDate && !endDate) return true;
            let match = true;
            if (startDate && t.date < startDate) match = false;
            if (endDate && t.date > endDate) match = false;
            return match;
          case 'semua':
          default:
            return true;
        }
      })
      .sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return b.id.localeCompare(a.id);
      });
  }, [transactions, activeReportType, startDate, endDate]);

  const getPeriodLabel = () => {
    switch (activeReportType) {
      case 'mingguan': return 'Minggu Ini';
      case 'bulanan': return 'Bulan Ini';
      case 'custom': 
        if (startDate && endDate) {
          return `${formatDateIndo(startDate)} s/d ${formatDateIndo(endDate)}`;
        } else if (startDate) {
          return `Mulai ${formatDateIndo(startDate)}`;
        } else if (endDate) {
          return `Hingga ${formatDateIndo(endDate)}`;
        }
        return 'Tanggal Kustom';
      case 'semua':
      default: return 'Semua Periode';
    }
  };

  // Calculations for reports
  const totals = useMemo(() => {
    let belanja = 0;
    let dibayar = 0;
    let hutang = 0;
    let totalPotongan = 0;

    filteredTransactions.forEach(t => {
      belanja += t.totalBill;
      dibayar += t.paidAmount;
      hutang += t.debtAmount;
      totalPotongan += t.totalDiscountAmount;
    });

    return {
      belanja,
      dibayar,
      hutang,
      totalPotongan
    };
  }, [filteredTransactions]);

  // Aggregate product quantities sold for active period
  const productQuantities = useMemo(() => {
    const counts: { [productName: string]: number } = {};
    filteredTransactions.forEach((t) => {
      // Aggregate all items in the transaction
      t.items.forEach((item) => {
        counts[item.productName] = (counts[item.productName] || 0) + item.quantity;
      });
    });
    return Object.entries(counts)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty);
  }, [filteredTransactions]);

  const totalProductQty = useMemo(() => {
    return productQuantities.reduce((acc, curr) => acc + curr.qty, 0);
  }, [productQuantities]);

  // Export CSV for Excel
  const handleExportExcel = () => {
    // Generate headers
    const headers = ['No Nota', 'Tanggal', 'Barang', 'Qty', 'Harga Satuan', 'Potongan', 'Total Bersih', 'Dibayar', 'Hutang'];
    
    // Generate rows
    const rows = filteredTransactions
      .flatMap(t => 
        t.items.map(item => [
          t.id,
          t.date,
          item.productName,
          item.quantity,
          item.priceAtSale,
          t.totalDiscountAmount,
          t.totalBill,
          t.paidAmount,
          t.debtAmount
        ])
      );

    // Combine CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NotaDigital_Laporan_${activeReportType}_2026-07-14.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF directly as a file without print preview to accommodate mobile browsers (Android/iOS)
  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Compact dark navy header banner (reduced from 40 to 24)
    doc.setFillColor(35, 35, 51);
    doc.rect(0, 0, 210, 24, 'F');

    // Title / App Info
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.text('Rekap Laporan', 15, 15);
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Aplikasi Buku Po • Sistem Informasi NotaDigital`, 15, 20);

    // Period Indicator on Right
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'bold');
    doc.text(`PERIODE: ${getPeriodLabel().toUpperCase()}`, 135, 14);
    doc.setFontSize(7.5);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Tanggal Sistem: ${formatDateIndo(SYSTEM_DATE)}`, 135, 19);

    // Stats Box background (extremely compact, reduced height to 16)
    doc.setFillColor(245, 246, 248);
    doc.rect(15, 30, 180, 16, 'F');
    doc.setDrawColor(220, 224, 230);
    doc.rect(15, 30, 180, 16, 'S');

    // Stats Titles (size 7.5, adjusted top padding, distributed across 3 columns)
    doc.setTextColor(100, 110, 120);
    doc.setFontSize(7.5);
    doc.setFont('Helvetica', 'bold');
    doc.text('TOTAL TERBAYAR', 20, 35);
    doc.text('SISA HUTANG', 80, 35);
    doc.text('TOTAL POTONGAN', 140, 35);

    // Stats Values (size 9, distributed across 3 columns)
    doc.setFontSize(9);
    
    doc.setTextColor(16, 185, 129); // Success Green
    doc.text(formatRupiah(totals.dibayar), 20, 41);
    
    doc.setTextColor(217, 119, 6); // Warning Amber
    doc.text(formatRupiah(totals.hutang), 80, 41);
    
    doc.setTextColor(220, 38, 38); // Danger Red / Diskon
    doc.text(formatRupiah(totals.totalPotongan), 140, 41);

    // Detail Transactions Section Title
    doc.setTextColor(30, 30, 40);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'bold');
    doc.text(`Rincian Transaksi (${filteredTransactions.length} Transaksi)`, 15, 53);

    // Draw Table Header (more compact, height 6)
    doc.setFillColor(35, 35, 51);
    doc.rect(15, 57, 180, 6, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('Helvetica', 'bold');
    doc.text('No Nota', 16, 61.5);
    doc.text('Barang & Qty', 38, 61.5);
    doc.text('Subtotal', 84, 61.5);
    doc.text('Potongan (Rincian)', 108, 61.5);
    doc.text('Total Potongan', 138, 61.5);
    doc.text('Total Bersih', 162, 61.5);
    doc.text('Status', 184, 61.5);

    let currentY = 67;
    let rowIndex = 0;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(60, 60, 70);

    filteredTransactions.forEach((t) => {
      // Calculate row height based on whichever list has more items (items or discounts)
      const maxSubLines = Math.max(t.items.length, t.discounts ? t.discounts.length : 0, 1);
      const rowHeight = Math.max(8.5, maxSubLines * 6.5 + 1);

      // Manage page overflow cleanly (more space on page used, limit 282)
      if (currentY + rowHeight > 282) {
        doc.addPage();
        currentY = 20;
        
        // Draw Header on new pages
        doc.setFillColor(35, 35, 51);
        doc.rect(15, 10, 180, 6, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7.5);
        doc.setFont('Helvetica', 'bold');
        doc.text('No Nota', 16, 14);
        doc.text('Barang & Qty', 38, 14);
        doc.text('Subtotal', 84, 14);
        doc.text('Potongan (Rincian)', 108, 14);
        doc.text('Total Potongan', 138, 14);
        doc.text('Total Bersih', 162, 14);
        doc.text('Status', 184, 14);
        currentY = 20;
      }

      // Zebra stripes for readability
      if (rowIndex % 2 === 0) {
        doc.setFillColor(250, 251, 252);
        doc.rect(15, currentY - 3, 180, rowHeight, 'F');
      }

      // Draw horizontal line separator
      doc.setDrawColor(240, 240, 245);
      doc.line(15, currentY + rowHeight - 3, 195, currentY + rowHeight - 3);

      // No Nota
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(79, 70, 229);
      doc.setFontSize(7.5);
      doc.text(t.id, 16, currentY + 1);

      // Barang & Qty (drawn with product name on top line and details on the second line)
      t.items.forEach((item, idx) => {
        // Line 1: Product Name
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(30, 30, 40);
        doc.setFontSize(7.5);
        const nameTextTrunc = item.productName.length > 34 ? item.productName.substring(0, 31) + '...' : item.productName;
        doc.text(nameTextTrunc, 38, currentY + 1 + (idx * 6.5));

        // Line 2: Quantity & Price
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(110, 115, 125);
        doc.setFontSize(6.5);
        const qtyText = `(${item.quantity}x @ ${formatRupiah(item.priceAtSale)})`;
        doc.text(qtyText, 38, currentY + 1 + (idx * 6.5) + 3);
      });

      // Subtotal (before discount)
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(30, 30, 40);
      doc.setFontSize(7.5);
      const subtotalVal = t.totalPrice !== undefined ? t.totalPrice : (t.totalBill + t.totalDiscountAmount);
      doc.text(formatRupiah(subtotalVal), 84, currentY + 1);

      // Rincian Potongan (drawn with description on top line and amount on the second line)
      if (t.discounts && t.discounts.length > 0) {
        t.discounts.forEach((d, idx) => {
          // Line 1: Discount description
          doc.setFont('Helvetica', 'normal');
          doc.setTextColor(220, 38, 38);
          doc.setFontSize(7.5);
          const descText = d.description || 'Potongan';
          const descTextTrunc = descText.length > 22 ? descText.substring(0, 19) + '...' : descText;
          doc.text(descTextTrunc, 108, currentY + 1 + (idx * 6.5));

          // Line 2: Discount amount
          doc.setFont('Helvetica', 'normal');
          doc.setTextColor(220, 38, 38);
          doc.setFontSize(6.5);
          const amtText = `(-${formatRupiah(d.amount)})`;
          doc.text(amtText, 108, currentY + 1 + (idx * 6.5) + 3);
        });
      } else {
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(120, 120, 130);
        doc.setFontSize(7.5);
        doc.text('-', 108, currentY + 1);
      }

      // Total Potongan
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      doc.text(t.totalDiscountAmount > 0 ? `-${formatRupiah(t.totalDiscountAmount)}` : '-', 138, currentY + 1);

      // Total Bersih
      doc.setTextColor(30, 30, 40);
      doc.text(formatRupiah(t.totalBill), 162, currentY + 1);

      // Status
      doc.setFontSize(6.5);
      if (t.debtAmount === 0) {
        doc.setTextColor(16, 185, 129);
        doc.text('Lunas', 184, currentY + 1);
      } else if (t.paidAmount === 0) {
        doc.setTextColor(239, 68, 68);
        doc.text('Hutang', 184, currentY + 1);
      } else {
        doc.setTextColor(245, 158, 11);
        doc.text('Sisa Hutang', 184, currentY + 1);
      }

      currentY += rowHeight;
      rowIndex++;
    });

    if (filteredTransactions.length === 0) {
      doc.setTextColor(130, 130, 140);
      doc.setFontSize(8);
      doc.text('Tidak ada data transaksi untuk range periode ini.', 105, currentY + 8, { align: 'center' });
    }

    // Standard footer references
    doc.setTextColor(150, 155, 165);
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'normal');
    doc.text('Laporan Keuangan otomatis diterbitkan oleh NotaDigital', 105, 280, { align: 'center' });

    // Download the document file immediately
    doc.save(`Laporan_${getPeriodLabel().replace(/\s+/g, '_')}_2026-07-14.pdf`);
  };

  return (
    <div className="px-4 lg:px-6 space-y-6">
      
      <div>
        {/* Header & Export Controls - Sticky */}
        <div className="sticky top-0 z-30 mb-6 bg-white dark:bg-[#232333] p-4 sm:p-5 rounded-2xl border border-[#e4e6e8] dark:border-[#43445b] shadow-xs flex flex-col xl:flex-row items-center justify-between gap-4 no-print">
          
          {/* Filter Pills & Custom Inputs */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full xl:w-auto">
            <div className="grid grid-cols-2 sm:flex sm:flex-row bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl gap-1 w-full md:w-auto">
              {(['semua', 'mingguan', 'bulanan', 'custom'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setActiveReportType(type);
                    if (type !== 'custom') {
                      setStartDate('');
                      setEndDate('');
                    }
                  }}
                  className={`
                    px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all capitalize cursor-pointer whitespace-nowrap text-center
                    ${activeReportType === type 
                      ? 'bg-white dark:bg-[#232333] text-primary shadow-xs' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                    }
                  `}
                >
                  {type === 'semua' ? 'Semua' : type === 'mingguan' ? 'Minggu Ini' : type === 'bulanan' ? 'Bulan Ini' : 'Pilih Tanggal'}
                </button>
              ))}
            </div>

            {/* Custom Date Pickers */}
            {activeReportType === 'custom' && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 dark:bg-[#1e1e2d] p-1.5 rounded-xl border border-slate-200/60 dark:border-[#43445b] w-full md:w-auto">
                <div className="flex items-center gap-1.5 min-w-0 flex-1 sm:flex-none">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0 pl-1">Dari:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-2 py-1 text-xs rounded-md border border-[#e4e6e8] dark:border-[#43445b] bg-[#fff] dark:bg-[#232333] text-slate-700 dark:text-slate-100 focus:outline-hidden font-mono w-full sm:w-[110px]"
                  />
                </div>
                <div className="flex items-center gap-1.5 min-w-0 flex-1 sm:flex-none">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">Ke:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-2 py-1 text-xs rounded-md border border-[#e4e6e8] dark:border-[#43445b] bg-[#fff] dark:bg-[#232333] text-slate-700 dark:text-slate-100 focus:outline-hidden font-mono w-full sm:w-[110px]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto shrink-0 justify-end">
            <button
              onClick={handleExportExcel}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer transition-all"
            >
              <Download className="h-4 w-4" />
              <span>Ekspor Excel (.csv)</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer transition-all animate-pulse"
            >
              <Download className="h-4 w-4" />
              <span>Unduh PDF Laporan</span>
            </button>
          </div>

        </div>

        {/* Print Header Description */}
        <div className="hidden print:block text-center border-b pb-4 mb-4">
          <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-wide">Rekap Laporan</h1>
          <p className="text-xs text-slate-500 mt-1">Periode Laporan: {getPeriodLabel().toUpperCase()} ({formatDateIndo(SYSTEM_DATE)})</p>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="bg-white dark:bg-[#232333] p-5 rounded-2xl border border-[#e4e6e8] dark:border-[#43445b] shadow-xs">
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Terbayar ({getPeriodLabel()})</p>
            <h3 className="text-lg font-bold text-success mt-1">{formatRupiah(totals.dibayar)}</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Dana lunas masuk kas toko</p>
          </div>

          <div className="bg-white dark:bg-[#232333] p-5 rounded-2xl border border-[#e4e6e8] dark:border-[#43445b] shadow-xs">
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sisa Hutang ({getPeriodLabel()})</p>
            <h3 className="text-lg font-bold text-warning mt-1">{formatRupiah(totals.hutang)}</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Tagihan yang belum lunas</p>
          </div>

          <div className="bg-white dark:bg-[#232333] p-5 rounded-2xl border border-[#e4e6e8] dark:border-[#43445b] shadow-xs">
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Potongan ({getPeriodLabel()})</p>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-1">{formatRupiah(totals.totalPotongan)}</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Akumulasi potongan harga diberikan</p>
          </div>

        </div>

        {/* Two Column Layout: Detailed Transactions (Left) & Product Sales Summary (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Detailed Transactions List Table */}
          <div className="lg:col-span-2 bg-white dark:bg-[#232333] rounded-2xl border border-[#e4e6e8] dark:border-[#43445b] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#e4e6e8] dark:border-[#43445b] flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Rincian Transaksi</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500">Daftar transaksi dalam range waktu terpilih</p>
              </div>
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                <Calendar className="h-4 w-4" />
              </div>
            </div>

            {/* Desktop View Table */}
            <div className="hidden md:block overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead className="sticky top-0 bg-slate-50 dark:bg-[#2b2c40] z-10">
                  <tr className="text-slate-500 dark:text-slate-400 font-bold border-b border-[#e4e6e8] dark:border-[#43445b] uppercase tracking-wider">
                    <th className="px-3 py-3 whitespace-nowrap">No Nota</th>
                    <th className="px-3 py-3 whitespace-nowrap">Tgl</th>
                    <th className="px-3 py-3 whitespace-nowrap">Barang</th>
                    <th className="px-3 py-3 text-center whitespace-nowrap">Total Qty</th>
                    <th className="px-3 py-3 text-right whitespace-nowrap">Potongan</th>
                    <th className="px-3 py-3 text-right whitespace-nowrap">Total</th>
                    <th className="px-3 py-3 text-right whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4e6e8] dark:divide-[#43445b]">
                  {filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-3 py-2.5 font-mono font-bold text-primary whitespace-nowrap">{t.id}</td>
                      <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap text-[10px]">{formatDateIndo(t.date).split(' ')[0]}</td>
                      <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300">
                        <div className="space-y-1">
                          {t.items.map((item, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{item.productName}</span>
                              <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({item.quantity}x @ {formatRupiah(item.priceAtSale)})</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 text-center font-bold whitespace-nowrap">
                        {t.items.reduce((sum, i) => sum + i.quantity, 0)} pcs
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {t.totalDiscountAmount > 0 ? `-${formatRupiah(t.totalDiscountAmount)}` : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">{formatRupiah(t.totalBill)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold inline-block whitespace-nowrap ${
                          t.debtAmount === 0 
                            ? 'bg-success/10 text-success' 
                            : t.paidAmount === 0 
                              ? 'bg-danger/10 text-danger' 
                              : 'bg-warning/10 text-warning'
                        }`}>
                          {t.debtAmount === 0 
                            ? 'Lunas' 
                            : t.paidAmount === 0 
                              ? 'Hutang' 
                              : `Sisa ${formatRupiah(t.debtAmount)}`
                          }
                        </span>
                      </td>
                    </tr>
                  ))}

                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-12 text-center text-slate-400 dark:text-slate-500">
                        Tidak ada transaksi dalam range periode lapor '{getPeriodLabel()}' yang dipilih.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View Cards (Zero horizontal scroll) */}
            <div className="md:hidden divide-y divide-[#e4e6e8] dark:divide-[#43445b]/50">
              {filteredTransactions.map((t) => (
                <div 
                  key={t.id} 
                  className="p-4 space-y-3 hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors"
                >
                  {/* Header: Nota and Date */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold text-primary dark:text-indigo-400 text-xs">#{t.id}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{formatDateIndo(t.date)}</p>
                    </div>
                    <div>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        t.debtAmount === 0 
                          ? 'bg-success/15 text-success' 
                          : t.paidAmount === 0 
                            ? 'bg-danger/15 text-danger' 
                            : 'bg-warning/15 text-warning'
                      }`}>
                        {t.debtAmount === 0 
                          ? 'Lunas' 
                          : t.paidAmount === 0 
                            ? 'Hutang' 
                            : `Sisa ${formatRupiah(t.debtAmount)}`
                        }
                      </span>
                    </div>
                  </div>

                  {/* Product and Price Details */}
                  <div className="bg-slate-50/75 dark:bg-[#1e1e2d]/50 p-3 rounded-xl space-y-2 text-xs border border-slate-100 dark:border-slate-800/30">
                    <div className="space-y-1.5">
                      <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider block">Daftar Barang:</span>
                      <div className="space-y-2">
                        {t.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-start gap-2 text-slate-700 dark:text-slate-300">
                            <span className="font-semibold truncate max-w-[150px]">{item.productName}</span>
                            <span className="font-mono text-slate-500 shrink-0 text-[10px]">{item.quantity}x @ {formatRupiah(item.priceAtSale)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {t.totalDiscountAmount > 0 && (
                      <div className="flex justify-between border-t border-slate-200/40 dark:border-slate-700/40 pt-2 text-[11px]">
                        <span className="text-slate-400">Potongan Diskon:</span>
                        <span className="font-mono text-danger font-bold">-{formatRupiah(t.totalDiscountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between border-t border-slate-200/50 dark:border-slate-700/50 pt-2 font-bold">
                      <span className="text-slate-500">Total Bersih:</span>
                      <span className="font-mono text-primary dark:text-indigo-400 text-sm">{formatRupiah(t.totalBill)}</span>
                    </div>
                  </div>
                </div>
              ))}

              {filteredTransactions.length === 0 && (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                  Tidak ada transaksi dalam range periode lapor '{getPeriodLabel()}' yang dipilih.
                </div>
              )}
            </div>
          </div>

          {/* Ringkasan Barang Terjual Card */}
          <div className="bg-white dark:bg-[#232333] rounded-2xl border border-[#e4e6e8] dark:border-[#43445b] shadow-xs overflow-hidden h-fit flex flex-col">
            <div className="p-5 border-b border-[#e4e6e8] dark:border-[#43445b] flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Ringkasan Barang Terjual</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500">Total kuantitas produk yang terjual</p>
              </div>
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                <Package className="h-4 w-4" />
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Total Qty sold header block */}
              <div className="bg-slate-50/70 dark:bg-slate-800/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Total Kuantitas</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm px-3 py-1 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg">{totalProductQty} pcs</span>
              </div>

              {/* Product list with Qty */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[360px] overflow-y-auto pr-1">
                {productQuantities.map((item, index) => (
                  <div key={item.name} className="flex justify-between items-center py-3 text-xs">
                    <div className="flex items-center gap-2.5 max-w-[70%]">
                      <span className="w-5 h-5 shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold text-slate-400">
                        {index + 1}
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                      {item.qty} Qty
                    </span>
                  </div>
                ))}

                {productQuantities.length === 0 && (
                  <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                    Tidak ada barang terjual pada periode ini.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
