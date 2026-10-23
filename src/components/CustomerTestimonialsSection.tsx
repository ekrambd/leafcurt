import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
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
      className="py-14 sm:py-20 bg-white border-b border-slate-100 overflow-hidden relative select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header matching reference design */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <h2 className="font-sans text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-[#0f172a] tracking-tight">
            {title}
          </h2>
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
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-xs hover:shadow-md transition-all h-full min-h-[290px]">
                    
                    <div>
                      {/* Logo / Brand Header */}
                      <div className="h-10 flex items-center mb-3.5">
                        {item.avatarOrLogo ? (
                          <img
                            src={item.avatarOrLogo}
                            alt={item.name}
                            className="max-h-8 max-w-[130px] object-contain object-left"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                            {item.name ? item.name.charAt(0).toUpperCase() : '★'}
                          </div>
                        )}
                      </div>

                      {/* Author Name & Company / Designation */}
                      <h4 className="text-[14px] sm:text-[15px] font-bold text-[#0f172a] leading-snug mb-2">
                        {item.name}
                        {item.designation?.trim() ? `, ${item.designation.trim()}` : ''}
                      </h4>

                      {/* 5-Star Rating (Gold & Light Gray) */}
                      <div className="flex items-center gap-0.5 mb-3.5">
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
                      <p className="text-[13px] sm:text-[13.5px] text-slate-700 leading-relaxed font-normal">
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
