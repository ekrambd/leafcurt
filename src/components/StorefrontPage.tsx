import { dbService } from "../lib/dbService";
//fix pixel event 2

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  ShoppingBag, User, Search, ChevronDown, ChevronLeft, ChevronRight,
  ArrowRight, ArrowLeft, Heart, Star, Check, Sparkles, X, Plus, Minus,
  ShieldCheck, Truck, RefreshCw, Send, HelpCircle, Eye, Share2, Award,
  Phone, Mail, Globe, Droplet, Sun, Moon, Zap, Flame, Layers, MessageCircle, ArrowUp, MapPin, ZoomIn, Clock,
  Building2, BookOpen, Microscope, Quote, Sprout, FlaskConical, CreditCard, Smartphone, Copy, Tag,
  Play, Pause, Volume2, VolumeX, Menu, CheckCircle2, AlertCircle, Info, Trash2
} from 'lucide-react';
import { trackEvent, createEventId } from '../lib/pixelGtmService';
import { Product, BookOrder, EcomSettings, InstituteInfo, ContactMessage, AboutPageSettings, DeliveryMethodItem, PaymentGatewayItem, Coupon, HeaderSettings, HeroBannerItem, Brand } from '../types';
import { publicStoreService, optimizeImageUrl, readStorefrontCache } from '../lib/publicStoreService';
import { 
  DEFAULT_ABOUT_SETTINGS, DEFAULT_DELIVERY_METHODS, DEFAULT_PAYMENT_GATEWAYS, 
  DEFAULT_HEADER_SETTINGS, DEFAULT_HERO_BANNERS, DEFAULT_PRODUCTS, 
  BANGLADESHI_FEMALE_CART_REVIEWS,
  DEFAULT_CLIENT_LOGOS_SETTINGS, DEFAULT_BEFORE_AFTER_SETTINGS,
  DEFAULT_PHOTO_REVIEWS_SETTINGS, DEFAULT_TESTIMONIAL_SETTINGS
} from '../lib/constants';
import { ProductSearchEngine } from '../lib/searchIndex';
import { useAppStore } from '../store/useAppStore';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { updateMetaTags, updateProductSchema, getProductSlug } from '../lib/seoUtils';
import ResponsiveImage from './ResponsiveImage';
import { DoctorFloatingTrigger } from './ai/DoctorFloatingTrigger';
import { FeedbackDialog } from './ui/FeedbackDialog';
import ProductReviewsSection from './ProductReviewsSection';
import { getCustomerSession, clearCustomerSession, type CustomerSession } from '../lib/customerAuth';
import { calculateCartTotalWeight, calculateDeliveryCharge } from '../lib/deliveryCalculator';
import BeforeAfterSection from './BeforeAfterSection';
import BrandLogosSection from './BrandLogosSection';
import PhotoReviewsSection from './PhotoReviewsSection';
import VideoReviewsSection from './VideoReviewsSection';
import CustomerTestimonialsSection from './CustomerTestimonialsSection';
import FaqSection from './FaqSection';
import AmbientSoapBubbles from './AmbientSoapBubbles';
import WashingComparisonSection from './WashingComparisonSection';
import { validateOrderCustomerDetails } from '../lib/orderValidation';

const CheckoutPage = React.lazy(() => import('./CheckoutPage'));
const BlogPage = React.lazy(() => import('./BlogPage'));
const BlogPostPage = React.lazy(() => import('./BlogPostPage'));
const AboutUsPage = React.lazy(() => import('./AboutUsPage'));
const StoreFooter = React.lazy(() => import('./StoreFooter'));

interface StorefrontPageProps {
  onGoToLogin?: () => void;
  onGoToLanding?: () => void;
}

export interface StoreProductItem extends Product {
  series: string;
  isSet?: boolean;
  benefitsHighlights?: string;
  howToUse?: string;
  ingredients?: string;
}

export interface BestSellerStoreProduct extends StoreProductItem {
  salesCount: number;
}

// Backwards compatibility alias
export type FantineProductItem = StoreProductItem;


// Dynamic Product Helpers & Fallbacks (Driven by Server Database & Admin Catalog)
export const DEFAULT_PRODUCT_FALLBACK_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%23f8fafc"/><text x="50%" y="50%" font-family="sans-serif" font-size="14" fill="%2394a3b8" dominant-baseline="middle" text-anchor="middle">Product</text></svg>';
export const DEFAULT_STORE_FALLBACK_IMAGE = DEFAULT_PRODUCT_FALLBACK_IMAGE;
export const DEFAULT_FANTINE_FALLBACK_IMAGE = DEFAULT_STORE_FALLBACK_IMAGE;

export const getSafeProductImage = (rawImg?: any, _indexOrSeed?: number | string): string => {
  if (!rawImg || typeof rawImg !== 'string' || !rawImg.trim()) {
    return DEFAULT_STORE_FALLBACK_IMAGE;
  }
  const trimmed = rawImg.trim();
  if (
    trimmed.includes('photo-1544716278-ca5e3f4abd8c') ||
    trimmed.includes('/watch.jpg') ||
    trimmed.includes('/book.png') ||
    trimmed === 'undefined' ||
    trimmed === 'null'
  ) {
    return DEFAULT_STORE_FALLBACK_IMAGE;
  }
  return trimmed;
};

export const getSafeSkincareImage = getSafeProductImage;

