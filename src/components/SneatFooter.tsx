import React from 'react';

export default function SneatFooter() {
  return (
    <footer className="mx-4 lg:mx-6 my-6 p-4 bg-white dark:bg-[#232333] rounded-xl border border-[#e4e6e8] dark:border-[#43445b] flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2 transition-all duration-200">
      <div>
        <span>© {new Date().getFullYear()} </span>
        <span className="font-bold text-primary">NotaDigital.</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <span className="px-2 py-0.5 bg-success/15 text-success rounded text-[10px] font-semibold uppercase">v1.0.0 Production</span>
        </div>
      </div>
    </footer>
  );
}
