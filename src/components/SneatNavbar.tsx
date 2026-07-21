import React from 'react';
import { Sun, Moon, Menu } from 'lucide-react';
import { ThemeType } from '../types';

interface SneatNavbarProps {
  theme: ThemeType;
  onThemeToggle: () => void;
  onOpenMobileSidebar: () => void;
  currentViewTitle: string;
}

export default function SneatNavbar({
  theme,
  onThemeToggle,
  onOpenMobileSidebar,
  currentViewTitle
}: SneatNavbarProps) {
  return (
    <nav className="sticky top-4 z-30 mx-4 lg:mx-6 my-4 bg-white/80 dark:bg-[#232333]/80 backdrop-blur-md rounded-xl border border-[#e4e6e8] dark:border-[#43445b] shadow-xs px-4 py-3 flex items-center justify-between transition-all duration-200">
      
      {/* Left items */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-[#2b2c40] transition-colors"
          title="Buka Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
            {currentViewTitle}
          </h2>
        </div>
      </div>

      {/* Right items */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle removed to force clean light-only interface */}
      </div>
    </nav>
  );
}
