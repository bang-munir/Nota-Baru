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

type ReportType = 'harian' | 'mingguan' | 'bulanan' | 'tahunan';

export default function ReportsView({ transactions, products }: ReportsViewProps) {
  const [activeReportType, setActiveReportType] = useState<ReportType>('bulanan');

  // System reference date for filtering
  const SYSTEM_DATE = '2026-07-14';

  // Filter transactions based on selected range
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      switch (activeReportType) {
        case 'harian':
          return isToday(t.date, SYSTEM_DATE);
        case 'mingguan':
          return isThisWeek(t.date, SYSTEM_DATE);
        case 'bulanan':
          return isThisMonth(t.date, SYSTEM_DATE);
        case 'tahunan':
          return isThisYear(t.date, SYSTEM_DATE);
        default:
          return true;
      }
    });
  }, [transactions, activeReportType]);

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

    // Dark Sneat navy header banner
    doc.setFillColor(35, 35, 51);
    doc.rect(0, 0, 210, 40, 'F');

    // Title / App Info
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('Helvetica', 'bold');
    doc.text('Laporan Keuangan Toko', 15, 18);
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Aplikasi Buku Po • Sistem Informasi NotaDigital`, 15, 25);
    doc.text(`Diunduh Pada: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`, 15, 31);

    // Period Indicator on Right
    doc.setFontSize(15);
    doc.setFont('Helvetica', 'bold');
    doc.text(`PERIODE: ${activeReportType.toUpperCase()}`, 135, 18);
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Tanggal Sistem: ${formatDateIndo(SYSTEM_DATE)}`, 135, 25);

    // Stats Box background
    doc.setFillColor(245, 246, 248);
    doc.rect(15, 48, 180, 24, 'F');
    doc.setDrawColor(220, 224, 230);
    doc.rect(15, 48, 180, 24, 'S');

    // Stats Titles
    doc.setTextColor(100, 110, 120);
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'bold');
    doc.text('OMZET BELANJA', 20, 54);
    doc.text('TOTAL TERBAYAR', 65, 54);
    doc.text('SISA HUTANG', 110, 54);
    doc.text('TOTAL DISKON', 155, 54);

    // Stats Values
    doc.setTextColor(30, 30, 40);
    doc.setFontSize(10);
    doc.text(formatRupiah(totals.belanja), 20, 63);
    
    doc.setTextColor(16, 185, 129); // Success Green
    doc.text(formatRupiah(totals.dibayar), 65, 63);
    
    doc.setTextColor(217, 119, 6); // Warning Amber
    doc.text(formatRupiah(totals.hutang), 110, 63);
    
    doc.setTextColor(220, 38, 38); // Danger Red / Diskon
    doc.text(formatRupiah(totals.totalPotongan), 155, 63);

    // Detail Transactions Section Title
    doc.setTextColor(30, 30, 40);
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.text(`Rincian Transaksi Jurnal (${filteredTransactions.length} Transaksi)`, 15, 82);

    // Draw Table Header
    doc.setFillColor(35, 35, 51);
    doc.rect(15, 87, 180, 8, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'bold');
    doc.text('No Nota', 18, 92);
    doc.text('Barang & Qty', 62, 92);
    doc.text('Potongan', 120, 92);
    doc.text('Total Bersih', 154, 92);
    doc.text('Status', 180, 92);

    let currentY = 101;
    let rowIndex = 0;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(60, 60, 70);

    filteredTransactions.forEach((t) => {
      t.items.forEach((item) => {
        // Manage page overflow cleanly
        if (currentY > 275) {
          doc.addPage();
          currentY = 20;
          
          // Draw Header on new pages
          doc.setFillColor(35, 35, 51);
          doc.rect(15, 10, 180, 8, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(8);
          doc.setFont('Helvetica', 'bold');
          doc.text('No Nota', 18, 15);
          doc.text('Pelanggan', 42, 15);
          doc.text('Barang & Qty', 82, 15);
          doc.text('Potongan', 128, 15);
          doc.text('Total Bersih', 154, 15);
          doc.text('Status', 180, 15);
          currentY = 24;
        }

        // Zebra stripes for readability
        if (rowIndex % 2 === 0) {
          doc.setFillColor(250, 251, 252);
          doc.rect(15, currentY - 5, 180, 9, 'F');
        }

        // Draw horizontal line separator
        doc.setDrawColor(240, 240, 245);
        doc.line(15, currentY + 4, 195, currentY + 4);

        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(79, 70, 229);
        doc.setFontSize(8);
        doc.text(t.id, 18, currentY);

        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(30, 30, 40);

        const itemsLabel = `${item.productName} (${item.quantity}x)`;
        const itemsLabelTrunc = itemsLabel.length > 22 ? itemsLabel.substring(0, 19) + '...' : itemsLabel;
        doc.text(itemsLabelTrunc, 62, currentY);

        doc.text(t.totalDiscountAmount > 0 ? `-${formatRupiah(t.totalDiscountAmount)}` : '-', 120, currentY);
        
        doc.setFont('Helvetica', 'bold');
        doc.text(formatRupiah(t.totalBill), 154, currentY);

        // Status translation text
        doc.setFontSize(7);
        if (t.debtAmount === 0) {
          doc.setTextColor(16, 185, 129);
          doc.text('Lunas', 180, currentY);
        } else if (t.paidAmount === 0) {
          doc.setTextColor(239, 68, 68);
          doc.text('Hutang', 180, currentY);
        } else {
          doc.setTextColor(245, 158, 11);
          doc.text('Sisa Hutang', 180, currentY);
        }

        currentY += 9;
        rowIndex++;
      });
    });

    if (filteredTransactions.length === 0) {
      doc.setTextColor(130, 130, 140);
      doc.setFontSize(9);
      doc.text('Tidak ada data transaksi untuk range periode ini.', 105, currentY + 10, { align: 'center' });
    }

    // Standard footer references
    doc.setTextColor(150, 155, 165);
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'normal');
    doc.text('Laporan Keuangan otomatis diterbitkan oleh NotaDigital', 105, 280, { align: 'center' });

    // Download the document file immediately
    doc.save(`Laporan_${activeReportType}_2026-07-14.pdf`);
  };

  return (
    <div className="px-4 lg:px-6 space-y-6">
      
      <div>
        {/* Header & Export Controls - Sticky */}
        <div className="sticky top-0 z-30 mb-6 bg-white dark:bg-[#232333] p-5 rounded-2xl border border-[#e4e6e8] dark:border-[#43445b] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 no-print">
          
          {/* Filter Pills */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl gap-1 w-full md:w-auto">
            {(['harian', 'mingguan', 'bulanan', 'tahunan'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setActiveReportType(type)}
                className={`
                  flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all capitalize cursor-pointer
                  ${activeReportType === type 
                    ? 'bg-white dark:bg-[#232333] text-primary shadow-xs' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }
                `}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={handleExportExcel}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer transition-all"
            >
              <Download className="h-4 w-4" />
              <span>Ekspor Excel (.csv)</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer transition-all animate-pulse"
            >
              <Download className="h-4 w-4" />
              <span>Unduh PDF Laporan</span>
            </button>
          </div>

        </div>

        {/* Print Header Description */}
        <div className="hidden print:block text-center border-b pb-4 mb-4">
          <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-wide">Laporan Keuangan Toko</h1>
          <p className="text-xs text-slate-500 mt-1">Periode Laporan: {activeReportType.toUpperCase()} ({formatDateIndo(SYSTEM_DATE)})</p>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div className="bg-white dark:bg-[#232333] p-5 rounded-2xl border border-[#e4e6e8] dark:border-[#43445b] shadow-xs">
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Omzet Belanja ({activeReportType})</p>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">{formatRupiah(totals.belanja)}</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Total kotor belanja pelanggan</p>
          </div>

          <div className="bg-white dark:bg-[#232333] p-5 rounded-2xl border border-[#e4e6e8] dark:border-[#43445b] shadow-xs">
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Terbayar ({activeReportType})</p>
            <h3 className="text-lg font-bold text-success mt-1">{formatRupiah(totals.dibayar)}</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Dana lunas masuk kas toko</p>
          </div>

          <div className="bg-white dark:bg-[#232333] p-5 rounded-2xl border border-[#e4e6e8] dark:border-[#43445b] shadow-xs">
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sisa Hutang ({activeReportType})</p>
            <h3 className="text-lg font-bold text-warning mt-1">{formatRupiah(totals.hutang)}</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Tagihan yang belum lunas</p>
          </div>

          <div className="bg-white dark:bg-[#232333] p-5 rounded-2xl border border-[#e4e6e8] dark:border-[#43445b] shadow-xs">
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Diskon ({activeReportType})</p>
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
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Rincian Transaksi Jurnal ({filteredTransactions.length})</h4>
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
                    <th className="px-3 py-3 whitespace-nowrap">Qty</th>
                    <th className="px-3 py-3 text-right whitespace-nowrap">Potongan</th>
                    <th className="px-3 py-3 text-right whitespace-nowrap">Total</th>
                    <th className="px-3 py-3 text-right whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4e6e8] dark:divide-[#43445b]">
                  {filteredTransactions
                    .flatMap((t) => 
                      t.items.map((item, idx) => (
                        <tr key={`${t.id}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-3 py-2 font-mono font-bold text-primary whitespace-nowrap">{t.id}</td>
                          <td className="px-3 py-2 text-slate-500 dark:text-slate-400 whitespace-nowrap text-[10px]">{formatDateIndo(t.date).split(' ')[0]}</td>
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-300 truncate max-w-[100px]">{item.productName}</td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-400 text-center whitespace-nowrap">{item.quantity}</td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {t.totalDiscountAmount > 0 ? `-${formatRupiah(t.totalDiscountAmount)}` : '-'}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">{formatRupiah(t.totalBill)}</td>
                          <td className="px-3 py-2 text-right">
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
                      ))
                    )}

                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-12 text-center text-slate-400 dark:text-slate-500">
                        Tidak ada transaksi dalam range periode lapor '{activeReportType}' yang dipilih.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View Cards (Zero horizontal scroll) */}
            <div className="md:hidden divide-y divide-[#e4e6e8] dark:divide-[#43445b]/50">
              {filteredTransactions
                .flatMap((t) => 
                  t.items.map((item, idx) => (
                    <div 
                      key={`${t.id}-${idx}`} 
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
                        <div className="flex justify-between items-start gap-4">
                          <span className="text-slate-400 font-medium shrink-0">Barang & Qty:</span>
                          <div className="text-right">
                            <p className="font-semibold text-slate-700 dark:text-slate-300">{item.productName}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{item.quantity} x {formatRupiah(item.priceAtSale)}</p>
                          </div>
                        </div>

                        {t.totalDiscountAmount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">Diskon Potongan:</span>
                            <span className="font-mono text-danger font-bold">-{formatRupiah(t.totalDiscountAmount)}</span>
                          </div>
                        )}

                        <div className="flex justify-between border-t border-slate-200/50 dark:border-slate-700/50 pt-2 font-bold">
                          <span className="text-slate-500">Total Bersih:</span>
                          <span className="font-mono text-primary dark:text-indigo-400 text-sm">{formatRupiah(t.totalBill)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}

              {filteredTransactions.length === 0 && (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                  Tidak ada transaksi dalam range periode lapor '{activeReportType}' yang dipilih.
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
