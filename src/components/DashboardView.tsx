import React, { useState, useMemo } from 'react';
import { Transaction, Product, ViewType } from '../types';
import { formatRupiah, isThisMonth } from '../utils';
import { 
  TrendingUp, 
  Wallet, 
  AlertCircle, 
  ArrowUpRight, 
  Receipt, 
  Calendar, 
  Clock, 
  Layers,
  ArrowRight,
  Percent
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardViewProps {
  transactions: Transaction[];
  products: Product[];
  onViewChange: (view: ViewType) => void;
}

export default function DashboardView({
  transactions,
  products,
  onViewChange
}: DashboardViewProps) {
  const [activeChartTab, setActiveChartTab] = useState<'belanja' | 'hutang'>('belanja');

  // Compute stats
  const stats = useMemo(() => {
    let totalBelanja = 0;
    let sisaHutang = 0;
    let sudahDibayar = 0;
    let totalPotongan = 0;
    
    let totalBelanjaBulanIni = 0;
    let sisaHutangBulanIni = 0;
    let sudahDibayarBulanIni = 0;

    transactions.forEach(t => {
      // Overall
      totalBelanja += t.totalBill;
      sisaHutang += t.debtAmount;
      sudahDibayar += t.paidAmount;
      totalPotongan += t.totalDiscountAmount;

      // This Month (July 2026 based on current system time)
      if (isThisMonth(t.date)) {
        totalBelanjaBulanIni += t.totalBill;
        sisaHutangBulanIni += t.debtAmount;
        sudahDibayarBulanIni += t.paidAmount;
      }
    });

    return {
      totalBelanja,
      sisaHutang,
      sudahDibayar,
      totalPotongan,
      totalBelanjaBulanIni,
      sisaHutangBulanIni,
      sudahDibayarBulanIni
    };
  }, [transactions]);

  // Aggregate monthly data for Chart
  const monthlyChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const currentYear = new Date('2026-07-14').getFullYear();
    
    // Initialize months
    const aggregated = months.map((name, index) => ({
      name,
      monthIndex: index,
      belanja: 0,
      dibayar: 0,
      hutang: 0
    }));

    transactions.forEach(t => {
      const tDate = new Date(t.date);
      if (tDate.getFullYear() === currentYear) {
        const mIdx = tDate.getMonth();
        if (mIdx >= 0 && mIdx < 12) {
          aggregated[mIdx].belanja += t.totalBill;
          aggregated[mIdx].dibayar += t.paidAmount;
          aggregated[mIdx].hutang += t.debtAmount;
        }
      }
    });

    // Let's filter to show the last 6 months (up to July) for dense and beautiful presentation
    return aggregated.slice(2, 8); // March to August
  }, [transactions]);

  // Get maximum value for chart scaling
  const maxChartValue = useMemo(() => {
    const maxVal = Math.max(
      ...monthlyChartData.map(d => Math.max(d.belanja, d.dibayar, d.hutang)),
      1000000 // default minimum scale floor
    );
    return Math.ceil(maxVal / 1000000) * 1000000; // round up to nearest million
  }, [monthlyChartData]);

  // Latest transactions (limit to 5)
  const latestTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  return (
    <div className="px-4 lg:px-6 space-y-6">
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Potongan */}
        <div className="bg-white dark:bg-[#232333] p-5 rounded-2xl border border-[#e4e6e8] dark:border-[#43445b] shadow-xs flex items-center gap-4 transition-all">
          <div className="p-3.5 bg-red-500/10 dark:bg-red-500/20 rounded-xl text-red-500">
            <Percent className="h-6 w-6" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Potongan</p>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatRupiah(stats.totalPotongan)}</h3>
          </div>
        </div>

        {/* Sudah Dibayar */}
        <div className="bg-white dark:bg-[#232333] p-5 rounded-2xl border border-[#e4e6e8] dark:border-[#43445b] shadow-xs flex items-center gap-4 transition-all">
          <div className="p-3.5 bg-success/10 dark:bg-success/20 rounded-xl text-success">
            <Wallet className="h-6 w-6" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sudah Dibayar</p>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatRupiah(stats.sudahDibayar)}</h3>
          </div>
        </div>

        {/* Sisa Hutang */}
        <div className="bg-white dark:bg-[#232333] p-5 rounded-2xl border border-[#e4e6e8] dark:border-[#43445b] shadow-xs flex items-center gap-4 transition-all">
          <div className="p-3.5 bg-warning/10 dark:bg-warning/20 rounded-xl text-warning">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sisa Hutang</p>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatRupiah(stats.sisaHutang)}</h3>
          </div>
        </div>

      </div>

      {/* Chart Section & List Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Financial Chart SVG */}
        <div className="lg:col-span-8 bg-white dark:bg-[#232333] p-5 rounded-2xl border border-[#e4e6e8] dark:border-[#43445b] shadow-xs flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Grafik Keuangan Tahun Ini</h4>
              <p className="text-[11px] text-slate-400">Fluktuasi omzet belanja dan pembayaran bulanan</p>
            </div>
            
            <div className="flex gap-1.5 self-start">
              <button
                onClick={() => setActiveChartTab('belanja')}
                className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  activeChartTab === 'belanja' 
                    ? 'bg-primary text-white' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Terbayar
              </button>
              <button
                onClick={() => setActiveChartTab('hutang')}
                className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  activeChartTab === 'hutang' 
                    ? 'bg-warning/20 text-warning border border-warning/10' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Sisa Hutang
              </button>
            </div>
          </div>

          {/* SVG Chart Render */}
          <div className="h-[240px] w-full relative pt-4 flex items-end">
            {/* Left Y Axis Labels */}
            <div className="absolute left-0 top-4 bottom-8 w-12 flex flex-col justify-between text-[10px] text-slate-400 font-mono text-right pr-2">
              <span>{formatRupiah(maxChartValue)}</span>
              <span>{formatRupiah(maxChartValue * 0.75)}</span>
              <span>{formatRupiah(maxChartValue * 0.5)}</span>
              <span>{formatRupiah(maxChartValue * 0.25)}</span>
              <span>Rp 0</span>
            </div>

            {/* Grid & Bars/Lines Container */}
            <div className="flex-1 ml-12 h-[200px] relative border-b border-slate-200 dark:border-slate-700">
              
              {/* Horizontal Gridlines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="border-t border-dashed border-slate-100 dark:border-slate-800 w-full" />
                <div className="border-t border-dashed border-slate-100 dark:border-slate-800 w-full" />
                <div className="border-t border-dashed border-slate-100 dark:border-slate-800 w-full" />
                <div className="border-t border-dashed border-slate-100 dark:border-slate-800 w-full" />
                <div className="w-full" /> {/* Bottom axis line */}
              </div>

              {/* Data Columns */}
              <div className="absolute inset-0 flex justify-around items-end px-2">
                {monthlyChartData.map((d, idx) => {
                  // Compute heights in percentages
                  const belanjaPct = Math.min((d.belanja / maxChartValue) * 100, 100);
                  const dibayarPct = Math.min((d.dibayar / maxChartValue) * 100, 100);
                  const hutangPct = Math.min((d.hutang / maxChartValue) * 100, 100);

                  return (
                    <div key={d.name} className="flex flex-col items-center h-full justify-end w-12 group cursor-pointer relative">
                      
                      {/* Interactive Tooltip on hover */}
                      <div className="absolute bottom-[205px] bg-slate-900 text-white rounded-lg p-2.5 shadow-xl border border-slate-800 text-[10px] z-20 w-[140px] hidden group-hover:block transition-all pointer-events-none">
                        <p className="font-bold border-b border-slate-800 pb-1 mb-1 text-primary">{d.name} 2026</p>
                        <p className="flex justify-between"><span>Belanja:</span> <span className="font-semibold">{formatRupiah(d.belanja)}</span></p>
                        <p className="flex justify-between text-success"><span>Terbayar:</span> <span className="font-semibold">{formatRupiah(d.dibayar)}</span></p>
                        <p className="flex justify-between text-warning"><span>Hutang:</span> <span className="font-semibold">{formatRupiah(d.hutang)}</span></p>
                      </div>

                      {/* Visual representations (Bars) */}
                      {activeChartTab === 'belanja' ? (
                        <div className="flex gap-1.5 items-end h-full w-full justify-center">
                          {/* Total Belanja Bar */}
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${belanjaPct}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.05 }}
                            className="w-4 bg-primary/80 rounded-t-md hover:bg-primary transition-colors relative"
                          />
                          {/* Sudah Dibayar Bar */}
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${dibayarPct}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.05 + 0.1 }}
                            className="w-4 bg-success/80 rounded-t-md hover:bg-success transition-colors relative"
                          />
                        </div>
                      ) : (
                        // Sisa Hutang Bar
                        <div className="flex justify-center h-full w-full items-end">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${hutangPct}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.05 }}
                            className="w-6 bg-warning/80 rounded-t-md hover:bg-warning transition-colors relative"
                          />
                        </div>
                      )}

                      {/* X Axis Label */}
                      <span className="absolute top-[205px] text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                        {d.name}
                      </span>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

          {/* Chart Legend */}
          <div className="flex justify-center gap-4 mt-6 text-[10px] font-bold text-slate-500 dark:text-slate-400">
            {activeChartTab === 'belanja' ? (
              <>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-primary rounded-xs" />
                  <span>Total Belanja (Omzet)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-success rounded-xs" />
                  <span>Sudah Dibayar (Kas Masuk)</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-warning rounded-xs" />
                <span>Sisa Hutang (Belum Terbayar)</span>
              </div>
            )}
          </div>
        </div>

        {/* Latest Transactions Panel */}
        <div className="lg:col-span-4 bg-white dark:bg-[#232333] p-5 rounded-2xl border border-[#e4e6e8] dark:border-[#43445b] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Transaksi Terbaru</h4>
              <button 
                onClick={() => onViewChange('transaksi')}
                className="text-[10px] text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Transaction Compact List */}
            <div className="space-y-3">
              {latestTransactions.map((t) => (
                <div 
                  key={t.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-50 dark:border-[#2b2c40] bg-slate-50/50 dark:bg-[#202030]/50 hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {t.customerName}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-300" />
                      <span>{t.date}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-500">{t.productName} ({t.quantity}x)</span>
                    </p>
                  </div>
                  
                  <div className="text-right flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {formatRupiah(t.totalBill)}
                    </span>
                    {t.debtAmount === 0 ? (
                      <span className="px-1.5 py-0.5 bg-success-light text-success font-bold text-[9px] rounded-xs uppercase">
                        Lunas
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-warning/15 text-warning font-bold text-[9px] rounded-xs uppercase">
                        Hutang {formatRupiah(t.debtAmount)}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {latestTransactions.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Belum ada transaksi terdaftar.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>Terakhir diperbarui:</span>
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-200">Hari ini</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
