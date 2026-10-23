import React from 'react';
import { ClientLogosSettings } from '../types';
import { DEFAULT_CLIENT_LOGOS_SETTINGS } from '../lib/constants';

interface BrandLogosSectionProps {
  settings?: ClientLogosSettings;
}

export default function BrandLogosSection({ settings }: BrandLogosSectionProps) {
  // If explicitly disabled in admin, do not render
  if (settings && settings.enabled === false) {
    return null;
  }

  const rawList = (settings?.items && Array.isArray(settings.items) && settings.items.length > 0)
    ? settings.items
    : DEFAULT_CLIENT_LOGOS_SETTINGS.items;

  const activeItems = rawList.filter(item => item && item.active !== false && (item.logoUrl || item.name));
  if (activeItems.length === 0) {
    return null;
  }

  const bgColor = settings?.bgColor || DEFAULT_CLIENT_LOGOS_SETTINGS.bgColor || '#051c2c';
  const title = settings?.title?.trim() || DEFAULT_CLIENT_LOGOS_SETTINGS.title;

  const renderCard = (brand: typeof activeItems[0], keyPrefix: string, idx: number) => {
    const cardContent = (
      <div 
        className="bg-white rounded-xl sm:rounded-2xl px-6 sm:px-8 py-3.5 sm:py-4 h-20 sm:h-24 min-w-[150px] sm:min-w-[180px] max-w-[210px] flex items-center justify-center shadow-md border border-white/10 shrink-0 hover:scale-105 transition-transform duration-300 select-none"
      >
        {brand.logoUrl ? (
          <img
            src={brand.logoUrl}
            alt={brand.name || 'Brand Partner'}
            className="max-h-12 sm:max-h-14 max-w-[130px] sm:max-w-[150px] object-contain pointer-events-none"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <span className="font-extrabold text-slate-800 text-xs sm:text-sm text-center">
            {brand.name}
          </span>
        )}
      </div>
    );

    if (brand.link?.trim()) {
      return (
        <a
          key={`${keyPrefix}-${brand.id || idx}`}
          href={brand.link}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer block shrink-0"
        >
          {cardContent}
        </a>
      );
    }

    return (
      <div key={`${keyPrefix}-${brand.id || idx}`} className="shrink-0">
        {cardContent}
      </div>
    );
  };

  return (
    <section 
      id="brand-logos-section"
      className="py-12 sm:py-16 text-white overflow-hidden relative select-none"
      style={{ backgroundColor: bgColor }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Headline matching reference screenshot */}
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="font-sans text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-white tracking-tight">
            {title}
          </h2>
        </div>

        {/* Seamless Smooth Infinite Marquee Carousel with soft edge fades */}
        <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_4%,white_96%,transparent)]">
          <div className="animate-marquee-brands flex items-center gap-4 sm:gap-6 w-max py-2">
            {/* Primary Track */}
            {activeItems.map((brand, idx) => renderCard(brand, 'track-1', idx))}
            
            {/* Duplicate Track 1 (seamless infinite loop) */}
            {activeItems.map((brand, idx) => renderCard(brand, 'track-2', idx))}
            
            {/* Duplicate Track 2 (guarantees coverage on ultra-wide screens) */}
            {activeItems.map((brand, idx) => renderCard(brand, 'track-3', idx))}
          </div>
        </div>

      </div>
    </section>
  );
}
