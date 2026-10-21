import React, { useState, useEffect } from 'react';
import { VipTier, DigitalLoyaltyCard, ClubMember } from '../types';
import { loyaltyClubService } from '../lib/loyaltyClubService';
import { 
  Award, Sparkles, Check, ArrowRight, ShieldCheck, Gift, 
  Coins, Truck, Smartphone, QrCode, Share2, MessageCircle, X, Download, UserCheck
} from 'lucide-react';

interface Props {
  onExploreProducts?: () => void;
  onOpenCheckout?: () => void;
}

export default function LoyaltyMembershipSection({ onExploreProducts, onOpenCheckout }: Props) {
  const [tiers, setTiers] = useState<VipTier[]>([]);
  const [digitalCard, setDigitalCard] = useState<DigitalLoyaltyCard | null>(null);
  const [activeMember, setActiveMember] = useState<ClubMember | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  // Join form state
  const [joinPhone, setJoinPhone] = useState('');
  const [joinName, setJoinName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joinedSuccess, setJoinedSuccess] = useState(false);
  const [generatedMember, setGeneratedMember] = useState<ClubMember | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [tiersData, cardsData] = await Promise.all([
          loyaltyClubService.getVipTiers(),
          loyaltyClubService.getDigitalLoyaltyCards()
        ]);
        setTiers(tiersData.filter(t => t.status === 'Active'));
        if (cardsData.length > 0) {
          setDigitalCard(cardsData[0]);
        }
        const session = loyaltyClubService.getActiveMemberSession();
        if (session) {
          setActiveMember(session);
        }
      } catch (err) {
        console.error('Failed to load loyalty section data:', err);
      }
    }
    loadData();
  }, []);

  const handleOpenJoin = (presetTier?: VipTier) => {
    const session = loyaltyClubService.getActiveMemberSession();
    if (session) {
      setGeneratedMember(session);
      setJoinedSuccess(true);
    } else {
      setJoinedSuccess(false);
      setGeneratedMember(null);
    }
    setIsJoinModalOpen(true);
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = loyaltyClubService.normalizePhone(joinPhone);
    if (!cleanPhone || cleanPhone.length !== 11) {
      alert('সঠিক ১১ ডিজিটের মোবাইল নম্বর প্রদান করুন (যেমন: 01XXXXXXXXX)');
      return;
    }

    setIsSubmitting(true);
    try {
      const { member, isNew } = await loyaltyClubService.registerOrEnrollMember(
        cleanPhone,
        joinName.trim() || 'Valued Member',
        0
      );
      setGeneratedMember(member);
      setActiveMember(member);
      setJoinedSuccess(true);
    } catch (err: any) {
      alert(err.message || 'মেম্বারশিপ চালু করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cashbackPct = digitalCard 
    ? (((digitalCard.earnPoints * digitalCard.pointValueTaka) / digitalCard.forSpend) * 100).toFixed(0)
    : '5';

  return (
    <section className="py-14 sm:py-20 bg-gradient-to-b from-[#f8fafc] via-white to-sky-50/40 relative overflow-hidden font-sans border-y border-slate-200/80">
      
      {/* Decorative Brand Glow Orbs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#0284c7]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#16a34a]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Badge & Title */}
        <div className="text-center max-w-3xl mx-auto space-y-3.5 mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 text-[#0284c7] font-extrabold text-xs tracking-wide shadow-2xs border border-sky-200">
            <Award className="h-4 w-4" />
            <span>LIVEWELLFRESH SUPER CLUB • লয়্যালটি প্রিভিলেজ</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            স্বাগতম আমাদের <span className="bg-gradient-to-r from-[#0a3866] via-[#0284c7] to-[#16a34a] bg-clip-text text-transparent">ভিআইপি মেম্বারশিপে</span>
          </h2>

          <p className="text-xs sm:text-base text-slate-600 leading-relaxed">
            স্বপ্ন (Shwapno) বা মীনা বাজারের মতো প্রতিটি অর্ডারে নিশ্চিত <strong>বিল ডিসকাউন্ট</strong>, রিওয়ার্ড <strong>পয়েন্ট ক্যাশব্যাক</strong> ও <strong>ফ্রি হোম ডেলিভারি</strong> সুবিধা উপভোগ করুন। আজই ফ্রি মেম্বার কার্ড সংগ্রহ করুন!
          </p>

          {activeMember && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-bold">
              <UserCheck className="h-4 w-4 text-emerald-600" />
              <span>স্বাগতম, {activeMember.name}! আপনি আমাদের <strong>{activeMember.tierName}</strong> (পয়েন্ট: {activeMember.pointsBalance})</span>
            </div>
          )}
        </div>

        {/* 4 Feature Value Pillars */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-12 sm:mb-16">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#0284c7] transition-all space-y-2">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0284c7] flex items-center justify-center font-bold">
              💎
            </div>
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">গ্যারান্টিড বিল ছাড়</h4>
            <p className="text-[11px] sm:text-xs text-slate-500 leading-snug">
              প্রতিটি কেনাকাটায় সরাসরি ৫% থেকে ১৫% পর্যন্ত ইনস্ট্যান্ট মেম্বার ডিসকাউন্ট।
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#0284c7] transition-all space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              🪙
            </div>
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">{cashbackPct}% পয়েন্ট ক্যাশব্যাক</h4>
            <p className="text-[11px] sm:text-xs text-slate-500 leading-snug">
              প্রতি ১০০ টাকায় ৫-১০ পয়েন্ট জমা হবে যা পরবর্তী অর্ডারে নগদ টাকা হিসেবে ব্যবহারযোগ্য।
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#0284c7] transition-all space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              🚚
            </div>
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">ফ্রি ডেলিভারি অগ্রাধিকার</h4>
            <p className="text-[11px] sm:text-xs text-slate-500 leading-snug">
              ক্লাব মেম্বারদের জন্য সহজ ফ্রি হোম ডেলিভারি ও দ্রুত সুপারফাস্ট কুরিয়ার সার্ভিস।
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#0284c7] transition-all space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              📱
            </div>
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">ডিজিটাল ওয়ালেট পাস</h4>
            <p className="text-[11px] sm:text-xs text-slate-500 leading-snug">
              কোনো প্লাস্টিক কার্ড বহনের প্রয়োজন নেই; আপনার ফোন নম্বর ও ডিজিটাল পাসই যথেষ্ট।
            </p>
          </div>
        </div>

        {/* 3 VIP Membership Tiers Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12 sm:mb-16">
          {tiers.map((tier, idx) => {
            const isPopular = tier.name.toLowerCase().includes('gold') || idx === 1;
            const themeBg = tier.cardColor || (idx === 0 ? '#0a3866' : idx === 1 ? '#831843' : '#064e3b');

            return (
              <div
                key={tier.id}
                className={`bg-white rounded-3xl p-6 sm:p-8 border transition-all relative flex flex-col justify-between ${
                  isPopular 
                    ? 'border-[#0284c7] ring-4 ring-sky-100 shadow-xl scale-[1.02]' 
                    : 'border-slate-200/80 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Popular Pill */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#0284c7] to-[#16a34a] text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    <span>সবচেয়ে জনপ্রিয় (MOST POPULAR)</span>
                  </div>
                )}

                <div>
                  {/* Tier Title & Order */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Level {tier.levelOrder} VIP
                    </span>
                    <span 
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: themeBg }}
                    />
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">
                    {tier.name}
                  </h3>

                  {/* Main Discount Display */}
                  <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-baseline justify-between">
                    <div>
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
                        {tier.billDiscountPercent}%
                      </span>
                      <span className="text-xs font-bold text-slate-500 ml-1">ছাড় (OFF)</span>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg bg-sky-100 text-[#0284c7] text-xs font-mono font-bold">
                      {tier.pointMultiplier}x ক্যাশব্যাক পয়েন্ট
                    </span>
                  </div>

                  {/* Criteria */}
                  <div className="text-xs text-slate-600 space-y-2 mb-6">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">লাইফটাইম কেনাকাটা:</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {tier.minLifetimeSpend === 0 ? 'ফ্রি সাইনআপ' : `৳${tier.minLifetimeSpend.toLocaleString()}+`}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">রিওয়ার্ড রেট:</span>
                      <span className="font-bold text-emerald-600">
                        {tier.pointMultiplier}x Multiplier
                      </span>
                    </div>
                  </div>

                  {/* Perks List */}
                  <div className="space-y-2.5 text-xs text-slate-700 mb-8">
                    {tier.perks.split(',').map((perk, pIdx) => (
                      <div key={pIdx} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                          ✓
                        </div>
                        <span className="leading-snug">{perk.trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Join CTA */}
                <button
                  type="button"
                  onClick={() => handleOpenJoin(tier)}
                  className={`w-full py-3.5 px-6 rounded-2xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm ${
                    isPopular
                      ? 'bg-gradient-to-r from-[#0a3866] to-[#0284c7] hover:opacity-95 text-white shadow-sky-500/25'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <span>{activeMember?.tierId === tier.id ? 'View My VIP Card' : 'ফ্রি মেম্বারশিপ কার্ড নিন'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner Callout with WhatsApp Support */}
        <div className="bg-gradient-to-r from-[#0a3866] to-[#0284c7] rounded-3xl p-6 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="space-y-2 text-center md:text-left relative z-10">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-200">
              1-CLICK INSTANT ACTIVATION
            </span>
            <h3 className="text-xl sm:text-2xl font-black">
              মেম্বার হতে কোনো ফি লাগবে না — আজই প্রথম অর্ডারে যুক্ত হোন!
            </h3>
            <p className="text-xs sm:text-sm text-sky-100 max-w-xl">
              শুধু আপনার মোবাইল নম্বর দিয়ে ১ ক্লিকে ডিজিটাল মেম্বার পাস তৈরি করে নিন এবং চেকআউটে তাৎক্ষণিক ডিসকাউন্ট পেয়ে যান।
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10 w-full sm:w-auto">
            <button
              onClick={() => handleOpenJoin()}
              className="w-full sm:w-auto px-7 py-3.5 bg-white text-[#0a3866] hover:bg-sky-50 font-black text-xs sm:text-sm rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Smartphone className="h-4 w-4 text-[#0284c7]" />
              <span>Get Digital Member Card</span>
            </button>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* Interactive Modal: Get & View Digital Membership Pass     */}
      {/* ======================================================== */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {joinedSuccess ? 'Your Digital VIP Pass' : 'Join livewellfresh Super Club'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {joinedSuccess ? 'আপনার পার্সোনালাইজড মেম্বারশিপ কার্ড প্রস্তুত' : '১ ক্লিকে মেম্বারশিপ নিয়ে আকর্ষণীয় ছাড় পান'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsJoinModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* If Member Generated: Show Visual Digital Pass (Screenshot 2 Style) */}
            {joinedSuccess && generatedMember ? (
              <div className="space-y-5">
                
                {/* Visual Digital Phone Wallet Pass */}
                <div
                  className="w-full h-52 rounded-3xl p-5 text-white shadow-xl relative flex flex-col justify-between overflow-hidden"
                  style={{ backgroundColor: digitalCard?.cardColor || '#0a3866' }}
                >
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Top: Brand & Tier Badge */}
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-amber-300" />
                        <span className="text-xs font-black tracking-wider uppercase text-white/90">
                          LIVEWELLFRESH
                        </span>
                      </div>
                      <h4 className="text-lg font-black tracking-tight mt-0.5">
                        VIP Club Card
                      </h4>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-black bg-amber-400 text-slate-950 shadow-xs">
                      {generatedMember.tierName}
                    </span>
                  </div>

                  {/* Middle: Member Name & Card Number */}
                  <div className="relative z-10 space-y-1">
                    <div className="text-base font-black tracking-wide truncate">
                      {generatedMember.name}
                    </div>
                    <div className="text-xs font-mono text-sky-200 tracking-wider">
                      {generatedMember.memberNumber}
                    </div>
                  </div>

                  {/* Bottom: Points & Validity */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-mono relative z-10 border-t border-white/20 pt-2.5">
                    <div>
                      <span className="text-white/60 block text-[9px]">REWARD BALANCE</span>
                      <span className="font-black text-amber-300 text-xs">
                        {generatedMember.pointsBalance} PTS
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-white/60 block text-[9px]">VALID THROUGH</span>
                      <span className="font-bold text-white text-[11px]">
                        {generatedMember.validUntil}
                      </span>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Save & Share */}
                <div className="space-y-2.5">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Here is my livewellfresh Super Club Membership Card!\nName: ${generatedMember.name}\nCard No: ${generatedMember.memberNumber}\nTier: ${generatedMember.tierName}\nPoints: ${generatedMember.pointsBalance} PTS\nJoin here: ${window.location.origin}/shop`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer no-underline"
                  >
                    <MessageCircle className="h-4 w-4 fill-current" />
                    <span>WhatsApp এ মেম্বার কার্ড সেভ রাখুন</span>
                  </a>

                  <button
                    onClick={() => {
                      setIsJoinModalOpen(false);
                      if (onExploreProducts) onExploreProducts();
                    }}
                    className="w-full py-3 px-4 bg-[#0284c7] hover:bg-[#0369a1] text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>মেম্বার ডিসকাউন্টে কেনাকাটা করুন</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

              </div>
            ) : (
              /* Registration Form */
              <form onSubmit={handleJoinSubmit} className="space-y-4 text-xs">
                
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    আপনার নাম (Full Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    placeholder="যেমন: তানভীর আহমেদ"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-teal-600 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    মোবাইল নম্বর (11 Digits Mobile Number) *
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs font-bold text-slate-600">
                      +88
                    </span>
                    <input
                      type="tel"
                      required
                      value={joinPhone}
                      onChange={(e) => setJoinPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl text-slate-900 font-mono font-bold focus:bg-white focus:border-teal-600 outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    এই ফোন নম্বরেই স্বয়ংক্রিয়ভাবে পয়েন্ট এবং মেম্বার ছাড় হিসাব হবে।
                  </p>
                </div>

                {/* Free Gift Benefit Banner */}
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-center gap-2 text-[11px]">
                  <Gift className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>এখনই মেম্বার হলে সাথে পাচ্ছেন <strong>৫০ ওয়েলকাম বোনাস পয়েন্ট (৳৫০)</strong>!</span>
                </div>

                <div className="pt-2 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsJoinModalOpen(false)}
                    className="px-4 py-2 text-slate-600 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-extrabold rounded-xl shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? 'প্রসেসিং হচ্ছে...' : 'কার্ড তৈরি করুন (Instant Active)'}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

    </section>
  );
}
