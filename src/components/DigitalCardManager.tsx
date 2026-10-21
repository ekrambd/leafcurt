import React, { useState, useEffect, useMemo } from 'react';
import { DigitalLoyaltyCard } from '../types';
import { loyaltyClubService } from '../lib/loyaltyClubService';
import { CircularProgress } from './LoadingSkeleton';
import { 
  CreditCard, Plus, Trash2, Edit3, X, Check, Save, Share2, 
  MessageCircle, Smartphone, Sparkles, RefreshCw, Layers, Users, QrCode
} from 'lucide-react';
import { FeedbackDialog } from './ui/FeedbackDialog';
import { ConfirmDialog } from './ui/ConfirmDialog';

const CARD_COLORS = [
  { id: '#064e3b', name: 'Forest Emerald' },
  { id: '#0a3866', name: 'Deep Navy' },
  { id: '#0284c7', name: 'Ocean Blue' },
  { id: '#831843', name: 'Royal Berry' },
  { id: '#78350f', name: 'Warm Bronze' },
  { id: '#1e293b', name: 'Slate Midnight' }
];

export default function DigitalCardManager() {
  const [cards, setCards] = useState<DigitalLoyaltyCard[]>([]);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCard, setEditingCard] = useState<DigitalLoyaltyCard | null>(null);
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
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [cardsData, membersData] = await Promise.all([
        loyaltyClubService.getDigitalLoyaltyCards(),
        loyaltyClubService.getClubMembers()
      ]);
      setCards(cardsData);
      setMemberCount(membersData.length);
    } catch (err) {
      console.error('Failed to load digital cards:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleOpenAddModal = () => {
    setEditingCard({
      id: `card-${Date.now()}`,
      title: 'VIP Card',
      cardColor: '#831843',
      forSpend: 100,
      earnPoints: 5,
      pointValueTaka: 1,
      validityDays: 365,
      cardType: 'Phone Wallet Pass',
      status: 'Active',
      updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    });
    setIsAddingNew(true);
  };

  const handleApplyTemplate = (title: string, earnPoints: number, color: string) => {
    if (!editingCard) return;
    setEditingCard({
      ...editingCard,
      title,
      cardColor: color,
      forSpend: 100,
      earnPoints,
      pointValueTaka: 1,
      validityDays: 365
    });
  };

  const mathCheck = useMemo(() => {
    if (!editingCard) return '';
    const spend = editingCard.forSpend || 100;
    const pts = editingCard.earnPoints || 5;
    const ptVal = editingCard.pointValueTaka || 1;
    const discount = pts * ptVal;
    const pct = ((discount / spend) * 100).toFixed(1);
    return `Math Check: ৳${spend} bill → ${pts} pts = ৳${discount.toFixed(1)} discount (${pct}% effective cashback)`;
  }, [editingCard]);

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard || !editingCard.title.trim()) return;

    setIsSaving(true);
    try {
      let updated: DigitalLoyaltyCard[];
      if (isAddingNew) {
        updated = [...cards, { ...editingCard, title: editingCard.title.trim() }];
      } else {
        updated = cards.map(c => c.id === editingCard.id ? { ...editingCard, title: editingCard.title.trim() } : c);
      }

      await loyaltyClubService.saveDigitalLoyaltyCards(updated);
      setCards(updated);
      setEditingCard(null);
      setIsAddingNew(false);

      setFeedback({
        isOpen: true,
        type: 'success',
        title: 'ডিজিটাল কার্ড সংরক্ষিত হয়েছে!',
        message: `"${editingCard.title}" সফলভাবে ডাটাবেজে আপডেট করা হয়েছে।`
      });
    } catch (err) {
      console.error('Failed to save card:', err);
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

  const handleToggleStatus = async (cardId: string) => {
    const updated = cards.map(c => {
      if (c.id === cardId) {
        return {
          ...c,
          status: (c.status === 'Active' ? 'Inactive' : 'Active') as 'Active' | 'Inactive'
        };
      }
      return c;
    });
    setCards(updated);
    await loyaltyClubService.saveDigitalLoyaltyCards(updated);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    const updated = cards.filter(c => c.id !== deleteTargetId);
    setCards(updated);
    await loyaltyClubService.saveDigitalLoyaltyCards(updated);
    setDeleteTargetId(null);
    setFeedback({
      isOpen: true,
      type: 'success',
      title: 'ডিজিটাল কার্ড মুছে ফেলা হয়েছে',
      message: 'কার্ডটি সফলভাবে রিমুভ করা হয়েছে।'
    });
  };

  const totalCards = cards.length;
  const activeCards = cards.filter(c => c.status === 'Active').length;

  if (isLoading) {
    return <CircularProgress label="লোড হচ্ছে মেম্বার কার্ড সেটিংস..." size="md" />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans text-slate-800 pb-16">
      
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Member Cards
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {activeCards}/{totalCards} active digital wallet passes
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-[#064e3b] hover:bg-[#053d2e] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>+ New Card</span>
        </button>
      </div>

      {/* Top 4 KPI Cards (Matching Screenshot 2) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">
            <span>TOTAL CARDS</span>
            <span className="text-slate-300">ⓘ</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalCards}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">
            <span>ACTIVE CARDS</span>
            <span className="text-slate-300">ⓘ</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{activeCards}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">
            <span>CARD HOLDERS</span>
            <span className="text-slate-300">ⓘ</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{memberCount}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">
            <span>DIGITAL PASSES</span>
            <span className="text-slate-300">ⓘ</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{activeCards}</div>
        </div>
      </div>

      {/* Cards List Grid (Matching Screenshot 2 visual card pass) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          const spend = card.forSpend || 100;
          const pts = card.earnPoints || 5;
          const ptVal = card.pointValueTaka || 1;
          const cashbackPct = (((pts * ptVal) / spend) * 100).toFixed(1);

          const whatsappText = encodeURIComponent(
            `Hello! Join the livewellfresh VIP Club to get ${cashbackPct}% Cashback on every order and exclusive member discounts!\nClick here to get your free digital card: ${window.location.origin}/shop`
          );

          return (
            <div
              key={card.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Visual Digital Loyalty Card Graphic (Screenshot 2) */}
              <div
                className="w-full h-44 rounded-2xl p-5 text-white shadow-lg relative flex flex-col justify-between overflow-hidden"
                style={{ backgroundColor: card.cardColor || '#831843' }}
              >
                {/* Background Subtle Wave/Glow */}
                <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                {/* Top: Brand & Card Title */}
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <span className="text-[11px] font-medium text-white/80 uppercase tracking-wider block">
                      livewellfresh
                    </span>
                    <h4 className="text-lg font-black tracking-tight mt-0.5">
                      {card.title}
                    </h4>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/25 text-white border border-white/20">
                    {cashbackPct}% BACK
                  </span>
                </div>

                {/* Bottom: Earn Rate & Redeem Value */}
                <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-mono relative z-10 border-t border-white/20 pt-3">
                  <div>
                    <span className="text-white/60 block text-[9px]">EARN RATE</span>
                    <span className="font-bold text-white text-[11px]">
                      {card.earnPoints} pt / ৳{card.forSpend}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-white/60 block text-[9px]">REDEEM VALUE</span>
                    <span className="font-bold text-white text-[11px]">
                      1 pt = ৳{card.pointValueTaka}
                    </span>
                  </div>
                </div>
              </div>

              {/* Meta lines (Screenshot 2) */}
              <div className="space-y-2 text-xs text-slate-600 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Validity</span>
                  <span className="font-bold text-slate-800">{card.validityDays} Days</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Card Type</span>
                  <span className="font-bold text-slate-800">{card.cardType || 'Phone Wallet Pass'}</span>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleToggleStatus(card.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                    card.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${card.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  <span>{card.status === 'Active' ? 'Active Pass' : 'Inactive'}</span>
                </button>

                <div className="flex items-center space-x-2">
                  <a
                    href={`https://wa.me/?text=${whatsappText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold border border-emerald-200 transition-colors"
                  >
                    <Share2 className="h-3 w-3" />
                    <span>Share on WhatsApp</span>
                  </a>

                  <button
                    onClick={() => {
                      setEditingCard(card);
                      setIsAddingNew(false);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                    title="Edit Card"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setDeleteTargetId(card.id)}
                    className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                    title="Delete Card"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}

        {cards.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
            কোনো ডিজিটাল কার্ড পাওয়া যায়নি। উপরের "+ New Card" বাটনে ক্লিক করে কার্ড ডিজাইন করুন।
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* Modal: Design Digital Loyalty Card (Screenshot 3)          */}
      {/* ========================================================= */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                Design Digital Loyalty Card
              </h3>
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="space-y-4 text-xs">
              
              {/* 1-Click Quick Templates (Screenshot 3) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600">
                  1-Click Quick Templates
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('Silver Pass', 2, '#064e3b')}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    Silver Pass (2% Back)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('Gold VIP Card', 5, '#831843')}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    Gold VIP Card (5% Back)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('Fresh Club Pass', 10, '#0a3866')}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    Fresh Club Pass (10% Back)
                  </button>
                </div>
              </div>

              {/* Card Title */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Card Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingCard.title}
                  onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })}
                  placeholder="e.g. VIP Card, Club Pass"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none"
                />
              </div>

              {/* Card Color Chips (Screenshot 3) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700">
                  Card Color
                </label>
                <div className="flex items-center gap-2.5">
                  {CARD_COLORS.map(c => {
                    const isSelected = editingCard.cardColor === c.id;
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setEditingCard({ ...editingCard, cardColor: c.id })}
                        className={`w-9 h-9 rounded-xl transition-all cursor-pointer border-2 ${
                          isSelected ? 'border-slate-900 scale-110 shadow-md ring-2 ring-slate-400' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.id }}
                        title={c.name}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Grid 2-col: For Spend (৳) & Guest Earns (Points) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    For Spend (৳) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingCard.forSpend}
                    onChange={(e) => setEditingCard({ ...editingCard, forSpend: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Guest Earns (Points) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingCard.earnPoints}
                    onChange={(e) => setEditingCard({ ...editingCard, earnPoints: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none"
                  />
                </div>
              </div>

              {/* Grid 2-col: 1 Point Value (৳) & Validity (Days) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    1 Point Value (৳) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={editingCard.pointValueTaka}
                    onChange={(e) => setEditingCard({ ...editingCard, pointValueTaka: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Validity (Days) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingCard.validityDays}
                    onChange={(e) => setEditingCard({ ...editingCard, validityDays: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none"
                  />
                </div>
              </div>

              {/* Math Check Box (Screenshot 3) */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-900 font-mono text-[11px]">
                {mathCheck}
              </div>

              {/* Buttons */}
              <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCard(null)}
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
                  <span>Save Card</span>
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
        title="Delete Digital Card?"
        message="Are you sure you want to remove this digital card design?"
        confirmText="Yes, delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTargetId(null)}
      />

    </div>
  );
}
