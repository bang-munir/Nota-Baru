import React, { useState, useEffect } from 'react';
import { Product, Transaction, Payment, ViewType, ThemeType } from './types';
import { api, PaymentInput } from './lib/api.ts';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

// Component Imports
import SneatSidebar from './components/SneatSidebar';
import SneatNavbar from './components/SneatNavbar';
import SneatFooter from './components/SneatFooter';
import DashboardView from './components/DashboardView';
import TransactionsView from './components/TransactionsView';
import ProductsView from './components/ProductsView';
import ReportsView from './components/ReportsView';

const CUSTOMER_NAME = 'Pelanggan Umum';

const errorText = (err: unknown): string =>
  err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak diketahui.';

const paymentsTotal = (list: Payment[]): number =>
  list.reduce((sum, payment) => sum + payment.amount, 0);

function toPaymentInput(payment: Payment): PaymentInput {
  return {
    id: payment.id,
    amount: payment.amount,
    paymentDate: payment.paymentDate,
    note: payment.note ?? null,
  };
}

function reconcilePayments(current: Payment[], targetPaid: number, fallbackDate: string): PaymentInput[] {
  const total = paymentsTotal(current);
  if (targetPaid === total) return current.map(toPaymentInput);
  if (targetPaid > total) {
    return [
      ...current.map(toPaymentInput),
      { amount: targetPaid - total, paymentDate: fallbackDate, note: null },
    ];
  }

  let excess = total - targetPaid;
  const kept: PaymentInput[] = [];
  const newestFirst = [...current].sort(
    (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
  );
  for (const payment of newestFirst) {
    if (excess <= 0) {
      kept.push(toPaymentInput(payment));
      continue;
    }
    const amount = payment.amount - excess;
    excess = Math.max(0, excess - payment.amount);
    if (amount > 0) kept.push({ ...toPaymentInput(payment), amount });
  }
  return kept.reverse();
}

export default function App() {
  // --- STATE ---
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);
  const [theme, setTheme] = useState<ThemeType>('light');

  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'danger' | 'info' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'danger' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
  };

  // Apply dark mode to HTML element
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (theme === 'dark') {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // --- PAYMENT HANDLERS ---
  const handleAddPayment = async (transactionId: string, amount: number) => {
    try {
      const transaction = transactions.find(t => t.id === transactionId);
      if (!transaction) {
        showToast('Transaksi tidak ditemukan', 'danger');
        return;
      }

      if (amount <= 0) {
        showToast('Nominal pembayaran harus lebih dari Rp 0', 'danger');
        return;
      }

      if (amount > transaction.debtAmount) {
        showToast(`Nominal pembayaran tidak boleh melebihi sisa hutang ${formatRupiahLocal(transaction.debtAmount)}`, 'danger');
        return;
      }

      await api.payments.create({
        transactionId,
        amount,
        paymentDate: new Date().toISOString(),
      });
      await loadData();

      const newDebt = Math.max(transaction.totalBill - (transaction.paidAmount + amount), 0);
      if (newDebt === 0) {
        showToast('Pembayaran berhasil. Transaksi sekarang LUNAS.', 'success');
      } else {
        showToast(`Pembayaran ${formatRupiahLocal(amount)} berhasil dicatat.`, 'success');
      }
    } catch (err) {
      console.error('Payment error:', err);
      showToast('Gagal mencatat pembayaran: ' + errorText(err), 'danger');
    }
  };

  const handleEditPayment = async (paymentId: string, newAmount: number, newDate: string) => {
    try {
      const payment = payments.find(p => p.id === paymentId);
      if (!payment) {
        showToast('Pembayaran tidak ditemukan', 'danger');
        return;
      }

      if (newAmount <= 0) {
        showToast('Nominal pembayaran harus lebih dari Rp 0', 'danger');
        return;
      }

      const transaction = transactions.find(t => t.id === payment.transactionId);
      if (!transaction) {
        showToast('Transaksi tidak ditemukan', 'danger');
        return;
      }

      const otherPaymentsTotal = paymentsTotal(
        payments.filter(p => p.transactionId === payment.transactionId && p.id !== paymentId)
      );

      const newTotalPaid = otherPaymentsTotal + newAmount;
      if (newTotalPaid > transaction.totalBill) {
        showToast('Total pembayaran melebihi sisa tagihan. Periksa kembali nominal pembayaran.', 'danger');
        return;
      }

      await api.payments.update(paymentId, { amount: newAmount, paymentDate: newDate });
      await loadData();

      const newDebt = Math.max(transaction.totalBill - newTotalPaid, 0);
      if (newDebt === 0) {
        showToast('Pembayaran berhasil diperbarui. Transaksi sekarang LUNAS.', 'success');
      } else {
        showToast(`Pembayaran berhasil diperbarui. Sisa hutang: ${formatRupiahLocal(newDebt)}`, 'success');
      }
    } catch (err) {
      console.error('Edit payment error:', err);
      showToast('Gagal memperbarui pembayaran: ' + errorText(err), 'danger');
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
      const payment = payments.find(p => p.id === paymentId);
      if (!payment) {
        showToast('Pembayaran tidak ditemukan', 'danger');
        return;
      }

      const transaction = transactions.find(t => t.id === payment.transactionId);
      if (!transaction) {
        showToast('Transaksi tidak ditemukan', 'danger');
        return;
      }

      await api.payments.remove(paymentId);
      await loadData();

      const remainingPaid = paymentsTotal(
        payments.filter(p => p.transactionId === payment.transactionId && p.id !== paymentId)
      );
      const newDebt = Math.max(transaction.totalBill - remainingPaid, 0);
      if (newDebt === 0) {
        showToast('Pembayaran berhasil dihapus. Transaksi tetap LUNAS.', 'success');
      } else {
        showToast(`Pembayaran berhasil dihapus. Sisa hutang: ${formatRupiahLocal(newDebt)}`, 'success');
      }
    } catch (err) {
      console.error('Delete payment error:', err);
      showToast('Gagal menghapus pembayaran: ' + errorText(err), 'danger');
    }
  };

  // Helper for formatting (local use)
  const formatRupiahLocal = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // --- DB DATA LOADER ---
  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [loadedProducts, transactionData] = await Promise.all([
        api.products.list(),
        api.transactions.list(),
      ]);

      setProducts(loadedProducts);
      setTransactions(transactionData.transactions);
      setPayments(transactionData.payments);
    } catch (err) {
      console.error('Failed to load data from API:', err);
      setErrorMsg(errorText(err));
    } finally {
      setIsLoading(false);
    }
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    loadData();

    // Ensure dark mode class is completely removed from the document root
    const root = window.document.documentElement;
    root.classList.remove('dark');
  }, []);

  // --- THEME FORCE LIGHT ---
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    setTheme('light');
  }, [theme]);

  // --- CRUD PRODUCT HANDLERS ---
  const handleAddProduct = async (newProd: Omit<Product, 'id'>) => {
    try {
      await api.products.create({
        id: `p-${Date.now()}`,
        name: newProd.name,
        price: newProd.price,
      });
      await loadData();
      showToast('Produk berhasil ditambahkan', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal menambah produk: ' + errorText(err), 'danger');
    }
  };

  const handleEditProduct = async (editedProd: Product) => {
    try {
      await api.products.update(editedProd.id, {
        name: editedProd.name,
        price: editedProd.price,
      });
      await loadData();
      showToast('Produk berhasil diperbarui', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal memperbarui produk: ' + errorText(err), 'danger');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await api.products.remove(id);
      await loadData();
      showToast('Produk berhasil dihapus', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal menghapus produk: ' + errorText(err), 'danger');
    }
  };

  // --- CRUD TRANSACTION HANDLERS ---
  const handleAddTransaction = async (newTrans: Omit<Transaction, 'id' | 'totalProductPrice' | 'totalDiscountAmount' | 'totalBill' | 'debtAmount'>) => {
    try {
      const paid = Number(newTrans.paidAmount || 0);

      await api.transactions.create({
        date: newTrans.date,
        customerName: CUSTOMER_NAME,
        items: newTrans.items,
        discounts: newTrans.discounts.map(d => ({ description: d.description, amount: d.amount })),
        payments: paid > 0 ? [{ amount: paid, paymentDate: newTrans.date, note: null }] : [],
      });

      await loadData();
      showToast('Transaksi berhasil ditambahkan', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal menambah transaksi: ' + errorText(err), 'danger');
    }
  };

  const handleEditTransaction = async (editedTrans: Transaction) => {
    try {
      const existingPayments = payments.filter(p => p.transactionId === editedTrans.id);

      await api.transactions.update(editedTrans.id, {
        date: editedTrans.date,
        items: editedTrans.items,
        discounts: editedTrans.discounts.map(d => ({ description: d.description, amount: d.amount })),
        payments: reconcilePayments(existingPayments, Number(editedTrans.paidAmount || 0), editedTrans.date),
      });

      await loadData();
      showToast('Transaksi berhasil diperbarui', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal memperbarui transaksi: ' + errorText(err), 'danger');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await api.transactions.remove(id);
      await loadData();
      showToast('Transaksi berhasil dihapus', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal menghapus transaksi: ' + errorText(err), 'danger');
    }
  };

  // --- VIEW RENDERING ENGINE ---
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView 
            transactions={transactions} 
            products={products} 
            payments={payments}
            onViewChange={setCurrentView} 
          />
        );
      case 'transaksi':
        return (
          <TransactionsView
            transactions={transactions}
            products={products}
            payments={payments}
            onAddTransaction={handleAddTransaction}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onAddPayment={handleAddPayment}
            onEditPayment={handleEditPayment}
            onDeletePayment={handleDeletePayment}
          />
        );
      case 'produk':
        return (
          <ProductsView
            products={products}
            onAddProduct={handleAddProduct}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        );
      case 'laporan':
        return (
          <ReportsView 
            transactions={transactions} 
            products={products} 
          />
        );
      default:
        return (
          <DashboardView 
            transactions={transactions} 
            products={products} 
            payments={payments}
            onViewChange={setCurrentView} 
          />
        );
    }
  };

  // Title dictionary for navbar header
  const viewTitles: Record<ViewType, string> = {
    dashboard: 'Dashboard',
    transaksi: 'Kelola Transaksi Nota',
    produk: 'Manajemen Produk',
    laporan: 'Laporan Keuangan'
  };

  return (
    <div className="flex min-h-screen bg-[#f5f5f9] text-slate-800 font-sans transition-colors duration-200">
      
      {/* Sneat Sidebar Navigation */}
      <div className="no-print">
        <SneatSidebar 
          currentView={currentView}
          onViewChange={setCurrentView}
          isOpenMobile={isOpenMobileSidebar}
          onCloseMobile={() => setIsOpenMobileSidebar(false)}
          isOffline={false}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Sneat Navbar */}
        <div className="no-print">
          <SneatNavbar
            theme={theme}
            onThemeToggle={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
            onOpenMobileSidebar={() => setIsOpenMobileSidebar(true)}
            currentViewTitle={viewTitles[currentView]}
          />
        </div>

        {/* View Component Wrapper */}
        <main className="flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] py-12">
              <div className="relative flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              </div>
              <p className="mt-4 text-xs font-semibold text-slate-400 dark:text-slate-500 animate-pulse">
                Menghubungkan ke database...
              </p>
            </div>
          ) : errorMsg ? (
            <div className="mx-6 my-8 p-6 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/30 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center">
                <span className="font-bold text-lg">!</span>
              </div>
              <div className="space-y-1">
                <h5 className="font-bold text-red-800 dark:text-red-200 text-sm">Kesalahan Database</h5>
                <p className="text-xs text-red-600 dark:text-red-400 max-w-md mx-auto leading-relaxed">
                  {errorMsg}
                </p>
              </div>
              <button
                onClick={loadData}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            renderCurrentView()
          )}
        </main>

        {/* Sneat Footer */}
        <div className="no-print">
          <SneatFooter />
        </div>

      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`
              fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold max-w-sm
              ${toast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200 border-emerald-100 dark:border-emerald-800' : ''}
              ${toast.type === 'danger' ? 'bg-rose-50 dark:bg-rose-950/90 text-rose-800 dark:text-rose-200 border-rose-100 dark:border-rose-800' : ''}
              ${toast.type === 'warning' ? 'bg-amber-50 dark:bg-amber-950/90 text-amber-800 dark:text-amber-200 border-amber-100 dark:border-amber-800' : ''}
              ${toast.type === 'info' ? 'bg-blue-50 dark:bg-[#232333]/90 text-blue-800 dark:text-blue-200 border-blue-100 dark:border-[#43445b]' : ''}
            `}
          >
            <div className="flex-1">{toast.message}</div>
            <button 
              onClick={() => setToast(null)}
              className="p-0.5 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-md text-slate-400 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
