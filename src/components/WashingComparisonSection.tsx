import React, { useState } from 'react';
import { 
  CheckCircle2, XCircle, AlertTriangle, Sparkles, 
  ShieldCheck, Zap, Award 
} from 'lucide-react';

interface ComparisonFeature {
  id: string;
  feature: string;
  bengaliFeature: string;
  description: string;
  pods: {
    bengaliValue: string;
    subtext: string;
  };
  powder: {
    bengaliValue: string;
    subtext: string;
  };
  liquid: {
    bengaliValue: string;
    subtext: string;
  };
}

const COMPARISON_FEATURES: ComparisonFeature[] = [
  {
    id: 'machine-safety',
    feature: 'Drum & Pipe Health',
    bengaliFeature: 'মেশিনের ড্রাম ও পাইপ নিরাপত্তা',
    description: 'Impact on washing machine lifespan and internal sludge buildup.',
    pods: {
      bengaliValue: '১০০% সম্পূর্ণ গলে যায়',
      subtext: 'জিরো তলানি, পাইপ ও পাম্প থাকে শতভাগ সুরক্ষিত ও পরিষ্কার।'
    },
    powder: {
      bengaliValue: 'পাথুরে তলানি জমে ড্রামে',
      subtext: 'ড্রেনের পাইপে চকের মতো শক্ত ময়লা জমে ড্রাম জ্যাম করে।'
    },
    liquid: {
      bengaliValue: 'আঠালো ময়লা ও দুর্গন্ধ',
      subtext: 'ডিসপেনসারে চটচটে ভাব ও কালো ছত্রাকের মতো আঠা জমায়।'
    }
  },
  {
    id: 'stain-power',
    feature: '5-in-1 Active Cleaning Power',
    bengaliFeature: 'দাগ তোলার ক্ষমতা (৫-ইন-১ ফর্মুলা)',
    description: 'Enzyme active technology targeting oils, mud, curry, and sweat.',
    pods: {
      bengaliValue: 'আল্ট্রা-কনসেনট্রেটেড এনজাইম',
      subtext: 'ডিটারজেন্ট + দাগ তোলা + সফটনার + রঙ সুরক্ষা + পারফিউম।'
    },
    powder: {
      bengaliValue: 'দুর্বল (আলাদা ঘষা লাগে)',
      subtext: '৫০-৬০% সাধারণ ফিলার লবণ; তেল ও চর্বির দাগে অকার্যকর।'
    },
    liquid: {
      bengaliValue: 'মাঝারি (৮০% পানি মেশানো)',
      subtext: 'অধিকাংশ তরল ডিটারজেন্টে ৭০-৮০% পানি থাকায় এনজাইম দুর্বল।'
    }
  },
  {
    id: 'residue-on-clothes',
    feature: 'White Residue on Dark Clothes',
    bengaliFeature: 'কালো কাপড়ে সাদা দাগ বা ছোপ',
    description: 'Unwashed powder particles remaining on abayas, suits, and dark shirts.',
    pods: {
      bengaliValue: 'কখনোই কোনো সাদা ছোপ পড়ে না',
      subtext: 'ঠান্ডা বা গরম পানিতে সম্পূর্ণ বিলীন হয়ে কাপড়ে কোনো দাগ রাখে না।'
    },
    powder: {
      bengaliValue: 'সাদা ছোপ পড়ে থাকে',
      subtext: 'কালো কাপড় ও আবায়ায় সাদা পাউডার আটকে ২-৩ বার ধুতে হয়।'
    },
    liquid: {
      bengaliValue: 'সাবানের পিচ্ছিল ভাব থাকে',
      subtext: 'অতিরিক্ত পানি না চালালে কাপড়ে আঠালো পিচ্ছিল কোটিং রয়ে যায়।'
    }
  },
  {
    id: 'convenience-mess',
    feature: 'Convenience & Mess-Free Handling',
    bengaliFeature: 'ব্যবহারের সহজতা ও পরিচ্ছন্নতা',
    description: 'Time spent scooping, measuring, and wiping dripping detergent caps.',
    pods: {
      bengaliValue: '১ সেকেন্ডে ড্রপ & গো',
      subtext: '১টি পড সরাসরি ড্রামে ফেলে দিন। হাত মেখে যাওয়ার কোনো ঝামেলা নেই।'
    },
    powder: {
      bengaliValue: 'পাউডার ওড়ে, ফ্লোরে পড়ে',
      subtext: 'চামচ দিয়ে মাপার সময় মেঝে নোংরা হয়, ডাস্ট নাকে ঢুকে।'
    },
    liquid: {
      bengaliValue: 'ক্যাপ বেয়ে আঠা গড়ায়',
      subtext: 'বোতলের গা বেয়ে চটচটে লিকুইড গড়িয়ে তাক ও হাত আঠালো হয়।'
    }
  },
  {
    id: 'fabric-care',
    feature: 'Color Lock & Fabric Softness',
    bengaliFeature: 'রঙ সংরক্ষণ ও কাপড়ের কোমলতা',
    description: 'Protection against fading, shrinking, and rough fiber wear.',
    pods: {
      bengaliValue: 'বিল্ট-ইন কমফোর্ট ও রঙ সুরক্ষা',
      subtext: 'নিউট্রাল পিএইচ কাপড় মসৃণ রাখে, ১০০ ধোয়াতেও রঙ বিবর্ণ হয় না।'
    },
    powder: {
      bengaliValue: 'কয়েক ধোয়াতেই রঙ জ্বলে যায়',
      subtext: 'কড়া ক্ষার কাপড়ের সুতা দুর্বল করে এবং কাপড় খসখসে বানিয়ে ফেলে।'
    },
    liquid: {
      bengaliValue: 'আলাদা সফটনার কেনা লাগে',
      subtext: 'কাপড় নরম রাখার উপাদান না থাকায় অতিরিক্ত খরচ করে কমফোর্ট লাগে।'
    }
  },
  {
    id: 'scent-longevity',
    feature: 'Fragrance & Scent Longevity',
    bengaliFeature: 'সুগন্ধির স্থায়িত্ব (Scent Beads)',
    description: 'How long clothes stay smelling freshly washed in cupboards.',
    pods: {
      bengaliValue: '৩০ দিন পর্যন্ত প্রিমিয়াম সুবাস',
      subtext: 'মাইক্রো-ক্যাপসুল সুগন্ধি কাপড় পরলে স্পর্শের সাথে সাথে মিষ্টি সুবাস ছড়ায়।'
    },
    powder: {
      bengaliValue: 'শুকানোর পরেই গন্ধ উবে যায়',
      subtext: 'কৃত্রিম ঝাঁঝালো গন্ধ, কাপড় শুকানোর পরেই বন্ধ হয়ে দুর্গন্ধ ধরে।'
    },
    liquid: {
      bengaliValue: 'খুবই হালকা, ১ দিনে শেষ',
      subtext: 'হালকা সুবাস যা ধোয়ার পানির সাথেই ড্রেনে চলে যায়।'
    }
  },
  {
    id: 'overdose-waste',
    feature: 'Accidental Overdose & Money Waste',
    bengaliFeature: 'বেশি ঢেলে টাকার অপচয়',
    description: 'Pre-dosed exact ratios vs accidental excessive pouring.',
    pods: {
      bengaliValue: 'জিরো অপচয় (১ পড = ১ ওয়াশ)',
      subtext: 'ল্যাবে নিখুঁতভাবে পরিমাপ করা। অতিরিক্ত ঢালার কোনো সুযোগ নেই।'
    },
    powder: {
      bengaliValue: '৩৫% পাউডার অপচয় হয়',
      subtext: 'ভালো পরিষ্কারের আশায় অনেকেই প্রয়োজনের দ্বিগুণ চামচ ঢেলে দেন।'
    },
    liquid: {
      bengaliValue: '৪০% লিকুইড বেশি অপচয়',
      subtext: 'ক্যাপের মাপ অস্পষ্ট থাকায় অল্প কয়দিনেই পুরো বোতল শেষ হয়ে যায়।'
    }
  }
];

