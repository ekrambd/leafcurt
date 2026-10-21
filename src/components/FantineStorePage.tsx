import { dbService } from "../lib/dbService";
//fix pixel event 2

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ShoppingBag, User, Search, ChevronDown, ChevronLeft, ChevronRight,
  ArrowRight, ArrowLeft, Heart, Star, Check, Sparkles, X, Plus, Minus,
  ShieldCheck, Truck, RefreshCw, Send, HelpCircle, Eye, Share2, Award,
  Phone, Mail, Globe, Droplet, Sun, Moon, Zap, Flame, Layers, MessageCircle, ArrowUp, MapPin, ZoomIn, Clock,
  Building2, BookOpen, Microscope, Quote, Sprout, FlaskConical, CreditCard, Smartphone, Copy, Tag,
  Play, Pause, Volume2, VolumeX, Menu, CheckCircle2, AlertCircle, Info
} from 'lucide-react';
import { trackEvent, createEventId } from '../lib/pixelGtmService';
import { Product, BookOrder, EcomSettings, InstituteInfo, ContactMessage, AboutPageSettings, DeliveryMethodItem, PaymentGatewayItem, Coupon, HeaderSettings, HeroBannerItem } from '../types';
import { publicStoreService, optimizeImageUrl } from '../lib/publicStoreService';
import { DEFAULT_ABOUT_SETTINGS, DEFAULT_DELIVERY_METHODS, DEFAULT_PAYMENT_GATEWAYS, DEFAULT_HEADER_SETTINGS, DEFAULT_HERO_BANNERS, DEFAULT_PRODUCTS } from '../lib/constants';
import { ProductSearchEngine } from '../lib/searchIndex';
import { useAppStore } from '../store/useAppStore';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { updateMetaTags, updateProductSchema, getProductSlug } from '../lib/seoUtils';
import ResponsiveImage from './ResponsiveImage';
import CheckoutPage from './CheckoutPage';
import { DoctorFloatingTrigger } from './ai/DoctorFloatingTrigger';
import { FeedbackDialog } from './ui/FeedbackDialog';
import AuthenticProductDetailPage from './AuthenticProductDetailPage';
import ProductReviewsSection from './ProductReviewsSection';
import { getCustomerSession, clearCustomerSession } from '../lib/customerAuth';
import { calculateCartTotalWeight, calculateDeliveryCharge } from '../lib/deliveryCalculator';
import LoyaltyMembershipSection from './LoyaltyMembershipSection';

const FantineFooter = React.lazy(() => import('./FantineFooter'));

interface FantineStorePageProps {
  onGoToLogin?: () => void;
  onGoToLanding?: () => void;
}

export interface FantineProductItem extends Product {
  series: string;
  isSet?: boolean;
  benefitsHighlights?: string;
  howToUse?: string;
  ingredients?: string;
}


// Dynamic Product Helpers & Fallbacks (Driven by Server Database & Admin Catalog)
export const DEFAULT_PRODUCT_FALLBACK_IMAGE = '/authentic/pod_triple_chamber_main.png';
export const DEFAULT_FANTINE_FALLBACK_IMAGE = DEFAULT_PRODUCT_FALLBACK_IMAGE;

export const getSafeProductImage = (rawImg?: any, _indexOrSeed?: number | string): string => {
  if (!rawImg || typeof rawImg !== 'string' || !rawImg.trim()) {
    return DEFAULT_PRODUCT_FALLBACK_IMAGE;
  }
  const trimmed = rawImg.trim();
  if (
    trimmed.includes('photo-1544716278-ca5e3f4abd8c') ||
    trimmed.includes('/watch.jpg') ||
    trimmed.includes('/book.png') ||
    trimmed === 'undefined' ||
    trimmed === 'null'
  ) {
    return DEFAULT_PRODUCT_FALLBACK_IMAGE;
  }
  return trimmed;
};

export const getSafeSkincareImage = getSafeProductImage;

export const normalizeFantineProduct = (p: Product, index: number = 0): FantineProductItem => {
  const price = typeof p.price === 'number' ? p.price : (Number(p.price) || 0);
  const regularPrice = p.regularPrice ? (typeof p.regularPrice === 'number' ? p.regularPrice : Number(p.regularPrice)) : undefined;
  const discountPercentage = p.discountPercentage || (regularPrice && regularPrice > price ? Math.round(((regularPrice - price) / regularPrice) * 100) : undefined);
  
  const rawCover = (p as any).coverImage || p.image || (p as any).imageUrl || ((p as any).images && (p as any).images[0]) || ((p as any).samplePages && (p as any).samplePages[0]);
  const coverImage = getSafeProductImage(rawCover, index);
  
  const rawAdditional = (p as any).additionalImages || (p as any).images || (p as any).samplePages;
  const additionalImages = Array.isArray(rawAdditional) && rawAdditional.length > 0 
    ? rawAdditional.map((img: string, i: number) => getSafeProductImage(img, i))
    : [coverImage];

  return {
    ...p,
    id: p.id || `prod_${Date.now()}_${index}`,
    title: p.title || 'Product Item',
    author: (p as any).author || p.brand || 'livewellfresh',
    regularPrice,
    price,
    discountPercentage,
    stockQuantity: p.stockQuantity ?? p.stock ?? 500,
    category: p.category || 'General',
    series: (p as any).series || p.category || 'Standard Series',
    coverImage,
    additionalImages,
    description: p.description || p.shortSummary || '',
    benefitsHighlights: (p as any).benefitsHighlights || '',
    howToUse: (p as any).howToUse || (p as any).howToUseIt || '',
    ingredients: (p as any).ingredients || '',
    badge: (p as any).badge || (p.isFeatured ? 'Featured' : undefined),
    rating: p.rating || 5.0,
    reviewsCount: p.reviewsCount || 1,
    isFeatured: p.isFeatured ?? true
  };
};

// Fallback products from constants (only if server database has not returned yet)
const FALLBACK_PRODUCTS: FantineProductItem[] = DEFAULT_PRODUCTS.map((p, idx) => normalizeFantineProduct(p, idx));
const FANTINE_PRODUCTS = FALLBACK_PRODUCTS;

const DEFAULT_SHOP_CATEGORIES = [
  'All',
  'Laundry Detergent Pods',
  '3-in-1 Detergent Pods',
  'Scent Booster Beads',
  'Dishwasher Pods',
  'Ultra Clean Series'
];

