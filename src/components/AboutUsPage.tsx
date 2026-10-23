import React, { useMemo } from 'react';
import { 
  Sparkles, ShieldCheck, Droplets, Leaf, Heart, Package, 
  CheckCircle2, ArrowRight, Wind, Zap, FlaskConical, Sun, Clock
} from 'lucide-react';
import { Product } from '../types';

interface AboutUsPageProps {
  onNavigateHome: () => void;
  onNavigateShop: () => void;
  onNavigateContact: () => void;
  brandName?: string;
  brandLogo?: string;
  products?: Product[];
}

const DEFAULT_REAL_PRODUCT_IMAGES: string[] = [
  '/uploads/file-1792732806051-429767445.jpg',
  '/uploads/file-1792732810160-642732998.jpg',
  '/uploads/file-1792732813775-670892229.webp',
  '/uploads/file-1792732686278-136471442.jpg',
  '/uploads/file-1792732691176-267670459.jpg',
  '/uploads/file-1792732695373-195832318.jpg',
  '/uploads/file-1792732574240-906933853.jpg',
  '/uploads/file-1792732582590-435627499.jpeg',
  '/uploads/file-1792732582599-944098090.jpeg',
  '/uploads/file-1792732582606-859267267.jpeg',
  '/uploads/file-1792732586609-326430605.jpeg',
  '/uploads/file-1792732437643-265801008.jpg',
  '/uploads/file-1792732452479-789684763.webp',
  '/uploads/file-1792732457560-838091110.webp',
  '/uploads/file-1792732462379-215120155.jpeg',
  '/uploads/file-1792732466780-532158529.jpeg',
  '/uploads/file-1792732044713-605530659.jpg',
  '/uploads/file-1792730854081-191968508.jpg',
  '/uploads/file-1792730859362-124280831.jpg',
  '/uploads/file-1792730818328-114393804.jpg'
];

