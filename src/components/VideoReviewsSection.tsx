import React, { useState, useRef } from 'react';
import { Play, X, Video, ChevronLeft, ChevronRight, Star, ShieldCheck, Sparkles } from 'lucide-react';
import { VideoReviewsSettings, VideoReviewItem } from '../types';

interface VideoReviewsSectionProps {
  settings?: VideoReviewsSettings;
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

export default function VideoReviewsSection({ settings }: VideoReviewsSectionProps) {
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 320;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <section className="py-14 sm:py-20 bg-gradient-to-b from-white via-slate-50/50 to-white border-b border-slate-100 overflow-hidden relative" id="video-reviews-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title with Hand-Drawn Colorful Curved Underline (Same as Featured Products) */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
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
              {/* Playful, organic hand-drawn curved stroke */}
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

            return (
              <div 
                key={item.id || idx}
                className="relative group shrink-0 snap-start w-[240px] sm:w-[270px] md:w-[285px]"
              >
                {/* Clean, sleek luxury card without border lines */}
                <div
                  onClick={() => setActiveVideoModal(item)}
                  onMouseEnter={(e) => {
                    if (isUpload) {
                      const vid = e.currentTarget.querySelector('video');
                      if (vid) vid.play().catch(() => {});
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
                  className="relative aspect-[9/16] w-full rounded-3xl overflow-hidden bg-slate-950 shadow-md hover:shadow-2xl cursor-pointer flex flex-col justify-between transition-all duration-500 group-hover:-translate-y-2"
                >
                  {/* Media Background Layer (Uploaded Video Preview OR YouTube Thumbnail OR Custom Poster) */}
                  <div className="absolute inset-0 w-full h-full bg-slate-950 overflow-hidden">
                    {poster ? (
                      <img
                        src={poster}
                        alt={item.author || 'Reviewer'}
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
                      /* Live Video Frame Preview for Uploaded MP4 files */
                      <video
                        src={`${item.videoUrl}#t=0.5`}
                        preload="metadata"
                        muted
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/40 pointer-events-none" />

                  {/* Top Bar: Verified Customer Badge */}
                  <div className="relative z-10 p-3.5 flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-[10px] font-bold tracking-wide">
                        {item.pillTag || 'ভেরিফাইড ক্রেতা'}
                      </span>
                    </div>

                    <div className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    </div>
                  </div>

                  {/* Center: Frosted Glass Play Button with Ripple */}
                  <div className="relative z-10 flex items-center justify-center my-auto">
                    <div className="relative">
                      <div className="absolute -inset-2 rounded-full bg-white/20 group-hover:bg-white/40 blur-xs transition-all duration-300 animate-pulse" />
                      <div className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-white/90 backdrop-blur-md text-slate-950 shadow-2xl flex items-center justify-center group-hover:scale-115 group-hover:bg-white active:scale-95 transition-all duration-300">
                        <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-slate-950 ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Customer Details & Quote */}
                  <div className="relative z-10 p-4 space-y-1.5 text-left">
                    {/* Star Rating */}
                    <div className="flex items-center gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                      <span className="text-[10px] font-bold text-white/90 ml-1">৫.০</span>
                    </div>

                    {/* Reviewer Name */}
                    <h4 className="font-extrabold text-white text-sm sm:text-base tracking-tight leading-tight drop-shadow-md">
                      {item.author || 'সম্মানিত ক্রেতা'}
                    </h4>

                    {/* Subtitle / Topic tag */}
                    {item.subtitle && (
                      <span className="inline-block text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                        {item.subtitle}
                      </span>
                    )}

                    {/* Quote */}
                    {item.quote && (
                      <p className="text-[11px] text-slate-200/90 font-medium line-clamp-2 leading-relaxed drop-shadow-xs">
                        "{item.quote}"
                      </p>
                    )}

                    {/* Play Hint */}
                    <div className="pt-1 flex items-center gap-1 text-[10px] text-white/70 font-semibold group-hover:text-white transition-colors">
                      <span>ভিডিও দেখতে ক্লিক করুন</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>

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
              const isUpload = isDirectVideo(activeVideoModal.videoUrl);

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
          </div>
        </div>
      )}
    </section>
  );
}
