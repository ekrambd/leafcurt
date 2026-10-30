import fs from 'fs';
import path from 'path';
import { Product, BookOrder, EcomSettings, AbandonedCart, AbandonedCartItem, AbandonedCartMetrics, Review } from '../../types';
import { DEFAULT_HEADER_SETTINGS, DEFAULT_BEFORE_AFTER_SETTINGS, DEFAULT_TESTIMONIAL_SETTINGS, DEFAULT_CLIENT_LOGOS_SETTINGS, DEFAULT_PHOTO_REVIEWS_SETTINGS, DEFAULT_CART_REVIEW_SETTINGS, DEFAULT_VIDEO_REVIEWS_SETTINGS, DEFAULT_FAQ_SETTINGS, DEFAULT_BLOG_POSTS } from '../../lib/constants';

const PRODUCTS_STORAGE_FILE = path.join(process.cwd(), 'prisma', 'products.json');

// Authentic Catalog with verified server uploads
export const INITIAL_REAL_PRODUCTS: Product[] = [];

// Load persisted products from disk or initialize with real catalog
export function loadProductsFromDisk(): Product[] {
  let list: Product[] = [];
  try {
    if (fs.existsSync(PRODUCTS_STORAGE_FILE)) {
      const raw = fs.readFileSync(PRODUCTS_STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed.filter(p => 
          !p.brand?.toLowerCase().includes('fantine') &&
          p.category !== 'Serums' &&
          p.category !== 'Toners' &&
          p.category !== 'Rapid Acne Treatment Series' &&
          p.id !== '3-in-1-laundry-detergent-pods' &&
          p.id !== 'leaf-curt-5-in-1-laundry-pods-tub' &&
          p.id !== 'leaf-curt-5-in-1-laundry-pods-box' &&
          !p.id?.startsWith('prod-vb') &&
          !p.id?.startsWith('prod-vc') &&
          !p.id?.startsWith('prod-super-antioxidant') &&
          !p.id?.startsWith('prod-ve-') &&
          !p.id?.startsWith('prod-rapid-acne') &&
          !p.id?.startsWith('prod-aha') &&
          !p.id?.startsWith('prod-retinol') &&
          !p.id?.startsWith('prod-collagen') &&
          !p.id?.startsWith('prod-botox')
        );
      }
    }
  } catch (err) {
    console.warn('[store] Could not load products from disk:', err);
  }

  if (list.length === 0) {
    return [];
  }

  return list.map(p => {
    const img = p.image || p.coverImage || (p.images && p.images[0]) || '';
    const stockNum = typeof p.stock === 'number' ? p.stock : (typeof p.stockQuantity === 'number' ? p.stockQuantity : 0);
    return {
      ...p,
      description: p.description || '',
      benefitsHighlights: p.benefitsHighlights || '',
      howToUse: p.howToUse || (p as any).howToUseIt || '',
      howToUseIt: p.howToUse || (p as any).howToUseIt || '',
      ingredients: p.ingredients || '',
      brand: p.brand || 'Store',
      brandId: p.brandId || 'brand-default',
      image: img,
      coverImage: p.coverImage || img,
      stock: stockNum,
      stockQuantity: stockNum,
      isAvailable: p.isAvailable !== false,
      authorName: p.authorName || p.brand || 'Store'
    };
  });
}

