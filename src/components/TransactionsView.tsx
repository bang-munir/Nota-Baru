import React, { useState, useMemo } from 'react';
import { Transaction, Product, Discount, TransactionItem } from '../types';
import { formatRupiah, formatDateIndo } from '../utils';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  X, 
  Receipt, 
  Calendar, 
  ShoppingCart, 
  Tag, 
  Wallet, 
  AlertCircle,
  Eye,
  Check,
  PlusCircle,
  MinusCircle,
  Printer,
  ChevronRight,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';

// Helper to generate a clean, modern PDF receipt client-side
export const generateReceiptPDF = (t: Transaction) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Fonts & styling
  doc.setFont('Helvetica', 'normal');
  
  // Header banner
  doc.setFillColor(35, 35, 51); // Deep slate navy
  doc.rect(0, 0, 210, 40, 'F');
  
  // Header title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('Helvetica', 'bold');
  doc.text('NotaDigital', 15, 18);
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.text('Sistem Pencatatan Toko & Kasir Pintar (Buku Po)', 15, 25);
  doc.text('Email: minahsaminah451@gmail.com', 15, 31);
  
  // Invoice label
  doc.setFontSize(18);
  doc.setFont('Helvetica', 'bold');
  doc.text('NOTA INVOICE', 140, 18);
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  doc.text(`No: #${t.id}`, 140, 25);
  doc.text(`Tanggal: ${formatDateIndo(t.date)}`, 140, 31);

  // Divider line
  doc.setDrawColor(220, 220, 225);
  doc.setLineWidth(0.4);
  doc.line(15, 50, 195, 50);


  
  // Reference info
  doc.setTextColor(110, 115, 125);
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'bold');
  doc.text('TANGGAL CETAK:', 15, 58);
  
  doc.setTextColor(30, 30, 40);
  doc.setFontSize(11);
  doc.setFont('Helvetica', 'bold');
  doc.text(new Date().toLocaleDateString('id-ID'), 15, 64);

  // Table header block
  doc.setFillColor(245, 246, 248);
  doc.rect(15, 80, 180, 10, 'F');
  
  doc.setTextColor(80, 90, 100);
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'bold');
  doc.text('Deskripsi Produk / Barang', 20, 86);
  doc.text('Qty', 105, 86);
  doc.text('Harga Satuan', 130, 86);
  doc.text('Total', 170, 86);

  // Row line
  doc.setDrawColor(230, 230, 235);
  doc.line(15, 90, 195, 90);

  let currentY = 102;

  // Render each item
  doc.setTextColor(30, 30, 40);
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');

  t.items.forEach((item, idx) => {
    const itemY = 97 + (idx * 8);
    doc.text(item.productName, 20, itemY);
    doc.text(String(item.quantity), 105, itemY);
    doc.text(formatRupiah(item.priceAtSale), 130, itemY);
    doc.text(formatRupiah(item.quantity * item.priceAtSale), 170, itemY);
    currentY = itemY + 8;
  });

  doc.line(15, currentY, 195, currentY);
  currentY += 5;

  // Render discounts
  if (t.discounts && t.discounts.length > 0) {
    doc.setFillColor(254, 242, 242); // Light red
    doc.rect(15, currentY, 180, 6 + (t.discounts.length * 6), 'F');
    
    doc.setTextColor(185, 28, 28);
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'bold');
    doc.text('POTONGAN:', 20, currentY + 4);
    
    doc.setFont('Helvetica', 'normal');
    t.discounts.forEach((disc: any, idx: number) => {
      const yOffset = currentY + 10 + (idx * 6);
      doc.text(`• ${disc.description}`, 22, yOffset);
      doc.text(`-${formatRupiah(disc.amount)}`, 170, yOffset);
    });

    currentY += 12 + (t.discounts.length * 6);
  }

  // Totals layout
  currentY += 5;
  doc.setDrawColor(220, 220, 225);
  doc.line(110, currentY, 195, currentY);
  
  const addTotalLine = (label: string, value: string, isBold = false, isIndigo = false) => {
    currentY += 6;
    doc.setFontSize(9);
    if (isBold) {
      doc.setFont('Helvetica', 'bold');
    } else {
      doc.setFont('Helvetica', 'normal');
    }
    
    if (isIndigo) {
      doc.setTextColor(79, 70, 229);
    } else {
      doc.setTextColor(60, 60, 70);
    }
    
    doc.text(label, 115, currentY);
    doc.text(value, 170, currentY);
  };

  addTotalLine('Subtotal Harga', formatRupiah(t.totalProductPrice));
  if (t.totalDiscountAmount > 0) {
    addTotalLine('Total Potongan', `-${formatRupiah(t.totalDiscountAmount)}`);
  }
  addTotalLine('Total Tagihan', formatRupiah(t.totalBill), true, true);
  if (t.paidAmount > 0) {
    addTotalLine('Sudah Dibayar', formatRupiah(t.paidAmount));
  }
  if (t.debtAmount > 0) {
    addTotalLine('Sisa Hutang', formatRupiah(t.debtAmount), true);
  }

  // Status Badge visual stamp
  currentY += 14;
  if (t.debtAmount === 0) {
    doc.setDrawColor(16, 185, 129);
    doc.setFillColor(240, 253, 250);
    doc.rect(30, currentY - 8, 55, 12, 'FD');
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'bold');
    doc.text('LUNAS', 48, currentY);
  } else {
    doc.setDrawColor(245, 158, 11);
    doc.setFillColor(254, 243, 199);
    doc.rect(30, currentY - 8, 65, 14, 'FD');
    doc.setTextColor(217, 119, 6);
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'bold');
    doc.text('BELUM LUNAS', 48, currentY - 2);
    doc.setFontSize(7);
    doc.text(`Sisa: ${formatRupiah(t.debtAmount)}`, 38, currentY + 3);
  }

  // Footer references
  doc.setTextColor(150, 155, 165);
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'normal');

  // Native Save/Download triggers immediately
  doc.save(`Nota_${t.id}.pdf`);
};

