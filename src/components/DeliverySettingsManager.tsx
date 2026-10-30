import React, { useState, useEffect, useMemo } from 'react';
import { EcomSettings, DeliveryMethodItem, DeliveryAreaScope, DeliveryPricingModel } from '../types';
import { dbService } from '../lib/dbService';
import { CircularProgress } from './LoadingSkeleton';
import { 
  Truck, 
  Check, 
  Save, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Edit3, 
  X,
  Scale,
  MapPin,
  Clock,
  ShieldCheck,
  Calculator,
  Search,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';
import { FeedbackDialog } from './ui/FeedbackDialog';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { BD_ALL_DISTRICTS, DHAKA_SUBURBS, calculateDeliveryCharge } from '../lib/deliveryCalculator';

const COURIER_PARTNERS = [
  { id: 'Pathao', name: 'Pathao Courier (পাঠাও)', logo: '⚡' },
  { id: 'InHouse', name: 'In-House Rider (নিজস্ব ডেলিভারি)', logo: '🛵' }
];

const AREA_SCOPES: { id: DeliveryAreaScope; label: string; desc: string; badgeColor: string }[] = [
  {
    id: 'inside_dhaka',
    label: 'ঢাকা মেট্রো সিটি (Inside Dhaka)',
    desc: 'ঢাকা সিটি কর্পোরেশন ও মেট্রো এলাকা',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    id: 'dhaka_suburbs',
    label: 'ঢাকা উপশহর (Dhaka Suburbs)',
    desc: 'গাজীপুর, নারায়ণগঞ্জ, সাভার, কেরানীগঞ্জ, মুন্সিগঞ্জ, নরসিংদী',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  {
    id: 'outside_dhaka',
    label: 'ঢাকার বাইরে / সারাদেশে (Outside Dhaka)',
    desc: 'ঢাকা মেট্রোর বাইরের সব জেলা ও উপশহর',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200'
  },
  {
    id: 'custom_districts',
    label: 'নির্দিষ্ট জেলা সমূহ (Custom Selected Districts)',
    desc: 'শুধুমাত্র নির্ধারিত কয়েকটি নির্দিষ্ট জেলার জন্য প্রযোজ্য',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  {
    id: 'all',
    label: 'সারাদেশে সবার জন্য (All Bangladesh)',
    desc: 'বাংলাদেশের যেকোনো প্রান্তের জন্য প্রযোজ্য',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  }
];

export default function DeliverySettingsManager() {
  const [settings, setSettings] = useState<EcomSettings>({
    gtmId: '',
    deliveryChargeInsideDhaka: 70,
    deliveryChargeOutsideDhaka: 130,
    bkashNumber: '',
    nagadNumber: '',
    deliveryMethods: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  // Filter
  const [logisticsFilter, setLogisticsFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Edit Delivery state
  const [editingDelivery, setEditingDelivery] = useState<DeliveryMethodItem | null>(null);
  const [isAddingDelivery, setIsAddingDelivery] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Custom district search inside modal
  const [districtSearch, setDistrictSearch] = useState('');

  // Live test calculator state in modal
  const [testWeightKg, setTestWeightKg] = useState<number>(2.5);
  const [testOrderSubtotal, setTestOrderSubtotal] = useState<number>(1200);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setIsLoading(true);
    try {
      const data = await dbService.getEcomSettings();
      if (data) {
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to load delivery settings:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await dbService.saveEcomSettings(settings);
      setSaveSuccess(true);
      setFeedback({
        isOpen: true,
        type: 'success',
        title: 'ডেলিভারি সেটিংস সংরক্ষিত হয়েছে!',
        message: 'এরিয়া ও ওজন ভিত্তিক ডেলিভারি মেথড এবং রেটসমূহ সফলভাবে ডাটাবেজে আপডেট হয়েছে।'
      });
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving delivery settings:', err);
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'সংরক্ষণ ব্যর্থ হয়েছে',
        message: 'ডেলিভারি সেটিংস সংরক্ষণের সময় একটি সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deliveryMethods = Array.isArray(settings.deliveryMethods)
    ? settings.deliveryMethods
    : [];

  const filteredDelivery = deliveryMethods.filter(dm => {
    if (logisticsFilter === 'active') return dm.status === 'Active';
    if (logisticsFilter === 'inactive') return dm.status === 'Inactive';
    return true;
  });

  const handleOpenAddDelivery = () => {
    setEditingDelivery({
      id: `dm-${Date.now()}`,
      title: 'হোম ডেলিভারি (পাঠাও অটো রেট)',
      subtitle: '২৪-৪৮ ঘণ্টার মধ্যে হোম ডেলিভারি',
      status: 'Active',
      mode: 'Pathao API Auto',
      type: 'Pathao API Auto',
      pricingModel: 'flat',
      areaScope: 'all',
      customDistricts: [],
      baseWeightKg: 0.5,
      baseCharge: 80,
      deliveryCharge: 80,
      additionalChargePerKg: 0,
      freeDeliveryThreshold: 2000,
      estimatedDays: '24-48 Hours',
      courierPartner: 'Pathao',
      minimumCharge: 0,
      maximumCharge: 0,
      updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    });
    setDistrictSearch('');
    setIsAddingDelivery(true);
  };

  const handleSaveDeliveryForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDelivery) return;

    const baseChargeVal = Number(editingDelivery.baseCharge ?? editingDelivery.deliveryCharge ?? 70);
    const finalMethod: DeliveryMethodItem = {
      ...editingDelivery,
      title: editingDelivery.title.trim(),
      subtitle: editingDelivery.subtitle?.trim() || '',
      baseCharge: baseChargeVal,
      deliveryCharge: baseChargeVal, // Sync for legacy fallback
      pricingModel: editingDelivery.pricingModel || 'weight_based',
      mode: editingDelivery.pricingModel === 'weight_based' ? 'Weight based' : 'Fixed',
      type: editingDelivery.pricingModel === 'weight_based' ? 'Weight based' : 'Fixed',
      baseWeightKg: Number(editingDelivery.baseWeightKg || 1.0),
      additionalChargePerKg: Number(editingDelivery.additionalChargePerKg || 20),
      freeDeliveryThreshold: Number(editingDelivery.freeDeliveryThreshold || 0),
      areaScope: editingDelivery.areaScope || 'all',
      customDistricts: editingDelivery.customDistricts || [],
      estimatedDays: editingDelivery.estimatedDays || '24-48 Hours',
      courierPartner: editingDelivery.courierPartner || 'Pathao',
      updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    let updatedList: DeliveryMethodItem[];
    if (isAddingDelivery) {
      updatedList = [...deliveryMethods, finalMethod];
    } else {
      updatedList = deliveryMethods.map(d => d.id === finalMethod.id ? finalMethod : d);
    }

    // Sync legacy delivery fields if inside/outside dhaka
    let insideCharge = settings.deliveryChargeInsideDhaka;
    let outsideCharge = settings.deliveryChargeOutsideDhaka;

    if (finalMethod.areaScope === 'inside_dhaka') {
      insideCharge = baseChargeVal;
    } else if (finalMethod.areaScope === 'outside_dhaka') {
      outsideCharge = baseChargeVal;
    }

    const newSettings: EcomSettings = { 
      ...settings, 
      deliveryMethods: updatedList,
      deliveryChargeInsideDhaka: insideCharge,
      deliveryChargeOutsideDhaka: outsideCharge
    };

    setSettings(newSettings);
    dbService.saveEcomSettings(newSettings);

    setEditingDelivery(null);
    setIsAddingDelivery(false);
    setFeedback({
      isOpen: true,
      type: 'success',
      title: 'ডেলিভারি মেথড সংরক্ষিত হয়েছে!',
      message: `"${finalMethod.title}" সফলভাবে আপডেট করা হয়েছে।`
    });
  };

  const handleDeleteDelivery = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetId) return;
    const targetItem = deliveryMethods.find(d => d.id === deleteTargetId);
    const updatedList = deliveryMethods.filter(d => d.id !== deleteTargetId);
    const newSettings = { ...settings, deliveryMethods: updatedList };
    setSettings(newSettings);
    dbService.saveEcomSettings(newSettings);
    setDeleteTargetId(null);
    setFeedback({
      isOpen: true,
      type: 'success',
      title: 'ডেলিভারি মেথড ডিলিট হয়েছে',
      message: `"${targetItem?.title || 'মেথড'}" তালিকা থেকে সফলভাবে মুছে ফেলা হয়েছে।`
    });
  };

  const handleToggleDeliveryStatus = (id: string) => {
    const updatedList = deliveryMethods.map(d => {
      if (d.id === id) {
        return {
          ...d,
          status: d.status === 'Active' ? ('Inactive' as const) : ('Active' as const),
          updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
      }
      return d;
    });
    const newSettings = { ...settings, deliveryMethods: updatedList };
    setSettings(newSettings);
    dbService.saveEcomSettings(newSettings);
  };

  // Live simulation in modal
  const simulationResult = useMemo(() => {
    if (!editingDelivery) return null;
    return calculateDeliveryCharge(editingDelivery, testOrderSubtotal, testWeightKg);
  }, [editingDelivery, testOrderSubtotal, testWeightKg]);

  const filteredDistrictsForPicker = useMemo(() => {
    if (!districtSearch.trim()) return BD_ALL_DISTRICTS;
    return BD_ALL_DISTRICTS.filter(d => d.toLowerCase().includes(districtSearch.toLowerCase().trim()));
  }, [districtSearch]);

  const toggleCustomDistrict = (district: string) => {
    if (!editingDelivery) return;
    const current = editingDelivery.customDistricts || [];
    const exists = current.includes(district);
    const updated = exists ? current.filter(d => d !== district) : [...current, district];
    setEditingDelivery({
      ...editingDelivery,
      customDistricts: updated
    });
  };

  if (isLoading) {
    return (
      <CircularProgress label="লোড হচ্ছে ডেলিভারি ও কুরিয়ার সেটিংস..." size="md" />
    );
  }

  return (
    <div className="space-y-6 font-sans max-w-6xl mx-auto text-slate-800 pb-16">

      {/* Editor Modal for Delivery Method */}
      {editingDelivery && (
        <form onSubmit={handleSaveDeliveryForm} className="bg-white border-2 border-sky-300 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-5 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-50 text-[#0284c7] rounded-xl border border-sky-200">
                  <Scale className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {isAddingDelivery ? 'নতুন ডেলিভারি মেথড তৈরি করুন' : 'ডেলিভারি মেথড এডিট করুন'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                এরিয়া জোন, কুরিয়ার পার্টনার, বেস ওজন ও অতিরিক্ত প্রতি কেজির ডেলিভারি চার্জ নির্ধারণ করুন
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingDelivery(null)}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* 1. Title */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                <span>মেথডের নাম (Title) *</span>
                <span className="text-[10px] text-slate-400">চেকআউট পেজে গ্রাহক দেখবে</span>
              </label>
              <input
                type="text"
                required
                value={editingDelivery.title}
                onChange={(e) => setEditingDelivery({ ...editingDelivery, title: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#0284c7] focus:outline-none transition-colors font-medium"
                placeholder="যেমন: ঢাকা মেট্রো সিটি হোম ডেলিভারি"
              />
            </div>

            {/* 2. Subtitle / Estimated Time */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                <span>আনুমানিক ডেলিভারি সময় (Timeline)</span>
                <span className="text-[10px] text-slate-400">যেমন: ২৪-৪৮ ঘণ্টা</span>
              </label>
              <input
                type="text"
                value={editingDelivery.estimatedDays || ''}
                onChange={(e) => setEditingDelivery({ ...editingDelivery, estimatedDays: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#0284c7] focus:outline-none transition-colors font-medium"
                placeholder="24-48 Hours / ২-৩ কার্যদিবস"
              />
            </div>

            {/* 3. Courier Partner */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">কুরিয়ার পার্টনার (Courier Partner)</label>
              <select
                value={editingDelivery.courierPartner || 'Pathao'}
                onChange={(e) => setEditingDelivery({ ...editingDelivery, courierPartner: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#0284c7] focus:outline-none transition-colors font-medium cursor-pointer"
              >
                {COURIER_PARTNERS.map(c => (
                  <option key={c.id} value={c.id}>{c.logo} {c.name}</option>
                ))}
              </select>
            </div>

            {/* 4. Automated Pathao Badge / Fallback charge */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                <span>ফলব্যাক ডেলিভারি চার্জ (Fallback Charge ৳) *</span>
                <span className="text-[10px] text-slate-400">অফলাইন/ব্যাকআপ চার্জ</span>
              </label>
              <div className="flex items-center">
                <span className="px-3.5 py-2.5 bg-slate-100 text-slate-700 border border-r-0 border-slate-200 rounded-l-xl font-bold">৳</span>
                <input
                  type="number"
                  min="0"
                  required
                  value={editingDelivery.deliveryCharge ?? editingDelivery.baseCharge ?? 80}
                  onChange={(e) => setEditingDelivery({ 
                    ...editingDelivery, 
                    deliveryCharge: Number(e.target.value),
                    baseCharge: Number(e.target.value)
                  })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl text-slate-900 font-mono font-bold text-xs focus:bg-white focus:ring-2 focus:ring-[#0284c7] outline-none"
                  placeholder="80"
                />
              </div>
            </div>

            {/* Pathao Automated Info Banner */}
            <div className="md:col-span-2 bg-gradient-to-r from-emerald-50 via-sky-50 to-white p-4 rounded-2xl border border-emerald-200 flex items-start gap-3">
              <div className="p-2 bg-emerald-500 text-white rounded-xl shrink-0 mt-0.5 shadow-xs">
                <Zap className="h-4 w-4" />
              </div>
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900">
                    পাঠাও অটোমেটেড ক্যালকুলেশন সক্রিয় (Pathao API Live Auto Rate)
                  </span>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  চেকআউটে গ্রাহক যখন তাঁর <strong>শহর (City)</strong> ও <strong>থানা (Zone)</strong> সিলেক্ট করবেন এবং কার্টের পণ্যগুলোর মোট <strong>ওজন (Weight kg)</strong> অনুযায়ী পাঠাও এর রিয়েল-টাইম লাইভ কুরিয়ার চার্জ সরাসরি চলে আসবে। তাই কোনো ম্যানুয়াল বেস ওজন বা প্রতি কেজি অতিরিক্ত চার্জ ফর্মুলা লেখার প্রয়োজন নেই।
                </p>
              </div>
            </div>

            {/* 5. Free Delivery Threshold */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                <span>ফ্রি ডেলিভারি অফার লিমিট (Free Delivery Threshold ৳)</span>
                <span className="text-[10px] text-emerald-600 font-semibold">০ দিলে বন্ধ থাকবে</span>
              </label>
              <div className="flex items-center">
                <span className="px-3 py-2 bg-slate-100 text-slate-700 border border-r-0 border-slate-200 rounded-l-xl font-bold">৳</span>
                <input
                  type="number"
                  min="0"
                  value={editingDelivery.freeDeliveryThreshold ?? 0}
                  onChange={(e) => setEditingDelivery({ ...editingDelivery, freeDeliveryThreshold: Number(e.target.value) })}
                  placeholder="যেমন: 2000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-r-xl text-slate-900 font-mono font-bold focus:bg-white focus:ring-2 focus:ring-[#0284c7] outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">অর্ডার এই পরিমাণের বেশি হলে স্বয়ংক্রিয়ভাবে ফ্রি ডেলিভারি (৳০) দেওয়া হবে।</p>
            </div>

            {/* 6. Status Toggle */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">মেথড স্ট্যাটাস (Active / Inactive)</h4>
                <p className="text-[10px] text-slate-500">অন থাকলে চেকআউট পেজে কাস্টমারদের দেখানো হবে</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingDelivery.status === 'Active'}
                  onChange={(e) => setEditingDelivery({ ...editingDelivery, status: e.target.checked ? 'Active' : 'Inactive' })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-3 text-xs font-bold text-slate-700">
                  {editingDelivery.status === 'Active' ? 'Active' : 'Inactive'}
                </span>
              </label>
            </div>

          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setEditingDelivery(null)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200"
            >
              বাতিল (Cancel)
            </button>
            <button
              type="submit"
              className="px-7 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              <span>মেথড সংরক্ষণ করুন (Save Method)</span>
            </button>
          </div>
        </form>
      )}

      {/* Delivery Methods Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <h3 className="text-lg font-extrabold text-slate-900">ডেলিভারি মেথড ও রেট তালিকা</h3>
              <span className="px-2.5 py-0.5 bg-sky-50 text-[#0284c7] border border-sky-200 text-[11px] font-bold rounded-lg">
                {deliveryMethods.length > 0 ? `${deliveryMethods.length}টি মেথড যোগ করা` : 'কোনো মেথড নেই'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              চেকআউটে গ্রাহকের নির্বাচিত জেলা এবং পার্সেল ওজনের ওপর ভিত্তি করে স্বয়ংক্রিয়ভাবে নির্ধারিত হবে
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={loadSettings}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all border border-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="p-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              title="সব পরিবর্তন সংরক্ষণ করুন"
            >
              {isSaving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : saveSuccess ? (
                <Check className="h-4 w-4 text-white" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{saveSuccess ? 'সংরক্ষিত!' : 'Save'}</span>
            </button>

            <button
              onClick={handleOpenAddDelivery}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-extrabold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>নতুন ডেলিভারি মেথড যোগ করুন</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setLogisticsFilter(f)}
              className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                logisticsFilter === f
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {f === 'all' 
                ? `সবগুলো (${deliveryMethods.length})` 
                : f === 'active' 
                ? `সক্রিয় (${deliveryMethods.filter(d => d.status === 'Active').length})` 
                : `নিষ্ক্রিয় (${deliveryMethods.filter(d => d.status === 'Inactive').length})`}
            </button>
          ))}
        </div>

        {/* Delivery Methods Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">No</th>
                <th className="px-4 py-3.5">ডেলিভারি মেথড ও কুরিয়ার</th>
                <th className="px-4 py-3.5">এরিয়া জোন (Scope)</th>
                <th className="px-4 py-3.5">চার্জ নির্ধারণ ও রেট</th>
                <th className="px-4 py-3.5">ডেলিভারি সময়কাল</th>
                <th className="px-4 py-3.5">স্ট্যাটাস</th>
                <th className="px-4 py-3.5 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredDelivery.map((dm, idx) => {
                const scopeInfo = AREA_SCOPES.find(s => s.id === dm.areaScope) || AREA_SCOPES[4];
                const isWeight = dm.pricingModel === 'weight_based' || dm.type === 'Weight based';
                const baseCharge = dm.baseCharge ?? dm.deliveryCharge ?? 70;
                const baseWeight = dm.baseWeightKg || 1.0;
                const extraPerKg = dm.additionalChargePerKg || 20;

                return (
                  <tr key={dm.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                    
                    {/* Method & Courier */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 rounded-xl bg-sky-50 text-[#0284c7] border border-sky-200 shrink-0">
                          <Truck className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                            <span>{dm.title}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-bold">
                              {dm.courierPartner || 'Pathao'}
                            </span>
                            {dm.subtitle && (
                              <span className="text-[10px] text-slate-400 truncate max-w-xs">{dm.subtitle}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Area Scope */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${scopeInfo.badgeColor}`}>
                        <MapPin className="h-3 w-3" />
                        <span>সারাদেশ (পাঠাও এপিআই)</span>
                      </span>
                    </td>

                    {/* Pricing & Rate */}
                    <td className="px-4 py-3.5">
                      <div>
                        <div className="font-mono font-black text-slate-900 text-xs flex items-center gap-1.5">
                          <span className="text-emerald-600 font-bold">পাঠাও লাইভ অটো রেট</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          ফলব্যাক ব্যাকআপ: ৳{baseCharge}
                        </div>
                      </div>

                      {dm.freeDeliveryThreshold && dm.freeDeliveryThreshold > 0 && (
                        <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 font-bold">
                          ৳{dm.freeDeliveryThreshold.toLocaleString()}+ অর্ডারে ফ্রি
                        </span>
                      )}
                    </td>

                    {/* Delivery Time */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 font-semibold bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span>{dm.estimatedDays || '24-48 Hours'}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => handleToggleDeliveryStatus(dm.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer transition-transform hover:scale-105 ${
                          dm.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${dm.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                        <span>{dm.status === 'Active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => {
                            setEditingDelivery({
                              ...dm,
                              areaScope: dm.areaScope || 'all',
                              pricingModel: dm.pricingModel || (dm.type === 'Weight based' ? 'weight_based' : 'flat'),
                              baseWeightKg: dm.baseWeightKg || 1.0,
                              baseCharge: dm.baseCharge ?? dm.deliveryCharge ?? 70,
                              additionalChargePerKg: dm.additionalChargePerKg || 20,
                              freeDeliveryThreshold: dm.freeDeliveryThreshold || 0,
                              courierPartner: dm.courierPartner || 'Pathao',
                              estimatedDays: dm.estimatedDays || '24-48 Hours'
                            });
                            setIsAddingDelivery(false);
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all border border-slate-200 cursor-pointer"
                          title="এডিট করুন"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDelivery(dm.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all border border-rose-200 cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredDelivery.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                      <div className="p-4 bg-sky-50 text-[#0284c7] rounded-2xl border border-sky-100">
                        <Truck className="h-8 w-8 text-[#0284c7]" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-800">
                          {logisticsFilter !== 'all' 
                            ? 'এই ফিল্টারে কোনো ডেলিভারি মেথড নেই'
                            : 'এখনও কোনো ডেলিভারি মেথড যোগ করা হয়নি (Not added yet)'}
                        </h4>
                        <p className="text-xs text-slate-500 max-w-sm">
                          {logisticsFilter !== 'all'
                            ? 'অন্য ফিল্টার নির্বাচন করুন অথবা নতুন ডেলিভারি মেথড তৈরি করুন।'
                            : 'চেকআউটে শিপিং চার্জ ও কুরিয়ার নির্ধারণের জন্য আপনার স্টোরের ডেলিভারি মেথড যোগ করুন।'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenAddDelivery}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer mt-1"
                      >
                        <Plus className="h-4 w-4" />
                        <span>নতুন মেথড যোগ করুন (Add one)</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feedback Dialog */}
      <FeedbackDialog
        isOpen={feedback.isOpen}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
        onClose={() => setFeedback(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        type="danger"
        title="ডেলিভারি মেথড মুছে ফেলবেন?"
        message="আপনি কি নিশ্চিত যে আপনি এই ডেলিভারি মেথডটি স্থায়ীভাবে মুছে ফেলতে চান?"
        confirmText="হ্যাঁ, মুছে ফেলুন"
        cancelText="বাতিল"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
