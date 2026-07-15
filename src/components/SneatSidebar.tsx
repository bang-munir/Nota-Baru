import React from 'react';
import { LayoutDashboard, Receipt, Package, FileText, Database, X, BookOpen } from 'lucide-react';
import { ViewType } from '../types';

interface SneatSidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isOffline?: boolean;
}

export default function SneatSidebar({
  currentView,
  onViewChange,
  isOpenMobile,
  onCloseMobile,
  isOffline = false
}: SneatSidebarProps) {
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transaksi', label: 'Transaksi', icon: Receipt },
    { id: 'produk', label: 'Daftar Produk', icon: Package },
    { id: 'laporan', label: 'Laporan', icon: FileText },
  ] as const;

  const handleMenuClick = (view: ViewType) => {
    onViewChange(view);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-200"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen w-[260px] z-50 
          bg-[#fff] dark:bg-[#232333] border-r border-[#e4e6e8] dark:border-[#43445b]
          flex flex-col transition-all duration-300
          ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="h-[76px] px-6 flex items-center justify-between border-b border-[#e4e6e8] dark:border-[#43445b]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-sans font-bold text-lg tracking-tight text-slate-800 dark:text-slate-100 flex items-center">
                Nota<span className="text-primary font-extrabold">Digital</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Pembukuan Pintar</p>
            </div>
          </div>
          
          <button 
            onClick={onCloseMobile}
            className="lg:hidden p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 py-6 px-4 overflow-y-auto space-y-1">
          <p className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
            Menu Utama
          </p>
          
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-primary text-white shadow-md shadow-primary/20' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2b2c40] hover:text-slate-950 dark:hover:text-white'
                  }
                `}
              >
                <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Banner/Indicator */}
        <div className="p-4 border-t border-[#e4e6e8] dark:border-[#43445b] bg-slate-50 dark:bg-[#1e1e2d]">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isOffline ? 'bg-amber-500' : 'bg-success'}`} />
            <div className="text-xs">
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                {isOffline ? 'Local Mode Active' : 'Cloud Sync Active'}
              </p>
              <p className="text-[10px] text-slate-400">
                {isOffline ? 'Data tersimpan di browser' : 'Database InsForge sinkron'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
