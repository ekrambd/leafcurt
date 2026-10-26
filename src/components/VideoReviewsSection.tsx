import React, { useState, useRef } from 'react';
import { Play, X, Video, ChevronLeft, ChevronRight, Star, Sparkles, Volume2, VolumeX, ExternalLink } from 'lucide-react';
import { VideoReviewsSettings, VideoReviewItem, Product } from '../types';

interface VideoReviewsSectionProps {
  settings?: VideoReviewsSettings;
  products?: Product[];
  onAddToCart?: (product: Product, quantity?: number) => void;
  onBuyNow?: (product: Product, quantity?: number) => void;
  onSelectProduct?: (product: Product) => void;
  formatPrice?: (amount: number) => string;
  onNavigateShop?: () => void;
}

export function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const match = trimmed.match(/(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([\w-]{11})/i);
  return match ? match[1] : null;
}

export function isDirectVideo(url?: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase().split('?')[0];
  return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov') || lower.startsWith('/uploads/');
}

export function getVideoPosterUrl(posterUrl?: string, videoUrl?: string): string {
  if (posterUrl && posterUrl.trim()) {
    return posterUrl.trim();
  }
  const ytId = extractYouTubeId(videoUrl);
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }
  return '';
}

function getEmbedVideoUrl(url?: string): { isIframe: boolean; url: string } {
  if (!url) return { isIframe: false, url: '' };
  const trimmed = url.trim();

  // YouTube match (Shorts, Watch, Embed, etc.)
  const ytId = extractYouTubeId(trimmed);
  if (ytId) {
    return {
      isIframe: true,
      url: `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`
    };
  }

  // Vimeo match
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      isIframe: true,
      url: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`
    };
  }

  return { isIframe: false, url: trimmed };
}

export default function VideoReviewsSection({ 
  settings, 
  products = [], 
  onAddToCart, 
  onBuyNow, 
  onSelectProduct, 
  formatPrice, 
  onNavigateShop 
}: VideoReviewsSectionProps) {
  // If section is explicitly disabled, hide it
  if (!settings || settings.enabled === false) {
    return null;
  }

  // Filter only active, real items that have either a poster image or video URL
  const activeItems: VideoReviewItem[] = (settings.items || []).filter(
    item => item && item.active !== false && (item.posterUrl?.trim() || item.videoUrl?.trim())
  );

  // If no data has been added in admin panel, DO NOT show fake seed data -> hide section completely
  if (activeItems.length === 0) {
    return null;
  }

  const [activeVideoModal, setActiveVideoModal] = useState<VideoReviewItem | null>(null);
  const [mutedMap, setMutedMap] = useState<Record<string, boolean>>({});
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleToggleMute = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    setMutedMap(prev => {
      const isCurrentlyMuted = prev[itemId] !== false; // default true
      const nextMuted = !isCurrentlyMuted;
      const card = cardRefs.current[itemId];
      if (card) {
        const vid = card.querySelector('video');
        if (vid) {
          vid.muted = nextMuted;
          if (!nextMuted) {
            vid.play().catch(() => {});
          }
        }
      }
      return { ...prev, [itemId]: nextMuted };
    });
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 320;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <section className="pt-5 pb-6 sm:pt-7 sm:pb-8 lg:pt-7 lg:pb-8 bg-gradient-to-b from-white via-slate-50/50 to-white border-b border-slate-100 overflow-hidden relative" id="video-reviews-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title with Hand-Drawn Colorful Curved Underline */}
        <div className="text-center max-w-3xl mx-auto mb-4 sm:mb-6">
          <div className="inline-block relative">
            <h2 className="font-sans text-2xl sm:text-3xl lg:text-4xl text-slate-900 font-bold tracking-tight pb-1">
              {settings.title?.trim() || 'What About Our Product'}
            </h2>
            {/* Hand-drawn colorful curved underline */}
            <svg 
              className="w-full h-3.5 sm:h-5 max-w-[240px] sm:max-w-[290px] mx-auto mt-0.5 overflow-visible" 
              viewBox="0 0 250 20" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="videoCurveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="25%" stopColor="#06b6d4" />
                  <stop offset="55%" stopColor="#8b5cf6" />
                  <stop offset="80%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                <filter id="videoCurveSoftGlow" x="-10%" y="-10%" width="120%" height="120%">
                  <feGaussianBlur stdDeviation="1.5" result="glow" />
                  <feComposite in="SourceGraphic" in2="glow" operator="over" />
                </filter>
              </defs>
              <path 
                d="M6 13 C 48 4, 96 16, 146 9 C 184 3.5, 218 7, 244 11" 
                stroke="url(#videoCurveGradient)" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                filter="url(#videoCurveSoftGlow)"
              />
              <path 
                d="M18 16 C 62 8, 112 17, 162 11 C 196 6.5, 222 9, 238 12" 
                stroke="url(#videoCurveGradient)" 
                strokeWidth="1.8" 
                strokeLinecap="round" 
                opacity="0.8" 
              />
            </svg>
          </div>
        </div>

        {/* Horizontal Reel Navigation Controls (Only if items > 2) */}
        {activeItems.length > 2 && (
          <div className="flex items-center justify-end gap-2 mb-4 pr-1">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="w-10 h-10 rounded-full bg-white hover:bg-slate-900 hover:text-white text-slate-700 shadow-sm border border-slate-200 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="w-10 h-10 rounded-full bg-white hover:bg-slate-900 hover:text-white text-slate-700 shadow-sm border border-slate-200 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Premium Horizontal Scrollable Carousel Reel */}
        <div 
          ref={scrollContainerRef}
          className="flex items-stretch gap-5 sm:gap-6 overflow-x-auto pb-6 pt-2 px-1 scrollbar-none snap-x snap-mandatory scroll-smooth"
        >
          {activeItems.map((item, idx) => {
            const poster = getVideoPosterUrl(item.posterUrl, item.videoUrl);
            const isUpload = isDirectVideo(item.videoUrl);
            const isMuted = mutedMap[item.id] !== false;

            // Product resolution
            const attachedProduct = item.productId ? products?.find(p => p.id === item.productId) : null;
            const hasAttachedProduct = Boolean(attachedProduct || item.productId || item.productTitle);

            const displayTitle = item.productTitle || attachedProduct?.title || 'Leaf Curt Pods';
            const displayPrice = item.productPrice ?? attachedProduct?.price ?? 0;
            const displayRegularPrice = item.productRegularPrice ?? attachedProduct?.regularPrice;
            const displayImage = item.productImage || (attachedProduct && (Array.isArray(attachedProduct.images) ? attachedProduct.images[0] : attachedProduct.image)) || '/authentic/about_hero_pods.png';
            const displayBadge = item.productDiscountBadge || (displayRegularPrice && displayRegularPrice > displayPrice ? `${Math.round((1 - displayPrice / displayRegularPrice) * 100)}% OFF` : null);

            return (
              <div 
                key={item.id || idx}
                ref={(el) => { cardRefs.current[item.id] = el; }}
                className="relative group shrink-0 snap-start w-[240px] sm:w-[270px] md:w-[285px]"
              >
                {/* Sleek luxury card container matching user screenshot */}
                <div
                  onClick={() => setActiveVideoModal(item)}
                  onMouseEnter={(e) => {
                    if (isUpload) {
                      const vid = e.currentTarget.querySelector('video');
                      if (vid) {
                        vid.muted = isMuted;
                        vid.play().catch(() => {});
                      }
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isUpload) {
                      const vid = e.currentTarget.querySelector('video');
                      if (vid) {
                        vid.pause();
                        vid.currentTime = 0.5;
                      }
                    }
                  }}
                  className="relative aspect-[9/16] w-full rounded-3xl overflow-hidden bg-slate-950 shadow-md hover:shadow-2xl cursor-pointer flex flex-col justify-between transition-all duration-500 group-hover:-translate-y-2 select-none"
                >
                  {/* Media Background Layer (Uploaded Video Preview OR YouTube Thumbnail OR Custom Poster) */}
                  <div className="absolute inset-0 w-full h-full bg-slate-950 overflow-hidden">
                    {poster ? (
                      <img
                        src={poster}
                        alt={item.author || 'Reviewer'}
                        loading="lazy"
                        width="285"
                        height="506"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        onError={(e) => {
                          const ytId = extractYouTubeId(item.videoUrl);
                          if (ytId && !e.currentTarget.src.includes('hqdefault')) {
                            e.currentTarget.src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                          } else {
                            e.currentTarget.style.display = 'none';
                          }
                        }}
                      />
                    ) : isUpload ? (
                      /* Video Frame Preview for Uploaded MP4 files */
                      <video
                        src={`${item.videoUrl}#t=0.5`}
                        preload="none"
                        poster={poster || '/authentic/about_hero_pods.png'}
                        muted={isMuted}
                        loop
                        playsInline
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400">
                        <Video className="w-12 h-12 mb-2 text-slate-500" />
                        <span className="text-xs font-semibold">ভিডিও রিভিউ</span>
                      </div>
                    )}
                  </div>

                  {/* Gradient Overlays for Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/40 pointer-events-none" />

                  {/* Top Bar: Discount Badge (Left) & Sound Control (Right) */}
                  <div className="relative z-10 p-3 flex items-center justify-between">
                    {displayBadge ? (
                      <span className="bg-[#e11d48] text-white text-[10px] sm:text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                        {displayBadge}
                      </span>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-[10px] font-bold tracking-wide">
                          {item.pillTag || 'ভেরিফাইড ক্রেতা'}
                        </span>
                      </div>
                    )}

                    {/* Speaker / Mute Toggle Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleMute(e, item.id)}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer backdrop-blur-md active:scale-90 shadow-md"
                      title={isMuted ? "শব্দ চালু করুন (Unmute)" : "শব্দ বন্ধ করুন (Mute)"}
                    >
                      {isMuted ? (
                        <VolumeX className="w-3.5 h-3.5 text-white/90" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </button>
                  </div>

                  {/* Center: Frosted Glass Play Button on hover */}
                  <div className="relative z-10 flex items-center justify-center my-auto pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="relative">
                      <div className="absolute -inset-2 rounded-full bg-white/20 blur-xs transition-all duration-300" />
                      <div className="relative w-12 h-12 rounded-full bg-white/90 backdrop-blur-md text-slate-950 shadow-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                        <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Attached Product Overlay Card OR Customer Details */}
                  {hasAttachedProduct ? (
                    <div className="relative z-20 p-2.5 sm:p-3 mx-2 sm:mx-2.5 mb-2 sm:mb-2.5 bg-white/98 backdrop-blur-md rounded-2xl shadow-xl flex flex-col gap-2 border border-slate-100 text-left">
                      {/* Product details row */}
                      <div 
                        className="flex items-center gap-2.5 cursor-pointer group/prod"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (attachedProduct && onSelectProduct) {
                            onSelectProduct(attachedProduct);
                          } else if (item.productUrl) {
                            window.location.href = item.productUrl;
                          }
                        }}
                      >
                        <img 
                          src={displayImage} 
                          alt={displayTitle}
                          className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover shrink-0 border border-slate-100 bg-slate-50 shadow-2xs"
                          loading="lazy"
                        />
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover/prod:text-[#0369a1] transition-colors">
                            {displayTitle}
                          </h5>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-xs sm:text-sm font-black text-slate-900">
                              {formatPrice ? formatPrice(displayPrice) : `Tk. ${displayPrice.toLocaleString()}`}
                            </span>
                            {displayRegularPrice && displayRegularPrice > displayPrice && (
                              <span className="text-[10px] sm:text-[11px] text-slate-400 line-through font-normal">
                                {formatPrice ? formatPrice(displayRegularPrice) : `Tk. ${displayRegularPrice.toLocaleString()}`}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 flex items-center justify-center transition-colors shrink-0">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      {/* BUY NOW Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const targetProduct: Product = attachedProduct || ({
                            id: item.productId || `prod-${item.id}`,
                            title: displayTitle,
                            price: displayPrice,
                            regularPrice: displayRegularPrice,
                            images: [displayImage],
                            image: displayImage,
                            category: 'Laundry',
                            stock: 999,
                            rating: 5,
                            reviewsCount: 1,
                            unit: 'pack',
                            packSize: 1,
                            minOrderQuantity: 1,
                            volumeTierDiscounts: [],
                            bulkPricingTiers: [],
                            isBogo: false,
                            status: 'published'
                          } as Product);
                          if (onBuyNow) {
                            onBuyNow(targetProduct, 1);
                          } else if (onAddToCart) {
                            onAddToCart(targetProduct, 1);
                          }
                        }}
                        className="w-full py-2.5 px-3 bg-[#0a5289] hover:bg-[#08426f] active:bg-[#063051] text-white text-xs font-black rounded-xl transition-all shadow-xs active:scale-[0.98] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        BUY NOW
                      </button>
                    </div>
                  ) : (
                    /* Fallback: Customer Details & Quote if no product attached */
                    <div className="relative z-10 p-4 space-y-1.5 text-left">
                      <div className="flex items-center gap-1 text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                        <span className="text-[10px] font-bold text-white/90 ml-1">৫.০</span>
                      </div>
                      <h4 className="font-extrabold text-white text-sm sm:text-base tracking-tight leading-tight drop-shadow-md">
                        {item.author || 'সম্মানিত ক্রেতা'}
                      </h4>
                      {item.subtitle && (
                        <span className="inline-block text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                          {item.subtitle}
                        </span>
                      )}
                      {item.quote && (
                        <p className="text-[11px] text-slate-200/90 font-medium line-clamp-2 leading-relaxed drop-shadow-xs">
                          "{item.quote}"
                        </p>
                      )}
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Fullscreen Video Modal Player */}
      {activeVideoModal && (
        <div 
          onClick={() => setActiveVideoModal(null)}
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-white/10"
          >
            <button
              onClick={() => setActiveVideoModal(null)}
              className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center cursor-pointer transition shadow-lg border border-white/20"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {(() => {
              const embed = getEmbedVideoUrl(activeVideoModal.videoUrl);
              const poster = getVideoPosterUrl(activeVideoModal.posterUrl, activeVideoModal.videoUrl);

              if (embed.isIframe) {
                return (
                  <div className="relative aspect-[9/16] max-h-[85vh] w-full bg-black flex items-center justify-center">
                    <iframe
                      src={embed.url}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                );
              } else if (activeVideoModal.videoUrl) {
                return (
                  <div className="relative aspect-[9/16] max-h-[85vh] w-full bg-black flex items-center justify-center">
                    <video
                      src={activeVideoModal.videoUrl}
                      controls
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  </div>
                );
              } else if (poster) {
                return (
                  <div className="p-8 text-center text-white space-y-4">
                    <div className="relative aspect-[3/4] max-h-[50vh] w-auto mx-auto rounded-2xl overflow-hidden shadow-lg border border-white/10">
                      <img
                        src={poster}
                        alt={activeVideoModal.author}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1.5 text-left max-w-sm mx-auto pt-2">
                      {activeVideoModal.subtitle && (
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                          {activeVideoModal.subtitle}
                        </span>
                      )}
                      {activeVideoModal.quote && (
                        <p className="text-xs text-slate-200 font-medium leading-relaxed">
                          "{activeVideoModal.quote}"
                        </p>
                      )}
                      {activeVideoModal.author && (
                        <span className="text-xs font-bold text-white block pt-1">
                          — {activeVideoModal.author}
                        </span>
                      )}
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="p-8 text-center text-slate-400">
                    <Video className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                    <p className="text-xs">ভিডিও লিঙ্ক উপলব্ধ নেই</p>
                  </div>
                );
              }
            })()}

            {/* Modal Product Footer if attached */}
            {(() => {
              const modalAttachedProduct = activeVideoModal.productId ? products?.find(p => p.id === activeVideoModal.productId) : null;
              const hasProduct = Boolean(modalAttachedProduct || activeVideoModal.productId || activeVideoModal.productTitle);
              if (!hasProduct) return null;

              const title = activeVideoModal.productTitle || modalAttachedProduct?.title || 'Leaf Curt Pods';
              const price = activeVideoModal.productPrice ?? modalAttachedProduct?.price ?? 0;
              const regPrice = activeVideoModal.productRegularPrice ?? modalAttachedProduct?.regularPrice;
              const img = activeVideoModal.productImage || (modalAttachedProduct && (Array.isArray(modalAttachedProduct.images) ? modalAttachedProduct.images[0] : modalAttachedProduct.image)) || '/authentic/about_hero_pods.png';

              const targetProd: Product = modalAttachedProduct || ({
                id: activeVideoModal.productId || `prod-${activeVideoModal.id}`,
                title,
                price,
                regularPrice: regPrice,
                images: [img],
                image: img,
                category: 'Laundry',
                stock: 999,
                rating: 5,
                reviewsCount: 1,
                unit: 'pack',
                packSize: 1,
                minOrderQuantity: 1,
                volumeTierDiscounts: [],
                bulkPricingTiers: [],
                isBogo: false,
                status: 'published'
              } as Product);

              return (
                <div className="absolute bottom-3 inset-x-3 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 shadow-2xl flex items-center justify-between gap-3 border border-slate-100">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img src={img} alt={title} className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-100 bg-slate-50" />
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-slate-900 truncate">{title}</h5>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs sm:text-sm font-black text-slate-900">
                          {formatPrice ? formatPrice(price) : `Tk. ${price.toLocaleString()}`}
                        </span>
                        {regPrice && regPrice > price && (
                          <span className="text-[10px] text-slate-400 line-through">
                            {formatPrice ? formatPrice(regPrice) : `Tk. ${regPrice.toLocaleString()}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onBuyNow) {
                        onBuyNow(targetProd, 1);
                      } else if (onAddToCart) {
                        onAddToCart(targetProd, 1);
                      }
                      setActiveVideoModal(null);
                    }}
                    className="shrink-0 py-2.5 px-4 bg-[#0a5289] hover:bg-[#08426f] text-white text-xs font-black rounded-xl uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    BUY NOW
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </section>
  );
}
