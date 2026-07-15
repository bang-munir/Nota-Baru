import React, { useState, useEffect } from 'react';
import { Product, Transaction, Discount, ViewType, ThemeType } from './types';
import { INITIAL_PRODUCTS, INITIAL_TRANSACTIONS } from './data/mockData.ts';
import { insforge } from './lib/insforge.ts';
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

export default function App() {
  // --- STATE ---
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);
  const [theme, setTheme] = useState<ThemeType>('light');

  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [usingLocalFallback, setUsingLocalFallback] = useState(false);
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

  // --- MAP DATABASE DATA TO LOCAL MODELS ---
  const mapDBTransactionToLocal = (t: any): Transaction => {
    const paidAmount = Number(t.paid_amount || 0);
    
    const discounts: Discount[] = (t.discounts || []).map((d: any) => ({
      id: d.id,
      description: d.description,
      amount: Number(d.amount || 0)
    }));

    // Parse items from DB - legacy single-item format only
    let items = [];
    if (t.product_id) {
      items = [{
        productId: t.product_id,
        productName: t.product_name_snapshot || '',
        quantity: Number(t.quantity || 0),
        priceAtSale: Number(t.price_at_sale || 0)
      }];
    }

    const totalProductPrice = items.reduce((sum, item) => sum + (item.quantity * item.priceAtSale), 0);
    const totalDiscountAmount = discounts.reduce((sum, d) => sum + d.amount, 0);
    const totalBill = Math.max(totalProductPrice - totalDiscountAmount, 0);
    const debtAmount = Math.max(totalBill - paidAmount, 0);

    let dateStr = t.date || '';
    if (dateStr && dateStr.includes('T')) {
      dateStr = dateStr.split('T')[0];
    }

    return {
      id: t.id,
      date: dateStr,
      items,
      discounts,
      paidAmount,
      totalProductPrice,
      totalDiscountAmount,
      totalBill,
      debtAmount
    };
  };

  // --- LOCAL STORAGE FALLBACK LOADER ---
  const loadLocalFallback = () => {
    try {
      const storedProds = window.localStorage.getItem('notadigital_products');
      const storedTrans = window.localStorage.getItem('notadigital_transactions');
      
      let localProds: Product[] = [];
      let localTrans: Transaction[] = [];

      if (storedProds) {
        localProds = JSON.parse(storedProds);
      } else {
        localProds = INITIAL_PRODUCTS;
        try {
          window.localStorage.setItem('notadigital_products', JSON.stringify(INITIAL_PRODUCTS));
        } catch (e) { console.warn(e); }
      }

      if (storedTrans) {
        localTrans = JSON.parse(storedTrans);
      } else {
        localTrans = INITIAL_TRANSACTIONS;
        try {
          window.localStorage.setItem('notadigital_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
        } catch (e) { console.warn(e); }
      }

      setProducts(localProds);
      setTransactions(localTrans);
      setUsingLocalFallback(true);
      setErrorMsg(null);
    } catch (err) {
      console.error('Failed to load local fallback:', err);
      setProducts(INITIAL_PRODUCTS);
      setTransactions(INITIAL_TRANSACTIONS);
      setUsingLocalFallback(true);
      setErrorMsg(null);
    }
  };

  // --- DB DATA LOADER ---
  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // 1. Fetch products
      const { data: dbProducts, error: prodError } = await insforge.database
        .from('products')
        .select('*')
        .order('created_at', { ascending: true });

      if (prodError) throw prodError;

      // 2. Fetch transactions with their nested discounts
      const { data: dbTransactions, error: transError } = await insforge.database
        .from('transactions')
        .select('*, discounts(*)')
        .order('created_at', { ascending: false });

      if (transError) throw transError;

      setProducts(dbProducts || []);
      setTransactions((dbTransactions || []).map(mapDBTransactionToLocal));
      setUsingLocalFallback(false);
    } catch (err: any) {
      console.warn('Failed to load data from InsForge database. Gracefully falling back to local storage...', err);
      loadLocalFallback();
    } finally {
      setIsLoading(false);
    }
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    // Initial fetch from InsForge
    loadData();

    // Load theme setting
    let cachedTheme: ThemeType = 'light';
    try {
      const themeVal = localStorage.getItem('notadigital_theme');
      if (themeVal === 'dark' || themeVal === 'light') {
        cachedTheme = themeVal as ThemeType;
      }
    } catch (e) {
      console.warn('localStorage is not accessible for loading theme:', e);
    }
    setTheme(cachedTheme);
  }, []);

  // --- THEME REFLECTION ---
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('notadigital_theme', theme);
    } catch (e) {
      console.warn('localStorage is not accessible for saving theme:', e);
    }
  }, [theme]);

  // --- CRUD PRODUCT HANDLERS ---
  const handleAddProduct = async (newProd: Omit<Product, 'id'>) => {
    try {
      const freshId = `p-${Date.now()}`;
      
      if (usingLocalFallback) {
        const updatedProducts = [...products, { id: freshId, name: newProd.name, price: newProd.price }];
        setProducts(updatedProducts);
        try {
          window.localStorage.setItem('notadigital_products', JSON.stringify(updatedProducts));
        } catch (e) { console.warn(e); }
        showToast('Produk berhasil ditambahkan (Lokal)', 'success');
        return;
      }

      const { error } = await insforge.database
        .from('products')
        .insert([{
          id: freshId,
          name: newProd.name,
          price: newProd.price
        }]);

      if (error) throw error;
      await loadData();
      showToast('Produk berhasil ditambahkan', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Gagal menambah produk: ' + err.message, 'danger');
    }
  };

  const handleEditProduct = async (editedProd: Product) => {
    try {
      if (usingLocalFallback) {
        const updatedProducts = products.map(p => p.id === editedProd.id ? editedProd : p);
        const updatedTransactions = transactions.map(t => ({
          ...t,
          items: t.items.map(item => 
            item.productId === editedProd.id 
              ? { ...item, productName: editedProd.name } 
              : item
          )
        }));
        setProducts(updatedProducts);
        setTransactions(updatedTransactions);
        try {
          window.localStorage.setItem('notadigital_products', JSON.stringify(updatedProducts));
          window.localStorage.setItem('notadigital_transactions', JSON.stringify(updatedTransactions));
        } catch (e) { console.warn(e); }
        showToast('Produk berhasil diperbarui (Lokal)', 'success');
        return;
      }

      // 1. Update product
      const { error } = await insforge.database
        .from('products')
        .update({
          name: editedProd.name,
          price: editedProd.price
        })
        .eq('id', editedProd.id);

      if (error) throw error;

      // 2. Sync product name snapshot in transactions
      const { data: affectedTrans, error: fetchError } = await insforge.database
        .from('transactions')
        .select('id')
        .eq('product_id', editedProd.id);
         
      if (!fetchError && affectedTrans && affectedTrans.length > 0) {
        for (const t of affectedTrans) {
          await insforge.database
            .from('transactions')
            .update({
              product_name_snapshot: editedProd.name
            })
            .eq('id', t.id);
        }
      }

      await loadData();
      showToast('Produk berhasil diperbarui', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Gagal memperbarui produk: ' + err.message, 'danger');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      if (usingLocalFallback) {
        const updatedProducts = products.filter(p => p.id !== id);
        setProducts(updatedProducts);
        try {
          window.localStorage.setItem('notadigital_products', JSON.stringify(updatedProducts));
        } catch (e) { console.warn(e); }
        showToast('Produk berhasil dihapus (Lokal)', 'success');
        return;
      }

      const { error } = await insforge.database
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadData();
      showToast('Produk berhasil dihapus', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Gagal menghapus produk: ' + err.message, 'danger');
    }
  };

  // --- CRUD TRANSACTION HANDLERS ---
  const handleAddTransaction = async (newTrans: Omit<Transaction, 'id' | 'totalProductPrice' | 'totalDiscountAmount' | 'totalBill' | 'debtAmount'>) => {
    try {
      const freshTransId = `tr-${Math.floor(100 + Math.random() * 900)}`;

      if (usingLocalFallback) {
        const paidAmount = Number(newTrans.paidAmount || 0);
        const discounts = newTrans.discounts || [];
        
        const totalProductPrice = newTrans.items.reduce((sum, item) => sum + (item.quantity * item.priceAtSale), 0);
        const totalDiscountAmount = discounts.reduce((sum, d) => sum + d.amount, 0);
        const totalBill = Math.max(totalProductPrice - totalDiscountAmount, 0);
        const debtAmount = Math.max(totalBill - paidAmount, 0);

        const newTransObject: Transaction = {
          id: freshTransId,
          date: newTrans.date,
          items: newTrans.items,
          discounts,
          paidAmount,
          totalProductPrice,
          totalDiscountAmount,
          totalBill,
          debtAmount
        };

        const updatedTransactions = [newTransObject, ...transactions];
        setTransactions(updatedTransactions);
        try {
          window.localStorage.setItem('notadigital_transactions', JSON.stringify(updatedTransactions));
        } catch (e) { console.warn(e); }
        showToast('Transaksi berhasil ditambahkan (Lokal)', 'success');
        return;
      }

      // 1. Insert transaction - save only first item to DB (database schema limitation)
      const firstItem = newTrans.items[0] || { productId: '', productName: '', quantity: 0, priceAtSale: 0 };
      const { error: transError } = await insforge.database
        .from('transactions')
        .insert([{
          id: freshTransId,
          customer_name: 'Pelanggan Umum',
          date: newTrans.date,
          product_id: firstItem.productId,
          product_name_snapshot: firstItem.productName,
          quantity: firstItem.quantity,
          price_at_sale: firstItem.priceAtSale,
          paid_amount: newTrans.paidAmount
        }]);

      if (transError) throw transError;

      // 2. Insert discounts if any
      if (newTrans.discounts && newTrans.discounts.length > 0) {
        const discountsToInsert = newTrans.discounts.map(d => ({
          id: d.id || `d-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          transaction_id: freshTransId,
          description: d.description,
          amount: d.amount
        }));

        const { error: discError } = await insforge.database
          .from('discounts')
          .insert(discountsToInsert);

        if (discError) throw discError;
      }

      await loadData();
      showToast('Transaksi berhasil ditambahkan', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Gagal menambah transaksi: ' + err.message, 'danger');
    }
  };

  const handleEditTransaction = async (editedTrans: Transaction) => {
    try {
      if (usingLocalFallback) {
        const updatedTransactions = transactions.map(t => t.id === editedTrans.id ? editedTrans : t);
        setTransactions(updatedTransactions);
        try {
          window.localStorage.setItem('notadigital_transactions', JSON.stringify(updatedTransactions));
        } catch (e) { console.warn(e); }
        showToast('Transaksi berhasil diperbarui (Lokal)', 'success');
        return;
      }

      // 1. Update transaction - save only first item to DB (database schema limitation)
      const firstItem = editedTrans.items[0] || { productId: '', productName: '', quantity: 0, priceAtSale: 0 };
      const { error: transError } = await insforge.database
        .from('transactions')
        .update({
          date: editedTrans.date,
          product_id: firstItem.productId,
          product_name_snapshot: firstItem.productName,
          quantity: firstItem.quantity,
          price_at_sale: firstItem.priceAtSale,
          paid_amount: editedTrans.paidAmount
        })
        .eq('id', editedTrans.id);

      if (transError) throw transError;

      // 2. Delete old discounts
      const { error: delError } = await insforge.database
        .from('discounts')
        .delete()
        .eq('transaction_id', editedTrans.id);

      if (delError) throw delError;

      // 3. Insert new discounts
      if (editedTrans.discounts && editedTrans.discounts.length > 0) {
        const discountsToInsert = editedTrans.discounts.map(d => ({
          id: d.id.startsWith('temp-') || d.id === '' ? `d-${Date.now()}-${Math.floor(Math.random() * 1000)}` : d.id,
          transaction_id: editedTrans.id,
          description: d.description,
          amount: d.amount
        }));

        const { error: discError } = await insforge.database
          .from('discounts')
          .insert(discountsToInsert);

        if (discError) throw discError;
      }

      await loadData();
      showToast('Transaksi berhasil diperbarui', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Gagal memperbarui transaksi: ' + err.message, 'danger');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      if (usingLocalFallback) {
        const updatedTransactions = transactions.filter(t => t.id !== id);
        setTransactions(updatedTransactions);
        try {
          window.localStorage.setItem('notadigital_transactions', JSON.stringify(updatedTransactions));
        } catch (e) { console.warn(e); }
        showToast('Transaksi berhasil dihapus (Lokal)', 'success');
        return;
      }

      // 1. Delete discounts
      const { error: discError } = await insforge.database
        .from('discounts')
        .delete()
        .eq('transaction_id', id);

      if (discError) throw discError;

      // 2. Delete transaction
      const { error: transError } = await insforge.database
        .from('transactions')
        .delete()
        .eq('id', id);

      if (transError) throw transError;

      await loadData();
      showToast('Transaksi berhasil dihapus', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Gagal menghapus transaksi: ' + err.message, 'danger');
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
            onViewChange={setCurrentView} 
          />
        );
      case 'transaksi':
        return (
          <TransactionsView
            transactions={transactions}
            products={products}
            onAddTransaction={handleAddTransaction}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
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
    <div className="flex min-h-screen bg-[#f5f5f9] dark:bg-[#1e1e2d] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* Sneat Sidebar Navigation */}
      <div className="no-print">
        <SneatSidebar 
          currentView={currentView}
          onViewChange={setCurrentView}
          isOpenMobile={isOpenMobileSidebar}
          onCloseMobile={() => setIsOpenMobileSidebar(false)}
          isOffline={usingLocalFallback}
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
                Menghubungkan ke database InsForge...
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
