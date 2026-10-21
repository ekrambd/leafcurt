import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShoppingCart,
  Phone,
  MessageCircle,
  Send,
  ShoppingBag,
  Clock,
  MapPin,
  Search,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  ChevronRight,
  Filter,
  DollarSign,
  ArrowUpRight,
  UserCheck,
  Zap,
  Trash2,
  FileText,
  Check,
  Eye,
  Percent,
  X
} from 'lucide-react';
import { AbandonedCart, AbandonedCartMetrics, AbandonedCartStatus, AbandonedCartRecoveryChannel, EcomSettings } from '../types';
import { dbService } from '../lib/dbService';
import { ConfirmDialog } from './ui/ConfirmDialog';

export default function AbandonedCartManager() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [metrics, setMetrics] = useState<AbandonedCartMetrics>({
    totalAbandoned: 0,
    adminRecoveredCount: 0,
    selfRecoveredCount: 0,
    totalRecoveredCount: 0,
    recoveredRevenue: 0,
    potentialLostRevenue: 0,
    recoveryRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [ecomSettings, setEcomSettings] = useState<EcomSettings | null>(null);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<'all' | 'abandoned' | 'admin_recovered' | 'self_recovered' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Modals state
  const [whatsAppModalCart, setWhatsAppModalCart] = useState<AbandonedCart | null>(null);
  const [whatsAppTemplateIndex, setWhatsAppTemplateIndex] = useState(0);
  const [customWhatsAppMessage, setCustomWhatsAppMessage] = useState('');

  const [smsModalCart, setSmsModalCart] = useState<AbandonedCart | null>(null);
  const [smsMessage, setSmsMessage] = useState('');
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsFeedback, setSmsFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [convertModalCart, setConvertModalCart] = useState<AbandonedCart | null>(null);
  const [convertDeliveryCharge, setConvertDeliveryCharge] = useState<number>(60);
  const [convertPaymentMethod, setConvertPaymentMethod] = useState<string>('Cash on Delivery');
  const [convertNotes, setConvertNotes] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);

  const [deleteCartId, setDeleteCartId] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastNotification(message);
    setTimeout(() => {
      setToastNotification(null);
    }, 3500);
  };

  // Load carts & settings
  const loadCarts = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const [cartData, settings] = await Promise.all([
        dbService.getAbandonedCarts(),
        dbService.getEcomSettings()
      ]);
      setCarts(cartData.carts || []);
      setMetrics(cartData.metrics || {
        totalAbandoned: 0,
        adminRecoveredCount: 0,
        selfRecoveredCount: 0,
        totalRecoveredCount: 0,
        recoveredRevenue: 0,
        potentialLostRevenue: 0,
        recoveryRate: 0
      });
      setEcomSettings(settings);
    } catch (err) {
      console.error('Failed loading abandoned carts:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCarts();

    // Listen to real-time events
    const handleUpdate = () => loadCarts(true);
    window.addEventListener('abandoned-carts-updated', handleUpdate);
    window.addEventListener('book-orders-updated', handleUpdate);

    // Auto-poll every 15 seconds for live abandoned checkout sync
    const interval = setInterval(() => {
      loadCarts(true);
    }, 15000);

    return () => {
      window.removeEventListener('abandoned-carts-updated', handleUpdate);
      window.removeEventListener('book-orders-updated', handleUpdate);
      clearInterval(interval);
    };
  }, [loadCarts]);

  // Copy phone number helper
  const handleCopyPhone = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    showToast(`ফোন নম্বর ${phone} কপি করা হয়েছে`);
    setTimeout(() => setCopiedPhone(null), 2500);
  };

  // Store name for recovery templates
  const storeName = ecomSettings?.storeName || 'আমাদের শপ';
  const websiteUrl = typeof window !== 'undefined' ? window.location.origin : '';

  // Bengali Templates for WhatsApp Recovery
  const getWhatsAppTemplates = (cart: AbandonedCart) => {
    const custName = cart.customerName || 'সম্মানিত গ্রাহক';
    const firstItem = cart.items?.[0]?.productTitle || 'পণ্য';
    const otherCount = (cart.items?.length || 1) - 1;
    const itemText = otherCount > 0 ? `${firstItem} এবং আরও ${otherCount}টি পণ্য` : firstItem;
    const amount = (cart.totalAmount || 0).toLocaleString('bn-BD');

    return [
      {
        id: 'reminder_offer',
        title: '🔥 রিমাইন্ডার + স্পেশাল ডিসকাউন্ট',
        body: `আসসালামু আলাইকুম ${custName}! 🌸\n${storeName}-এ আপনার কার্টে "${itemText}" রাখা আছে (মোট: ৳${amount})।\nঅর্ডারটি কি কনফার্ম করতে কোনো সমস্যা হচ্ছে? আজই কনফার্ম করলে পাচ্ছেন স্পেশাল গিফট ও দ্রুত হোম ডেলিভারি!\nঅর্ডার কনফার্ম করতে দয়া করে এখানে রিপ্লাই দিন অথবা কল করুন। ধন্যবাদ!`
      },
      {
        id: 'free_delivery',
        title: '🚚 ফ্রি ডেলিভারি অফার',
        body: `প্রিয় ${custName},\n${storeName}-এ আপনার পছন্দের "${itemText}" ব্যাগে যোগ করার জন্য ধন্যবাদ!\nআপনি যাতে দ্রুত পণ্যটি পান, তাই আপনার জন্য আজ রয়েছে ফ্রি হোম ডেলিভারি অফার!\nঅর্ডার কনফার্ম করতে "হ্যাঁ" লিখে রিপ্লাই দিন, আমরা এখনই পাঠিয়ে দিচ্ছি।`
      },
      {
        id: 'assistance',
        title: '🤝 হেল্প ও কাস্টমার কেয়ার',
        body: `আসসালামু আলাইকুম ${custName},\nআমরা ${storeName} থেকে যোগাযোগ করছি। লক্ষ্য করলাম আপনি "${itemText}" অর্ডার করার চেষ্টা করছিলেন।\nঅর্ডার সংক্রান্ত কোনো তথ্য বা সাইজ/কালার সিলেকশনে কি কোনো সহায়তা প্রয়োজন? আমাদের জানান, আমরা এখনই অর্ডারটি বুক করে দিচ্ছি।`
      }
    ];
  };

  // Open WhatsApp Modal
  const handleOpenWhatsAppModal = (cart: AbandonedCart) => {
    setWhatsAppModalCart(cart);
    const templates = getWhatsAppTemplates(cart);
    setWhatsAppTemplateIndex(0);
    setCustomWhatsAppMessage(templates[0].body);
  };

  // Send WhatsApp message
  const handleSendWhatsApp = async () => {
    if (!whatsAppModalCart) return;
    const rawPhone = whatsAppModalCart.customerPhone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '').replace(/^880/, '880').replace(/^0/, '880');
    const message = customWhatsAppMessage.trim();

    // Mark as recovered or channel updated
    await dbService.markAbandonedCartRecovered(whatsAppModalCart.id, 'whatsapp', 'WhatsApp recovery message dispatched');

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');

    setWhatsAppModalCart(null);
    showToast('হোয়াটসঅ্যাপ রিকভারি মেসেজ পাঠানো হয়েছে!');
    loadCarts(true);
  };

  // Open SMS Modal
  const handleOpenSmsModal = (cart: AbandonedCart) => {
    setSmsModalCart(cart);
    const custName = cart.customerName || 'গ্রাহক';
    const firstItem = cart.items?.[0]?.productTitle || 'পণ্য';
    const amount = cart.totalAmount || 0;
    const defaultSms = `Prio ${custName}, ${storeName}-e apnar cart-e [${firstItem}] royeche. Aaj e order confirm korle pacchen free delivery! Call: ${ecomSettings?.deliveryChargeInsideDhaka ? 'Help' : ''} ba reply din.`;
    setSmsMessage(defaultSms);
    setSmsFeedback(null);
  };

  // Send 1-Click SMS
  const handleSendSms = async () => {
    if (!smsModalCart || !smsMessage.trim()) return;
    setIsSendingSms(true);
    setSmsFeedback(null);

    try {
      const res = await dbService.sendAbandonedCartSms(smsModalCart.customerPhone, smsMessage.trim(), smsModalCart.id);
      if (res.success) {
        setSmsFeedback({ type: 'success', text: res.message || 'এসএমএস সফলভাবে পাঠানো হয়েছে!' });
        await dbService.markAbandonedCartRecovered(smsModalCart.id, 'sms', `SMS Sent: ${smsMessage.slice(0, 30)}...`);
        showToast('এসএমএস গেটওয়ের মাধ্যমে পাঠানো সম্পন্ন!');
        setTimeout(() => {
          setSmsModalCart(null);
          loadCarts(true);
        }, 1200);
      } else {
        setSmsFeedback({ type: 'error', text: res.message || 'এসএমএস পাঠানো ব্যর্থ হয়েছে।' });
      }
    } catch (err: any) {
      setSmsFeedback({ type: 'error', text: err?.message || 'নেটওয়ার্ক ত্রুটি।' });
    } finally {
      setIsSendingSms(false);
    }
  };

  // Open Convert to Order Modal
  const handleOpenConvertModal = (cart: AbandonedCart) => {
    setConvertModalCart(cart);
    setConvertDeliveryCharge(cart.deliveryCharge || 60);
    setConvertPaymentMethod('Cash on Delivery');
    setConvertNotes('Admin 1-Click Abandoned Cart Recovered');
  };

  // Convert Abandoned Cart into Official Order
  const handleConvertOrder = async () => {
    if (!convertModalCart) return;
    setIsConverting(true);
    try {
      const res = await dbService.convertAbandonedCartToOrder(convertModalCart.id, {
        customDeliveryCharge: convertDeliveryCharge,
        paymentMethod: convertPaymentMethod,
        notes: convertNotes
      });

      if (res.success && res.order) {
        showToast(`🎉 কার্ট সফলভাবে অর্ডারে কনভার্ট হয়েছে! অর্ডার আইডি: #${res.order.id}`);
        setConvertModalCart(null);
        loadCarts(true);
      } else {
        alert(res.message || 'অর্ডারে রূপান্তর করতে সমস্যা হয়েছে।');
      }
    } catch (err: any) {
      alert(err?.message || 'ত্রুটি ঘটেছে।');
    } finally {
      setIsConverting(false);
    }
  };

  // Delete Cart
  const handleConfirmDelete = async () => {
    if (!deleteCartId) return;
    const ok = await dbService.deleteAbandonedCart(deleteCartId);
    if (ok) {
      showToast('কার্ট মুছে ফেলা হয়েছে');
      loadCarts(true);
    }
    setDeleteCartId(null);
  };

  // Filtered Carts List
  const filteredCarts = useMemo(() => {
    return carts.filter(c => {
      // Tab filter
      if (activeTab === 'abandoned' && c.status !== 'abandoned') return false;
      if (activeTab === 'admin_recovered' && c.status !== 'admin_recovered') return false;
      if (activeTab === 'self_recovered' && c.status !== 'self_recovered') return false;
      if (activeTab === 'cancelled' && c.status !== 'cancelled') return false;

      // Channel filter
      if (selectedChannelFilter !== 'all') {
        if (c.recoveryChannel !== selectedChannelFilter) return false;
      }

      // Source filter
      if (sourceFilter !== 'all') {
        if (c.source !== sourceFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const phone = (c.customerPhone || '').toLowerCase();
        const name = (c.customerName || '').toLowerCase();
        const district = (c.customerDistrict || '').toLowerCase();
        const address = (c.customerAddress || '').toLowerCase();
        const itemNames = (c.items || []).map(i => (i.productTitle || '').toLowerCase()).join(' ');

        if (!phone.includes(q) && !name.includes(q) && !district.includes(q) && !address.includes(q) && !itemNames.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [carts, activeTab, selectedChannelFilter, sourceFilter, searchQuery]);

  // Relative Time Formatter in Bengali
  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'কিছুক্ষণ আগে';
    try {
      const now = new Date().getTime();
      const past = new Date(dateStr).getTime();
      const diffSec = Math.floor((now - past) / 1000);

      if (diffSec < 60) return 'এইমাত্র';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} মিনিট আগে`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr} ঘণ্টা আগে`;
      const diffDays = Math.floor(diffHr / 24);
      if (diffDays === 1) return 'গতকাল';
      return `${diffDays} দিন আগে`;
    } catch {
      return 'সম্প্রতি';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Toast Alert */}
      {toastNotification && (
        <div className="fixed top-5 right-5 z-[9999] bg-slate-900 text-white text-xs sm:text-sm font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-fadeIn border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastNotification}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                <span>পরিত্যক্ত কার্ট রিকভারি</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 uppercase tracking-wider">
                  Fixo Cart
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                রিয়েল-টাইম ফোন ক্যাপচার, মাল্টি-চ্যানেল ১-ক্লিক রিকভারি ও সেলফ-অর্ডার ট্র্যাকিং
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200/60 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>লাইভ ডিবাউন্স সক্রিয়</span>
          </div>

          <button
            type="button"
            onClick={() => loadCarts()}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-teal-600' : ''}`} />
            <span>{isRefreshing ? 'রিফ্রেশ হচ্ছে...' : 'রিফ্রেশ'}</span>
          </button>
        </div>
      </div>

      {/* 5 Real-Time KPI Cards (Fixo-Cart Architecture) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        
        {/* Card 1: Total Abandoned Carts */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-200/70 shadow-xs relative overflow-hidden group hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">পরিত্যক্ত কার্ট</span>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              {metrics.totalAbandoned}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span>পেন্ডিং রিকভারি</span>
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500"></div>
        </div>

        {/* Card 2: Potential Lost Revenue */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200/70 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">সম্ভাব্য ক্ষতি</span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              ৳{metrics.potentialLostRevenue.toLocaleString()}
            </h3>
            <p className="text-[11px] text-amber-600 font-semibold mt-1">
              রিকভারির অপেক্ষায়
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"></div>
        </div>

        {/* Card 3: Admin Recovered */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-teal-200/70 shadow-xs relative overflow-hidden group hover:border-teal-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">অ্যাডমিন রিকভার্ড</span>
            <div className="p-2 bg-teal-50 rounded-xl text-teal-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              {metrics.adminRecoveredCount}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              ১-ক্লিক মেসেজ/কল দ্বারা
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500"></div>
        </div>

        {/* Card 4: Recovered Revenue */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200/70 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">রিকভার্ড রেভিনিউ</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-700">
              ৳{metrics.recoveredRevenue.toLocaleString()}
            </h3>
            <p className="text-[11px] text-emerald-600 font-bold mt-1">
              মোট উদ্ধারকৃত বিক্রয়
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
        </div>

        {/* Card 5: Conversion Rate */}
        <div className="col-span-2 lg:col-span-1 bg-white p-4 sm:p-5 rounded-2xl border border-indigo-200/70 shadow-xs relative overflow-hidden group hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">রিকভারি রেট</span>
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl sm:text-3xl font-black text-indigo-900">
                {metrics.recoveryRate}%
              </h3>
              <span className="text-[10px] text-slate-500">
                ({metrics.totalRecoveredCount}/{metrics.totalAbandoned + metrics.totalRecoveredCount})
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, metrics.recoveryRate)}%` }}
              ></div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500"></div>
        </div>

      </div>

      {/* Main Filter & List Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Navigation Tabs Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              সব কার্ট ({carts.length})
            </button>

            <button
              onClick={() => setActiveTab('abandoned')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'abandoned'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
              }`}
            >
              <span>পেন্ডিং রিকভারি</span>
              <span className="px-1.5 py-0.2 bg-white/20 text-white rounded-full text-[10px] font-black">
                {metrics.totalAbandoned}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('admin_recovered')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'admin_recovered'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-teal-700 bg-teal-50 hover:bg-teal-100'
              }`}
            >
              <span>অ্যাডমিন রিকভার্ড</span>
              <span className="px-1.5 py-0.2 bg-white/20 text-white rounded-full text-[10px] font-black">
                {metrics.adminRecoveredCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('self_recovered')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'self_recovered'
                  ? 'bg-sky-700 text-white shadow-xs'
                  : 'text-sky-700 bg-sky-50 hover:bg-sky-100'
              }`}
            >
              <span>সেলফ রিকভার্ড</span>
              <span className="px-1.5 py-0.2 bg-white/20 text-white rounded-full text-[10px] font-black">
                {metrics.selfRecoveredCount}
              </span>
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="ফোন, নাম বা প্রোডাক্ট দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:border-teal-500"
            >
              <option value="all">সকল উৎস (All)</option>
              <option value="storefront_checkout">Website Store</option>
              <option value="landing_page">Landing Page</option>
            </select>
          </div>

        </div>

        {/* Carts Table / List */}
        {loading ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-600" />
            <p className="text-sm font-semibold">পরিত্যক্ত কার্ট তথ্য লোড হচ্ছে...</p>
          </div>
        ) : filteredCarts.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">কোনো পরিত্যক্ত কার্ট পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `"${searchQuery}" এর সাথে মিলে এমন কোনো কার্ট পাওয়া যায়নি।`
                : 'গ্রাহক চেকআউট ফর্মে ফোন নম্বর টাইপ করলে তা স্বয়ংক্রিয়ভাবে এখানে লাইভ জমা হবে।'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">গ্রাহক ও যোগাযোগ</th>
                  <th className="py-3 px-4">কার্টের পণ্য ও ভ্যারিয়েন্ট</th>
                  <th className="py-3 px-4">মোট মূল্য</th>
                  <th className="py-3 px-4">উৎস ও সময়</th>
                  <th className="py-3 px-4">স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-center">১-ক্লিক রিকভারি অ্যাকশন</th>
                  <th className="py-3 px-3 text-right">মুছুন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCarts.map((cart) => {
                  const isPending = cart.status === 'abandoned';
                  const isAdminRecovered = cart.status === 'admin_recovered';
                  const isSelfRecovered = cart.status === 'self_recovered';
                  const isCancelled = cart.status === 'cancelled';

                  return (
                    <tr
                      key={cart.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isPending ? 'bg-white' : isAdminRecovered ? 'bg-teal-50/20' : 'bg-slate-50/30'
                      }`}
                    >
                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              {cart.customerPhone}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyPhone(cart.customerPhone, e)}
                              className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded transition-colors cursor-pointer"
                              title="নম্বর কপি করুন"
                            >
                              {copiedPhone === cart.customerPhone ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          <p className="font-semibold text-slate-700">
                            {cart.customerName || (
                              <span className="text-slate-400 italic">নাম প্রদান করেনি</span>
                            )}
                          </p>

                          {cart.customerAddress && (
                            <p className="text-[11px] text-slate-500 flex items-center gap-1 max-w-[200px] truncate" title={cart.customerAddress}>
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{cart.customerDistrict ? `${cart.customerDistrict}, ` : ''}{cart.customerAddress}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Cart Items */}
                      <td className="py-3.5 px-4 min-w-[220px]">
                        <div className="space-y-2">
                          {cart.items && cart.items.length > 0 ? (
                            cart.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2.5">
                                {item.productImage ? (
                                  <img
                                    src={item.productImage}
                                    alt={item.productTitle}
                                    className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0 bg-white"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                                    <ShoppingBag className="w-4 h-4" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-slate-800 text-[11px] truncate" title={item.productTitle}>
                                    {item.productTitle}
                                  </p>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                    {item.variant && (
                                      <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-medium border border-slate-200/80">
                                        {item.variant}
                                      </span>
                                    )}
                                    <span>x{item.quantity}</span>
                                    <span className="font-semibold text-slate-700">৳{item.unitPrice}</span>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <span className="text-slate-400 italic">কোনো পণ্য নেই</span>
                          )}
                        </div>
                      </td>

                      {/* Total Cart Value */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <p className="font-mono font-black text-slate-900 text-sm">
                            ৳{cart.totalAmount.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            সাবটোটাল: ৳{cart.subtotal} {cart.deliveryCharge ? `+ ৳${cart.deliveryCharge}` : ''}
                          </p>
                        </div>
                      </td>

                      {/* Source & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            cart.source === 'landing_page'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                              : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                          }`}>
                            {cart.source === 'landing_page' ? 'ল্যান্ডিং পেজ' : 'ওয়েবসাইট স্টোর'}
                            {cart.sourceSlug && ` (${cart.sourceSlug})`}
                          </span>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimeAgo(cart.lastActivityAt || cart.createdAt)}</span>
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isPending && (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                            <span>পরিত্যক্ত (Pending)</span>
                          </div>
                        )}

                        {isAdminRecovered && (
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-bold text-[11px]">
                              <CheckCircle2 className="w-3 h-3 text-teal-600" />
                              <span>অ্যাডমিন রিকভার্ড</span>
                            </div>
                            {cart.recoveredOrderId && (
                              <p className="text-[10px] font-mono font-bold text-teal-700">
                                অর্ডার: #{cart.recoveredOrderId}
                              </p>
                            )}
                          </div>
                        )}

                        {isSelfRecovered && (
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-bold text-[11px]">
                              <Zap className="w-3 h-3 text-sky-600" />
                              <span>সেলফ রিকভার্ড</span>
                            </div>
                            {cart.recoveredOrderId && (
                              <p className="text-[10px] font-mono font-bold text-sky-700">
                                অর্ডার: #{cart.recoveredOrderId}
                              </p>
                            )}
                          </div>
                        )}

                        {isCancelled && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold text-[10px]">
                            বাতিল
                          </span>
                        )}
                      </td>

                      {/* 1-Click Multi-Channel Recovery Action Bar */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
                          
                          {/* 1. WhatsApp 1-Click */}
                          <button
                            type="button"
                            onClick={() => handleOpenWhatsAppModal(cart)}
                            className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all shadow-xs cursor-pointer"
                            title="১-ক্লিক হোয়াটসঅ্যাপ রিকভারি মেসেজ"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>

                          {/* 2. Direct Call (tel:) */}
                          <a
                            href={`tel:${cart.customerPhone}`}
                            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all shadow-xs inline-flex items-center justify-center cursor-pointer"
                            title="সরাসরি ফোন কল করুন"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>

                          {/* 3. SMSinBD 1-Click SMS */}
                          <button
                            type="button"
                            onClick={() => handleOpenSmsModal(cart)}
                            className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all shadow-xs cursor-pointer"
                            title="১-ক্লিক এসএমএস পাঠান"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          {/* 4. Convert to Official Order */}
                          <button
                            type="button"
                            onClick={() => handleOpenConvertModal(cart)}
                            className="px-2.5 py-1.5 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-lg font-bold text-[10px] transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                            title="১-ক্লিকে অফিশিয়াল অর্ডারে কনভার্ট করুন"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>অর্ডার কনভার্ট</span>
                          </button>

                        </div>
                      </td>

                      {/* Delete */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setDeleteCartId(cart.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="কার্ট মুছুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ============================================================
          MODAL 1: WhatsApp 1-Click Recovery Modal
          ============================================================ */}
      {whatsAppModalCart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">১-ক্লিক হোয়াটসঅ্যাপ রিকভারি</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    নম্বর: {whatsAppModalCart.customerPhone} ({whatsAppModalCart.customerName || 'গ্রাহক'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWhatsAppModalCart(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Selector Pills */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">টেমপ্লেট নির্বাচন করুন:</label>
              <div className="flex flex-col gap-1.5">
                {getWhatsAppTemplates(whatsAppModalCart).map((t, idx) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setWhatsAppTemplateIndex(idx);
                      setCustomWhatsAppMessage(t.body);
                    }}
                    className={`text-left px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      whatsAppTemplateIndex === idx
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Body Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">মেসেজ প্রিভিউ (সম্পাদনাযোগ্য):</label>
              <textarea
                rows={5}
                value={customWhatsAppMessage}
                onChange={(e) => setCustomWhatsAppMessage(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none font-sans"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setWhatsAppModalCart(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>হোয়াটসঅ্যাপে পাঠান ও স্ট্যাটাস আপডেট করুন</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 2: 1-Click SMSinBD Dispatch Modal
          ============================================================ */}
      {smsModalCart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">১-ক্লিক এসএমএস রিকভারি</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    প্রাপক: {smsModalCart.customerPhone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSmsModalCart(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {smsFeedback && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                smsFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}>
                {smsFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{smsFeedback.text}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-slate-700">এসএমএস কন্টেন্ট:</label>
                <span className="text-slate-400 text-[11px]">
                  অক্ষর: {smsMessage.length} | {Math.ceil(smsMessage.length / 160) || 1} SMS
                </span>
              </div>
              <textarea
                rows={4}
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white resize-none font-mono"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-[11px] text-slate-600 space-y-1">
              <p className="font-bold text-slate-700">📱 স্টোরের অফিসিয়াল গেটওয়ে:</p>
              <p>আপনার ভেরিফায়েড SMSinBD এপিআই ক্রেডেনশিয়ালস দিয়ে সরাসরি গ্রাহকের ফোনে পাঠানো হবে।</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSmsModalCart(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSendSms}
                disabled={isSendingSms || !smsMessage.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSendingSms ? 'পাঠানো হচ্ছে...' : 'এসএমএস পাঠান'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 3: Convert Abandoned Cart into Official Order
          ============================================================ */}
      {convertModalCart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">১-ক্লিকে অফিশিয়াল অর্ডারে কনভার্ট</h3>
                  <p className="text-xs text-slate-500">
                    পরিত্যক্ত কার্ট থেকে সরাসরি কনফার্মড সেলস অর্ডার তৈরি করুন
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConvertModalCart(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order Summary Snapshot */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between font-bold text-slate-800">
                <span>গ্রাহক:</span>
                <span>{convertModalCart.customerName || 'অজ্ঞাত'} ({convertModalCart.customerPhone})</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>পণ্য সংখ্যা:</span>
                <span>{convertModalCart.items?.length || 0} টি</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>সাবটোটাল:</span>
                <span>৳{convertModalCart.subtotal}</span>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">ডেলিভারি চার্জ (৳):</label>
                <input
                  type="number"
                  value={convertDeliveryCharge}
                  onChange={(e) => setConvertDeliveryCharge(Number(e.target.value))}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">পেমেন্ট মেথড:</label>
                <select
                  value={convertPaymentMethod}
                  onChange={(e) => setConvertPaymentMethod(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-orange-500"
                >
                  <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Paid / Advanced">Paid / Advanced</option>
                </select>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700">অর্ডার নোট / রিকভারি নোট:</label>
              <input
                type="text"
                value={convertNotes}
                onChange={(e) => setConvertNotes(e.target.value)}
                placeholder="যেমন: কাস্টমার কেয়ারে কল করে কনফার্ম করা হয়েছে"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Calculated Payable */}
            <div className="p-3 bg-orange-50/80 rounded-xl border border-orange-200 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">সর্বমোট প্রদেয় মূল্য:</span>
              <span className="font-mono text-base font-black text-orange-600">
                ৳{(convertModalCart.subtotal + convertDeliveryCharge).toLocaleString()}
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConvertModalCart(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConvertOrder}
                disabled={isConverting}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isConverting ? 'অর্ডার তৈরি হচ্ছে...' : 'অর্ডার তৈরি ও রিকভার্ড মার্ক করুন'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteCartId}
        title="পরিত্যক্ত কার্ট মুছে ফেলবেন?"
        message="আপনি কি নিশ্চিত যে এই কার্ট রেকর্ডটি মুছে ফেলতে চান? এটি পুনরায় ফিরিয়ে আনা সম্ভব নয়।"
        confirmText="হ্যাঁ, মুছে ফেলুন"
        cancelText="বাতিল"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteCartId(null)}
      />

    </div>
  );
}