interface WashingComparisonSectionProps {
  onNavigateShop?: () => void;
  brandName?: string;
}

export default function WashingComparisonSection({ 
  onNavigateShop, 
  brandName = 'Leaf Curt' 
}: WashingComparisonSectionProps) {
  const [activeMobileView, setActiveMobileView] = useState<'all' | 'vs-powder' | 'vs-liquid'>('all');

  const displayBrand = brandName.toLowerCase().includes('leaf') 
    ? 'Leaf Curt' 
    : (brandName.replace(/^www\./i, '').replace(/\.(com|org|net|bd).*$/i, '').trim() || 'Leaf Curt');

  return (
    <section className="relative pt-4 pb-6 sm:pt-6 sm:pb-8 lg:pt-6 lg:pb-8 bg-gradient-to-b from-white via-slate-50/70 to-[#f8fbfd] border-b border-slate-200/80 overflow-hidden">
      {/* Ambient Background Decorative Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-sky-200/25 via-emerald-100/25 to-purple-200/20 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-4 sm:mb-6">
          <div className="inline-block relative">
            <h2 className="font-sans text-2xl sm:text-3xl lg:text-4xl text-slate-900 font-bold tracking-tight pb-1">
              Why Use These Laundry Pods?
            </h2>
            {/* Hand-drawn colorful curved underline */}
            <svg 
              className="w-full h-3.5 sm:h-5 max-w-[260px] sm:max-w-[320px] mx-auto mt-0.5 overflow-visible" 
              viewBox="0 0 250 20" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="whyPodsCurveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="25%" stopColor="#06b6d4" />
                  <stop offset="55%" stopColor="#8b5cf6" />
                  <stop offset="80%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                <filter id="curveSoftGlowWhyPods" x="-10%" y="-10%" width="120%" height="120%">
                  <feGaussianBlur stdDeviation="1.5" result="glow" />
                  <feComposite in="SourceGraphic" in2="glow" operator="over" />
                </filter>
              </defs>
              {/* Playful, organic hand-drawn curved stroke */}
              <path 
                d="M6 13 C 48 4, 96 16, 146 9 C 184 3.5, 218 7, 244 11" 
                stroke="url(#whyPodsCurveGradient)" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                filter="url(#curveSoftGlowWhyPods)"
              />
              <path 
                d="M18 16 C 62 8, 112 17, 162 11 C 196 6.5, 222 9, 238 12" 
                stroke="url(#whyPodsCurveGradient)" 
                strokeWidth="1.8" 
                strokeLinecap="round" 
                opacity="0.85"
              />
            </svg>
          </div>

          {/* Quick Filter Toggle for Mobile Screens */}
          <div className="flex md:hidden items-center justify-center pt-3 sm:pt-4">
            <div className="inline-flex p-0.5 bg-slate-200/80 rounded-full border border-slate-300/60 shadow-inner text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setActiveMobileView('all')}
                className={`px-3 py-1 rounded-full transition-all ${
                  activeMobileView === 'all' 
                    ? 'bg-white text-slate-900 shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All 3
              </button>
              <button
                type="button"
                onClick={() => setActiveMobileView('vs-powder')}
                className={`px-3 py-1 rounded-full transition-all ${
                  activeMobileView === 'vs-powder' 
                    ? 'bg-rose-500 text-white shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pods vs Powder ❌
              </button>
              <button
                type="button"
                onClick={() => setActiveMobileView('vs-liquid')}
                className={`px-3 py-1 rounded-full transition-all ${
                  activeMobileView === 'vs-liquid' 
                    ? 'bg-amber-500 text-white shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pods vs Liquid ⚠️
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            DESKTOP COMPARISON TABLE (COMPACT, HIGH-END LUXURY AESTHETIC)
           ========================================================================= */}
        <div className="hidden md:block rounded-2xl border border-slate-200/90 shadow-md bg-white overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90">
                {/* Metric Title Header */}
                <th className="w-[24%] py-3.5 px-4 text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  মুল বৈশিষ্ট্য ও পার্থক্য
                </th>

                {/* Leaf Curt Winner Highlight Column */}
                <th className="w-[32%] py-3.5 px-4 bg-gradient-to-b from-sky-50 via-emerald-50/40 to-white border-x-2 border-sky-400/50 text-center">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#0093d0] to-[#00a651] text-white text-[10px] font-black uppercase tracking-wider shadow-xs mb-1">
                    <Award className="w-3 h-3 text-amber-300" />
                    <span>🏆 WINNER • মেশিনের সেরা বন্ধু</span>
                  </div>
                  <h3 className="font-sans text-base lg:text-lg font-black text-slate-900 tracking-tight leading-tight">
                    {displayBrand} 5-in-1 Pods
                  </h3>
                  <p className="text-[11px] font-semibold text-[#007ba8] mt-0.5">
                    ১০০% মেশিনের সুরক্ষার সাথে আল্ট্রা ক্লিন
                  </p>
                </th>

                {/* Detergent Powder Column */}
                <th className="w-[22%] py-3.5 px-4 text-center border-r border-slate-200 bg-rose-50/30">
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest block mb-0.5">
                    ❌ TRADITIONAL
                  </span>
                  <h4 className="font-sans text-sm lg:text-base font-bold text-slate-800 leading-tight">
                    গুঁড়া পাউডার (Powder)
                  </h4>
                  <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">
                    মেশিনের ড্রাম ও কাপড়ের জন্য ঝুঁকিপূর্ণ
                  </p>
                </th>

                {/* Ordinary Liquid Column */}
                <th className="w-[22%] py-3.5 px-4 text-center bg-amber-50/25">
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block mb-0.5">
                    ⚠️ ORDINARY
                  </span>
                  <h4 className="font-sans text-sm lg:text-base font-bold text-slate-800 leading-tight">
                    সাধারণ লিকুইড (Liquid Soap)
                  </h4>
                  <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">
                    ৮০% পানি, অতিরিক্ত অপচয় ও আঠা
                  </p>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {COMPARISON_FEATURES.map((row, idx) => (
                <tr 
                  key={row.id} 
                  className={`transition-colors hover:bg-slate-50/60 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                >
                  {/* Feature Title */}
                  <td className="py-2.5 px-4 align-top">
                    <div className="font-bold text-slate-900 text-xs lg:text-[13px]">
                      {row.bengaliFeature}
                    </div>
                    <div className="text-[10.5px] text-slate-400 font-medium mt-0.5">
                      {row.feature}
                    </div>
                  </td>

                  {/* Leaf Curt Winner Row */}
                  <td className="py-2.5 px-4 align-top bg-gradient-to-r from-sky-50/40 via-emerald-50/25 to-transparent border-x-2 border-sky-400/40">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-950 text-xs lg:text-[13px]">
                          {row.pods.bengaliValue}
                        </div>
                        <div className="text-[11px] text-slate-600 font-normal leading-snug mt-0.5">
                          {row.pods.subtext}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Powder Column Row */}
                  <td className="py-2.5 px-4 align-top border-r border-slate-200 bg-rose-50/15">
                    <div className="flex items-start gap-2">
                      <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-rose-950 text-xs">
                          {row.powder.bengaliValue}
                        </div>
                        <div className="text-[10.5px] text-slate-500 font-normal leading-snug mt-0.5">
                          {row.powder.subtext}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Liquid Column Row */}
                  <td className="py-2.5 px-4 align-top bg-amber-50/10">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-amber-950 text-xs">
                          {row.liquid.bengaliValue}
                        </div>
                        <div className="text-[10.5px] text-slate-500 font-normal leading-snug mt-0.5">
                          {row.liquid.subtext}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* =========================================================================
            MOBILE CARDS (COMPACT & SLEEK)
           ========================================================================= */}
        <div className="md:hidden space-y-2.5">
          {COMPARISON_FEATURES.map((item) => (
            <div 
              key={item.id} 
              className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs space-y-2"
            >
              {/* Feature Header */}
              <div className="border-b border-slate-100 pb-1.5 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">
                  {item.bengaliFeature}
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">
                  {item.feature}
                </span>
              </div>

              {/* 1. Leaf Curt Winner Card */}
              <div className="bg-gradient-to-r from-sky-50 via-emerald-50 to-white rounded-lg p-2.5 border border-sky-400/60 relative">
                <span className="absolute -top-2 right-2 bg-gradient-to-r from-[#0093d0] to-[#00a651] text-white text-[8.5px] font-black uppercase px-2 py-0.2 rounded-full shadow-xs">
                  🏆 {displayBrand} Pods
                </span>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 text-xs font-bold block">
                      {item.pods.bengaliValue}
                    </strong>
                    <p className="text-[10.5px] text-slate-600 mt-0.5 leading-snug">
                      {item.pods.subtext}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Detergent Powder Comparison */}
              {(activeMobileView === 'all' || activeMobileView === 'vs-powder') && (
                <div className="bg-rose-50/50 rounded-lg p-2.5 border border-rose-200/80">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] font-bold text-rose-600 uppercase block tracking-wider">
                        ❌ গুঁড়া পাউডার (Detergent Powder)
                      </span>
                      <strong className="text-rose-950 text-[11px] font-semibold block mt-0.5">
                        {item.powder.bengaliValue}
                      </strong>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                        {item.powder.subtext}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Liquid Detergent Comparison */}
              {(activeMobileView === 'all' || activeMobileView === 'vs-liquid') && (
                <div className="bg-amber-50/40 rounded-lg p-2.5 border border-amber-200/80">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] font-bold text-amber-600 uppercase block tracking-wider">
                        ⚠️ সাধারণ লিকুইড (Liquid Soap)
                      </span>
                      <strong className="text-amber-950 text-[11px] font-semibold block mt-0.5">
                        {item.liquid.bengaliValue}
                      </strong>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                        {item.liquid.subtext}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
