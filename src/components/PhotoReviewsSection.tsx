import React, { useState, useEffect } from 'react';
import { Star, CheckSquare, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { PhotoReviewsSettings, PhotoReviewItem } from '../types';

interface PhotoReviewsSectionProps {
  settings?: PhotoReviewsSettings;
}

export default function PhotoReviewsSection({ settings }: PhotoReviewsSectionProps) {
  if (!settings || settings.enabled === false) {
    return null;
  }

  const activeItems: PhotoReviewItem[] = (settings.items || []).filter(
    item => item && item.active !== false && item.photoUrl?.trim()
  );

  if (activeItems.length === 0) {
    return null;
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(5);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoReviewItem | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth < 640) {
        setItemsPerView(1.3);
      } else if (window.innerWidth < 768) {
        setItemsPerView(2.4);
      } else if (window.innerWidth < 1024) {
        setItemsPerView(3.5);
      } else {
        setItemsPerView(5);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, Math.ceil(activeItems.length - itemsPerView));

  const handlePrev = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : maxIndex));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < maxIndex ? prev + 1 : 0));
  };

  return (
    <section className="py-12 sm:py-16 bg-white border-b border-slate-100 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Title & Aggregate Star Rating */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <h2 className="font-sans text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-[#081d34] tracking-tight">
            {settings.title?.trim() || 'See What Customers Are Saying'}
          </h2>

          {/* Rating Summary Line matching screenshot */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-3 text-xs sm:text-sm font-semibold text-slate-700">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]" />
              ))}
            </div>
            <span className="font-extrabold text-[#081d34]">
              {settings.overallRating ?? 4.76}
            </span>
            <span className="text-[#f59e0b] font-bold">★</span>
            <span className="text-slate-600 font-medium">
              ({settings.totalReviewsCount ?? 268})
            </span>
            {settings.isVerifiedBadge !== false && (
              <span className="inline-flex items-center gap-1 text-[#0d9488] font-bold ml-1.5">
                <CheckSquare className="w-4 h-4 text-[#0d9488]" />
                <span>Verified</span>
              </span>
            )}
          </div>
        </div>

        {/* Carousel Window with Navigation Chevrons */}
        <div className="relative flex items-center justify-between gap-1 sm:gap-3">
          
          {/* Prev Arrow */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous reviews"
            className="shrink-0 p-1 sm:p-2 text-slate-700 hover:text-slate-900 transition active:scale-90 cursor-pointer disabled:opacity-30"
          >
            <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
          </button>

          {/* Cards Track */}
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
                  className="px-2 shrink-0 select-none"
                  style={{ width: `${100 / itemsPerView}%` }}
                >
                  <div className="bg-white rounded-2xl p-2 sm:p-2.5 flex flex-col justify-between h-full transition hover:-translate-y-1 duration-200">
                    
                    {/* Customer Photo / Screenshot Attachment */}
                    <div 
                      onClick={() => setSelectedPhoto(item)}
                      className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 relative mb-3 cursor-zoom-in shadow-xs group"
                    >
                      <img
                        src={item.photoUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>

                    {/* Customer Quote Snippet */}
                    <p className="text-xs sm:text-[13px] font-bold text-[#14293f] line-clamp-3 text-center mb-2.5 min-h-[46px] leading-snug px-1">
                      {item.quote}
                    </p>

                    {/* 5 Filled Stars */}
                    <div className="flex items-center justify-center gap-0.5 mb-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                            s <= (item.rating || 5)
                              ? 'fill-[#f59e0b] text-[#f59e0b]'
                              : 'fill-slate-200 text-slate-200'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Customer Name with Verified Badge */}
                    <div className="flex items-center justify-center gap-1.5 text-center">
                      <span className="font-extrabold text-xs sm:text-sm text-[#081d34]">
                        {item.name}
                      </span>
                      {item.isVerified !== false && (
                        <div className="w-3.5 h-3.5 rounded-full bg-[#081d34] text-white flex items-center justify-center shrink-0 text-[9px] font-black">
                          ✓
                        </div>
                      )}
                    </div>

                    {/* Product Tag / Subtitle */}
                    {item.productTag && (
                      <span className="text-[11px] sm:text-xs text-slate-500 font-medium truncate block text-center mt-0.5">
                        {item.productTag}
                      </span>
                    )}

                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Arrow */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next reviews"
            className="shrink-0 p-1 sm:p-2 text-slate-700 hover:text-slate-900 transition active:scale-90 cursor-pointer disabled:opacity-30"
          >
            <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
          </button>

        </div>

      </div>

      {/* Lightbox Modal to view full customer screenshot */}
      {selectedPhoto && (
        <div 
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative animate-scaleUp p-5 space-y-4"
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full cursor-pointer transition z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="rounded-2xl overflow-hidden bg-slate-100 max-h-[60vh] flex items-center justify-center">
              <img
                src={selectedPhoto.photoUrl}
                alt={selectedPhoto.name}
                className="max-h-[60vh] w-auto object-contain"
              />
            </div>

            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]" />
                ))}
              </div>
              <p className="font-bold text-slate-900 text-sm">
                "{selectedPhoto.quote}"
              </p>
              <div className="flex items-center justify-center gap-1.5 text-xs">
                <span className="font-bold text-slate-900">{selectedPhoto.name}</span>
                {selectedPhoto.isVerified !== false && (
                  <span className="bg-slate-900 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[9px] font-bold">
                    ✓
                  </span>
                )}
                {selectedPhoto.productTag && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">{selectedPhoto.productTag}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