export default function AboutUsPage({
  onNavigateHome,
  onNavigateShop,
  onNavigateContact,
  brandName = 'Leaf Curt',
  products = []
}: AboutUsPageProps) {

  // Dynamic real product random images for each section of about page
  const sectionImages = useMemo(() => {
    const pool: string[] = [];
    if (products && products.length > 0) {
      products.forEach(p => {
        if (p.image && !pool.includes(p.image)) pool.push(p.image);
        (p.images || []).forEach(img => {
          if (img && !pool.includes(img)) pool.push(img);
        });
      });
    }

    DEFAULT_REAL_PRODUCT_IMAGES.forEach(img => {
      if (!pool.includes(img)) pool.push(img);
    });

    // Random shuffle so each section gets a distinct real product image
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return {
      hero: shuffled[0] || pool[0],
      story: shuffled[1] || pool[1],
      howToUse: shuffled[2] || pool[2],
      promise: shuffled[3] || pool[3],
      beyond: shuffled[4] || pool[4],
      advantages: shuffled[5] || pool[5],
    };
  }, [products]);

  return (
    <div className="bg-white text-slate-800 font-sans animate-fadeIn">
      
      {/* ============================================================
          ১. হিরো সেকশন (HERO SECTION - 100% Bangla + Real Product Image)
          ============================================================ */}
      <section className="py-12 sm:py-20 lg:py-24 bg-[#f8fafc] border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Column: Heading & Narrative in Bangla */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-[#0279c7] text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{brandName} পরিচিতি</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#033b75] tracking-tight leading-[1.2]">
                স্মার্ট লন্ড্রি সমাধান।<br />
                <span className="text-[#0279c7]">সহজ ও স্বাচ্ছন্দ্যময় জীবন।</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl font-normal">
                {brandName} নিয়ে এসেছে আধুনিক প্রজন্মের লন্ড্রি ও হাইজিন সল্যুশন, যা ব্যস্ত দৈনন্দিন জীবনের কাপড় ধোয়াকে করে তোলে আরও সহজ, পরিচ্ছন্ন ও ঝামেলামুক্ত। কোনো মেপে গুঁড়ো সাবান ঢালার ঝামেলা ছাড়াই নিশ্চিত করুন নিখুঁত পরিচ্ছন্নতা ও মনোমুগ্ধকর সতেজ সুবাস।
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('about-story-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-7 py-3.5 rounded-full bg-[#0279c7] hover:bg-[#0269ad] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  আমাদের গল্প জানুন
                </button>
                <button
                  type="button"
                  onClick={onNavigateShop}
                  className="px-7 py-3.5 rounded-full bg-white hover:bg-slate-50 text-[#033b75] border border-slate-200 text-sm font-bold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <span>পণ্যসমূহ দেখুন</span>
                  <ArrowRight className="w-4 h-4 text-[#0279c7]" />
                </button>
              </div>

              {/* Breadcrumb */}
              <nav className="pt-4 flex items-center gap-2 text-xs font-medium text-slate-400">
                <button onClick={onNavigateHome} className="hover:text-[#0279c7] transition cursor-pointer">হোম</button>
                <span>›</span>
                <span className="text-slate-700 font-semibold">আমাদের সম্পর্কে</span>
              </nav>
            </div>

            {/* Right Column: Hero Real Product Visual */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 bg-white group p-3 sm:p-4">
                <div className="rounded-2xl overflow-hidden bg-slate-50 relative aspect-4/3 flex items-center justify-center">
                  <img
                    src={sectionImages.hero}
                    alt={`${brandName} আসল পণ্য`}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-md border border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#033b75] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#0279c7]" />
                      ১০০% প্রিমিয়াম ফর্মুলা
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      ৫-ইন-১ মাল্টি-অ্যাকশন
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================
          ২. ৫-ইন-১ অ্যাডভান্সড ফর্মুলা (Core Benefits in Bangla)
          ============================================================ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#0279c7]">
              ৫-ইন-১ অ্যাডভান্সড ফর্মুলা
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#033b75] tracking-tight">
              🧺✨ এক পণ্যেই ৫টি শক্তিশালী সুবিধা!
            </h2>
            <p className="text-sm sm:text-base text-slate-500 font-medium">
              ডিটারজেন্ট + ব্যাকটেরিয়া ও মাইট অপসারণ + সফটেনার + দীর্ঘস্থায়ী সুবাস + ব্লেন্ডেড এনজাইম
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            
            {/* ১. ডিটারজেন্ট */}
            <div className="bg-[#f8fafc] rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition-shadow space-y-3 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-sky-100/70 text-[#0279c7] flex items-center justify-center text-2xl shadow-inner">
                🫧
              </div>
              <h3 className="font-bold text-base text-slate-900">ডিটারজেন্ট</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                কঠিন ময়লা ও জেদি দাগ পরিষ্কারে অত্যন্ত কার্যকর।
              </p>
              <span className="text-[11px] font-semibold text-[#0279c7] mt-auto">শক্তিশালী পরিষ্কার</span>
            </div>

            {/* ২. ব্যাকটেরিয়া ও জীবাণু ধ্বংস */}
            <div className="bg-[#f8fafc] rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition-shadow space-y-3 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center text-2xl shadow-inner">
                🛡️
              </div>
              <h3 className="font-bold text-base text-slate-900">জীবাণুনাশক</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                ব্যাকটেরিয়া, ক্ষতিকর জীবাণু ও ডাস্ট-মাইট অপসারণে সহায়ক।
              </p>
              <span className="text-[11px] font-semibold text-emerald-600 mt-auto">উন্নত হাইজিন</span>
            </div>

            {/* ৩. সফটেনার */}
            <div className="bg-[#f8fafc] rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition-shadow space-y-3 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-pink-100/70 text-pink-600 flex items-center justify-center text-2xl shadow-inner">
                🌸
              </div>
              <h3 className="font-bold text-base text-slate-900">ফ্যাব্রিক সফটেনার</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                কাপড়কে করে তোলে অতিরিক্ত কোমল, তুলতুলে ও আরামদায়ক।
              </p>
              <span className="text-[11px] font-semibold text-pink-600 mt-auto">কোমল যত্ন</span>
            </div>

            {/* ৪. দীর্ঘস্থায়ী সুবাস */}
            <div className="bg-[#f8fafc] rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition-shadow space-y-3 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-100/70 text-purple-600 flex items-center justify-center text-2xl shadow-inner">
                🌺
              </div>
              <h3 className="font-bold text-base text-slate-900">দীর্ঘস্থায়ী সুবাস</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                কাপড়ে রাখে দিনব্যাপী মনমাতানো সতেজ প্রিমিয়াম সুবাস।
              </p>
              <span className="text-[11px] font-semibold text-purple-600 mt-auto">সতেজ সুবাস</span>
            </div>

            {/* ৫. ব্লেন্ডেড এনজাইম */}
            <div className="bg-[#f8fafc] rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition-shadow space-y-3 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-100/70 text-amber-600 flex items-center justify-center text-2xl shadow-inner">
                🧬
              </div>
              <h3 className="font-bold text-base text-slate-900">ব্লেন্ডেড এনজাইম</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                তন্তুর গভীরে প্রবেশ করে বিভিন্ন ধরনের দাগ ও তেল আলগা করে।
              </p>
              <span className="text-[11px] font-semibold text-amber-600 mt-auto">বায়ো-এনজাইম টেক</span>
            </div>

          </div>

          <div className="mt-10 p-5 rounded-2xl bg-sky-50/70 border border-sky-100 text-center max-w-2xl mx-auto shadow-xs">
            <p className="text-sm sm:text-base font-bold text-[#033b75]">
              💎 পরিষ্কার কাপড়, কোমল অনুভূতি, দীর্ঘস্থায়ী সুগন্ধ—সব একসাথে!
            </p>
          </div>

        </div>
      </section>

      {/* ============================================================
          ৩. আমাদের গল্প সেকশন (OUR STORY - Bangla + Real Product Image)
          ============================================================ */}
      <section id="about-story-section" className="py-16 sm:py-24 bg-[#fafbfc] border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left: Narrative & 3 Focus Areas */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#0279c7]">
                  আমাদের গল্প
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#033b75] tracking-tight leading-tight">
                  {brandName}-এর সৃষ্টি যেভাবে
                </h2>
                <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                  🧺✨ কঠিন লন্ড্রি সমস্যার আধুনিক ও স্মার্ট সমাধান!
                </h3>
              </div>

              <div className="space-y-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                <p>
                  <strong className="text-slate-900">{brandName}</strong>-এ আমরা একদল উদ্ভাবনী তরুণ কাজ করছি একটি অভিন্ন লক্ষ্য নিয়ে — প্রতিদিনের কাপড় ধোয়ার অভিজ্ঞতাকে পুরোপুরি নতুন রূপ দেওয়া।
                </p>
                <p>
                  আমরা লক্ষ্য করেছি, আমাদের প্রতিদিনের অপরিহার্য কাজ হওয়া সত্ত্বেও দশকের পর দশক ধরে লন্ড্রি পদ্ধতি ছিল একই রকম—মেপে গুঁড়ো সাবান ঢালা, অপচয়, অসমান ফেনা এবং মেঝের অপরিচ্ছন্নতা। আমরা এই সনাতন পদ্ধতির পরিবর্তন ঘটিয়ে আধুনিক, পরিচ্ছন্ন ও সাশ্রয়ী সল্যুশন তৈরি করতে {brandName} প্রতিষ্ঠা করি।
                </p>
                <p className="p-4 bg-white rounded-xl border border-slate-200/80 text-slate-700 italic font-medium shadow-2xs">
                  &ldquo;ঘামের দুর্গন্ধ হোক কিংবা খাবারের কঠিন দাগ—কাপড়ের প্রতিটি সমস্যার সমাধানে আমাদের আধুনিক ফর্মুলা। কাপড় হবে ঝকঝকে পরিষ্কার, সতেজ ও সুগন্ধিময়! 🌸&rdquo;
                </p>
              </div>

              {/* 3 Pillars in Bangla */}
              <div className="space-y-4 pt-2">
                
                {/* ১. দুর্গন্ধ প্রতিরোধ */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-lg">
                    🌿
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">
                      দুর্গন্ধকে বলুন চিরতরে বিদায়!
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      আমাদের উন্নত Odor-Fighting Technology কাপড়ের দুর্গন্ধের মূল কারণের বিরুদ্ধে কাজ করে। ফলে কাপড় থাকে দীর্ঘক্ষণ সতেজ, পরিষ্কার ও দুর্গন্ধমুক্ত।
                    </p>
                  </div>
                </div>

                {/* ২. দ্রুত দাগ অপসারণ */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0279c7] flex items-center justify-center shrink-0 font-bold text-lg">
                    ✨
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">
                      কঠিন দাগ দূর করুন নিমিষেই!
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      ৫ ধরনের বিশেষায়িত বায়ো-এনজাইমের শক্তিশালী সমন্বয় কাপড়ের তন্তুর গভীরে গিয়ে কঠিন ময়লা ও জেদি দাগ দ্রুত আলগা করে পরিষ্কার করে।
                    </p>
                  </div>
                </div>

                {/* ৩. পরিবেশবান্ধব পরিষ্কার */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 font-bold text-lg">
                    💧
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">
                      কম পানিতে বেশি পরিষ্কার (পরিবেশবান্ধব)
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      আমাদের সুপার-কনসেন্ট্রেটেড ফর্মুলা কম পানিতেই সর্বোচ্চ পরিষ্কার নিশ্চিত করে—ফলে পানির অপচয় কমে এবং পরিবেশ সুরক্ষিত থাকে। 🌎
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Right: Story Real Product Visual */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-white p-3 sm:p-4 group">
                <div className="rounded-2xl overflow-hidden bg-slate-50 relative aspect-4/3 flex items-center justify-center">
                  <img
                    src={sectionImages.story}
                    alt={`${brandName} আসল প্রোডাক্ট`}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-3 left-3 bg-[#033b75]/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md">
                    🍃 ইকো-ফ্রেন্ডলি ও নিরাপদ
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================
          ৪. আমাদের মিশন সেকশন (OUR MISSION - Bangla 3 Cards)
          ============================================================ */}
      <section className="py-20 sm:py-28 bg-[#f0f7fb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#0279c7]">
              আমাদের মিশন ও লক্ষ্য
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#033b75] tracking-tight">
              উদ্ভাবনী ভাবনায় আধুনিক পরিচ্ছন্নতা
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
              আমাদের লক্ষ্য হলো স্মার্ট, পরিবেশবান্ধব ও সাশ্রয়ী পণ্যের মাধ্যমে বাংলাদেশের প্রতিটি ঘরের কাপড় ধোয়ার প্রক্রিয়াকে ঝামেলামুক্ত করা। উন্নত লন্ড্রি পড প্রযুক্তির মাধ্যমে আমরা নিশ্চিত করি সঠিক পরিমাণ ডিটারজেন্ট, উচ্চ কার্যক্ষমতা এবং আরামদায়ক অভিজ্ঞতা।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 01 */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xs border border-slate-200/70 hover:shadow-lg transition-all space-y-4">
              <span className="text-sm font-bold text-[#0279c7]">০১</span>
              <h3 className="text-2xl font-bold text-[#033b75]">স্মার্ট সমাধান</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                কোনো গুঁড়ো সাবান মাপা বা তরল সাবান ঢালার ঝামেলা নেই। ড্রামে সরাসরি ১টি পড দিলেই আপনার লন্ড্রি রেডি।
              </p>
            </div>

            {/* Card 02 */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xs border border-slate-200/70 hover:shadow-lg transition-all space-y-4">
              <span className="text-sm font-bold text-[#0279c7]">০২</span>
              <h3 className="text-2xl font-bold text-[#033b75]">নিখুঁত পরিচ্ছন্নতা</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                লো-ফোম উন্নত প্রযুক্তির কারণে ধোয়ার পর কাপড়ে কোনো প্রকার সাবানের আস্তরণ বা সাদা দাগ অবশিষ্ট থাকে না।
              </p>
            </div>

            {/* Card 03 */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xs border border-slate-200/70 hover:shadow-lg transition-all space-y-4">
              <span className="text-sm font-bold text-[#0279c7]">০৩</span>
              <h3 className="text-2xl font-bold text-[#033b75]">সর্বোচ্চ সাশ্রয়ী</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                সুনির্দিষ্ট ডোজিংয়ের কারণে অতিরিক্ত ডিটারজেন্টের অপচয় শূন্যে নেমে আসে এবং কাপড় দীর্ঘদিন টেকসই থাকে।
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ============================================================
          ৫. পণ্যের বিশেষ সুবিধাসমূহ (6 UNBEATABLE ADVANTAGES in Bangla)
          ============================================================ */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#0279c7]">
              বিশেষ সুবিধাসমূহ
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#033b75] tracking-tight">
              💎 আমাদের পণ্যের ৬টি অদ্বিতীয় সুবিধা
            </h2>
            <p className="text-sm sm:text-base text-slate-500 font-medium">
              পরিচ্ছন্ন, স্বাস্থ্যকর ও নিরাপদ আগামীর জন্য প্রিমিয়াম কেয়ার
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            
            {/* ১. উন্নত হাইজিন */}
            <div className="p-7 rounded-2xl bg-[#fafbfc] border border-slate-200/80 shadow-2xs hover:border-[#0279c7]/40 hover:shadow-md transition-all space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-[#0279c7] flex items-center justify-center text-lg">
                  🛡️
                </div>
                <h3 className="text-base font-bold text-slate-900">১. উন্নত হাইজিন</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                কাপড়ে জমে থাকা ব্যাক্টেরিয়া ও ক্ষতিকর জীবাণু অপসারণের অনন্য কার্যকারিতা, যা প্রতিদিন স্বাস্থ্যকর লন্ড্রি নিশ্চিত করে।
              </p>
              <p className="text-[11px] text-slate-400 italic">
                জীবাণু ও ডাস্ট-মাইট থেকে পরিবারের সুরক্ষা।
              </p>
            </div>

            {/* ২. গভীর পরিষ্কার, কাপড়ে কোমল */}
            <div className="p-7 rounded-2xl bg-[#fafbfc] border border-slate-200/80 shadow-2xs hover:border-[#0279c7]/40 hover:shadow-md transition-all space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg">
                  🌱
                </div>
                <h3 className="text-base font-bold text-slate-900">২. গভীর পরিষ্কার, কাপড়ে কোমল</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                একাধিক প্রাকৃতিক বায়ো-এনজাইম কাপড়ের তন্তুর গভীরে গিয়ে ময়লা ও দাগ দূর করে, কাপড়ের আসল মান ও রঙ ঠিক রেখে।
              </p>
              <p className="text-[11px] text-slate-400 italic">
                সুতা ও ফেব্রিকের ক্ষতি না করে কার্যকর ওয়াশ।
              </p>
            </div>

            {/* ৩. পরিষ্কার ও নিরাপদ ফর্মুলা */}
            <div className="p-7 rounded-2xl bg-[#fafbfc] border border-slate-200/80 shadow-2xs hover:border-[#0279c7]/40 hover:shadow-md transition-all space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-lg">
                  🧪
                </div>
                <h3 className="text-base font-bold text-slate-900">৩. পরিষ্কার ও নিরাপদ ফর্মুলা</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Fluorescent Brightener, ফসফরাস ও ক্ষতিকর ব্লিচিং এজেন্ট মুক্ত—কাপড়ে কোনো ক্ষতিকর রাসায়নিক অবশিষ্টাংশ নেই।
              </p>
              <p className="text-[11px] text-slate-400 italic">
                পরিবেশ ও স্বাস্থ্যের জন্য নিরাপদ প্রযুক্তি।
              </p>
            </div>

            {/* ৪. ত্বকবান্ধব */}
            <div className="p-7 rounded-2xl bg-[#fafbfc] border border-slate-200/80 shadow-2xs hover:border-[#0279c7]/40 hover:shadow-md transition-all space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-lg">
                  🤍
                </div>
                <h3 className="text-base font-bold text-slate-900">৪. ত্বকবান্ধব ও নিরাপদ</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Neutral pH ফর্মুলা হওয়ায় হাতে অত্যন্ত মৃদু এবং সংবেদনশীল বা সেনসিটিভ ত্বকের জন্যও সম্পূর্ণ আরামদায়ক।
              </p>
              <p className="text-[11px] text-slate-400 italic">
                পরিবার ও বাচ্চাদের কাপড়ে নিশ্চিন্তে ব্যবহারযোগ্য।
              </p>
            </div>

            {/* ৫. সহজে ধুয়ে যায় */}
            <div className="p-7 rounded-2xl bg-[#fafbfc] border border-slate-200/80 shadow-2xs hover:border-[#0279c7]/40 hover:shadow-md transition-all space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center text-lg">
                  💦
                </div>
                <h3 className="text-base font-bold text-slate-900">৫. সহজে ধুয়ে যায়</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                কম-ফোম ফর্মুলা খুব দ্রুত ধুয়ে যায় এবং কাপড়ে অতিরিক্ত সাবানের পিচ্ছিল আস্তরণ জমতে দেয় না। সময় ও পানি দুটোই বাঁচে।
              </p>
              <p className="text-[11px] text-slate-400 italic">
                ঝামেলাহীন রিন্স ও পানির অপচয় হ্রাস।
              </p>
            </div>

            {/* ৬. শক্ত ও টেকসই ডিজাইন */}
            <div className="p-7 rounded-2xl bg-[#fafbfc] border border-slate-200/80 shadow-2xs hover:border-[#0279c7]/40 hover:shadow-md transition-all space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-lg">
                  📦
                </div>
                <h3 className="text-base font-bold text-slate-900">৬. শক্ত ও টেকসই ডিজাইন</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                ৬০০ নিউটন (600N) পর্যন্ত বাহ্যিক চাপ সহনশীল, তাই পরিবহন ও সংরক্ষণের সময় পণ্যের গুণমান ও অখণ্ডতা বজায় থাকে।
              </p>
              <p className="text-[11px] text-slate-400 italic">
                চাপ লেগে পড ফেটে যাওয়ার ভয় নেই।
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ============================================================
          ৬. ব্যবহার বিধি সেকশন (HOW TO USE - Bangla 3 Steps + Real Product Image)
          ============================================================ */}
      <section className="py-16 sm:py-20 bg-[#f8fafc] border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#0279c7]">
              ব্যবহার বিধি
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#033b75] tracking-tight">
              সহজ ৩ ধাপে কাপড় পরিষ্কার
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              লন্ড্রি পডস ব্যবহার করা অত্যন্ত সহজ, দ্রুত ও সময়সাশ্রয়ী
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left 3 Step Cards */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Step 1 */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex items-start gap-4 hover:border-[#0279c7]/50 transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#0279c7] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                  ১
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-900 mb-1">
                    ড্রামে পড রাখুন
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    প্রথমে খালি ওয়াশিং মেশিনের ড্রামের নিচে ১টি লন্ড্রি পড সরাসরি রাখুন। (পড কাটার বা খোলার কোনো প্রয়োজন নেই, পানির সংস্পর্শে এটি নিজে থেকেই সম্পূর্ণ গলে যাবে)।
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex items-start gap-4 hover:border-[#0279c7]/50 transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#0279c7] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                  ২
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-900 mb-1">
                    কাপড় লোড করুন
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    পডের উপরে আপনার ময়লা কাপড়গুলো ড্রামে দিয়ে দিন। অতিরিক্ত কাপড় ঠাসাঠাসি না করে স্বাভাবিক নিয়মে লোড করুন।
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex items-start gap-4 hover:border-[#0279c7]/50 transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                  ৩
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-900 mb-1">
                    মেশিন চালু করুন
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    স্বাভাবিক ওয়াশ সাইকেল নির্বাচন করে স্টার্ট বাটন প্রেস করুন। স্বয়ংক্রিয়ভাবে ঝকঝকে ও সুগন্ধিময় কাপড় প্রস্তুত হয়ে যাবে!
                  </p>
                </div>
              </div>

            </div>

            {/* Right: Real Product Visual for How to Use */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-white p-3 sm:p-4 group">
                <div className="rounded-2xl overflow-hidden bg-slate-50 relative aspect-4/3 flex items-center justify-center">
                  <img
                    src={sectionImages.howToUse}
                    alt="লন্ড্রি পডস ব্যবহার বিধি"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute bottom-3 left-3 bg-[#033b75]/95 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-300" />
                    মাত্র ৩ সেকেন্ডে প্রস্তুত!
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ============================================================
          ৭. আমাদের প্রতিশ্রুতি (OUR PROMISE - Rich Dark Navy Card in Bangla)
          ============================================================ */}
      <section className="py-16 sm:py-24 bg-[#033b75] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Narrative */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-extrabold uppercase tracking-wider text-sky-300">
                আমাদের প্রতিশ্রুতি
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                প্রতিদিনের জীবনে সেরা মানের নিশ্চয়তা
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-blue-100 leading-relaxed font-normal">
                <p>
                  {brandName}-এর প্রতিটি পণ্য তৈরির পেছনে রয়েছে একটাই উদ্দেশ্য — আপনার প্রতিদিনের কাপড় পরিষ্কারের কাজকে আরও সহজ, পরিচ্ছন্ন ও সাশ্রয়ী করে তোলা।
                </p>
                <p>
                  আমরা পণ্যের ফর্মুলেশন থেকে শুরু করে প্যাকেজিং পর্যন্ত অপ্রয়োজনীয় জটিলতা বাদ দিয়ে আধুনিক ল্যাবরেটরি-টেস্টেড উপাদানের সঠিক ব্যবহারের মাধ্যমে এমন সমাধান তৈরি করেছি যা আপনার কাপড়কে রাখে নতুনের মতো উজ্জ্বল।
                </p>
                <div className="p-4 rounded-xl bg-white/10 border border-white/20 text-white font-medium text-sm sm:text-base">
                  🫧 পরিষ্কার কাপড়, সতেজ অনুভূতি, আরও সহজ লন্ড্রি! একটি স্মার্ট সমাধান—আপনার প্রতিদিনের কাপড় পরিষ্কারের জন্য। ✨
                </div>
              </div>
            </div>

            {/* Right Visual: Real Product Photo */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/15 bg-white/5 p-3 group">
                <div className="rounded-2xl overflow-hidden relative aspect-4/3 flex items-center justify-center">
                  <img
                    src={sectionImages.promise}
                    alt="আমাদের প্রতিশ্রুতি"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-[#033b75] text-[11px] font-extrabold px-3 py-1 rounded-full shadow-md">
                    ★ প্রিমিয়াম কোয়ালিটি
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================
          ৮. আমাদের বিশ্বাস (WHAT WE BELIEVE in Bangla)
          ============================================================ */}
      <section className="py-20 sm:py-28 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-8">
          
          <div className="text-center space-y-4 mb-16 sm:mb-20">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#0279c7]">
              আমাদের বিশ্বাস
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#033b75] tracking-tight leading-snug">
              আমরা বিশ্বাস করি আধুনিক জীবনযাত্রা হবে সহজ, নির্ভরযোগ্য ও গুণগত মানে আপসহীন
            </h2>
            <p className="text-sm sm:text-base text-slate-500 font-medium">
              এবং এটিই আমাদের প্রতিটি পণ্যের মূল প্রেরণা ও ভিত্তি
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
            
            <div className="pt-6 border-t-2 border-[#0279c7] space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0279c7]">
                সহজ ও ঝামেলামুক্ত
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                দৈনন্দিন ঘরের কাজকে সহজ ও সময়সাশ্রয়ী করার লক্ষ্যে প্রতিটি ডিজাইন তৈরি করা হয়েছে।
              </p>
            </div>

            <div className="pt-6 border-t-2 border-[#0279c7] space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0279c7]">
                আধুনিক উদ্ভাবন
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                বাস্তব জীবনের প্রয়োজনের ওপর ভিত্তি করে আধুনিক ল্যাব-টেস্টেড ফর্মুলা প্রস্তুত করা হয়।
              </p>
            </div>

            <div className="pt-6 border-t-2 border-[#0279c7] space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0279c7]">
                আপসহীন গুণগত মান
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                গ্রাহকের সর্বোচ্চ সন্তুষ্টি ও কাপড়ের দীর্ঘস্থায়িত্বের নিশ্চয়তা দিতে প্রিমিয়াম উপাদান ব্যবহার করা হয়।
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ============================================================
          ৯. লন্ড্রির সীমানা ছাড়িয়ে ও কল-টু-অ্যাকশন (BEYOND LAUNDRY - Bangla)
          ============================================================ */}
      <section className="py-16 sm:py-24 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Image: Real Product Image */}
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-white p-3 sm:p-4 group">
                <div className="rounded-2xl overflow-hidden bg-slate-50 relative aspect-4/3 flex items-center justify-center">
                  <img
                    src={sectionImages.beyond}
                    alt={`${brandName} এর বিস্তৃত পণ্য`}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute bottom-3 left-3 bg-[#033b75]/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md">
                    ✨ ভবিষ্যৎমুখী পরিচ্ছন্নতা
                  </div>
                </div>
              </div>
            </div>

            {/* Right Narrative */}
            <div className="lg:col-span-7 order-1 lg:order-2 space-y-6">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#0279c7]">
                ভবিষ্যতের ভাবনা
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-[#033b75] tracking-tight">
                লন্ড্রির সীমানা ছাড়িয়ে সমগ্র হাইজিন সমাধান
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                <p className="font-semibold text-slate-800">
                  আমাদের স্বপ্ন শুধু কাপড় ধোয়ার মধ্যেই সীমাবদ্ধ নয়।
                </p>
                <p>
                  আমরা <strong className="text-slate-900">{brandName}</strong>-কে এমন একটি ভবিষ্যৎমুখী ব্র্যান্ড হিসেবে গড়ে তুলছি যা মানুষের ব্যক্তিগত ও পারিবারিক পরিচ্ছন্নতার প্রতিটি ক্ষেত্রে নির্ভরযোগ্য ভূমিকা রাখবে। ফেব্রিক কেয়ার থেকে শুরু করে পরিবারের প্রতিটি স্বাস্থ্যসম্মত ক্লিনিং চাহিদায় আমরা মানসম্মত, নির্ভরযোগ্য ও উদ্ভাবনী সমাধান পৌঁছে দিতে প্রতিশ্রুতিবদ্ধ।
                </p>
              </div>

              <div className="pt-4 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={onNavigateShop}
                  className="px-8 py-3.5 rounded-full bg-[#0279c7] hover:bg-[#0269ad] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <span>লন্ড্রি পডস অর্ডার করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onNavigateContact}
                  className="px-8 py-3.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-sm font-bold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  যোগাযোগ করুন
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
