import React, { useState, useEffect, useMemo } from 'react';
import { EcomSettings, DeliveryMethodItem, DeliveryAreaScope, DeliveryPricingModel } from '../types';
import { dbService, DEFAULT_DELIVERY_METHODS } from '../lib/dbService';
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
import { DeliveryAdvancedSettings } from './DeliveryAdvancedSettings';
import { BD_ALL_DISTRICTS, DHAKA_SUBURBS, calculateDeliveryCharge } from '../lib/deliveryCalculator';

const COURIER_PARTNERS = [
  { id: 'Steadfast', name: 'Steadfast Courier (স্টেডফাস্ট)', logo: '🚚' },
  { id: 'Pathao', name: 'Pathao Courier (পাঠাও)', logo: '⚡' },
  { id: 'RedX', name: 'RedX Logistics (রেডএক্স)', logo: '📦' },
  { id: 'Paperfly', name: 'Paperfly (পেপারফ্লাই)', logo: '✈️' },
  { id: 'eCourier', name: 'eCourier', logo: '🌐' },
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
    deliveryMethods: DEFAULT_DELIVERY_METHODS
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

  const deliveryMethods = settings.deliveryMethods && settings.deliveryMethods.length > 0 
    ? settings.deliveryMethods 
    : DEFAULT_DELIVERY_METHODS;

  const filteredDelivery = deliveryMethods.filter(dm => {
    if (logisticsFilter === 'active') return dm.status === 'Active';
    if (logisticsFilter === 'inactive') return dm.status === 'Inactive';
    return true;
  });

  const handleOpenAddDelivery = () => {
    setEditingDelivery({
      id: `dm-${Date.now()}`,
      title: 'ঢাকা মেট্রো সিটি হোম ডেলিভারি',
      subtitle: '২৪-৪৮ ঘণ্টার মধ্যে হোম ডেলিভারি',
      status: 'Active',
      mode: 'Weight based',
      type: 'Weight based',
      pricingModel: 'weight_based',
      areaScope: 'inside_dhaka',
      customDistricts: [],
      baseWeightKg: 1.0,
      baseCharge: 70,
      deliveryCharge: 70,
      additionalChargePerKg: 20,
      freeDeliveryThreshold: 2000,
      estimatedDays: '24-48 Hours',
      courierPartner: 'Steadfast',
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
      courierPartner: editingDelivery.courierPartner || 'Steadfast',
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

      {/* Top Header Card */}
      <div className="bg-white border border-slate-200/90 p-5 sm:p-7 rounded-3xl shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-[#0a3866] to-[#0284c7] text-white rounded-2xl shadow-sm">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Delivery Method & Area Management
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-[#0284c7]">
                  Weight & Zone Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                প্রফেশনাল ই-কমার্স ডেলিভারি জোন (ঢাকা মেট্রো, উপশহর, সারাদেশ), কুরিয়ার পার্টনার এবং ওজন ভিত্তিক চার্জ ক্যালকুলেশন
              </p>
            </div>
          </div>
        </div>

        {/* Global Save / Refresh Buttons */}
        <div className="flex items-center space-x-2.5 w-full sm:w-auto">
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
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs font-extrabold shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                সংরক্ষণ হচ্ছে...
              </span>
            ) : saveSuccess ? (
              <span className="flex items-center gap-1.5 text-emerald-200">
                <Check className="h-4 w-4 text-emerald-300" />
                সংরক্ষিত!
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Advanced Legacy Overrides & Cutoff Accordion */}
      <div className="my-6">
        <DeliveryAdvancedSettings settings={settings} onChange={setSettings} />
      </div>

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
                value={editingDelivery.courierPartner || 'Steadfast'}
                onChange={(e) => setEditingDelivery({ ...editingDelivery, courierPartner: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#0284c7] focus:outline-none transition-colors font-medium cursor-pointer"
              >
                {COURIER_PARTNERS.map(c => (
                  <option key={c.id} value={c.id}>{c.logo} {c.name}</option>
                ))}
              </select>
            </div>

            {/* 4. Pricing Model Toggle */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">চার্জ নির্ধারণ পদ্ধতি (Pricing Model)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDelivery({ ...editingDelivery, pricingModel: 'weight_based', type: 'Weight based', mode: 'Weight based' })}
                  className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                    editingDelivery.pricingModel === 'weight_based' || editingDelivery.type === 'Weight based'
                      ? 'bg-sky-50 text-[#0284c7] border-[#0284c7] shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Scale className="h-4 w-4" />
                  <span>ওজন ভিত্তিক (Weight Based)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditingDelivery({ ...editingDelivery, pricingModel: 'flat', type: 'Fixed', mode: 'Fixed' })}
                  className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                    editingDelivery.pricingModel === 'flat' || editingDelivery.type === 'Fixed'
                      ? 'bg-sky-50 text-[#0284c7] border-[#0284c7] shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Truck className="h-4 w-4" />
                  <span>ফিক্সড রেট (Flat Rate)</span>
                </button>
              </div>
            </div>

            {/* 5. Area Scope Selector */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-slate-700 font-bold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#0284c7]" />
                <span>ডেলিভারি এরিয়া জোন (Delivery Area Scope) *</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {AREA_SCOPES.map(scope => {
                  const isSelected = (editingDelivery.areaScope || 'all') === scope.id;
                  return (
                    <div
                      key={scope.id}
                      onClick={() => setEditingDelivery({ ...editingDelivery, areaScope: scope.id })}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-[#0284c7] bg-sky-50/70 ring-2 ring-sky-300' 
                          : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border ${scope.badgeColor}`}>
                          {scope.label}
                        </span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#0284c7] bg-[#0284c7]' : 'border-slate-300'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-snug">{scope.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 6. Custom Districts Picker (shown only when custom_districts is active) */}
            {editingDelivery.areaScope === 'custom_districts' && (
              <div className="md:col-span-2 bg-purple-50/50 border border-purple-200 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span className="font-bold text-purple-900 text-xs">
                      নির্ধারিত জেলা নির্বাচন করুন ({editingDelivery.customDistricts?.length || 0}টি নির্বাচিত)
                    </span>
                  </div>
                  <div className="relative w-48">
                    <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={districtSearch}
                      onChange={(e) => setDistrictSearch(e.target.value)}
                      placeholder="জেলা খুঁজুন..."
                      className="w-full pl-8 pr-3 py-1 bg-white border border-purple-200 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-purple-400"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1 bg-white rounded-xl border border-purple-100">
                  {filteredDistrictsForPicker.map(dist => {
                    const isChecked = (editingDelivery.customDistricts || []).includes(dist);
                    return (
                      <button
                        type="button"
                        key={dist}
                        onClick={() => toggleCustomDistrict(dist)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                          isChecked 
                            ? 'bg-purple-600 text-white border-purple-700 shadow-2xs' 
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isChecked ? `✓ ${dist}` : dist}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 7. Weight-Based Pricing Parameters */}
            {(editingDelivery.pricingModel === 'weight_based' || editingDelivery.type === 'Weight based') ? (
              <div className="md:col-span-2 bg-gradient-to-r from-sky-50/80 via-blue-50/50 to-indigo-50/80 p-5 rounded-2xl border border-sky-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-[#0284c7]" />
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      Weight-Based Billing Formula (ওজন ভিত্তিক চার্জ ফর্মুলা)
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-100 text-[#0284c7]">
                    Standard Courier Standard
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">বেস ওজন (Base Weight kg)</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        required
                        value={editingDelivery.baseWeightKg ?? 1.0}
                        onChange={(e) => setEditingDelivery({ ...editingDelivery, baseWeightKg: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-sky-300 rounded-l-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-[#0284c7] outline-none"
                      />
                      <span className="px-3 py-2 bg-sky-100 text-sky-800 border border-l-0 border-sky-300 rounded-r-xl font-bold">kg</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">সাধারণত ১ম ১.০ কেজি</p>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">বেস চার্জ (Base Charge ৳) *</label>
                    <div className="flex items-center">
                      <span className="px-3 py-2 bg-sky-100 text-sky-800 border border-r-0 border-sky-300 rounded-l-xl font-bold">৳</span>
                      <input
                        type="number"
                        min="0"
                        required
                        value={editingDelivery.baseCharge ?? editingDelivery.deliveryCharge ?? 70}
                        onChange={(e) => setEditingDelivery({ 
                          ...editingDelivery, 
                          baseCharge: Number(e.target.value),
                          deliveryCharge: Number(e.target.value)
                        })}
                        className="w-full px-3 py-2 bg-white border border-sky-300 rounded-r-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-[#0284c7] outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">১ম বেস ওজনের নির্দিষ্ট চার্জ</p>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">অতিরিক্ত প্রতি কেজি (Extra Per Kg ৳)</label>
                    <div className="flex items-center">
                      <span className="px-3 py-2 bg-sky-100 text-sky-800 border border-r-0 border-sky-300 rounded-l-xl font-bold">+৳</span>
                      <input
                        type="number"
                        min="0"
                        required
                        value={editingDelivery.additionalChargePerKg ?? 20}
                        onChange={(e) => setEditingDelivery({ ...editingDelivery, additionalChargePerKg: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-sky-300 rounded-r-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-[#0284c7] outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">বেস ওজনের পর প্রতি অতিরিক্ত ১ কেজিতে</p>
                  </div>
                </div>

                <div className="p-3 bg-white/80 rounded-xl border border-sky-200 text-[11px] text-slate-600 flex items-center gap-2">
                  <Info className="h-4 w-4 text-[#0284c7] shrink-0" />
                  <span>
                    ফর্মুলা: ১ম <strong>{editingDelivery.baseWeightKg || 1} কেজি</strong> পর্যন্ত <strong>৳{editingDelivery.baseCharge ?? 70}</strong>। এরপর প্রতি অতিরিক্ত কেজিতে <strong>+৳{editingDelivery.additionalChargePerKg ?? 20}</strong> যোগ হবে। (ভগ্নাংশ থাকলে পরবর্তী পূর্ণ কেজিতে রাউন্ড আপ হবে)।
                  </span>
                </div>
              </div>
            ) : (
              <div className="md:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="block text-slate-700 font-bold mb-1">স্থির ডেলিভারি চার্জ (Flat Delivery Charge ৳) *</label>
                <div className="flex items-center max-w-xs">
                  <span className="px-3.5 py-2.5 bg-slate-200 text-slate-700 border border-r-0 border-slate-300 rounded-l-xl font-bold">৳</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingDelivery.deliveryCharge ?? 80}
                    onChange={(e) => setEditingDelivery({ 
                      ...editingDelivery, 
                      deliveryCharge: Number(e.target.value),
                      baseCharge: Number(e.target.value)
                    })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-r-xl text-slate-900 font-mono font-bold text-sm focus:ring-2 focus:ring-[#0284c7] outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">পার্সেলের ওজন যাই হোক না কেন এই নির্ধারিত চার্জ প্রযোজ্য হবে।</p>
              </div>
            )}

            {/* 8. Free Delivery Threshold */}
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

            {/* 9. Status Toggle */}
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

            {/* 10. Live Interactive Simulation Sandbox */}
            <div className="md:col-span-2 bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-sky-400" />
                  <span className="font-black text-xs uppercase tracking-wider text-sky-300">
                    Live Calculation Sandbox (লাইভ টেস্ট সিমুলেশন)
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  কুরিয়ার বিলিং ফর্মুলা সঠিক কিনা তাৎক্ষণিক পরীক্ষা করুন
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-300 font-medium mb-1">টেস্ট পার্সেল ওজন (Cart Weight kg):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={testWeightKg}
                    onChange={(e) => setTestWeightKg(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:ring-1 focus:ring-sky-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 font-medium mb-1">টেস্ট অর্ডার সাবটোটাল (Subtotal ৳):</label>
                  <input
                    type="number"
                    min="0"
                    value={testOrderSubtotal}
                    onChange={(e) => setTestOrderSubtotal(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:ring-1 focus:ring-sky-400 outline-none"
                  />
                </div>
              </div>

              {simulationResult && (
                <div className="p-3.5 bg-slate-800/90 rounded-xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] text-slate-400">কাস্টমারের জন্য হিসাব:</div>
                    <div className="text-xs font-bold text-sky-300 mt-0.5">
                      {simulationResult.breakdownText}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">সর্বমোট ডেলিভারি ফি:</span>
                    <span className="text-xl font-mono font-black text-emerald-400">
                      {simulationResult.isFreeDelivery ? 'FREE (৳০)' : `৳${simulationResult.finalCharge}`}
                    </span>
                  </div>
                </div>
              )}
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
                {deliveryMethods.length}টি মেথড সক্রিয়
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              চেকআউটে গ্রাহকের নির্বাচিত জেলা এবং পার্সেল ওজনের ওপর ভিত্তি করে স্বয়ংক্রিয়ভাবে নির্ধারিত হবে
            </p>
          </div>

          <button
            onClick={handleOpenAddDelivery}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-extrabold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>নতুন ডেলিভারি মেথড যোগ করুন</span>
          </button>
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
                              {dm.courierPartner || 'Steadfast'}
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
                        <span>{scopeInfo.label.split('(')[0].trim()}</span>
                      </span>
                      {dm.areaScope === 'custom_districts' && dm.customDistricts && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {dm.customDistricts.length}টি জেলা নির্ধারিত
                        </div>
                      )}
                    </td>

                    {/* Pricing & Rate */}
                    <td className="px-4 py-3.5">
                      {isWeight ? (
                        <div>
                          <div className="font-mono font-black text-slate-900 text-xs">
                            ৳{baseCharge} <span className="text-[10px] text-slate-500 font-normal">({baseWeight}kg পর্যন্ত)</span>
                          </div>
                          <div className="text-[10px] text-[#0284c7] font-semibold">
                            +৳{extraPerKg} প্রতি অতিরিক্ত কেজি
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-mono font-black text-slate-900 text-xs">
                            ৳{dm.deliveryCharge} <span className="text-[10px] text-slate-500 font-normal">(ফিক্সড)</span>
                          </div>
                        </div>
                      )}

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
                              courierPartner: dm.courierPartner || 'Steadfast',
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
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    কোনো ডেলিভারি মেথড পাওয়া যায়নি। নতুন মেথড যোগ করুন।
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
