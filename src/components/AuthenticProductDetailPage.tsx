import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, Mail, Globe, Clock, Package, ClipboardCheck, ShieldCheck, 
  ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX, Maximize, 
  Share2, Send, Check, X, ZoomIn, ArrowUp, ExternalLink, Sparkles, 
  Layers, MessageCircle, ChevronDown, Menu, CheckCircle2, Copy, Star,
  ShoppingBag, Zap
} from 'lucide-react';
import { Product, ProductSpecRow, ProductFeatureCard, HeaderSettings } from '../types';
import { DEFAULT_HEADER_SETTINGS } from '../lib/constants';
import { dbService } from '../lib/dbService';
import ProductReviewsSection from './ProductReviewsSection';

interface AuthenticProductDetailPageProps {
  product: Product;
  headerSettings?: HeaderSettings;
  onNavigateHome?: () => void;
  onNavigateCategory?: (category: string) => void;
  onRequestQuote?: (product: Product) => void;
  onAddToCart?: (product: Product, quantity?: number) => void;
  onBuyNow?: (product: Product, quantity?: number) => void;
  formatPrice?: (price: number) => string;
}

export default function AuthenticProductDetailPage({
  product,
  headerSettings,
  onNavigateHome,
  onNavigateCategory,
  onRequestQuote,
  onAddToCart,
  onBuyNow,
  formatPrice
}: AuthenticProductDetailPageProps) {
  // Combine all product images (cover image + additional images)
  const allImages = useMemo(() => {
    const list: string[] = [];
    if (product.coverImage) list.push(product.coverImage);
    else if (product.image) list.push(product.image);

    const extra = product.additionalImages || product.images || [];
    extra.forEach(img => {
      if (img && !list.includes(img)) list.push(img);
    });

    if (list.length === 0) {
      list.push('/authentic/pod_triple_chamber_main.png');
      list.push('/authentic/pod_packaging_boxes.png');
      list.push('/authentic/thumb_1_overview.png');
      list.push('/authentic/thumb_2_style1_red.png');
      list.push('/authentic/thumb_3_style2_heart.png');
      list.push('/authentic/thumb_4_style3_beads.png');
      list.push('/authentic/thumb_5_style4_green.png');
    }
    return list;
  }, [product]);

  // Gallery & Media State
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(product.galleryAutoScroll ?? true);
  const [isHoveredGallery, setIsHoveredGallery] = useState<boolean>(false);
  const [isZoomOpen, setIsZoomOpen] = useState<boolean>(false);
  const [isShowingVideoInMain, setIsShowingVideoInMain] = useState<boolean>(false);
  
  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<'specification' | 'features' | 'video' | 'reviews'>('specification');

  // Quantity Stepper State for E-Commerce Actions
  const [quantity, setQuantity] = useState<number>(1);

  const formatPriceText = (priceVal?: number) => {
    if (typeof priceVal !== 'number') return 'Tk.0';
    if (formatPrice) return formatPrice(priceVal);
    const bdt = priceVal < 100 ? Math.round(priceVal * 120) : Math.round(priceVal);
    return `Tk.${bdt.toLocaleString('en-US')}`;
  };

  // Modals & Floating Drawer State
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState<boolean>(false);
  const [isWeChatModalOpen, setIsWeChatModalOpen] = useState<boolean>(false);
  const [isSideBarExpanded, setIsSideBarExpanded] = useState<boolean>(true);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [copiedWeChat, setCopiedWeChat] = useState<boolean>(false);

  // Quote Form State
  const [quoteForm, setQuoteForm] = useState({
    fullName: '',
    company: '',
    email: '',
    phone: '',
    quantity: '100,000',
    packaging: 'Pouches / Bags',
    fragrance: 'Sweet Peach',
    notes: ''
  });
  const [quoteSubmitted, setQuoteSubmitted] = useState<boolean>(false);

  // Video Player State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(true);
  const [videoProgress, setVideoProgress] = useState<number>(0);

  // Thumbnails Container Ref for automatic horizontal scrolling
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  // Live Header Settings (synced from admin panel)
  const [liveHeaderSettings, setLiveHeaderSettings] = useState<HeaderSettings>(() => {
    return headerSettings || DEFAULT_HEADER_SETTINGS;
  });

  useEffect(() => {
    if (headerSettings) {
      setLiveHeaderSettings(headerSettings);
    }
    const fetchSettings = async () => {
      try {
        const ecom = await dbService.getEcomSettings();
        if (ecom?.headerSettings) {
          setLiveHeaderSettings({
            ...DEFAULT_HEADER_SETTINGS,
            ...ecom.headerSettings,
            socialLinks: {
              ...DEFAULT_HEADER_SETTINGS.socialLinks,
              ...(ecom.headerSettings.socialLinks || {})
            },
            menuItems: ecom.headerSettings.menuItems?.length
              ? ecom.headerSettings.menuItems
              : DEFAULT_HEADER_SETTINGS.menuItems
          });
        }
      } catch (e) {
        console.warn('Failed loading headerSettings:', e);
      }
    };
    fetchSettings();

    const handleUpdate = () => {
      fetchSettings();
    };
    window.addEventListener('ecom-settings-updated', handleUpdate);
    return () => window.removeEventListener('ecom-settings-updated', handleUpdate);
  }, [headerSettings]);

  // Scroll to top listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll / move gallery effect
  useEffect(() => {
    if (!isAutoScrolling || isHoveredGallery || allImages.length <= 1 || isShowingVideoInMain) {
      return;
    }
    const intervalSeconds = product.galleryScrollInterval || 4;
    const timer = setInterval(() => {
      setActiveImageIndex(prev => (prev + 1) % allImages.length);
    }, intervalSeconds * 1000);

    return () => clearInterval(timer);
  }, [isAutoScrolling, isHoveredGallery, allImages.length, isShowingVideoInMain, product.galleryScrollInterval]);

  // Keep active thumbnail visible in horizontal scroll
  useEffect(() => {
    if (thumbnailContainerRef.current) {
      const container = thumbnailContainerRef.current;
      const activeThumb = container.children[activeImageIndex] as HTMLElement;
      if (activeThumb) {
        const thumbLeft = activeThumb.offsetLeft;
        const thumbWidth = activeThumb.offsetWidth;
        const containerWidth = container.offsetWidth;
        const scrollTarget = thumbLeft - containerWidth / 2 + thumbWidth / 2;
        container.scrollTo({ left: scrollTarget, behavior: 'smooth' });
      }
    }
  }, [activeImageIndex]);

  // Video Time Update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration || 1;
      setVideoProgress((current / duration) * 100);
    }
  };

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      } else {
        videoRef.current.play();
        setIsVideoPlaying(true);
      }
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

    const currentSpecTable = (product.specTable && product.specTable.length > 0)
    ? product.specTable
    : [
        { feature: 'Product Type', details: '5-in-1 Laundry Detergent Pods' },
        { feature: 'Formula', details: 'Concentrated Bio-Enzyme + Fabric Softener' },
        { feature: 'Machine Safety', details: 'HE, Front-Load, Top-Load Compatible' },
        { feature: 'Skin Safety', details: 'Neutral pH, Phosphorus & Bleach Free' },
        { feature: 'Packaging', details: 'Pressure Resistant (600N), Easy-Rinse' }
      ];

  const currentSpecList = useMemo(() => {
    if (product.specificationsList && product.specificationsList.length > 0) {
      if (typeof product.specificationsList[0] === 'string') {
        return (product.specificationsList as string[]).map((str, idx) => ({
          title: `${idx + 1}. Specification Detail`,
          description: str
        }));
      }
      return product.specificationsList as { title: string; description: string }[];
    }
    return [];
  }, [product.specificationsList]);

  const currentKeyFeatures = (product.keyFeatureCards && product.keyFeatureCards.length > 0)
    ? product.keyFeatureCards
    : [];

  const renderFeatureIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case 'globe':
        return <Globe className="w-5 h-5 text-[#162963]" />;
      case 'clock':
        return <Clock className="w-5 h-5 text-[#162963]" />;
      case 'box':
      case 'package':
        return <Package className="w-5 h-5 text-[#162963]" />;
      case 'check':
      case 'checklist':
      case 'quality':
        return <ClipboardCheck className="w-5 h-5 text-[#162963]" />;
      case 'shield':
        return <ShieldCheck className="w-5 h-5 text-[#162963]" />;
      default:
        return <Sparkles className="w-5 h-5 text-[#162963]" />;
    }
  };

  const whatsappPhone = liveHeaderSettings.phone || product.whatsappNumber || '';
  const cleanPhone = whatsappPhone.replace(/\D/g, '');
  const encodedWhatsappMsg = encodeURIComponent(
    product.whatsappMessage || `Hello ${liveHeaderSettings.brandName || 'Store'}! I am interested in getting more information about ${product.title}.`
  );
  const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodedWhatsappMsg}` : '';

  const facebookUrl = liveHeaderSettings.socialLinks?.facebook || product.facebookUrl || '';
  const linkedinUrl = liveHeaderSettings.socialLinks?.linkedin || product.linkedinUrl || '';
  const youtubeUrl = liveHeaderSettings.socialLinks?.youtube || '';
  const instagramUrl = liveHeaderSettings.socialLinks?.instagram || '';
  const tiktokUrl = liveHeaderSettings.socialLinks?.tiktok || '';
  const displayEmail = liveHeaderSettings.email || product.contactEmail || '';
  const displayPhone = liveHeaderSettings.phone || '';

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteSubmitted(true);
    setTimeout(() => {
      setQuoteSubmitted(false);
      setIsQuoteModalOpen(false);
      if (onRequestQuote) onRequestQuote(product);
    }, 1800);
  };

  const handleCtaClick = () => {
    if (liveHeaderSettings.ctaActionType === 'custom_link' && liveHeaderSettings.ctaButtonLink) {
      if (liveHeaderSettings.ctaButtonLink.startsWith('#')) {
        setIsQuoteModalOpen(true);
      } else {
        window.location.href = liveHeaderSettings.ctaButtonLink;
      }
    } else {
      setIsQuoteModalOpen(true);
    }
  };

  const videoUrl = product.videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-liquid-soap-bubble-close-up-view-40763-large.mp4';
  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');

  const menuItemsToRender = liveHeaderSettings.menuItems?.length 
    ? liveHeaderSettings.menuItems 
    : DEFAULT_HEADER_SETTINGS.menuItems;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-[#1a2b6b] selection:text-white">
      
      {/* ============================================================
          1. TOP CONTACT & SOCIAL BAR (Dynamic from Admin Panel)
          ============================================================ */}
      {liveHeaderSettings.showTopBar !== false && (
        <div className="bg-[#1a2b6b] text-white text-xs py-2 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            
            {/* Left: Phone & Email */}
            <div className="flex items-center gap-6 text-[13px] tracking-wide">
              {displayPhone && (
                <a 
                  href={`tel:${displayPhone.replace(/\s+/g, '')}`} 
                  className="flex items-center gap-2 hover:text-blue-200 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 fill-current" />
                  <span>{displayPhone}</span>
                </a>
              )}
              {displayEmail && (
                <a 
                  href={`mailto:${displayEmail}`} 
                  className="flex items-center gap-2 hover:text-blue-200 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 fill-current" />
                  <span>{displayEmail}</span>
                </a>
              )}
            </div>

            {/* Right: Social Media Icons */}
            <div className="flex items-center gap-4 text-white">
              {facebookUrl && (
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-200 transition-colors" title="Facebook">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}

              {youtubeUrl && (
                <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-200 transition-colors" title="YouTube">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              )}

              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-200 transition-colors" title="Instagram">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}

              {linkedinUrl && (
                <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-200 transition-colors" title="LinkedIn">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
              )}

              {tiktokUrl && (
                <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-200 transition-colors" title="TikTok">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </a>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ============================================================
          2. AUTHENTIC NAVBAR (Dynamic Logo, Links & CTA Button)
          ============================================================ */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div 
            onClick={onNavigateHome}
            className="flex items-center gap-3 cursor-pointer group"
          >
            {liveHeaderSettings.logoUrl ? (
              <img 
                src={liveHeaderSettings.logoUrl} 
                alt={liveHeaderSettings.brandName || "Store"}
                className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {liveHeaderSettings.brandName || "Store"}
              </span>
            )}
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-[15px] font-medium text-slate-800">
            {menuItemsToRender.map((item) => (
              <div key={item.id} className="relative group py-2">
                <a
                  href={item.link || '#'}
                  onClick={(e) => {
                    if (item.hasDropdown && item.dropdownItems && item.dropdownItems.length > 0) {
                      e.preventDefault();
                    }
                  }}
                  className="flex items-center gap-1 hover:text-[#162963] transition-colors cursor-pointer"
                >
                  <span>{item.label}</span>
                  {item.hasDropdown && (
                    <ChevronDown className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform text-slate-400" />
                  )}
                </a>

                {/* Dropdown Menu */}
                {item.hasDropdown && item.dropdownItems && item.dropdownItems.length > 0 && (
                  <div className="absolute top-full left-0 pt-2 opacity-0 translate-y-1 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible transition-all duration-200 z-50">
                    <div className="w-60 bg-white rounded-xl shadow-xl border border-slate-100 py-2.5">
                      {item.dropdownItems.map((sub, sIdx) => (
                        <a
                          key={sIdx}
                          href={sub.link}
                          className="block px-4 py-2 text-xs font-semibold text-slate-700 hover:text-[#162963] hover:bg-slate-50 transition-colors"
                        >
                          {sub.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right Action: Get A Quote Button */}
          <div className="flex items-center gap-3">
            {liveHeaderSettings.showCtaButton !== false && (
              <button
                onClick={handleCtaClick}
                className="hidden sm:inline-flex items-center gap-2 bg-gradient-to-r from-[#0284c7] to-[#16a34a] hover:from-[#0369a1] hover:to-[#15803d] text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
              >
                <span>{liveHeaderSettings.ctaButtonText || 'Get A Quote'}</span>
                <span className="text-base font-bold">→</span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="lg:hidden p-2 text-slate-700 hover:text-slate-900 focus:outline-none"
            >
              {isMobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileNavOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-3 text-sm font-medium animate-fadeIn">
            {menuItemsToRender.map((item) => (
              <div key={item.id} className="space-y-1">
                <a
                  href={item.link}
                  className="block py-1 text-slate-800 font-semibold"
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  {item.label}
                </a>
                {item.hasDropdown && item.dropdownItems && (
                  <div className="pl-4 space-y-1">
                    {item.dropdownItems.map((sub, sIdx) => (
                      <a
                        key={sIdx}
                        href={sub.link}
                        className="block py-1 text-xs text-slate-600 hover:text-[#162963]"
                        onClick={() => setIsMobileNavOpen(false)}
                      >
                        • {sub.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {liveHeaderSettings.showCtaButton !== false && (
              <button
                onClick={() => {
                  setIsMobileNavOpen(false);
                  handleCtaClick();
                }}
                className="w-full mt-2 bg-[#162963] text-white py-2.5 rounded-full font-semibold text-center"
              >
                {liveHeaderSettings.ctaButtonText || 'Get A Quote'} →
              </button>
            )}
          </div>
        )}
      </header>

      {/* ============================================================
          3. MAIN PRODUCT SHOWCASE (2 COLUMNS)
          ============================================================ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
        
        {/* Category Line / Breadcrumbs (Exact match to Screenshot 3) */}
        <div className="mb-4 sm:mb-6 text-sm">
          <span className="font-bold text-[#162963]">Categories </span>
          <span className="text-slate-700 font-medium cursor-pointer hover:underline">
            {product.category || 'Laundry Detergent Pods'}, Products
          </span>
        </div>

        {/* 2-Column Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* ============================================================
              LEFT COLUMN: ADVANCED HERO GALLERY WITH SMOOTH TRANSITION
              ============================================================ */}
          <div className="lg:col-span-6 flex flex-col space-y-4">
            
            {/* Main Cover Image Box */}
            <div 
              onMouseEnter={() => setIsHoveredGallery(true)}
              onMouseLeave={() => setIsHoveredGallery(false)}
              className="relative aspect-square w-full bg-[#f8f9fb] rounded-xl overflow-hidden border border-slate-200/90 shadow-sm flex items-center justify-center group select-none"
            >
              {/* Media Display: Video or Smooth Image Transition */}
              {isShowingVideoInMain ? (
                <div className="w-full h-full relative bg-black flex items-center justify-center">
                  {isYouTube ? (
                    <iframe
                      src={videoUrl.replace('watch?v=', 'embed/')}
                      title="Product Video"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-cover"
                    />
                  )}
                  <button
                    onClick={() => setIsShowingVideoInMain(false)}
                    className="absolute top-3 right-3 bg-white/80 hover:bg-white text-slate-800 rounded-full p-2 text-xs font-bold transition shadow-md cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeImageIndex}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full h-full flex items-center justify-center relative cursor-zoom-in"
                    onClick={() => setIsZoomOpen(true)}
                  >
                    <img 
                      src={allImages[activeImageIndex] || product.coverImage} 
                      alt={product.title}
                      className="w-full h-full object-cover sm:object-contain"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/authentic/pod_triple_chamber_main.png';
                      }}
                    />

                    {/* Optional Floating Overlay Badge (like in screenshot: 25g/pcs, clothes capacity, etc.) */}
                    {activeImageIndex === 0 && (product.weightBadge || product.bottomBannerBadge) && (
                      <div className="absolute bottom-3 inset-x-3 pointer-events-none">
                        <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-lg p-2.5 shadow-sm text-center">
                          <div className="flex items-center justify-around text-[11px] font-semibold text-slate-800">
                            <span>{product.weightBadge || 'Basis weight: 25g/pcs'}</span>
                            <span className="text-slate-300">|</span>
                            <span>{product.capacityBadge || '1 pod ~24-28pcs clothes'}</span>
                            <span className="text-slate-300">|</span>
                            <span>{product.sizeBadge || 'Size: 6*6*2cm'}</span>
                          </div>
                          {product.bottomBannerBadge && (
                            <div className="mt-1.5 inline-block bg-[#162963] text-white text-[11px] font-medium px-4 py-0.5 rounded-full">
                              {product.bottomBannerBadge}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}

              {/* Prev / Next Chevrons on Main Image */}
              {!isShowingVideoInMain && allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1));
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white text-slate-800 border border-slate-200 rounded-md flex items-center justify-center transition-all shadow-sm hover:shadow-md cursor-pointer z-10"
                    title="Previous Image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white text-slate-800 border border-slate-200 rounded-md flex items-center justify-center transition-all shadow-sm hover:shadow-md cursor-pointer z-10"
                    title="Next Image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Zoom Action Icon */}
              {!isShowingVideoInMain && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsZoomOpen(true);
                  }}
                  className="absolute bottom-3 right-3 p-2 bg-white/80 hover:bg-white text-slate-700 rounded-lg shadow-sm border border-slate-200/80 transition-colors cursor-pointer z-10"
                  title="Fullscreen Zoom"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              )}

              {/* Auto Scroll Progress indicator */}
              {isAutoScrolling && !isHoveredGallery && !isShowingVideoInMain && allImages.length > 1 && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-slate-200/60 z-20">
                  <motion.div
                    key={activeImageIndex}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: product.galleryScrollInterval || 4, ease: 'linear' }}
                    className="h-full bg-[#162963]"
                  />
                </div>
              )}
            </div>

            {/* Thumbnail Strip / Carousel with Auto-Scroll & Move (User's specific highlight) */}
            <div className="relative flex items-center gap-2 pt-1">
              
              {/* Prev Thumbnail Arrow */}
              <button
                type="button"
                onClick={() => {
                  setActiveImageIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1));
                }}
                className="w-7 h-16 sm:h-20 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md flex items-center justify-center text-slate-600 shrink-0 transition-colors cursor-pointer"
                title="Scroll Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Horizontally Scrollable Thumbnails Container */}
              <div 
                ref={thumbnailContainerRef}
                onMouseEnter={() => setIsHoveredGallery(true)}
                onMouseLeave={() => setIsHoveredGallery(false)}
                className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1 scroll-smooth flex-1"
              >
                {allImages.map((img, idx) => {
                  const isActive = activeImageIndex === idx && !isShowingVideoInMain;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setIsShowingVideoInMain(false);
                        setActiveImageIndex(idx);
                      }}
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-md border-2 overflow-hidden shrink-0 transition-all cursor-pointer bg-slate-50 ${
                        isActive 
                          ? 'border-[#162963] ring-2 ring-[#162963]/20 shadow-sm scale-102' 
                          : 'border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img 
                        src={img} 
                        alt={`Thumb ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/authentic/pod_triple_chamber_main.png';
                        }}
                      />
                      {isActive && (
                        <div className="absolute bottom-0 inset-x-0 h-1 bg-[#162963]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Next Thumbnail Arrow */}
              <button
                type="button"
                onClick={() => {
                  setActiveImageIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1));
                }}
                className="w-7 h-16 sm:h-20 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md flex items-center justify-center text-slate-600 shrink-0 transition-colors cursor-pointer"
                title="Scroll Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

            </div>



          </div>

          {/* ============================================================
              RIGHT COLUMN: PRODUCT DETAILS & PURCHASE ACTIONS
              ============================================================ */}
          <div className="lg:col-span-6 flex flex-col space-y-5">
            
            {/* 1. Product Title */}
            <div>
              <h1 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#033b75] tracking-tight leading-snug">
                {product.title}
              </h1>
              {product.series && (
                <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
                  সিরিজ: <span className="text-[#0279c7] font-semibold">{product.series}</span>
                </p>
              )}
            </div>

            {/* 2. Rating & Stock Indicator */}
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
                <span className="font-bold text-slate-800 ml-1">5.0</span>
                <span className="text-slate-500">(100% ইতিবাচক রিভিউ)</span>
              </div>
              <span className="text-slate-300">|</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ইন স্টক (Ready to Ship)
              </span>
            </div>

            {/* 3. Price Display */}
            <div className="p-4 rounded-2xl bg-[#f8fafc] border border-slate-200 flex flex-wrap items-baseline gap-3 shadow-2xs">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#033b75]">
                {formatPriceText(product.price)}
              </span>
              {(product.regularPrice || product.price > 0) && (
                <span className="text-base sm:text-lg text-slate-400 line-through">
                  {formatPriceText(product.regularPrice || Math.round(product.price * 1.25))}
                </span>
              )}
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-md">
                {product.discountPercentage ? `SAVE ${product.discountPercentage}%` : 'বিশেষ মূল্যছাড়'}
              </span>
            </div>

            {/* 4. Quantity Stepper + ADD TO CART & BUY NOW Buttons */}
            <div className="space-y-3.5 pt-1">
              <div className="flex items-center gap-3">
                <span className="text-xs sm:text-sm font-bold text-slate-700">পরিমাণ:</span>
                <div className="inline-flex items-center border-2 border-slate-300 rounded-xl bg-white overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors font-bold text-base cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-bold text-sm text-slate-900 select-none">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => prev + 1)}
                    className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors font-bold text-base cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons: ADD TO CART & BUY NOW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* ADD TO CART */}
                <button
                  type="button"
                  onClick={() => onAddToCart && onAddToCart(product, quantity)}
                  className="w-full bg-[#033b75] hover:bg-[#022a54] text-white py-3.5 px-6 rounded-xl font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>ADD TO CART</span>
                </button>

                {/* BUY NOW */}
                <button
                  type="button"
                  onClick={() => onBuyNow && onBuyNow(product, quantity)}
                  className="w-full bg-gradient-to-r from-[#0284c7] to-[#16a34a] hover:from-[#0369a1] hover:to-[#15803d] text-white py-3.5 px-6 rounded-xl font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>BUY NOW</span>
                </button>
              </div>
            </div>

            {/* 5. Trust Assurances */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-sky-50/60 rounded-xl border border-sky-100 text-center text-[11px] sm:text-xs text-slate-700 font-medium">
              <div className="flex flex-col items-center gap-0.5">
                <span>🚚 সারা দেশে ক্যাশ অন ডেলিভারি</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 border-x border-sky-200/60 px-1">
                <span>🛡️ ১০০% আসল ও মানসম্মত</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span>⚡ দ্রুততম হোম ডেলিভারি</span>
              </div>
            </div>

            {/* Structured Specifications Table (Screenshot 3 & 4) */}
            <div className="border border-slate-300 rounded-md overflow-hidden bg-white shadow-2xs">
              <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-300 py-3 px-4 text-xs font-bold text-slate-800">
                <div className="col-span-4 sm:col-span-3">Feature</div>
                <div className="col-span-8 sm:col-span-9">Details</div>
              </div>

              <div className="divide-y divide-slate-200 text-xs sm:text-[13px]">
                {currentSpecTable.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 py-3 px-4 hover:bg-slate-50/70 transition-colors">
                    <div className="col-span-4 sm:col-span-3 font-medium text-slate-800 pr-2 leading-relaxed">
                      {row.feature}
                    </div>
                    <div className="col-span-8 sm:col-span-9 text-slate-700 whitespace-pre-line leading-relaxed">
                      {row.details}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Contact & Social Share Buttons */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {/* WhatsApp Button */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white py-2.5 px-3 rounded-md text-xs sm:text-sm font-semibold transition shadow-xs active:scale-95"
              >
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.1-.477-.15-.678.15-.2.301-.778.978-.953 1.179-.176.201-.351.226-.652.075-.301-.15-1.272-.469-2.424-1.496-.897-.798-1.503-1.784-1.679-2.085-.176-.301-.019-.464.132-.614.135-.135.301-.351.451-.527.151-.176.201-.301.302-.502.1-.201.05-.377-.025-.527-.075-.15-.678-1.633-.929-2.235-.244-.587-.492-.507-.678-.517-.176-.01-.377-.01-.578-.01s-.527.075-.803.377c-.276.301-1.054 1.03-1.054 2.512 0 1.482 1.079 2.912 1.23 3.113.151.201 2.124 3.243 5.146 4.55.719.311 1.28.497 1.718.636.722.23 1.378.197 1.898.12.579-.087 1.78-.727 2.031-1.429.251-.702.251-1.304.176-1.429-.075-.125-.276-.201-.577-.351zM12.042 21.928c-1.789 0-3.541-.482-5.074-1.393l-.364-.216-3.771.989 1.006-3.676-.237-.377a9.88 9.88 0 0 1-1.517-5.263c0-5.46 4.44-9.902 9.905-9.902 2.646 0 5.132 1.031 7.001 2.902a9.843 9.843 0 0 1 2.897 7.001c0 5.462-4.441 9.904-9.906 9.904zM12.042 0C5.39 0 0 5.39 0 12.042c0 2.123.555 4.197 1.609 6.023L0 24l6.108-1.603a11.982 11.982 0 0 0 5.934 1.564c6.652 0 12.042-5.39 12.042-12.042C24.084 5.39 18.694 0 12.042 0z"/>
                </svg>
                <span className="truncate">WhatsApp</span>
              </a>

              {/* Facebook Button */}
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#166fe5] text-white py-2.5 px-3 rounded-md text-xs sm:text-sm font-semibold transition shadow-xs active:scale-95"
              >
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="truncate">Facebook</span>
              </a>
            </div>

          </div>

        </div>

        {/* ============================================================
            4. TABS SECTION: SPECIFICATION, KEY FEATURES, PRODUCT VIDEO
            (Screenshots 1, 2, 4)
            ============================================================ */}
        <section className="mt-14 sm:mt-18 pt-8 border-t border-slate-200">
          
          {/* 3 Nav Tabs */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-8">
            {/* Tab 1: Product Specification */}
            <button
              onClick={() => setActiveTab('specification')}
              className={`py-3 px-6 sm:px-8 text-xs sm:text-sm font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'specification'
                  ? 'bg-[#162963] text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Product Specification
            </button>

            {/* Tab 2: Key Features */}
            <button
              onClick={() => setActiveTab('features')}
              className={`py-3 px-6 sm:px-8 text-xs sm:text-sm font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'features'
                  ? 'bg-[#162963] text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Key Features
            </button>

            {/* Tab 3: Product Video (Highlighted by user in red box in screenshot 4) */}
            <button
              onClick={() => setActiveTab('video')}
              className={`relative py-3 px-6 sm:px-8 text-xs sm:text-sm font-semibold rounded-md transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'video'
                  ? 'bg-[#162963] text-white shadow-sm ring-2 ring-[#162963]/30'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Product Video</span>
              {product.hasVideo && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            {/* Tab 4: Customer Reviews (Verified Buyer Orders & Reviews) */}
            <button
              onClick={() => setActiveTab('reviews')}
              className={`relative py-3 px-6 sm:px-8 text-xs sm:text-sm font-semibold rounded-md transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'reviews'
                  ? 'bg-[#162963] text-white shadow-sm ring-2 ring-[#162963]/30'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
              <span>Customer Reviews</span>
            </button>
          </div>

          {/* TAB CONTENT 1: PRODUCT SPECIFICATION (Screenshot 2) */}
          {activeTab === 'specification' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 max-w-5xl"
            >
              {currentSpecList.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>
              ))}
            </motion.div>
          )}

          {/* TAB CONTENT 2: KEY FEATURES (Screenshot 1) */}
          {activeTab === 'features' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 sm:space-y-8 max-w-5xl"
            >
              {currentKeyFeatures.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-4 sm:gap-5">
                  {/* Circular Blue Icon */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-50 border border-blue-200/80 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    {renderFeatureIcon(feat.icon || 'globe')}
                  </div>

                  {/* Feature Text */}
                  <div className="space-y-1.5 flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-[#162963] tracking-tight">
                      {feat.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      {feat.description}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* TAB CONTENT 3: PRODUCT VIDEO (Screenshot 4) */}
          {activeTab === 'video' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-5xl space-y-6"
            >
              {/* High Quality Video Player Frame */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 shadow-xl border border-slate-800 flex items-center justify-center group">
                {isYouTube ? (
                  <iframe
                    src={videoUrl.replace('watch?v=', 'embed/')}
                    title="Product Demonstration Video"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      poster={product.videoPoster || allImages[1] || allImages[0]}
                      onTimeUpdate={handleTimeUpdate}
                      onEnded={() => setIsVideoPlaying(false)}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={toggleVideoPlay}
                    />

                    {/* Big Center Play Overlay Button if paused */}
                    {!isVideoPlaying && (
                      <div 
                        onClick={toggleVideoPlay}
                        className="absolute inset-0 bg-black/40 backdrop-blur-2xs flex flex-col items-center justify-center cursor-pointer transition-opacity group-hover:bg-black/30"
                      >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#162963]/90 hover:bg-[#162963] text-white flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95">
                          <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-current translate-x-1" />
                        </div>
                        <span className="text-white text-xs sm:text-sm font-semibold mt-3 tracking-wide drop-shadow">
                          Watch Manufacturing & Packaging Demonstration
                        </span>
                      </div>
                    )}

                    {/* Custom Video Controls Bar */}
                    <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Progress Line */}
                      <div 
                        className="w-full h-1.5 bg-white/30 rounded-full cursor-pointer overflow-hidden"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const pos = (e.clientX - rect.left) / rect.width;
                          if (videoRef.current) {
                            videoRef.current.currentTime = pos * (videoRef.current.duration || 1);
                          }
                        }}
                      >
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${videoProgress}%` }}
                        />
                      </div>

                      {/* Control Icons */}
                      <div className="flex items-center justify-between text-white text-xs">
                        <div className="flex items-center gap-3">
                          <button onClick={toggleVideoPlay} className="p-1 hover:text-blue-300 cursor-pointer">
                            {isVideoPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                          </button>
                          <button 
                            onClick={() => {
                              if (videoRef.current) {
                                videoRef.current.muted = !isVideoMuted;
                                setIsVideoMuted(!isVideoMuted);
                              }
                            }} 
                            className="p-1 hover:text-blue-300 cursor-pointer"
                          >
                            {isVideoMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                          </button>
                          <span className="text-[11px] text-white/80">3-in-1 Laundry Pods Quality Video</span>
                        </div>

                        <button 
                          onClick={() => {
                            if (videoRef.current) {
                              if (videoRef.current.requestFullscreen) {
                                videoRef.current.requestFullscreen();
                              }
                            }
                          }}
                          className="p-1 hover:text-blue-300 cursor-pointer"
                        >
                          <Maximize className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB CONTENT 4: CUSTOMER REVIEWS */}
          {activeTab === 'reviews' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-5xl"
            >
              <ProductReviewsSection
                product={product}
                accentColor="#162963"
              />
            </motion.div>
          )}

        </section>

      </main>



      {/* ============================================================
          6. SCROLL TO TOP BUTTON (Screenshot 3 & 4 bottom right)
          ============================================================ */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-30 w-11 h-11 rounded-full bg-white border border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400 shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* ============================================================
          7. FULLSCREEN IMAGE ZOOM MODAL
          ============================================================ */}
      <AnimatePresence>
        {isZoomOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setIsZoomOpen(false)}
          >
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="relative max-w-4xl max-h-[85vh] flex items-center justify-center">
              <img 
                src={allImages[activeImageIndex] || product.coverImage} 
                alt="Fullscreen Preview"
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />

              {allImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1));
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center transition cursor-pointer"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center transition cursor-pointer"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================
          8. REQUEST A QUOTE MODAL
          ============================================================ */}
      <AnimatePresence>
        {isQuoteModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
            >
              {/* Modal Header */}
              <div className="bg-[#162963] text-white px-6 py-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Request Product Inquiry & Quote</h3>
                  <p className="text-xs text-blue-200 mt-0.5">Direct Customer Assistance & Order Support</p>
                </div>
                <button
                  onClick={() => setIsQuoteModalOpen(false)}
                  className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {quoteSubmitted ? (
                <div className="p-10 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">Inquiry Received Successfully!</h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    Thank you for your interest in Authentic products. Our sales engineer will review your requirements and send a customized quotation within 12 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleQuoteSubmit} className="p-6 space-y-4">
                  {/* Product Summary */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <img 
                      src={allImages[0]} 
                      alt="Product"
                      className="w-12 h-12 object-contain bg-white rounded-md border border-slate-200"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{product.title}</div>
                      <div className="text-[11px] text-slate-500">MOQ: Starting from 100,000 Pcs</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                      <input 
                        type="text"
                        required
                        value={quoteForm.fullName}
                        onChange={e => setQuoteForm({...quoteForm, fullName: e.target.value})}
                        placeholder="John Doe"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162963]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Brand *</label>
                      <input 
                        type="text"
                        required
                        value={quoteForm.company}
                        onChange={e => setQuoteForm({...quoteForm, company: e.target.value})}
                        placeholder="Brand Co., Ltd"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162963]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Business Email *</label>
                      <input 
                        type="email"
                        required
                        value={quoteForm.email}
                        onChange={e => setQuoteForm({...quoteForm, email: e.target.value})}
                        placeholder="contact@company.com"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162963]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp / Phone *</label>
                      <input 
                        type="text"
                        required
                        value={quoteForm.phone}
                        onChange={e => setQuoteForm({...quoteForm, phone: e.target.value})}
                        placeholder="+86 180..."
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162963]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Order Quantity</label>
                      <select
                        value={quoteForm.quantity}
                        onChange={e => setQuoteForm({...quoteForm, quantity: e.target.value})}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162963]"
                      >
                        <option value="100,000">100,000 Pcs</option>
                        <option value="300,000">300,000 Pcs</option>
                        <option value="500,000">500,000 Pcs</option>
                        <option value="1,000,000+">1,000,000+ Pcs</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Packaging Type</label>
                      <select
                        value={quoteForm.packaging}
                        onChange={e => setQuoteForm({...quoteForm, packaging: e.target.value})}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162963]"
                      >
                        <option value="Pouches / Bags">Stand-up Pouch</option>
                        <option value="Tubs / Boxes">Plastic Tub / Box</option>
                        <option value="Buckets">Industrial Bucket</option>
                        <option value="Custom Box">Custom Printed Box</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Fragrance Preference</label>
                      <select
                        value={quoteForm.fragrance}
                        onChange={e => setQuoteForm({...quoteForm, fragrance: e.target.value})}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162963]"
                      >
                        <option value="Sweet Peach">Sweet Peach</option>
                        <option value="Green Fruit">Green Fruit</option>
                        <option value="Rose Feast">Rose Feast</option>
                        <option value="Sandhill">Sandhill Fresh</option>
                        <option value="Custom Formula">Custom Fragrance</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Customization Requirements & Notes</label>
                    <textarea 
                      rows={3}
                      value={quoteForm.notes}
                      onChange={e => setQuoteForm({...quoteForm, notes: e.target.value})}
                      placeholder="Specify pod chamber colors, custom formula additives, target delivery date, destination port..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#162963]"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsQuoteModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#162963] hover:bg-[#101e4a] text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-95 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Inquiry</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================
          9. WECHAT MODAL
          ============================================================ */}
      <AnimatePresence>
        {isWeChatModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center space-y-4"
            >
              <button
                onClick={() => setIsWeChatModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 bg-emerald-50 text-[#07C160] rounded-full flex items-center justify-center mx-auto">
                <MessageCircle className="w-6 h-6 fill-current" />
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900">Connect on WeChat</h4>
                <p className="text-xs text-slate-500 mt-1">Scan QR code or copy WeChat ID</p>
              </div>

              {/* QR Code Placeholder / Authentic WeChat ID */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl inline-block mx-auto">
                <div className="w-40 h-40 bg-white border border-slate-200 rounded-lg flex flex-col items-center justify-center p-2">
                  <div className="grid grid-cols-5 gap-1.5 w-32 h-32 opacity-80">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div key={i} className={`rounded-xs ${i % 2 === 0 || i % 7 === 0 ? 'bg-slate-900' : 'bg-slate-100'}`} />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 mt-1">Authentic Official</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 p-2 bg-slate-100 rounded-lg text-xs font-mono text-slate-800">
                <span>WeChat ID: authentic_factory</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('authentic_factory');
                    setCopiedWeChat(true);
                    setTimeout(() => setCopiedWeChat(false), 2000);
                  }}
                  className="text-[#162963] hover:underline flex items-center gap-1 font-sans font-bold cursor-pointer"
                >
                  {copiedWeChat ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWeChat ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