export const normalizeStoreProduct = (p: Product, index: number = 0): StoreProductItem => {
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
    author: (p as any).author || p.brand || 'Store',
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

export const normalizeFantineProduct = normalizeStoreProduct;

// Fallback products from constants (only if server database has not returned yet)
const FALLBACK_PRODUCTS: StoreProductItem[] = DEFAULT_PRODUCTS.map((p, idx) => normalizeStoreProduct(p, idx));
const STORE_PRODUCTS = FALLBACK_PRODUCTS;
const FANTINE_PRODUCTS = FALLBACK_PRODUCTS;

export const BLANK_STORE_PRODUCT: StoreProductItem = {
  id: '',
  title: '',
  price: 0,
  regularPrice: 0,
  stockQuantity: 0,
  category: 'General',
  series: 'General',
  coverImage: DEFAULT_STORE_FALLBACK_IMAGE,
  additionalImages: [DEFAULT_STORE_FALLBACK_IMAGE],
  description: '',
  rating: 5,
  reviewsCount: 0,
  isFeatured: false,
};

export const BLANK_FANTINE_PRODUCT = BLANK_STORE_PRODUCT;

const DEFAULT_SHOP_CATEGORIES = [
  'All'
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


const DEFAULT_PODS_SPEC_TABLE = [
  { feature: 'Product Name', details: 'Laundry Detergent Pods' },
  { feature: 'Product Type', details: 'All-in-1 / 3-in-1 / 4-in-1 / 5-in-1 Laundry Pods' },
  { feature: 'Pod Weight', details: '8g / 10g / 12g / 15g / 25g per Pod' },
  { feature: 'Recommended Laundry Load', details: 'Approx. 2–12kg per Pod, Depending on Pod Weight, Formula Concentration and Washing Conditions' },
  { feature: 'Chamber Structure', details: 'Single Chamber / 3 Chambers / 4 Chambers / 5 Chambers' },
  { feature: 'Formula Type', details: 'Liquid / Powder / Fragrance Beads / Multi-Formula Combination' },
  { feature: 'Functions', details: 'Deep Cleaning / Stain Removal / Antibacterial Care / Anti-Mite Care / Fabric Softening / Color Protection / Long-Lasting Fragrance / Odor Control' },
  { feature: 'Fragrance Options', details: 'Lavender / Lemon / Rose / Jasmine / Ocean Breeze / Fresh Cotton / Green Tea / Floral / Fruity / Woody / Fragrance-Free' },
  { feature: 'Specialized Solutions', details: 'Baby & Sensitive Care / Pet Odor and Stain Care / Sportswear Odor Control / Hospitality and Commercial Linen' }
];

export default function StorefrontPage({ onGoToLogin, onGoToLanding }: StorefrontPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeId, slug: routeSlug } = useParams<{ id?: string; slug?: string }>();

  // Navigation View: 'home' | 'shop' | 'about' | 'contact' | 'product_detail' | 'checkout' | 'blog' | 'blog_post'
  const [selectedBlogSlug, setSelectedBlogSlug] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      const m = p.match(/^\/(?:blogs\/news|blogs\/blog|blogs|blog)\/([^/]+)/);
      if (m && m[1] !== 'news' && m[1] !== 'blog') return decodeURIComponent(m[1]);
    }
    return null;
  });

  const [activeNav, setActiveNav] = useState<'home' | 'shop' | 'about' | 'contact' | 'product_detail' | 'checkout' | 'blog' | 'blog_post'>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (p.startsWith('/product')) return 'product_detail';
      if (p.startsWith('/shop')) return 'shop';
      if (p.startsWith('/about')) return 'about';
      if (p.startsWith('/contact')) return 'contact';
      if (p.startsWith('/checkout')) return 'checkout';
      const m = p.match(/^\/(?:blogs\/news|blogs\/blog|blogs|blog)\/([^/]+)/);
      if (m && m[1] !== 'news' && m[1] !== 'blog') return 'blog_post';
      if (p.startsWith('/blog') || p.startsWith('/blogs') || p.startsWith('/news')) return 'blog';
    }
    return 'home';
  });
  const [selectedCategoryCheckbox, setSelectedCategoryCheckbox] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [priceRange, setPriceRange] = useState<number>(50000); // Max range default
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

  // Dynamic Ecom Settings for Hero Banners & Videos (Instant cached synchronous hydration)
  const [ecomSettings, setEcomSettings] = useState<EcomSettings | null>(() => {
    return readStorefrontCache<EcomSettings>('noor_ecom_settings', null);
  });
  const [instituteInfo, setInstituteInfo] = useState<InstituteInfo | null>(() => {
    return readStorefrontCache<InstituteInfo>('noor_institute_info', null);
  });
  const [realBrands, setRealBrands] = useState<Brand[]>(() => {
    return readStorefrontCache<Brand[]>('noor_brands', []) || [];
  });
  const [realCategories, setRealCategories] = useState<string[]>(() => {
    return readStorefrontCache<string[]>('noor_categories', []) || [];
  });
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);

  // Dynamic Product State from Admin / DB (No Seed Data Overwriting)
  const [products, setProducts] = useState<StoreProductItem[]>(() => {
    try {
      const cached = localStorage.getItem('noor_ecom_products');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleanParsed = parsed.filter((p: any) => 
            p.id !== '3-in-1-laundry-detergent-pods' &&
            p.id !== 'leaf-curt-5-in-1-laundry-pods-tub' &&
            p.id !== 'leaf-curt-5-in-1-laundry-pods-box' &&
            !p.brand?.toLowerCase().includes('fantine') &&
            p.category !== 'Serums' &&
            p.category !== 'Toners' &&
            p.category !== 'Rapid Acne Treatment Series'
          );
          if (cleanParsed.length > 0) {
            return cleanParsed.map((p: any, idx: number) => normalizeStoreProduct(p, idx));
          }
        }
      }
    } catch {
      // fallback
    }
    return [];
  });

  // Best Sellers (Algorithm-based: Week / Month / All-time sales rankings)
  const [bestSellers, setBestSellers] = useState<{
    week: BestSellerStoreProduct[];
    month: BestSellerStoreProduct[];
    all: BestSellerStoreProduct[];
    totalSales: number;
  }>({
    week: [],
    month: [],
    all: [],
    totalSales: 0
  });
  const [bestSellerPeriod, setBestSellerPeriod] = useState<'week' | 'month' | 'all'>('week');

  // Helper to find matching product from URL path or router params
  const findProductFromPath = useCallback((path: string, idParam?: string, slugParam?: string, productList: StoreProductItem[] = products) => {
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
  const [activeProductDetail, setActiveProductDetail] = useState<StoreProductItem>(() => {
    const initialList = products.length > 0 ? products : STORE_PRODUCTS;
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/product')) {
      const p = window.location.pathname;
      const found = initialList.find(prod => {
        const slug = getProductSlug(prod).toLowerCase();
        return p.includes(prod.id) || (slug.length > 3 && p.toLowerCase().includes(slug));
      });
      if (found) return found;
    }
    return initialList[0] || BLANK_STORE_PRODUCT;
  });
  const [activeVariant, setActiveVariant] = useState<any>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState<boolean>(false);
  const [isHoverZooming, setIsHoverZooming] = useState<boolean>(false);
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  const handleProductImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPos({ x, y });
  };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(() => getCustomerSession());

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


  // Sync Live Settings, Categories & Brands from server API / publicStoreService
  const loadLiveSettings = async () => {
    try {
      const [settings, info, brandsList, catsList] = await Promise.all([
        publicStoreService.getEcomSettings().catch(() => null),
        publicStoreService.getInstituteInfo().catch(() => null),
        publicStoreService.getBrands().catch(() => []),
        publicStoreService.getCategories().catch(() => [])
      ]);
      if (settings) setEcomSettings(settings);
      if (info) setInstituteInfo(info);
      setRealBrands(Array.isArray(brandsList) ? brandsList : []);
      setRealCategories(Array.isArray(catsList) ? catsList : []);
    } catch (err) {
      console.warn('Failed loading storefront settings:', err);
    }
  };

  // Sync Live Products from dbService & publicStoreService
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadLiveProducts = async () => {
    try {
      const dbProds = await dbService.getProducts();
      if (dbProds && dbProds.length > 0) {
        const normalized = dbProds.map((p, idx) => normalizeStoreProduct(p, idx));
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
        const normalized = pubProds.map((p, idx) => normalizeStoreProduct(p, idx));
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

  const loadBestSellers = async () => {
    try {
      const res = await publicStoreService.getBestSellers();
      if (res && res.data) {
        const normalizeBestSeller = (p: any, idx: number): BestSellerStoreProduct => ({
          ...normalizeStoreProduct(p, idx),
          salesCount: Number(p.salesCount || 0)
        });

        const weekList = (res.data.week || []).map((p, i) => normalizeBestSeller(p, i));
        const monthList = (res.data.month || []).map((p, i) => normalizeBestSeller(p, i));
        const allList = (res.data.all || []).map((p, i) => normalizeBestSeller(p, i));
        const totalSales = Number(res.totalSales || 0);

        setBestSellers({
          week: weekList,
          month: monthList,
          all: allList,
          totalSales
        });

        if (weekList.length > 0) {
          setBestSellerPeriod('week');
        } else if (monthList.length > 0) {
          setBestSellerPeriod('month');
        } else if (allList.length > 0) {
          setBestSellerPeriod('all');
        }
      }
    } catch (err) {
      console.warn('Failed loading best sellers:', err);
    }
  };

  useEffect(() => {
    loadLiveProducts();
    loadLiveSettings();
    loadBestSellers();

    const handleProductUpdate = () => {
      loadLiveProducts();
      loadBestSellers();
    };
    const handleSettingsUpdate = () => {
      loadLiveSettings();
    };
    const handleOrdersUpdate = () => {
      loadBestSellers();
    };

    window.addEventListener('ecom-products-updated', handleProductUpdate);
    window.addEventListener('ecom-settings-updated', handleSettingsUpdate);
    window.addEventListener('institute-info-updated', handleSettingsUpdate);
    window.addEventListener('book-orders-updated', handleOrdersUpdate);
    window.addEventListener('storage', handleProductUpdate);
    return () => {
      window.removeEventListener('ecom-products-updated', handleProductUpdate);
      window.removeEventListener('ecom-settings-updated', handleSettingsUpdate);
      window.removeEventListener('institute-info-updated', handleSettingsUpdate);
      window.removeEventListener('book-orders-updated', handleOrdersUpdate);
      window.removeEventListener('storage', handleProductUpdate);
    };
  }, []);

  // General States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currency] = useState<'BDT'>('BDT');
  
  // Modals, Feedback Dialog & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartReviewIndex, setCartReviewIndex] = useState(() => Math.floor(Math.random() * BANGLADESHI_FEMALE_CART_REVIEWS.length));

  // Pick a fresh random authentic Bangladeshi female review each time the cart drawer opens
  useEffect(() => {
    if (isCartOpen) {
      setCartReviewIndex(Math.floor(Math.random() * BANGLADESHI_FEMALE_CART_REVIEWS.length));
    }
  }, [isCartOpen]);
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
  const [contactFirstName, setContactFirstName] = useState('');
  const [contactLastName, setContactLastName] = useState('');
  const [contactCountryCode, setContactCountryCode] = useState('+880');
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
  const displayStoreName = ecomSettings?.storeName?.trim() || liveHeaderSettings?.brandName?.trim() || instituteInfo?.name?.trim() || 'Store';
  const displayStoreLogo = ecomSettings?.storeLogo?.trim() || liveHeaderSettings?.logoUrl?.trim() || instituteInfo?.logo?.trim() || '';
  const displayCompanyName = ecomSettings?.companyName || instituteInfo?.name || `${displayStoreName} Ltd.`;
  const displayTagline = ecomSettings?.storeTagline || ecomSettings?.footerDescription || instituteInfo?.description || '';
  const displayEmail = ecomSettings?.contactEmail || instituteInfo?.email || '';
  const displayPhone = ecomSettings?.contactPhone || instituteInfo?.phone || '';
  const displayAddress = ecomSettings?.storeAddress || instituteInfo?.address || '';
  const displayAnnouncement = ecomSettings?.topAnnouncementText || (displayStoreName ? `WELCOME TO ${displayStoreName.toUpperCase()}` : '');
  const socialLinks = ecomSettings?.socialLinks;
  const aboutSettings: AboutPageSettings = ecomSettings?.aboutSettings || DEFAULT_ABOUT_SETTINGS;

  const menuItemsToRender = useMemo(() => {
    if (liveHeaderSettings.menuItems && liveHeaderSettings.menuItems.length > 0) {
      return liveHeaderSettings.menuItems.filter(item => 
        item.id !== 'menu-faq' && 
        !item.link?.includes('faq') && 
        item.label?.toLowerCase().trim() !== 'faq'
      );
    }
    // Dynamic fallback generated from real database categories
    const categoryDropdown = (ecomSettings?.categories || [])
      .filter((c: any) => typeof c === 'string' && c.trim() && c !== 'All')
      .map((c: string) => ({
        label: c.trim(),
        link: `/shop?category=${encodeURIComponent(c.trim())}`
      }));

    return [
      { id: 'menu-home', label: 'Home', link: '/', hasDropdown: false },
      { 
        id: 'menu-shop', 
        label: 'Shop', 
        link: '/shop', 
        hasDropdown: categoryDropdown.length > 0,
        dropdownItems: categoryDropdown.length > 0 ? categoryDropdown : undefined
      },
      { id: 'menu-about', label: 'About', link: '/about', hasDropdown: false },
      { id: 'menu-blog', label: 'Blog', link: '/blog', hasDropdown: false },
      { id: 'menu-contact', label: 'Contact', link: '/contact', hasDropdown: false }
    ];
  }, [liveHeaderSettings.menuItems, ecomSettings?.categories]);

  const activeBlogPost = useMemo(() => {
    const list = ecomSettings?.blogPosts || [];
    if (!selectedBlogSlug) return list[0] || null;
    return list.find(p => p.slug === selectedBlogSlug || p.id === selectedBlogSlug) || list[0] || null;
  }, [selectedBlogSlug, ecomSettings?.blogPosts]);

  // Dynamically derived social links directly from Admin Panel (Profile Settings & Header Settings)
  const activeSocialLinks = useMemo(() => {
    const src = {
      ...(ecomSettings?.socialLinks || {}),
      ...(liveHeaderSettings?.socialLinks || {})
    };
    return {
      facebook: (src.facebook || '').trim(),
      instagram: (src.instagram || '').trim(),
      youtube: (src.youtube || '').trim(),
      twitter: (src.twitter || '').trim(),
      tiktok: (src.tiktok || '').trim(),
      linkedin: (src.linkedin || '').trim(),
      whatsapp: (src.whatsapp || '').trim()
    };
  }, [ecomSettings?.socialLinks, liveHeaderSettings?.socialLinks]);

  const hasValidLink = useCallback((url?: string) => {
    return Boolean(url && url.trim() && url.trim() !== '#' && url.trim() !== '/');
  }, []);

  const headerEmail = (liveHeaderSettings.email || displayEmail || '').trim();
  const headerPhone = (liveHeaderSettings.phone || displayPhone || '').trim();

  // Dynamic Hero Banners for Slider (Driven by Admin Panel)
  const activeHeroBanners = useMemo<HeroBannerItem[]>(() => {
    if (ecomSettings?.heroBanners && ecomSettings.heroBanners.length > 0) {
      return ecomSettings.heroBanners;
    }
    return [];
  }, [ecomSettings?.heroBanners]);

  const [isSliderPaused, setIsSliderPaused] = useState<boolean>(false);

  // Slider Autoplay Effect with dynamic interval per slide (supports video + image slides)
  useEffect(() => {
    if (isSliderPaused || activeHeroBanners.length <= 1) return;

    const currentBanner = activeHeroBanners[activeSlideIndex];
    const isVideo = currentBanner?.mediaType === 'video';
    const customSec = currentBanner?.durationSeconds;
    const defaultVideoSec = ecomSettings?.heroVideoInterval || 10;
    const defaultImageSec = ecomSettings?.heroSliderInterval || 5;
    const durationMs = (customSec || (isVideo ? defaultVideoSec : defaultImageSec)) * 1000;

    const interval = setInterval(() => {
      setActiveSlideIndex(prev => (prev + 1) % activeHeroBanners.length);
    }, durationMs);

    return () => clearInterval(interval);
  }, [isSliderPaused, activeHeroBanners.length, activeSlideIndex, activeHeroBanners, ecomSettings?.heroSliderInterval, ecomSettings?.heroVideoInterval]);

  const handleVideoEnded = useCallback(() => {
    if (activeHeroBanners.length > 1) {
      setActiveSlideIndex(prev => (prev + 1) % activeHeroBanners.length);
    }
  }, [activeHeroBanners.length]);

  // Hero Video Sound State & Control
  const [isHeroMuted, setIsHeroMuted] = useState(true);
  const heroVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const toggleHeroSound = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHeroMuted(prev => {
      const nextMuted = !prev;
      const currentBanner = activeHeroBanners[activeSlideIndex];
      const videoKey = currentBanner?.id || String(activeSlideIndex);
      const vidEl = heroVideoRefs.current[videoKey];
      if (vidEl) {
        vidEl.muted = nextMuted;
        if (!nextMuted) {
          vidEl.play().catch(() => {});
        }
      }
      return nextMuted;
    });
  }, [activeHeroBanners, activeSlideIndex]);

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
      await dbService.saveContactMessage({
        id: `quote-${Date.now()}`,
        name: quoteForm.fullName,
        email: quoteForm.email,
        phone: quoteForm.phone,
        subject: `[Customer Inquiry] ${quoteForm.company || quoteForm.fullName} (${quoteForm.quantity || 'General'})`,
        message: `Customer: ${quoteForm.fullName}\nCompany/Notes: ${quoteForm.company}\nDetails/Quantity: ${quoteForm.quantity}\nRequirements:\n${quoteForm.message}`,
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
    // If admin set custom store logo in Profile, keep favicon in sync; otherwise fallback to /favicon/favicon.ico
    const currentFavicon = displayStoreLogo || '/favicon/favicon.ico';
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = currentFavicon;

    if (displayStoreName) {
      updateMetaTags(
        `${displayStoreName} | Official Store`, 
        aboutSettings?.description || 'Welcome to our official store', 
        displayStoreLogo || '/favicon/android-chrome-512x512.png', 
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
  const navigateTo = useCallback((section: 'home' | 'shop' | 'about' | 'contact' | 'checkout' | 'blog') => {
    setIsMobileMenuOpen(false);
    const targetPath = section === 'home' ? '/' : section === 'blog' ? '/blogs/news' : `/${section}`;
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
    } else if (path.match(/^\/(?:blogs\/news|blogs\/blog|blogs|blog)\/([^/]+)/)) {
      const m = path.match(/^\/(?:blogs\/news|blogs\/blog|blogs|blog)\/([^/]+)/);
      if (m && m[1] !== 'news' && m[1] !== 'blog') {
        setSelectedBlogSlug(decodeURIComponent(m[1]));
        setActiveNav('blog_post');
      } else {
        setActiveNav('blog');
      }
    } else if (path.startsWith('/blog') || path.startsWith('/blogs') || path.startsWith('/news')) {
      setActiveNav('blog');
    } else if (path.startsWith('/membership') || path.startsWith('/vip')) {
      navigate('/');
      setActiveNav('home');
    } else if (path === '/' || path === '') {
      setActiveNav('home');
    }
  }, [location.pathname, routeId, routeSlug, products, findProductFromPath, navigate]);

  // Bangladeshi Taka BDT Currency Formatter (Exclusive)
  const formatPrice = (priceVal: number) => {
    if (!priceVal && priceVal !== 0) return 'Tk.0';
    const bdtAmount = Math.round(priceVal);
    return `Tk.${bdtAmount.toLocaleString('en-US')}`;
  };

  // Add to Cart Helper
  const handleAddToCart = useCallback((product: Product, quantity = 1, variant?: any) => {
    const eventId = createEventId('cart');
    const finalPrice = variant?.price || product.price || 0;
    trackEvent('AddToCart', {
      content_name: product.title,
      content_ids: [product.id],
      content_type: 'product',
      value: finalPrice * quantity,
      currency: 'BDT',
      num_items: quantity,
      contents: [{
        id: product.id,
        name: product.title,
        quantity: quantity,
        item_price: finalPrice
      }]
    }, eventId);
    addToCartAction({
      product,
      quantity,
      variant,
      selectedVariant: variant?.name
    });
    showToast(`Added ${product.title}${variant ? ` (${variant.name})` : ''} to your bag.`, 'success');
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
  const openProductDetail = useCallback((product: StoreProductItem) => {
    setActiveProductDetail(product);
    setActiveVariant(product.variants && product.variants.length > 0 ? product.variants[0] : null);
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

  // Real "You May Also Like" Products in Cart Drawer (Excludes items already in cart)
  const cartUpsellProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    const inCartIds = new Set(cart.map(item => item.product.id));
    const unadded = products.filter(p => !inCartIds.has(p.id));
    if (unadded.length > 0) return unadded;
    return products.slice(0, 4);
  }, [products, cart]);

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

  // Real Categories from API / settings (if no real categories exist, empty array)
  const shopCategories = useMemo(() => {
    const list: string[] = [];
    if (realCategories.length > 0) {
      realCategories.forEach(c => {
        if (typeof c === 'string' && c.trim() && !list.includes(c.trim())) {
          list.push(c.trim());
        }
      });
    } else if (ecomSettings?.categories && Array.isArray(ecomSettings.categories) && ecomSettings.categories.length > 0) {
      ecomSettings.categories.forEach(c => {
        if (typeof c === 'string' && c.trim() && !list.includes(c.trim())) {
          list.push(c.trim());
        }
      });
    }
    return list;
  }, [realCategories, ecomSettings?.categories]);

  // Real Brands from API (if no real brands exist in /api/brands, empty array)
  const shopBrands = useMemo(() => {
    const list: string[] = [];
    if (realBrands && realBrands.length > 0) {
      realBrands.forEach(b => {
        const name = (b.name || '').trim();
        if (name && !list.includes(name)) {
          list.push(name);
        }
      });
    }
    return list;
  }, [realBrands]);

  const totalPages = Math.ceil(filteredCatalog.length / itemsPerPage) || 1;

  const cartTotalWeight = useMemo(() => {
    return calculateCartTotalWeight(cart);
  }, [cart]);

  // Active Delivery Methods from Admin Settings
  const activeDeliveryMethods = useMemo<DeliveryMethodItem[]>(() => {
    const list = Array.isArray(ecomSettings?.deliveryMethods) ? ecomSettings.deliveryMethods : [];
    return list.filter(m => m.status === 'Active');
  }, [ecomSettings?.deliveryMethods]);

  const [selectedDeliveryMethodId, setSelectedDeliveryMethodId] = useState<string>('');

  useEffect(() => {
    if (activeDeliveryMethods.length > 0) {
      if (!selectedDeliveryMethodId || !activeDeliveryMethods.some(m => m.id === selectedDeliveryMethodId)) {
        setSelectedDeliveryMethodId(activeDeliveryMethods[0].id);
      }
    } else {
      setSelectedDeliveryMethodId('');
    }
  }, [activeDeliveryMethods, selectedDeliveryMethodId]);

  const selectedDeliveryMethod = useMemo(() => {
    if (activeDeliveryMethods.length === 0) return null;
    return activeDeliveryMethods.find(m => m.id === selectedDeliveryMethodId) || activeDeliveryMethods[0] || null;
  }, [activeDeliveryMethods, selectedDeliveryMethodId]);

  const deliveryCalc = useMemo(() => {
    if (!selectedDeliveryMethod) {
      return { finalCharge: 0 };
    }
    return calculateDeliveryCharge(selectedDeliveryMethod, cartSubtotal, cartTotalWeight);
  }, [selectedDeliveryMethod, cartSubtotal, cartTotalWeight]);

  const deliveryCharge = selectedDeliveryMethod ? deliveryCalc.finalCharge : 0;

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

    // Strict validation against fake/dummy names, non-BD phones, and incomplete addresses
    const validation = validateOrderCustomerDetails({
      customerName: checkoutName,
      phone: checkoutPhone,
      address: checkoutAddress
    });

    if (!validation.isValid) {
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'সঠিক তথ্য প্রদান করুন',
        message: validation.errors[0]
      });
      showToast(validation.errors[0], 'error');
      return;
    }

    const cleanCustomerName = validation.sanitized.name;
    const cleanPhone = validation.sanitized.phone;
    const cleanAddress = validation.sanitized.address;

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
        customerName: cleanCustomerName,
        name: cleanCustomerName,
        phone: cleanPhone,
        address: cleanAddress,
        deliveryArea: selectedDeliveryMethod?.title || 'Standard Delivery',
        deliveryZone: selectedDeliveryMethod?.title || 'Standard Delivery',
        district: selectedDeliveryMethod?.title || 'Dhaka',
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
            deliveryZone: selectedDeliveryMethod?.title || 'Standard Delivery',
            deliveryMethodId: selectedDeliveryMethod?.id,
            deliveryCharge: deliveryCharge,
            deliveryFee: deliveryCharge,
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
        await dbService.saveBookOrderLocally(confirmedOrder);
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
    const fullName = `${contactFirstName} ${contactLastName}`.trim() || contactSenderName.trim() || 'Valued Customer';
    const fullPhone = contactPhone.trim() ? `${contactCountryCode} ${contactPhone.trim()}` : '';

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
        name: fullName,
        email: contactEmail.trim(),
        phone: fullPhone,
        subject: contactSubject.trim() || 'General Customer Inquiry',
        message: contactMessage.trim(),
        createdAt: new Date().toISOString(),
        status: 'unread'
      });

      setContactSubmitted(true);
      trackEvent('Contact', { content_name: 'Customer Contact Form' });
      setContactFirstName('');
      setContactLastName('');
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
          name: fullName,
          email: contactEmail.trim(),
          phone: fullPhone,
          subject: contactSubject.trim() || 'General Customer Inquiry',
          message: contactMessage.trim()
        });
      } catch {}
      setContactSubmitted(true);
      setContactFirstName('');
      setContactLastName('');
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
      setTimeout(() => setContactSubmitted(false), 6000);
    }
  };

  const currentProductImages = useMemo(() => {
    if (!activeProductDetail) return [DEFAULT_PRODUCT_FALLBACK_IMAGE];
    return activeProductDetail.additionalImages && activeProductDetail.additionalImages.length > 0
      ? activeProductDetail.additionalImages
      : [activeProductDetail.coverImage || DEFAULT_PRODUCT_FALLBACK_IMAGE];
  }, [activeProductDetail]);

  return (
    <div className="min-h-screen bg-[#faf9f6] text-slate-900 font-sans relative selection:bg-rose-100 selection:text-rose-900 pb-16 md:pb-0">
      
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
          MAIN LUXURY APP BAR (Solid Crisp White Across Entire Site)
          ============================================================ */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-4 sm:gap-6 flex-nowrap">
          
          {/* Brand Logo */}
          <div 
            className="flex items-center cursor-pointer group shrink-0" 
            onClick={() => navigateTo('home')}
          >
            {(liveHeaderSettings.logoUrl || displayStoreLogo) ? (
              <img 
                src={liveHeaderSettings.logoUrl || displayStoreLogo} 
                alt={displayStoreName} 
                className="h-10 sm:h-12 md:h-13 max-h-13 max-w-[200px] sm:max-w-[260px] md:max-w-[300px] object-contain transition-all duration-200 group-hover:opacity-95"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {displayStoreName}
              </span>
            )}
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
                    else if (item.link?.startsWith('/blog') || item.link?.startsWith('/blogs')) navigateTo('blog');
                    else if (item.link?.includes('faq')) {
                      if (activeNav !== 'home') navigateTo('home');
                      setTimeout(() => {
                        const el = document.getElementById('faq-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }
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
                            else if (sub.link?.startsWith('/blog') || sub.link?.startsWith('/blogs')) navigateTo('blog');
                            else if (sub.link?.includes('faq')) {
                              if (activeNav !== 'home') navigateTo('home');
                              setTimeout(() => {
                                const el = document.getElementById('faq-section');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                              }, 100);
                            }
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
          </nav>

          {/* Right Tools: Bag, Customer Account & Get A Quote */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">

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
                      else if (item.link?.startsWith('/blog') || item.link?.startsWith('/blogs')) navigateTo('blog');
                      else if (item.link?.includes('faq')) {
                        if (activeNav !== 'home') navigateTo('home');
                        setTimeout(() => {
                          const el = document.getElementById('faq-section');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }
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
                            else if (sub.link?.startsWith('/blog') || sub.link?.startsWith('/blogs')) navigateTo('blog');
                            else if (sub.link?.includes('faq')) {
                              if (activeNav !== 'home') navigateTo('home');
                              setTimeout(() => {
                                const el = document.getElementById('faq-section');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                              }, 100);
                            }
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

              {liveHeaderSettings.showCtaButton && liveHeaderSettings.ctaButtonText?.trim() && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsQuoteModalOpen(true);
                  }}
                  className="w-full text-center py-3 rounded-xl bg-gradient-to-r from-[#0093d0] to-[#00a651] text-white font-bold shadow-md cursor-pointer"
                >
                  {liveHeaderSettings.ctaButtonText} →
                </button>
              )}

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
        !activeProductDetail?.id ? (
          <div className="py-20 text-center max-w-md mx-auto px-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No Product Selected</h2>
            <p className="text-sm text-slate-500 mb-6">Please select a product from our store catalog.</p>
            <button
              onClick={() => {
                navigateTo('shop');
                navigate('/shop');
              }}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
            >
              Browse Shop
            </button>
          </div>
        ) : (
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
                        e.currentTarget.src = DEFAULT_STORE_FALLBACK_IMAGE;
                      }}
                      className="w-full h-full object-contain" 
                    />
                  </button>
                ))}
              </div>

              {/* Main Product Frame with Professional Cursor Zoom & Magnifier Icon */}
              <div 
                onMouseEnter={() => setIsHoverZooming(true)}
                onMouseLeave={() => setIsHoverZooming(false)}
                onMouseMove={handleProductImageMouseMove}
                className="relative flex-1 aspect-square max-h-[500px] bg-[#e8f5e9]/30 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center select-none cursor-crosshair"
                title="Hover cursor to zoom in details"
              >
                <img 
                  fetchPriority="high" 
                  width={500} 
                  height={500} 
                  src={currentProductImages[activeImageIndex] || activeProductDetail.coverImage} 
                  alt={activeProductDetail.title} 
                  style={{
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    transform: isHoverZooming ? 'scale(2.2)' : 'scale(1)',
                    transition: isHoverZooming ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_STORE_FALLBACK_IMAGE;
                  }}
                  className="w-4/5 h-4/5 object-contain select-none pointer-events-none will-change-transform"
                />

                {/* Left/Right Carousel Arrows */}
                {currentProductImages.length > 1 && (
                  <>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex(prev => (prev === 0 ? currentProductImages.length - 1 : prev - 1));
                      }}
                      className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer z-10"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex(prev => (prev === currentProductImages.length - 1 ? 0 : prev + 1));
                      }}
                      className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer z-10"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Magnified Zoom Icon Button (Click to Zoom Fullscreen) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsZoomModalOpen(true);
                  }}
                  className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 px-2.5 py-1.5 bg-slate-900/85 hover:bg-slate-950 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer z-20 backdrop-blur-xs"
                  title="Click to Zoom Fullscreen"
                  aria-label="Zoom Fullscreen"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>Zoom</span>
                </button>
              </div>

            </div>

            {/* Right Side: Title, Price, Actions, Key Highlights */}
            <div className="lg:col-span-6 space-y-4 sm:space-y-5">
              <div>
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md">
                  {activeProductDetail.series || 'Premium Laundry Care'}
                </span>
                <h1 className="font-sans text-2xl sm:text-3xl lg:text-4xl text-slate-900 font-bold tracking-tight leading-snug mt-2">
                  {activeProductDetail.title}
                </h1>
              </div>

              {/* Price Row */}
              <div className="flex flex-wrap items-baseline gap-2.5 sm:gap-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{formatPrice(activeProductDetail.price)}</span>
                {activeProductDetail.regularPrice && (
                  <span className="text-base sm:text-lg text-slate-400 line-through">{formatPrice(activeProductDetail.regularPrice)}</span>
                )}
                {activeProductDetail.discountPercentage && (
                  <span className="text-xs bg-rose-50 text-rose-700 font-bold px-2.5 py-1 rounded-md border border-rose-200">
                    SAVE {activeProductDetail.discountPercentage}%
                  </span>
                )}
              </div>

              {/* Variant / Weight Selector if product has variants */}
              {activeProductDetail.hasVariants && Array.isArray(activeProductDetail.variants) && activeProductDetail.variants.length > 0 && (
                <div className="space-y-2 pt-1 pb-1">
                  <label className="block text-xs font-bold text-slate-800">
                    ভ্যারিয়েন্ট / সাইজ নির্বাচন করুন (Variant):
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {activeProductDetail.variants.map((v) => {
                      const isCurrent = (activeVariant?.id === v.id);
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setActiveVariant(v)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                            isCurrent
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs ring-2 ring-purple-200'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/50'
                          }`}
                        >
                          {v.color && (
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-white/50 shrink-0 shadow-xs"
                              style={{ backgroundColor: v.color }}
                            />
                          )}
                          <span>{v.name}</span>
                          {v.price && v.price !== activeProductDetail.price && (
                            <span className={`text-[10px] ml-0.5 ${isCurrent ? 'text-purple-100' : 'text-slate-500'}`}>
                              ({formatPrice(v.price)})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Product Attributes (e.g. Unit: pcs, Size, Color - excluding Weight) */}
              {((Array.isArray(activeProductDetail.selectedAttributes) && activeProductDetail.selectedAttributes.some(a => !/weight|ওজন/i.test(a.attributeName || ''))) || (activeProductDetail.unit && !/kg|gm|g|gram|ওজন/i.test(activeProductDetail.unit))) && (
                <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
                  {Array.isArray(activeProductDetail.selectedAttributes) && activeProductDetail.selectedAttributes
                    .filter(attr => !/weight|ওজন/i.test(attr.attributeName || ''))
                    .map((attr, idx) => (
                      <div 
                        key={attr.attributeId || idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-medium text-slate-800 shadow-2xs"
                      >
                        <span className="text-slate-400 font-semibold">{attr.attributeName}:</span>
                        <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200/60">
                          {Array.isArray(attr.values) ? attr.values.join(', ') : attr.values}
                        </span>
                      </div>
                    ))}

                  {activeProductDetail.unit && activeProductDetail.unit !== 'pcs' && !/kg|gm|g|gram|ওজন/i.test(activeProductDetail.unit) && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-medium text-slate-800 shadow-2xs">
                      <span className="text-slate-400 font-semibold">Unit:</span>
                      <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200/60 uppercase">
                        {activeProductDetail.unit}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Actions (ADD TO BAG & BUY NOW Horizontally) */}
              <div className="pt-1 grid grid-cols-2 gap-2.5 sm:gap-3">
                <button 
                  onClick={() => handleAddToCart(activeProductDetail, 1, activeVariant)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer rounded-xl flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span>ADD TO BAG</span>
                </button>
                <button 
                  onClick={() => {
                    handleAddToCart(activeProductDetail, 1, activeVariant);
                    setIsCartOpen(false);
                    navigateTo('checkout');
                  }}
                  className="bg-gradient-to-r from-[#0093d0] to-[#00a651] hover:from-[#0082b8] hover:to-[#008f45] text-white font-bold py-3.5 px-4 text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer rounded-xl flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-current shrink-0" />
                  <span>BUY NOW</span>
                </button>
              </div>

            </div>

          </div>

          {/* ============================================================
              FULL-WIDTH DETAILS SECTION: DESCRIPTION, SPECIFICATIONS & FEATURES
              ============================================================ */}
          <div className="mt-12 sm:mt-16 pt-10 border-t border-slate-200 space-y-12 sm:space-y-16">
            
            {/* 1. PRODUCT DESCRIPTION (Clean, Formatted & Separated) */}
            {activeProductDetail.description && (
              <div className="max-w-4xl mx-auto">
                <div className="text-center sm:text-left mb-6">
                  <span className="text-xs uppercase tracking-wider font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full">
                    Product Description
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 flex items-center justify-center sm:justify-start gap-2">
                    <Sparkles className="w-5 h-5 text-sky-600" />
                    পণ্যের বিবরণ ও বৈশিষ্ট্য
                  </h2>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
                  {/<[a-z][\s\S]*>/i.test(activeProductDetail.description) ? (
                    <div 
                      className="prose prose-slate max-w-none text-sm sm:text-base leading-relaxed space-y-4"
                      dangerouslySetInnerHTML={{ __html: activeProductDetail.description }}
                    />
                  ) : (
                    <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                      {activeProductDetail.description.split('\n\n').filter(Boolean).map((para, pIdx) => {
                        const trimmed = para.trim();
                        if (trimmed.startsWith('http') && (trimmed.endsWith('.jpg') || trimmed.endsWith('.png') || trimmed.endsWith('.webp') || trimmed.includes('/uploads/'))) {
                          return (
                            <div key={pIdx} className="my-4 rounded-xl overflow-hidden border border-slate-200 shadow-xs flex justify-center">
                              <img src={trimmed} alt="Product Detail" className="max-w-full h-auto object-contain" />
                            </div>
                          );
                        }
                        return (
                          <p key={pIdx} className="text-slate-700">
                            {para}
                          </p>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. PRODUCT SPECIFICATIONS TABLE (Only shown if custom specs are configured) */}
            {((activeProductDetail as any).specTable?.length > 0) && (
              <div className="max-w-4xl mx-auto">
                <div className="text-center sm:text-left mb-6">
                  <span className="text-xs uppercase tracking-wider font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full">
                    Detailed Specifications
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 flex items-center justify-center sm:justify-start gap-2">
                    <Sparkles className="w-5 h-5 text-sky-600" />
                    Product Specifications (পণ্যের বিশদ বিবরণ)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Leaf Curt প্রিমিয়াম পডসের টেকনিক্যাল স্পেসিফিকেশন ও ব্যবহারের নির্দেশিকা
                  </p>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 shadow-xs bg-white">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-800 font-bold uppercase text-[11px] sm:text-xs tracking-wider">
                        <th className="py-3 px-3 sm:px-5 w-2/5 sm:w-1/3 border-r border-slate-200">Feature</th>
                        <th className="py-3 px-3 sm:px-5">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {((activeProductDetail as any).specTable as any[]).map((row: any, idx: number) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50/60' : 'bg-slate-50/40 hover:bg-slate-50/70'}>
                          <td className="py-3 px-3 sm:px-5 font-semibold text-slate-900 border-r border-slate-200/80 align-top">
                            {row.feature || row.label}
                          </td>
                          <td className="py-3 px-3 sm:px-5 text-slate-700 leading-relaxed align-top">
                            {row.details || row.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          {/* Related / Other Products Section */}
          {products.filter(p => p.id !== activeProductDetail.id).length > 0 && (
            <div className="mt-14 pt-10 border-t border-slate-200">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full">
                    Explore More
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                    সম্পর্কিত অন্যান্য প্রোডাক্টসমূহ
                  </h2>
                </div>
                <button 
                  onClick={() => {
                    navigateTo('shop');
                    navigate('/shop');
                  }}
                  className="text-xs sm:text-sm font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 group transition cursor-pointer"
                >
                  View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {products.filter(p => p.id !== activeProductDetail.id).slice(0, 4).map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => openProductDetail(item)}
                    className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 hover:border-slate-300 p-2.5 sm:p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-lg cursor-pointer"
                  >
                    <div>
                      {/* Product Image */}
                      <div className="relative aspect-square w-full rounded-lg sm:rounded-xl bg-[#e8f5e9]/20 overflow-hidden mb-2.5 sm:mb-3 flex items-center justify-center">
                        <img 
                          src={item.image || item.coverImage || DEFAULT_STORE_FALLBACK_IMAGE} 
                          alt={item.title}
                          className="w-4/5 h-4/5 object-contain transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = DEFAULT_STORE_FALLBACK_IMAGE;
                          }}
                        />
                        {item.discountPercentage && (
                          <span className="absolute top-2 left-2 bg-rose-600 text-white font-bold text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded shadow-xs">
                            -{item.discountPercentage}%
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 group-hover:text-sky-600 transition-colors">
                        {item.title}
                      </h3>

                      {/* Price */}
                      <div className="flex items-baseline gap-1.5 mt-1 sm:mt-1.5">
                        <span className="text-xs sm:text-sm font-bold text-slate-900">
                          {formatPrice(item.price)}
                        </span>
                        {item.regularPrice && (
                          <span className="text-[10px] sm:text-xs text-slate-400 line-through">
                            {formatPrice(item.regularPrice)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Horizontal Action Buttons */}
                    <div className="pt-2.5 sm:pt-3 grid grid-cols-2 gap-1 sm:gap-1.5 w-full">
                      <button 
                        type="button"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleAddToCart(item); 
                        }}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white py-1.5 sm:py-2 px-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold tracking-tight uppercase flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs"
                        title="Add to Cart"
                      >
                        <ShoppingBag className="w-3 h-3 shrink-0" />
                        <span className="truncate">Add to Cart</span>
                      </button>
                      
                      <button 
                        type="button"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleAddToCart(item);
                          setIsCartOpen(false);
                          navigateTo('checkout');
                        }}
                        className="w-full bg-gradient-to-r from-[#0093d0] to-[#00a651] hover:from-[#0082b8] hover:to-[#008f45] text-white py-1.5 sm:py-2 px-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold tracking-tight uppercase flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs"
                        title="Buy Now"
                      >
                        <Zap className="w-3 h-3 fill-current shrink-0" />
                        <span className="truncate">Buy Now</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        )
      )}

      {/* VIEW 2: CONTACT US PAGE (Logo Branding & NeuAura Style) */}
      {activeNav === 'contact' && (
        <div className="py-10 sm:py-16 bg-[#fafbfc] min-h-screen">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Page Header & Breadcrumbs */}
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0279c7] tracking-tight">
                Contact Us
              </h1>
              <nav className="flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-slate-500 mt-2.5">
                <button 
                  onClick={() => navigateTo('home')}
                  className="hover:text-[#0279c7] transition cursor-pointer"
                >
                  Home
                </button>
                <span className="text-slate-400">›</span>
                <span className="text-slate-700 font-semibold">Contact Us</span>
              </nav>
            </div>

            {/* Main Two-Column Card Container */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col lg:flex-row">
              
              {/* Left Column: Let's Talk (Vibrant Logo Ocean Water Blue) */}
              <div className="lg:w-[38%] bg-[#0279c7] text-white p-8 sm:p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-white/5 pointer-events-none blur-2xl" />
                
                <div className="relative z-10 space-y-8">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
                      Let's Talk
                    </h2>
                    <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-normal">
                      Have a question about your order, our products, or anything else? We're here to help.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Email */}
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center text-white shrink-0 shadow-inner">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block mb-0.5">
                          Email
                        </span>
                        <a 
                          href={`mailto:${displayEmail || 'info@livewellfresh.com'}`}
                          className="text-xs sm:text-sm text-white font-medium hover:underline break-all"
                        >
                          {displayEmail || 'info@livewellfresh.com'}
                        </a>
                      </div>
                    </div>

                    {/* Customer Support Hours */}
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center text-white shrink-0 shadow-inner">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block mb-0.5">
                          Customer Support
                        </span>
                        <p className="text-xs sm:text-sm text-white font-medium leading-relaxed">
                          Monday – Saturday<br />
                          10:00 AM – 6:00 PM
                        </p>
                      </div>
                    </div>

                    {/* Phone / WhatsApp */}
                    {displayPhone && (
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center text-white shrink-0 shadow-inner">
                          <Phone className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block mb-0.5">
                            Customer Care Hotline
                          </span>
                          <a 
                            href={`tel:${displayPhone}`}
                            className="text-xs sm:text-sm text-white font-medium hover:underline"
                          >
                            {displayPhone}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Location */}
                    {displayAddress && (
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center text-white shrink-0 shadow-inner">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block mb-0.5">
                            Office Location
                          </span>
                          <p className="text-xs sm:text-sm text-white font-medium leading-relaxed">
                            {displayAddress}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative z-10 pt-8 mt-8 border-t border-white/15 text-[11px] text-blue-200/80">
                  {displayCompanyName} • Dedicated Customer Care
                </div>
              </div>

              {/* Right Column: Send us a message form */}
              <div className="lg:flex-1 p-8 sm:p-10 lg:p-12 bg-white">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0279c7] tracking-tight mb-8">
                  Send us a message
                </h2>

                <form onSubmit={handleContactSubmit} className="space-y-5">
                  
                  {/* First Name & Last Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        First Name
                      </label>
                      <input 
                        type="text" 
                        value={contactFirstName} 
                        onChange={e => setContactFirstName(e.target.value)} 
                        placeholder="First Name"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:border-[#0279c7] focus:ring-1 focus:ring-[#0279c7] transition shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Last Name
                      </label>
                      <input 
                        type="text" 
                        value={contactLastName} 
                        onChange={e => setContactLastName(e.target.value)} 
                        placeholder="Last Name"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:border-[#0279c7] focus:ring-1 focus:ring-[#0279c7] transition shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="email" 
                      required
                      value={contactEmail} 
                      onChange={e => setContactEmail(e.target.value)} 
                      placeholder="your.email@example.com"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:border-[#0279c7] focus:ring-1 focus:ring-[#0279c7] transition shadow-2xs"
                    />
                  </div>

                  {/* Phone Number with country dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={contactCountryCode}
                        onChange={e => setContactCountryCode(e.target.value)}
                        className="px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 outline-none focus:border-[#0279c7] cursor-pointer"
                      >
                        <option value="+880">+880 (BD)</option>
                        <option value="+91">+91 (IN)</option>
                        <option value="+1">+1 (US)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+971">+971 (UAE)</option>
                        <option value="+966">+966 (KSA)</option>
                        <option value="+60">+60 (MY)</option>
                      </select>
                      <input 
                        type="tel" 
                        value={contactPhone} 
                        onChange={e => setContactPhone(e.target.value)} 
                        placeholder="01XXXXXXXXX"
                        className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:border-[#0279c7] focus:ring-1 focus:ring-[#0279c7] transition shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Subject
                    </label>
                    <input 
                      type="text" 
                      value={contactSubject} 
                      onChange={e => setContactSubject(e.target.value)} 
                      placeholder="How can we help you?"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:border-[#0279c7] focus:ring-1 focus:ring-[#0279c7] transition shadow-2xs"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea 
                      rows={5} 
                      required
                      value={contactMessage} 
                      onChange={e => setContactMessage(e.target.value)} 
                      placeholder="Write your message or inquiry here..."
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:border-[#0279c7] focus:ring-1 focus:ring-[#0279c7] transition shadow-2xs resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={isSubmittingContact}
                      className="w-full sm:w-auto px-8 py-3.5 bg-[#0279c7] hover:bg-[#0269ad] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSubmittingContact ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Sending Message...</span>
                        </>
                      ) : contactSubmitted ? (
                        <span>✓ Message Sent Successfully!</span>
                      ) : (
                        <span>Send Message</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: SHOP CATALOG PAGE (Screenshot 3 & 4) */}
      {activeNav === 'shop' && (
        <div className="py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
          


          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            
            <div className="lg:col-span-3 space-y-6">
              {/* Shop Categories Filter Card — Only show if real categories exist */}
              {shopCategories.length > 0 && (
                <div className="bg-white p-5 sm:p-6 border border-slate-200/80 shadow-xs">
                  <h2 className="font-sans text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 pb-2 border-b border-slate-100">
                    Shop Categories
                  </h2>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-3">
                    {['All', ...shopCategories].map((cat) => (
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
              )}

              {/* Brands Filter Card — Only show if real brands exist */}
              {shopBrands.length > 0 && (
                <div className="bg-white p-5 sm:p-6 border border-slate-200/80 shadow-xs">
                  <h2 className="font-sans text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 pb-2 border-b border-slate-100">
                    Brands
                  </h2>
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-3">
                    {['All', ...shopBrands].map((brand: any) => (
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

              {/* Product Grid: Zero-Gap Luxury Grid with Hover Selected Border */}
              {paginatedProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-0 border-t border-l border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-xs">
                  {paginatedProducts.map((product) => {
                    const isDiscounted = product.regularPrice && product.regularPrice > product.price;
                    const discountPct = isDiscounted 
                      ? Math.round(((product.regularPrice! - product.price) / product.regularPrice!) * 100) 
                      : 0;

                    return (
                      <div 
                        key={product.id}
                        onClick={() => openProductDetail(product)}
                        className="group relative flex flex-col bg-white border-r border-b border-slate-200/90 transition-all duration-200 cursor-pointer hover:z-20 hover:ring-2 hover:ring-[#0093d0] hover:shadow-2xl select-none justify-between"
                      >
                        <div className="relative aspect-square w-full bg-[#f8f7f5] overflow-hidden">
                          <ResponsiveImage width={286} height={286} src={product.coverImage} alt={product.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                            sizes="(max-width: 640px) 50vw, 33vw"
                          />

                          {isDiscounted && discountPct > 0 && (
                            <div className="absolute top-2.5 left-2.5 z-10 bg-rose-600 text-white text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-md tracking-wider">
                              SAVE {discountPct}%
                            </div>
                          )}
                        </div>

                        <div className="p-2.5 sm:p-3.5 text-center flex-1 flex flex-col justify-between bg-white">
                          <div className="space-y-1">
                            <h4 className="font-sans text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-[#0093d0] transition-colors truncate">
                              {product.title}
                            </h4>

                            {/* Attribute Badge (excluding weight) */}
                            {Array.isArray(product.selectedAttributes) && product.selectedAttributes.some(a => !/weight|ওজন/i.test(a.attributeName || '')) && (
                              <div className="flex flex-wrap items-center justify-center gap-1 my-0.5">
                                {product.selectedAttributes
                                  .filter(attr => !/weight|ওজন/i.test(attr.attributeName || ''))
                                  .map((attr, aIdx) => (
                                    <span 
                                      key={aIdx} 
                                      className="inline-flex items-center text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/80"
                                    >
                                      {Array.isArray(attr.values) ? attr.values.join(', ') : attr.values}
                                    </span>
                                  ))}
                              </div>
                            )}

                            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 font-sans text-xs">
                              <span className="text-slate-900 font-extrabold text-xs sm:text-sm">{formatPrice(product.price)}</span>
                              {isDiscounted && (
                                <span className="text-slate-400 line-through text-[11px] sm:text-xs">{formatPrice(product.regularPrice!)}</span>
                              )}
                            </div>
                          </div>

                          {/* Horizontal Action Buttons: Add to Cart & Buy Now */}
                          <div className="pt-2 sm:pt-2.5 grid grid-cols-2 gap-1 sm:gap-1.5 w-full">
                            <button 
                              type="button"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleAddToCart(product); 
                              }}
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-1.5 sm:py-2 px-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold tracking-tight uppercase flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs"
                              title="Add to Cart"
                            >
                              <ShoppingBag className="w-3 h-3 shrink-0" />
                              <span className="truncate">Add to Cart</span>
                            </button>
                            
                            <button 
                              type="button"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleAddToCart(product);
                                setIsCartOpen(false);
                                navigateTo('checkout');
                              }}
                              className="w-full bg-gradient-to-r from-[#0093d0] to-[#00a651] hover:from-[#0082b8] hover:to-[#008f45] text-white py-1.5 sm:py-2 px-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold tracking-tight uppercase flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs"
                              title="Buy Now"
                            >
                              <Zap className="w-3 h-3 fill-current shrink-0" />
                              <span className="truncate">Buy Now</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
          VIEW 4: DEDICATED ABOUT US PAGE (Exact NeuAura Style & Rich Laundry Pod Content)
          ============================================================ */}
      {activeNav === 'about' && (
        <React.Suspense fallback={
          <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-[#004d40] border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          <AboutUsPage 
            onNavigateHome={() => navigateTo('home')}
            onNavigateShop={() => navigateTo('shop')}
            onNavigateContact={() => navigateTo('contact')}
            brandName={displayStoreName || 'Leaf Curt'}
            brandLogo={displayStoreLogo}
            products={products}
          />
        </React.Suspense>
      )}

      {/* ============================================================
          VIEW 5: DEDICATED CHECKOUT PAGE (Exact UX from User Design)
          ============================================================ */}
      {activeNav === 'checkout' && (
        <React.Suspense fallback={
          <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-[#004d40] border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
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
        </React.Suspense>
      )}

      {/* VIEW 6: HOME VIEW (Default Storefront) */}
      {activeNav === 'home' && (
        <>
          {/* ============================================================
              1. FULL-WIDTH DYNAMIC HERO CAROUSEL SLIDER (Admin Panel Dynamic)
              ============================================================ */}
          <section 
            className="relative z-30 w-full overflow-hidden bg-slate-950 text-white select-none min-h-[460px] sm:min-h-[560px] lg:min-h-[640px] xl:min-h-[700px] flex items-center"
            onMouseEnter={() => setIsSliderPaused(true)}
            onMouseLeave={() => setIsSliderPaused(false)}
          >
            {activeHeroBanners.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0f172a] to-slate-900" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(2,132,199,0.18),transparent_55%)] pointer-events-none" />
                <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-12 py-16 sm:py-24 text-center space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm font-bold tracking-widest uppercase animate-fadeIn">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{displayStoreName.toUpperCase()}</span>
                  </div>
                  <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-md leading-[1.15]">
                    {displayStoreName}
                  </h1>
                  {displayTagline && (
                    <p className="text-sm sm:text-lg md:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed font-normal">
                      {displayTagline}
                    </p>
                  )}
                  <div className="pt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => navigateTo('shop')}
                      className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-[#0093d0] to-[#00a651] hover:from-[#0082b8] hover:to-[#008f45] text-white font-bold text-sm sm:text-base shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <span>EXPLORE SHOP</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              activeHeroBanners.map((banner, index) => {
                const isActive = index === activeSlideIndex;
                const isVideo = banner.mediaType === 'video';
                const ytId = isVideo && (banner.videoType === 'youtube' || banner.youtubeUrl)
                  ? extractYouTubeVideoId(banner.youtubeUrl || banner.videoUrl)
                  : null;
                const directVideoUrl = isVideo && !ytId ? banner.videoUrl : null;

                return (
                  <div
                    key={banner.id || index}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                      isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                    }`}
                  >
                    {/* Slide Background: Video (YouTube or MP4) or Image */}
                    {isVideo ? (
                      <div className="absolute inset-0 overflow-hidden bg-black flex items-center justify-center">
                        {ytId ? (
                          <iframe
                            src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&controls=1&loop=1&playlist=${ytId}&playsinline=1&rel=0&modestbranding=1`}
                            title={banner.title || "Hero Video"}
                            loading="lazy"
                            className="w-full h-full border-0 aspect-video pointer-events-auto"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        ) : directVideoUrl ? (
                          <video
                            ref={(el) => {
                              const videoKey = banner.id || String(index);
                              heroVideoRefs.current[videoKey] = el;
                              if (el) {
                                if (isActive) {
                                  el.muted = isHeroMuted;
                                  el.play().catch(() => {});
                                } else {
                                  el.pause();
                                  el.currentTime = 0;
                                }
                              }
                            }}
                            autoPlay
                            loop={activeHeroBanners.length <= 1}
                            muted={isHeroMuted}
                            playsInline
                            preload="auto"
                            onEnded={handleVideoEnded}
                            poster={banner.imageUrl || undefined}
                            className="w-full h-full object-cover pointer-events-auto"
                          >
                            <source src={directVideoUrl} type="video/mp4" />
                          </video>
                        ) : null}
                      </div>
                    ) : (
                      <div className="absolute inset-0">
                        <picture>
                          {banner.mobileImageUrl && (
                            <source media="(max-width: 640px)" srcSet={banner.mobileImageUrl} />
                          )}
                          {banner.imageUrl ? (
                            <img
                              src={banner.imageUrl}
                              alt={banner.title || displayStoreName}
                              className="w-full h-full object-cover object-center"
                              loading={index === 0 ? 'eager' : 'lazy'}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-950 via-[#0f172a] to-slate-900" />
                          )}
                        </picture>
                        <div className={`absolute inset-0 bg-gradient-to-r ${banner.bgGradient || 'from-slate-950/85 via-slate-900/50 to-transparent'}`} />
                      </div>
                    )}

                    {/* Slide Content Overlay (Only for image slides — for video slides, ONLY the video is shown with nothing else) */}
                    {!banner.imageOnly && !isVideo && (
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

                          {banner.secondaryButtonText?.trim() && (
                            <button
                              type="button"
                              onClick={() => {
                                if (banner.secondaryButtonLink === '#quote') {
                                  setIsQuoteModalOpen(true);
                                } else if (banner.secondaryButtonLink?.startsWith('/')) {
                                  navigate(banner.secondaryButtonLink);
                                } else if (banner.secondaryButtonLink) {
                                  window.location.href = banner.secondaryButtonLink;
                                } else {
                                  setIsQuoteModalOpen(true);
                                }
                              }}
                              className="px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white font-semibold text-sm sm:text-base transition-all duration-300 flex items-center gap-2 cursor-pointer active:scale-95"
                            >
                              <span>{banner.secondaryButtonText}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}

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

                {/* Dot Pagination Indicators (Always visible when multiple banners exist) */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-lg">
                  {activeHeroBanners.map((b, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={() => setActiveSlideIndex(dotIdx)}
                      className={`transition-all rounded-full cursor-pointer flex items-center justify-center ${
                        dotIdx === activeSlideIndex
                          ? 'w-8 h-2.5 bg-gradient-to-r from-[#0093d0] to-[#00a651] shadow-md'
                          : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/80'
                      }`}
                      aria-label={`Slide ${dotIdx + 1} (${b.mediaType === 'video' ? 'Video' : 'Image'})`}
                      title={`Slide ${dotIdx + 1}: ${b.mediaType === 'video' ? 'Video Slide' : 'Image Slide'}`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Sound / Volume Control for Hero Video Banner */}
            {activeHeroBanners[activeSlideIndex]?.mediaType === 'video' && (
              <button
                type="button"
                onClick={toggleHeroSound}
                className="absolute bottom-4 sm:bottom-6 right-3 sm:right-6 z-30 inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/55 hover:bg-black/85 backdrop-blur-md text-white border border-white/20 shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer group select-none"
                title={isHeroMuted ? "শব্দ চালু করুন (Sound On)" : "শব্দ বন্ধ করুন (Sound Off)"}
                aria-label={isHeroMuted ? "Unmute video sound" : "Mute video sound"}
              >
                {isHeroMuted ? (
                  <VolumeX className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-rose-300 group-hover:text-white transition-colors" />
                ) : (
                  <Volume2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-400 group-hover:text-emerald-300 animate-pulse transition-colors" />
                )}
              </button>
            )}
          </section>

          {/* Ambient Rising Soap Bubbles Layer (Floating from bottom to top across all sections below hero slider) */}
          <AmbientSoapBubbles />

          {/* 2. Brand Partner / Commercial Client Logos Trust Bar */}
          <BrandLogosSection 
            settings={ecomSettings?.clientLogos || DEFAULT_CLIENT_LOGOS_SETTINGS}
          />

          {/* ============================================================
              3. EMPTY STATE OR FEATURED PRODUCTS (Dynamic from Admin & DB)
              ============================================================ */}
          {products.length === 0 ? (
            <section className="py-16 sm:py-24 bg-white border-b border-slate-100 text-center">
              <div className="max-w-md mx-auto px-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-sans text-xl font-bold text-slate-900">
                    Welcome to {displayStoreName}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Our catalog is ready for products. Manage and add your items directly from the Admin Panel.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (onGoToLogin) {
                        onGoToLogin();
                      } else {
                        navigate('/login');
                      }
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Go to Admin Panel & Add Products
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <>
              {/* FEATURED PRODUCTS */}
              <section className="pt-4 pb-6 sm:pt-6 sm:pb-8 lg:pt-7 lg:pb-8 bg-white border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-8">
                  <div className="text-center max-w-3xl mx-auto mb-5 sm:mb-7">
                    <div className="inline-block relative">
                      <h2 className="font-sans text-2xl sm:text-3xl lg:text-4xl text-slate-900 font-bold tracking-tight pb-1">
                        {ecomSettings?.featuredSectionTitle && ecomSettings.featuredSectionTitle !== `${displayStoreName} Featured Products`
                          ? ecomSettings.featuredSectionTitle 
                          : 'Featured Products'}
                      </h2>
                      {/* Hand-drawn colorful curved underline */}
                      <svg 
                        className="w-full h-3.5 sm:h-5 max-w-[240px] sm:max-w-[290px] mx-auto mt-0.5 overflow-visible" 
                        viewBox="0 0 250 20" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <defs>
                          <linearGradient id="featuredCurveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#0284c7" />
                            <stop offset="25%" stopColor="#06b6d4" />
                            <stop offset="55%" stopColor="#8b5cf6" />
                            <stop offset="80%" stopColor="#ec4899" />
                            <stop offset="100%" stopColor="#f59e0b" />
                          </linearGradient>
                          <filter id="curveSoftGlow" x="-10%" y="-10%" width="120%" height="120%">
                            <feGaussianBlur stdDeviation="1.5" result="glow" />
                            <feComposite in="SourceGraphic" in2="glow" operator="over" />
                          </filter>
                        </defs>
                        {/* Playful, organic hand-drawn curved stroke */}
                        <path 
                          d="M6 13 C 48 4, 96 16, 146 9 C 184 3.5, 218 7, 244 11" 
                          stroke="url(#featuredCurveGradient)" 
                          strokeWidth="3.5" 
                          strokeLinecap="round" 
                          filter="url(#curveSoftGlow)"
                        />
                        <path 
                          d="M18 16 C 62 8, 112 17, 162 11 C 196 6.5, 222 9, 238 12" 
                          stroke="url(#featuredCurveGradient)" 
                          strokeWidth="1.8" 
                          strokeLinecap="round" 
                          opacity="0.85"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Seamless Zero-Gap Luxury Product Grid with Hover Selected Border */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-0 border-t border-l border-slate-200/90 rounded-2xl sm:rounded-3xl overflow-hidden bg-white shadow-sm">
                    {products.slice(0, 6).map((product) => {
                      const isDiscounted = product.regularPrice && product.regularPrice > product.price;
                      const discountPct = isDiscounted 
                        ? Math.round(((product.regularPrice! - product.price) / product.regularPrice!) * 100) 
                        : 0;

                      return (
                        <div 
                          key={product.id}
                          onClick={() => openProductDetail(product)}
                          className="group relative flex flex-col bg-white border-r border-b border-slate-200/90 transition-all duration-200 cursor-pointer hover:z-20 hover:ring-2 hover:ring-[#0093d0] hover:shadow-2xl select-none"
                        >
                          {/* Aspect-Square Edge-to-Edge Image Container (Zero Gap) */}
                          <div className="relative aspect-square w-full bg-[#f8f7f5] overflow-hidden">
                            <img 
                              loading="lazy" 
                              decoding="async"
                              width={380} 
                              height={380} 
                              src={optimizeImageUrl(product.coverImage, 400)} 
                              srcSet={`${optimizeImageUrl(product.coverImage, 360)} 360w, ${optimizeImageUrl(product.coverImage, 600)} 600w`}
                              sizes="(max-width: 640px) 50vw, 33vw"
                              alt={product.title}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = DEFAULT_PRODUCT_FALLBACK_IMAGE;
                              }}
                              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                            />

                            {/* Top-Left Discount Badge */}
                            {isDiscounted && discountPct > 0 && (
                              <div className="absolute top-2.5 left-2.5 z-10 bg-rose-600 text-white text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-md tracking-wider">
                                SAVE {discountPct}%
                              </div>
                            )}
                          </div>

                          {/* Product Details (Below Image) */}
                          <div className="p-2.5 sm:p-3.5 text-center flex-1 flex flex-col justify-between bg-white">
                            <div className="space-y-1">
                              <h3 className="font-sans text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-[#0093d0] transition-colors line-clamp-1">
                                {product.title}
                              </h3>

                              {/* Attribute Badge (excluding weight) */}
                              {Array.isArray(product.selectedAttributes) && product.selectedAttributes.some(a => !/weight|ওজন/i.test(a.attributeName || '')) && (
                                <div className="flex flex-wrap items-center justify-center gap-1 my-0.5">
                                  {product.selectedAttributes
                                    .filter(attr => !/weight|ওজন/i.test(attr.attributeName || ''))
                                    .map((attr, aIdx) => (
                                      <span 
                                        key={aIdx} 
                                        className="inline-flex items-center text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/80"
                                      >
                                        {Array.isArray(attr.values) ? attr.values.join(', ') : attr.values}
                                      </span>
                                    ))}
                                </div>
                              )}
                              
                              <div className="flex items-center justify-center gap-1.5 font-sans">
                                <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                                  {formatPrice(product.price)}
                                </span>
                                {isDiscounted && (
                                  <span className="text-[11px] sm:text-xs text-slate-400 line-through font-normal">
                                    {formatPrice(product.regularPrice!)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Horizontal Action Buttons: Add to Cart & Buy Now */}
                            <div className="pt-2 sm:pt-2.5 grid grid-cols-2 gap-1 sm:gap-1.5 w-full">
                              <button 
                                type="button"
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  handleAddToCart(product); 
                                }}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-1.5 sm:py-2 px-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold tracking-tight uppercase flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs"
                                title="Add to Cart"
                              >
                                <ShoppingBag className="w-3 h-3 shrink-0" />
                                <span className="truncate">Add to Cart</span>
                              </button>
                              
                              <button 
                                type="button"
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  handleAddToCart(product);
                                  setIsCartOpen(false);
                                  navigateTo('checkout');
                                }}
                                className="w-full bg-gradient-to-r from-[#0093d0] to-[#00a651] hover:from-[#0082b8] hover:to-[#008f45] text-white py-1.5 sm:py-2 px-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold tracking-tight uppercase flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs"
                                title="Buy Now"
                              >
                                <Zap className="w-3 h-3 fill-current shrink-0" />
                                <span className="truncate">Buy Now</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-center mt-5 sm:mt-6">
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

              {/* 4. Interactive Before & After Stain Removal Demonstration */}
              <BeforeAfterSection 
                settings={ecomSettings?.beforeAfter || DEFAULT_BEFORE_AFTER_SETTINGS}
                onNavigateShop={() => navigateTo('shop')}
              />

              {/* 5. Colorful Smart Comparison Chart: Why Laundry Pods Win vs Powder & Liquid */}
              <WashingComparisonSection 
                onNavigateShop={() => navigateTo('shop')}
                brandName={displayStoreName || 'Leaf Curt'}
              />

              {/* BEST SELLERS SECTION (ALGORITHM-BASED WITH THREE TABS: THIS WEEK / THIS MONTH / ALL TIME) */}
              {/* If no products have sales (total sales is 0), this whole section is completely hidden */}
              {bestSellers.totalSales > 0 && (bestSellers.week.length > 0 || bestSellers.month.length > 0 || bestSellers.all.length > 0) ? (
                <section className="pt-5 pb-6 sm:pt-7 sm:pb-8 lg:pt-7 lg:pb-8 bg-[#faf8f5] border-b border-slate-200/70">
                  <div className="max-w-7xl mx-auto px-4 sm:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-4 sm:mb-6">
                      <div className="inline-block relative">
                        <h2 className="font-sans text-xl sm:text-2xl lg:text-3xl text-slate-900 font-bold tracking-tight pb-1">
                          {ecomSettings?.bestSellersSectionSubtitle || ecomSettings?.bundlesSectionSubtitle || 'Discover our top-performing products ranked by customer orders'}
                        </h2>
                        {/* Hand-drawn colorful curved underline */}
                        <svg 
                          className="w-full h-3.5 sm:h-5 max-w-[280px] sm:max-w-[340px] mx-auto mt-0.5 overflow-visible" 
                          viewBox="0 0 250 20" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <defs>
                            <linearGradient id="bestSellersCurveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#0284c7" />
                              <stop offset="25%" stopColor="#06b6d4" />
                              <stop offset="55%" stopColor="#8b5cf6" />
                              <stop offset="80%" stopColor="#ec4899" />
                              <stop offset="100%" stopColor="#f59e0b" />
                            </linearGradient>
                            <filter id="curveSoftGlowBS" x="-10%" y="-10%" width="120%" height="120%">
                              <feGaussianBlur stdDeviation="1.5" result="glow" />
                              <feComposite in="SourceGraphic" in2="glow" operator="over" />
                            </filter>
                          </defs>
                          {/* Playful, organic hand-drawn curved stroke */}
                          <path 
                            d="M6 13 C 48 4, 96 16, 146 9 C 184 3.5, 218 7, 244 11" 
                            stroke="url(#bestSellersCurveGradient)" 
                            strokeWidth="3.5" 
                            strokeLinecap="round" 
                            filter="url(#curveSoftGlowBS)"
                          />
                          <path 
                            d="M18 16 C 62 8, 112 17, 162 11 C 196 6.5, 222 9, 238 12" 
                            stroke="url(#bestSellersCurveGradient)" 
                            strokeWidth="1.8" 
                            strokeLinecap="round" 
                            opacity="0.85"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* 3 Tabs: This Week / This Month / All Time */}
                    <div className="flex items-center justify-center mb-8 sm:mb-12">
                      <div className="inline-flex p-1 bg-slate-200/70 rounded-full border border-slate-300/50 shadow-inner">
                        {(['week', 'month', 'all'] as const).map((period) => {
                          const label = period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time';
                          const count = bestSellers[period]?.length || 0;
                          const isActive = bestSellerPeriod === period;
                          return (
                            <button
                              key={period}
                              type="button"
                              onClick={() => setBestSellerPeriod(period)}
                              className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                                isActive
                                  ? 'bg-slate-900 text-white shadow-md'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                              }`}
                            >
                              <span>{label}</span>
                              {count > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                  isActive ? 'bg-amber-400 text-slate-950' : 'bg-slate-300 text-slate-700'
                                }`}>
                                  {count}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Products Grid for Active Tab */}
                    {bestSellers[bestSellerPeriod]?.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
                        {bestSellers[bestSellerPeriod].map((product, rankIdx) => (
                          <div 
                            key={`bestseller-${bestSellerPeriod}-${product.id}`}
                            className="group relative flex flex-col bg-white border border-slate-200/80 hover:shadow-xl transition-all duration-300 p-3 sm:p-4"
                          >
                            {/* Best Seller Rank Badge */}
                            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 items-start">
                              <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                                <Sparkles className="w-2.5 h-2.5" />
                                #{rankIdx + 1} Best Seller
                              </span>
                              {product.salesCount > 0 && (
                                <span className="inline-flex items-center gap-1 bg-slate-900/90 text-white text-[9px] font-medium px-1.5 py-0.5 rounded backdrop-blur-xs">
                                  🔥 {product.salesCount} Sold
                                </span>
                              )}
                            </div>

                            <div 
                              className="relative aspect-square w-full bg-[#f6f5f2] overflow-hidden mb-3 sm:mb-4 cursor-pointer" 
                              onClick={() => openProductDetail(product)}
                            >
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
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              {product.discountPercentage ? (
                                <span className="absolute top-4 right-4 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 shadow-sm">
                                  -{product.discountPercentage}%
                                </span>
                              ) : null}
                            </div>

                            <div className="text-center space-y-1.5 sm:space-y-2 flex-1 flex flex-col justify-between">
                              <h3 
                                onClick={() => openProductDetail(product)}
                                className="font-sans text-xs sm:text-sm text-slate-900 hover:text-amber-800 transition-colors cursor-pointer font-medium line-clamp-1"
                                title={product.title}
                              >
                                {product.title}
                              </h3>
                              
                              <div className="flex items-center justify-center gap-2 font-sans">
                                <span className="text-rose-600 font-semibold text-sm sm:text-base">
                                  {formatPrice(product.price)}
                                </span>
                                {product.regularPrice && product.regularPrice > product.price && (
                                  <span className="text-slate-400 line-through text-xs sm:text-sm">
                                    {formatPrice(product.regularPrice)}
                                  </span>
                                )}
                              </div>

                              <div className="mt-2 sm:mt-3 grid grid-cols-2 gap-1 sm:gap-1.5 w-full">
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(product);
                                  }}
                                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-1.5 sm:py-2 px-1 rounded-lg text-[10px] sm:text-xs font-bold tracking-tight uppercase flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs"
                                  title="Add to Cart"
                                >
                                  <ShoppingBag className="w-3 h-3 shrink-0" />
                                  <span className="truncate">Add to Cart</span>
                                </button>
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(product);
                                    setIsCartOpen(false);
                                    navigateTo('checkout');
                                  }}
                                  className="w-full bg-gradient-to-r from-[#0093d0] to-[#00a651] hover:from-[#0082b8] hover:to-[#008f45] text-white py-1.5 sm:py-2 px-1 rounded-lg text-[10px] sm:text-xs font-bold tracking-tight uppercase flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs"
                                  title="Buy Now"
                                >
                                  <Zap className="w-3 h-3 fill-current shrink-0" />
                                  <span className="truncate">Buy Now</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-white/70 border border-dashed border-slate-300 max-w-md mx-auto p-6">
                        <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                        <h4 className="text-base font-medium text-slate-900 mb-1">
                          No sales recorded {bestSellerPeriod === 'week' ? 'this week' : 'this month'} yet
                        </h4>
                        <p className="text-xs text-slate-500 mb-4">
                          Explore our all-time top performing customer favorites!
                        </p>
                        <button
                          type="button"
                          onClick={() => setBestSellerPeriod('all')}
                          className="px-5 py-2.5 bg-slate-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-slate-800 transition-colors shadow-sm"
                        >
                          View All-Time Best Sellers
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              ) : null}
            </>
          )}


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

                      {/* Right Column: Seamless Product Image with Floating Soap Bubbles */}
                      <div className="lg:col-span-6 relative flex items-center justify-center lg:justify-end">
                        <div 
                          onClick={() => {
                            if (targetProd) openProductDetail(targetProd);
                          }}
                          className="relative w-full max-w-[320px] sm:max-w-[370px] lg:max-w-[410px] cursor-pointer group flex items-center justify-center py-6 sm:py-8"
                        >
                          {/* Ambient Backlight Glow */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-amber-200/40 via-rose-200/30 to-sky-200/30 rounded-full blur-3xl opacity-60 group-hover:opacity-90 transition-opacity duration-700 pointer-events-none scale-105"></div>

                          {/* Floating Iridescent Soap Bubbles (Smoothly animated matching reference photo) */}
                          <div className="absolute inset-0 pointer-events-none z-20">
                            {/* Bubble 1: Big top-center bubble (circled in user image) */}
                            <div 
                              className="soap-bubble animate-bubble-1"
                              style={{
                                width: '64px',
                                height: '64px',
                                top: '-8%',
                                left: '22%',
                                animationDelay: '0s'
                              }}
                            />

                            {/* Bubble 2: Medium-large bubble above right edge (circled in user image) */}
                            <div 
                              className="soap-bubble animate-bubble-2"
                              style={{
                                width: '52px',
                                height: '52px',
                                top: '2%',
                                right: '14%',
                                animationDelay: '-2.5s'
                              }}
                            />

                            {/* Bubble 3: Medium bubble far top-left */}
                            <div 
                              className="soap-bubble animate-bubble-3"
                              style={{
                                width: '38px',
                                height: '38px',
                                top: '-14%',
                                left: '4%',
                                animationDelay: '-5s'
                              }}
                            />

                            {/* Bubble 4: Small-medium bubble mid-left */}
                            <div 
                              className="soap-bubble animate-bubble-4"
                              style={{
                                width: '30px',
                                height: '30px',
                                top: '32%',
                                left: '-8%',
                                animationDelay: '-1.5s'
                              }}
                            />

                            {/* Bubble 5: Small accent bubble between top bubbles */}
                            <div 
                              className="soap-bubble animate-bubble-1"
                              style={{
                                width: '22px',
                                height: '22px',
                                top: '-5%',
                                right: '38%',
                                animationDelay: '-4s'
                              }}
                            />

                            {/* Bubble 6: Medium accent bubble bottom-right */}
                            <div 
                              className="soap-bubble animate-bubble-3"
                              style={{
                                width: '36px',
                                height: '36px',
                                bottom: '6%',
                                right: '-4%',
                                animationDelay: '-3.5s'
                              }}
                            />

                            {/* Bubble 7: Soft smaller bubble mid-right */}
                            <div 
                              className="soap-bubble animate-bubble-2"
                              style={{
                                width: '24px',
                                height: '24px',
                                top: '44%',
                                right: '-6%',
                                animationDelay: '-6s'
                              }}
                            />

                            {/* Bubble 8: Small lower-left bubble */}
                            <div 
                              className="soap-bubble animate-bubble-4"
                              style={{
                                width: '26px',
                                height: '26px',
                                bottom: '12%',
                                left: '-2%',
                                animationDelay: '-7.5s'
                              }}
                            />
                          </div>

                          {/* Seamless Floating Product Image (Resized slightly smaller for optimal balance) */}
                          <img 
                            loading="lazy" 
                            width={286} 
                            height={286} 
                            src={image} 
                            alt={title} 
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = DEFAULT_STORE_FALLBACK_IMAGE;
                            }}
                            className="relative z-10 w-full h-auto max-h-[340px] sm:max-h-[390px] lg:max-h-[420px] object-contain drop-shadow-2xl group-hover:scale-105 group-hover:-translate-y-2 transition-all duration-700 select-none"
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
              || (isProductTarget ? (targetProd?.title || `${displayStoreName} Spotlight`) : `Explore Our ${targetCat} Collection`);
            
            const subtitle = (hlConfig?.subtitle && !hlConfig.subtitle.includes('stay in touch')) 
              ? hlConfig.subtitle
              : (isProductTarget ? productExcerpt : `Discover premium formulations and clinical results in our ${targetCat} line.`);
            
            const badgeTag = hlConfig?.badgeTag?.trim() 
              ? hlConfig.badgeTag 
              : (isProductTarget && targetProd?.category ? `${(targetProd.series || targetProd.category).toUpperCase()} • SPOTLIGHT` : `${targetCat.toUpperCase()} • COLLECTION`);
            
            const image = isProductTarget 
              ? (targetProd?.coverImage || (targetProd?.images && targetProd.images[0]) || hlConfig?.customImage || DEFAULT_STORE_FALLBACK_IMAGE)
              : (products.find(p => p.category?.toLowerCase() === targetCat.toLowerCase())?.coverImage || hlConfig?.customImage || DEFAULT_STORE_FALLBACK_IMAGE);

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
                          e.currentTarget.src = DEFAULT_STORE_FALLBACK_IMAGE;
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
              DYNAMIC HOMEPAGE SOCIAL PROOF & TRUST SECTIONS
              ============================================================ */}

          {/* 7. Real Customer Photo Reviews Gallery */}
          <PhotoReviewsSection 
            settings={ecomSettings?.photoReviews || DEFAULT_PHOTO_REVIEWS_SETTINGS}
          />

          {/* 8. Video Reviews Reel ("Hear it from the people who wash") */}
          <VideoReviewsSection 
            settings={ecomSettings?.videoReviews}
            products={products}
            onAddToCart={handleAddToCart}
            onBuyNow={(prod, qty) => {
              handleAddToCart(prod, qty);
              setIsCartOpen(false);
              navigateTo('checkout');
            }}
            onSelectProduct={(prod) => {
              setActiveProductDetail(prod as StoreProductItem);
              navigate(`/product/${getProductSlug(prod)}`);
              scrollToTop();
            }}
            formatPrice={formatPrice}
            onNavigateShop={() => navigateTo('shop')}
          />

          {/* 9. Verified Customer Testimonials Carousel */}
          <CustomerTestimonialsSection 
            settings={ecomSettings?.testimonials || DEFAULT_TESTIMONIAL_SETTINGS}
          />

          {/* 10. Frequently Asked Questions Accordion */}
          <FaqSection 
            settings={ecomSettings?.faqs}
          />


        </>
      )}

      {/* VIEW 8: BLOG DIRECTORY */}
      {activeNav === 'blog' && (
        <React.Suspense fallback={
          <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-[#004d40] border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          <BlogPage 
            posts={ecomSettings?.blogPosts || []}
            onSelectPost={(post) => {
              setSelectedBlogSlug(post.slug);
              setActiveNav('blog_post');
              navigate(`/blogs/news/${post.slug}`);
              scrollToTop();
            }}
            onNavigateHome={() => navigateTo('home')}
          />
        </React.Suspense>
      )}

      {/* VIEW 9: SINGLE BLOG POST DETAIL */}
      {activeNav === 'blog_post' && activeBlogPost && (
        <React.Suspense fallback={
          <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-[#004d40] border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          <BlogPostPage 
            post={activeBlogPost}
            allPosts={ecomSettings?.blogPosts || []}
            onNavigateBlog={() => {
              setActiveNav('blog');
              navigate('/blogs/news');
              scrollToTop();
            }}
            onSelectPost={(post) => {
              setSelectedBlogSlug(post.slug);
              navigate(`/blogs/news/${post.slug}`);
              scrollToTop();
            }}
            onNavigateHome={() => navigateTo('home')}
          />
        </React.Suspense>
      )}

      {/* ============================================================
          LUXURY FOOTER
          ============================================================ */}
      <React.Suspense fallback={<div className="h-40 bg-[#111827]"></div>}>
        <StoreFooter 
          displayStoreLogo={displayStoreLogo}
          displayStoreName={displayStoreName}
          displayTagline={displayTagline}
          displayEmail={displayEmail}
          displayPhone={displayPhone}
          shopCategories={shopCategories}
          socialLinks={activeSocialLinks}
          setActiveNav={(nav) => navigateTo(nav as any)}
          setSelectedCategoryCheckbox={setSelectedCategoryCheckbox}
          scrollToTop={scrollToTop}
        />
      </React.Suspense>

      {/* ============================================================
          SLIDE-OUT SHOPPING BAG & CHECKOUT DRAWER (MATCHING SCREENSHOT)
          ============================================================ */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsCartOpen(false)}
          />
          
          <div className="fixed inset-y-0 right-0 max-w-full flex">
            {/* 1. Desktop Attached "You May Also Like" Panel (Real Store Products) */}
            {cartUpsellProducts.length > 0 && (
              <div className="hidden md:flex w-64 lg:w-72 bg-white border-r border-slate-200/90 flex-col shrink-0 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-sans text-base font-extrabold text-[#081d34]">
                    You may also like
                  </h3>
                  <span className="text-[11px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                    {cartUpsellProducts.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {cartUpsellProducts.map((prod) => (
                    <div 
                      key={prod.id} 
                      className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex flex-col items-center text-center space-y-2.5 hover:shadow-md hover:border-purple-200 transition-all group"
                    >
                      <div 
                        onClick={() => {
                          setIsCartOpen(false);
                          openProductDetail(prod);
                        }}
                        className="w-24 h-24 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center p-1 cursor-pointer"
                      >
                        <img 
                          src={getSafeProductImage(prod.image || prod.coverImage)} 
                          alt={prod.title} 
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform" 
                          loading="lazy"
                        />
                      </div>
                      <div className="w-full">
                        <h4 
                          onClick={() => {
                            setIsCartOpen(false);
                            openProductDetail(prod);
                          }}
                          className="font-sans text-xs font-bold text-slate-900 line-clamp-2 min-h-[32px] leading-snug cursor-pointer hover:text-purple-600 transition-colors"
                          title={prod.title}
                        >
                          {prod.title}
                        </h4>
                        <div className="flex items-center justify-center gap-1.5 mt-1">
                          <span className="text-xs font-extrabold text-slate-900">
                            {formatPrice(prod.price)}
                          </span>
                          {prod.regularPrice && prod.regularPrice > prod.price && (
                            <span className="text-[10px] text-slate-400 line-through">
                              {formatPrice(prod.regularPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddToCart(prod, 1)}
                        className="w-full py-2 px-3 border border-[#7c3aed] hover:bg-purple-600 hover:text-white text-[#7c3aed] active:scale-95 text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        Add to cart
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Main "Your Cart" Panel */}
            <div className="w-screen max-w-full sm:max-w-md bg-white shadow-2xl flex flex-col">
              
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-sans text-xl font-bold text-[#081d34]">
                    Your cart
                  </h3>
                  {totalCartCount > 0 && (
                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-100 text-[#7c3aed]">
                      {totalCartCount} {totalCartCount === 1 ? 'item' : 'items'}
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)} 
                  className="w-8 h-8 rounded-full hover:bg-slate-200/70 text-slate-400 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
                  aria-label="Close cart"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Table Column Headers */}
              <div className="px-6 py-2.5 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <span>PRODUCT</span>
                <span>TOTAL</span>
              </div>

              {/* Cart Body */}
              <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                    <div className="font-sans text-lg font-bold text-slate-700">Your cart is empty</div>
                    <p className="text-xs text-slate-500">Discover our featured laundry products to get started.</p>
                    <button
                      type="button"
                      onClick={() => setIsCartOpen(false)}
                      className="mt-4 px-6 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-md shadow-purple-600/20"
                    >
                      Continue Shopping
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Cart Items List */}
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex gap-3 sm:gap-4 py-4 border-b border-slate-100 items-start">
                        {/* Product Image */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-50 border border-slate-200/80 shrink-0 p-1 flex items-center justify-center">
                          <img 
                            src={item.product.coverImage || item.product.image || DEFAULT_STORE_FALLBACK_IMAGE} 
                            alt={item.product.title} 
                            className="w-full h-full object-contain" 
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = DEFAULT_STORE_FALLBACK_IMAGE;
                            }}
                          />
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0 pr-1 sm:pr-2">
                          <h4 className="font-sans text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                            {item.product.title}
                          </h4>
                          {item.variant?.name && (
                            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                              {item.variant.name}
                            </div>
                          )}
                          <div className="text-xs font-bold text-slate-900 mt-1">
                            {formatPrice(item.product.price)}
                          </div>

                          {/* Quantity Pill + Purple Trash */}
                          <div className="flex items-center gap-3 mt-2.5">
                            <div className="inline-flex items-center border border-slate-200 rounded-lg bg-white shadow-2xs">
                              <button 
                                type="button"
                                onClick={() => {
                                  if (item.quantity > 1) {
                                    handleUpdateQuantity(item.product.id, item.quantity - 1);
                                  } else {
                                    handleRemoveFromCart(item.product.id);
                                  }
                                }}
                                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-7 text-center text-xs font-bold text-slate-900">
                                {item.quantity}
                              </span>
                              <button 
                                type="button"
                                onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Purple Trash Icon */}
                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(item.product.id)}
                              className="p-1.5 text-[#7c3aed] hover:text-purple-800 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                              title="Remove item"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Line Total */}
                        <div className="text-right shrink-0 font-sans text-xs sm:text-sm font-bold text-slate-900 pt-0.5">
                          {formatPrice(item.product.price * item.quantity)}
                        </div>
                      </div>
                    ))}

                    {/* Mobile "You May Also Like" Upsell Section (Real Store Products) */}
                    {cartUpsellProducts.length > 0 && (
                      <div className="md:hidden pt-4 border-t border-slate-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-800">
                            You may also like
                          </h4>
                          <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                            Recommendations
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {cartUpsellProducts.slice(0, 4).map((prod) => (
                            <div 
                              key={prod.id} 
                              className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2.5 flex flex-col items-center text-center space-y-1.5 hover:border-purple-200 transition-all"
                            >
                              <div 
                                onClick={() => {
                                  setIsCartOpen(false);
                                  openProductDetail(prod);
                                }}
                                className="w-16 h-16 rounded-lg overflow-hidden bg-white p-1 flex items-center justify-center cursor-pointer"
                              >
                                <img 
                                  src={getSafeProductImage(prod.image || prod.coverImage)} 
                                  alt={prod.title} 
                                  className="w-full h-full object-contain" 
                                  loading="lazy"
                                />
                              </div>
                              <h5 
                                onClick={() => {
                                  setIsCartOpen(false);
                                  openProductDetail(prod);
                                }}
                                className="text-[11px] font-bold text-slate-900 line-clamp-1 cursor-pointer hover:text-purple-600 transition-colors" 
                                title={prod.title}
                              >
                                {prod.title}
                              </h5>
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-extrabold text-slate-900">
                                  {formatPrice(prod.price)}
                                </span>
                                {prod.regularPrice && prod.regularPrice > prod.price && (
                                  <span className="text-[9px] text-slate-400 line-through">
                                    {formatPrice(prod.regularPrice)}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAddToCart(prod, 1)}
                                className="w-full py-1.5 border border-[#7c3aed] hover:bg-purple-600 hover:text-white text-[#7c3aed] text-[10px] font-bold rounded-lg transition active:scale-95"
                              >
                                Add to cart
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer & Checkout */}
              {cart.length > 0 && (
                <div className="p-5 sm:p-6 bg-white border-t border-slate-200 space-y-3.5 shadow-xl">
                  {/* Estimated total */}
                  <div className="flex items-center justify-between text-sm sm:text-base">
                    <div>
                      <span className="font-bold text-slate-900 block leading-tight">Estimated total</span>
                      <span className="text-[11px] text-slate-400">VAT & Taxes included</span>
                    </div>
                    <span className="font-extrabold text-[#7c3aed] font-sans text-lg sm:text-xl">
                      {formatPrice(cartSubtotal)}
                    </span>
                  </div>

                  {/* Check out CTA Button */}
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
                    className="group w-full py-3.5 px-5 bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:from-[#6d28d9] hover:to-[#5b21b6] active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-2xl transition-all shadow-lg shadow-purple-600/25 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Check out</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Trust Assurances */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-[10px] sm:text-[11px] text-slate-600 font-medium">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xs">🛡️</span>
                      <span>১০০% অরিজিনাল</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 border-x border-slate-200 px-1">
                      <span className="text-xs">🚚</span>
                      <span>ক্যাশ অন ডেলিভারি</span>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xs">⚡</span>
                      <span>দ্রুততম ডেলিভারি</span>
                    </div>
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
              Thank you for ordering with {displayStoreName}. Your order ID is <strong>{orderSuccess.id}</strong>.
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
                e.currentTarget.src = DEFAULT_STORE_FALLBACK_IMAGE;
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
          DIRECT CUSTOMER INQUIRY MODAL
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
                  Thank you for reaching out to <strong>{displayStoreName}</strong>. Our customer support team will review your inquiry and contact you within 24 hours.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  {(() => {
                    const rawWa = socialLinks?.whatsapp || liveHeaderSettings?.socialLinks?.whatsapp || displayPhone;
                    const cleanWa = rawWa ? rawWa.replace(/[^0-9]/g, '') : '';
                    if (!cleanWa) return null;
                    return (
                      <a
                        href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(`Hello ${displayStoreName}! I just submitted an inquiry.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white px-5 py-2.5 rounded-full font-semibold text-sm transition shadow-md"
                      >
                        <MessageCircle className="w-4 h-4 fill-current" />
                        <span>Follow Up on WhatsApp</span>
                      </a>
                    );
                  })()}
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
                    <span>{displayStoreName} Support</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {liveHeaderSettings.ctaButtonText || 'Direct Customer Inquiry'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600">
                    {displayTagline || 'Fill out the form below and our team will get back to you shortly.'}
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

      {/* ============================================================
          MOBILE STICKY BOTTOM NAVIGATION BAR (Thumb Zone UX)
          ============================================================ */}
      {activeNav !== 'checkout' && (
        <nav 
          aria-label="Mobile Navigation"
          className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 pb-[calc(env(safe-area-inset-bottom)+6px)] flex items-center justify-around select-none"
        >
          {/* Home Tab */}
          <button
            type="button"
            onClick={() => {
              if (activeNav === 'home') {
                scrollToTop();
              } else {
                navigateTo('home');
              }
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-colors cursor-pointer ${
              activeNav === 'home' ? 'text-[#0093d0]' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className={`p-1 rounded-full transition-transform active:scale-90 ${activeNav === 'home' ? 'bg-[#0093d0]/10' : ''}`}>
              <Sun className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold mt-0.5 tracking-tight">Home</span>
          </button>

          {/* Shop Tab */}
          <button
            type="button"
            onClick={() => navigateTo('shop')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-colors cursor-pointer ${
              activeNav === 'shop' ? 'text-[#0093d0]' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className={`p-1 rounded-full transition-transform active:scale-90 ${activeNav === 'shop' ? 'bg-[#0093d0]/10' : ''}`}>
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold mt-0.5 tracking-tight">Shop</span>
          </button>

          {/* Call / WhatsApp Hotline Tab */}
          <a
            href={`tel:${(displayPhone || '01635311494').replace(/\s+/g, '')}`}
            className="flex flex-col items-center justify-center flex-1 py-1 px-1 text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer"
          >
            <div className="p-1 rounded-full transition-transform active:scale-90 text-emerald-600">
              <Phone className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold mt-0.5 tracking-tight">Call</span>
          </a>

          {/* Customer Track Tab */}
          <button
            type="button"
            onClick={() => {
              if (onGoToLogin) {
                onGoToLogin();
              } else {
                navigate('/login');
              }
            }}
            className="flex flex-col items-center justify-center flex-1 py-1 px-1 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <div className="p-1 rounded-full transition-transform active:scale-90">
              <Truck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold mt-0.5 tracking-tight">Track</span>
          </button>

          {/* Cart Tab with Live Badge */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative flex flex-col items-center justify-center flex-1 py-1 px-1 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <div className="relative p-1 rounded-full transition-transform active:scale-90">
              <ShoppingBag className="w-5 h-5 text-slate-800" />
              {totalCartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-bounce">
                  {totalCartCount > 99 ? '99+' : totalCartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold text-slate-900 mt-0.5 tracking-tight">
              {totalCartCount > 0 ? formatPrice(cartSubtotal) : 'Bag'}
            </span>
          </button>
        </nav>
      )}

    </div>
  );
}
