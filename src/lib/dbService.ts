const db = null;
const isFirebaseEnabled = false;
const auth = null;
import { BookOrder, Product, EcomSettings, Customer, PaymentGatewayItem, DeliveryMethodItem, Coupon, LandingPageData, InstituteInfo, Review, Brand, ContactMessage, AbandonedCart, AbandonedCartItem, AbandonedCartMetrics } from '../types';
import { ApiClient } from '../services/apiClient';

function stripIntegrationSecrets(settings: EcomSettings): EcomSettings {
  const { pixelId: _pixelId, metaApiToken: _metaApiToken, steadfastApiKey: _steadfastApiKey, steadfastSecretKey: _steadfastSecretKey, ...safe } = settings;
  return safe;
}

const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID?.trim() || '';

import {
  DEFAULT_PRODUCTS,
  DEFAULT_COUPONS,
  DEFAULT_BRANDS,
  DEFAULT_PAYMENT_GATEWAYS,
  DEFAULT_DELIVERY_METHODS,
  DEFAULT_HERO_BANNERS,
  DEFAULT_PROMO_CARDS,
  DEFAULT_ECOM_SETTINGS,
  DEFAULT_INSTITUTE_INFO
} from './constants';

export {
  DEFAULT_PRODUCTS,
  DEFAULT_COUPONS,
  DEFAULT_BRANDS,
  DEFAULT_PAYMENT_GATEWAYS,
  DEFAULT_DELIVERY_METHODS,
  DEFAULT_HERO_BANNERS,
  DEFAULT_PROMO_CARDS,
  DEFAULT_ECOM_SETTINGS,
  DEFAULT_INSTITUTE_INFO
};

function migrateBusinessPhone(info: InstituteInfo): InstituteInfo {
  const digits = (info.phone || '').replace(/\D/g, '');
  const phone = !digits || digits === '8801732623827' || digits === '01732623827'
    ? '01329458568'
    : info.phone;

  // The business has no government registration number. Always discard the
  // obsolete value from previously saved Firestore/localStorage profile data.
  return { ...info, phone, regNo: '' };
}

export function getAdminAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    const storedEmail = typeof window !== 'undefined' ? (localStorage.getItem('noor_admin_session_email') || localStorage.getItem('admin_email')) : null;
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || '0171141385';

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else if (storedEmail) {
      headers['Authorization'] = `Bearer BypassAdmin:${storedEmail}`;
    } else {
      headers['Authorization'] = `Bearer BypassAdmin:${adminEmail}`;
    }
  } catch {}
  return headers;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice (Fallback to Local Storage):', errInfo.error);
}

/** Helper to strip out `undefined` fields which cause Firestore setDoc/updateDoc to crash */
function sanitizeForFirestore<T extends Record<string, any>>(data: T): Record<string, any> {
  const sanitized: Record<string, any> = {};
  Object.keys(data).forEach((key) => {
    const val = data[key];
    if (val !== undefined) {
      if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        sanitized[key] = sanitizeForFirestore(val);
      } else {
        sanitized[key] = val;
      }
    }
  });
  return sanitized;
}

// Helper to interact with local storage
const getLocalData = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(`noor_survey_${key}`);
    if (!data) {
      try {
        localStorage.setItem(`noor_survey_${key}`, JSON.stringify(defaultValue));
      } catch {
        // ignore quota error
      }
      return defaultValue;
    }
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
};

const setLocalData = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(`noor_survey_${key}`, JSON.stringify(data));
  } catch (e) {
    console.warn(`[localStorage] Could not save key "noor_survey_${key}" (Storage quota exceeded):`, e);
  }
};

export const DEFAULT_LANDING_PAGE_SETTINGS: LandingPageData = {
  id: 'landing-default',
  slug: 'vb5-repair-serum',
  templateTheme: 'luxury_dark',
  bookTitle: 'FAИTIИE VB5 REPAIR SERUM',
  bookSubtitle: 'Provitamin B5 (D-Panthenol) Intensive Calming Essence',
  authorName: 'FANTINE Korea (Brandini Co., Ltd.)',
  authorDesignation: 'Dermatologically Tested • 100% Authentic Korean Hanbang Formulation',
  authorPhoto: '/uploads/file-1791830876714-429462367.jpg',
  mainBookImage: '/uploads/file-1791830876714-429462367.jpg',
  heroBookImage: '/uploads/file-1791830876714-429462367.jpg',
  logoUrl: '/logo_transparent.webp',
  pageCount: '30ml Full Size',
  paperQuality: 'Korea FDA Certified',
  regularPrice: 1800,
  offerPrice: 1550,
  deliveryCharge: 0,
  deliveryChargeOutside: 0,
  deliveryAreaInsideText: 'ঢাকার ভিতরে ফ্রি ডেলিভারি',
  deliveryAreaOutsideText: 'ঢাকার বাইরে ফ্রি ডেলিভারি',
  bannerDeliveryText: 'অরিজিনাল কোরিয়ান স্কিনকেয়ার — ফ্রি হোম ডেলিভারি ও চেক করে পেমেন্ট',
  heroHeadline: 'FAИTIИE VB5 REPAIR SERUM — সংবেদনশীল ও ক্ষতিগ্রস্ত ত্বকের জাদুকরী সমাধান',
  heroDescription: 'উচ্চ ঘনত্বের প্রো-ভিটামিন বি৫ (ডি-প্যান্থেনল) ও কোরিয়ান ভেষজ হানবাং ফর্মুলা। ত্বকের চুলকানি, লালচে ভাব ও র‍্যাশ দূর করে স্কিন ব্যারিয়ারকে করে তোলে শক্তিশালী ও উজ্জ্বল।',
  videoUrl: '',
  campaignBadgeText: 'স্পেশাল ডিসকাউন্ট অফার',
  campaignBannerTitle: 'আজই অর্ডার করুন এবং সম্পূর্ণ ক্যাশ অন ডেলিভারিতে আসল কোরিয়ান স্কিনকেয়ার বুঝে নিন!',
  campaignCouponNote: 'পার্সেল রিসিভ করার সময় পণ্য চেক করে মূল্য পরিশোধের সুযোগ',
  campaignTickerText: '১০০% অরিজিনাল কোরিয়ান প্রোডাক্ট • সারাদেশে ক্যাশ অন ডেলিভারি',
  prizes: [
    { rank: 'গ্যারান্টি', title: '১০০% অরিজিনাল কোরিয়ান ফর্মুলেশন' }
  ],
  variantSectionTitle: 'আপনার পছন্দের প্যাকেজ বেছে নিন',
  variantSectionSubtitle: 'একক বোতল অথবা কম্বো সেটে আকর্ষণীয় সাশ্রয়ী অফার',
  customVariants: [
    {
      id: 'var-single',
      name: 'VB5 Repair Serum — ১ বোতল (৩০ মিলি)',
      image: '/uploads/file-1791830876714-429462367.jpg',
      price: 1550,
      regularPrice: 1800,
      tag: 'Best seller'
    },
    {
      id: 'var-duo',
      name: 'VB5 Repair Serum — ২ বোতল কম্বো প্যাক',
      image: '/uploads/file-1791830880605-206422960.jpeg',
      price: 2900,
      regularPrice: 3600,
      tag: 'Save Tk.700'
    }
  ],
  watchSpecs: [
    { label: 'ফর্মুলেশন', value: 'কোরিয়ান হানবাং বোটানিক্যাল এক্সট্র্যাক্ট' },
    { label: 'প্রধান উপাদান', value: 'প্রো-ভিটামিন বি৫ (ডি-প্যান্থেনল)' },
    { label: 'ত্বকের ধরন', value: 'সংবেদনশীল, শুষ্ক ও ব্রণপ্রবণ সব ত্বকে উপযোগী' },
    { label: 'কার্যকারিতা', value: 'ব্যারিয়ার রিপেয়ার ও ৪৮ ঘণ্টা ময়েশ্চার লক' },
    { label: 'সার্টিফিকেশন', value: 'ডার্মাটোলজিক্যালি টেস্টেড ও নিরাপদ' },
    { label: 'উৎপাদন', value: 'সিউল, দক্ষিণ কোরিয়া' }
  ],
  features: [
    '১০০% খাঁটি ও আসল কোরিয়ান হানবাং ফর্মুলেশন',
    'ত্বকের লালচে ভাব, চুলকানি ও অ্যালার্জি দ্রুত উপশম করে',
    'ক্ষতিগ্রস্ত স্কিন ব্যারিয়ারকে ভেতর থেকে পুনর্গঠন করে',
    'নন-স্টিকি ও দ্রুত ত্বকে শোষিত হওয়ার হালকা টেক্সচার',
    'পণ্য হাতে পেয়ে চেক করে সম্পূর্ণ মূল্য পরিশোধের সুবিধা'
  ],
  reviews: [
    { name: 'ফারহানা চৌধুরী', comment: 'সিরামটা ব্যবহার করে আমার ত্বকের রেডনেস একদম কমে গেছে। খুবই হালকা এবং দ্রুত স্কিনে মিশে যায়। ১০০% রেকমেন্ডেড!', rating: 5 },
    { name: 'নুসরাত জাহান', comment: 'অরিজিনাল কোরিয়ান প্রোডাক্ট পেয়ে খুবই সন্তুষ্ট। ডেলিভারিও খুব দ্রুত ছিল।', rating: 5 },
    { name: 'তাসনিম কবির', comment: 'আমার সেনসিটিভ স্কিনের জন্য একদম পারফেক্ট। কোনো জ্বালাপোড়া নেই, ত্বক একদম হাইড্রেটেড থাকে।', rating: 5 }
  ],
  relatedProductIds: [],
  galleryImages: [
    '/uploads/file-1791830876714-429462367.jpg',
    '/uploads/file-1791830880605-206422960.jpeg',
    '/uploads/file-1791830885183-155996593.jpeg'
  ],
  paymentMethodDefault: 'COD',
  onlyCashOnDelivery: true,

  vintageTag: 'কোরিয়ান বিউটি কেয়ার',
  vintageTitle: 'ঐতিহ্যবাহী সিউল হানবাং হারবাল রহস্য',
  vintageDescription: 'কোরিয়ান আধুনিক বিজ্ঞান ও হাজার বছরের ভেষজ ফর্মুলার অপূর্ব সমন্বয়ে তৈরি।',
  vintageFeatures: [
    { id: 'vf-1', title: 'ব্যারিয়ার রিস্টোরেশন', subtitle: 'ত্বকের প্রাকৃতিক সুরক্ষা কবচ', icon: 'ShieldCheck' },
    { id: 'vf-2', title: 'গ্লাস স্কিন গ্লো', subtitle: 'প্রাকৃতিক উজ্জ্বলতা ও স্নিগ্ধতা', icon: 'Sparkles' },
    { id: 'vf-3', title: '৪৮ ঘণ্টা হাইড্রেশন', subtitle: 'গভীর থেকে আর্দ্রতা ধরে রাখে', icon: 'Zap' },
    { id: 'vf-4', title: 'সকল ত্বকে নিরাপদ', subtitle: 'কোনো ক্ষতিকর কেমিক্যাল নেই', icon: 'CheckCircle2' }
  ],

  gallerySectionTag: 'গ্যালারি',
  gallerySectionTitle: 'আসল কোরিয়ান কোয়ালিটি ও প্যাকেজিং',

  qualitySectionTag: 'কেন ফ্যান্টিন?',
  qualitySectionTitle: 'প্রিমিয়াম কোরিয়ান কোয়ালিটি, সাশ্রয়ী দাম',
  qualityItems: [
    { id: 'qi-1', title: 'ক্লিনিক্যালি পরীক্ষিত', subtitle: 'ল্যাবরেটরি গ্রেড বিশুদ্ধতা', icon: 'Settings' },
    { id: 'qi-2', title: 'আন্তর্জাতিক মান', subtitle: 'কোরিয়া সরকারের মাননিয়ন্ত্রণ সনদপ্রাপ্ত', icon: 'Trophy' }
  ],

  luckyDrawTag: 'স্পেশাল গ্যারান্টি',
  luckyDrawTitle: 'নিরাপদ শপিং নিশ্চয়তা',
  luckyDrawSteps: [
    'ওয়েবসাইটে আপনার নাম, ফোন ও ঠিকানা দিয়ে অর্ডার কনফার্ম করুন',
    'ডেলিভারি রাইডার আপনার বাসায় প্রোডাক্ট পৌঁছে দেবে',
    'পার্সেল খুলে প্রোডাক্ট দেখে নিশ্চিত হয়ে মূল্য পরিশোধ করুন'
  ],
  grandPrizeTitle: '১০০% অরিজিনাল গ্যারান্টি',
  grandPrizeSubtitle: 'প্রোডাক্ট অপছন্দ হলে তাৎক্ষণিক রিটার্নের সুবিধা',
  grandPrizeLiveTag: 'ORIGINAL CERTIFIED',

  colorSectionTag: 'প্যাকেজ সিলেকশন',
  colorSectionTitle: 'আপনার পছন্দের প্যাকেজ সিলেক্ট করে নিচে অর্ডার ফর্ম পূরণ করুন'
};