function extractYouTubeVideoId(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (match && match[1]) {
    return match[1];
  }
  if (/^[\w-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}


export default function FantineStorePage({ onGoToLogin, onGoToLanding }: FantineStorePageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeId, slug: routeSlug } = useParams<{ id?: string; slug?: string }>();

  // Navigation View: 'home' | 'shop' | 'about' | 'contact' | 'product_detail' | 'checkout' | 'membership'
  const [activeNav, setActiveNav] = useState<'home' | 'shop' | 'about' | 'contact' | 'product_detail' | 'checkout' | 'membership'>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (p.startsWith('/product')) return 'product_detail';
      if (p.startsWith('/shop')) return 'shop';
      if (p.startsWith('/about')) return 'about';
      if (p.startsWith('/contact')) return 'contact';
      if (p.startsWith('/checkout')) return 'checkout';
      if (p.startsWith('/membership') || p.startsWith('/vip')) return 'membership';
    }
    return 'home';
  });
  const [selectedCategoryCheckbox, setSelectedCategoryCheckbox] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [priceRange, setPriceRange] = useState<number>(50000); // Max range default
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

  // Dynamic Ecom Settings for Hero Banners & Videos
  const [ecomSettings, setEcomSettings] = useState<EcomSettings | null>(null);
  const [instituteInfo, setInstituteInfo] = useState<InstituteInfo | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);

  // Dynamic Product State from Admin / DB (No Seed Data Overwriting)
  const [products, setProducts] = useState<FantineProductItem[]>(() => {
    try {
      const cached = localStorage.getItem('noor_ecom_products');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p, idx) => normalizeFantineProduct(p, idx));
        }
      }
    } catch {
      // fallback
    }
    return FANTINE_PRODUCTS;
  });

  // Helper to find matching product from URL path or router params
  const findProductFromPath = useCallback((path: string, idParam?: string, slugParam?: string, productList: FantineProductItem[] = products) => {
    if (!productList || productList.length === 0) return null;
    const targetId = (idParam || '').toLowerCase();
    const targetSlug = (slugParam || '').toLowerCase();

    // 1. Direct match by ID
    if (targetId) {
      const directMatch = productList.find(p => p.id.toLowerCase() === targetId);
      if (directMatch) return directMatch;
    }

    // 2. Direct match by slug
    if (targetSlug) {
      const slugMatch = productList.find(p => {
        const pSlug = getProductSlug(p).toLowerCase();
        return pSlug === targetSlug || p.id.toLowerCase() === targetSlug;
      });
      if (slugMatch) return slugMatch;
    }

    // 3. Maybe targetId is actually a slug
    if (targetId) {
      const slugAsIdMatch = productList.find(p => {
        const pSlug = getProductSlug(p).toLowerCase();
        return pSlug === targetId;
      });
      if (slugAsIdMatch) return slugAsIdMatch;
    }

    // 4. Check if pathname contains any product id
    const pathLower = path.toLowerCase();
    const pathMatch = productList.find(p => pathLower.includes(p.id.toLowerCase()));
    if (pathMatch) return pathMatch;

    // 5. Check if pathname contains any product slug
    const pathSlugMatch = productList.find(p => {
      const pSlug = getProductSlug(p).toLowerCase();
      return pSlug.length > 3 && pathLower.includes(pSlug);
    });
    if (pathSlugMatch) return pathSlugMatch;

    return null;
  }, [products]);

  // Active Selected Product for Detail Page (Deep link aware on initial load)
  const [activeProductDetail, setActiveProductDetail] = useState<FantineProductItem>(() => {
    const initialList = products.length > 0 ? products : FANTINE_PRODUCTS;
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/product')) {
      const p = window.location.pathname;
      const found = initialList.find(prod => {
        const slug = getProductSlug(prod).toLowerCase();
        return p.includes(prod.id) || (slug.length > 3 && p.toLowerCase().includes(slug));
      });
      if (found) return found;
    }
    return initialList[0] || FANTINE_PRODUCTS[0];
  });
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState<boolean>(false);
  const [isHoverZooming, setIsHoverZooming] = useState<boolean>(false);
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [customerSession, setCustomerSession] = useState<{ phone: string; name: string } | null>(() => getCustomerSession());

  useEffect(() => {
    const handleAuthChange = () => {
      setCustomerSession(getCustomerSession());
    };
    window.addEventListener('customer-auth-changed', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('customer-auth-changed', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);


  // Sync Live Settings from dbService & publicStoreService
  const loadLiveSettings = async () => {
    try {
      const [settings, info] = await Promise.all([
        (await import('../lib/dbService')).dbService.getEcomSettings().catch(() => null),
        (await import('../lib/dbService')).dbService.getInstituteInfo().catch(() => null)
      ]);
      if (settings) setEcomSettings(settings);
      if (info) setInstituteInfo(info);
    } catch {
      // ignore
    }

    try {
      const [pubSettings, pubInfo] = await Promise.all([
        publicStoreService.getEcomSettings().catch(() => null),
        publicStoreService.getInstituteInfo().catch(() => null)
      ]);
      if (pubSettings) {
        setEcomSettings(prev => prev || pubSettings);
      }
      if (pubInfo) {
        setInstituteInfo(prev => prev || pubInfo);
      }
    } catch {
      // ignore
    }
  };

  // Sync Live Products from dbService & publicStoreService
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadLiveProducts = async () => {
    try {
      const dbProds = await dbService.getProducts();
      if (dbProds && dbProds.length > 0) {
        const normalized = dbProds.map((p, idx) => normalizeFantineProduct(p, idx));
        setProducts(normalized);
        setActiveProductDetail(prev => {
          if (typeof window !== 'undefined' && window.location.pathname.startsWith('/product')) {
            const urlMatch = findProductFromPath(window.location.pathname, routeId, routeSlug, normalized);
            if (urlMatch) return urlMatch;
          }
          const match = normalized.find(p => p.id === prev?.id);
          return match || normalized[0];
        });
        return;
      }
    } catch (err) {
      console.warn('Failed loading from dbService:', err);
    }

    try {
      const pubProds = await publicStoreService.getProducts();
      if (pubProds && pubProds.length > 0) {
        const normalized = pubProds.map((p, idx) => normalizeFantineProduct(p, idx));
        setProducts(normalized);
        setActiveProductDetail(prev => {
          if (typeof window !== 'undefined' && window.location.pathname.startsWith('/product')) {
            const urlMatch = findProductFromPath(window.location.pathname, routeId, routeSlug, normalized);
            if (urlMatch) return urlMatch;
          }
          const match = normalized.find(p => p.id === prev?.id);
          return match || normalized[0];
        });
      }
    } catch (err) {
      console.warn('Failed loading from publicStoreService:', err);
    }
  };



  useEffect(() => {
    loadLiveProducts();
    loadLiveSettings();

    const handleProductUpdate = () => {
      loadLiveProducts();
    };
    const handleSettingsUpdate = () => {
      loadLiveSettings();
    };

    window.addEventListener('ecom-products-updated', handleProductUpdate);
    window.addEventListener('ecom-settings-updated', handleSettingsUpdate);
    window.addEventListener('institute-info-updated', handleSettingsUpdate);
    window.addEventListener('storage', handleProductUpdate);
    return () => {
      window.removeEventListener('ecom-products-updated', handleProductUpdate);
      window.removeEventListener('ecom-settings-updated', handleSettingsUpdate);
      window.removeEventListener('institute-info-updated', handleSettingsUpdate);
      window.removeEventListener('storage', handleProductUpdate);
    };
  }, []);

  // General States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currency] = useState<'BDT'>('BDT');
  
  // Modals, Feedback Dialog & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showNotificationToast, setShowNotificationToast] = useState<{
    show: boolean;
    msg: string;
    type?: 'success' | 'error' | 'info';
  }>({ show: false, msg: '', type: 'success' });

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setShowNotificationToast({ show: true, msg, type });
    setTimeout(() => {
      setShowNotificationToast(prev => prev.msg === msg ? { show: false, msg: '', type: 'success' } : prev);
    }, 4500);
  }, []);

  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'info';
    title?: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  // 10-Minute Cart Reservation Hold State
  const [reservationSeconds, setReservationSeconds] = useState<number>(600); // 10 mins

  // In-Memory Fast Search Index Instance
  const searchEngine = useMemo(() => new ProductSearchEngine(products), [products]);
  const searchOutput = useMemo(() => searchEngine.search(searchTerm), [searchEngine, searchTerm]);

  // Cart State (Zustand Global Store)
  const cart = useAppStore(state => state.cart);
  const addToCartAction = useAppStore(state => state.addToCart);
  const removeFromCartAction = useAppStore(state => state.removeFromCart);
  const updateQuantityAction = useAppStore(state => state.updateQuantity);
  const clearCartAction = useAppStore(state => state.clearCart);


  // Reservation Timer Countdown
  useEffect(() => {
    if (cart.length === 0) {
      setReservationSeconds(600);
      return;
    }

    const interval = setInterval(() => {
      setReservationSeconds(prev => {
        if (prev <= 1) {
          return 600; // auto-refresh hold
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cart.length]);

  // Contact Form State
  const [contactSenderName, setContactSenderName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  // Dynamic Header Settings from Admin Panel (Matching User Design)
  const liveHeaderSettings = useMemo<HeaderSettings>(() => {
    return ecomSettings?.headerSettings || DEFAULT_HEADER_SETTINGS;
  }, [ecomSettings?.headerSettings]);

  // Dynamic Store & Footer Brand Details (From Admin Profile / Store Setup)
  const displayStoreName = ecomSettings?.storeName?.trim() || liveHeaderSettings?.brandName?.trim() || instituteInfo?.name?.trim() || 'livewellfresh';
  const displayStoreLogo = ecomSettings?.storeLogo?.trim() || liveHeaderSettings?.logoUrl?.trim() || instituteInfo?.logo?.trim() || '/livewellfresh_logo.png';
  const displayCompanyName = ecomSettings?.companyName || instituteInfo?.name || `${displayStoreName} Ltd.`;
  const displayTagline = ecomSettings?.storeTagline || ecomSettings?.footerDescription || instituteInfo?.description || `${displayStoreName} • Innovative 3-in-1 Triple Chamber Laundry Pods & Eco Detergent Care. Fresh Clothes. Better Life.`;
  const displayEmail = ecomSettings?.contactEmail || instituteInfo?.email || 'authentic.factory@outlook.com';
  const displayPhone = ecomSettings?.contactPhone || instituteInfo?.phone || '+86 18027300683';
  const displayAddress = ecomSettings?.storeAddress || instituteInfo?.address || 'No. 88 Industrial Avenue, High-Tech Manufacturing Zone';
  const displayAnnouncement = ecomSettings?.topAnnouncementText || `WELCOME TO ${displayStoreName.toUpperCase()} • FRESH CLOTHES. BETTER LIFE`;
  const socialLinks = ecomSettings?.socialLinks;
  const aboutSettings: AboutPageSettings = ecomSettings?.aboutSettings || DEFAULT_ABOUT_SETTINGS;

  const menuItemsToRender = useMemo(() => {
    return liveHeaderSettings.menuItems?.length
      ? liveHeaderSettings.menuItems
      : DEFAULT_HEADER_SETTINGS.menuItems;
  }, [liveHeaderSettings.menuItems]);

  const facebookUrl = liveHeaderSettings.socialLinks?.facebook;
  const youtubeUrl = liveHeaderSettings.socialLinks?.youtube;
  const instagramUrl = liveHeaderSettings.socialLinks?.instagram;
  const linkedinUrl = liveHeaderSettings.socialLinks?.linkedin;
  const tiktokUrl = liveHeaderSettings.socialLinks?.tiktok;
  const headerEmail = liveHeaderSettings.email || displayEmail;
  const headerPhone = liveHeaderSettings.phone || displayPhone;

  // Dynamic Hero Banners for Slider (Driven by Admin Panel)
  const activeHeroBanners = useMemo<HeroBannerItem[]>(() => {
    if (ecomSettings?.heroBanners && ecomSettings.heroBanners.length > 0) {
      return ecomSettings.heroBanners;
    }
    return DEFAULT_HERO_BANNERS;
  }, [ecomSettings?.heroBanners]);

  const [isSliderPaused, setIsSliderPaused] = useState<boolean>(false);

  // Slider Autoplay Effect (5s Interval)
  useEffect(() => {
    if (isSliderPaused || activeHeroBanners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlideIndex(prev => (prev + 1) % activeHeroBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isSliderPaused, activeHeroBanners.length]);

  const handlePrevSlide = () => {
    setActiveSlideIndex(prev => (prev - 1 + activeHeroBanners.length) % activeHeroBanners.length);
  };

  const handleNextSlide = () => {
    setActiveSlideIndex(prev => (prev + 1) % activeHeroBanners.length);
  };

  // Factory Direct Quote Modal State
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    fullName: '',
    company: '',
    email: '',
    phone: '',
    quantity: '100,000 Pcs',
    message: ''
  });

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteForm.fullName.trim() || !quoteForm.email.trim() || !quoteForm.phone.trim()) {
      showToast('Please fill in your name, email, and phone/WhatsApp.', 'error');
      return;
    }
    setIsSubmittingQuote(true);
    try {
      await dbService.addContactMessage({
        id: `quote-${Date.now()}`,
        name: quoteForm.fullName,
        email: quoteForm.email,
        phone: quoteForm.phone,
        subject: `[OEM/ODM Quote Request] ${quoteForm.company} (${quoteForm.quantity})`,
        message: `Company: ${quoteForm.company}\nTarget MOQ: ${quoteForm.quantity}\nRequirements:\n${quoteForm.message}`,
        createdAt: new Date().toISOString(),
        status: 'unread'
      });
      setQuoteSubmitted(true);
      showToast('Quote request submitted successfully!', 'success');
    } catch {
      showToast('Failed to submit quote request. Please try WhatsApp.', 'error');
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  // Dynamic Flash Sale Countdown Hook
  const flashSaleConfig = ecomSettings?.flashSale;
  const [flashSaleTimeLeft, setFlashSaleTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTime = () => {
      const endDateStr = flashSaleConfig?.endDate;
      if (!endDateStr) {
        setFlashSaleTimeLeft({ days: 6, hours: 23, minutes: 59, seconds: 59 });
        return;
      }
      const diff = +new Date(endDateStr) - +new Date();
      if (diff > 0) {
        setFlashSaleTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60)
        });
      } else {
        setFlashSaleTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [flashSaleConfig?.endDate]);

  // Dynamic Favicon and Document Title Sync
  useEffect(() => {
    if (displayStoreLogo) {
      let link = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = displayStoreLogo;
    }
    if (displayStoreName) {
      updateMetaTags(
        `${displayStoreName} | Official Store`, 
        aboutSettings?.description || 'Welcome to our official store', 
        displayStoreLogo,
        window.location.href
      );
    }
  }, [displayStoreLogo, displayStoreName, aboutSettings?.description]);

  // Dynamic SEO based on active view
  useEffect(() => {
    if (activeNav === 'product_detail' && activeProductDetail) {
      updateMetaTags(
        `${activeProductDetail.title} | ${displayStoreName}`,
        activeProductDetail.subtitle || activeProductDetail.description || 'View product details and clinical formulation.',
        activeProductDetail.coverImage || activeProductDetail.image,
        window.location.href
      );
      updateProductSchema(activeProductDetail, window.location.href, displayStoreName);

      // Track ViewContent for Meta Pixel & GTM
      const eventId = createEventId('view');
      trackEvent('ViewContent', {
        content_name: activeProductDetail.title,
        content_ids: [activeProductDetail.id],
        content_type: 'product',
        value: activeProductDetail.price,
        currency: 'BDT'
      }, eventId);
    } else if (activeNav === 'shop') {
      updateMetaTags(
        `Shop All Products | ${displayStoreName}`,
        aboutSettings?.description || `Browse our complete product catalog at ${displayStoreName}.`,
        displayStoreLogo,
        window.location.href
      );
      updateProductSchema(null, window.location.href, displayStoreName);
    } else if (activeNav === 'about') {
      updateMetaTags(
        aboutSettings?.pageTitle || `About Us | ${displayStoreName}`,
        aboutSettings?.subtitle || aboutSettings?.description || `Learn about ${displayStoreName}, our facility, mission, and manufacturing standards.`,
        displayStoreLogo,
        window.location.href
      );
      updateProductSchema(null, window.location.href, displayStoreName);
    } else if (activeNav === 'contact') {
      updateMetaTags(
        `Contact Us & Customer Support | ${displayStoreName}`,
        'Get in touch with our customer care team via WhatsApp, phone, or email.',
        displayStoreLogo,
        window.location.href
      );
      updateProductSchema(null, window.location.href, displayStoreName);
    } else if (activeNav === 'checkout') {
      updateMetaTags(
        `Secure Checkout | ${displayStoreName}`,
        'Complete your order with Fast Delivery & Cash on Delivery across Bangladesh.',
        displayStoreLogo,
        window.location.href
      );
      updateProductSchema(null, window.location.href, displayStoreName);
    } else if (activeNav === 'home') {
      updateMetaTags(
        `${displayStoreName} | Official Store`,
        aboutSettings?.description || 'Welcome to our official store',
        displayStoreLogo,
        window.location.href
      );
      updateProductSchema(null, window.location.href, displayStoreName);
    }
  }, [activeNav, activeProductDetail, displayStoreName, displayStoreLogo, aboutSettings?.description, aboutSettings?.subtitle]);

  // Track Search event on search query input (debounced)
  useEffect(() => {
    const q = searchTerm.trim();
    if (!q || q.length < 2) return;
    const timer = setTimeout(() => {
      trackEvent('Search', { search_string: q });
    }, 1200);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Transparent Header on initial top view, solid white on scroll
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isTransparentHeader = false;

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Central Router Navigation Helper (Syncs Browser URL with SPA Views)
  const navigateTo = useCallback((section: 'home' | 'shop' | 'about' | 'contact' | 'checkout' | 'membership') => {
    setIsMobileMenuOpen(false);
    const targetPath = section === 'home' ? '/' : `/${section}`;
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
    setActiveNav(section);
    scrollToTop();
  }, [location.pathname, navigate, scrollToTop]);

  // Sync React Router pathname with active store view & product
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/product')) {
      const found = findProductFromPath(path, routeId, routeSlug, products);
      if (found) {
        setActiveProductDetail(found);
        setActiveNav('product_detail');
      } else if (products.length > 0) {
        setActiveProductDetail(products[0]);
        setActiveNav('product_detail');
      }
    } else if (path.startsWith('/shop')) {
      setActiveNav('shop');
    } else if (path.startsWith('/about')) {
      setActiveNav('about');
    } else if (path.startsWith('/contact')) {
      setActiveNav('contact');
    } else if (path.startsWith('/checkout')) {
      setActiveNav('checkout');
    } else if (path.startsWith('/membership') || path.startsWith('/vip')) {
      setActiveNav('membership');
    } else if (path === '/' || path === '') {
      setActiveNav('home');
    }
  }, [location.pathname, routeId, routeSlug, products, findProductFromPath]);

  // Bangladeshi Taka BDT Currency Formatter (Exclusive)
  const formatPrice = (priceVal: number) => {
    if (!priceVal && priceVal !== 0) return 'Tk.0';
    const bdtAmount = priceVal < 100 ? Math.round(priceVal * 120) : Math.round(priceVal);
    return `Tk.${bdtAmount.toLocaleString('en-US')}`;
  };

  // Add to Cart Helper
  const handleAddToCart = useCallback((product: Product, quantity = 1) => {
    const eventId = createEventId('cart');
    trackEvent('AddToCart', {
      content_name: product.title,
      content_ids: [product.id],
      content_type: 'product',
      value: (product.price || 0) * quantity,
      currency: 'BDT',
      num_items: quantity,
      contents: [{
        id: product.id,
        name: product.title,
        quantity: quantity,
        item_price: product.price
      }]
    }, eventId);
    addToCartAction({ product, quantity });
    showToast(`Added ${product.title} to your bag.`, 'success');
  }, [addToCartAction, showToast]);

  const handleRemoveFromCart = useCallback((productId: string) => {
    removeFromCartAction(productId);
  }, [removeFromCartAction]);

  const handleUpdateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCartAction(productId);
      return;
    }
    updateQuantityAction(productId, quantity);
  }, [removeFromCartAction, updateQuantityAction]);

  // Open Full Product Detail Page with dynamic SEO deep-link URL
  const openProductDetail = useCallback((product: FantineProductItem) => {
    setActiveProductDetail(product);
    setActiveImageIndex(0);
    setActiveNav('product_detail');
    const slug = getProductSlug(product);
    navigate(`/product/${encodeURIComponent(slug)}/${encodeURIComponent(product.id)}`);
    scrollToTop();
  }, [navigate, scrollToTop]);

  // Cart Subtotal
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  }, [cart]);

  const totalCartCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  // Filtered & Sorted Catalog for Shop Page
  const filteredCatalog = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = !searchTerm.trim() || 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategoryCheckbox === 'All' || 
        p.category === selectedCategoryCheckbox || 
        p.series === selectedCategoryCheckbox;
        
      const matchesBrand = selectedBrand === 'All' || 
        p.brand === selectedBrand;
        
      const matchesPrice = p.price <= priceRange;

      return matchesSearch && matchesCategory && matchesBrand && matchesPrice;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return 0;
    });
  }, [products, searchTerm, selectedCategoryCheckbox, selectedBrand, priceRange, sortBy]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCatalog.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCatalog, currentPage]);

  const shopCategories = useMemo(() => {
    const set = new Set<string>();
    if (ecomSettings?.categories && Array.isArray(ecomSettings.categories)) {
      ecomSettings.categories.forEach(c => {
        if (typeof c === 'string' && c.trim()) set.add(c.trim());
      });
    }
    products.forEach(p => {
      if (p.category && p.category.trim()) set.add(p.category.trim());
      if (p.series && p.series.trim()) set.add(p.series.trim());
    });
    const custom = Array.from(set);
    return custom.length > 0 ? ['All', ...custom] : DEFAULT_SHOP_CATEGORIES;
  }, [ecomSettings?.categories, products]);

  const shopBrands = useMemo(() => {
    return ['All', ...Array.from(new Set(products.map(p => p.brand).filter(Boolean)))];
  }, [products]);

  const totalPages = Math.ceil(filteredCatalog.length / itemsPerPage) || 1;

  const cartTotalWeight = useMemo(() => {
    return calculateCartTotalWeight(cart);
  }, [cart]);

  // Active Delivery Methods from Admin Settings
  const activeDeliveryMethods = useMemo<DeliveryMethodItem[]>(() => {
    const list = ecomSettings?.deliveryMethods || DEFAULT_DELIVERY_METHODS;
    const active = list.filter(m => m.status === 'Active');
    return active.length > 0 ? active : list;
  }, [ecomSettings?.deliveryMethods]);

  const [selectedDeliveryMethodId, setSelectedDeliveryMethodId] = useState<string>('');

  useEffect(() => {
    if (activeDeliveryMethods.length > 0) {
      if (!selectedDeliveryMethodId || !activeDeliveryMethods.some(m => m.id === selectedDeliveryMethodId)) {
        setSelectedDeliveryMethodId(activeDeliveryMethods[0].id);
      }
    }
  }, [activeDeliveryMethods, selectedDeliveryMethodId]);

  const selectedDeliveryMethod = useMemo(() => {
    return activeDeliveryMethods.find(m => m.id === selectedDeliveryMethodId) || activeDeliveryMethods[0];
  }, [activeDeliveryMethods, selectedDeliveryMethodId]);

  const deliveryCalc = useMemo(() => {
    if (!selectedDeliveryMethod) {
      return { finalCharge: ecomSettings?.deliveryChargeInsideDhaka || 70 };
    }
    return calculateDeliveryCharge(selectedDeliveryMethod, cartSubtotal, cartTotalWeight);
  }, [selectedDeliveryMethod, cartSubtotal, cartTotalWeight, ecomSettings?.deliveryChargeInsideDhaka]);

  const deliveryCharge = deliveryCalc.finalCharge;

  // Active Payment Gateways from Admin Settings
  const activePaymentGateways = useMemo<PaymentGatewayItem[]>(() => {
    let gateways = ecomSettings?.paymentGateways;
    if (!gateways || gateways.length === 0) {
      gateways = DEFAULT_PAYMENT_GATEWAYS;
    }
    const active = gateways.filter(g => g.status === 'Active');
    return active.length > 0 ? active : gateways;
  }, [ecomSettings?.paymentGateways]);

  const [selectedPaymentGatewayId, setSelectedPaymentGatewayId] = useState<string>('');
  const [trxId, setTrxId] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [copiedAccNo, setCopiedAccNo] = useState(false);

  useEffect(() => {
    if (activePaymentGateways.length > 0) {
      if (!selectedPaymentGatewayId || !activePaymentGateways.some(g => g.id === selectedPaymentGatewayId)) {
        setSelectedPaymentGatewayId(activePaymentGateways[0].id);
      }
    }
  }, [activePaymentGateways, selectedPaymentGatewayId]);

  const selectedPaymentGateway = useMemo(() => {
    return activePaymentGateways.find(g => g.id === selectedPaymentGatewayId) || activePaymentGateways[0];
  }, [activePaymentGateways, selectedPaymentGatewayId]);

  const isOnlinePayment = selectedPaymentGateway && 
    selectedPaymentGateway.type !== 'Cash on Delivery' && 
    selectedPaymentGateway.type !== 'COD' &&
    !selectedPaymentGateway.title.toLowerCase().includes('cash on delivery') &&
    !selectedPaymentGateway.title.toLowerCase().includes('Cash on');

  // Coupon State & Calculation
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError('');
    setCouponSuccess('');
    try {
      const coupons = await dbService.getCoupons();
      const match = coupons.find(c => c.code.toLowerCase() === couponCodeInput.trim().toLowerCase() && c.status === 'Active');
      if (!match) {
        setCouponError('Invalid or expired coupon code');
        return;
      }
      if (match.minSpent && cartSubtotal < match.minSpent) {
        setCouponError(`Minimum to use this coupon ${formatPrice(match.minSpent)} Must order money`);
        return;
      }
      setAppliedCoupon(match);
      setCouponSuccess(`coupon "${match.code}" successfulhas been applied!`);
      setCouponCodeInput('');
    } catch {
      setCouponError('There was a problem validating the coupon');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponSuccess('');
    setCouponError('');
  };

  const couponDiscountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percent') {
      const disc = Math.round((cartSubtotal * appliedCoupon.discount) / 100);
      return appliedCoupon.maxDiscount ? Math.min(disc, appliedCoupon.maxDiscount) : disc;
    }
    return Math.min(appliedCoupon.discount, cartSubtotal);
  }, [appliedCoupon, cartSubtotal]);

  const gatewayDiscount = selectedPaymentGateway?.discountAmount ? Number(selectedPaymentGateway.discountAmount) : 0;
  const gatewayFee = selectedPaymentGateway?.transactionFee ? Number(selectedPaymentGateway.transactionFee) : 0;
  const cartGrandTotal = Math.max(0, cartSubtotal + deliveryCharge + gatewayFee - gatewayDiscount - couponDiscountAmount);

  // Checkout Form
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<BookOrder | null>(null);

  const handleCopyAccountNumber = (acc: string) => {
    navigator.clipboard.writeText(acc);
    setCopiedAccNo(true);
    setTimeout(() => setCopiedAccNo(false), 2000);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutPhone.trim() || !checkoutAddress.trim() || !checkoutName.trim()) {
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Required Information Missing',
        message: 'Please provide your name, mobile phone number, and complete delivery address to complete your order.'
      });
      showToast('Please fill in your name, phone and address.', 'error');
      return;
    }

    if (cart.length === 0) {
      setFeedback({
        isOpen: true,
        type: 'info',
        title: 'Shopping Bag Is Empty',
        message: 'Your shopping bag is empty. Please add items before checking out.'
      });
      showToast('Your shopping bag is empty.', 'info');
      return;
    }

    if (isOnlinePayment && (!senderPhone.trim() || !trxId.trim())) {
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Payment Details Required',
        message: `Please provide your ${selectedPaymentGateway?.title || 'bKash/Nagad'} sender mobile number and Transaction ID (TrxID).`
      });
      showToast('Please provide your sender number and TrxID.', 'error');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const orderId = `ORD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const orderPayload: BookOrder = {
        id: orderId,
        customerName: checkoutName.trim(),
        name: checkoutName.trim(),
        phone: checkoutPhone.trim(),
        address: checkoutAddress.trim(),
        deliveryArea: selectedDeliveryMethod?.title || 'Inside Dhaka',
        deliveryZone: selectedDeliveryMethod?.title || 'Inside Dhaka',
        district: selectedDeliveryMethod?.title || 'Inside Dhaka',
        deliveryCharge: deliveryCharge,
        price: cartSubtotal,
        unitPrice: cart.length === 1 ? cart[0].product.price : cartSubtotal,
        totalAmount: cartGrandTotal,
        totalPrice: cartGrandTotal,
        productName: cart.map(i => `${i.product.title} (x${i.quantity})`).join(', '),
        productTitle: cart.map(i => `${i.product.title} (x${i.quantity})`).join(', '),
        status: 'Pending',
        orderType: 'storefront',
        paymentMethod: selectedPaymentGateway?.title || 'COD',
        paymentGateway: selectedPaymentGateway?.title || 'COD',
        senderPhone: isOnlinePayment ? senderPhone.trim() : undefined,
        trxId: isOnlinePayment ? trxId.trim() : undefined,
        couponCode: appliedCoupon?.code,
        couponDiscount: couponDiscountAmount > 0 ? couponDiscountAmount : undefined,
        quantity: cart.reduce((acc, i) => acc + i.quantity, 0),
        createdAt: new Date().toISOString(),
        orderDate: new Date().toISOString(),
        items: cart.map(i => ({
          product: {
            id: i.product.id,
            title: i.product.title,
            price: i.product.price,
            regularPrice: i.product.regularPrice,
            image: i.product.coverImage,
            category: i.product.category,
            stock: i.product.stock || 100,
            isAvailable: true
          },
          quantity: i.quantity
        }))
      };

      // 1. Try Authoritative Server-Side Atomic Checkout first
      let confirmedOrder: BookOrder = orderPayload;
      let orderCreatedViaServer = false;

      try {
        const response = await fetch('/api/orders/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: checkoutName.trim(),
            phone: checkoutPhone.trim(),
            address: checkoutAddress.trim(),
            testEventCode: (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('meta_test_code') : undefined) || undefined,
            deliveryZone: selectedDeliveryMethod?.title || 'Inside Dhaka',
            paymentMethod: selectedPaymentGateway?.title || 'Cash on Delivery',
            senderPhone: isOnlinePayment ? senderPhone.trim() : undefined,
            trxId: isOnlinePayment ? trxId.trim() : undefined,
            couponCode: appliedCoupon?.code,
            items: cart.map(i => ({
              productId: i.product.id,
              quantity: i.quantity,
              price: i.product.price,
              regularPrice: i.product.regularPrice,
              title: i.product.title
            }))
          })
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData?.order) {
            confirmedOrder = resData.order;
            orderCreatedViaServer = true;
          }
        }
      } catch {
        // Fallback to direct client DB service if offline/standalone
      }

      // 2. Fallback / Sync to Local & Firestore DB
      if (!orderCreatedViaServer) {
        await dbService.addBookOrder(orderPayload);
      } else {
        await dbService.saveBookOrder(confirmedOrder);
      }

      // Track Purchase event before clearing cart
      const purchaseEventId = createEventId('purchase');
      const totalItemsPurchased = cart.reduce((acc, item) => acc + item.quantity, 0);
      trackEvent('Purchase', {
        content_name: cart.map(i => i.product.title).join(', '),
        content_ids: cart.map(i => i.product.id),
        content_type: 'product',
        value: cartGrandTotal || cartSubtotal,
        currency: 'BDT',
        num_items: totalItemsPurchased,
        contents: cart.map(item => ({
          id: item.product.id,
          name: item.product.title,
          quantity: item.quantity,
          item_price: item.product.price
        }))
      }, purchaseEventId);

      setOrderSuccess(confirmedOrder);
      clearCartAction();
      setIsCartOpen(false);
      setCheckoutName('');
      setCheckoutPhone('');
      setCheckoutAddress('');
      setTrxId('');
      setSenderPhone('');
      setAppliedCoupon(null);
    } catch (err) {
      console.error('Order error:', err);
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Order Processing Failed',
        message: 'There was a problem processing your order. Please try again or contact us directly on WhatsApp.'
      });
      showToast('Order processing failed. Please try again.', 'error');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail.trim()) {
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Email Address Required',
        message: 'Please enter your email address so our customer care team can respond to your inquiry.'
      });
      showToast('Please enter your email address.', 'error');
      return;
    }

    try {
      setIsSubmittingContact(true);
      await dbService.saveContactMessage({
        name: contactSenderName.trim(),
        email: contactEmail.trim(),
        phone: contactPhone.trim(),
        subject: contactSubject.trim(),
        message: contactMessage.trim(),
        createdAt: new Date().toISOString(),
        status: 'unread'
      });

      setContactSubmitted(true);
      trackEvent('Contact', { content_name: 'Customer Contact Form' });
      setContactSenderName('');
      setContactEmail('');
      setContactPhone('');
      setContactSubject('');
      setContactMessage('');
      const successMsg = `Thank you! Your message has been received and forwarded to ${displayCompanyName}. Our customer service team will get back to you shortly.`;
      setFeedback({
        isOpen: true,
        type: 'success',
        title: 'Message Sent Successfully',
        message: successMsg
      });
      showToast(`Thank you! Your message has been received.`, 'success');
    } catch (err) {
      console.error('Error submitting contact form to dbService:', err);
      try {
        await publicStoreService.submitContactMessage({
          name: contactSenderName.trim(),
          email: contactEmail.trim(),
          phone: contactPhone.trim(),
          subject: contactSubject.trim(),
          message: contactMessage.trim()
        });
      } catch {}
      setContactSubmitted(true);
      setContactSenderName('');
      setContactEmail('');
      setContactPhone('');
      setContactSubject('');
      setContactMessage('');
      const fallbackMsg = `Thank you! Your message has been received. Our customer service team will review your message shortly.`;
      setFeedback({
        isOpen: true,
        type: 'success',
        title: 'Message Received',
        message: fallbackMsg
      });
      showToast(`Thank you! Your message has been received.`, 'success');
    } finally {
      setIsSubmittingContact(false);
      setTimeout(() => setContactSubmitted(false), 3000);
    }
  };

  const currentProductImages = useMemo(() => {
    return activeProductDetail.additionalImages && activeProductDetail.additionalImages.length > 0
      ? activeProductDetail.additionalImages
      : [activeProductDetail.coverImage];
  }, [activeProductDetail]);

  const isAuthenticDetail = activeNav === 'product_detail' && (
    activeProductDetail.id === '3-in-1-laundry-detergent-pods' || 
    activeProductDetail.brand?.toUpperCase() === 'AUTHENTIC' ||
    activeProductDetail.category?.toLowerCase().includes('pods') ||
    Boolean(activeProductDetail.specTable && activeProductDetail.specTable.length > 0)
  );

  if (isAuthenticDetail) {
    return (
      <AuthenticProductDetailPage
        product={activeProductDetail}
        headerSettings={ecomSettings?.headerSettings}
        onNavigateHome={() => {
          navigateTo('home');
          navigate('/');
        }}
        onNavigateCategory={(cat) => {
          setSelectedCategoryCheckbox(cat);
          navigateTo('shop');
          navigate('/shop');
        }}
        onRequestQuote={(prod) => {
          showToast(`Quote request received for ${prod.title}! Our sales team will reach out via WhatsApp & email shortly.`, 'success');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-slate-900 font-sans relative selection:bg-rose-100 selection:text-rose-900">
      
      {/* Toast Notification */}
      {showNotificationToast.show && (
        <div className={`fixed top-20 right-4 sm:right-6 z-[100] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border transition-all duration-300 transform translate-y-0 backdrop-blur-md max-w-sm sm:max-w-md ${
          showNotificationToast.type === 'error'
            ? 'bg-rose-950/95 border-rose-500/40 text-rose-100 shadow-rose-950/30'
            : showNotificationToast.type === 'info'
            ? 'bg-teal-950/95 border-teal-500/40 text-teal-100 shadow-teal-950/30'
            : 'bg-slate-900/95 border-emerald-500/40 text-white shadow-slate-950/40'
        }`}>
          {showNotificationToast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : showNotificationToast.type === 'info' ? (
            <Info className="w-5 h-5 text-teal-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-semibold flex-1 leading-snug">{showNotificationToast.msg}</span>
          <button 
            type="button" 
            onClick={() => setShowNotificationToast({ show: false, msg: '', type: 'success' })}
            className="ml-1 text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-full hover:bg-white/10"
            aria-label="Close notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ============================================================
          TOP CONTACT & SOCIAL BAR (Dynamic from Admin Panel)
          ============================================================ */}
      {liveHeaderSettings.showTopBar !== false && (
        <div className="bg-[#1c2850] text-white text-xs py-2 px-4 sm:px-8 transition-colors">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            {/* Left: Phone & Email */}
            <div className="flex items-center gap-6 text-[13px] tracking-wide">
              {headerPhone && (
                <a 
                  href={`tel:${headerPhone.replace(/\s+/g, '')}`} 
                  className="flex items-center gap-2 hover:text-blue-200 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 fill-current" />
                  <span>{headerPhone}</span>
                </a>
              )}
              {headerEmail && (
                <a 
                  href={`mailto:${headerEmail}`} 
                  className="flex items-center gap-2 hover:text-blue-200 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 fill-current" />
                  <span>{headerEmail}</span>
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
          MAIN LUXURY APP BAR (Solid Crisp White Across Entire Site)
          ============================================================ */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-4 sm:gap-6 flex-nowrap">
          
          {/* Brand Logo */}
          <div 
            className="flex items-center cursor-pointer group shrink-0" 
            onClick={() => navigateTo('home')}
          >
            <img 
              src={liveHeaderSettings.logoUrl || displayStoreLogo || '/livewellfresh_logo.png'} 
              alt={liveHeaderSettings.brandName || displayStoreName || "livewellfresh"} 
              className="h-10 sm:h-12 md:h-13 max-h-13 max-w-[200px] sm:max-w-[260px] md:max-w-[300px] object-contain transition-all duration-200 group-hover:opacity-95"
              onError={(e) => {
                e.currentTarget.src = '/livewellfresh_logo.png';
              }}
            />
          </div>

          {/* Center Navigation Links (Dynamic from liveHeaderSettings.menuItems) */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-3 text-sm sm:text-base font-semibold text-slate-800 shrink-0 flex-nowrap">
            {menuItemsToRender.map((item) => (
              <div key={item.id} className="relative group py-2">
                <button
                  type="button"
                  onClick={() => {
                    if (item.link?.startsWith('/about')) navigateTo('about');
                    else if (item.link?.startsWith('/shop')) navigateTo('shop');
                    else if (item.link?.startsWith('/contact')) navigateTo('contact');
                    else if (item.link?.startsWith('/membership') || item.link?.startsWith('/vip')) navigateTo('membership');
                    else if (item.link?.startsWith('#quote')) setIsQuoteModalOpen(true);
                    else if (item.link?.startsWith('/product')) {
                      navigate(item.link);
                      setActiveNav('product_detail');
                    } else if (item.link) {
                      window.location.href = item.link;
                    }
                  }}
                  className="px-3 py-2 flex items-center gap-1 hover:text-[#0093d0] transition-colors cursor-pointer rounded-lg hover:bg-slate-50 whitespace-nowrap text-slate-700"
                >
                  <span>{item.label}</span>
                  {item.hasDropdown && (
                    <ChevronDown className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform text-slate-400" />
                  )}
                </button>

                {/* Dropdown Menu */}
                {item.hasDropdown && item.dropdownItems && item.dropdownItems.length > 0 && (
                  <div className="absolute top-full left-0 pt-1.5 opacity-0 translate-y-1 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible transition-all duration-200 z-50">
                    <div className="w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2">
                      {item.dropdownItems.map((sub, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => {
                            if (sub.link?.startsWith('/about')) navigateTo('about');
                            else if (sub.link?.startsWith('/shop')) navigateTo('shop');
                            else if (sub.link?.startsWith('/contact')) navigateTo('contact');
                            else if (sub.link?.startsWith('/membership') || sub.link?.startsWith('/vip')) navigateTo('membership');
                            else if (sub.link?.startsWith('#quote')) setIsQuoteModalOpen(true);
                            else if (sub.link?.startsWith('/product')) {
                              navigate(sub.link);
                              setActiveNav('product_detail');
                            } else if (sub.link) {
                              window.location.href = sub.link;
                            }
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:text-[#0093d0] hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* VIP Club Membership Pill */}
            <button 
              type="button"
              onClick={() => {
                if (activeNav === 'home') {
                  const el = document.getElementById('membership-club-section');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                    return;
                  }
                }
                navigateTo('membership');
              }}
              className={`px-3 py-1.5 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap rounded-lg ${
                activeNav === 'membership'
                  ? 'text-amber-900 font-bold bg-amber-100'
                  : 'hover:text-amber-900 text-amber-800 bg-amber-50/90 hover:bg-amber-100/80 border border-amber-200/60'
              }`}
            >
              <Award className="w-4 h-4 text-amber-500" />
              <span>VIP Club</span>
              <span className="text-[9px] bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                মেম্বার
              </span>
            </button>
          </nav>

          {/* Right Tools: Search, Bag, Customer Account & Get A Quote */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Interactive Inline Search Bar */}
            <div className="relative flex items-center rounded-full bg-slate-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-900/10 border border-slate-200 focus-within:border-slate-400 text-slate-900 w-28 sm:w-40 md:w-52 lg:w-56 pl-3 pr-2 py-1.5 shadow-2xs transition-all duration-300">
              <Search className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (activeNav !== 'shop') {
                    navigateTo('shop');
                  }
                  setCurrentPage(1);
                }}
                onFocus={() => {
                  if (activeNav !== 'shop' && searchTerm.trim()) {
                    navigateTo('shop');
                  }
                }}
                placeholder="Search..."
                className="w-full bg-transparent text-[11px] sm:text-xs pl-2 pr-1 focus:outline-none placeholder:text-slate-400 text-slate-900"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Clear Search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Shopping Bag Button */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-slate-800 hover:text-slate-950 transition-transform active:scale-95 cursor-pointer"
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
              {totalCartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-rose-600 text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Customer Account / Order Tracking Button */}
            <div className="relative group">
              <button 
                onClick={() => onGoToLogin ? onGoToLogin() : undefined}
                className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all text-xs font-medium cursor-pointer ${
                  customerSession
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    : 'text-slate-800 hover:text-slate-950'
                }`}
                aria-label="Customer Account / Track Orders"
                title={customerSession ? `Logged in as ${customerSession.phone}` : "Account / Track Orders"}
              >
                <User className={`w-4 h-4 sm:w-5 sm:h-5 ${customerSession ? 'text-emerald-600' : ''}`} />
                {customerSession ? (
                  <span className="hidden sm:inline font-semibold max-w-[90px] truncate">
                    {customerSession.name || customerSession.phone}
                  </span>
                ) : null}
              </button>

              {customerSession && (
                <div className="hidden group-hover:block absolute right-0 top-full pt-1.5 z-50">
                  <div className="bg-white rounded-xl shadow-xl border border-slate-200 py-2.5 px-3.5 text-xs w-52 text-slate-800">
                    <p className="font-semibold text-slate-900 truncate">{customerSession.name || 'সম্মানিত ক্রেতা'}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{customerSession.phone}</p>
                    <div className="border-t border-slate-100 my-2"></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onGoToLogin) onGoToLogin();
                      }}
                      className="w-full text-left py-1 text-slate-700 hover:text-blue-600 font-medium cursor-pointer transition flex items-center justify-between"
                    >
                      <span>অর্ডার ট্র্যাক করুন</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearCustomerSession();
                        setCustomerSession(null);
                      }}
                      className="w-full text-left py-1 text-rose-600 hover:text-rose-700 font-medium cursor-pointer transition"
                    >
                      লগআউট (Logout)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Gradient Get A Quote Button (Matching Screenshot) */}
            {liveHeaderSettings.showCtaButton !== false && (
              <button
                onClick={() => setIsQuoteModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-2 bg-gradient-to-r from-[#0093d0] to-[#00a651] hover:from-[#0082b8] hover:to-[#008f45] text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer shrink-0"
              >
                <span>{liveHeaderSettings.ctaButtonText || 'Get A Quote'}</span>
                <span className="text-base font-bold">→</span>
              </button>
            )}

            {/* Mobile Hamburger Menu Toggle Button (Visible on lg:hidden) */}
            <button
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              className="lg:hidden p-2 rounded-xl text-slate-900 hover:bg-slate-100 transition-transform active:scale-95 cursor-pointer"
              aria-label="Toggle Mobile Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white text-slate-900 border-b border-slate-200 shadow-2xl animate-in slide-in-from-top-2 duration-200 px-5 py-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Navigation Menu</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-700 cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex flex-col space-y-1 text-sm font-semibold">
              <button
                onClick={() => navigateTo('home')}
                className={`w-full text-left px-4 py-2.5 rounded-xl transition flex items-center justify-between ${
                  activeNav === 'home' ? 'bg-slate-900 text-white font-bold' : 'hover:bg-slate-100 text-slate-800'
                }`}
              >
                <span>Home</span>
                <ChevronRight className="w-4 h-4 opacity-70" />
              </button>

              {menuItemsToRender.map((item) => (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (item.link?.startsWith('/about')) navigateTo('about');
                      else if (item.link?.startsWith('/shop')) navigateTo('shop');
                      else if (item.link?.startsWith('/contact')) navigateTo('contact');
                      else if (item.link?.startsWith('/membership') || item.link?.startsWith('/vip')) navigateTo('membership');
                      else if (item.link?.startsWith('#quote')) setIsQuoteModalOpen(true);
                      else if (item.link?.startsWith('/product')) {
                        navigate(item.link);
                        setActiveNav('product_detail');
                      } else if (item.link) {
                        window.location.href = item.link;
                      }
                    }}
                    className="w-full text-left px-4 py-2.5 rounded-xl transition flex items-center justify-between hover:bg-slate-100 text-slate-800"
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="w-4 h-4 opacity-70" />
                  </button>
                  {item.hasDropdown && item.dropdownItems && (
                    <div className="pl-6 space-y-1 border-l-2 border-slate-100 ml-4">
                      {item.dropdownItems.map((sub, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            if (sub.link?.startsWith('/about')) navigateTo('about');
                            else if (sub.link?.startsWith('/shop')) navigateTo('shop');
                            else if (sub.link?.startsWith('/contact')) navigateTo('contact');
                            else if (sub.link?.startsWith('/membership') || sub.link?.startsWith('/vip')) navigateTo('membership');
                            else if (sub.link?.startsWith('#quote')) setIsQuoteModalOpen(true);
                            else if (sub.link?.startsWith('/product')) {
                              navigate(sub.link);
                              setActiveNav('product_detail');
                            } else if (sub.link) {
                              window.location.href = sub.link;
                            }
                          }}
                          className="w-full text-left py-1 text-xs text-slate-600 hover:text-[#0093d0]"
                        >
                          • {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (activeNav === 'home') {
                    const el = document.getElementById('membership-club-section');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                      return;
                    }
                  }
                  navigateTo('membership');
                }}
                className={`w-full text-left px-4 py-3 rounded-xl transition flex items-center justify-between ${
                  activeNav === 'membership'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-gradient-to-r from-amber-50 to-orange-50 hover:bg-amber-100 text-amber-900 border border-amber-200/60 font-semibold'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>VIP Club (মেম্বারশিপ ও পয়েন্ট ছাড়)</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-70" />
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsQuoteModalOpen(true);
                }}
                className="w-full text-center py-3 rounded-xl bg-gradient-to-r from-[#0093d0] to-[#00a651] text-white font-bold shadow-md cursor-pointer"
              >
                {liveHeaderSettings.ctaButtonText || 'Get A Quote'} →
              </button>

              {customerSession ? (
                <div className="px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                    <span className="flex items-center gap-1.5 truncate">
                      <User className="w-4 h-4 text-emerald-600 shrink-0" />
                      {customerSession.name || 'সম্মানিত ক্রেতা'}
                    </span>
                    <span className="font-mono text-[11px] text-emerald-700">{customerSession.phone}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60 text-xs">
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        if (onGoToLogin) onGoToLogin();
                      }}
                      className="text-blue-700 font-semibold hover:underline"
                    >
                      অর্ডার ট্র্যাক করুন
                    </button>
                    <button
                      onClick={() => {
                        clearCustomerSession();
                        setCustomerSession(null);
                      }}
                      className="text-rose-600 font-semibold hover:underline"
                    >
                      লগআউট
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (onGoToLogin) onGoToLogin();
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl transition flex items-center justify-between hover:bg-slate-100 text-slate-800"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <User className="w-4 h-4 text-slate-600" />
                    Account & Track Orders
                  </span>
                  <ChevronRight className="w-4 h-4 opacity-70" />
                </button>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* ============================================================
          MAIN BODY CONTENT (ROUTED VIEWS)
          ============================================================ */}

      {/* VIEW 1: DEDICATED PRODUCT DETAIL VIEW (Screenshot 2: product_385231.html) */}
      {activeNav === 'product_detail' && (
        <div className="py-6 sm:py-12 lg:py-16 max-w-7xl mx-auto px-4 sm:px-8">
          
          <div className="mb-4 sm:mb-6 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-slate-500">
            <button onClick={() => navigateTo('home')} className="hover:text-slate-900 transition-colors cursor-pointer">Home</button>
            <span>/</span>
            <button onClick={() => navigateTo('shop')} className="hover:text-slate-900 transition-colors cursor-pointer">Shop</button>
            <span>/</span>
            <span className="text-slate-800 font-medium">{activeProductDetail.series}</span>
            <span>/</span>
            <span className="text-slate-900 font-semibold truncate max-w-[200px] sm:max-w-none">{activeProductDetail.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-start">
            
            {/* Left Gallery: Horizontal on Mobile / Vertical on Tablet & Desktop */}
            <div className="lg:col-span-6 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
              
              {/* Thumbnail Strip (Scrollable on small screens) */}
              <div className="flex sm:flex-col gap-2 sm:gap-3 overflow-x-auto sm:overflow-y-auto no-scrollbar py-1 shrink-0">
                {currentProductImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-14 h-14 sm:w-20 sm:h-20 bg-[#e8f5e9]/40 border ${activeImageIndex === idx ? 'border-dashed border-slate-900' : 'border-slate-200'} p-1 overflow-hidden transition-all shrink-0`}
                  >
                    <img width={80} height={80} src={imgUrl} alt="Thumbnail" 
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DEFAULT_FANTINE_FALLBACK_IMAGE;
                      }}
                      className="w-full h-full object-contain" 
                    />
                  </button>
                ))}
              </div>

              {/* Main Product Frame with Water Drop / Ripple Green Background + Interactive Zoom */}
              <div 
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  setZoomPos({ x, y });
                  setIsHoverZooming(true);
                }}
                onMouseLeave={() => setIsHoverZooming(false)}
                onClick={() => setIsZoomModalOpen(true)}
                className="relative flex-1 aspect-square max-h-[500px] bg-[#e8f5e9]/30 rounded-none overflow-hidden border border-slate-100 flex items-center justify-center group cursor-zoom-in"
              >
                <img fetchPriority="high" width={500} height={500} src={currentProductImages[activeImageIndex] || activeProductDetail.coverImage} alt={activeProductDetail.title} 
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_FANTINE_FALLBACK_IMAGE;
                  }}
                  style={{
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    transform: isHoverZooming ? 'scale(2.2)' : 'scale(1)'
                  }}
                  className="w-4/5 h-4/5 object-contain transition-transform duration-200 pointer-events-none select-none"
                />

                {/* Left/Right Carousel Arrows */}
                {currentProductImages.length > 1 && (
                  <>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex(prev => (prev === 0 ? currentProductImages.length - 1 : prev - 1));
                      }}
                      className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/60 text-white rounded-none flex items-center justify-center transition-colors cursor-pointer z-10"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex(prev => (prev === currentProductImages.length - 1 ? 0 : prev + 1));
                      }}
                      className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/60 text-white rounded-none flex items-center justify-center transition-colors cursor-pointer z-10"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Zoom Icon Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsZoomModalOpen(true);
                  }}
                  className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 p-2 bg-slate-900/60 hover:bg-slate-900 text-white rounded-full transition-colors cursor-pointer z-10"
                  title="Click to Zoom Fullscreen"
                >
                  <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>

            </div>

            {/* Right Side: Title, Description, Benefits, How-To-Use */}
            <div className="lg:col-span-6 space-y-4 sm:space-y-6">
              <h1 className="font-sans text-2xl sm:text-3xl lg:text-4xl text-slate-900 font-semibold tracking-tight leading-snug">
                {activeProductDetail.title}
              </h1>

              {/* Price Row */}
              <div className="flex flex-wrap items-baseline gap-2.5 sm:gap-3">
                <span className="text-xl sm:text-2xl font-bold text-slate-900">{formatPrice(activeProductDetail.price)}</span>
                {activeProductDetail.regularPrice && (
                  <span className="text-sm sm:text-base text-slate-500 line-through">{formatPrice(activeProductDetail.regularPrice)}</span>
                )}
                {activeProductDetail.discountPercentage && (
                  <span className="text-xs bg-rose-50 text-rose-700 font-bold px-2 py-0.5 border border-rose-200">
                    SAVE {activeProductDetail.discountPercentage}%
                  </span>
                )}
              </div>

              {/* Actions (ADD TO BAG & BUY NOW) */}
              <div className="pt-1 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                <button 
                  onClick={() => handleAddToCart(activeProductDetail)}
                  className="flex-1 bg-slate-950 hover:bg-slate-800 text-white font-semibold py-3 sm:py-3.5 px-6 text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  ADD TO BAG
                </button>
                <button 
                  onClick={() => {
                    handleAddToCart(activeProductDetail);
                    setIsCartOpen(false);
                    navigateTo('checkout');
                  }}
                  className="flex-1 bg-gradient-to-r from-[#0284c7] to-[#16a34a] hover:from-[#0369a1] hover:to-[#15803d] text-white font-bold py-3.5 px-6 text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer rounded-xl"
                >
                  BUY NOW
                </button>
              </div>

              {/* Product Description */}
              {(activeProductDetail.description || activeProductDetail.shortSummary) && (
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <h2 className="font-sans text-base font-semibold text-slate-900 tracking-wide">Product Description :</h2>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line">
                    {activeProductDetail.description || activeProductDetail.shortSummary}
                  </p>
                </div>
              )}

              {/* Benefits Highlights */}
              {activeProductDetail.benefitsHighlights && (
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <h2 className="font-sans text-base font-semibold text-slate-900 tracking-wide">Benefits Highlights :</h2>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line">
                    {activeProductDetail.benefitsHighlights}
                  </p>
                </div>
              )}

              {/* How to use it */}
              {(activeProductDetail.howToUse || (activeProductDetail as any).howToUseIt) && (
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <h2 className="font-sans text-base font-semibold text-slate-900 tracking-wide">How to use it :</h2>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line">
                    {activeProductDetail.howToUse || (activeProductDetail as any).howToUseIt}
                  </p>
                </div>
              )}

              {/* Ingredients */}
              {activeProductDetail.ingredients && (
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <h2 className="font-sans text-base font-semibold text-slate-900 tracking-wide">INGREDIENT :</h2>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line">
                    {activeProductDetail.ingredients}
                  </p>
                </div>
              )}

            </div>

          </div>

          {/* Customer Reviews Section (Requires Customer Login + Placed Order) */}
          <div className="mt-14 pt-10 border-t border-slate-200">
            <ProductReviewsSection 
              product={activeProductDetail} 
              onOpenLoginModal={onGoToLogin} 
              accentColor="#0284c7" 
            />
          </div>
        </div>
      )}

      {/* VIEW 2: CONTACT US PAGE (Screenshot 1) */}
      {activeNav === 'contact' && (
        <div className="py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-white">
            
            <div className="lg:col-span-4 bg-[#1e293b] text-white p-8 sm:p-10 space-y-8 flex flex-col justify-between">
              <div className="space-y-4">
                <h2 className="font-sans text-2xl font-semibold text-white">Contact information</h2>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  Contact us for product inquiries, wholesale pricing, international distribution, and OEM/ODM manufacturing partnerships.
                </p>
              </div>

              <div className="space-y-6 text-xs text-slate-300">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>{displayPhone}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                  <a href={`mailto:${displayEmail}`} className="hover:text-white transition-colors">{displayEmail}</a>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    {displayAddress}
                  </span>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-700 text-[11px] text-slate-400">
                {displayCompanyName.toUpperCase()} • Global Customer Service
              </div>
            </div>

            <div className="lg:col-span-8 p-8 sm:p-12 space-y-6 bg-white">
              <h3 className="font-sans text-2xl text-slate-900 font-normal">Leave us message</h3>
              
              <form onSubmit={handleContactSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Full Name</label>
                    <input 
                      type="text" 
                      value={contactSenderName} 
                      onChange={e => setContactSenderName(e.target.value)} 
                      placeholder="Your name"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Email *</label>
                    <input 
                      type="email" 
                      value={contactEmail} 
                      onChange={e => setContactEmail(e.target.value)} 
                      required 
                      placeholder="your.email@example.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-xs font-semibold text-slate-700">Phone</label>
                      <span className="text-[10px] text-slate-500">Optional</span>
                    </div>
                    <input 
                      type="tel" 
                      value={contactPhone} 
                      onChange={e => setContactPhone(e.target.value)} 
                      placeholder="+82 / 01..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-xs font-semibold text-slate-700">Subject</label>
                      <span className="text-[10px] text-slate-500">Optional</span>
                    </div>
                    <input 
                      type="text" 
                      value={contactSubject} 
                      onChange={e => setContactSubject(e.target.value)} 
                      placeholder="Product inquiry, wholesale, etc."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <label className="text-xs font-semibold text-slate-700">Message *</label>
                    <span className="text-[10px] text-slate-500">Required</span>
                  </div>
                  <textarea 
                    rows={5} 
                    value={contactMessage} 
                    onChange={e => setContactMessage(e.target.value)} 
                    required
                    placeholder="Write your message here..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 resize-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    type="submit" 
                    disabled={isSubmittingContact}
                    className="bg-[#111827] hover:bg-slate-800 text-white font-medium px-8 py-3 rounded-lg text-xs tracking-wider uppercase transition-colors shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingContact ? 'Submitting...' : contactSubmitted ? 'Sent!' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* VIEW 3: SHOP CATALOG PAGE (Screenshot 3 & 4) */}
      {activeNav === 'shop' && (
        <div className="py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
          


          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white p-5 sm:p-6 border border-slate-200/80 shadow-xs">
                <h2 className="font-sans text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 pb-2 border-b border-slate-100">
                  Shop Categories
                </h2>
                
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-3">
                  {shopCategories.map((cat) => (
                    <label 
                      key={cat}
                      className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 hover:text-slate-950 select-none"
                    >
                      <input 
                        type="checkbox"
                        checked={selectedCategoryCheckbox === cat}
                        onChange={() => {
                          setSelectedCategoryCheckbox(cat);
                          setCurrentPage(1);
                        }}
                        className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300 cursor-pointer"
                      />
                      <span className="truncate">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {shopBrands.length > 1 && (
                <div className="bg-white p-5 sm:p-6 border border-slate-200/80 shadow-xs">
                  <h2 className="font-sans text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 pb-2 border-b border-slate-100">
                    Brands
                  </h2>
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-3">
                    {shopBrands.map((brand: any) => (
                      <label 
                        key={brand}
                        className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 hover:text-slate-950 select-none"
                      >
                        <input 
                          type="radio"
                          name="brand_filter"
                          checked={selectedBrand === brand}
                          onChange={() => {
                            setSelectedBrand(brand);
                            setCurrentPage(1);
                          }}
                          className="w-4 h-4 text-slate-900 focus:ring-slate-900 border-slate-300 cursor-pointer"
                        />
                        <span className="truncate">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white p-5 sm:p-6 border border-slate-200/80 shadow-xs">
                <h2 className="font-sans text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 pb-2 border-b border-slate-100">
                  Filter by Price
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between text-xs text-slate-600 font-medium">
                    <span>Tk. 0</span>
                    <span>Tk. {priceRange.toLocaleString('en-US')}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50000"
                    step="500"
                    value={priceRange}
                    onChange={(e) => {
                      setPriceRange(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="w-full accent-slate-900 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-9 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="text-xs text-slate-500 font-medium">
                  Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredCatalog.length)} of {filteredCatalog.length} products (Page {currentPage})
                  {searchTerm && <span className="text-slate-800 font-semibold ml-1">for &quot;{searchTerm}&quot;</span>}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Sort:</span>
                  <select 
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="bg-white border border-slate-200 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-800 rounded-none focus:outline-none cursor-pointer"
                  >
                    <option value="featured">Featured</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Product Grid or Empty State (2-cols on mobile, 3-cols on tablet/desktop) */}
              {paginatedProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
                  {paginatedProducts.map((product) => (
                    <div 
                      key={product.id}
                      className="group bg-white border border-slate-200/80 hover:shadow-lg transition-all p-2.5 sm:p-3 flex flex-col justify-between"
                    >
                      <div className="relative aspect-square w-full bg-[#f6f5f2] overflow-hidden mb-2.5 sm:mb-3 cursor-pointer" onClick={() => openProductDetail(product)}>
                        <ResponsiveImage width={286} height={286} src={product.coverImage} alt={product.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 50vw, 33vw"
                        />
                      </div>

                      <div className="text-center space-y-1 sm:space-y-1.5">
                        <h4 
                          onClick={() => openProductDetail(product)}
                          className="font-sans text-xs sm:text-sm font-medium text-slate-900 hover:text-amber-800 transition-colors cursor-pointer truncate"
                        >
                          {product.title}
                        </h4>

                        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 font-sans text-xs">
                          <span className="text-rose-600 font-semibold">{formatPrice(product.price)}</span>
                          {product.regularPrice && (
                            <span className="text-slate-500 line-through text-[11px] sm:text-xs">{formatPrice(product.regularPrice)}</span>
                          )}
                        </div>

                        <button 
                          onClick={() => handleAddToCart(product)}
                          className="mt-2 w-full bg-slate-900 hover:bg-slate-800 text-white text-[10px] sm:text-[11px] font-bold py-2 uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          ADD TO BAG
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-4">
                  <Search className="w-12 h-12 text-slate-300 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="font-sans text-lg font-bold text-slate-800">
                      No products found
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      We couldn&apos;t find any products matching &quot;{searchTerm}&quot;. Try adjusting your keywords or category filters.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategoryCheckbox('All');
                      setCurrentPage(1);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Clear Search & View All
                  </button>
                </div>
              )}

              <div className="flex items-center justify-center gap-3 pt-8 text-xs text-slate-600 font-medium">
                <button 
                  onClick={() => setCurrentPage(1)} 
                  disabled={currentPage === 1}
                  className="hover:text-slate-950 disabled:opacity-40"
                >
                  ← First
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                  disabled={currentPage === 1}
                  className="hover:text-slate-950 disabled:opacity-40"
                >
                  &lt; Previous
                </button>

                {[...Array(totalPages)].map((_, i) => (
                  <button 
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-6 h-6 flex items-center justify-center ${currentPage === i + 1 ? 'font-bold text-slate-950 border-b border-slate-950' : 'hover:text-slate-950'}`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                  disabled={currentPage === totalPages}
                  className="hover:text-slate-950 disabled:opacity-40"
                >
                  Next &gt;
                </button>
                <button 
                  onClick={() => setCurrentPage(totalPages)} 
                  disabled={currentPage === totalPages}
                  className="hover:text-slate-950 disabled:opacity-40"
                >
                  Last →
                </button>
              </div>



            </div>

          </div>
        </div>
      )}

      {/* ============================================================
          VIEW 4: DEDICATED ABOUT US PAGE (Clean Simple Text & Narrative)
          ============================================================ */}
      {activeNav === 'about' && (
        <div className="bg-[#faf9f6] animate-fadeIn min-h-[70vh]">
          
          {/* 1. CINEMATIC ABOUT HERO BANNER */}
          <section className="relative overflow-hidden -mt-[84px] sm:-mt-[92px] md:-mt-[100px] pt-[84px] sm:pt-[92px] md:pt-[100px] min-h-[420px] sm:min-h-[500px] flex items-center justify-center bg-slate-950 text-white border-b border-slate-900">
            <div className="absolute inset-0 z-0 overflow-hidden">
              <img
                src={aboutSettings.image || aboutSettings.heroImage || 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=1600&auto=format&fit=crop&q=85'}
                alt={aboutSettings.title || aboutSettings.heroTitle || 'About FANTINE'}
                className="w-full h-full object-cover filter brightness-75 scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-slate-950/40"></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 py-16 text-center space-y-4">
              <div className="inline-flex items-center gap-2 bg-[#93c5fd]/20 text-[#93c5fd] border border-[#93c5fd]/30 text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5" />
                {aboutSettings.badge || 'ABOUT OUR BRAND'}
              </div>

              <h1 className="font-sans text-3xl sm:text-5xl lg:text-6xl text-white font-semibold uppercase leading-tight tracking-tight drop-shadow-md">
                {aboutSettings.title || aboutSettings.heroTitle || 'about us'}
              </h1>

              {(aboutSettings.subtitle || aboutSettings.heroSubtitle) && (
                <p className="text-slate-200 text-sm sm:text-base font-normal leading-relaxed max-w-2xl mx-auto">
                  {aboutSettings.subtitle || aboutSettings.heroSubtitle}
                </p>
              )}

              {/* Breadcrumb */}
              <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-300 font-mono tracking-wider uppercase">
                <button onClick={() => navigateTo('home')} className="hover:text-white transition-colors cursor-pointer">HOME</button>
                <span>/</span>
                <span className="text-[#93c5fd] font-semibold">about us</span>
              </div>
            </div>
          </section>

          {/* 2. MAIN STORY TEXT CONTENT */}
          <section className="py-16 sm:py-24 max-w-4xl mx-auto px-4 sm:px-8">
            <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-xs border border-slate-200/80 space-y-8">
              <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed font-normal text-base sm:text-lg whitespace-pre-line space-y-4 text-justify">
                {aboutSettings.content || [
                  aboutSettings.storyParagraph1,
                  aboutSettings.storyParagraph2,
                  aboutSettings.storyParagraph3
                ].filter(Boolean).join('\n\n') || 'Detailed information about us will be added soon.'}
              </div>


            </div>
          </section>

        </div>
      )}

      {/* ============================================================
          VIEW 5: DEDICATED CHECKOUT PAGE (Exact UX from User Design)
          ============================================================ */}
      {activeNav === 'checkout' && (
        <CheckoutPage
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveFromCart}
          onClearCart={() => clearCartAction()}
          ecomSettings={ecomSettings || (DEFAULT_ABOUT_SETTINGS as any)}
          onNavigateHome={() => navigateTo('home')}
          onNavigateShop={() => navigateTo('shop')}
          onOpenLoginModal={onGoToLogin}
        />
      )}

      {/* VIEW 6: HOME VIEW (Default - Matching brandini.co.kr) */}
      {activeNav === 'home' && (
        <>
          {/* ============================================================
              1. FULL-WIDTH DYNAMIC HERO CAROUSEL SLIDER (Admin Panel Dynamic)
              ============================================================ */}
          <section 
            className="relative w-full overflow-hidden bg-slate-950 text-white select-none min-h-[460px] sm:min-h-[560px] lg:min-h-[640px] xl:min-h-[700px] flex items-center"
            onMouseEnter={() => setIsSliderPaused(true)}
            onMouseLeave={() => setIsSliderPaused(false)}
          >
            {activeHeroBanners.map((banner, index) => {
              const isActive = index === activeSlideIndex;
              return (
                <div
                  key={banner.id || index}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  {/* Slide Background: High-Res Video or Image */}
                  {banner.mediaType === 'video' && banner.videoUrl ? (
                    <div className="absolute inset-0 overflow-hidden">
                      <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        className="w-full h-full object-cover"
                      >
                        <source src={banner.videoUrl} type="video/mp4" />
                      </video>
                      <div className={`absolute inset-0 bg-gradient-to-r ${banner.bgGradient || 'from-slate-950/85 via-slate-900/60 to-transparent'}`} />
                    </div>
                  ) : (
                    <div className="absolute inset-0">
                      <picture>
                        {banner.mobileImageUrl && (
                          <source media="(max-width: 640px)" srcSet={banner.mobileImageUrl} />
                        )}
                        <img
                          src={banner.imageUrl || 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=1920&auto=format&fit=crop&q=85'}
                          alt={banner.title || 'livewellfresh banner'}
                          className="w-full h-full object-cover object-center"
                          loading={index === 0 ? 'eager' : 'lazy'}
                        />
                      </picture>
                      <div className={`absolute inset-0 bg-gradient-to-r ${banner.bgGradient || 'from-slate-950/85 via-slate-900/50 to-transparent'}`} />
                    </div>
                  )}

                  {/* Slide Content Overlay */}
                  {!banner.imageOnly && (
                    <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 h-full flex flex-col justify-center items-start py-16 sm:py-24">
                      {banner.badge && (
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs sm:text-sm font-bold tracking-wider uppercase mb-4 animate-fadeIn">
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>{banner.badge}</span>
                        </div>
                      )}

                      {banner.showDiscount && banner.discountText && (
                        <span className="inline-block px-3 py-1 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs sm:text-sm font-extrabold rounded-md uppercase tracking-wider mb-3 shadow-md">
                          {banner.discountText}
                        </span>
                      )}

                      <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight max-w-3xl leading-[1.15] mb-4 sm:mb-6 drop-shadow-md">
                        {banner.title}
                      </h1>

                      {banner.subtitle && (
                        <p className="text-sm sm:text-lg md:text-xl text-slate-200 max-w-2xl leading-relaxed mb-6 sm:mb-8 font-normal drop-shadow-sm">
                          {banner.subtitle}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (banner.actionType === 'product' && banner.productId) {
                              const found = products.find(p => p.id === banner.productId);
                              if (found) {
                                openProductDetail(found);
                              } else {
                                navigateTo('shop');
                              }
                            } else if (banner.link === '#quote') {
                              setIsQuoteModalOpen(true);
                            } else if (banner.link?.startsWith('/product')) {
                              navigate(banner.link);
                              setActiveNav('product_detail');
                            } else if (banner.link?.startsWith('/')) {
                              navigate(banner.link);
                            } else {
                              navigateTo('shop');
                            }
                          }}
                          className="px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-gradient-to-r from-[#0093d0] to-[#00a651] hover:from-[#0082b8] hover:to-[#008f45] text-white font-bold text-sm sm:text-base shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-2 group cursor-pointer active:scale-95"
                        >
                          <span>{banner.buttonText || 'BUY NOW'}</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsQuoteModalOpen(true)}
                          className="px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white font-semibold text-sm sm:text-base transition-all duration-300 flex items-center gap-2 cursor-pointer active:scale-95"
                        >
                          <span>Get Factory Quote</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Slider Navigation Arrows (Prev / Next) */}
            {activeHeroBanners.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/35 hover:bg-black/65 backdrop-blur-md text-white flex items-center justify-center border border-white/20 transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-lg"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNextSlide}
                  className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/35 hover:bg-black/65 backdrop-blur-md text-white flex items-center justify-center border border-white/20 transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-lg"
                  aria-label="Next Slide"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Dot Pagination Indicators */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
                  {activeHeroBanners.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={() => setActiveSlideIndex(dotIdx)}
                      className={`transition-all rounded-full cursor-pointer ${
                        dotIdx === activeSlideIndex
                          ? 'w-8 h-2.5 bg-gradient-to-r from-[#0093d0] to-[#00a651] shadow-md'
                          : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/80'
                      }`}
                      aria-label={`Slide ${dotIdx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </section>

          {/* ============================================================
              3. FEATURED PRODUCTS (Dynamic Products from Admin & DB)
              ============================================================ */}
          <section className="py-12 sm:py-20 lg:py-24 bg-white border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-8">
              
              <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-14">
                <h2 className="font-sans text-2xl sm:text-3xl lg:text-4xl text-slate-900 font-semibold tracking-tight mb-2 sm:mb-3">
                  {ecomSettings?.featuredSectionTitle || `${displayStoreName} Featured Products`}
                </h2>
                <p className="text-slate-600 text-[11px] sm:text-sm tracking-wider uppercase font-medium">
                  {ecomSettings?.featuredSectionSubtitle || 'Premium Quality • OEM/ODM Manufacturing • Direct Factory Supply'}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
                {products.slice(0, 4).map((product) => (
                  <div 
                    key={product.id}
                    className="group flex flex-col bg-white rounded-none border border-transparent hover:border-slate-200 transition-all duration-300 p-1.5 sm:p-2"
                  >
                    <div className="relative aspect-square w-full bg-[#f6f5f2] rounded-none overflow-hidden mb-2.5 sm:mb-4 cursor-pointer" onClick={() => openProductDetail(product)}>
                      <img 
                        loading="lazy" 
                        decoding="async"
                        width={286} 
                        height={286} 
                        src={optimizeImageUrl(product.coverImage, 400)} 
                        srcSet={`${optimizeImageUrl(product.coverImage, 360)} 360w, ${optimizeImageUrl(product.coverImage, 600)} 600w`}
                        sizes="(max-width: 640px) 50vw, 286px"
                        alt={product.title}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_PRODUCT_FALLBACK_IMAGE;
                        }}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-2 sm:p-3 bg-gradient-to-t from-slate-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                          className="w-full bg-white text-slate-950 hover:bg-slate-100 py-1.5 sm:py-2 rounded-none text-[10px] sm:text-xs font-semibold tracking-wider uppercase shadow-md transition-colors"
                        >
                          ADD TO BAG
                        </button>
                      </div>
                    </div>

                    <div className="text-center flex-1 flex flex-col justify-between space-y-1 sm:space-y-1.5">
                      <h3 
                        onClick={() => openProductDetail(product)}
                        className="font-sans text-xs sm:text-base text-slate-900 hover:text-amber-800 transition-colors cursor-pointer font-medium line-clamp-1"
                      >
                        {product.title}
                      </h3>
                      
                      <div className="font-sans text-xs sm:text-sm font-semibold text-slate-700">
                        {formatPrice(product.price)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center mt-8 sm:mt-10">
                <div 
                  onClick={() => navigateTo('shop')}
                  className="flex items-center gap-2 sm:gap-3 text-slate-900 bg-[#f9f8f6] px-4 sm:px-5 py-2 rounded-full border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors shadow-xs"
                >
                  <span className="text-[11px] sm:text-xs font-sans font-semibold">View All Products ({products.length})</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-700" />
                </div>
              </div>
            </div>
          </section>

          {/* ============================================================
              4. SPECIAL BUNDLES & OFFERS (Dynamic Bundle Formulations)
              ============================================================ */}
          <section className="py-12 sm:py-20 lg:py-24 bg-[#faf8f5] border-b border-slate-200/70">
            <div className="max-w-7xl mx-auto px-4 sm:px-8">
              
              <div className="text-center mb-8 sm:mb-14">
                <h2 className="font-sans text-2xl sm:text-3xl lg:text-4xl text-slate-900 font-semibold tracking-tight mb-2">
                  {ecomSettings?.bundlesSectionTitle || 'Exclusive Value Packages & Bundles'}
                </h2>
                <p className="text-slate-600 text-[11px] sm:text-sm tracking-wide font-normal">
                  {ecomSettings?.bundlesSectionSubtitle || 'Curated high-performance formulas packaged with special discount savings'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 max-w-5xl mx-auto">
                {products.slice(0, 3).map((product) => (
                  <div 
                    key={`set-${product.id}`}
                    className="group flex flex-col bg-white rounded-none border border-slate-200/80 hover:shadow-xl transition-all duration-300 p-3 sm:p-4"
                  >
                    <div className="relative aspect-square w-full bg-[#f6f5f2] rounded-none overflow-hidden mb-3 sm:mb-4 cursor-pointer" onClick={() => openProductDetail(product)}>
                      <img 
                        loading="lazy" 
                        decoding="async"
                        width={286} 
                        height={286} 
                        src={optimizeImageUrl(product.coverImage, 400)} 
                        srcSet={`${optimizeImageUrl(product.coverImage, 360)} 360w, ${optimizeImageUrl(product.coverImage, 600)} 600w`}
                        sizes="(max-width: 640px) 50vw, 286px"
                        alt={product.title}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_FANTINE_FALLBACK_IMAGE;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {product.discountPercentage ? (
                        <span className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 border border-rose-200">
                          SAVE {product.discountPercentage}%
                        </span>
                      ) : (
                        <span className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 border border-indigo-200">
                          SET VALUE
                        </span>
                      )}
                    </div>

                    <div className="text-center space-y-1.5 sm:space-y-2 flex-1 flex flex-col justify-between">
                      <h3 
                        onClick={() => openProductDetail(product)}
                        className="font-sans text-xs sm:text-base text-slate-900 hover:text-amber-800 transition-colors cursor-pointer font-medium line-clamp-1"
                      >
                        {product.title}
                      </h3>
                      
                      <div className="flex items-center justify-center gap-2 font-sans">
                        <span className="text-rose-600 font-semibold text-sm sm:text-base">
                          {formatPrice(product.price)}
                        </span>
                        {product.regularPrice && (
                          <span className="text-slate-500 line-through text-xs sm:text-sm">
                            {formatPrice(product.regularPrice)}
                          </span>
                        )}
                      </div>

                      <button 
                        onClick={() => handleAddToCart(product)}
                        className="mt-2 sm:mt-3 w-full bg-slate-900 hover:bg-slate-800 text-white text-[11px] sm:text-xs font-semibold py-2 sm:py-2.5 uppercase tracking-wider transition-colors"
                      >
                        ADD TO BAG
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>


          {/* ============================================================
              6. CLEAN LUXURY FLASH SALE SPOTLIGHT & CLINICAL VIDEO
              ============================================================ */}
          {(!flashSaleConfig || flashSaleConfig.enabled !== false) && (() => {
            const targetProd = flashSaleConfig?.productId 
              ? products.find(p => p.id === flashSaleConfig.productId) 
              : products[0];
            
            if (!targetProd) return null;

            const title = targetProd.title;
            const rawDesc = targetProd.description || targetProd.benefitsHighlights || '';
            const subtitle = rawDesc
              .split('\n')[0]
              .replace(/^Product Description\s*[:：]?\s*/i, '')
              .replace(/^পণ্যের বিবরণ\s*[:：]?\s*/i, '')
              .trim() || rawDesc.slice(0, 160);

            const badgeTag = targetProd.series 
              ? `${targetProd.series.toUpperCase()} • FLASH SALE` 
              : (targetProd.category ? `${targetProd.category.toUpperCase()} • FLASH SALE` : 'LIMITED FLASH SALE • SPECIAL OFFER');

            const image = targetProd.coverImage || (targetProd.images && targetProd.images[0]) || DEFAULT_PRODUCT_FALLBACK_IMAGE;
            const flashPrice = (flashSaleConfig?.flashPrice && flashSaleConfig.flashPrice > 0) 
              ? flashSaleConfig.flashPrice 
              : targetProd.price;
            const origPrice = (flashSaleConfig?.originalPrice && flashSaleConfig.originalPrice > 0)
              ? flashSaleConfig.originalPrice 
              : (targetProd.regularPrice || targetProd.price);
            const discount = origPrice > flashPrice && origPrice > 0 ? Math.round(((origPrice - flashPrice) / origPrice) * 100) : 0;
            const buttonText = 'SHOP FLASH DEAL';

            return (
              <div className="relative">
                {/* Clean Box-Free Luxury Flash Sale Section */}
                <section className="relative overflow-hidden bg-gradient-to-b from-[#faf8f5] via-[#f7f2ea] to-[#f4ede3] py-16 sm:py-24 border-b border-stone-200/70">
                  {/* Subtle Background Radial Aura */}
                  <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-amber-100/60 rounded-full blur-3xl pointer-events-none"></div>

                  <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
                      
                      {/* Left Column: Minimalist Typography & Animated Open Countdown */}
                      <div className="lg:col-span-6 space-y-5 text-center lg:text-left">
                        
                        {/* Animated Header Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-800 text-[11px] font-bold tracking-widest uppercase">
                          <Flame className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                          <span>{badgeTag}</span>
                          {discount > 0 && (
                            <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full ml-1 animate-pulse">
                              {discount}% OFF
                            </span>
                          )}
                        </div>

                        {/* Punchy Title */}
                        <h2 className="font-sans text-3xl sm:text-5xl lg:text-[54px] text-slate-900 leading-[1.12] font-semibold tracking-tight">
                          {title}
                        </h2>
                        
                        {/* Clean Short Subtitle */}
                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg mx-auto lg:mx-0 font-normal line-clamp-2">
                          {subtitle}
                        </p>

                        {/* Open Typography Countdown (No Box Container) */}
                        <div className="pt-2">
                          <div className="flex items-baseline justify-center lg:justify-start gap-3 sm:gap-5 text-slate-900 select-none">
                            <div className="text-center lg:text-left">
                              <span className="font-mono text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">{String(flashSaleTimeLeft.days).padStart(2, '0')}</span>
                              <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-widest mt-0.5">DAYS</span>
                            </div>
                            <span className="font-mono text-2xl sm:text-3xl font-normal text-slate-400 -translate-y-2 sm:-translate-y-3">:</span>
                            <div className="text-center lg:text-left">
                              <span className="font-mono text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">{String(flashSaleTimeLeft.hours).padStart(2, '0')}</span>
                              <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-widest mt-0.5">HOURS</span>
                            </div>
                            <span className="font-mono text-2xl sm:text-3xl font-normal text-slate-400 -translate-y-2 sm:-translate-y-3">:</span>
                            <div className="text-center lg:text-left">
                              <span className="font-mono text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">{String(flashSaleTimeLeft.minutes).padStart(2, '0')}</span>
                              <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-widest mt-0.5">MINS</span>
                            </div>
                            <span className="font-mono text-2xl sm:text-3xl font-normal text-slate-400 -translate-y-2 sm:-translate-y-3">:</span>
                            <div className="text-center lg:text-left">
                              <span className="font-mono text-3xl sm:text-4xl lg:text-5xl font-black text-rose-600 tracking-tight animate-pulse">{String(flashSaleTimeLeft.seconds).padStart(2, '0')}</span>
                              <span className="text-[10px] uppercase font-bold text-rose-600 block tracking-widest mt-0.5">SECS</span>
                            </div>
                          </div>
                        </div>

                        {/* Price & CTA Action */}
                        <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-5 sm:gap-6">
                          <div className="flex items-baseline gap-2.5">
                            <span className="font-sans text-3xl sm:text-4xl font-black text-slate-900">
                              {formatPrice(flashPrice)}
                            </span>
                            {origPrice > flashPrice && (
                              <span className="font-sans text-lg sm:text-xl text-slate-500 line-through">
                                {formatPrice(origPrice)}
                              </span>
                            )}
                          </div>

                          <button 
                            onClick={() => {
                              if (targetProd) {
                                openProductDetail(targetProd);
                              } else {
                                navigateTo('shop');
                              }
                            }}
                            className="bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs tracking-widest uppercase px-8 py-4 rounded-full shadow-xl shadow-slate-950/15 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 inline-flex items-center gap-2.5 cursor-pointer group"
                          >
                            <span>{buttonText || 'SHOP NOW'}</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>

                      </div>

                      {/* Right Column: Seamless Product Image (Directly on background - No Box Card) */}
                      <div className="lg:col-span-6 relative flex items-center justify-center lg:justify-end">
                        <div 
                          onClick={() => {
                            if (targetProd) openProductDetail(targetProd);
                          }}
                          className="relative w-full max-w-md lg:max-w-lg cursor-pointer group flex items-center justify-center"
                        >
                          {/* Ambient Backlight Glow */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-amber-200/40 via-rose-200/30 to-transparent rounded-full blur-3xl opacity-60 group-hover:opacity-90 transition-opacity duration-700 pointer-events-none scale-105"></div>

                          {/* Seamless Floating Product Image */}
                          <img loading="lazy" width={286} height={286} src={image} alt={title} 
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = DEFAULT_FANTINE_FALLBACK_IMAGE;
                            }}
                            className="relative z-10 w-full h-auto max-h-[460px] sm:max-h-[520px] object-contain drop-shadow-2xl group-hover:scale-105 group-hover:-translate-y-2 transition-all duration-700 select-none"
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                </section>
              </div>
            );
          })()}

          {/* ============================================================
              7. RUNNING MARQUEE BANNER
              ============================================================ */}
          <div className="bg-[#bfe0fb] text-slate-900 py-3 px-4 overflow-hidden border-y border-blue-200/60 font-medium text-xs sm:text-sm tracking-wider uppercase text-center">
            <div className="animate-marquee-brands whitespace-nowrap">
              <span>{aboutSettings.missionStatement || 'WE SINCERELY HOPE WE CAN RELIEVE YOUR TENSIONS AND STRESSES, AND GIVE YOU A HEALTHIER AND MORE PEACEFUL LIFE.'} &nbsp; • &nbsp; {aboutSettings.missionStatement || 'WE SINCERELY HOPE WE CAN RELIEVE YOUR TENSIONS AND STRESSES, AND GIVE YOU A HEALTHIER AND MORE PEACEFUL LIFE.'}</span>
            </div>
          </div>

          {/* ============================================================
              8. HIGHLIGHT SPOTLIGHT (Product or Category Focus)
              ============================================================ */}
          {(!ecomSettings?.highlightSpotlight || ecomSettings.highlightSpotlight.enabled !== false) && (() => {
            const hlConfig = ecomSettings?.highlightSpotlight;
            const isProductTarget = !hlConfig || hlConfig.targetType === 'product';
            
            const targetProd = isProductTarget && hlConfig?.productId
              ? products.find(p => p.id === hlConfig.productId)
              : (isProductTarget ? products[0] : null);

            const targetCat = !isProductTarget && hlConfig?.categoryName
              ? hlConfig.categoryName
              : (ecomSettings?.categories?.[0] || 'Creams');

            const rawDesc = targetProd?.description || targetProd?.benefitsHighlights || '';
            const productExcerpt = rawDesc
              .split('\n')[0]
              .replace(/^Product Description\s*[:：]?\s*/i, '')
              .replace(/^পণ্যের বিবরণ\s*[:：]?\s*/i, '')
              .trim() || rawDesc.slice(0, 160);

            const title = hlConfig?.title?.trim() 
              || (isProductTarget ? (targetProd?.title || 'FANTINE Skincare Spotlight') : `Explore Our ${targetCat} Collection`);
            
            const subtitle = (hlConfig?.subtitle && !hlConfig.subtitle.includes('stay in touch')) 
              ? hlConfig.subtitle
              : (isProductTarget ? productExcerpt : `Discover premium formulations and clinical results in our ${targetCat} line.`);
            
            const badgeTag = (hlConfig?.badgeTag && !hlConfig.badgeTag.includes('BRANDINI SEOUL TOWER')) 
              ? hlConfig.badgeTag 
              : (isProductTarget && targetProd?.category ? `${(targetProd.series || targetProd.category).toUpperCase()} • SPOTLIGHT` : `${targetCat.toUpperCase()} • COLLECTION`);
            
            const image = isProductTarget 
              ? (targetProd?.coverImage || (targetProd?.images && targetProd.images[0]) || hlConfig?.customImage || DEFAULT_FANTINE_FALLBACK_IMAGE)
              : (products.find(p => p.category?.toLowerCase() === targetCat.toLowerCase())?.coverImage || hlConfig?.customImage || DEFAULT_FANTINE_FALLBACK_IMAGE);

            const currentPrice = targetProd?.price || 500;
            const regularPrice = targetProd?.regularPrice && targetProd.regularPrice > currentPrice 
              ? targetProd.regularPrice 
              : (targetProd ? Math.round(currentPrice * 1.35) : null);

            const handleBuyNow = () => {
              if (targetProd) {
                handleAddToCart(targetProd, 1);
                setIsCartOpen(true);
              } else {
                navigateTo('shop');
              }
            };

            const handleAction = () => {
              if (isProductTarget && targetProd) {
                openProductDetail(targetProd);
              } else if (!isProductTarget) {
                setSelectedCategoryCheckbox(targetCat);
                navigateTo('shop');
              } else {
                navigateTo('shop');
              }
            };

            return (
              <section className="py-16 sm:py-20 bg-white border-b border-slate-100">
                <div className="max-w-6xl mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
                  
                  <div className="md:col-span-6 flex flex-col items-center justify-center">
                    <div 
                      onClick={handleAction}
                      className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-100 w-full h-[320px] sm:h-[380px] md:h-[410px] max-h-[420px] cursor-pointer group bg-slate-50 flex items-center justify-center"
                    >
                      <img loading="lazy" width={286} height={286} src={image} alt={title} 
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_FANTINE_FALLBACK_IMAGE;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {badgeTag && (
                        <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full text-white text-[11px] font-bold tracking-widest uppercase shadow-md border border-white/10">
                          {badgeTag}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-6 flex flex-col justify-center space-y-5 text-center md:text-left py-2 sm:py-4">
                    <h2 className="font-sans text-3xl sm:text-4xl text-slate-900 font-semibold leading-tight">
                      {title}
                    </h2>
                    
                    <p className="text-slate-600 text-sm leading-relaxed max-w-lg mx-auto md:mx-0 font-normal">
                      {subtitle}
                    </p>

                    {/* Price & Old Price Display */}
                    {isProductTarget && (
                      <div className="flex items-baseline gap-3 justify-center md:justify-start pt-1">
                        <span className="font-sans text-3xl sm:text-4xl font-black text-slate-900">
                          {formatPrice(currentPrice)}
                        </span>
                        {regularPrice && regularPrice > currentPrice && (
                          <span className="font-sans text-lg sm:text-xl text-slate-500 line-through">
                            {formatPrice(regularPrice)}
                          </span>
                        )}
                        {regularPrice && regularPrice > currentPrice && (
                          <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-0.5 rounded-full ml-1">
                            SAVE {Math.round(((regularPrice - currentPrice) / regularPrice) * 100)}%
                          </span>
                        )}
                      </div>
                    )}

                    {/* Buy Now Action Button */}
                    <div className="pt-2 flex flex-wrap items-center gap-3 justify-center md:justify-start">
                      <button 
                        onClick={handleBuyNow}
                        className="bg-gradient-to-r from-[#0284c7] to-[#16a34a] hover:from-[#0369a1] hover:to-[#15803d] active:scale-[0.98] text-white font-bold text-xs sm:text-sm tracking-wider uppercase px-8 py-4 rounded-xl shadow-lg shadow-sky-600/20 hover:shadow-sky-600/30 transition-all cursor-pointer inline-flex items-center gap-2"
                      >
                        <span>BUY NOW</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <button 
                        onClick={handleAction}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs sm:text-sm px-6 py-4 rounded-xl transition-colors cursor-pointer"
                      >
                        View Details
                      </button>
                    </div>
                  </div>

                </div>
              </section>
            );
          })()}

          {/* ============================================================
              VIP CLUB MEMBERSHIP PROMOTION (Meena Bazar / Shwapno Style)
              ============================================================ */}
          <div id="membership-club-section">
            <LoyaltyMembershipSection 
              onExploreProducts={() => navigateTo('shop')}
              onOpenCheckout={() => setIsCartOpen(true)}
            />
          </div>
        </>
      )}

      {/* VIEW 8: DEDICATED VIP MEMBERSHIP CLUB VIEW */}
      {activeNav === 'membership' && (
        <div className="pt-8 sm:pt-12 min-h-screen bg-[#f8fafc]">
          <LoyaltyMembershipSection 
            onExploreProducts={() => navigateTo('shop')}
            onOpenCheckout={() => setIsCartOpen(true)}
          />
        </div>
      )}

      {/* ============================================================
          LUXURY FOOTER
          ============================================================ */}
      <React.Suspense fallback={<div className="h-40 bg-[#111827]"></div>}>
        <FantineFooter 
          displayStoreLogo={displayStoreLogo}
          displayStoreName={displayStoreName}
          displayTagline={displayTagline}
          displayEmail={displayEmail}
          displayPhone={displayPhone}
          shopCategories={shopCategories}
          socialLinks={socialLinks}
          setActiveNav={(nav) => navigateTo(nav as any)}
          setSelectedCategoryCheckbox={setSelectedCategoryCheckbox}
          scrollToTop={scrollToTop}
        />
      </React.Suspense>

      {/* ============================================================
          SLIDE-OUT SHOPPING BAG & CHECKOUT DRAWER
          ============================================================ */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" onClick={() => setIsCartOpen(false)}></div>
          
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
            <div className="w-screen max-w-full sm:max-w-md bg-white shadow-2xl flex flex-col">
              
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-slate-800" />
                  <h3 className="font-sans text-lg font-bold text-slate-900">Your Shopping Bag ({totalCartCount})</h3>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="text-slate-500 hover:text-slate-800 p-1 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 10-Minute Cart Reservation Hold Banner */}
              {cart.length > 0 && (
                <div className="bg-gradient-to-r from-amber-500/15 to-orange-500/15 border-b border-amber-500/25 px-6 py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-semibold">
                    <Clock className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
                    <span>Stock Reserved For You:</span>
                  </div>
                  <div className="font-mono font-black text-amber-950 bg-amber-200/80 px-2 py-0.5 rounded-md text-xs shadow-2xs">
                    {Math.floor(reservationSeconds / 60).toString().padStart(2, '0')}:{(reservationSeconds % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                    <div className="font-sans text-lg text-slate-600">Your bag is empty</div>
                    <p className="text-xs text-slate-500">Discover our featured products to get started.</p>
                    <button
                      type="button"
                      onClick={() => setIsCartOpen(false)}
                      className="mt-4 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      Continue Shopping
                    </button>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.product.id} className="flex gap-3 sm:gap-4 pb-4 border-b border-slate-100 items-center relative group">
                      <img 
                        src={item.product.coverImage} 
                        alt={item.product.title} 
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_FANTINE_FALLBACK_IMAGE;
                        }}
                        className="w-16 h-16 object-cover bg-slate-50 rounded-lg border border-slate-100 shrink-0" 
                      />
                      <div className="flex-1 min-w-0 pr-1">
                        <h4 className="font-sans text-sm font-semibold text-slate-900 truncate">{item.product.title}</h4>
                        <div className="text-xs text-slate-500 mt-0.5">{formatPrice(item.product.price)}</div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <button 
                            type="button"
                            onClick={() => {
                              if (item.quantity > 1) {
                                handleUpdateQuantity(item.product.id, item.quantity - 1);
                              } else {
                                handleRemoveFromCart(item.product.id);
                              }
                            }}
                            className="w-6 h-6 border border-slate-200 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-semibold px-2">{item.quantity}</span>
                          <button 
                            type="button"
                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 border border-slate-200 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Right side: Remove Cross Button + Total Price */}
                      <div className="flex flex-col items-end justify-between self-stretch shrink-0 py-0.5 min-h-[60px]">
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.product.id)}
                          className="text-slate-500 hover:text-red-500 hover:bg-red-50 p-1 rounded-md transition-colors cursor-pointer -mr-1"
                          title="Remove item"
                          aria-label="Remove item"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="text-sm font-sans font-bold text-slate-900">
                          {formatPrice(item.product.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-5 sm:p-6 bg-white border-t border-slate-200/80 space-y-4 shadow-lg">
                  {/* Price Breakdown Summary */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-sans font-semibold text-slate-900">{formatPrice(cartSubtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center font-sans text-sm sm:text-base font-bold text-slate-900 pt-2 border-t border-slate-100">
                      <span>Total:</span>
                      <span className="text-[#0284c7] text-lg font-black">{formatPrice(cartSubtotal)}</span>
                    </div>
                  </div>

                  {/* Proceed to Dedicated Checkout Page Button */}
                  <div className="pt-2">
                    <button 
                      type="button"
                      onClick={() => {
                        if (cart.length > 0) {
                          const eventId = createEventId('initiate_checkout');
                          trackEvent('InitiateCheckout', {
                            content_name: cart.map(i => i.product.title).join(', '),
                            content_ids: cart.map(i => i.product.id),
                            content_type: 'product',
                            value: cartGrandTotal || cartSubtotal,
                            currency: 'BDT',
                            num_items: cart.reduce((acc, item) => acc + item.quantity, 0),
                            contents: cart.map(item => ({
                              id: item.product.id,
                              name: item.product.title,
                              quantity: item.quantity,
                              item_price: item.product.price
                            }))
                          }, eventId);
                        }
                        setIsCartOpen(false);
                        navigateTo('checkout');
                      }}
                      className="w-full bg-gradient-to-r from-[#0284c7] via-[#0284c7] to-[#16a34a] hover:from-[#0369a1] hover:to-[#15803d] active:scale-[0.99] text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-xl shadow-sky-600/25 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>PROCEED TO CHECKOUT</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          ORDER SUCCESS CONFIRMATION MODAL
          ============================================================ */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white max-w-md w-full shadow-2xl p-8 text-center space-y-4 border border-slate-100">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="font-sans text-2xl font-bold text-slate-900">Order Confirmed!</h3>
            <p className="text-xs text-slate-600">
              Thank you for ordering with FANTINE Korea. Your order ID is <strong>{orderSuccess.id}</strong>.
              Our delivery team will contact you shortly.
            </p>
            <button 
              onClick={() => setOrderSuccess(null)}
              className="w-full bg-slate-900 text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors"
            >
              CONTINUE SHOPPING
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          FULLSCREEN PRODUCT IMAGE ZOOM LIGHTBOX MODAL
          ============================================================ */}
      {isZoomModalOpen && (
        <div 
          onClick={() => setIsZoomModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn cursor-zoom-out"
        >
          <button 
            onClick={() => setIsZoomModalOpen(false)}
            className="absolute top-5 right-5 w-10 h-10 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer z-50"
            title="Close Zoom"
          >
            <X className="w-6 h-6" />
          </button>

          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[85vh] w-full flex items-center justify-center"
          >
            <img fetchPriority="high" width={500} height={500} src={currentProductImages[activeImageIndex] || activeProductDetail.coverImage} alt={activeProductDetail.title} 
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_FANTINE_FALLBACK_IMAGE;
              }}
              className="max-h-[80vh] w-auto max-w-full object-contain rounded-xl shadow-2xl bg-white/5 p-2 border border-white/10"
            />

            {/* Lightbox Carousel Navigation */}
            {currentProductImages.length > 1 && (
              <>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex(prev => (prev === 0 ? currentProductImages.length - 1 : prev - 1));
                  }}
                  className="absolute left-2 sm:-left-12 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex(prev => (prev === currentProductImages.length - 1 ? 0 : prev + 1));
                  }}
                  className="absolute right-2 sm:-right-12 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          FLOATING WHATSAPP CUSTOMER SUPPORT WIDGET
          ============================================================ */}
      <DoctorFloatingTrigger
        whatsappNumber={socialLinks?.whatsapp || liveHeaderSettings?.socialLinks?.whatsapp || displayPhone}
        storeName={displayStoreName}
      />

      {/* ============================================================
          FACTORY DIRECT QUOTE & OEM/ODM INQUIRY MODAL
          ============================================================ */}
      {isQuoteModalOpen && (
        <div 
          onClick={() => setIsQuoteModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 border border-slate-100 my-8 animate-scaleUp text-slate-900"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsQuoteModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close quote modal"
            >
              <X className="w-5 h-5" />
            </button>

            {quoteSubmitted ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Inquiry Received!</h3>
                <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out to <strong>{displayStoreName}</strong>. Our export and OEM development team will review your specifications and contact you within 24 hours.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href={`https://wa.me/${(socialLinks?.whatsapp || '+8618027300683').replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${displayStoreName}! I just submitted a quote request for ${quoteForm.company || 'our brand'}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white px-5 py-2.5 rounded-full font-semibold text-sm transition shadow-md"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>Follow Up on WhatsApp</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setQuoteSubmitted(false);
                      setIsQuoteModalOpen(false);
                    }}
                    className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleQuoteSubmit} className="space-y-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0093d0] text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Direct Factory OEM / ODM Inquiry</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Get A Custom Manufacturing Quote
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Formulation, fragrance customization, pod structure, packaging, and private label support.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={quoteForm.fullName}
                      onChange={(e) => setQuoteForm(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="e.g. John Doe"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0093d0]/30 focus:border-[#0093d0]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Company / Brand Name
                    </label>
                    <input
                      type="text"
                      value={quoteForm.company}
                      onChange={(e) => setQuoteForm(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="e.g. Apex Global Brands"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0093d0]/30 focus:border-[#0093d0]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Business Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={quoteForm.email}
                      onChange={(e) => setQuoteForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="partner@company.com"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0093d0]/30 focus:border-[#0093d0]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone / WhatsApp <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={quoteForm.phone}
                      onChange={(e) => setQuoteForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+86 180... or +880 1..."
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0093d0]/30 focus:border-[#0093d0]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target MOQ / Order Volume
                  </label>
                  <select
                    value={quoteForm.quantity}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, quantity: e.target.value }))}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0093d0]/30 focus:border-[#0093d0] bg-white cursor-pointer"
                  >
                    <option value="100,000 Pcs">100,000 Pcs (Standard MOQ)</option>
                    <option value="250,000 Pcs">250,000 Pcs</option>
                    <option value="500,000 Pcs">500,000 Pcs</option>
                    <option value="1,000,000+ Pcs">1,000,000+ Pcs (Enterprise Volume)</option>
                    <option value="Stock Samples Request">Stock Samples Request</option>
                    <option value="Custom Trial Batch">Custom Trial Batch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Requirements & Specifications
                  </label>
                  <textarea
                    rows={3}
                    value={quoteForm.message}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Describe your desired formula, fragrance profile, color chambers, box packaging, or target market..."
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0093d0]/30 focus:border-[#0093d0] resize-none"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>ISO 9001 & GMP Certified Facility</span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setIsQuoteModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingQuote}
                      className="flex-1 sm:flex-none px-6 py-2.5 rounded-full bg-gradient-to-r from-[#0093d0] to-[#00a651] hover:from-[#0082b8] hover:to-[#008f45] text-white font-bold text-xs sm:text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmittingQuote ? 'Submitting...' : 'Submit Quote Request →'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Global User Feedback Dialog */}
      <FeedbackDialog
        isOpen={feedback.isOpen}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
        onClose={() => setFeedback(prev => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
}
