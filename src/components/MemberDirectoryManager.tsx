import React, { useState, useEffect, useMemo } from 'react';
import { ClubMember, VipTier } from '../types';
import { loyaltyClubService } from '../lib/loyaltyClubService';
import { dbService } from '../lib/dbService';
import { CircularProgress } from './LoadingSkeleton';
import { 
  Users, Plus, Trash2, Edit3, X, Check, Save, Search, 
  MessageCircle, Award, Coins, RefreshCw, Phone, ShieldCheck, 
  Sparkles, TrendingUp
} from 'lucide-react';
import { FeedbackDialog } from './ui/FeedbackDialog';
import { ConfirmDialog } from './ui/ConfirmDialog';

export default function MemberDirectoryManager() {
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [tiers, setTiers] = useState<VipTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingMember, setEditingMember] = useState<ClubMember | null>(null);
  const [pointsAdjustMember, setPointsAdjustMember] = useState<ClubMember | null>(null);
  const [pointsAmount, setPointsAmount] = useState<number>(50);
  const [pointsAction, setPointsAction] = useState<'add' | 'deduct'>('add');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // New member form
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newTierId, setNewTierId] = useState('');
  const [newStartingPoints, setNewStartingPoints] = useState<number>(50);

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
  const [brandName, setBrandName] = useState('VIP Club');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [membersData, tiersData, ecom] = await Promise.all([
        loyaltyClubService.getClubMembers(),
        loyaltyClubService.getVipTiers(),
        dbService.getEcomSettings().catch(() => null)
      ]);
      setMembers(membersData);
      setTiers(tiersData);
      if (tiersData.length > 0) {
        setNewTierId(tiersData[0].id);
      }
      if (ecom?.storeName || ecom?.headerSettings?.brandName) {
        setBrandName(ecom.storeName || ecom.headerSettings.brandName);
      }
    } catch (err) {
      console.error('Failed to load member directory data:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return members;
    return members.filter(m => 
      m.name.toLowerCase().includes(q) ||
      m.phone.includes(q) ||
      m.memberNumber.toLowerCase().includes(q) ||
      m.tierName.toLowerCase().includes(q)
    );
  }, [members, searchQuery]);

  const handleEnrollNewMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim() || !newName.trim()) return;

    setIsSaving(true);
    try {
      const { member, isNew } = await loyaltyClubService.registerOrEnrollMember(
        newPhone.trim(),
        newName.trim(),
        0
      );

      // Apply selected tier and bonus points if customized
      const selectedTier = tiers.find(t => t.id === newTierId);
      const updatedMember: ClubMember = {
        ...member,
        tierId: selectedTier?.id || member.tierId,
        tierName: selectedTier?.name || member.tierName,
        pointsBalance: Number(newStartingPoints) || 50
      };

      const updatedList = members.filter(m => m.id !== member.id);
      updatedList.unshift(updatedMember);
      await loyaltyClubService.saveClubMembers(updatedList);
      setMembers(updatedList);

      setIsAddingNew(false);
      setNewName('');
      setNewPhone('');
      setNewStartingPoints(50);

      setFeedback({
        isOpen: true,
        type: 'success',
        title: isNew ? 'নতুন মেম্বার নিবন্ধিত হয়েছে!' : 'মেম্বার তথ্য আপডেট হয়েছে',
        message: `${updatedMember.name} (${updatedMember.memberNumber}) সফলভাবে সেভ হয়েছে।`
      });
    } catch (err: any) {
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'নিবন্ধন ব্যর্থ হয়েছে',
        message: err.message || 'মোবাইল নম্বর যাচাই করে আবার চেষ্টা করুন।'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pointsAdjustMember || pointsAmount <= 0) return;

    setIsSaving(true);
    try {
      const currentPts = pointsAdjustMember.pointsBalance || 0;
      const newPts = pointsAction === 'add' 
        ? currentPts + pointsAmount 
        : Math.max(0, currentPts - pointsAmount);

      const updated = members.map(m => {
        if (m.id === pointsAdjustMember.id) {
          return { ...m, pointsBalance: newPts };
        }
        return m;
      });

      await loyaltyClubService.saveClubMembers(updated);
      setMembers(updated);
      setPointsAdjustMember(null);

      setFeedback({
        isOpen: true,
        type: 'success',
        title: 'পয়েন্ট সফলভাবে অ্যাডজাস্ট করা হয়েছে',
        message: `${pointsAdjustMember.name} এর নতুন পয়েন্ট ব্যালেন্স: ${newPts}`
      });
    } catch (err) {
      console.error('Failed to adjust points:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    const updated = members.filter(m => m.id !== deleteTargetId);
    setMembers(updated);
    await loyaltyClubService.saveClubMembers(updated);
    setDeleteTargetId(null);
    setFeedback({
      isOpen: true,
      type: 'success',
      title: 'মেম্বার মুছে ফেলা হয়েছে',
      message: 'মেম্বার রেকর্ডটি সফলভাবে রিমুভ করা হয়েছে।'
    });
  };

  // KPIs
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'Active').length;
  const totalPointsBalance = members.reduce((sum, m) => sum + (m.pointsBalance || 0), 0);
  const totalLifetimeSpent = members.reduce((sum, m) => sum + (m.totalSpent || 0), 0);

  if (isLoading) {
    return <CircularProgress label="লোড হচ্ছে মেম্বার ডিরেক্টরি..." size="md" />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans text-slate-800 pb-16">
      
      {/* Header & New Member Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Member Directory (সদস্য তালিকা)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {totalMembers} Registered Members
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Browse all enrolled VIP loyalty club members, point balances, and lifetime purchase stats
          </p>
        </div>

        <button
          onClick={() => setIsAddingNew(true)}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-[#064e3b] hover:bg-[#053d2e] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>+ Enroll New Member</span>
        </button>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">
            <span>TOTAL MEMBERS</span>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalMembers}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">
            <span>ACTIVE MEMBERS</span>
            <Award className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{activeMembers}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">
            <span>TOTAL POINTS ISSUED</span>
            <Coins className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalPointsBalance.toLocaleString()}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">
            <span>MEMBER SPEND</span>
            <TrendingUp className="h-4 w-4 text-[#0284c7]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">৳{totalLifetimeSpent.toLocaleString()}</div>
        </div>
      </div>

      {/* Search and Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone (01XXXXXXXXX), or member ID..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-teal-600"
            />
          </div>

          <span className="text-xs text-slate-500">
            Showing {filteredMembers.length} of {totalMembers} members
          </span>
        </div>

        {/* Member Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Member Card ID</th>
                <th className="px-4 py-3.5">Customer Name & Phone</th>
                <th className="px-4 py-3.5">Current VIP Tier</th>
                <th className="px-4 py-3.5">Lifetime Spend</th>
                <th className="px-4 py-3.5">Points Balance</th>
                <th className="px-4 py-3.5">Validity</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredMembers.map((member) => {
                const tierInfo = tiers.find(t => t.id === member.tierId) || tiers[0];
                const cleanPhone = (member.phone || '').replace(/\D/g, '');
                const waMessage = encodeURIComponent(
                  `Hello ${member.name}! Thank you for being a valued ${member.tierName} of ${brandName} VIP Club (Card: ${member.memberNumber}). You have ${member.pointsBalance} reward points available!`
                );

                return (
                  <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Member ID */}
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-amber-500 shrink-0" />
                        <span>{member.memberNumber}</span>
                      </div>
                    </td>

                    {/* Customer Info */}
                    <td className="px-4 py-3.5">
                      <div className="font-extrabold text-slate-900 text-xs">{member.name}</div>
                      <div className="flex items-center gap-2 mt-0.5 text-slate-500 font-mono text-[11px]">
                        <span>{member.phone}</span>
                        <a
                          href={`https://wa.me/88${cleanPhone}?text=${waMessage}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:text-emerald-700"
                          title="Message on WhatsApp"
                        >
                          <MessageCircle className="h-3.5 w-3.5 fill-emerald-100" />
                        </a>
                      </div>
                    </td>

                    {/* Current Tier */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        <Sparkles className="h-3 w-3 text-amber-500" />
                        <span>{member.tierName || 'Silver Member'}</span>
                        {tierInfo?.billDiscountPercent && (
                          <span className="text-emerald-600 font-extrabold ml-0.5">
                            ({tierInfo.billDiscountPercent}% Off)
                          </span>
                        )}
                      </span>
                    </td>

                    {/* Lifetime Spend */}
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                      ৳{(member.totalSpent || 0).toLocaleString()}
                    </td>

                    {/* Points Balance */}
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => {
                          setPointsAdjustMember(member);
                          setPointsAmount(50);
                          setPointsAction('add');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-mono font-black transition-colors cursor-pointer"
                        title="Click to add or deduct points"
                      >
                        <Coins className="h-3.5 w-3.5 text-amber-600" />
                        <span>{member.pointsBalance || 0} pts</span>
                      </button>
                    </td>

                    {/* Validity */}
                    <td className="px-4 py-3.5 text-[11px] text-slate-500">
                      <span>Valid till: {member.validUntil}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setDeleteTargetId(member.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          title="Delete Member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    কোনো মেম্বার রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================== */}
      {/* Modal: Enroll New Member                       */}
      {/* ============================================== */}
      {isAddingNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-700" />
                <span>Enroll New VIP Member</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEnrollNewMember} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. তানভীর আহমেদ"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:border-teal-600 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">Mobile Phone Number (11 digits) *</label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:border-teal-600 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">Assign VIP Tier</label>
                <select
                  value={newTierId}
                  onChange={(e) => setNewTierId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:border-teal-600 outline-none cursor-pointer"
                >
                  {tiers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.billDiscountPercent}% Off - {t.pointMultiplier}x Points)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">Starting Welcome Bonus Points</label>
                <input
                  type="number"
                  min="0"
                  value={newStartingPoints}
                  onChange={(e) => setNewStartingPoints(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:border-teal-600 outline-none"
                />
                <p className="text-[10px] text-slate-400">এই পয়েন্ট দিয়ে গ্রাহক চেকআউটে তাৎক্ষণিক ছাড় পাবেন।</p>
              </div>

              <div className="pt-3 flex justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-4 py-2 text-slate-600 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-[#064e3b] hover:bg-[#053d2e] text-white font-extrabold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>Save Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================== */}
      {/* Modal: Adjust Member Points                   */}
      {/* ============================================== */}
      {pointsAdjustMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Adjust Member Points</h3>
                <p className="text-[11px] text-slate-500">{pointsAdjustMember.name} ({pointsAdjustMember.pointsBalance || 0} pts)</p>
              </div>
              <button
                type="button"
                onClick={() => setPointsAdjustMember(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustPoints} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPointsAction('add')}
                  className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                    pointsAction === 'add'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  + Add Points
                </button>
                <button
                  type="button"
                  onClick={() => setPointsAction('deduct')}
                  className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                    pointsAction === 'deduct'
                      ? 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  - Deduct Points
                </button>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">Points Amount</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={pointsAmount}
                  onChange={(e) => setPointsAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:border-teal-600 outline-none text-base"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPointsAdjustMember(null)}
                  className="px-3 py-1.5 text-slate-600 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#064e3b] text-white font-extrabold rounded-xl shadow-md cursor-pointer"
                >
                  Confirm
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
        title="Delete Member Record?"
        message="Are you sure you want to remove this customer from the VIP club directory?"
        confirmText="Yes, delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTargetId(null)}
      />

    </div>
  );
}