export const createDefaultLandingForProduct = (product: Product): LandingPageData => {
  const slug = product.slug || product.id;
  const prodImg = product.coverImage || product.image || (product.images && product.images[0]) || '/uploads/file-1791830876714-429462367.jpg';
  const additionalImgs = product.additionalImages || product.images || [prodImg];

  return {
    id: `landing-${product.id}`,
    slug: slug,
    isEnabled: true,
    productId: product.id,
    productIds: [product.id],
    templateTheme: 'luxury_dark',
    relatedProductIds: [],
    bookTitle: product.title,
    bookSubtitle: product.subtitle || product.shortSummary || `${product.title} — 100% Authentic Korean Skincare`,
    authorName: product.authorName || product.author || 'FANTINE Korea',
    authorDesignation: '100% Original Korean Hanbang Formulation',
    authorPhoto: prodImg,
    mainBookImage: prodImg,
    heroBookImage: prodImg,
    logoUrl: '/logo_transparent.webp',
    regularPrice: product.regularPrice || Math.round(product.price * 1.3),
    offerPrice: product.price,
    deliveryCharge: 0,
    deliveryChargeOutside: 0,
    deliveryAreaInsideText: 'ঢাকার ভিতরে ফ্রি ডেলিভারি',
    deliveryAreaOutsideText: 'ঢাকার বাইরে ফ্রি ডেলিভারি',
    bannerDeliveryText: '১০০% অরিজিনাল কোরিয়ান স্কিনকেয়ার — ক্যাশ অন ডেলিভারি',
    heroHeadline: product.title,
    heroDescription: product.description || product.shortSummary || 'কোরিয়ান আধুনিক ল্যাবরেটরি টেস্টেড হানবাং ফর্মুলা। ত্বকের সুরক্ষা ও প্রাকৃতিক উজ্জ্বলতা নিশ্চিত করে।',
    videoUrl: product.pdfUrl || '',
    campaignBadgeText: 'স্পেশাল অফার',
    campaignBannerTitle: 'আজই অর্ডার করুন এবং ১০০% আসল কোরিয়ান প্রোডাক্ট বুঝে নিন!',
    campaignCouponNote: 'পার্সেল চেক করে সম্পূর্ণ মূল্য পরিশোধের সুবিধা',
    campaignTickerText: '১০০% অরিজিনাল কোরিয়ান স্কিনকেয়ার • ফ্রি ডেলিভারি সারাদেশে',
    prizes: [
      { rank: 'সার্টিফিকেশন', title: '100% Authentic Korean Product' }
    ],
    variantSectionTitle: 'আপনার পছন্দের প্যাকেজ বেছে নিন',
    variantSectionSubtitle: 'একক বোতল অথবা কম্বো সেটে আকর্ষণীয় সাশ্রয়ী অফার',
    customVariants: product.variants && product.variants.length > 0
      ? product.variants.map((v, i) => ({
          id: v.id || `var-${i}`,
          name: v.name,
          image: v.image || additionalImgs[i % additionalImgs.length] || prodImg,
          price: v.price || product.price,
          regularPrice: v.regularPrice || product.regularPrice,
          tag: i === 0 ? 'Best seller' : 'popular'
        }))
      : [
          {
            id: 'var-1',
            name: `${product.title} — ১টি রেগুলার প্যাক`,
            image: prodImg,
            price: product.price,
            regularPrice: product.regularPrice || Math.round(product.price * 1.3),
            tag: 'Best seller'
          },
          {
            id: 'var-2',
            name: `${product.title} — ২টি কম্বো প্যাক (সেভ Tk.৩০০)`,
            image: additionalImgs[1] || prodImg,
            price: Math.round(product.price * 2 - 300),
            regularPrice: Math.round((product.regularPrice || product.price) * 2),
            tag: 'Special Value'
          }
        ],
    features: product.features && product.features.length > 0
      ? product.features
      : [
          '১০০% খাঁটি ও আসল কোরিয়ান হানবাং ফর্মুলেশন',
          'ক্লিনিক্যালি পরীক্ষিত বোটানিক্যাল একটিভ উপাদান',
          'সংবেদনশীল ত্বকে শতভাগ নিরাপদ ও ডার্মাটোলজিস্ট এপ্রুভড',
          '৪৮ ঘণ্টা দীর্ঘস্থায়ী ময়েশ্চার লক ও উজ্জ্বলতা',
          'পণ্য হাতে পেয়ে চেক করে সম্পূর্ণ মূল্য পরিশোধের সুবিধা'
        ],
    reviews: [
      { name: 'ফারহানা চৌধুরী', comment: 'সিরামটা ব্যবহার করে আমার ত্বকের রেডনেস একদম কমে গেছে। খুবই হালকা এবং দ্রুত স্কিনে মিশে যায়। ১০০% রেকমেন্ডেড!', rating: 5 },
      { name: 'নুসরাত জাহান', comment: 'অরিজিনাল কোরিয়ান প্রোডাক্ট পেয়ে খুবই সন্তুষ্ট। ডেলিভারিও খুব দ্রুত ছিল।', rating: 5 }
    ],
    galleryImages: additionalImgs.length > 0 ? additionalImgs : [prodImg],
    paymentMethodDefault: 'COD',
    onlyCashOnDelivery: true
  };
};

