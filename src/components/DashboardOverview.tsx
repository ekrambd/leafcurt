import { useState, useMemo, useEffect } from 'react';
import { 
  ShoppingBag, DollarSign, Package, Users, ArrowRight, 
  Search, AlertTriangle, Truck, Clock, CheckCircle2, XCircle, Globe, RefreshCw,
  Calendar, CalendarDays, Filter
} from 'lucide-react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Product, BookOrder, Customer, ActiveTab } from '../types';

export type DateFilterPreset = 'today' | 'yesterday' | 'last7days' | 'lastMonth' | 'custom';

interface DashboardOverviewProps {
  products: Product[];
  orders: BookOrder[];
  customers: Customer[];
  onNavigateTab: (tab: ActiveTab) => void;
}

export default function DashboardOverview({ 
  products = [], 
  orders = [], 
  customers = [], 
  onNavigateTab 
}: DashboardOverviewProps) {
  // Date filter state - 'today' is selected by default as requested
  const [dateFilter, setDateFilter] = useState<DateFilterPreset>('today');
  
  // Custom date picker range (defaulting to today's date)
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const [customStart, setCustomStart] = useState<string>(todayStr);
  const [customEnd, setCustomEnd] = useState<string>(todayStr);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tableScope, setTableScope] = useState<'period' | 'all'>('period');

  // Calculate timestamp boundaries for each preset filter
  const dateRange = useMemo(() => {
    const now = new Date();

    if (dateFilter === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
      return {
        start,
        end,
        label: "Today's",
        badge: `Today (${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`
      };
    }

    if (dateFilter === 'yesterday') {
      const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const start = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0).getTime();
      const end = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999).getTime();
      return {
        start,
        end,
        label: "Yesterday's",
        badge: `Yesterday (${y.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`
      };
    }

    if (dateFilter === 'last7days') {
      const startD = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
      const endD = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return {
        start: startD.getTime(),
        end: endD.getTime(),
        label: "Last 7 Days",
        badge: `Last 7 Days (${startD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
      };
    }

    if (dateFilter === 'lastMonth') {
      const startD = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const endD = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return {
        start: startD.getTime(),
        end: endD.getTime(),
        label: "Last Month's",
        badge: `Last Month (${startD.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`
      };
    }

    // Custom
    const sDate = customStart ? new Date(`${customStart}T00:00:00`) : new Date(0);
    const eDate = customEnd ? new Date(`${customEnd}T23:59:59.999`) : new Date();
    return {
      start: isNaN(sDate.getTime()) ? 0 : sDate.getTime(),
      end: isNaN(eDate.getTime()) ? Date.now() : eDate.getTime(),
      label: "Custom Period",
      badge: `Custom (${customStart} to ${customEnd})`
    };
  }, [dateFilter, customStart, customEnd]);

  // Helper to extract timestamp from order
  const getOrderTimestamp = (o: BookOrder): number => {
    const raw = o.orderDate || o.createdAt || (o as any).date;
    if (!raw) return 0;
    const t = new Date(raw).getTime();
    return isNaN(t) ? 0 : t;
  };

  // Orders filtered by the selected date range
  const periodOrders = useMemo(() => {
    return orders.filter(o => {
      const t = getOrderTimestamp(o);
      return t >= dateRange.start && t <= dateRange.end;
    });
  }, [orders, dateRange]);

  // Period-specific metrics
  const periodRevenue = useMemo(() => {
    return periodOrders
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + (o.totalPrice || o.totalAmount || 0), 0);
  }, [periodOrders]);

  const periodPendingCount = useMemo(() => {
    return periodOrders.filter(o => o.status === 'Pending').length;
  }, [periodOrders]);

  const periodDeliveredCount = useMemo(() => {
    return periodOrders.filter(o => o.status === 'Delivered').length;
  }, [periodOrders]);

  const periodCancelledCount = useMemo(() => {
    return periodOrders.filter(o => o.status === 'Cancelled').length;
  }, [periodOrders]);

  const periodReturnedCount = useMemo(() => {
    return periodOrders.filter(o => o.status === 'Return').length;
  }, [periodOrders]);

  // Lifetime counts for context
  const lifetimeRevenue = useMemo(() => {
    return orders
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + (o.totalPrice || o.totalAmount || 0), 0);
  }, [orders]);

  const allPendingOrdersCount = useMemo(() => {
    return orders.filter(o => o.status === 'Pending').length;
  }, [orders]);

  const allDeliveredOrdersCount = useMemo(() => {
    return orders.filter(o => o.status === 'Delivered').length;
  }, [orders]);

  const allCancelledOrdersCount = useMemo(() => {
    return orders.filter(o => o.status === 'Cancelled').length;
  }, [orders]);

  const allReturnedOrdersCount = useMemo(() => {
    return orders.filter(o => o.status === 'Return').length;
  }, [orders]);

  const lowStockProductsCount = useMemo(() => {
    return products.filter(p => p.stock <= 5 || !p.isAvailable).length;
  }, [products]);

  // Dynamic Chart Data corresponding to the selected filter
  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();

    if (dateFilter === 'today' || dateFilter === 'yesterday') {
      const targetDate = dateFilter === 'today' 
        ? new Date() 
        : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      
      const hours = [0, 3, 6, 9, 12, 15, 18, 21];
      
      hours.forEach((h, idx) => {
        const slotStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), h, 0, 0, 0).getTime();
        const nextH = idx === hours.length - 1 ? 24 : hours[idx + 1];
        const slotEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), nextH - 1, 59, 59, 999).getTime();

        const slotOrders = periodOrders.filter(o => {
          const t = getOrderTimestamp(o);
          return t >= slotStart && t <= slotEnd;
        });

        const slotRevenue = slotOrders
          .filter(o => o.status !== 'Cancelled')
          .reduce((sum, o) => sum + (o.totalPrice || o.totalAmount || 0), 0);

        const label = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;

        data.push({
          name: label,
          orders: slotOrders.length,
          revenue: slotRevenue
        });
      });
      return data;
    }

    if (dateFilter === 'last7days') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
        const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();

        const dayOrders = orders.filter(o => {
          const t = getOrderTimestamp(o);
          return t >= dayStart && t <= dayEnd;
        });

        const dayRevenue = dayOrders
          .filter(o => o.status !== 'Cancelled')
          .reduce((sum, o) => sum + (o.totalPrice || o.totalAmount || 0), 0);

        data.push({
          name: d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
          orders: dayOrders.length,
          revenue: dayRevenue
        });
      }
      return data;
    }

    if (dateFilter === 'lastMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      const totalDays = lastDay.getDate();

      const step = totalDays > 20 ? 3 : 1;
      for (let day = 1; day <= totalDays; day += step) {
        const curStart = new Date(firstDay.getFullYear(), firstDay.getMonth(), day, 0, 0, 0, 0).getTime();
        const endDay = Math.min(day + step - 1, totalDays);
        const curEnd = new Date(firstDay.getFullYear(), firstDay.getMonth(), endDay, 23, 59, 59, 999).getTime();

        const intervalOrders = periodOrders.filter(o => {
          const t = getOrderTimestamp(o);
          return t >= curStart && t <= curEnd;
        });

        const intervalRev = intervalOrders
          .filter(o => o.status !== 'Cancelled')
          .reduce((sum, o) => sum + (o.totalPrice || o.totalAmount || 0), 0);

        const name = step === 1 
          ? `${firstDay.toLocaleDateString('en-US', { month: 'short' })} ${day}`
          : `${firstDay.toLocaleDateString('en-US', { month: 'short' })} ${day}-${endDay}`;

        data.push({
          name,
          orders: intervalOrders.length,
          revenue: intervalRev
        });
      }
      return data;
    }

    // Custom range
    const diffDays = Math.max(1, Math.round((dateRange.end - dateRange.start) / 86400000));
    const stepDays = diffDays > 30 ? Math.ceil(diffDays / 15) : 1;
    for (let i = 0; i < diffDays; i += stepDays) {
      const curStart = dateRange.start + i * 86400000;
      const curEnd = Math.min(dateRange.end, curStart + stepDays * 86400000 - 1);
      const d = new Date(curStart);

      const intervalOrders = periodOrders.filter(o => {
        const t = getOrderTimestamp(o);
        return t >= curStart && t <= curEnd;
      });

      const intervalRev = intervalOrders
        .filter(o => o.status !== 'Cancelled')
        .reduce((sum, o) => sum + (o.totalPrice || o.totalAmount || 0), 0);

      data.push({
        name: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        orders: intervalOrders.length,
        revenue: intervalRev
      });
    }

    return data;
  }, [dateFilter, periodOrders, orders, dateRange]);

  // Filtered orders for quick overview (table scope: period or all)
  const filteredOrders = useMemo(() => {
    const baseList = tableScope === 'period' ? periodOrders : orders;
    return baseList.filter(o => {
      const matchesSearch = 
        !searchTerm || 
        o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.phone?.includes(searchTerm) ||
        o.id?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tableScope, periodOrders, orders, searchTerm, statusFilter]);

  const getStatusBadge = (status: BookOrder['status']) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
      case 'Confirmed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Confirmed
          </span>
        );
      case 'Shipped':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Truck className="h-3 w-3 mr-1" />
            Shipped
          </span>
        );
      case 'Delivered':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Delivered
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 font-sans">

      {/* Top Filter Bar (Today by default, Yesterday, Last 7 Days, Last Month, Custom Range) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left: Summary Title & Live Badge */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Dashboard Summary</h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#0279c7] border border-blue-200/80 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#0279c7] animate-pulse"></span>
                {dateRange.badge}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Sales, order volume, and fulfillment analytics for the selected reporting period
            </p>
          </div>

          {/* Right: Date Preset Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'last7days', label: 'Last 7 Days' },
              { id: 'lastMonth', label: 'Last Month' },
              { id: 'custom', label: 'Custom Range' },
            ].map(tab => {
              const active = dateFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDateFilter(tab.id as DateFilterPreset)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                    active 
                      ? 'bg-[#0279c7] text-white shadow-md shadow-[#0279c7]/30 scale-[1.02]' 
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                  }`}
                >
                  {tab.id === 'today' && <Clock className="w-3.5 h-3.5" />}
                  {tab.id === 'custom' && <Calendar className="w-3.5 h-3.5" />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Range Date Pickers (Shown smoothly when 'custom' is selected) */}
        {dateFilter === 'custom' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/60"
          >
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Start Date:</span>
                <input 
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-medium focus:ring-2 focus:ring-[#0279c7]/20 focus:border-[#0279c7] text-slate-800"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">End Date:</span>
                <input 
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-medium focus:ring-2 focus:ring-[#0279c7]/20 focus:border-[#0279c7] text-slate-800"
                />
              </div>
            </div>
            <span className="text-xs text-[#0279c7] font-bold">
              {periodOrders.length} order(s) found in selected range
            </span>
          </motion.div>
        )}
      </div>

      {/* Top Stat Cards (All using Sidebar Blue Palette and White Text) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Sales / Revenue in Period */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.02 }}
          className="admin-stat-card bg-gradient-to-br from-[#0279c7] via-[#026aa6] to-[#014d7a] p-5 rounded-2xl shadow-lg shadow-[#0279c7]/20 flex items-center justify-between text-white relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 bg-white/10 w-24 h-24 rounded-full blur-2xl"></div>
          <div className="space-y-1 relative z-10">
            <span className="stat-label text-blue-100 font-bold text-xs block tracking-wide">{dateRange.label} Revenue</span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white !text-white drop-shadow-xs">Tk.{periodRevenue.toLocaleString()}</h3>
            <span className="stat-subtitle text-[11px] text-blue-100/80 font-medium block">Lifetime Total: Tk.{lifetimeRevenue.toLocaleString()}</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center relative z-10 border border-white/25 text-white shadow-xs">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
        </motion.div>

        {/* Total Orders in Period */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.02 }}
          onClick={() => onNavigateTab('orders')}
          className="admin-stat-card bg-gradient-to-br from-[#1d4ed8] via-[#2563eb] to-[#0279c7] p-5 rounded-2xl shadow-lg shadow-blue-600/20 cursor-pointer flex items-center justify-between text-white group relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 bg-white/10 w-24 h-24 rounded-full blur-2xl"></div>
          <div className="space-y-1 relative z-10">
            <span className="stat-label text-blue-100 font-bold text-xs block tracking-wide">{dateRange.label} Orders</span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white !text-white drop-shadow-xs">{periodOrders.length}</h3>
            <span className="stat-subtitle text-[11px] text-blue-100/80 font-medium block">Lifetime: {orders.length} total orders</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center relative z-10 border border-white/25 text-white shadow-xs group-hover:rotate-6 transition-transform">
            <ShoppingBag className="h-6 w-6 text-white" />
          </div>
        </motion.div>

        {/* Stock / Products */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.02 }}
          onClick={() => onNavigateTab('products')}
          className="admin-stat-card bg-gradient-to-br from-[#0284c7] via-[#0369a1] to-[#0279c7] p-5 rounded-2xl shadow-lg shadow-sky-600/20 cursor-pointer flex items-center justify-between text-white group relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 bg-white/10 w-24 h-24 rounded-full blur-2xl"></div>
          <div className="space-y-1 relative z-10">
            <span className="stat-label text-blue-100 font-bold text-xs block tracking-wide">Total Products</span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white !text-white drop-shadow-xs">{products.length}</h3>
            <span className="stat-subtitle text-[11px] text-blue-100/80 font-medium block">
              {lowStockProductsCount > 0 ? `Stockout / Low Stock: ${lowStockProductsCount}` : 'All items in stock'}
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center relative z-10 border border-white/25 text-white shadow-xs group-hover:rotate-6 transition-transform">
            <Package className="h-6 w-6 text-white" />
          </div>
        </motion.div>

        {/* Total Customers */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.02 }}
          onClick={() => onNavigateTab('customers')}
          className="admin-stat-card bg-gradient-to-br from-[#0279c7] via-[#0ea5e9] to-[#06b6d4] p-5 rounded-2xl shadow-lg shadow-cyan-600/20 cursor-pointer flex items-center justify-between text-white group relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 bg-white/10 w-24 h-24 rounded-full blur-2xl"></div>
          <div className="space-y-1 relative z-10">
            <span className="stat-label text-cyan-100 font-bold text-xs block tracking-wide">Total Customers</span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white !text-white drop-shadow-xs">{customers.length}</h3>
            <span className="stat-subtitle text-[11px] text-cyan-100/80 font-medium block">Delivered in period: {periodDeliveredCount}</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center relative z-10 border border-white/25 text-white shadow-xs group-hover:rotate-6 transition-transform">
            <Users className="h-6 w-6 text-white" />
          </div>
        </motion.div>
      </div>

      {/* Additional Stats Cards (All matching Sidebar Blue and Crisp White Typography) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Pending Orders */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.02 }}
          onClick={() => onNavigateTab('orders')}
          className="admin-stat-card bg-gradient-to-br from-[#0269ad] via-[#0279c7] to-[#d97706] p-5 rounded-2xl shadow-lg shadow-amber-600/20 cursor-pointer flex items-center justify-between text-white group relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 bg-white/10 w-24 h-24 rounded-full blur-2xl"></div>
          <div className="space-y-1 relative z-10">
            <span className="stat-label text-white/90 font-bold text-xs block tracking-wide">Pending Orders</span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white !text-white drop-shadow-xs">{periodPendingCount}</h3>
            <span className="stat-subtitle text-[11px] text-white/80 font-medium block">Lifetime pending: {allPendingOrdersCount}</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center relative z-10 border border-white/25 text-white shadow-xs group-hover:rotate-6 transition-transform">
            <Clock className="h-6 w-6 text-white" />
          </div>
        </motion.div>

        {/* Delivered Orders */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.02 }}
          onClick={() => onNavigateTab('orders')}
          className="admin-stat-card bg-gradient-to-br from-[#0279c7] via-[#0284c7] to-[#059669] p-5 rounded-2xl shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center justify-between text-white group relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 bg-white/10 w-24 h-24 rounded-full blur-2xl"></div>
          <div className="space-y-1 relative z-10">
            <span className="stat-label text-white/90 font-bold text-xs block tracking-wide">Delivered Orders</span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white !text-white drop-shadow-xs">{periodDeliveredCount}</h3>
            <span className="stat-subtitle text-[11px] text-white/80 font-medium block">Lifetime delivered: {allDeliveredOrdersCount}</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center relative z-10 border border-white/25 text-white shadow-xs group-hover:rotate-6 transition-transform">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
        </motion.div>

        {/* Cancelled Orders */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.02 }}
          onClick={() => onNavigateTab('orders')}
          className="admin-stat-card bg-gradient-to-br from-[#0269ad] via-[#1e293b] to-[#dc2626] p-5 rounded-2xl shadow-lg shadow-rose-600/20 cursor-pointer flex items-center justify-between text-white group relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 bg-white/10 w-24 h-24 rounded-full blur-2xl"></div>
          <div className="space-y-1 relative z-10">
            <span className="stat-label text-white/90 font-bold text-xs block tracking-wide">Cancelled Orders</span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white !text-white drop-shadow-xs">{periodCancelledCount}</h3>
            <span className="stat-subtitle text-[11px] text-white/80 font-medium block">Lifetime cancelled: {allCancelledOrdersCount}</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center relative z-10 border border-white/25 text-white shadow-xs group-hover:rotate-6 transition-transform">
            <XCircle className="h-6 w-6 text-white" />
          </div>
        </motion.div>

        {/* Returned Orders */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.02 }}
          onClick={() => onNavigateTab('orders')}
          className="admin-stat-card bg-gradient-to-br from-[#0279c7] via-[#0269ad] to-[#7c3aed] p-5 rounded-2xl shadow-lg shadow-purple-600/20 cursor-pointer flex items-center justify-between text-white group relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 bg-white/10 w-24 h-24 rounded-full blur-2xl"></div>
          <div className="space-y-1 relative z-10">
            <span className="stat-label text-white/90 font-bold text-xs block tracking-wide">Returned Orders</span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white !text-white drop-shadow-xs">{periodReturnedCount}</h3>
            <span className="stat-subtitle text-[11px] text-white/80 font-medium block">Lifetime returned: {allReturnedOrdersCount}</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center relative z-10 border border-white/25 text-white shadow-xs group-hover:rotate-6 transition-transform">
            <RefreshCw className="h-6 w-6 text-white" />
          </div>
        </motion.div>
      </div>

      {/* Analytics Charts (Dynamically labeled with the current period badge) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Orders Trend */}
        <div className="w-full min-w-0 bg-white rounded-2xl border border-slate-100 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Orders Trend</h3>
            <span className="text-[11px] font-semibold text-[#0279c7] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              {dateRange.badge}
            </span>
          </div>
          <div className="w-full min-w-0" style={{ height: 250, minHeight: 250 }}>
            <ResponsiveContainer width="100%" height={250} minWidth={1} minHeight={220}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="orders" name="Orders" fill="#0279c7" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="w-full min-w-0 bg-white rounded-2xl border border-slate-100 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Revenue Trend</h3>
            <span className="text-[11px] font-semibold text-[#0279c7] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              {dateRange.badge}
            </span>
          </div>
          <div className="w-full min-w-0" style={{ height: 250, minHeight: 250 }}>
            <ResponsiveContainer width="100%" height={250} minWidth={1} minHeight={220}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0279c7" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#0279c7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `Tk.${val}`} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(val) => [`Tk.${val}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#0279c7" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Content: Recent Orders List (Full Width) */}
      <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Orders</h3>
            <p className="text-[11px] text-slate-500">Latest customer orders placed on the store</p>
          </div>
          
          <button 
            onClick={() => onNavigateTab('orders')}
            className="text-xs text-teal-600 hover:text-teal-700 font-bold inline-flex items-center group cursor-pointer"
          >
            View all orders ({orders.length})
            <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Quick Search, Scope Toggle, and Status Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by order ID, name or phone..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0279c7]/20 focus:border-[#0279c7]"
            />
          </div>

          {/* Table Scope Selector: Period vs All */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
            <button
              type="button"
              onClick={() => setTableScope('period')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                tableScope === 'period'
                  ? 'bg-white text-[#0279c7] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {dateRange.label} ({periodOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setTableScope('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                tableScope === 'all'
                  ? 'bg-white text-[#0279c7] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Orders ({orders.length})
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0279c7]/20 focus:border-[#0279c7] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-y border-slate-100 text-[11px]">
                <th className="py-2.5 px-3 font-bold">Order ID & Date</th>
                <th className="py-2.5 px-3 font-bold">Customer & Mobile</th>
                <th className="py-2.5 px-3 font-bold">Product</th>
                <th className="py-2.5 px-3 font-bold">Price</th>
                <th className="py-2.5 px-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.slice(0, 8).map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900 font-mono block">{ord.id}</span>
                    <span className="text-[10px] text-slate-500 block">
                      {new Date(ord.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900 block">{ord.customerName}</span>
                    <a href={`tel:${ord.phone}`} className="text-[10px] font-mono text-teal-600 hover:underline block">{ord.phone}</a>
                  </td>
                  <td className="py-3 px-3 max-w-[200px] truncate">
                    <span className="text-slate-800 font-medium block truncate" title={ord.productTitle}>{ord.productTitle}</span>
                    <span className="text-[10px] text-slate-500 block">Quantity: {ord.quantity || 1}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-emerald-600">Tk.{ord.totalPrice}</span>
                    <span className="text-[10px] text-slate-500 block">{ord.paymentMethod || 'COD'}</span>
                  </td>
                  <td className="py-3 px-3">
                    {getStatusBadge(ord.status)}
                  </td>
                </tr>
              ))}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