export function saveProductsToDisk(products: Product[]): void {
  try {
    const dir = path.dirname(PRODUCTS_STORAGE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(PRODUCTS_STORAGE_FILE, JSON.stringify(products, null, 2), 'utf-8');
  } catch (err) {
    console.error('[store] Failed saving products to disk:', err);
  }
}

export let storeProducts: Product[] = loadProductsFromDisk();

export const setStoreProducts = (newProducts: Product[]) => {
  storeProducts = newProducts;
  saveProductsToDisk(storeProducts);
  return storeProducts;
};

const ORDERS_STORAGE_FILE = path.join(process.cwd(), 'prisma', 'orders.json');

export function loadOrdersFromDisk(): BookOrder[] {
  try {
    if (fs.existsSync(ORDERS_STORAGE_FILE)) {
      const raw = fs.readFileSync(ORDERS_STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const seen = new Set<string>();
        const uniqueOrders: BookOrder[] = [];
        for (const order of parsed) {
          if (order && order.id && !seen.has(order.id)) {
            seen.add(order.id);
            uniqueOrders.push(order);
          }
        }
        return uniqueOrders;
      }
    }
  } catch (err) {
    console.error('[store] Error reading orders from disk:', err);
  }
  return [];
}

export function saveOrdersToDisk(orders: BookOrder[]): void {
  try {
    const dir = path.dirname(ORDERS_STORAGE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // Always deduplicate by ID before writing to disk
    const seen = new Set<string>();
    const uniqueOrders: BookOrder[] = [];
    for (const order of orders) {
      if (order && order.id && !seen.has(order.id)) {
        seen.add(order.id);
        uniqueOrders.push(order);
      }
    }
    fs.writeFileSync(ORDERS_STORAGE_FILE, JSON.stringify(uniqueOrders, null, 2), 'utf-8');
  } catch (err) {
    console.error('[store] Failed saving orders to disk:', err);
  }
}

export let storeOrders: BookOrder[] = loadOrdersFromDisk();

export const updateStoreOrders = (newOrders: BookOrder[]) => {
  storeOrders = newOrders;
  saveOrdersToDisk(storeOrders);
  return storeOrders;
};

const SETTINGS_STORAGE_FILE = path.join(process.cwd(), 'prisma', 'settings.json');

const DEFAULT_INITIAL_SETTINGS: EcomSettings = {
  headerSettings: DEFAULT_HEADER_SETTINGS,
  storeName: 'Leaf Curt',
  companyName: 'Leaf Curt',
  storeLogo: '/uploads/file-1792735476267-28104613.webp',
  storeTagline: 'Your Premium Online Shopping Destination',
  topAnnouncementText: 'WELCOME TO www.leafcurt.com',
  contactEmail: 'armtrading16@gmail.com',
  contactPhone: '01635311494',
  storeAddress: 'Banasree, Dhaka, Bangladesh',
  footerDescription: 'Leaf Curt - Premium Online Shopping Destination. Discover quality laundry pods and home care at unbeatable prices.',
  gtmId: '',
  deliveryChargeInsideDhaka: 70,
  deliveryChargeOutsideDhaka: 130,
  bkashNumber: '',
  nagadNumber: '',
  categories: [],
  beforeAfter: DEFAULT_BEFORE_AFTER_SETTINGS,
  testimonials: DEFAULT_TESTIMONIAL_SETTINGS,
  clientLogos: DEFAULT_CLIENT_LOGOS_SETTINGS,
  photoReviews: DEFAULT_PHOTO_REVIEWS_SETTINGS,
  videoReviews: DEFAULT_VIDEO_REVIEWS_SETTINGS,
  faqs: DEFAULT_FAQ_SETTINGS,
  cartReview: DEFAULT_CART_REVIEW_SETTINGS,
  freeDeliveryMinPurchase: 450,
  deliveryMethods: [],
  blogPosts: DEFAULT_BLOG_POSTS
};

export function loadSettingsFromDisk(): EcomSettings {
  try {
    if (fs.existsSync(SETTINGS_STORAGE_FILE)) {
      const raw = fs.readFileSync(SETTINGS_STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const inside = parsed.deliveryChargeInsideDhaka ?? (parsed as any).deliveryChargeInside ?? 70;
        const outside = parsed.deliveryChargeOutsideDhaka ?? (parsed as any).deliveryChargeOutside ?? 130;
        return {
          ...DEFAULT_INITIAL_SETTINGS,
          ...parsed,
          deliveryChargeInsideDhaka: inside,
          deliveryChargeOutsideDhaka: outside,
          deliveryMethods: Array.isArray(parsed.deliveryMethods) ? parsed.deliveryMethods : [],
          headerSettings: {
            ...DEFAULT_HEADER_SETTINGS,
            ...(parsed.headerSettings || {}),
            socialLinks: {
              ...DEFAULT_HEADER_SETTINGS.socialLinks,
              ...(parsed.headerSettings?.socialLinks || parsed.socialLinks || {})
            }
          },
          socialLinks: {
            ...DEFAULT_HEADER_SETTINGS.socialLinks,
            ...(parsed.socialLinks || parsed.headerSettings?.socialLinks || {})
          },
          beforeAfter: parsed.beforeAfter || DEFAULT_BEFORE_AFTER_SETTINGS,
          testimonials: (parsed.testimonials && parsed.testimonials.items && parsed.testimonials.items.length > 0) 
            ? parsed.testimonials 
            : DEFAULT_TESTIMONIAL_SETTINGS,
          clientLogos: (parsed.clientLogos && parsed.clientLogos.items && parsed.clientLogos.items.length > 0)
            ? parsed.clientLogos
            : DEFAULT_CLIENT_LOGOS_SETTINGS,
          photoReviews: (parsed.photoReviews && parsed.photoReviews.items && parsed.photoReviews.items.length > 0)
            ? parsed.photoReviews
            : DEFAULT_PHOTO_REVIEWS_SETTINGS,
          videoReviews: parsed.videoReviews ? {
            ...parsed.videoReviews,
            items: (parsed.videoReviews.items || []).map((item: any) => {
              if (item.posterUrl && item.posterUrl.trim()) return item;
              const ytMatch = (item.videoUrl || '').match(/(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([\w-]{11})/i);
              return {
                ...item,
                posterUrl: ytMatch ? `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg` : (item.posterUrl || '')
              };
            })
          } : {
            enabled: true,
            items: []
          },
          faqs: (parsed.faqs && parsed.faqs.items && parsed.faqs.items.length > 0)
            ? parsed.faqs
            : DEFAULT_FAQ_SETTINGS,
          cartReview: (parsed.cartReview && parsed.cartReview.comment)
            ? parsed.cartReview
            : DEFAULT_CART_REVIEW_SETTINGS,
          freeDeliveryMinPurchase: parsed.freeDeliveryMinPurchase ?? 450,
          blogPosts: (parsed.blogPosts && Array.isArray(parsed.blogPosts))
            ? parsed.blogPosts
            : []
        };
      }
    }
  } catch (err) {
    console.error('[store] Error reading settings from disk:', err);
  }
  return { ...DEFAULT_INITIAL_SETTINGS };
}

export function saveSettingsToDisk(settings: EcomSettings): void {
  try {
    const dir = path.dirname(SETTINGS_STORAGE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_STORAGE_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    console.error('[store] Failed saving settings to disk:', err);
  }
}

export let storeSettings: EcomSettings = loadSettingsFromDisk();

export const updateStoreSettings = (newSettings: Partial<EcomSettings>) => {
  storeSettings = {
    ...storeSettings,
    ...newSettings,
    headerSettings: {
      ...(storeSettings.headerSettings || DEFAULT_HEADER_SETTINGS),
      ...(newSettings.headerSettings || {}),
      phone: newSettings.headerSettings?.phone ?? newSettings.contactPhone ?? storeSettings.headerSettings?.phone ?? storeSettings.contactPhone,
      email: newSettings.headerSettings?.email ?? newSettings.contactEmail ?? storeSettings.headerSettings?.email ?? storeSettings.contactEmail,
      brandName: newSettings.headerSettings?.brandName ?? newSettings.storeName ?? storeSettings.headerSettings?.brandName ?? storeSettings.storeName,
      logoUrl: newSettings.headerSettings?.logoUrl ?? newSettings.storeLogo ?? storeSettings.headerSettings?.logoUrl ?? storeSettings.storeLogo,
      socialLinks: {
        ...(storeSettings.headerSettings?.socialLinks || {}),
        ...(newSettings.socialLinks || {}),
        ...(newSettings.headerSettings?.socialLinks || {})
      }
    },
    socialLinks: {
      ...(storeSettings.socialLinks || {}),
      ...(newSettings.headerSettings?.socialLinks || {}),
      ...(newSettings.socialLinks || {})
    },
    aboutSettings: {
      ...(storeSettings.aboutSettings || {}),
      ...(newSettings.aboutSettings || {})
    },
    flashSale: (storeSettings.flashSale || newSettings.flashSale) ? ({
      ...(storeSettings.flashSale || {}),
      ...(newSettings.flashSale || {})
    } as any) : undefined,
    highlightSpotlight: (storeSettings.highlightSpotlight || newSettings.highlightSpotlight) ? ({
      ...(storeSettings.highlightSpotlight || {}),
      ...(newSettings.highlightSpotlight || {})
    } as any) : undefined,
    beforeAfter: (storeSettings.beforeAfter || newSettings.beforeAfter) ? ({
      ...(storeSettings.beforeAfter || DEFAULT_BEFORE_AFTER_SETTINGS),
      ...(newSettings.beforeAfter || {})
    } as any) : DEFAULT_BEFORE_AFTER_SETTINGS,
    testimonials: (storeSettings.testimonials || newSettings.testimonials) ? ({
      ...(storeSettings.testimonials || DEFAULT_TESTIMONIAL_SETTINGS),
      ...(newSettings.testimonials || {})
    } as any) : DEFAULT_TESTIMONIAL_SETTINGS,
    clientLogos: (storeSettings.clientLogos || newSettings.clientLogos) ? ({
      ...(storeSettings.clientLogos || DEFAULT_CLIENT_LOGOS_SETTINGS),
      ...(newSettings.clientLogos || {})
    } as any) : DEFAULT_CLIENT_LOGOS_SETTINGS,
    photoReviews: (storeSettings.photoReviews || newSettings.photoReviews) ? ({
      ...(storeSettings.photoReviews || DEFAULT_PHOTO_REVIEWS_SETTINGS),
      ...(newSettings.photoReviews || {})
    } as any) : DEFAULT_PHOTO_REVIEWS_SETTINGS,
    videoReviews: (storeSettings.videoReviews || newSettings.videoReviews) ? ({
      ...(storeSettings.videoReviews || DEFAULT_VIDEO_REVIEWS_SETTINGS),
      ...(newSettings.videoReviews || {})
    } as any) : DEFAULT_VIDEO_REVIEWS_SETTINGS,
    faqs: (storeSettings.faqs || newSettings.faqs) ? ({
      ...(storeSettings.faqs || DEFAULT_FAQ_SETTINGS),
      ...(newSettings.faqs || {})
    } as any) : DEFAULT_FAQ_SETTINGS,
    cartReview: (storeSettings.cartReview || newSettings.cartReview) ? ({
      ...(storeSettings.cartReview || DEFAULT_CART_REVIEW_SETTINGS),
      ...(newSettings.cartReview || {})
    } as any) : DEFAULT_CART_REVIEW_SETTINGS,
    blogPosts: newSettings.blogPosts !== undefined ? newSettings.blogPosts : (storeSettings.blogPosts || []),
    ...((newSettings as any).instituteInfo ? { instituteInfo: { ...((storeSettings as any).instituteInfo || {}), ...(newSettings as any).instituteInfo } } : {})
  };
  saveSettingsToDisk(storeSettings);
  return storeSettings;
};

export const clearAllStoreData = () => {
  storeProducts = [...INITIAL_REAL_PRODUCTS];
  saveProductsToDisk(storeProducts);
  storeOrders = [];
  storeAbandonedCarts = [];
  saveAbandonedCartsToDisk(storeAbandonedCarts);
  return { success: true };
};

// ==========================================
// ABANDONED CART RECOVERY SYSTEM (FIXO CART ARCHITECTURE)
// ==========================================
const ABANDONED_CARTS_STORAGE_FILE = path.join(process.cwd(), 'prisma', 'abandoned_carts.json');

export function loadAbandonedCartsFromDisk(): AbandonedCart[] {
  try {
    if (fs.existsSync(ABANDONED_CARTS_STORAGE_FILE)) {
      const raw = fs.readFileSync(ABANDONED_CARTS_STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('[store] Error reading abandoned carts from disk:', err);
  }
  return [];
}

export function saveAbandonedCartsToDisk(carts: AbandonedCart[]): void {
  try {
    const dir = path.dirname(ABANDONED_CARTS_STORAGE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(ABANDONED_CARTS_STORAGE_FILE, JSON.stringify(carts, null, 2), 'utf-8');
  } catch (err) {
    console.error('[store] Failed saving abandoned carts to disk:', err);
  }
}

export function pruneExpiredAbandonedCarts(maxAgeDays = 30): number {
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  const beforeCount = storeAbandonedCarts.length;
  storeAbandonedCarts = storeAbandonedCarts.filter(cart => {
    const time = new Date(cart.lastActivityAt || cart.updatedAt || cart.createdAt || 0).getTime();
    return !isNaN(time) && time > cutoff;
  });
  if (storeAbandonedCarts.length !== beforeCount) {
    saveAbandonedCartsToDisk(storeAbandonedCarts);
  }
  return beforeCount - storeAbandonedCarts.length;
}

export let storeAbandonedCarts: AbandonedCart[] = loadAbandonedCartsFromDisk();
// Run auto-prune on startup and schedule every 12 hours
pruneExpiredAbandonedCarts();
const cartCleanupTimer = setInterval(() => pruneExpiredAbandonedCarts(), 12 * 60 * 60 * 1000);
if (typeof cartCleanupTimer.unref === 'function') {
  cartCleanupTimer.unref();
}

export const normalizePhoneNumber = (phone: string): string => {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.startsWith('880')) {
    return '0' + digits.slice(3);
  }
  return digits;
};

export const calculateAbandonedCartMetrics = (carts: AbandonedCart[] = storeAbandonedCarts): AbandonedCartMetrics => {
  let totalAbandoned = 0;
  let adminRecoveredCount = 0;
  let selfRecoveredCount = 0;
  let recoveredRevenue = 0;
  let potentialLostRevenue = 0;

  carts.forEach(cart => {
    if (cart.status === 'abandoned') {
      totalAbandoned++;
      potentialLostRevenue += (cart.totalAmount || 0);
    } else if (cart.status === 'admin_recovered') {
      adminRecoveredCount++;
      recoveredRevenue += (cart.totalAmount || 0);
    } else if (cart.status === 'self_recovered') {
      selfRecoveredCount++;
      recoveredRevenue += (cart.totalAmount || 0);
    }
  });

  const totalRecoveredCount = adminRecoveredCount + selfRecoveredCount;
  const totalCarts = totalAbandoned + totalRecoveredCount;
  const recoveryRate = totalCarts > 0 ? Math.round((totalRecoveredCount / totalCarts) * 100) : 0;

  return {
    totalAbandoned,
    adminRecoveredCount,
    selfRecoveredCount,
    totalRecoveredCount,
    recoveredRevenue,
    potentialLostRevenue,
    recoveryRate
  };
};

export const upsertAbandonedCart = (cartData: {
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
}): AbandonedCart | null => {
  const cleanPhone = normalizePhoneNumber(cartData.customerPhone);
  if (!cleanPhone || cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
    return null;
  }

  const now = new Date().toISOString();
  const subtotal = Number(cartData.subtotal) || 0;
  const deliveryCharge = Number(cartData.deliveryCharge) || 0;
  const totalAmount = cartData.totalAmount !== undefined ? Number(cartData.totalAmount) : (subtotal + deliveryCharge);

  // Look for existing pending abandoned cart with this phone
  const existingIdx = storeAbandonedCarts.findIndex(
    c => normalizePhoneNumber(c.customerPhone) === cleanPhone && c.status === 'abandoned'
  );

  if (existingIdx !== -1) {
    const existing = storeAbandonedCarts[existingIdx];
    const updated: AbandonedCart = {
      ...existing,
      customerName: cartData.customerName?.trim() || existing.customerName,
      customerAddress: cartData.customerAddress?.trim() || existing.customerAddress,
      customerDistrict: cartData.customerDistrict?.trim() || existing.customerDistrict,
      customerEmail: cartData.customerEmail?.trim() || existing.customerEmail,
      items: cartData.items && cartData.items.length > 0 ? cartData.items : existing.items,
      subtotal,
      deliveryCharge,
      totalAmount,
      source: cartData.source || existing.source,
      sourceSlug: cartData.sourceSlug || existing.sourceSlug,
      lastActivityAt: now,
      updatedAt: now
    };
    storeAbandonedCarts[existingIdx] = updated;
    saveAbandonedCartsToDisk(storeAbandonedCarts);
    return updated;
  }

  // Create new abandoned cart
  const newCart: AbandonedCart = {
    id: `ac-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    customerPhone: cleanPhone,
    customerName: cartData.customerName?.trim() || '',
    customerAddress: cartData.customerAddress?.trim() || '',
    customerDistrict: cartData.customerDistrict?.trim() || 'Dhaka',
    customerEmail: cartData.customerEmail?.trim() || '',
    items: cartData.items || [],
    subtotal,
    deliveryCharge,
    totalAmount,
    status: 'abandoned',
    source: cartData.source || 'storefront_checkout',
    sourceSlug: cartData.sourceSlug,
    lastActivityAt: now,
    createdAt: now,
    updatedAt: now
  };

  storeAbandonedCarts.unshift(newCart);
  saveAbandonedCartsToDisk(storeAbandonedCarts);
  return newCart;
};

export const syncSelfRecoveredCart = (customerPhone: string, orderId: string, _orderTotal?: number): boolean => {
  const cleanPhone = normalizePhoneNumber(customerPhone);
  if (!cleanPhone) return false;

  let matched = false;
  const now = new Date().toISOString();

  storeAbandonedCarts = storeAbandonedCarts.map(cart => {
    // Check against cleanPhone or raw phone match
    const cartPhoneClean = normalizePhoneNumber(cart.customerPhone);
    const isSamePhone = cartPhoneClean === cleanPhone || cart.customerPhone === customerPhone;
    if (isSamePhone && cart.status === 'abandoned') {
      matched = true;
      return {
        ...cart,
        status: 'self_recovered',
        recoveredOrderId: orderId,
        recoveredAt: now,
        updatedAt: now
      };
    }
    return cart;
  });

  if (matched) {
    saveAbandonedCartsToDisk(storeAbandonedCarts);
  }
  return matched;
};

export const adminRecoverCart = (
  cartId: string, 
  channel: 'whatsapp' | 'call' | 'sms' | 'admin_converted', 
  notes?: string, 
  orderId?: string
): AbandonedCart | null => {
  const idx = storeAbandonedCarts.findIndex(c => c.id === cartId);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  const updated: AbandonedCart = {
    ...storeAbandonedCarts[idx],
    status: 'admin_recovered',
    recoveryChannel: channel,
    recoveryNotes: notes,
    recoveredOrderId: orderId || storeAbandonedCarts[idx].recoveredOrderId,
    recoveredAt: now,
    updatedAt: now
  };

  storeAbandonedCarts[idx] = updated;
  saveAbandonedCartsToDisk(storeAbandonedCarts);
  return updated;
};

export const deleteAbandonedCart = (cartId: string): boolean => {
  const initialLength = storeAbandonedCarts.length;
  storeAbandonedCarts = storeAbandonedCarts.filter(c => c.id !== cartId);
  if (storeAbandonedCarts.length !== initialLength) {
    saveAbandonedCartsToDisk(storeAbandonedCarts);
    return true;
  }
  return false;
};

/**
 * When an order is deleted by the admin, check if any abandoned cart was converted/recovered
 * to this order. If so, revert its status back to 'abandoned' so the lead isn't lost or falsely marked recovered.
 */
export const revertAbandonedCartOnOrderDelete = (orderId: string): boolean => {
  if (!orderId) return false;
  let changed = false;
  const now = new Date().toISOString();

  storeAbandonedCarts = storeAbandonedCarts.map(cart => {
    if (cart.recoveredOrderId === orderId) {
      changed = true;
      return {
        ...cart,
        status: 'abandoned',
        recoveredOrderId: undefined,
        recoveryChannel: undefined,
        recoveryNotes: `Order #${orderId} was deleted; reverted to pending abandoned lead.`,
        recoveredAt: undefined,
        updatedAt: now
      };
    }
    return cart;
  });

  if (changed) {
    saveAbandonedCartsToDisk(storeAbandonedCarts);
  }
  return changed;
};

// ============================================================
// CUSTOMER REVIEWS STORAGE & VERIFIED PURCHASE ELIGIBILITY
// ============================================================

const REVIEWS_STORAGE_FILE = path.join(process.cwd(), 'prisma', 'reviews.json');

const INITIAL_REVIEWS: Review[] = [];

export const loadReviewsFromDisk = (): Review[] => {
  try {
    if (fs.existsSync(REVIEWS_STORAGE_FILE)) {
      const raw = fs.readFileSync(REVIEWS_STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading reviews from disk:', err);
  }
  return [];
};

export const saveReviewsToDisk = (reviews: Review[]) => {
  try {
    const dir = path.dirname(REVIEWS_STORAGE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(REVIEWS_STORAGE_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving reviews to disk:', err);
  }
};

export let storeReviews: Review[] = loadReviewsFromDisk();

// Check if customer phone has placed any confirmed/valid order
export const checkCustomerOrderEligibility = (
  rawPhone: string, 
  productId?: string
): { canReview: boolean; reason?: string; ordersCount: number; matchedOrder?: BookOrder } => {
  if (!rawPhone) {
    return { canReview: false, reason: 'দয়া করে লগইন করুন বা ফোন নম্বর প্রদান করুন।', ordersCount: 0 };
  }

  const cleanPhone = rawPhone.replace(/\D/g, '').replace(/^880/, '0').replace(/^88/, '');
  if (cleanPhone.length < 10) {
    return { canReview: false, reason: 'সঠিক ১১ সংখ্যার মোবাইল নম্বর প্রদান করুন।', ordersCount: 0 };
  }

  const matchingOrders = storeOrders.filter(o => {
    const oPhone = (o.phone || '').replace(/\D/g, '').replace(/^880/, '0').replace(/^88/, '');
    return oPhone === cleanPhone;
  });

  if (matchingOrders.length === 0) {
    return {
      canReview: false,
      reason: 'রিভিউ দেওয়ার জন্য গ্রাহককে অবশ্যই পূর্বে ওয়েবসাইট থেকে একটি অর্ডার সম্পন্ন করতে হবে।',
      ordersCount: 0
    };
  }

  // Found matching orders - customer is a verified buyer
  const targetOrder = matchingOrders[0];
  return {
    canReview: true,
    ordersCount: matchingOrders.length,
    matchedOrder: targetOrder
  };
};

export const addStoreReview = (data: {
  productId: string;
  productTitle?: string;
  productImage?: string;
  customerName: string;
  customerPhone: string;
  rating: number;
  comment: string;
  images?: string[];
  orderId?: string;
}): Review => {
  const newReview: Review = {
    id: `REV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    productId: data.productId,
    productTitle: data.productTitle || 'Product',
    productImage: data.productImage,
    customerName: data.customerName.trim(),
    customerPhone: data.customerPhone.trim(),
    rating: Math.max(1, Math.min(5, Number(data.rating) || 5)),
    comment: data.comment.trim(),
    images: data.images || [],
    createdAt: new Date().toISOString(),
    orderId: data.orderId,
    isVerifiedBuyer: true,
    helpfulCount: 0
  };

  storeReviews.unshift(newReview);
  saveReviewsToDisk(storeReviews);
  return newReview;
};

export const getStoreReviews = (productId?: string): Review[] => {
  if (!productId || productId === 'all') {
    return storeReviews;
  }
  const cleanId = productId.toLowerCase();
  return storeReviews.filter(r => 
    r.productId.toLowerCase() === cleanId || 
    cleanId.includes(r.productId.toLowerCase()) ||
    r.productId.toLowerCase().includes(cleanId)
  );
};