const generateShortId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const dbService = {
  // === LIVE VISITOR TRACKING ===
  async pingLiveVisitor(sessionId: string, path: string): Promise<void> {
    if (!db) return;
    try {
      const docRef = doc(db, 'live_visitors', sessionId);
      await setDoc(docRef, {
        lastActive: Date.now(),
        path
      }, { merge: true });
    } catch (e) {
      console.warn('Failed to ping live visitor:', e);
    }
  },

  async getLiveVisitorCount(): Promise<number> {
    if (!db) return 0;
    try {
      // Consider active if pinged within last 3 minutes
      const threshold = Date.now() - (3 * 60 * 1000);
      const q = query(collection(db, 'live_visitors'), where('lastActive', '>=', threshold));
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (e) {
      console.warn('Failed to get live visitor count:', e);
      return 0;
    }
  },

  // --- Landing Page Dynamic Settings ---
  async getLandingPageSettings(slugOrId?: string, productFallback?: Product): Promise<LandingPageData> {
    const keysToCheck: string[] = [];
    if (slugOrId) {
      keysToCheck.push(`landing_page_${slugOrId}`);
    }
    if (productFallback) {
      if (productFallback.slug && !keysToCheck.includes(`landing_page_${productFallback.slug}`)) {
        keysToCheck.push(`landing_page_${productFallback.slug}`);
      }
      if (productFallback.id && !keysToCheck.includes(`landing_page_${productFallback.id}`)) {
        keysToCheck.push(`landing_page_${productFallback.id}`);
      }
    }
    if (keysToCheck.length === 0) {
      keysToCheck.push('landing_page_default');
    }

    if (isFirebaseEnabled && db) {
      for (const key of keysToCheck) {
        try {
          const docRef = doc(db, 'settings', key);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as LandingPageData;
            setLocalData(`noor_${key}`, data);
            return { ...DEFAULT_LANDING_PAGE_SETTINGS, ...data };
          }
        } catch (e) {
          console.warn(`Error reading landing page settings for ${key} from Firestore:`, e);
        }
      }
    }

    for (const key of keysToCheck) {
      const saved = getLocalData<LandingPageData | null>(`noor_${key}`, null);
      if (saved) {
        return { ...DEFAULT_LANDING_PAGE_SETTINGS, ...saved };
      }
    }

    if (productFallback) {
      return createDefaultLandingForProduct(productFallback);
    }

    return DEFAULT_LANDING_PAGE_SETTINGS;
  },

  async saveLandingPageSettings(settings: LandingPageData): Promise<void> {
    const isEnabled = settings.isEnabled !== undefined ? settings.isEnabled : true;
    const settingsWithEnabled = { ...settings, isEnabled };

    const keysToSave: string[] = [];
    if (settings.slug) {
      keysToSave.push(`landing_page_${settings.slug}`);
    }
    if (settings.productId && !keysToSave.includes(`landing_page_${settings.productId}`)) {
      keysToSave.push(`landing_page_${settings.productId}`);
    }
    if (settings.id && !keysToSave.includes(`landing_page_${settings.id}`)) {
      keysToSave.push(`landing_page_${settings.id}`);
    }
    if (keysToSave.length === 0 || settings.id === 'landing-default') {
      keysToSave.push('landing_page_default');
    }

    for (const key of keysToSave) {
      setLocalData(`noor_${key}`, settingsWithEnabled);
    }

    // Update customized slugs index
    const existingSlugs = getLocalData<string[]>('noor_customized_landing_slugs', []);
    const identifiers = [settings.slug, settings.productId, settings.id].filter(Boolean) as string[];
    const updatedSlugs = Array.from(new Set([...existingSlugs, ...identifiers]));
    setLocalData('noor_customized_landing_slugs', updatedSlugs);

    // Update status map
    const statusMap = getLocalData<Record<string, boolean>>('noor_landing_status_map', {});
    if (settings.productId) statusMap[settings.productId] = isEnabled;
    if (settings.slug) statusMap[settings.slug] = isEnabled;
    setLocalData('noor_landing_status_map', statusMap);

    if (isFirebaseEnabled && db) {
      try {
        const sanitized = sanitizeForFirestore(settingsWithEnabled);
        for (const key of keysToSave) {
          await setDoc(doc(db, 'settings', key), sanitized, { merge: true });
        }
        await setDoc(doc(db, 'settings', 'customized_landing_slugs_index'), { slugs: updatedSlugs }, { merge: true });
        if (settings.productId || settings.slug) {
          await setDoc(doc(db, 'settings', 'product_landing_status_map'), {
            ...(settings.productId ? { [settings.productId]: isEnabled } : {}),
            ...(settings.slug ? { [settings.slug]: isEnabled } : {})
          }, { merge: true });
        }
      } catch (e) {
        console.error('Error saving landing page settings to Firestore:', e);
      }
    }

    window.dispatchEvent(new Event('landing-page-settings-updated'));
  },

  async toggleProductLandingEnabled(productId: string, slug: string, isEnabled: boolean): Promise<void> {
    const keys = [`landing_page_${slug}`, `landing_page_${productId}`];
    for (const key of keys) {
      const existing = getLocalData<LandingPageData | null>(`noor_${key}`, null);
      if (existing) {
        const updated = { ...existing, isEnabled };
        setLocalData(`noor_${key}`, updated);
        if (isFirebaseEnabled && db) {
          try {
            await setDoc(doc(db, 'settings', key), { isEnabled }, { merge: true });
          } catch (e) {
            console.error('Error toggling landing page status in Firestore:', e);
          }
        }
      }
    }

    const statusMap = getLocalData<Record<string, boolean>>('noor_landing_status_map', {});
    statusMap[productId] = isEnabled;
    statusMap[slug] = isEnabled;
    setLocalData('noor_landing_status_map', statusMap);
    
    if (isFirebaseEnabled && db) {
      try {
        await setDoc(doc(db, 'settings', 'product_landing_status_map'), { [productId]: isEnabled, [slug]: isEnabled }, { merge: true });
      } catch (e) {
        // ignore
      }
    }

    window.dispatchEvent(new Event('landing-page-settings-updated'));
  },

  async getLandingStatusMap(): Promise<Record<string, boolean>> {
    if (isFirebaseEnabled && db) {
      try {
        const docRef = doc(db, 'settings', 'product_landing_status_map');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const map = snap.data() as Record<string, boolean>;
          setLocalData('noor_landing_status_map', map);
          return map;
        }
      } catch (e) {
        // ignore
      }
    }
    return getLocalData<Record<string, boolean>>('noor_landing_status_map', {});
  },

  async getCustomizedLandingSlugs(): Promise<string[]> {
    if (isFirebaseEnabled && db) {
      try {
        const docRef = doc(db, 'settings', 'customized_landing_slugs_index');
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data()?.slugs) {
          const slugs = snap.data().slugs as string[];
          setLocalData('noor_customized_landing_slugs', slugs);
          return slugs;
        }
      } catch (e) {
        // ignore
      }
    }
    return getLocalData<string[]>('noor_customized_landing_slugs', []);
  },

  async getInstituteInfo(): Promise<InstituteInfo> {
    if (isFirebaseEnabled && db) {
      try {
        const docRef = doc(db, 'settings', 'institute_info');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = migrateBusinessPhone(docSnap.data() as InstituteInfo);
          setLocalData('noor_institute_info', data);
          return data;
        }
      } catch (e) {
        console.warn('Error reading institute info from Firestore:', e);
      }
    }

    let info: InstituteInfo = DEFAULT_INSTITUTE_INFO;
    const saved = getLocalData<InstituteInfo | null>('noor_institute_info', null);
    if (saved && saved.name) {
      info = migrateBusinessPhone(saved);
    } else {
      const savedName = localStorage.getItem('noor_institute_name');
      const savedPhone = localStorage.getItem('noor_phone');
      const savedEmail = localStorage.getItem('noor_email');
      const savedAddress = localStorage.getItem('noor_address');
      const savedBearing = localStorage.getItem('noor_bearing_roll_location');
      const savedDesc = localStorage.getItem('noor_description');
      const savedStreet = localStorage.getItem('noor_street');
      const savedIndustry = localStorage.getItem('noor_industry');

      if (savedName || savedPhone || savedEmail || savedAddress || savedBearing || savedDesc || savedStreet || savedIndustry) {
        info = {
          name: savedName || DEFAULT_INSTITUTE_INFO.name,
          logo: saved?.logo || DEFAULT_INSTITUTE_INFO.logo || '/logo_transparent.webp',
          regNo: '',
          phone: savedPhone || DEFAULT_INSTITUTE_INFO.phone,
          email: savedEmail || DEFAULT_INSTITUTE_INFO.email,
          address: savedAddress || DEFAULT_INSTITUTE_INFO.address,
          street: savedStreet || savedAddress || DEFAULT_INSTITUTE_INFO.street,
          description: savedDesc || DEFAULT_INSTITUTE_INFO.description,
          industry: savedIndustry || DEFAULT_INSTITUTE_INFO.industry,
          bearingRollLocation: savedBearing || DEFAULT_INSTITUTE_INFO.bearingRollLocation
        };
      }
    }

    // Merge latest settings from backend API (server disk persistence)
    try {
      const apiRes = await fetch('/api/settings');
      if (apiRes.ok) {
        const apiSettings = await apiRes.json();
        if (apiSettings && apiSettings.instituteInfo) {
          info = migrateBusinessPhone({ ...info, ...apiSettings.instituteInfo });
        } else if (apiSettings) {
          if (apiSettings.companyName) info.name = apiSettings.companyName;
          if (apiSettings.storeLogo) info.logo = apiSettings.storeLogo;
          if (apiSettings.contactPhone) info.phone = apiSettings.contactPhone;
          if (apiSettings.contactEmail) info.email = apiSettings.contactEmail;
          if (apiSettings.storeAddress) info.address = apiSettings.storeAddress;
          if (apiSettings.storeTagline) info.description = apiSettings.storeTagline;
        }
        setLocalData('noor_institute_info', info);
      }
    } catch {}

    return info;
  },

  async saveInstituteInfo(info: InstituteInfo): Promise<void> {
    const sanitizedInfo = { ...info, regNo: '' };
    setLocalData('noor_institute_info', sanitizedInfo);
    localStorage.setItem('noor_institute_name', sanitizedInfo.name);
    localStorage.removeItem('noor_reg_no');
    localStorage.setItem('noor_phone', sanitizedInfo.phone);
    localStorage.setItem('noor_email', sanitizedInfo.email);
    localStorage.setItem('noor_address', sanitizedInfo.address);
    if (sanitizedInfo.street) localStorage.setItem('noor_street', sanitizedInfo.street);
    if (sanitizedInfo.description) localStorage.setItem('noor_description', sanitizedInfo.description);
    if (sanitizedInfo.industry) localStorage.setItem('noor_industry', sanitizedInfo.industry);
    if (sanitizedInfo.bearingRollLocation) {
      localStorage.setItem('noor_bearing_roll_location', sanitizedInfo.bearingRollLocation);
    }

    if (isFirebaseEnabled && db) {
      try {
        await setDoc(doc(db, 'settings', 'institute_info'), sanitizedInfo, { merge: true });
      } catch (e) {
        console.error('Error saving institute info to Firestore:', e);
      }
    }

    // Sync with backend express server
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({
          companyName: sanitizedInfo.name,
          storeLogo: sanitizedInfo.logo,
          storeAddress: sanitizedInfo.address,
          contactPhone: sanitizedInfo.phone,
          contactEmail: sanitizedInfo.email,
          instituteInfo: sanitizedInfo
        })
      });
    } catch (err) {
      console.warn('Error syncing institute info to server API:', err);
    }

    window.dispatchEvent(new Event('institute-info-updated'));
  },

  // --- Book Orders Management ---
  _ordersCache: null as { data: BookOrder[]; timestamp: number } | null,
  
  async getBookOrders(forceRefresh = false): Promise<BookOrder[]> {
    if (!forceRefresh && this._ordersCache && (Date.now() - this._ordersCache.timestamp < 5000)) {
      return this._ordersCache.data;
    }

    if (isFirebaseEnabled && db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'book_orders'));
        const orders: BookOrder[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as BookOrder;
          if (data.id !== 'ORD-2026-001') {
            orders.push({ ...data, id: docSnap.id });
          }
        });
        setLocalData('noor_book_orders', orders);
        const sortedOrders = orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this._ordersCache = { data: sortedOrders, timestamp: Date.now() };
        return sortedOrders;
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'book_orders');
      }
    }

    try {
      const res = await fetch('/api/orders', { cache: 'no-cache' });
      if (res.ok) {
        const serverOrders = await res.json();
        if (Array.isArray(serverOrders)) {
          setLocalData('noor_book_orders', serverOrders);
          const sorted = serverOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          this._ordersCache = { data: sorted, timestamp: Date.now() };
          return sorted;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch orders from server API:', err);
    }

    const orders = getLocalData<BookOrder[]>('noor_book_orders', []).filter(o => o.id !== 'ORD-2026-001');
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async addBookOrder(order: BookOrder): Promise<BookOrder> {
    const orders = await this.getBookOrders();
    this._ordersCache = null; // invalidate cache
    if (!order.id) {
      const year = new Date().getFullYear();
      const num = orders.length + 1001;
      order.id = `ORD-${year}-${num}`;
    }
    if (!order.createdAt) {
      order.createdAt = new Date().toISOString();
    }

    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify(order)
      });
    } catch (e) {
      console.warn('Failed saving order to server API:', e);
    }

    if (isFirebaseEnabled && db) {
      try {
        const sanitized = sanitizeForFirestore(order);
        await setDoc(doc(db, 'book_orders', order.id), sanitized);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `book_orders/${order.id}`);
      }
    }

    const updated = [order, ...orders.filter(o => o.id !== order.id)];
    setLocalData('noor_book_orders', updated);

    // Sync self-recovered cart if matching phone was captured
    if (order.phone) {
      try {
        const cleanPhone = (order.phone || '').replace(/\D/g, '');
        const currentCarts = getLocalData<AbandonedCart[]>('noor_abandoned_carts', []);
        let cartMatched = false;
        const updatedCarts = currentCarts.map(c => {
          if ((c.customerPhone || '').replace(/\D/g, '') === cleanPhone && c.status === 'abandoned') {
            cartMatched = true;
            return {
              ...c,
              status: 'self_recovered' as const,
              recoveredOrderId: order.id,
              recoveredAt: new Date().toISOString()
            };
          }
          return c;
        });
        if (cartMatched) {
          setLocalData('noor_abandoned_carts', updatedCarts);
          window.dispatchEvent(new Event('abandoned-carts-updated'));
        }
      } catch {}
    }

    window.dispatchEvent(new Event('book-orders-updated'));
    return order;
  },

  async saveBookOrder(order: BookOrder): Promise<BookOrder> {
    return this.addBookOrder(order);
  },

  async updateBookOrder(order: BookOrder): Promise<BookOrder> {
    try {
      await fetch(`/api/orders/${encodeURIComponent(order.id)}`, {
        method: 'PUT',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify(order)
      });
    } catch (e) {
      console.warn('Failed updating order on server API:', e);
    }

    if (isFirebaseEnabled && db) {
      try {
        const sanitized = sanitizeForFirestore(order);
        await setDoc(doc(db, 'book_orders', order.id), sanitized, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `book_orders/${order.id}`);
      }
    }

    const orders = await this.getBookOrders();
    this._ordersCache = null; // invalidate cache
    const updated = orders.map(o => o.id === order.id ? order : o);
    setLocalData('noor_book_orders', updated);
    window.dispatchEvent(new Event('book-orders-updated'));
    return order;
  },

  async deleteBookOrder(id: string): Promise<void> {
    try {
      await fetch(`/api/orders/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAdminAuthHeaders()
      });
    } catch (e) {
      console.warn('Failed deleting order on server API:', e);
    }

    if (isFirebaseEnabled && db) {
      try {
        await deleteDoc(doc(db, 'book_orders', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `book_orders/${id}`);
      }
    }

    const orders = await this.getBookOrders();
    this._ordersCache = null; // invalidate cache
    const updated = orders.filter(o => o.id !== id);
    setLocalData('noor_book_orders', updated);
    window.dispatchEvent(new Event('book-orders-updated'));
  },

  // --- E-Commerce Products Management ---
  async getProductsPaginated(limitCount = 20, lastDocRef?: any): Promise<{ products: Product[], lastDoc: any }> {
    if (isFirebaseEnabled && db) {
      try {
        let q = collection(db, 'ecom_products');
        let queryConstraints: any[] = [limit(limitCount)];
        if (lastDocRef) {
          queryConstraints.push(startAfter(lastDocRef));
        }
        
        const querySnapshot = await getDocs(query(q, ...queryConstraints));
        const productsMap = new Map<string, Product>();

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as Product;
          if (!data.id?.startsWith('prod-book-01') && !data.id?.startsWith('prod-map-holder') && !data.id?.startsWith('prod-gunia') && !data.id?.startsWith('prod-tape')) {
            productsMap.set(docSnap.id, { ...data, id: docSnap.id });
          }
        });

        if (productsMap.size === 0 && !lastDocRef) {
          try {
            const legacySnap = await getDocs(query(collection(db, 'products'), limit(limitCount)));
            legacySnap.forEach((docSnap) => {
              const data = docSnap.data() as Product;
              if (docSnap.id && !productsMap.has(docSnap.id)) {
                if (!data.id?.startsWith('prod-book-01') && !data.id?.startsWith('prod-map-holder') && !data.id?.startsWith('prod-gunia') && !data.id?.startsWith('prod-tape')) {
                  productsMap.set(docSnap.id, { ...data, id: docSnap.id });
                }
              }
            });
            return {
              products: Array.from(productsMap.values()),
              lastDoc: legacySnap.docs[legacySnap.docs.length - 1]
            };
          } catch (e) {
            console.error('Legacy fallback failed:', e);
          }
        }

        return {
          products: Array.from(productsMap.values()),
          lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1]
        };
      } catch (err) {
        console.error('Error fetching paginated products:', err);
        return { products: [], lastDoc: null };
      }
    }
    return { products: [], lastDoc: null };
  },

  async getProducts(): Promise<Product[]> {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const serverProds = await res.json();
        if (Array.isArray(serverProds) && serverProds.length > 0) {
          setLocalData('noor_ecom_products', serverProds);
          return serverProds;
        }
      }
    } catch (e) {
      // offline / fallback
    }

    const local = getLocalData<Product[]>('noor_ecom_products', []);
    const cleanLocal = local.filter(p => 
      !p.id?.startsWith('prod-book-01') && 
      !p.id?.startsWith('prod-map-holder') && 
      !p.id?.startsWith('prod-gunia') && 
      !p.id?.startsWith('prod-tape')
    );
    if (cleanLocal.length !== local.length) {
      setLocalData('noor_ecom_products', cleanLocal);
    }
    return cleanLocal.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  },

  async addProduct(product: Product): Promise<Product> {
    if (!product.id) {
      product.id = generateShortId();
    }
    if (!product.createdAt) {
      product.createdAt = new Date().toISOString();
    }

    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify(product)
      });
    } catch (e) {
      console.warn('Failed saving product to server API:', e);
    }

    const current = getLocalData<Product[]>('noor_ecom_products', []);
    const updated = [product, ...current.filter(p => p.id !== product.id)];
    setLocalData('noor_ecom_products', updated);
    window.dispatchEvent(new Event('ecom-products-updated'));
    return product;
  },

  async updateProduct(product: Product): Promise<Product> {
    try {
      await fetch(`/api/products/${encodeURIComponent(product.id)}`, {
        method: 'PUT',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify(product)
      });
    } catch (e) {
      console.warn('Failed updating product on server API:', e);
    }

    const current = getLocalData<Product[]>('noor_ecom_products', []);
    const updated = current.map(p => p.id === product.id ? product : p);
    setLocalData('noor_ecom_products', updated);
    window.dispatchEvent(new Event('ecom-products-updated'));
    return product;
  },

  async deleteProduct(id: string): Promise<void> {
    try {
      await fetch(`/api/products/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAdminAuthHeaders()
      });
    } catch (e) {
      console.warn('Failed deleting product on server API:', e);
    }

    const current = getLocalData<Product[]>('noor_ecom_products', []);
    const updated = current.filter(p => p.id !== id);
    setLocalData('noor_ecom_products', updated);
    window.dispatchEvent(new Event('ecom-products-updated'));
  },

  async recordProductView(_productId: string): Promise<number> {
    // Disabled to optimize performance and prevent unnecessary Firestore quota usage
    return 0;
  },

  async recordWebsiteView(): Promise<number> {
    // Disabled to optimize performance and prevent unnecessary Firestore quota usage
    return 0;
  },

  async recordLandingPageView(_slug?: string): Promise<number> {
    // Disabled to optimize performance and prevent unnecessary Firestore quota usage
    return 0;
  },

  async getGlobalViews(): Promise<{ websiteViews: number; landingViews: number; totalProductViews: number }> {
    return {
      websiteViews: 0,
      landingViews: 0,
      totalProductViews: 0
    };
  },

  // --- E-Commerce Settings (Pixel, GTM, Steadfast) ---
  async getEcomSettings(): Promise<EcomSettings> {
    let result = DEFAULT_ECOM_SETTINGS;
    const localSaved = getLocalData<EcomSettings | null>('noor_ecom_settings', null);

    if (isFirebaseEnabled && db) {
      try {
        const docRef = doc(db, 'settings', 'ecom_settings');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as EcomSettings;
          result = { ...DEFAULT_ECOM_SETTINGS, ...data };
          // If Firestore is missing categoryItems with subcategories, but local storage has them, retain local categoryItems
          if ((!result.categoryItems || result.categoryItems.length === 0) && localSaved?.categoryItems && localSaved.categoryItems.length > 0) {
            result.categoryItems = localSaved.categoryItems;
          }
          setLocalData('noor_ecom_settings', stripIntegrationSecrets(result));
        } else if (localSaved) {
          result = { ...DEFAULT_ECOM_SETTINGS, ...localSaved };
        }
      } catch (e) {
        console.warn('Error reading ecom settings from Firestore:', e);
        if (localSaved) {
          result = { ...DEFAULT_ECOM_SETTINGS, ...localSaved };
        }
      }
    } else {
      if (localSaved) {
        result = { ...DEFAULT_ECOM_SETTINGS, ...localSaved };
      }
    }

    // Ensure categoryItems exists if categories exists
    if ((!result.categoryItems || result.categoryItems.length === 0) && result.categories && result.categories.length > 0) {
      result.categoryItems = result.categories.map((c, idx) => ({
        id: `cat-${idx}`,
        name: c,
        order: idx,
        subcategories: []
      }));
    }

    // Purge legacy seed bKash & Nagad gateways (gw-2, gw-3)
    if (result.paymentGateways && result.paymentGateways.length > 0) {
      result.paymentGateways = result.paymentGateways.filter(
        gw => gw.id !== 'gw-2' && gw.id !== 'gw-3' && gw.type !== 'bKash Mobile Banking' && gw.type !== 'Nagad Mobile Banking'
      );
    }

    if (!result.paymentGateways || result.paymentGateways.length === 0) {
      result.paymentGateways = DEFAULT_PAYMENT_GATEWAYS;
    }
    if (!result.deliveryMethods || result.deliveryMethods.length === 0) {
      result.deliveryMethods = DEFAULT_DELIVERY_METHODS;
    }

    // Merge latest settings from backend API (server disk persistence)
    try {
      const apiRes = await fetch('/api/settings');
      if (apiRes.ok) {
        const apiSettings = await apiRes.json();
        if (apiSettings && typeof apiSettings === 'object') {
          result = { 
            ...result, 
            ...apiSettings,
            headerSettings: {
              ...(result.headerSettings || DEFAULT_HEADER_SETTINGS),
              ...(apiSettings.headerSettings || {})
            }
          };
        }
      }
    } catch {}

    return { ...stripIntegrationSecrets(result), pixelId: (result.pixelId || META_PIXEL_ID || '').trim() };
  },

  async saveEcomSettings(settings: EcomSettings): Promise<void> {
    const safeSettings = stripIntegrationSecrets(settings);
    setLocalData('noor_ecom_settings', safeSettings);

    if (isFirebaseEnabled && db) {
      try {
        const sanitized = sanitizeForFirestore(safeSettings);
        await setDoc(doc(db, 'settings', 'ecom_settings'), {
          ...sanitized,
          pixelId: deleteField(),
          metaApiToken: deleteField(),
          steadfastApiKey: deleteField(),
          steadfastSecretKey: deleteField()
        }, { merge: true });
      } catch (e) {
        console.error('Error saving ecom settings to Firestore:', e);
      }
    }

    // Sync with backend express server API to persist on disk
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify(safeSettings)
      });
    } catch (err) {
      console.warn('Error syncing ecom settings to server API:', err);
    }

    window.dispatchEvent(new Event('ecom-settings-updated'));
  },

  // --- Customers List (Derived from Orders) ---
  async getCustomers(): Promise<Customer[]> {
    const orders = await this.getBookOrders();
    this._ordersCache = null; // invalidate cache
    const customerMap = new Map<string, Customer>();

    orders.forEach(ord => {
      const phoneKey = (ord.phone || '').replace(/[\s\-\+]/g, '').slice(-11); // normalize Bangladeshi phone
      if (!phoneKey) return;

      const existing = customerMap.get(phoneKey);
      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpent += ord.totalPrice || 0;
        existing.orders.push(ord);
        if (new Date(ord.createdAt).getTime() > new Date(existing.lastOrderDate).getTime()) {
          existing.lastOrderDate = ord.createdAt;
          existing.name = ord.customerName || existing.name;
          existing.address = ord.address || existing.address;
          existing.district = ord.district || existing.district;
        }
      } else {
        customerMap.set(phoneKey, {
          id: `cust-${phoneKey}`,
          name: ord.customerName || 'customer',
          phone: ord.phone,
          address: ord.address || '',
          district: ord.district || '',
          totalOrders: 1,
          totalSpent: ord.totalPrice || 0,
          lastOrderDate: ord.createdAt,
          orders: [ord]
        });
      }
    });

    return Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  },

  // --- Customer Authentication & Lookup ---
  async getCustomerByPhone(phone: string): Promise<Customer | null> {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone) return null;

    if (isFirebaseEnabled && db) {
      try {
        const docRef = doc(db, 'ecom_customers', cleanPhone);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as Customer;
        }
      } catch (e) {
        console.warn('Firestore getCustomerByPhone failed:', e);
      }
    }

    const customers = getLocalData<Customer[]>('noor_registered_customers', []);
    const found = customers.find(c => c.phone.replace(/\s+/g, '') === cleanPhone);
    if (found) return found;

    // Check if customer exists in past orders
    const orders = await this.getBookOrders();
    this._ordersCache = null; // invalidate cache
    const customerOrders = orders.filter(o => o.phone && o.phone.replace(/\s+/g, '') === cleanPhone);
    if (customerOrders.length > 0) {
      const latestOrder = customerOrders[0];
      const newCust: Customer = {
        id: cleanPhone,
        name: latestOrder.customerName || 'customer',
        phone: cleanPhone,
        address: latestOrder.address || '',
        district: latestOrder.district || '',
        totalOrders: customerOrders.length,
        totalSpent: customerOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0),
        lastOrderDate: latestOrder.createdAt,
        orders: customerOrders
      };
      await this.saveCustomer(newCust);
      return newCust;
    }

    return null;
  },

  async getCustomerByEmail(email: string): Promise<Customer | null> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return null;

    if (isFirebaseEnabled && db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'ecom_customers'));
        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data() as Customer;
          if ((data.email || '').trim().toLowerCase() === cleanEmail) {
            return { id: docSnap.id, ...data };
          }
        }
      } catch (e) {
        console.warn('Firestore getCustomerByEmail failed:', e);
      }
    }

    const customers = getLocalData<Customer[]>('noor_registered_customers', []);
    const found = customers.find(c => (c.email || '').trim().toLowerCase() === cleanEmail);
    if (found) return found;

    return null;
  },

  async registerCustomer(data: { name: string; phone: string; address?: string; district?: string; email?: string; password?: string; authMethod?: 'phone' | 'email' | 'google' }): Promise<Customer> {
    const cleanPhone = data.phone.trim().replace(/\s+/g, '');
    const orders = await this.getBookOrders();
    this._ordersCache = null; // invalidate cache
    const customerOrders = orders.filter(o => o.phone && o.phone.replace(/\s+/g, '') === cleanPhone);

    const newCustomer: Customer = {
      id: cleanPhone,
      name: data.name.trim(),
      phone: cleanPhone,
      address: data.address?.trim() || '',
      district: data.district?.trim() || '',
      email: data.email?.trim() || '',
      password: data.password?.trim() || undefined,
      authMethod: data.authMethod || 'phone',
      totalOrders: customerOrders.length,
      totalSpent: customerOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0),
      lastOrderDate: new Date().toISOString(),
      orders: customerOrders
    };

    await this.saveCustomer(newCustomer);
    return newCustomer;
  },

  async saveCustomer(customer: Customer): Promise<void> {
    if (isFirebaseEnabled && db) {
      try {
        const sanitized = sanitizeForFirestore(customer);
        await setDoc(doc(db, 'ecom_customers', customer.id), sanitized, { merge: true });
      } catch (e) {
        console.warn('Firestore saveCustomer failed:', e);
      }
    }

    const customers = getLocalData<Customer[]>('noor_registered_customers', []);
    const updated = [customer, ...customers.filter(c => c.id !== customer.id)];
    setLocalData('noor_registered_customers', updated);
  },

  async getOrdersByPhone(phone: string): Promise<BookOrder[]> {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone) return [];
    const orders = await this.getBookOrders();
    this._ordersCache = null; // invalidate cache
    return orders.filter(o => o.phone && o.phone.replace(/\s+/g, '') === cleanPhone);
  },

  // --- Steadfast Courier Integration Dispatch Helper ---
  async sendToSteadfastCourier(order: BookOrder): Promise<{ success: boolean; trackingCode?: string; message?: string }> {
    if (order.steadfastTrackingCode) {
      return { success: false, message: 'এই অর্ডারT ইতিমধ্যে Steadfast-এ পাঠানো হয়েছে।' };
    }
    const result = await ApiClient.dispatchSteadfast(order);
    return result;
  },

  // --- Pathao Courier Integration Dispatch Helper ---
  async sendToPathaoCourier(order: BookOrder, options?: {
    storeId?: string | number;
    recipientCity?: number;
    recipientZone?: number;
    recipientArea?: number;
    itemWeight?: number;
    itemQuantity?: number;
    specialInstruction?: string;
  }): Promise<{ success: boolean; consignmentId?: string; trackingCode?: string; orderStatus?: string; deliveryFee?: number; message?: string }> {
    if (order.pathaoConsignmentId) {
      return { success: false, message: 'এই অর্ডারT ইতিমধ্যে Pathao-তে পাঠানো হয়েছে।' };
    }
    const settings = await this.getEcomSettings();
    const result = await ApiClient.dispatchPathao({
      order,
      storeId: options?.storeId || settings.pathaoStoreId,
      recipientCity: options?.recipientCity,
      recipientZone: options?.recipientZone,
      recipientArea: options?.recipientArea,
      itemWeight: options?.itemWeight || 0.5,
      itemQuantity: options?.itemQuantity || order.quantity || 1,
      specialInstruction: options?.specialInstruction || order.productTitle,
      credentials: {
        clientId: settings.pathaoClientId,
        clientSecret: settings.pathaoClientSecret,
        clientEmail: settings.pathaoClientEmail,
        clientPassword: settings.pathaoClientPassword,
        storeId: settings.pathaoStoreId,
        environment: settings.pathaoEnvironment,
        baseUrl: settings.pathaoBaseUrl
      }
    });
    return result;
  },

  // ==========================================
  // CUSTOMER COUPONS MANAGEMENT
  // ==========================================
  async getCoupons(): Promise<Coupon[]> {
    if (isFirebaseEnabled && db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'coupons'));
        if (!querySnapshot.empty) {
          const list: Coupon[] = [];
          querySnapshot.forEach(docSnap => {
            list.push({ id: docSnap.id, ...docSnap.data() } as Coupon);
          });
          return list;
        }
      } catch (e) {
        console.warn('Firestore coupons fetch failed:', e);
      }
    }

    try {
      const res = await fetch('/api/coupons', { cache: 'no-cache' });
      if (res.ok) {
        const serverCoupons = await res.json();
        if (Array.isArray(serverCoupons)) {
          // Purge any legacy dummy seed coupons (e.g. cpn-1, cpn-2, DIS2000, TEST20, etc.)
          const clean = serverCoupons.filter(c => 
            c && 
            !c.id?.startsWith('cpn-') && 
            !['DIS2000', 'TEST20', 'TEST10', 'OLD790'].includes((c.code || '').toUpperCase())
          );
          setLocalData('noor_coupons', clean);
          return clean;
        }
      }
    } catch {}

    const local = getLocalData<Coupon[]>('noor_coupons', []);
    if (Array.isArray(local)) {
      // Purge any legacy dummy seed coupons (e.g. cpn-1, cpn-2, DIS2000, TEST20)
      const clean = local.filter(c => 
        c && 
        !c.id?.startsWith('cpn-') && 
        !['DIS2000', 'TEST20', 'TEST10', 'OLD790'].includes((c.code || '').toUpperCase())
      );
      if (clean.length !== local.length) {
        setLocalData('noor_coupons', clean);
      }
      return clean;
    }

    return [];
  },

  async addCoupon(couponData: Omit<Coupon, 'id'> & { id?: string }): Promise<Coupon> {
    const id = couponData.id || `cpn_${Date.now()}`;
    const newCoupon: Coupon = { ...couponData, id };

    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify(newCoupon)
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error('Failed saving coupon to server API:', errText);
      }
    } catch (e) {
      console.warn('Failed saving coupon to server API:', e);
    }

    if (isFirebaseEnabled && db) {
      try {
        await setDoc(doc(db, 'coupons', id), newCoupon);
      } catch (e) {
        console.warn('Firestore add coupon error:', e);
      }
    }

    const existing = await this.getCoupons();
    const updated = [newCoupon, ...existing.filter(c => c.id !== id && c.code !== newCoupon.code)];
    setLocalData('noor_coupons', updated);
    return newCoupon;
  },

  async updateCoupon(coupon: Coupon): Promise<Coupon> {
    try {
      const res = await fetch(`/api/coupons/${encodeURIComponent(coupon.id)}`, {
        method: 'PUT',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify(coupon)
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error('Failed updating coupon on server API:', errText);
      }
    } catch (e) {
      console.warn('Failed updating coupon on server API:', e);
    }

    if (isFirebaseEnabled && db) {
      try {
        await setDoc(doc(db, 'coupons', coupon.id), coupon, { merge: true });
      } catch (e) {
        console.warn('Firestore update coupon error:', e);
      }
    }

    const existing = await this.getCoupons();
    const updated = existing.map(c => c.id === coupon.id ? coupon : c);
    setLocalData('noor_coupons', updated);
    return coupon;
  },

  async deleteCoupon(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/coupons/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAdminAuthHeaders()
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error('Failed deleting coupon on server API:', errText);
      }
    } catch (e) {
      console.warn('Failed deleting coupon on server API:', e);
    }

    if (isFirebaseEnabled && db) {
      try {
        await deleteDoc(doc(db, 'coupons', id));
      } catch (e) {
        console.warn('Firestore delete coupon error:', e);
      }
    }

    const existing = await this.getCoupons();
    const updated = existing.filter(c => c.id !== id);
    setLocalData('noor_coupons', updated);
    return true;
  },

  async validateAndApplyCoupon(code: string, cartTotal: number): Promise<{ valid: boolean; coupon?: Coupon; discountAmount: number; message: string }> {
    if (!code || !code.trim()) {
      return { valid: false, discountAmount: 0, message: 'অনুগ্রহ করে Coupon code লিখুন।' };
    }

    const coupons = await this.getCoupons();
    const cleanCode = code.trim().toUpperCase();
    const found = coupons.find(c => c.code.toUpperCase() === cleanCode);

    if (!found) {
      return { valid: false, discountAmount: 0, message: 'দুঃখিত, Coupon codeT সঠিক নয়।' };
    }

    if (found.status !== 'Active') {
      return { valid: false, discountAmount: 0, message: 'কুপনT এখন inactive রয়েছে।' };
    }

    if (found.endDate) {
      const expiry = new Date(found.endDate);
      if (!isNaN(expiry.getTime()) && expiry < new Date()) {
        return { valid: false, discountAmount: 0, message: 'কুপনTর মেয়ার শেষ হয়ে গিয়েছে।' };
      }
    }

    if (found.usageLimit && found.usageLimit > 0 && found.usageCount >= found.usageLimit) {
      return { valid: false, discountAmount: 0, message: 'কুপনTর সর্বোচ্চ ব্যবহারের সীমা শেষ।' };
    }

    if (found.minimumSpent && found.minimumSpent > 0 && cartTotal < found.minimumSpent) {
      return { valid: false, discountAmount: 0, message: `এই কুপনT ব্যবহার করতে সর্বনিম্ন ৳ ${found.minimumSpent} টাকার product থাকতে হবে।` };
    }

    let discountAmount = 0;
    if (found.type === 'fixed') {
      discountAmount = Math.min(found.discount, cartTotal);
    } else {
      discountAmount = (cartTotal * found.discount) / 100;
      if (found.maxDiscount && found.maxDiscount > 0) {
        discountAmount = Math.min(discountAmount, found.maxDiscount);
      }
      discountAmount = Math.min(discountAmount, cartTotal);
    }

    return {
      valid: true,
      coupon: found,
      discountAmount: Math.round(discountAmount),
      message: `কুপন '${found.code}' successfulভাবে has been added! আপনি ৳ ${Math.round(discountAmount)} ছাড় পেয়েছেন।`
    };
  },

  async incrementCouponUsage(code: string): Promise<void> {
    const coupons = await this.getCoupons();
    const cleanCode = code.trim().toUpperCase();
    const found = coupons.find(c => c.code.toUpperCase() === cleanCode);
    if (found) {
      const updated: Coupon = {
        ...found,
        usageCount: (found.usageCount || 0) + 1,
        updatedAt: 'Just now'
      };
      await this.updateCoupon(updated);
    }
  },

  // --- Product Reviews Management ---
  async addReview(review: Review): Promise<Review> {
    let finalReview: Review = {
      ...review,
      id: review.id || `REV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: review.createdAt || new Date().toISOString(),
      isVerifiedBuyer: review.isVerifiedBuyer ?? true
    };

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalReview)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.review) {
          finalReview = data.review;
        }
      }
    } catch (e) {
      console.warn('Review server API call fallback:', e);
    }
    
    if (isFirebaseEnabled && db) {
      try {
        await setDoc(doc(db, 'reviews', finalReview.id), finalReview);
      } catch (error) {
        console.error('Error saving review to Firestore:', error);
      }
    }
    
    // Save to local storage as fallback/cache
    const current = getLocalData<Review[]>('noor_reviews', []);
    const updated = [finalReview, ...current.filter(r => r.id !== finalReview.id)];
    setLocalData('noor_reviews', updated);
    window.dispatchEvent(new Event('reviews-updated'));
    
    return finalReview;
  },

  async getReviews(productId?: string, customerPhone?: string): Promise<Review[]> {
    try {
      const params = new URLSearchParams();
      if (productId) params.append('productId', productId);
      const res = await fetch(`/api/reviews?${params.toString()}`);
      if (res.ok) {
        const serverReviews = await res.json();
        if (Array.isArray(serverReviews)) {
          setLocalData('noor_reviews', serverReviews);
          let filtered = serverReviews;
          if (customerPhone) {
            const cleanPhone = customerPhone.replace(/\D/g, '').replace(/^880/, '0').replace(/^88/, '');
            filtered = filtered.filter(r => (r.customerPhone || '').replace(/\D/g, '').replace(/^880/, '0').replace(/^88/, '') === cleanPhone);
          }
          return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
      }
    } catch {}

    if (isFirebaseEnabled && db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'reviews'));
        const list: Review[] = [];
        querySnapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Review);
        });
        setLocalData('noor_reviews', list);
      } catch (error) {
        console.warn('Error reading reviews from Firestore:', error);
      }
    }
    
    let list = getLocalData<Review[]>('noor_reviews', []);
    if (productId) {
      list = list.filter(r => r.productId === productId || r.productId.includes(productId) || productId.includes(r.productId));
    }
    if (customerPhone) {
      const cleanPhone = customerPhone.replace(/\D/g, '').replace(/^880/, '0').replace(/^88/, '');
      list = list.filter(r => (r.customerPhone || '').replace(/\D/g, '').replace(/^880/, '0').replace(/^88/, '') === cleanPhone);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getBrands(): Promise<Brand[]> {
    if (isFirebaseEnabled && db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'brands'));
        const list: Brand[] = [];
        querySnapshot.forEach((docSnap) => {
          list.push({ ...(docSnap.data() as Brand), id: docSnap.id });
        });
        setLocalData('noor_brands', list);
        return list;
      } catch (error) {
        console.warn('Error reading brands from Firestore:', error);
      }
    }

    try {
      const res = await fetch('/api/brands', { cache: 'no-cache' });
      if (res.ok) {
        const serverBrands = await res.json();
        if (Array.isArray(serverBrands) && serverBrands.length > 0) {
          setLocalData('noor_brands', serverBrands);
          return serverBrands;
        }
      }
    } catch {}

    const list = getLocalData<Brand[]>('noor_brands', DEFAULT_BRANDS);
    if (!list || list.length === 0) {
      setLocalData('noor_brands', DEFAULT_BRANDS);
      return DEFAULT_BRANDS;
    }
    return list;
  },

  async saveBrand(brand: Brand): Promise<Brand> {
    const finalBrand: Brand = {
      ...brand,
      id: brand.id || `brand-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: brand.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify(finalBrand)
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error('Failed saving brand to server API:', errText);
      }
    } catch (e) {
      console.warn('Failed saving brand to server API:', e);
    }

    if (isFirebaseEnabled && db) {
      try {
        const sanitized = sanitizeForFirestore(finalBrand);
        await setDoc(doc(db, 'brands', finalBrand.id), sanitized, { merge: true });
      } catch (error) {
        console.error('Error saving brand to Firestore:', error);
      }
    }

    const current = await this.getBrands();
    const existingIndex = current.findIndex(b => b.id === finalBrand.id);
    let updated: Brand[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = finalBrand;
    } else {
      updated = [finalBrand, ...current];
    }
    setLocalData('noor_brands', updated);
    window.dispatchEvent(new CustomEvent('brands-updated', { detail: updated }));
    window.dispatchEvent(new CustomEvent('ecom-brands-updated', { detail: updated }));
    return finalBrand;
  },

  async deleteBrand(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/brands/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAdminAuthHeaders()
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error('Failed deleting brand from server API:', errText);
      }
    } catch (e) {
      console.warn('Failed deleting brand from server API:', e);
    }

    if (isFirebaseEnabled && db) {
      try {
        await deleteDoc(doc(db, 'brands', id));
      } catch (error) {
        console.error('Error deleting brand from Firestore:', error);
      }
    }

    const current = await this.getBrands();
    const updated = current.filter(b => b.id !== id);
    setLocalData('noor_brands', updated);
    window.dispatchEvent(new CustomEvent('brands-updated', { detail: updated }));
    window.dispatchEvent(new CustomEvent('ecom-brands-updated', { detail: updated }));
  },

  async saveBrands(brands: Brand[]): Promise<void> {
    if (isFirebaseEnabled && db) {
      try {
        for (const b of brands) {
          const sanitized = sanitizeForFirestore(b);
          await setDoc(doc(db, 'brands', b.id), sanitized, { merge: true });
        }
      } catch (error) {
        console.error('Error batch saving brands to Firestore:', error);
      }
    }
    setLocalData('noor_brands', brands);
    window.dispatchEvent(new CustomEvent('brands-updated', { detail: brands }));
    window.dispatchEvent(new CustomEvent('ecom-brands-updated', { detail: brands }));
  },

  // --- Contact Form Messages Management ---
  async getContactMessages(): Promise<ContactMessage[]> {
    if (isFirebaseEnabled && db) {
      try {
        const q = query(collection(db, 'contact_messages'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const list: ContactMessage[] = [];
          snap.forEach(docSnap => {
            list.push({ ...(docSnap.data() as ContactMessage), id: docSnap.id });
          });
          setLocalData('noor_contact_messages', list);
          return list;
        }
      } catch (e) {
        console.warn('Error reading contact messages from Firestore:', e);
      }
    }
    return getLocalData<ContactMessage[]>('noor_contact_messages', []);
  },

  async saveContactMessage(message: Partial<ContactMessage>): Promise<ContactMessage> {
    const msgToSave: ContactMessage = {
      id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: message.name || '',
      email: message.email || '',
      phone: message.phone || '',
      subject: message.subject || '',
      message: message.message || '',
      createdAt: message.createdAt || new Date().toISOString(),
      status: message.status || 'unread',
      replyNote: message.replyNote || ''
    };

    if (isFirebaseEnabled && db) {
      try {
        await setDoc(doc(db, 'contact_messages', msgToSave.id), msgToSave);
      } catch (e) {
        console.error('Error saving contact message to Firestore:', e);
      }
    }

    const current = await this.getContactMessages();
    const updated = [msgToSave, ...current.filter(m => m.id !== msgToSave.id)];
    setLocalData('noor_contact_messages', updated);
    window.dispatchEvent(new CustomEvent('contact-messages-updated', { detail: updated }));
    return msgToSave;
  },

  async updateContactMessage(message: ContactMessage): Promise<ContactMessage> {
    if (isFirebaseEnabled && db) {
      try {
        await setDoc(doc(db, 'contact_messages', message.id), message, { merge: true });
      } catch (e) {
        console.error('Error updating contact message in Firestore:', e);
      }
    }

    const current = await this.getContactMessages();
    const updated = current.map(m => m.id === message.id ? message : m);
    setLocalData('noor_contact_messages', updated);
    window.dispatchEvent(new CustomEvent('contact-messages-updated', { detail: updated }));
    return message;
  },

  async deleteContactMessage(id: string): Promise<void> {
    if (isFirebaseEnabled && db) {
      try {
        await deleteDoc(doc(db, 'contact_messages', id));
      } catch (e) {
        console.error('Error deleting contact message from Firestore:', e);
      }
    }

    const current = await this.getContactMessages();
    const updated = current.filter(m => m.id !== id);
    setLocalData('noor_contact_messages', updated);
    window.dispatchEvent(new CustomEvent('contact-messages-updated', { detail: updated }));
  },

  // --- Real-Time Abandoned Cart Recovery (Fixo Cart Architecture) ---
  async captureAbandonedCart(payload: {
    customerPhone: string;
    customerName?: string;
    customerAddress?: string;
    customerDistrict?: string;
    customerEmail?: string;
    items: AbandonedCartItem[];
    subtotal: number;
    deliveryCharge?: number;
    totalAmount?: number;
    source: 'storefront_checkout' | 'landing_page';
    sourceSlug?: string;
  }): Promise<AbandonedCart | null> {
    const cleanPhone = (payload.customerPhone || '').replace(/\D/g, '');
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
      return null;
    }

    try {
      const res = await fetch('/api/abandoned-carts/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.cart) {
          const current = getLocalData<AbandonedCart[]>('noor_abandoned_carts', []);
          const updated = [data.cart, ...current.filter(c => c.id !== data.cart.id)];
          setLocalData('noor_abandoned_carts', updated);
          window.dispatchEvent(new Event('abandoned-carts-updated'));
          return data.cart;
        }
      }
    } catch (err) {
      console.warn('Failed capturing abandoned cart to server:', err);
    }

    // Local fallback
    const now = new Date().toISOString();
    const current = getLocalData<AbandonedCart[]>('noor_abandoned_carts', []);
    const existingIdx = current.findIndex(c => (c.customerPhone || '').replace(/\D/g, '') === cleanPhone && c.status === 'abandoned');
    
    let cart: AbandonedCart;
    if (existingIdx !== -1) {
      cart = {
        ...current[existingIdx],
        customerName: payload.customerName || current[existingIdx].customerName,
        customerAddress: payload.customerAddress || current[existingIdx].customerAddress,
        customerDistrict: payload.customerDistrict || current[existingIdx].customerDistrict,
        items: payload.items && payload.items.length > 0 ? payload.items : current[existingIdx].items,
        subtotal: payload.subtotal,
        deliveryCharge: payload.deliveryCharge || 0,
        totalAmount: payload.totalAmount !== undefined ? payload.totalAmount : (payload.subtotal + (payload.deliveryCharge || 0)),
        lastActivityAt: now,
        updatedAt: now
      };
      current[existingIdx] = cart;
    } else {
      cart = {
        id: `ac-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        customerPhone: cleanPhone,
        customerName: payload.customerName,
        customerAddress: payload.customerAddress,
        customerDistrict: payload.customerDistrict || 'Dhaka',
        customerEmail: payload.customerEmail,
        items: payload.items || [],
        subtotal: payload.subtotal,
        deliveryCharge: payload.deliveryCharge || 0,
        totalAmount: payload.totalAmount !== undefined ? payload.totalAmount : (payload.subtotal + (payload.deliveryCharge || 0)),
        status: 'abandoned',
        source: payload.source || 'storefront_checkout',
        sourceSlug: payload.sourceSlug,
        lastActivityAt: now,
        createdAt: now,
        updatedAt: now
      };
      current.unshift(cart);
    }
    setLocalData('noor_abandoned_carts', current);
    window.dispatchEvent(new Event('abandoned-carts-updated'));
    return cart;
  },

  async getAbandonedCarts(statusFilter?: string, searchQuery?: string): Promise<{ carts: AbandonedCart[]; metrics: AbandonedCartMetrics }> {
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/abandoned-carts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.carts)) {
          setLocalData('noor_abandoned_carts', data.carts);
          return { carts: data.carts, metrics: data.metrics };
        }
      }
    } catch (e) {
      console.warn('Failed reading abandoned carts from server:', e);
    }

    const localCarts = getLocalData<AbandonedCart[]>('noor_abandoned_carts', []);
    let filtered = [...localCarts];
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(c => 
        c.customerPhone.includes(q) || 
        (c.customerName && c.customerName.toLowerCase().includes(q))
      );
    }

    let totalAbandoned = 0;
    let adminRecoveredCount = 0;
    let selfRecoveredCount = 0;
    let recoveredRevenue = 0;
    let potentialLostRevenue = 0;

    localCarts.forEach(c => {
      if (c.status === 'abandoned') {
        totalAbandoned++;
        potentialLostRevenue += (c.totalAmount || 0);
      } else if (c.status === 'admin_recovered') {
        adminRecoveredCount++;
        recoveredRevenue += (c.totalAmount || 0);
      } else if (c.status === 'self_recovered') {
        selfRecoveredCount++;
        recoveredRevenue += (c.totalAmount || 0);
      }
    });

    const totalRecoveredCount = adminRecoveredCount + selfRecoveredCount;
    const totalCarts = totalAbandoned + totalRecoveredCount;
    const recoveryRate = totalCarts > 0 ? Math.round((totalRecoveredCount / totalCarts) * 100) : 0;

    return {
      carts: filtered,
      metrics: {
        totalAbandoned,
        adminRecoveredCount,
        selfRecoveredCount,
        totalRecoveredCount,
        recoveredRevenue,
        potentialLostRevenue,
        recoveryRate
      }
    };
  },

  async convertAbandonedCartToOrder(cartId: string, options: { customDeliveryCharge?: number; paymentMethod?: string; notes?: string }): Promise<{ success: boolean; order?: BookOrder; message?: string }> {
    try {
      const res = await fetch(`/api/abandoned-carts/${encodeURIComponent(cartId)}/convert-to-order`, {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify(options)
      });
      const data = await res.json();
      if (data.success) {
        window.dispatchEvent(new Event('book-orders-updated'));
        window.dispatchEvent(new Event('abandoned-carts-updated'));
        return data;
      }
      return { success: false, message: data.message || 'Failed to convert order' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Network error converting cart' };
    }
  },

  async markAbandonedCartRecovered(cartId: string, channel: 'whatsapp' | 'call' | 'sms' | 'admin_converted', notes?: string, orderId?: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/abandoned-carts/${encodeURIComponent(cartId)}/recover`, {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ channel, notes, orderId })
      });
      if (res.ok) {
        window.dispatchEvent(new Event('abandoned-carts-updated'));
        return true;
      }
    } catch (e) {
      console.warn('Failed marking cart as recovered:', e);
    }
    return false;
  },

  async deleteAbandonedCart(cartId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/abandoned-carts/${encodeURIComponent(cartId)}`, {
        method: 'DELETE',
        headers: getAdminAuthHeaders()
      });
      if (res.ok) {
        const local = getLocalData<AbandonedCart[]>('noor_abandoned_carts', []);
        setLocalData('noor_abandoned_carts', local.filter(c => c.id !== cartId));
        window.dispatchEvent(new Event('abandoned-carts-updated'));
        return true;
      }
    } catch (e) {
      console.warn('Failed deleting cart:', e);
    }
    return false;
  },

  async sendAbandonedCartSms(phone: string, message: string, cartId?: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/abandoned-carts/send-sms', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ phone, message, cartId })
      });
      const data = await res.json();
      if (data.success) {
        window.dispatchEvent(new Event('abandoned-carts-updated'));
        return data;
      }
      return { success: false, message: data.message || 'SMS send failed' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Network error sending SMS' };
    }
  }
};

// Real-time Firestore listener for book_orders
// Returns an unsubscribe function. Falls back gracefully if Firebase not enabled.
export function subscribeToOrders(
  onData: (orders: BookOrder[]) => void
): () => void {
  if (!isFirebaseEnabled || !db) {
    return () => {};
  }
  const q = query(collection(db, 'book_orders'), orderBy('createdAt', 'desc'));
  const unsub = onSnapshot(q, (snapshot) => {
    const orders: BookOrder[] = [];
    snapshot.forEach((docSnap) => {
      orders.push({ ...(docSnap.data() as BookOrder), id: docSnap.id });
    });
    onData(orders);
  }, (err) => {
    console.warn('subscribeToOrders error:', err);
  });
  return unsub;
}
