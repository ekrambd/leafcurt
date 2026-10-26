import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Star, ChevronLeft, ChevronRight, MapPin, CheckCircle2 } from 'lucide-react';
import { TestimonialSectionSettings, TestimonialItem } from '../types';
import { DEFAULT_TESTIMONIAL_SETTINGS } from '../lib/constants';

interface CustomerTestimonialsSectionProps {
  settings?: TestimonialSectionSettings;
}

export default function CustomerTestimonialsSection({ settings }: CustomerTestimonialsSectionProps) {
  // If explicitly disabled in admin, do not render
  if (settings && settings.enabled === false) {
    return null;
  }

  const activeItems: TestimonialItem[] = useMemo(() => {
    const rawList = (settings?.items && Array.isArray(settings.items) && settings.items.length > 0)
      ? settings.items
      : DEFAULT_TESTIMONIAL_SETTINGS.items;

    const filtered = rawList.filter(item => item && item.active !== false && item.quote?.trim());
    return filtered.length > 0 ? filtered : DEFAULT_TESTIMONIAL_SETTINGS.items;
  }, [settings?.items]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);
  const [isHovered, setIsHovered] = useState(false);
  const autoScrollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Responsive itemsPerView detection (1 on mobile, 2 on tablet, 3 on desktop)
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth < 640) {
        setItemsPerView(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2);
      } else {
        setItemsPerView(3);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, activeItems.length - itemsPerView);

  // Auto-scroll logic (pauses on hover)
  useEffect(() => {
    const isAuto = settings?.autoScroll ?? DEFAULT_TESTIMONIAL_SETTINGS.autoScroll;
    if (!isAuto || activeItems.length <= itemsPerView || isHovered) {
      if (autoScrollTimerRef.current) clearInterval(autoScrollTimerRef.current);
      return;
    }

    const intervalSeconds = Math.max(3, settings?.scrollInterval || DEFAULT_TESTIMONIAL_SETTINGS.scrollInterval || 5);
    autoScrollTimerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
    }, intervalSeconds * 1000);

    return () => {
      if (autoScrollTimerRef.current) clearInterval(autoScrollTimerRef.current);
    };
  }, [settings?.autoScroll, settings?.scrollInterval, activeItems.length, itemsPerView, maxIndex, isHovered]);

  // Keep index in valid bounds on resize
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [maxIndex, currentIndex]);

  if (activeItems.length === 0) {
    return null;
  }

  const handlePrev = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : maxIndex));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < maxIndex ? prev + 1 : 0));
  };

  const title = settings?.title?.trim() || DEFAULT_TESTIMONIAL_SETTINGS.title;
  const subtitle = settings?.subtitle?.trim();
  const showBadge = settings?.showReviewsBadge ?? DEFAULT_TESTIMONIAL_SETTINGS.showReviewsBadge;

  return (
    <section 
      id="customer-testimonials-section" 
      className="pt-5 pb-6 sm:pt-7 sm:pb-8 lg:pt-7 lg:pb-8 bg-white border-b border-slate-100 overflow-hidden relative select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Signature Curved Line */}
        <div className="text-center max-w-2xl mx-auto mb-5 sm:mb-7">
          <div className="inline-block relative">
            <h2 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight pb-1">
              {title && title !== 'What our customers say' ? title : 'সম্মানিত গ্রাহকদের বাস্তব অভিজ্ঞতা'}
            </h2>
            {/* Colorful curved underline matching storefront brand */}
            <svg 
              className="w-full h-3.5 sm:h-5 max-w-[240px] sm:max-w-[290px] mx-auto mt-0.5 overflow-visible" 
              viewBox="0 0 250 20" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="testimCurveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="25%" stopColor="#06b6d4" />
                  <stop offset="55%" stopColor="#8b5cf6" />
                  <stop offset="80%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                <filter id="testimCurveGlow" x="-10%" y="-10%" width="120%" height="120%">
                  <feGaussianBlur stdDeviation="1.5" result="glow" />
                  <feComposite in="SourceGraphic" in2="glow" operator="over" />
                </filter>
              </defs>
              <path 
                d="M6 13 C 48 4, 96 16, 146 9 C 184 3.5, 218 7, 244 11" 
                stroke="url(#testimCurveGradient)" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                filter="url(#testimCurveGlow)"
              />
              <path 
                d="M18 16 C 62 8, 112 17, 162 11 C 196 6.5, 222 9, 238 12" 
                stroke="url(#testimCurveGradient)" 
                strokeWidth="1.8" 
                strokeLinecap="round" 
                opacity="0.85"
              />
            </svg>
          </div>
          {subtitle ? (
            <p className="mt-2 text-xs sm:text-sm text-slate-600 font-normal">
              {subtitle}
            </p>
          ) : null}
        </div>

        {/* Carousel Container with Centered Left & Right Navigation Arrows */}
        <div className="relative flex items-center gap-2 sm:gap-4">
          
          {/* Previous Arrow Button */}
          {activeItems.length > itemsPerView && (
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous testimonials"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-slate-300/90 bg-white hover:bg-slate-50 active:scale-95 transition shadow-xs flex items-center justify-center text-slate-700 shrink-0 cursor-pointer z-10"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
          )}

          {/* Cards Track Window */}
          <div className="flex-1 overflow-hidden py-2">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`
              }}
            >
              {activeItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="px-2.5 sm:px-3 shrink-0 flex flex-col"
                  style={{ width: `${100 / itemsPerView}%` }}
                >
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all h-full min-h-[250px]">
                    <div>
                      {/* Top: Avatar, Name, Location & Verified Badge */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500/15 to-emerald-500/20 text-[#007ba8] font-black text-sm flex items-center justify-center border border-sky-200 shrink-0 shadow-2xs">
                            {item.name ? item.name.charAt(0) : '★'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-[13.5px] sm:text-[14.5px] font-bold text-[#0f172a] leading-tight truncate">
                              {item.name}
                            </h4>
                            {item.designation?.trim() && (
                              <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5 truncate">
                                <MapPin className="w-3 h-3 text-[#0093d0] shrink-0" />
                                <span>{item.designation.trim()}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>ভেরিফাইড</span>
                        </span>
                      </div>

                      {/* 5-Star Rating */}
                      <div className="flex items-center gap-0.5 mb-2.5">
                        {[1, 2, 3, 4, 5].map((starNum) => (
                          <Star
                            key={starNum}
                            className={`w-3.5 h-3.5 ${
                              starNum <= (item.rating || 5)
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-slate-200 text-slate-200'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Testimonial Quote */}
                      <p className="text-[12.5px] sm:text-[13px] text-slate-700 leading-relaxed font-normal">
                        "{item.quote}"
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Arrow Button */}
          {activeItems.length > itemsPerView && (
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next testimonials"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-slate-300/90 bg-white hover:bg-slate-50 active:scale-95 transition shadow-xs flex items-center justify-center text-slate-700 shrink-0 cursor-pointer z-10"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          )}

        </div>

        {/* Bottom Pagination Dots (Matching the 6 dots in screenshot) */}
        {activeItems.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {activeItems.slice(0, 6).map((_, dotIdx) => {
              const isActive = Math.min(currentIndex, activeItems.length - 1) === dotIdx;
              return (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => setCurrentIndex(Math.min(dotIdx, maxIndex))}
                  aria-label={`Go to slide ${dotIdx + 1}`}
                  className={`transition-all rounded-full cursor-pointer ${
                    isActive
                      ? 'w-2 h-2 bg-[#0f172a]'
                      : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}
