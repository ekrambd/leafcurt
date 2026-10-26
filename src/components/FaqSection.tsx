import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { FaqSectionSettings } from '../types';

interface FaqSectionProps {
  settings?: FaqSectionSettings;
}

export default function FaqSection({ settings }: FaqSectionProps) {
  if (!settings || settings.enabled === false) {
    return null;
  }

  const activeItems = (settings.items || []).filter(
    item => item && item.active !== false && item.question?.trim()
  );

  if (activeItems.length === 0) {
    return null;
  }

  const [openIndex, setOpenIndex] = useState<number | null>(0); // First item open by default
  const rawBgColor = settings.bgColor?.trim();
  // Default to store brand navy #0a3866 (matching Leafcurt logo) if unset or using old template #051c2c
  const bgColor = (!rawBgColor || rawBgColor.toLowerCase() === '#051c2c') ? '#0a3866' : rawBgColor;

  const toggleItem = (idx: number) => {
    setOpenIndex(prev => (prev === idx ? null : idx));
  };

  return (
    <section 
      id="faq-section"
      className="pt-8 pb-10 sm:pt-10 sm:pb-12 text-white overflow-hidden relative"
      style={{ backgroundColor: bgColor }}
    >
      {/* Ambient subtle brand glows matching logo water splash and green leaf */}
      <div 
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-25"
        style={{ background: 'radial-gradient(circle, #0284c7 0%, transparent 70%)' }}
      />
      <div 
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(circle, #16a34a 0%, transparent 70%)' }}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Title & Badge */}
        <div className="text-center mb-5 sm:mb-7">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-sky-200 text-xs font-semibold mb-3 backdrop-blur-sm">
            <HelpCircle className="w-3.5 h-3.5 text-sky-300" />
            <span>সচরাচর জিজ্ঞাসা • FAQ</span>
          </div>
          <h2 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            {settings.title?.trim() || 'সচরাচর জিজ্ঞাসিত প্রশ্নাবলী (FAQ)'}
          </h2>
          {settings.subtitle?.trim() && (
            <p className="mt-3 text-xs sm:text-sm text-sky-100/80 font-normal max-w-lg mx-auto">
              {settings.subtitle}
            </p>
          )}
        </div>

        {/* Accordion List with Clean Minimal Dividers */}
        <div className="divide-y divide-white/10 border-t border-b border-white/10">
          {activeItems.map((item, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div key={item.id || idx} className="transition-colors">
                <button
                  type="button"
                  onClick={() => toggleItem(idx)}
                  className="w-full py-5 sm:py-6 flex items-center justify-between text-left gap-4 cursor-pointer group"
                >
                  <span className={`font-bold text-base sm:text-lg tracking-tight transition-colors ${
                    isOpen ? 'text-sky-200' : 'text-white group-hover:text-sky-300'
                  }`}>
                    {item.question}
                  </span>
                  <div className="shrink-0 flex items-center justify-center">
                    <div className={`p-1.5 rounded-full transition-all ${
                      isOpen 
                        ? 'bg-sky-400/20 text-sky-300 border border-sky-400/30' 
                        : 'bg-white/5 text-slate-300 group-hover:bg-white/15 group-hover:text-white'
                    }`}>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4" strokeWidth={2.5} />
                      ) : (
                        <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
                      )}
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="pb-6 pt-0 text-xs sm:text-sm text-sky-50/90 leading-relaxed font-normal animate-fadeIn">
                    <p className="whitespace-pre-line">{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
