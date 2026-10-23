import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';
import { BeforeAfterSettings } from '../types';

interface BeforeAfterSectionProps {
  settings?: BeforeAfterSettings;
  onNavigateShop?: () => void;
}

// Custom 3-Ring Laundry Pod Icon matching the exact bullet icon from the reference design
const LaundryPodIcon = () => (
  <svg 
    className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <circle cx="8" cy="9" r="3.5" />
    <circle cx="16" cy="9" r="3.5" />
    <circle cx="12" cy="15.5" r="3.5" />
  </svg>
);

const DEFAULT_SETTINGS: BeforeAfterSettings = {
  enabled: true,
  title: 'Ready to Upgrade Your Laundry Operation?',
  description: 'PowerPax™ capsules are built for commercial performance — no guesswork, no waste, just clean that performs.',
  beforeImage: '/authentic/before_stain.png',
  afterImage: '/authentic/after_clean.png',
  beforeBadge: 'BEFORE',
  afterBadge: 'AFTER',
  initialSliderPosition: 50,
  buttonText: 'Shop PowerPax™',
  buttonLink: '/shop',
  bullets: [
    {
      id: 'b1',
      title: 'Lower Cost Per Turn',
      description: 'Use less, save more with every load'
    },
    {
      id: 'b2',
      title: 'Mess-Free Precision',
      description: 'No pouring, no measuring, just drop and go'
    },
    {
      id: 'b3',
      title: 'Eco-Safe Formula',
      description: 'Safe for skin, safe for the planet'
    },
    {
      id: 'b4',
      title: 'Cleaner results across all machine types',
      description: ''
    }
  ]
};

export default function BeforeAfterSection({ settings, onNavigateShop }: BeforeAfterSectionProps) {
  // If explicitly disabled in admin, do not render
  if (settings && settings.enabled === false) {
    return null;
  }

  const merged = {
    ...DEFAULT_SETTINGS,
    ...settings,
    bullets: (settings?.bullets && settings.bullets.length > 0) ? settings.bullets : DEFAULT_SETTINGS.bullets
  };

  const beforeImg = merged.beforeImage?.trim() || DEFAULT_SETTINGS.beforeImage!;
  const afterImg = merged.afterImage?.trim() || DEFAULT_SETTINGS.afterImage!;

  const [sliderPos, setSliderPos] = useState<number>(merged.initialSliderPosition || 50);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDragging = useRef<boolean>(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const clamped = Math.max(0, Math.min(rect.width, x));
    const percent = Math.round((clamped / rect.width) * 100);
    setSliderPos(percent);
  }, []);

  // Global window mouse and touch event listeners for seamless, butter-smooth dragging
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        updatePosition(e.clientX);
      }
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isDragging.current && e.touches[0]) {
        updatePosition(e.touches[0].clientX);
      }
    };

    const onTouchEnd = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [updatePosition]);

  const handleStartDrag = (clientX: number) => {
    isDragging.current = true;
    updatePosition(clientX);
  };

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-slate-50/70 border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Main Elevated Card Container matching reference screenshot */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-5 sm:p-8 md:p-10 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-14 items-center">
            
            {/* Left Column: Draggable Interactive Before / After Image Slider */}
            <div className="lg:col-span-6 flex justify-center">
              <div
                ref={containerRef}
                onMouseDown={(e) => handleStartDrag(e.clientX)}
                onTouchStart={(e) => {
                  if (e.touches[0]) handleStartDrag(e.touches[0].clientX);
                }}
                className="relative w-full max-w-[490px] aspect-[484/406] rounded-2xl overflow-hidden border border-slate-200/90 shadow-md select-none cursor-ew-resize bg-slate-100"
              >
                {/* 1. Base / Before Layer (Stained garment on right side) */}
                <img
                  src={beforeImg}
                  alt="Before Cleaning"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                  draggable={false}
                />

                {/* 2. Top / After Layer (Clean white garment revealed via clipPath) */}
                <div
                  className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none"
                  style={{
                    clipPath: `inset(0 0 0 ${sliderPos}%)`
                  }}
                >
                  <img
                    src={afterImg}
                    alt="After Cleaning"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                    draggable={false}
                  />
                </div>

                {/* Pill Badge: BEFORE (Top Left - White pill) */}
                <div className="absolute top-4 left-4 z-20 bg-white/95 text-slate-800 text-[11px] font-bold px-3 py-1 rounded-full shadow-sm pointer-events-none tracking-wider uppercase border border-slate-200/80">
                  {merged.beforeBadge || 'BEFORE'}
                </div>

                {/* Pill Badge: AFTER (Top Right - Dark pill) */}
                <div className="absolute top-4 right-4 z-20 bg-slate-900/95 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm pointer-events-none tracking-wider uppercase border border-white/10">
                  {merged.afterBadge || 'AFTER'}
                </div>

                {/* Vertical Divider Line with Center Drag Handle */}
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-white z-20 pointer-events-none shadow-[0_0_8px_rgba(0,0,0,0.4)]"
                  style={{ left: `${sliderPos}%` }}
                >
                  {/* Round Handle with < > arrows */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white text-slate-700 border-2 border-slate-300 shadow-xl flex items-center justify-center font-bold text-xs pointer-events-auto cursor-ew-resize hover:scale-105 active:scale-95 transition-transform select-none">
                    <span className="text-[12px] font-mono tracking-tighter text-slate-700 flex items-center gap-0.5">
                      <span>‹</span>
                      <span>›</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Headline, Description, Bullets & CTA */}
            <div className="lg:col-span-6 space-y-5 text-left">
              <div>
                <h2 className="font-sans text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-[#0f172a] tracking-tight leading-tight">
                  {merged.title}
                </h2>
                {merged.description && (
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed font-normal">
                    {merged.description}
                  </p>
                )}
              </div>

              {/* Feature Bullets List with Custom Pod Icons */}
              {merged.bullets && merged.bullets.length > 0 && (
                <div className="space-y-3 pt-1">
                  {merged.bullets.map((b, idx) => (
                    <div key={b.id || idx} className="flex items-start gap-2.5">
                      <LaundryPodIcon />
                      <div className="text-xs sm:text-sm text-slate-700 leading-snug">
                        <strong className="text-slate-900 font-bold">{b.title}</strong>
                        {b.description ? (
                          <span className="text-slate-600"> – {b.description}</span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Purple / Violet CTA Button matching screenshot */}
              {merged.buttonText && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateShop) {
                        onNavigateShop();
                      } else if (merged.buttonLink) {
                        window.location.href = merged.buttonLink;
                      }
                    }}
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#7c3aed] hover:bg-[#6d28d9] active:bg-[#5b21b6] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-purple-600/25 hover:shadow-purple-600/35 active:scale-98 transition-all cursor-pointer"
                  >
                    <span>{merged.buttonText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
