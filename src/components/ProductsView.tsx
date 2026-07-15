import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { formatRupiah } from '../utils';
import { Plus, Edit3, Trash2, Search, X, Package, DollarSign, Check, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductsViewProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

export default function ProductsView({
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct
}: ProductsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState<number | ''>('');

  // Search filter
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  // Handle addition
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newPrice === '' || newPrice <= 0) return;
    
    onAddProduct({
      name: newName.trim(),
      price: Number(newPrice)
    });

    // Reset and close
    setNewName('');
    setNewPrice('');
    setIsAddModalOpen(false);
  };

  // Open Edit Modal
  const startEdit = (p: Product) => {
    setEditingProduct(p);
    setNewName(p.name);
    setNewPrice(p.price);
  };

  // Handle editing
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !newName.trim() || newPrice === '' || newPrice <= 0) return;

    onEditProduct({
      id: editingProduct.id,
      name: newName.trim(),
      price: Number(newPrice)
    });

    // Reset and close
    setEditingProduct(null);
    setNewName('');
    setNewPrice('');
  };

  // Handle delete
  const confirmDelete = (id: string) => {
    onDeleteProduct(id);
    setDeletingId(null);
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
            placeholder="Cari nama barang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#e4e6e8] dark:border-[#43445b] bg-[#fff] dark:bg-[#1e1e2d] text-slate-700 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary transition-all"
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
          onClick={() => {
            setNewName('');
            setNewPrice('');
            setIsAddModalOpen(true);
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-hover shadow-md shadow-primary/20 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Produk</span>
        </button>
      </div>

      {/* Products Table Card */}
      <div className="bg-white dark:bg-[#232333] rounded-2xl border border-[#e4e6e8] dark:border-[#43445b] shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Daftar Produk Terdaftar</h4>
          <span className="px-2.5 py-0.5 bg-primary/10 text-primary font-bold text-[10px] rounded-full">
            {filteredProducts.length} Produk
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-[#202030]/50 border-b border-[#e4e6e8] dark:border-[#43445b] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Nama Barang</th>
                <th className="px-6 py-4 text-right">Harga Satuan</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredProducts.map((p) => (
                <tr 
                  key={p.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-[#2b2c40]/35 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                        <Package className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-slate-800 dark:text-slate-100">
                    {formatRupiah(p.price)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => startEdit(p)}
                        className="p-1.5 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer"
                        title="Edit Produk"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => setDeletingId(p.id)}
                        className="p-1.5 text-slate-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-all cursor-pointer"
                        title="Hapus Produk"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    Tidak ada produk ditemukan. Tambah produk baru menggunakan tombol di atas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modals */}
      <AnimatePresence>
        {(isAddModalOpen || editingProduct) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingProduct(null);
              }}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="bg-white dark:bg-[#232333] rounded-2xl shadow-xl border border-[#e4e6e8] dark:border-[#43445b] w-full max-w-md overflow-hidden z-10"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h5 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <span>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</span>
                </h5>
                <button 
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={editingProduct ? handleEditSubmit : handleAddSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Nama Barang
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: SSD Samsung EVO 500GB"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#e4e6e8] dark:border-[#43445b] bg-[#fff] dark:bg-[#1e1e2d] text-slate-700 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Harga Barang (Rupiah)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[11px] font-bold text-slate-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="0"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#e4e6e8] dark:border-[#43445b] bg-[#fff] dark:bg-[#1e1e2d] text-slate-700 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-primary transition-all font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingProduct(null);
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
                    <span>{editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Alert Modal */}
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
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white dark:bg-[#232333] rounded-2xl shadow-xl border border-[#e4e6e8] dark:border-[#43445b] w-full max-w-sm overflow-hidden z-10 p-6 text-center space-y-4"
            >
              <div className="mx-auto w-12 h-12 bg-danger/10 text-danger rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              
              <div className="space-y-1">
                <h5 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Hapus Produk?</h5>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                  Menghapus produk ini dapat berdampak pada transaksi yang menggunakannya. Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>

              <div className="flex justify-center gap-2.5 pt-2">
                <button
                  onClick={() => setDeletingId(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={() => confirmDelete(deletingId)}
                  className="px-4 py-2 bg-danger hover:bg-red-600 text-white text-xs font-semibold rounded-lg shadow-md shadow-danger/10 transition-colors cursor-pointer"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
