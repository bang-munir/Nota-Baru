import React, { useMemo } from 'react';
import { Transaction, Product, Payment, ViewType } from '../types';
import { formatRupiah } from '../utils';
import {
  Banknote,
  HandCoins,
  Scissors,
  AlertTriangle,
  TrendingUp,
  Package,
  Hash,
  Clock,
  ArrowRight,
  ShoppingCart,
  Layers,
  Receipt,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from 'lucide-react';

interface DashboardViewProps {
  transactions: Transaction[];
  products: Product[];
  payments: Payment[];
  onViewChange: (view: ViewType) => void;
}

export default function DashboardView({
  transactions,
  products,
  payments,
  onViewChange,
}: DashboardViewProps) {

  // ── KPI Stats ──────────────────────────────────────────────
  const stats = useMemo(() => {
    let subtotal = 0;
    let sudahDibayar = 0;
    let totalPotongan = 0;
    let sisaHutang = 0;

    transactions.forEach((t) => {
      subtotal += t.totalProductPrice;
      sudahDibayar += t.paidAmount;
      totalPotongan += t.totalDiscountAmount;
      sisaHutang += t.debtAmount;
    });

    return { subtotal, sudahDibayar, totalPotongan, sisaHutang };
  }, [transactions]);

  // ── Produk Terbanyak ───────────────────────────────────────
  const topProducts = useMemo(() => {
    const qtyMap = new Map<string, number>();

    transactions.forEach((t) => {
      t.items.forEach((item) => {
        const current = qtyMap.get(item.productName) || 0;
        qtyMap.set(item.productName, current + item.quantity);
      });
    });

    const sorted = Array.from(qtyMap.entries())
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return sorted;
  }, [transactions]);

  const totalQtyTerjual = useMemo(() => {
    return topProducts.reduce((sum, p) => sum + p.qty, 0) ||
      transactions.reduce((sum, t) => sum + t.items.reduce((s, i) => s + i.quantity, 0), 0);
  }, [topProducts, transactions]);

  // ── Transaksi Terbaru ──────────────────────────────────────
  const latestTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  // ── Ringkasan ──────────────────────────────────────────────
  const summary = useMemo(() => {
    const totalTransaksi = transactions.length;
    const produkTerjual = new Set(
      transactions.flatMap((t) => t.items.map((i) => i.productId))
    ).size;
    const totalQty = transactions.reduce(
      (sum, t) => sum + t.items.reduce((s, i) => s + i.quantity, 0),
      0
    );
    const belumLunas = transactions.filter((t) => t.debtAmount > 0).length;

    return { totalTransaksi, produkTerjual, totalQty, belumLunas };
  }, [transactions]);

  // ── Empty state ────────────────────────────────────────────
  if (transactions.length === 0) {
    return (
      <div className="px-4 lg:px-6 py-12">
        <div className="bg-white rounded-2xl border border-[#e4e6e8] shadow-xs p-12 text-center max-w-md mx-auto">
          <div className="mx-auto w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Receipt className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">Belum ada transaksi</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Transaksi yang dibuat akan muncul di dashboard.
          </p>
        </div>
      </div>
    );
  }

  // ── KPI Cards Data ─────────────────────────────────────────
  const kpiCards = [
    {
      label: 'Subtotal',
      value: formatRupiah(stats.subtotal),
      icon: Banknote,
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      borderColor: 'border-t-blue-500',
      valueColor: 'text-blue-700',
    },
    {
      label: 'Sudah Dibayar',
      value: formatRupiah(stats.sudahDibayar),
      icon: HandCoins,
      bg: 'bg-emerald-50',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      borderColor: 'border-t-emerald-500',
      valueColor: 'text-emerald-700',
    },
    {
      label: 'Total Potongan',
      value: formatRupiah(stats.totalPotongan),
      icon: Scissors,
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      borderColor: 'border-t-amber-500',
      valueColor: 'text-amber-700',
    },
    {
      label: 'Sisa Hutang',
      value: formatRupiah(stats.sisaHutang),
      icon: AlertTriangle,
      bg: stats.sisaHutang > 0 ? 'bg-rose-50' : 'bg-emerald-50',
      iconBg: stats.sisaHutang > 0 ? 'bg-rose-100' : 'bg-emerald-100',
      iconColor: stats.sisaHutang > 0 ? 'text-rose-600' : 'text-emerald-600',
      borderColor: stats.sisaHutang > 0 ? 'border-t-rose-500' : 'border-t-emerald-500',
      valueColor: stats.sisaHutang > 0 ? 'text-rose-700' : 'text-emerald-700',
    },
  ];

  return (
    <div className="px-4 lg:px-6 space-y-6">

      {/* ── Header ──────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Dashboard</h2>
        <p className="text-xs text-slate-400 mt-0.5">Ringkasan kondisi transaksi dan penjualan</p>
      </div>

      {/* ── KPI Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`${card.bg} rounded-2xl border border-[#e4e6e8] border-t-[3px] ${card.borderColor} shadow-xs p-5 flex flex-col gap-3`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {card.label}
                </span>
                <div className={`p-2 rounded-xl ${card.iconBg} ${card.iconColor}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className={`text-xl font-bold tracking-tight ${card.valueColor}`}>{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* ── Two Column: Produk Terbanyak + Transaksi Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Produk Terbanyak ──────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#e4e6e8] border-t-[3px] border-t-blue-500 shadow-xs flex flex-col">
          <div className="px-5 pt-5 pb-4 border-b border-blue-100 bg-blue-50/50 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500 rounded-xl shadow-sm">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-blue-800">Produk Terbanyak</h4>
                <p className="text-[10px] text-blue-400">Berdasarkan jumlah qty terjual</p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-5">
            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada produk terjual
              </div>
            ) : (
              <div className="space-y-3">
                {topProducts.map((product, idx) => {
                  const maxQty = topProducts[0]?.qty || 1;
                  const barWidth = (product.qty / maxQty) * 100;
                  return (
                    <div key={product.name} className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-300 w-4 text-right tabular-nums">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-700 truncate">
                            {product.name}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500 tabular-nums ml-2 shrink-0">
                            {product.qty} pcs
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary/60 rounded-full"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Total Qty */}
          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Total Qty Terjual
                </span>
              </div>
              <span className="text-sm font-bold text-slate-800 tabular-nums">
                {totalQtyTerjual.toLocaleString('id-ID')} pcs
              </span>
            </div>
          </div>
        </div>

        {/* ── Transaksi Terbaru ─────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#e4e6e8] border-t-[3px] border-t-emerald-500 shadow-xs flex flex-col">
          <div className="px-5 pt-5 pb-4 border-b border-emerald-100 bg-emerald-50/50 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500 rounded-xl shadow-sm">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-800">Transaksi Terbaru</h4>
                  <p className="text-[10px] text-emerald-400">5 transaksi terakhir</p>
                </div>
              </div>
              <button
                onClick={() => onViewChange('transaksi')}
                className="text-[10px] text-emerald-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 p-5">
            {latestTransactions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada transaksi
              </div>
            ) : (
              <div className="space-y-3">
                {latestTransactions.map((t) => {
                  const isLunas = t.debtAmount === 0;
                  const dateObj = new Date(t.date);
                  const day = dateObj.getDate();
                  const monthNames = [
                    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
                    'Jul', 'Agu', 'Sep', 'Okt', 'Nop', 'Des',
                  ];
                  const monthLabel = monthNames[dateObj.getMonth()];
                  const year = dateObj.getFullYear();

                  // Get customer name from first item or fallback
                  const customerName = t.items[0]?.productName || 'Pelanggan';

                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-slate-200 transition-all"
                    >
                      {/* Date badge */}
                      <div className="w-11 h-11 rounded-xl bg-slate-100 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-primary leading-none">{day}</span>
                        <span className="text-[8px] font-semibold text-slate-400 leading-none mt-0.5">
                          {monthLabel}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {t.items.map((i) => i.productName).join(', ')}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-400">{t.id}</span>
                          <span className="text-[10px] text-slate-300">•</span>
                          <span className="text-[10px] text-slate-400">
                            {t.items.reduce((s, i) => s + i.quantity, 0)} item
                          </span>
                        </div>
                      </div>

                      {/* Amount & Status */}
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-slate-800 tabular-nums">
                          {formatRupiah(t.totalBill)}
                        </p>
                        <div className="mt-1 flex items-center justify-end gap-1">
                          {isLunas ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded-md">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              LUNAS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[9px] font-bold rounded-md">
                              <XCircle className="h-2.5 w-2.5" />
                              HUTANG
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Ringkasan ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#e4e6e8] border-t-[3px] border-t-violet-500 shadow-xs p-5">
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-violet-100">
          <div className="p-2 bg-violet-500 rounded-xl shadow-sm">
            <Layers className="h-4 w-4 text-white" />
          </div>
          <h4 className="text-sm font-bold text-violet-800">Ringkasan</h4>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-100">
            <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
              <Receipt className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                Total Transaksi
              </p>
              <p className="text-base font-bold text-blue-700 tabular-nums">
                {summary.totalTransaksi}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-violet-50 to-violet-100/50 rounded-xl border border-violet-100">
            <div className="p-2 bg-violet-500 rounded-lg shadow-sm">
              <Package className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider">
                Produk Terjual
              </p>
              <p className="text-base font-bold text-violet-700 tabular-nums">
                {summary.produkTerjual}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-100">
            <div className="p-2 bg-emerald-500 rounded-lg shadow-sm">
              <ShoppingCart className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
                Total Qty
              </p>
              <p className="text-base font-bold text-emerald-700 tabular-nums">
                {summary.totalQty.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-rose-50 to-rose-100/50 rounded-xl border border-rose-100">
            <div className="p-2 bg-rose-500 rounded-lg shadow-sm">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider">
                Belum Lunas
              </p>
              <p className="text-base font-bold text-rose-700 tabular-nums">
                {summary.belumLunas}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
