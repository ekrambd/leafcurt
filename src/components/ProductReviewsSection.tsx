import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Star, 
  CheckCircle2, 
  ThumbsUp, 
  ShieldCheck, 
  Lock, 
  User, 
  Image as ImageIcon, 
  Send, 
  Camera, 
  X, 
  AlertCircle, 
  Sparkles,
  ShoppingBag,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Review, Product } from '../types';
import { dbService } from '../lib/dbService';
import { 
  getCustomerSession, 
  setCustomerSession, 
  clearCustomerSession, 
  isCustomerLoggedIn, 
  checkReviewEligibility, 
  voteReviewHelpful 
} from '../lib/customerAuth';

interface ProductReviewsSectionProps {
  product: Product;
  onOpenLoginModal?: () => void;
  accentColor?: string; // e.g. '#162963' for Authentic or '#f97316' for Fantine
}

export default function ProductReviewsSection({
  product,
  onOpenLoginModal,
  accentColor = '#162963'
}: ProductReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | 'all'>('all');

  // Customer Session & Eligibility
  const [customerSession, setCustomerSessionState] = useState(() => getCustomerSession());
  const [eligibility, setEligibility] = useState<{
    canReview: boolean;
    reason?: string;
    ordersCount: number;
    customerName?: string;
    matchedOrderId?: string;
  }>({
    canReview: false,
    ordersCount: 0
  });
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);

  // Review Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formHoverRating, setFormHoverRating] = useState(0);
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formComment, setFormComment] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [imageInputUrl, setImageInputUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Quick Inline Login Modal State
  const [isQuickLoginOpen, setIsQuickLoginOpen] = useState(false);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginName, setLoginName] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Clicked Image for Fullscreen Modal
  const [activeZoomImage, setActiveZoomImage] = useState<string | null>(null);

  // Helpful votes tracked in session
  const [votedReviews, setVotedReviews] = useState<Record<string, number>>({});

  // Load reviews for this product
  const loadReviews = useCallback(async () => {
    try {
      const data = await dbService.getReviews(product.id);
      setReviews(data);
    } catch (e) {
      console.warn('Failed loading reviews:', e);
    } finally {
      setLoading(false);
    }
  }, [product.id]);

  // Check eligibility for logged-in customer
  const verifyEligibility = useCallback(async () => {
    const session = getCustomerSession();
    setCustomerSessionState(session);

    if (!session) {
      setEligibility({
        canReview: false,
        reason: 'must_login',
        ordersCount: 0
      });
      return;
    }

    setIsCheckingEligibility(true);
    try {
      const result = await checkReviewEligibility(product.id);
      setEligibility(result);
      if (result.customerName && !formCustomerName) {
        setFormCustomerName(result.customerName);
      }
    } catch {
      setEligibility({
        canReview: false,
        reason: 'error',
        ordersCount: 0
      });
    } finally {
      setIsCheckingEligibility(false);
    }
  }, [product.id, formCustomerName]);

  useEffect(() => {
    loadReviews();
    verifyEligibility();

    const handleAuthChange = () => {
      verifyEligibility();
    };
    const handleReviewsChange = () => {
      loadReviews();
    };

    window.addEventListener('customer-auth-changed', handleAuthChange);
    window.addEventListener('reviews-updated', handleReviewsChange);

    return () => {
      window.removeEventListener('customer-auth-changed', handleAuthChange);
      window.removeEventListener('reviews-updated', handleReviewsChange);
    };
  }, [loadReviews, verifyEligibility]);

  // Handle Quick Login
  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = loginPhone.replace(/\D/g, '').replace(/^880/, '0').replace(/^88/, '');
    if (clean.length < 11 || !clean.startsWith('01')) {
      setLoginError('সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর (01XXXXXXXXX) দিন।');
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');

    try {
      setCustomerSession({
        phone: clean,
        name: loginName.trim() || undefined
      });

      setIsQuickLoginOpen(false);
      setSuccessToast('লগইন সফল হয়েছে!');
      setTimeout(() => setSuccessToast(''), 3000);

      // Verify eligibility with new session
      await verifyEligibility();
    } catch (err: any) {
      setLoginError(err?.message || 'লগইন করতে সমস্যা হয়েছে।');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Submit Customer Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formComment.trim()) {
      setFormError('দয়া করে আপনার রিভিউ মন্তব্য লিখুন।');
      return;
    }
    if (formComment.trim().length < 5) {
      setFormError('কমপক্ষে ৫ অক্ষরের মন্তব্য লিখুন।');
      return;
    }

    const session = getCustomerSession();
    if (!session) {
      setFormError('রিভিউ দিতে অবশ্যই লগইন করতে হবে।');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const finalName = formCustomerName.trim() || session.name || eligibility.customerName || 'ভেরিফাইড গ্রাহক';
      const newReview = await dbService.addReview({
        id: `REV-${Date.now()}`,
        productId: product.id,
        productTitle: product.title,
        productImage: product.coverImage || product.image,
        customerName: finalName,
        customerPhone: session.phone,
        rating: formRating,
        comment: formComment.trim(),
        images: formImages,
        createdAt: new Date().toISOString(),
        orderId: eligibility.matchedOrderId,
        isVerifiedBuyer: true
      });

      setReviews(prev => [newReview, ...prev]);
      setIsFormOpen(false);
      setFormComment('');
      setFormImages([]);
      setImageInputUrl('');
      setSuccessToast('🎉 আপনার রিভিউ সফলভাবে প্রকাশিত হয়েছে! ধন্যবাদ।');
      setTimeout(() => setSuccessToast(''), 4500);
      loadReviews();
    } catch (err: any) {
      setFormError(err?.message || 'রিভিউ জমা দিতে সমস্যা হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upvote helpful review
  const handleVoteHelpful = async (reviewId: string) => {
    if (votedReviews[reviewId]) return;
    const count = await voteReviewHelpful(reviewId);
    if (count !== null) {
      setVotedReviews(prev => ({ ...prev, [reviewId]: count }));
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, helpfulCount: count } : r));
    }
  };

  // Image Upload handler (Base64 file reader)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (formImages.length >= 3) {
      alert('সর্বোচ্চ ৩টি ছবি যুক্ত করা যাবে।');
      return;
    }

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      if (base64 && !formImages.includes(base64)) {
        setFormImages(prev => [...prev, base64].slice(0, 3));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Rating Statistics Calculations
  const stats = useMemo(() => {
    if (reviews.length === 0) {
      return {
        avgRating: 5.0,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    const avg = Number((sum / reviews.length).toFixed(1));
    const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      const star = Math.max(1, Math.min(5, Math.round(r.rating || 5)));
      dist[star] = (dist[star] || 0) + 1;
    });
    return {
      avgRating: avg,
      total: reviews.length,
      distribution: dist
    };
  }, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    if (selectedStarFilter === 'all') return reviews;
    return reviews.filter(r => Math.round(r.rating || 5) === selectedStarFilter);
  }, [reviews, selectedStarFilter]);

  // Relative Date Formatter
  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'সম্প্রতি';
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
      if (diffDays < 30) return `${diffDays} দিন আগে`;
      return new Date(dateStr).toLocaleDateString('bn-BD');
    } catch {
      return 'সম্প্রতি';
    }
  };

  return (
    <div className="space-y-8 font-sans" id="reviews-section">
      
      {/* Toast Alert */}
      {successToast && (
        <div className="fixed top-6 right-6 z-[9999] bg-emerald-950 text-emerald-100 border border-emerald-500/50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{successToast}</span>
        </div>
      )}

      {/* Fullscreen Image Preview Modal */}
      {activeZoomImage && (
        <div 
          onClick={() => setActiveZoomImage(null)}
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl">
            <button 
              onClick={() => setActiveZoomImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-black transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={activeZoomImage} 
              alt="Customer Review" 
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>কাস্টমার রিভিউ ও রেটিং</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {stats.total} টি রিভিউ
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            শুধুমাত্র আমাদের ওয়েবসাইট থেকে পণ্য ক্রয়কারী ভেরিফাইড ক্রেতাদের বাস্তব মতামত
          </p>
        </div>

        {/* Customer Login Pill Status */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {customerSession ? (
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-bold text-slate-800">
                {customerSession.name || customerSession.phone}
              </span>
              <button
                type="button"
                onClick={() => {
                  clearCustomerSession();
                  setCustomerSessionState(null);
                  verifyEligibility();
                }}
                className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold cursor-pointer ml-1"
                title="লগআউট"
              >
                (লগআউট)
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => (onOpenLoginModal ? onOpenLoginModal() : setIsQuickLoginOpen(true))}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>লগইন করুন</span>
            </button>
          )}
        </div>
      </div>

      {/* Review Summary Overview & "Write Review" Hero Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        
        {/* Left: Overall Score */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
          <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight">
            {stats.avgRating}
          </span>
          <div className="flex items-center gap-1 text-amber-400">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-5 h-5 ${
                  s <= Math.round(stats.avgRating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-300'
                }`}
              />
            ))}
          </div>
          <p className="text-xs font-semibold text-slate-600">
            {stats.total > 0 ? `${stats.total} টি ভেরিফাইড ক্রেতার মতামতের ভিত্তিতে` : 'এখনো কোনো রেটিং জমা হয়নি'}
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>১০০% ভেরিফাইড ক্রয় যাচাইকৃত</span>
            </span>
          </div>
        </div>

        {/* Middle: Star Breakdown Distribution */}
        <div className="lg:col-span-4 flex flex-col justify-center space-y-2 py-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.distribution[star] || 0;
            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            return (
              <button
                key={star}
                onClick={() => setSelectedStarFilter(selectedStarFilter === star ? 'all' : star)}
                className={`flex items-center gap-2.5 text-xs text-slate-600 hover:text-slate-900 transition-colors w-full cursor-pointer p-1 rounded-lg ${
                  selectedStarFilter === star ? 'bg-amber-50 font-bold' : ''
                }`}
              >
                <span className="w-7 font-bold text-slate-700 flex items-center gap-0.5">
                  {star} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-[11px] text-slate-400 font-mono">
                  {pct}%
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Write Review Callout Action Box (Enforcing Login & Verified Order) */}
        <div className="lg:col-span-4 flex flex-col justify-center p-5 bg-gradient-to-br from-slate-50 to-amber-50/40 rounded-2xl border border-slate-200 space-y-3">
          
          {/* CASE 1: NOT LOGGED IN */}
          {!customerSession ? (
            <div className="space-y-3 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>লগইন আবশ্যক</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                রিভিউ দিতে দয়া করে ওয়েবসাইটে লগইন করুন
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                পণ্যটির গুণগত মান সম্পর্কে রিভিউ লিখতে গ্রাহককে অবশ্যই ওয়েবসাইটে লগইন করতে হবে।
              </p>
              <button
                type="button"
                onClick={() => (onOpenLoginModal ? onOpenLoginModal() : setIsQuickLoginOpen(true))}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>লগইন করে রিভিউ দিন</span>
              </button>
            </div>
          ) : !eligibility.canReview ? (
            /* CASE 2: LOGGED IN BUT HAS NOT PLACED AN ORDER */
            <div className="space-y-3 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>অর্ডার যাচাইকরণ</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                শুধুমাত্র অর্ডারকারী গ্রাহক রিভিউ দিতে পারবেন
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                আপনার নম্বর <strong className="font-mono text-slate-800">{customerSession.phone}</strong> দিয়ে এখনো কোনো সফল অর্ডার পাওয়া যায়নি। রিভিউ দেওয়ার জন্য প্রথমে পণ্যটি অর্ডার করুন।
              </p>
              <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200">
                💡 আপনি যদি পূর্বে অন্য নম্বর দিয়ে অর্ডার করে থাকেন, দয়া করে সেই নম্বর দিয়ে লগইন করুন।
              </div>
            </div>
          ) : (
            /* CASE 3: LOGGED IN AND VERIFIED ORDER FOUND */
            <div className="space-y-3 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>ভেরিফাইড ক্রেতা পাওয়া গেছে</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                স্বাগতম, {customerSession.name || 'সম্মানিত ক্রেতা'}!
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                আপনার অর্ডারকৃত পণ্যের অভিজ্ঞতা সবার সাথে শেয়ার করুন এবং অন্যান্য ক্রেতাদের সঠিক পণ্য বেছে নিতে সহায়তা করুন।
              </p>
              <button
                type="button"
                onClick={() => setIsFormOpen(!isFormOpen)}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isFormOpen ? 'ফর্ম বন্ধ করুন' : 'আপনার রিভিউ লিখুন'}</span>
              </button>
            </div>
          )}

        </div>

      </div>

      {/* ============================================================
          INTERACTIVE REVIEW SUBMISSION FORM (When Eligible & Toggled)
          ============================================================ */}
      {isFormOpen && eligibility.canReview && (
        <form 
          onSubmit={handleSubmitReview}
          className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-500/40 shadow-xl space-y-5 animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">রিভিউ লিখুন ({product.title})</h3>
                <p className="text-xs text-slate-500">আপনার মতামত সৎ ও বাস্তব অভিজ্ঞতা অনুযায়ী লিখুন</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {formError && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2 border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* 1. Star Rating Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              আপনার রেটিং নির্বাচন করুন: *
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setFormHoverRating(star)}
                    onMouseLeave={() => setFormHoverRating(0)}
                    onClick={() => setFormRating(star)}
                    className="p-1 hover:scale-125 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                        star <= (formHoverRating || formRating)
                          ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-slate-700 px-3 py-1 bg-amber-50 rounded-lg border border-amber-200">
                {formRating === 5 ? '🌟 চমৎকার (৫/৫)' : formRating === 4 ? '👍 খুব ভালো (৪/৫)' : formRating === 3 ? '👌 মোটামুটি (৩/৫)' : formRating === 2 ? '👎 সন্তোষজনক নয় (২/৫)' : '⚠️ খারাপ (১/৫)'}
              </span>
            </div>
          </div>

          {/* 2. Customer Name & Verified Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">আপনার নাম:</label>
              <input
                type="text"
                required
                value={formCustomerName}
                onChange={(e) => setFormCustomerName(e.target.value)}
                placeholder="আপনার নাম লিখুন"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">ভেরিফাইড ফোন নম্বর:</label>
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-700">
                <span>{customerSession?.phone}</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>ভেরিফাইড</span>
                </span>
              </div>
            </div>
          </div>

          {/* 3. Review Comment */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              আপনার মতামত ও বিস্তারিত অভিজ্ঞতা লিখুন: *
            </label>
            <textarea
              required
              rows={4}
              value={formComment}
              onChange={(e) => setFormComment(e.target.value)}
              placeholder="পণ্যটির গুণগত মান, গন্ধ, প্যাকেজিং এবং কার্যকারিতা আপনার কাছে কেমন লেগেছে তা বিস্তারিত লিখুন..."
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none transition"
            />
          </div>

          {/* 4. Optional Photo Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              পণ্যটির ছবি যুক্ত করুন (ঐচ্ছিক, সর্বোচ্চ ৩টি):
            </label>
            
            <div className="flex flex-wrap items-center gap-3">
              {formImages.map((img, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 group">
                  <img src={img} alt="Product" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFormImages(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {formImages.length < 3 && (
                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 flex flex-col items-center justify-center text-slate-400 hover:text-emerald-600 transition cursor-pointer bg-slate-50">
                  <Camera className="w-5 h-5" />
                  <span className="text-[9px] font-bold mt-1">যোগ করুন</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'সাবমিট হচ্ছে...' : 'রিভিউ সাবমিট করুন'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ============================================================
          FILTER PILLS & SORT BAR
          ============================================================ */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        
        {/* Star Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedStarFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedStarFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            সব ({reviews.length})
          </button>
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              onClick={() => setSelectedStarFilter(selectedStarFilter === star ? 'all' : star)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                selectedStarFilter === star
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{star}</span>
              <Star className="w-3 h-3 fill-current" />
              <span>({stats.distribution[star] || 0})</span>
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400">
          মোট {filteredReviews.length} টি রিভিউ প্রদর্শিত
        </span>
      </div>

      {/* ============================================================
          CUSTOMER REVIEWS CARDS LIST
          ============================================================ */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          রিভিউ লোড হচ্ছে...
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <Star className="w-8 h-8 text-amber-300 mx-auto" />
          <h4 className="font-bold text-slate-800 text-sm">এই ফিল্টারে কোনো রিভিউ নেই</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            আপনি যদি এই পণ্যটি ক্রয় করে থাকেন, দয়া করে লগইন করে আপনার রিভিউ দিন!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev) => (
            <div 
              key={rev.id}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-3 hover:border-slate-300 transition-all"
            >
              {/* Header: Customer Name, Verified Buyer Badge, Stars & Date */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  {/* Initials Avatar */}
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm shrink-0">
                    {(rev.customerName || 'U')[0].toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">
                        {rev.customerName}
                      </h4>
                      {rev.isVerifiedBuyer && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>ভেরিফাইড ক্রেতা</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(rev.createdAt)}</span>
                    </p>
                  </div>
                </div>

                {/* Star Rating */}
                <div className="flex items-center gap-1 text-amber-400 self-start sm:self-auto">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= Math.round(rev.rating || 5)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line pl-0 sm:pl-13">
                {rev.comment}
              </p>

              {/* Uploaded Customer Photos */}
              {rev.images && rev.images.length > 0 && (
                <div className="flex flex-wrap gap-2.5 pt-1 pl-0 sm:pl-13">
                  {rev.images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveZoomImage(img)}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 hover:ring-2 hover:ring-slate-900 transition cursor-zoom-in group"
                    >
                      <img 
                        src={img} 
                        alt="Customer upload" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Helpful Votes Count */}
              <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleVoteHelpful(rev.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    votedReviews[rev.id]
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                  title="এই রিভিউটি কি আপনার জন্য উপকারী ছিল?"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>উপকারী ছিল</span>
                  <span className="font-mono text-[11px] text-slate-400">
                    ({rev.helpfulCount || votedReviews[rev.id] || 0})
                  </span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* ============================================================
          QUICK 1-CLICK CUSTOMER LOGIN MODAL
          ============================================================ */}
      {isQuickLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-slate-900 text-white rounded-xl">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">কাস্টমার লগইন</h3>
                  <p className="text-xs text-slate-500">রিভিউ লিখতে ও অর্ডার হিস্ট্রি দেখতে লগইন করুন</p>
                </div>
              </div>
              <button
                onClick={() => setIsQuickLoginOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2 border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleQuickLogin} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  মোবাইল নম্বর (যে নম্বর দিয়ে অর্ডার করেছেন): *
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs font-bold text-slate-600">
                    +88
                  </span>
                  <input
                    type="tel"
                    required
                    autoFocus
                    placeholder="01XXXXXXXXX"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-r-xl font-mono text-slate-900 focus:outline-none focus:border-slate-900 transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">আপনার নাম (ঐচ্ছিক):</label>
                <input
                  type="text"
                  placeholder="যেমন: তানভীর আহমেদ"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-slate-900 transition"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">🔒 ১০০% সিকিউর ও ভেরিফাইড:</p>
                <p>আপনার নম্বর প্রদান করা মাত্রই সিস্টেম আপনার অতীত অর্ডার চেক করে ভেরিফাইড ক্রেতা ব্যাজ প্রদান করবে।</p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickLoginOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <User className="w-4 h-4" />
                  <span>{isLoggingIn ? 'যাচাই হচ্ছে...' : 'লগইন করুন ও চালিয়ে যান'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