interface TransactionsViewProps {
  transactions: Transaction[];
  products: Product[];
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'totalProductPrice' | 'totalDiscountAmount' | 'totalBill' | 'debtAmount'>) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export default function TransactionsView({
  transactions,
  products,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction
}: TransactionsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [paymentTransaction, setPaymentTransaction] = useState<Transaction | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');

  // Form states for multiple items
  const [date, setDate] = useState('2026-07-15');
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [discounts, setDiscounts] = useState<{ description: string; amount: number }[]>([]);
  const [paidAmount, setPaidAmount] = useState<number | ''>('');

  // Temp inputs for adding new item and discount
  const [tempItemProductId, setTempItemProductId] = useState('');
  const [tempItemQuantity, setTempItemQuantity] = useState<number | ''>('');
  const [tempDiscDesc, setTempDiscDesc] = useState('');
  const [tempDiscAmount, setTempDiscAmount] = useState<number | ''>('');

  // Search filter
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
      t.items.some(item => item.productName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [transactions, searchQuery]);

  // Calculations in form
  const formCalculations = useMemo(() => {
    const totalProductPrice = items.reduce((sum, item) => sum + (item.quantity * item.priceAtSale), 0);
    const totalDiscountAmount = discounts.reduce((sum, d) => sum + d.amount, 0);
    const totalBill = Math.max(totalProductPrice - totalDiscountAmount, 0);
    const paid = paidAmount === '' ? 0 : Number(paidAmount);
    const debtAmount = Math.max(totalBill - paid, 0);

    return {
      totalProductPrice,
      totalDiscountAmount,
      totalBill,
      debtAmount
    };
  }, [items, discounts, paidAmount]);

  // Add new item to transaction
  const handleAddItemRow = () => {
    if (!tempItemProductId || !tempItemQuantity || Number(tempItemQuantity) <= 0) return;
    
    const product = products.find(p => p.id === tempItemProductId);
    if (!product) return;

    const newItem: TransactionItem = {
      productId: tempItemProductId,
      productName: product.name,
      quantity: Number(tempItemQuantity),
      priceAtSale: product.price
    };

    setItems([...items, newItem]);
    setTempItemProductId('');
    setTempItemQuantity('');
  };

  // Remove item from transaction
  const handleRemoveItemRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Add discount row to form
  const handleAddDiscountRow = () => {
    if (!tempDiscDesc.trim() || tempDiscAmount === '' || tempDiscAmount <= 0) return;
    setDiscounts([...discounts, { description: tempDiscDesc.trim(), amount: Number(tempDiscAmount) }]);
    setTempDiscDesc('');
    setTempDiscAmount('');
  };

  // Remove discount row from form
  const handleRemoveDiscountRow = (index: number) => {
    setDiscounts(discounts.filter((_, i) => i !== index));
  };

  // Start Transaction Creation
  const openCreateModal = () => {
    setDate('2026-07-15');
    setItems([]);
    setDiscounts([]);
    setPaidAmount('');
    setTempItemProductId(products[0]?.id || '');
    setTempItemQuantity('');
    setTempDiscDesc('');
    setTempDiscAmount('');
    setIsAddModalOpen(true);
  };

  // Start Transaction Editing
  const startEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setDate(t.date);
    setItems(t.items.map(item => ({ ...item })));
    setDiscounts(t.discounts.map(d => ({ description: d.description, amount: d.amount })));
    setPaidAmount(t.paidAmount);
    setTempItemProductId('');
    setTempItemQuantity('');
    setTempDiscDesc('');
    setTempDiscAmount('');
  };

  // Handle Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    const discountList: Discount[] = discounts.map((d, index) => ({
      id: `d-form-${Date.now()}-${index}`,
      description: d.description,
      amount: d.amount
    }));

    const finalPaid = paidAmount === '' ? 0 : Number(paidAmount);

    if (editingTransaction) {
      // Create recalculated model
      const totalProductPrice = items.reduce((sum, item) => sum + (item.quantity * item.priceAtSale), 0);
      const totalDiscountAmount = discountList.reduce((sum, d) => sum + d.amount, 0);
      const totalBill = Math.max(totalProductPrice - totalDiscountAmount, 0);
      const debtAmount = Math.max(totalBill - finalPaid, 0);

      onEditTransaction({
        id: editingTransaction.id,
        date,
        items,
        discounts: discountList,
        paidAmount: finalPaid,
        totalProductPrice,
        totalDiscountAmount,
        totalBill,
        debtAmount
      });
      setEditingTransaction(null);
    } else {
      onAddTransaction({
        date,
        items,
        discounts: discountList,
        paidAmount: finalPaid
      });
      setIsAddModalOpen(false);
    }
  };

  // Trigger direct PDF Download
  const handlePrint = () => {
    if (viewingTransaction) {
      generateReceiptPDF(viewingTransaction);
    }
  };

  // Handle Payment for Hutang
  const handlePayment = () => {
    if (!paymentTransaction) return;
    
    const paymentValue = paymentAmount === '' ? 0 : Number(paymentAmount);
    if (paymentValue <= 0) return;

    const newPaidAmount = paymentTransaction.paidAmount + paymentValue;
    const newDebtAmount = Math.max(paymentTransaction.totalBill - newPaidAmount, 0);

    // Update the transaction with the new payment
    onEditTransaction({
      id: paymentTransaction.id,
      date: paymentTransaction.date,
      items: paymentTransaction.items,
      discounts: paymentTransaction.discounts,
      paidAmount: newPaidAmount,
      totalProductPrice: paymentTransaction.totalProductPrice,
      totalDiscountAmount: paymentTransaction.totalDiscountAmount,
      totalBill: paymentTransaction.totalBill,
      debtAmount: newDebtAmount
    });

    // Close modal and reset
    setPaymentTransaction(null);
    setPaymentAmount('');
  };

  return (
    <div className="px-4 lg:px-6 space-y-6">
      
      {/* Top Controls Card */}
      <div className="bg-white dark:bg-[#232333] p-5 rounded-2xl border border-[#e4e6e8] dark:border-[#43445b] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full sm:w-[320px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Cari transaksi (pelanggan/barang)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#e4e6e8] dark:border-[#43445b] bg-[#fff] dark:bg-[#1e1e2d] text-slate-700 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-primary transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Add Button */}
        <button
          onClick={openCreateModal}
          disabled={products.length === 0}
          className={`
            w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-white text-xs font-semibold rounded-lg shadow-md transition-all cursor-pointer
            ${products.length === 0 
              ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed shadow-none' 
              : 'bg-primary hover:bg-primary-hover shadow-primary/20'
            }
          `}
        >
          <Plus className="h-4 w-4" />
          <span>Transaksi Baru</span>
        </button>
      </div>

      {products.length === 0 && (
        <div className="p-4 bg-warning/15 border border-warning/20 text-warning rounded-xl text-xs flex items-center gap-2.5">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <strong className="font-bold">Belum ada produk!</strong> Anda harus menambahkan produk terlebih dahulu di menu <strong>Daftar Produk</strong> sebelum membuat transaksi baru.
          </div>
        </div>
      )}

      {/* Transactions Table Card */}
      <div className="bg-white dark:bg-[#232333] rounded-2xl border border-[#e4e6e8] dark:border-[#43445b] shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Daftar Transaksi Nota</h4>
          <span className="px-2.5 py-0.5 bg-primary/10 text-primary font-bold text-[10px] rounded-full">
            {filteredTransactions.length} Transaksi
          </span>
        </div>

        {/* Desktop View Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[768px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-[#202030]/50 border-b border-[#e4e6e8] dark:border-[#43445b] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">No. Nota</th>
                <th className="px-6 py-4">Barang</th>
                <th className="px-6 py-4 text-right">Potongan</th>
                <th className="px-6 py-4 text-right">Total Tagihan</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredTransactions.map((t) => (
                <tr 
                  key={t.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-[#2b2c40]/35 transition-colors"
                >
                  {/* ID and Name */}
                  <td className="px-6 py-4">
                    <div className="space-y-0.5">
                      <p className="font-mono font-bold text-slate-500 dark:text-slate-400 text-[10px]">#{t.id}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDateIndo(t.date)}</span>
                      </p>
                    </div>
                  </td>
                  
                  {/* Product Details - Show all items */}
                  <td className="px-6 py-4">
                    <div className="space-y-0.5">
                      {t.items.map((item, idx) => (
                        <div key={idx}>
                          <p className="font-semibold text-slate-800 dark:text-slate-300">{item.productName}</p>
                          <p className="text-[10px] text-slate-400">
                            {item.quantity}x @ {formatRupiah(item.priceAtSale)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* Discounts amount */}
                  <td className="px-6 py-4 text-right font-mono text-danger font-medium">
                    {t.totalDiscountAmount > 0 ? `-${formatRupiah(t.totalDiscountAmount)}` : '-'}
                  </td>

                  {/* Total payable bill */}
                  <td className="px-6 py-4 text-right font-mono font-bold text-slate-800 dark:text-slate-100">
                    {formatRupiah(t.totalBill)}
                  </td>

                  {/* Payment Status badge */}
                  <td className="px-6 py-4 text-center">
                    {t.debtAmount === 0 ? (
                      <span className="inline-flex px-2 py-0.5 bg-success/15 text-success font-bold text-[10px] rounded-sm uppercase tracking-wide">
                        Lunas
                      </span>
                    ) : (
                      <div className="space-y-0.5">
                        <span className="inline-flex px-2 py-0.5 bg-warning/15 text-warning font-bold text-[10px] rounded-sm uppercase tracking-wide">
                          Hutang
                        </span>
                        <p className="text-[9px] text-danger font-mono font-bold">-{formatRupiah(t.debtAmount)}</p>
                      </div>
                    )}
                  </td>

                  {/* Action Buttons */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      {/* Lunasi Button - Show only if there's debt */}
                      {t.debtAmount > 0 && (
                        <button
                          onClick={() => {
                            setPaymentTransaction(t);
                            setPaymentAmount('');
                          }}
                          className="px-2 py-1 text-[10px] font-bold text-white bg-success hover:bg-emerald-600 rounded-lg transition-all cursor-pointer"
                          title="Lunasi Hutang"
                        >
                          Lunasi
                        </button>
                      )}

                      <button
                        onClick={() => setViewingTransaction(t)}
                        className="p-1.5 text-slate-500 hover:text-info hover:bg-info/10 rounded-lg transition-all cursor-pointer"
                        title="Detail Nota"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => generateReceiptPDF(t)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg transition-all cursor-pointer"
                        title="Unduh PDF"
                      >
                        <Download className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => startEdit(t)}
                        className="p-1.5 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer"
                        title="Edit Transaksi"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => setDeletingId(t.id)}
                        className="p-1.5 text-slate-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-all cursor-pointer"
                        title="Hapus Transaksi"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    Tidak ada transaksi ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View Cards (Zero horizontal scroll) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredTransactions.map((t) => (
            <div 
              key={t.id} 
              className="p-4 space-y-3 hover:bg-slate-50/40 dark:hover:bg-[#2b2c40]/15 transition-colors"
            >
              {/* Header: Nota & Status */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono font-bold text-slate-400 dark:text-slate-500 text-[10px] block">#{t.id}</span>
                </div>
                <div>
                  {t.debtAmount === 0 ? (
                    <span className="inline-flex px-2 py-0.5 bg-success/15 text-success font-bold text-[9px] rounded-sm uppercase tracking-wide">
                      Lunas
                    </span>
                  ) : (
                    <div className="text-right">
                      <span className="inline-flex px-2 py-0.5 bg-warning/15 text-warning font-bold text-[9px] rounded-sm uppercase tracking-wide">
                        Hutang
                      </span>
                      <span className="block text-[10px] text-danger font-mono font-bold mt-0.5">-{formatRupiah(t.debtAmount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Purchase Details */}
              <div className="bg-slate-50/75 dark:bg-[#1e1e2d]/50 p-2.5 rounded-xl space-y-1.5 text-xs border border-slate-100 dark:border-slate-800/40">
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium text-[11px] block">Barang:</span>
                  {t.items.map((item, idx) => (
                    <div key={idx} className="pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{item.productName}</p>
                      <p className="text-[10px] text-slate-400">{item.quantity}x @ {formatRupiah(item.priceAtSale)}</p>
                    </div>
                  ))}
                </div>
                {t.totalDiscountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Potongan Diskon:</span>
                    <span className="font-mono text-danger font-semibold">-{formatRupiah(t.totalDiscountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200/40 dark:border-slate-700/40 pt-1.5 font-bold">
                  <span className="text-slate-500">Total Tagihan:</span>
                  <span className="font-mono text-primary dark:text-indigo-400 text-sm">{formatRupiah(t.totalBill)}</span>
                </div>
              </div>

              {/* Date & Actions row */}
              <div className="flex justify-between items-center pt-1">
                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  {formatDateIndo(t.date)}
                </span>
                
                <div className="flex items-center gap-1.5">
                  {/* Lunasi Button - Show only if there's debt */}
                  {t.debtAmount > 0 && (
                    <button
                      onClick={() => {
                        setPaymentTransaction(t);
                        setPaymentAmount('');
                      }}
                      className="px-2.5 py-1 text-[10px] font-bold text-white bg-success hover:bg-emerald-600 rounded-lg transition-all cursor-pointer"
                      title="Lunasi Hutang"
                    >
                      Lunasi
                    </button>
                  )}

                  <button
                    onClick={() => setViewingTransaction(t)}
                    className="p-1.5 text-slate-500 hover:text-info dark:hover:text-cyan-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    title="Detail Nota"
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => generateReceiptPDF(t)}
                    className="p-1.5 text-slate-500 hover:text-emerald-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    title="Unduh PDF"
                  >
                    <Download className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => startEdit(t)}
                    className="p-1.5 text-slate-500 hover:text-primary rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    title="Edit Transaksi"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => setDeletingId(t.id)}
                    className="p-1.5 text-slate-500 hover:text-danger rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    title="Hapus Transaksi"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredTransactions.length === 0 && (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
              Tidak ada transaksi ditemukan.
            </div>
          )}
        </div>
      </div>

      {/* CREATE & EDIT MODAL */}
      <AnimatePresence>
        {(isAddModalOpen || editingTransaction) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingTransaction(null);
              }}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white dark:bg-[#232333] rounded-2xl shadow-2xl border border-[#e4e6e8] dark:border-[#43445b] w-full max-w-lg overflow-hidden z-10 my-8 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <h5 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  <span>{editingTransaction ? `Edit Transaksi #${editingTransaction.id}` : 'Tambah Transaksi Baru'}</span>
                </h5>
                <button 
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingTransaction(null);
                  }}
                  className="p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Content Scrollable */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                
                {/* Date Row */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Tanggal Nota
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#e4e6e8] dark:border-[#43445b] bg-[#fff] dark:bg-[#1e1e2d] text-slate-700 dark:text-slate-100 focus:outline-hidden focus:border-primary transition-all font-mono"
                  />
                </div>

                {/* DYNAMIC ITEMS SECTION */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <ShoppingCart className="h-3.5 w-3.5" /> Daftar Barang (Dapat Ditambah Beberapa)
                  </label>

                  {/* Items List Box */}
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {items.map((item, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-2.5 rounded-lg bg-blue-500/5 border border-primary/10 text-xs"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="font-semibold text-slate-700 dark:text-slate-300 truncate">{item.productName}</p>
                          <p className="text-[10px] text-slate-400">{item.quantity}x @ {formatRupiah(item.priceAtSale)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(index)}
                          className="p-1 text-slate-400 hover:text-danger rounded-md hover:bg-danger/10 cursor-pointer"
                        >
                          <MinusCircle className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    ))}
                    
                    {items.length === 0 && (
                      <p className="text-[11px] text-slate-400 italic text-center py-2 bg-slate-50 dark:bg-slate-800/20 rounded-lg">
                        Belum ada barang ditambahkan.
                      </p>
                    )}
                  </div>

                  {/* Add New Item Row Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                    <div className="sm:col-span-6 space-y-1">
                      <select
                        value={tempItemProductId}
                        onChange={(e) => setTempItemProductId(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-md border border-[#e4e6e8] dark:border-[#43445b] bg-[#fff] dark:bg-[#1e1e2d] text-slate-700 dark:text-slate-100 focus:outline-hidden"
                      >
                        <option value="">Pilih Produk...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({formatRupiah(p.price)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-4 space-y-1">
                      <input
                        type="number"
                        placeholder="Qty"
                        min="1"
                        value={tempItemQuantity}
                        onChange={(e) => setTempItemQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-md border border-[#e4e6e8] dark:border-[#43445b] bg-[#fff] dark:bg-[#1e1e2d] text-slate-700 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-end">
                      <button
                        type="button"
                        onClick={handleAddItemRow}
                        className="w-full py-1.5 bg-primary text-white text-xs font-semibold rounded-md hover:bg-primary-hover transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span className="sm:hidden">Tambah</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* DYNAMIC DISCOUNTS SECTION */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" /> Daftar Potongan Harga (Dapat Ditambah Beberapa)
                  </label>

                  {/* Discount List Box */}
                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    {discounts.map((d, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-2 rounded-lg bg-red-500/5 border border-danger/10 text-xs"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="font-semibold text-slate-700 dark:text-slate-300 truncate">{d.description}</p>
                          <p className="text-[10px] text-danger font-bold">-{formatRupiah(d.amount)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDiscountRow(index)}
                          className="p-1 text-slate-400 hover:text-danger rounded-md hover:bg-danger/10 cursor-pointer"
                        >
                          <MinusCircle className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    ))}
                    
                    {discounts.length === 0 && (
                      <p className="text-[11px] text-slate-400 italic text-center py-2 bg-slate-50 dark:bg-slate-800/20 rounded-lg">
                        Belum ada potongan ditambahkan.
                      </p>
                    )}
                  </div>

                  {/* Add New Discount Row Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                    <div className="sm:col-span-6 space-y-1">
                      <input
                        type="text"
                        placeholder="Keterangan potongan..."
                        value={tempDiscDesc}
                        onChange={(e) => setTempDiscDesc(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-md border border-[#e4e6e8] dark:border-[#43445b] bg-[#fff] dark:bg-[#1e1e2d] text-slate-700 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
                      />
                    </div>
                    <div className="sm:col-span-4 space-y-1">
                      <input
                        type="number"
                        placeholder="Rupiah"
                        value={tempDiscAmount}
                        onChange={(e) => setTempDiscAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-md border border-[#e4e6e8] dark:border-[#43445b] bg-[#fff] dark:bg-[#1e1e2d] text-slate-700 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-end">
                      <button
                        type="button"
                        onClick={handleAddDiscountRow}
                        className="w-full py-1.5 bg-danger text-white text-xs font-semibold rounded-md hover:bg-red-600 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span className="sm:hidden">Tambah</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* PAID AMOUNT AND LIVE CALCULATIONS */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                  
                  {/* Paid amount input */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Wallet className="h-3.5 w-3.5" /> Sudah Dibayar (Rupiah)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-xs font-bold text-slate-400">
                        Rp
                      </span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Kosongkan jika belum membayar"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#e4e6e8] dark:border-[#43445b] bg-[#fff] dark:bg-[#1e1e2d] text-slate-700 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-primary font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Calculations Sheet Display */}
                  <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Harga Total Produk</span>
                      <span className="font-mono">{formatRupiah(formCalculations.totalProductPrice)}</span>
                    </div>
                    <div className="flex justify-between text-danger">
                      <span>Total Potongan</span>
                      <span className="font-mono">-{formatRupiah(formCalculations.totalDiscountAmount)}</span>
                    </div>
                    <div className="border-t border-dashed border-slate-200 dark:border-slate-700 my-1 pt-1 flex justify-between font-bold text-slate-800 dark:text-slate-100">
                      <span>Total Tagihan Bersih</span>
                      <span className="font-mono text-primary text-sm">{formatRupiah(formCalculations.totalBill)}</span>
                    </div>
                    <div className="flex justify-between text-success">
                      <span>Sudah Dibayar</span>
                      <span className="font-mono">{formatRupiah(paidAmount === '' ? 0 : Number(paidAmount))}</span>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 my-1 pt-1 flex justify-between font-extrabold text-slate-800 dark:text-slate-100">
                      <span className="flex items-center gap-1">
                        Sisa Hutang 
                        {formCalculations.debtAmount > 0 && <AlertCircle className="h-3.5 w-3.5 text-warning inline" />}
                      </span>
                      <span className={`font-mono ${formCalculations.debtAmount > 0 ? 'text-warning' : 'text-success'}`}>
                        {formatRupiah(formCalculations.debtAmount)}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Footer Buttons shrinkable */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingTransaction(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-md shadow-primary/10 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="h-4 w-4" />
                    <span>{editingTransaction ? 'Simpan Nota' : 'Buat Nota'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* DETAILED TRANSACTION MODAL (BEAUTIFUL RECEIPT) */}
        {viewingTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingTransaction(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs no-print"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden z-10 my-8 flex flex-col relative max-h-[90vh]"
            >
              {/* Receipt Body - Printed area */}
              <div id="printable-area" className="flex-1 overflow-y-auto p-8 space-y-6 text-black bg-white">
                
                {/* Invoice Header */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                      Nota<span className="text-indigo-600 font-extrabold">Digital</span>
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider text-slate-500">
                      Invoice
                    </span>
                    <p className="font-mono font-bold text-slate-800 mt-1 text-xs">#{viewingTransaction.id}</p>
                  </div>
                </div>
 
                {/* Invoice Details Grid */}
                <div className="grid grid-cols-1 gap-4 text-xs">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Tanggal :</p>
                    <p className="font-bold text-slate-800 mt-1">{formatDateIndo(viewingTransaction.date)}</p>
                  </div>
                </div>
 
                {/* Items Table */}
                <div className="border-t border-b border-slate-100 py-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 pb-2">
                        <th className="text-left pb-2">Deskripsi Barang</th>
                        <th className="text-center pb-2">Qty</th>
                        <th className="text-right pb-2">Harga Satuan</th>
                        <th className="text-right pb-2">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {viewingTransaction.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-3 font-semibold text-slate-800">{item.productName}</td>
                          <td className="py-3 text-center text-slate-600">{item.quantity}</td>
                          <td className="py-3 text-right font-mono text-slate-600">{formatRupiah(item.priceAtSale)}</td>
                          <td className="py-3 text-right font-mono font-bold text-slate-800">{formatRupiah(item.quantity * item.priceAtSale)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
 
                {/* Discounts Breakdown if any */}
                {viewingTransaction.discounts.length > 0 && (
                  <div className="bg-slate-50 p-3.5 rounded-xl space-y-1.5 text-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Potongan :</p>
                    {viewingTransaction.discounts.map((d) => (
                      <div key={d.id} className="flex justify-between items-center text-slate-600">
                        <span>• {d.description}</span>
                        <span className="font-mono text-danger font-bold">-{formatRupiah(d.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
 
                {/* Totals Sheet */}
                <div className="w-full flex justify-end">
                  <div className="w-full sm:w-[240px] space-y-2 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal Harga</span>
                      <span className="font-mono">{formatRupiah(viewingTransaction.totalProductPrice)}</span>
                    </div>
                    
                    {viewingTransaction.totalDiscountAmount > 0 && (
                      <div className="flex justify-between text-danger">
                        <span>Total Potongan</span>
                        <span className="font-mono">-{formatRupiah(viewingTransaction.totalDiscountAmount)}</span>
                      </div>
                    )}
                    
                    <div className="border-t border-slate-200 my-1 pt-1.5 flex justify-between font-black text-slate-900 text-sm">
                      <span>Total Tagihan</span>
                      <span className="font-mono text-indigo-600">{formatRupiah(viewingTransaction.totalBill)}</span>
                    </div>
                    
                    {viewingTransaction.paidAmount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Sudah Dibayar</span>
                        <span className="font-mono">{formatRupiah(viewingTransaction.paidAmount)}</span>
                      </div>
                    )}
                    
                    {viewingTransaction.debtAmount > 0 && (
                      <div className="border-t border-dashed border-slate-200 my-1 pt-1.5 flex justify-between font-bold text-slate-800">
                        <span>Sisa Hutang</span>
                        <span className={`font-mono text-amber-600 font-black`}>
                          {formatRupiah(viewingTransaction.debtAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
 
                {/* Decorative Stamps / Watermark representing "LUNAS" or "BELUM LUNAS" */}
                <div className="flex justify-center pt-4">
                  {viewingTransaction.debtAmount === 0 ? (
                    <div className="border-4 border-emerald-500 border-double text-emerald-500 rounded-lg px-4 py-1 text-center font-black text-sm uppercase tracking-widest rotate-[-5deg] inline-block opacity-80">
                      Lunas Terbayar
                    </div>
                  ) : (
                    <div className="border-4 border-amber-500 border-double text-amber-500 rounded-lg px-4 py-1 text-center font-black text-xs uppercase tracking-widest rotate-[-5deg] inline-block opacity-80">
                      BELUM LUNAS • HUTANG {formatRupiah(viewingTransaction.debtAmount)}
                    </div>
                  )}
                </div>
 
              </div>
 
              <div className="px-6 py-4 bg-slate-50 dark:bg-[#1e1e2d] border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5 shrink-0 no-print">
                <button
                  onClick={() => setViewingTransaction(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PDF</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {/* Payment Modal */}
        {paymentTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setPaymentTransaction(null);
                setPaymentAmount('');
              }}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#232333] rounded-2xl shadow-2xl border border-[#e4e6e8] dark:border-[#43445b] z-10 p-6 w-full max-w-sm space-y-4"
            >
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100">Lunasi Hutang</h4>
              </div>

              {/* Transaction Summary */}
              <div className="bg-slate-50 dark:bg-slate-800/30 p-3 rounded-lg space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Total Tagihan:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{formatRupiah(paymentTransaction.totalBill)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Sudah Dibayar:</span>
                  <span className="font-bold text-success">{formatRupiah(paymentTransaction.paidAmount)}</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Sisa Hutang:</span>
                  <span className="font-bold text-warning">{formatRupiah(paymentTransaction.debtAmount)}</span>
                </div>
              </div>

              {/* Payment Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Jumlah Pembayaran (Rp)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-xs font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    max={paymentTransaction.debtAmount}
                    placeholder={`Maks: ${formatRupiah(paymentTransaction.debtAmount)}`}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#e4e6e8] dark:border-[#43445b] bg-[#fff] dark:bg-[#1e1e2d] text-slate-700 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-primary font-mono font-bold"
                  />
                </div>
                {paymentAmount && paymentAmount !== '' && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Sisa hutang setelah: <span className="font-bold text-success">{formatRupiah(Math.max(paymentTransaction.debtAmount - Number(paymentAmount), 0))}</span>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => {
                    setPaymentTransaction(null);
                    setPaymentAmount('');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handlePayment}
                  disabled={paymentAmount === '' || Number(paymentAmount) <= 0}
                  className={`px-4 py-2 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    paymentAmount === '' || Number(paymentAmount) <= 0
                      ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                      : 'bg-success hover:bg-emerald-600'
                  }`}
                >
                  Konfirmasi Pembayaran
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingId(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#232333] rounded-2xl shadow-2xl border border-[#e4e6e8] dark:border-[#43445b] z-10 p-6 w-full max-w-sm"
            >
              <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Hapus Transaksi?</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
                Apakah Anda yakin ingin menghapus transaksi #{deletingId}? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => setDeletingId(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    onDeleteTransaction(deletingId);
                    setDeletingId(null);
                  }}
                  className="px-4 py-2 bg-danger hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
