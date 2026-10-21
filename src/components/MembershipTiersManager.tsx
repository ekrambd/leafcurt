import React, { useState, useEffect } from 'react';
import { VipTier } from '../types';
import { loyaltyClubService } from '../lib/loyaltyClubService';
import { CircularProgress } from './LoadingSkeleton';
import { 
  Award, Plus, Trash2, Edit3, X, Check, Save, Sparkles, 
  ShieldCheck, Coins, RefreshCw, Zap, TrendingUp, Layers
} from 'lucide-react';
import { FeedbackDialog } from './ui/FeedbackDialog';
import { ConfirmDialog } from './ui/ConfirmDialog';

export default function MembershipTiersManager() {
  const [tiers, setTiers] = useState<VipTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingTier, setEditingTier] = useState<VipTier | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

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

  useEffect(() => {
    loadTiers();
  }, []);

  async function loadTiers() {
    setIsLoading(true);
    try {
      const data = await loyaltyClubService.getVipTiers();
      setTiers(data);
    } catch (err) {
      console.error('Failed to load VIP tiers:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleOpenAddModal = () => {
    const nextOrder = tiers.length + 1;
    setEditingTier({
      id: `tier-${Date.now()}`,
      name: '',
      levelOrder: nextOrder,
      minLifetimeSpend: 5000,
      billDiscountPercent: 5,
      pointMultiplier: 1.2,
      perks: '',
      status: 'Active',
      cardColor: '#0a3866',
      updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    });
    setIsAddingNew(true);
  };

  const handleApplyPreset = (name: string, discount: number, multiplier: number, minSpend: number, perks: string, color: string) => {
    if (!editingTier) return;
    setEditingTier({
      ...editingTier,
      name,
      billDiscountPercent: discount,
      pointMultiplier: multiplier,
      minLifetimeSpend: minSpend,
      perks,
      cardColor: color
    });
  };

  const handleSaveTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTier || !editingTier.name.trim()) return;

    setIsSaving(true);
    try {
      let updated: VipTier[];
      if (isAddingNew) {
        updated = [...tiers, { ...editingTier, name: editingTier.name.trim() }];
      } else {
        updated = tiers.map(t => t.id === editingTier.id ? { ...editingTier, name: editingTier.name.trim() } : t);
      }

      // Sort tiers by levelOrder
      updated.sort((a, b) => a.levelOrder - b.levelOrder);

      await loyaltyClubService.saveVipTiers(updated);
      setTiers(updated);
      setEditingTier(null);
      setIsAddingNew(false);

      setFeedback({
        isOpen: true,
        type: 'success',
        title: 'VIP লেভেল সংরক্ষিত হয়েছে!',
        message: `"${editingTier.name}" সফলভাবে ডাটাবেজে আপডেট করা হয়েছে।`
      });
    } catch (err) {
      console.error('Failed to save VIP tier:', err);
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'সংরক্ষণ ব্যর্থ হয়েছে',
        message: 'দয়া করে আবার চেষ্টা করুন।'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (tierId: string) => {
    const updated = tiers.map(t => {
      if (t.id === tierId) {
        return {
          ...t,
          status: (t.status === 'Active' ? 'Inactive' : 'Active') as 'Active' | 'Inactive'
        };
      }
      return t;
    });
    setTiers(updated);
    await loyaltyClubService.saveVipTiers(updated);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    const updated = tiers.filter(t => t.id !== deleteTargetId);
    setTiers(updated);
    await loyaltyClubService.saveVipTiers(updated);
    setDeleteTargetId(null);
    setFeedback({
      isOpen: true,
      type: 'success',
      title: 'VIP লেভেল মুছে ফেলা হয়েছে',
      message: 'লেভেলটি সফলভাবে রিমুভ করা হয়েছে।'
    });
  };

  const totalLevels = tiers.length;
  const activeLevels = tiers.filter(t => t.status === 'Active').length;
  const topDiscount = tiers.length > 0 
    ? Math.max(...tiers.map(t => t.billDiscountPercent || 0)) 
    : 0;

  if (isLoading) {
    return <CircularProgress label="লোড হচ্ছে মেম্বারশিপ লেভেল..." size="md" />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans text-slate-800 pb-16">
      
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              VIP Tiers
            </h2>
            <span className="text-slate-400 text-sm">ⓘ</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure automated loyalty levels based on customer lifetime spend, discounts, and point multipliers
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-[#064e3b] hover:bg-[#053d2e] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>+ Add Level</span>
        </button>
      </div>

      {/* Top 3 KPI Cards (Matching Screenshot 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>TOTAL LEVELS</span>
            <Layers className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalLevels}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>ACTIVE LEVELS</span>
            <Award className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{activeLevels}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>TOP VIP DISCOUNT</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{topDiscount}% Off</div>
        </div>
      </div>

      {/* Tiers List Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          All VIP Levels
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 hover:shadow-md transition-shadow relative overflow-hidden"
            >
              {/* Top Accent Line */}
              <div 
                className="absolute top-0 left-0 right-0 h-1.5" 
                style={{ backgroundColor: tier.cardColor || '#0a3866' }}
              />

              {/* Level Title & Multiplier */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">
                    Level {tier.levelOrder}
                  </span>
                  <h4 className="text-base font-black text-slate-900 mt-0.5">
                    {tier.name}
                  </h4>
                </div>

                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {tier.pointMultiplier}x Points
                </span>
              </div>

              {/* Stats Grid */}
              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-400">Minimum Spend</span>
                  <span className="font-mono font-black text-slate-900">
                    ৳{tier.minLifetimeSpend.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-400">Bill Discount</span>
                  <span className="font-bold text-emerald-600">
                    {tier.billDiscountPercent}% Off
                  </span>
                </div>

                {tier.perks && (
                  <div className="pt-2 text-[11px] text-slate-500 leading-relaxed border-t border-slate-50">
                    {tier.perks}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleToggleStatus(tier.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    tier.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${tier.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  <span>Status: {tier.status}</span>
                </button>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => {
                      setEditingTier(tier);
                      setIsAddingNew(false);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                    title="Edit Level"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTargetId(tier.id)}
                    className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                    title="Delete Level"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {tiers.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
              কোনো VIP লেভেল পাওয়া যায়নি। উপরের "+ Add Level" বাটনে ক্লিক করে লেভেল তৈরি করুন।
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* Modal: Create / Edit VIP Membership Level (Screenshot 1) */}
      {/* ======================================================== */}
      {editingTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                {isAddingNew ? 'Create VIP Membership Level' : 'Edit VIP Membership Level'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingTier(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTier} className="space-y-4 text-xs">
              
              {/* 1-Click Standard Tiers (Screenshot 1) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600">
                  1-Click Standard Tiers
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(
                      'Silver Member', 
                      5, 
                      1.2, 
                      5000, 
                      '৫% বিল ডিসকাউন্ট, ১.২x রিওয়ার্ড পয়েন্ট, ফ্রি রিটার্ন সাপোর্ট',
                      '#0a3866'
                    )}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    Silver Member (5% Off)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset(
                      'Gold VIP', 
                      10, 
                      1.5, 
                      15000, 
                      '১০% গ্যারান্টিড বিল ডিসকাউন্ট, ১.৫x পয়েন্ট ক্যাশব্যাক, বার্থডে গিফট ভাউচার, প্রায়োরিটি শিপিং',
                      '#831843'
                    )}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    Gold VIP (10% Off)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset(
                      'Platinum Royal', 
                      15, 
                      2.0, 
                      30000, 
                      '১৫% মেগা ডিসকাউন্ট, ২.০x ডাবল ক্যাশব্যাক পয়েন্ট, প্রতিটি অর্ডারে ফ্রি ডেলিভারি, ডেডিকেটেড ভিআইপি হেল্পলাইন',
                      '#064e3b'
                    )}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    Platinum Royal (15% Off)
                  </button>
                </div>
              </div>

              {/* Level Name */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Level Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingTier.name}
                  onChange={(e) => setEditingTier({ ...editingTier, name: e.target.value })}
                  placeholder="e.g. Silver, Gold VIP, Student Club"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none"
                />
              </div>

              {/* Grid 2-col: Level Order & Min Lifetime Spend */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Level Order (1, 2, 3) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingTier.levelOrder}
                    onChange={(e) => setEditingTier({ ...editingTier, levelOrder: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Min Lifetime Spend (৳) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingTier.minLifetimeSpend}
                    onChange={(e) => setEditingTier({ ...editingTier, minLifetimeSpend: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none"
                  />
                </div>
              </div>

              {/* Grid 2-col: Bill Discount (%) & Point Multiplier */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Bill Discount (%) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={editingTier.billDiscountPercent}
                    onChange={(e) => setEditingTier({ ...editingTier, billDiscountPercent: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Point Multiplier (e.g. 1.5x) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    required
                    value={editingTier.pointMultiplier}
                    onChange={(e) => setEditingTier({ ...editingTier, pointMultiplier: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none"
                  />
                </div>
              </div>

              {/* Special Perks & Benefits */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Special Perks & Benefits
                </label>
                <textarea
                  rows={3}
                  value={editingTier.perks}
                  onChange={(e) => setEditingTier({ ...editingTier, perks: e.target.value })}
                  placeholder="e.g. Free birthday cake slice, priority table booking, free shipping"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTier(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-[#064e3b] hover:bg-[#053d2e] text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>Save VIP Level</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

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
        title="Delete VIP Level?"
        message="Are you sure you want to delete this VIP membership tier?"
        confirmText="Yes, delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTargetId(null)}
      />

    </div>
  );
}
