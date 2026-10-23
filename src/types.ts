export interface ProductSpecRow {
  feature: string;
  details: string;
}

export interface ProductFeatureCard {
  icon: string;
  title: string;
  subtitle?: string;
  description: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  regularPrice?: number;
  image?: string;
  color?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  variant?: ProductVariant;
}

export interface Product {
  id: string;
  title: string;
  subtitle?: string;
  sku?: string;
  price: number;
  regularPrice?: number;
  offerPrice?: number;
  costPrice?: number;
  hasVariants?: boolean;
  variants?: ProductVariant[];
  image?: string;
  category: string;
  subCategory?: string;
  brand?: string;
  brandId?: string;
  stock?: number;
  openingStock?: number;
  receivedStock?: number;
  soldStock?: number;
  returnedStock?: number;
  damagedStock?: number;
  transferredStock?: number;
  reservedStock?: number;
  reorderPoint?: number;
  isAvailable?: boolean;
  description?: string;
  ingredients?: string;
  benefitsHighlights?: string;
  howToUseIt?: string;
  howToUse?: string;

  specs?: string[];
  features?: string[];
  tableOfContents?: string[] | string;
  createdAt?: string;
  viewsCount?: number;

  // Additional publishing, identity & pricing fields from admin panel
  productType?: string;
  translation?: string;
  barcode?: string;
  shortSummary?: string;
  vatPercent?: number;
  authorName?: string;
  pdfUrl?: string;
  slug?: string; // Optional product URL slug for public product pages
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  // Book-specific metadata
  primaryAuthor?: string;
  printType?: string; // e.g., 'newsprint', 'whitepaper', etc.
  isbn?: string;
  colorGrade?: string; // e.g., 'B&W', 'Color'
  edition?: string;
  pageCount?: number;
  samplePdfUrl?: string; // Short preview PDF
  samplePages?: string[]; // Array of image URLs for preview pages
  isFlashSale?: boolean;
  flashPrice?: number;
  isPrivate?: boolean;
  isFeatured?: boolean;
  isCampaign?: boolean;
  isNewArrival?: boolean;
  isOneTimePurchase?: boolean;
  continueSelling?: boolean;
  isUnlisted?: boolean;
  codAvailable?: boolean;
  deliveryChargeEnabled?: boolean;
  deliveryChargeAmount?: number;
  exclusiveDelivery?: boolean;
  addQrToImage?: boolean;
  addBarcodeToImage?: boolean;
  giftWrapEnabled?: boolean;
  giftWrapPrice?: number;
  condition?: string;
  author?: string;
  series?: string;
  coverImage?: string;
  images?: string[];
  additionalImages?: string[];
  badge?: string;
  discountPercentage?: number;
  stockQuantity?: number;
  rating?: number;
  reviewsCount?: number;
  tags?: string[];

  // Advanced Product Detail & Media Fields (Authentic Showcase)
  hasVideo?: boolean;
  videoUrl?: string;
  videoType?: 'youtube' | 'vimeo' | 'mp4' | 'direct';
  videoTitle?: string;
  videoPoster?: string;
  videoDescription?: string;
  galleryAutoScroll?: boolean;
  galleryScrollInterval?: number; // seconds
  specTable?: { feature: string; details: string }[];
  specificationsList?: { title: string; description: string }[] | string[];
  keyFeatureCards?: { icon: string; title: string; subtitle?: string; description: string }[];
  weightBadge?: string;
  weightKg?: number;
  capacityBadge?: string;
  sizeBadge?: string;
  bottomBannerBadge?: string;
  moq?: string;
  sampleService?: string;
  oemService?: string;
  whatsappNumber?: string;
  whatsappMessage?: string;
  contactEmail?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
}

export interface HeroBannerItem {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  discountText?: string;
  showDiscount?: boolean;
  imageOnly?: boolean;
  bgGradient?: string;
  imageUrl?: string;
  mobileImageUrl?: string;

  link?: string;
  actionType?: 'product' | 'external';
  productId?: string;
  mediaType?: 'image' | 'video';
  videoType?: 'file' | 'youtube';
  videoUrl?: string;
  youtubeUrl?: string;
  buttonText?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
}

export interface SubCategoryItem {
  id: string;
  name: string;
  image?: string;
  order?: number;
}

export interface CategoryItem {
  id: string;
  name: string;
  order?: number;
  image?: string;
  icon?: string;
  subcategories?: SubCategoryItem[];
}

export interface PromoCardItem {
  id: string;
  title: string;
  badge?: string;
  bgGradient?: string;
  imageUrl?: string;
  mobileImageUrl?: string;

  discountText?: string;
  priceText?: string;
  subtitle?: string;
  link?: string;
  productId?: string;
}

export interface PaymentGatewayItem {
  id: string;
  title: string;
  type: string;
  status: 'Active' | 'Inactive';
  transactionFee: number;
  discountAmount: number;
  priority: number;
  instruction: string;
  updatedAt: string;
  accountNumber?: string;
}

export type DeliveryAreaScope = 'all' | 'inside_dhaka' | 'dhaka_suburbs' | 'outside_dhaka' | 'custom_districts';
export type DeliveryPricingModel = 'flat' | 'weight_based';

export interface DeliveryMethodItem {
  id: string;
  title: string;
  subtitle?: string;
  status: 'Active' | 'Inactive';
  mode: string;
  type: string;
  areaScope?: DeliveryAreaScope;
  customDistricts?: string[];
  pricingModel?: DeliveryPricingModel;
  baseWeightKg?: number;
  baseCharge?: number;
  additionalChargePerKg?: number;
  minimumCharge: number;
  maximumCharge: number;
  deliveryCharge: number;
  freeDeliveryThreshold?: number;
  estimatedDays?: string;
  courierPartner?: string;
  updatedAt: string;
}

export interface VipTier {
  id: string;
  name: string; // e.g. "Silver Member", "Gold VIP", "Platinum Royal"
  levelOrder: number; // 1, 2, 3
  minLifetimeSpend: number; // e.g. 5000
  billDiscountPercent: number; // e.g. 5
  pointMultiplier: number; // e.g. 1.2
  perks: string;
  status: 'Active' | 'Inactive';
  cardColor?: string;
  updatedAt?: string;
}

export interface DigitalLoyaltyCard {
  id: string;
  title: string; // e.g. "VIP Card"
  cardColor: string; // e.g. '#064e3b', '#0a3866', '#0284c7', '#831843', '#78350f'
  forSpend: number; // e.g. 100
  earnPoints: number; // e.g. 5
  pointValueTaka: number; // e.g. 1
  validityDays: number; // e.g. 365
  cardType: string; // "Phone Wallet Pass"
  status: 'Active' | 'Inactive';
  updatedAt?: string;
}

export interface ClubMember {
  id: string;
  phone: string;
  name: string;
  memberNumber: string; // e.g. "LWF-VIP-74892"
  tierId: string;
  tierName: string;
  joinedDate: string;
  validUntil: string;
  totalSpent: number;
  pointsBalance: number;
  status: 'Active' | 'Suspended';
}

export interface LandingPagePrize {
  rank: string; // e.g. "১ম পুরস্কার"
  title: string; // e.g. "Toyota Premio"
  image?: string;
}

export interface LandingPageVariant {
  id: string;
  name: string; // e.g. "সিলভার" or "CASIO AE-1200WHL — সিলভার"
  image: string;
  price?: number;
  regularPrice?: number;
  tag?: string;
  inStock?: boolean;
}

export interface LandingPageWatchSpec {
  label: string;
  value: string;
  icon?: string;
}

export interface LandingPageFeatureItem {
  id?: string;
  title: string;
  subtitle: string;
  icon?: string;
}

export interface LandingPageQualityItem {
  id?: string;
  title: string;
  subtitle: string;
  icon?: string;
}

export interface LandingPageData {
  id: string; // e.g. 'landing-default'
  slug: string; // e.g. 'smart-land-survey-book'
  isEnabled?: boolean; // Whether the landing page is active/enabled for this product
  productId?: string; // linked store product ID (Legacy)
  productIds?: string[]; // Array of linked store product IDs
  bookTitle: string;
  bookSubtitle?: string;
  authorName: string;
  authorDesignation?: string;
  authorPhoto?: string;
  mainBookImage: string;
  heroBookImage?: string;
  logoUrl?: string;
  pageCount?: string;
  paperQuality?: string;
  regularPrice: number;
  offerPrice: number;
  deliveryCharge: number;
  deliveryChargeOutside?: number;
  deliveryAreaInsideText?: string;
  deliveryAreaOutsideText?: string;
  bannerDeliveryText?: string;
  heroHeadline?: string;
  heroDescription?: string;
  shortSummary?: string;
  videoUrl?: string;
  features?: string[];
  tableOfContents?: string[];
  reviews?: { name: string; comment: string; rating: number; photo?: string }[];
  relatedProductIds?: string[];
  galleryImages?: string[];
  paymentMethodDefault?: 'COD' | 'bKash' | 'Nagad';
  onlyCashOnDelivery?: boolean;

  // Watch Store & Giveaway Campaign Template Enhancements
  templateTheme?: 'luxury_dark' | 'classic_light';
  isGiveawayEnabled?: boolean; // Toggle giveaway section on/off on landing page
  campaignBadgeText?: string; // e.g. 'Yamaha R15 জিতুন'
  campaignBannerImage?: string; // Custom graphic banner
  campaignBannerTitle?: string; // e.g. 'অর্ডার করলেই আপনি পেয়ে যাবেন একT কুপন কার্ড যার মাধ্যমে আপনিও ক্যাম্পেইনে যুক্ত হয়ে যেতে পারবেন!'
  campaignCouponNote?: string; // e.g. 'কুপনT অবশ্যই যত্ন সহকারে সংগ্রহ করে রাখবেন'
  campaignTickerText?: string; // e.g. 'Lucky coupon to win Yamaha R15 on order.'
  prizes?: LandingPagePrize[];
  variantSectionTitle?: string; // e.g. 'একই feeচার, তিনT ভিন্ন লুক'
  variantSectionSubtitle?: string; // e.g. 'বেছে নিন যেটা আপনার স্টাইলের সাথে মানায়'
  customVariants?: LandingPageVariant[];
  whatsAppNumber?: string; // Direct WhatsApp contact
  watchSpecs?: LandingPageWatchSpec[];

  // Dynamic Landing Page Sections & Customizable Cards
  vintageTag?: string; // e.g. 'For vintage lovers'
  vintageTitle?: string; // e.g. 'Whose eyes still get stuck on the clocks of yesteryear'
  vintageDescription?: string; // e.g. 'A taste of real time lost in the crowd of smartwatches — this classic design is for them.'
  vintageFeatures?: LandingPageFeatureItem[];

  gallerySectionTag?: string; // e.g. 'Gallery'
  gallerySectionTitle?: string; // e.g. 'Premium from every angle'

  qualitySectionTag?: string; // e.g. 'Why this watch?'
  qualitySectionTitle?: string; // e.g. 'Japanese quality, amazing price'
  qualityItems?: LandingPageQualityItem[];

  luckyDrawTag?: string; // e.g. 'R15 lucky draw'
  luckyDrawTitle?: string; // e.g. 'Order, win R15'
  luckyDrawSteps?: string[]; // e.g. ['Order watch — receive unique lucky coupon code with parcel', ...]
  grandPrizeTitle?: string; // e.g. 'Yamaha R15'
  grandPrizeSubtitle?: string; // e.g. 'Every order = a new opportunity'
  grandPrizeLiveTag?: string; // e.g. 'FACEBOOK LIVE STREAM'

  colorSectionTag?: string; // e.g. 'Color selection'
  colorSectionTitle?: string; // e.g. 'Click on the color button below to preview the watch and order'
}

export interface FlashSaleSettings {
  enabled: boolean;
  productId?: string;
  badgeTag?: string; // e.g. 'FEATURED PROMOTION'
  title?: string; // e.g. 'Seasonal Collection'
  subtitle?: string; // description
  customImage?: string; // optional image override
  flashPrice?: number; // special promotional price
  originalPrice?: number; // original strike-through price
  endDate?: string; // ISO date string e.g. '2026-10-31T23:59:59'
  buttonText?: string; // e.g. 'SHOP NOW'
  showVideoSection?: boolean;
  videoTitle?: string;
  videoSubtitle?: string;
  videoType?: 'file' | 'youtube';
  videoUrl?: string;
  youtubeUrl?: string;
}

export interface HighlightSpotlightSettings {
  enabled: boolean;
  targetType: 'product' | 'category'; // Whether highlighting a product or category
  productId?: string;
  categoryName?: string;
  badgeTag?: string; // e.g. 'EXCLUSIVE SPOTLIGHT'
  title?: string; // e.g. 'Featured Innovation'
  subtitle?: string; // e.g. 'Discover our premier collection...'
  customImage?: string; // optional custom image or auto from product/category
  buttonText?: string; // e.g. 'EXPLORE NOW'
  buttonLink?: string;
}

export interface HeaderMenuItem {
  id: string;
  label: string;
  link: string;
  hasDropdown?: boolean;
  dropdownItems?: { label: string; link: string }[];
}

export interface HeaderSettings {
  showTopBar?: boolean;
  phone?: string;
  email?: string;
  socialLinks?: {
    facebook?: string;
    youtube?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    tiktok?: string;
    whatsapp?: string;
  };
  logoUrl?: string;
  brandName?: string;
  menuItems?: HeaderMenuItem[];
  ctaButtonText?: string;
  ctaButtonLink?: string;
  ctaActionType?: 'quote_modal' | 'whatsapp' | 'link' | 'custom_link';
  showCtaButton?: boolean;
  vipClubText?: string;
  vipClubBadge?: string;
  showVipButton?: boolean;
  searchPlaceholder?: string;
}

export interface AbandonedCartItem {
  productId: string;
  productTitle: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variant?: string;
  selectedColor?: string;
  selectedSize?: string;
}

export type AbandonedCartStatus = 'abandoned' | 'admin_recovered' | 'self_recovered' | 'cancelled';
export type AbandonedCartRecoveryChannel = 'whatsapp' | 'call' | 'sms' | 'admin_converted';

export interface AbandonedCart {
  id: string;
  customerPhone: string;
  customerName?: string;
  customerAddress?: string;
  customerDistrict?: string;
  customerEmail?: string;
  items: AbandonedCartItem[];
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  status: AbandonedCartStatus;
  source: 'storefront_checkout' | 'landing_page';
  sourceSlug?: string;
  recoveredOrderId?: string;
  recoveryChannel?: AbandonedCartRecoveryChannel;
  recoveryNotes?: string;
  recoveredAt?: string;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AbandonedCartMetrics {
  totalAbandoned: number;
  adminRecoveredCount: number;
  selfRecoveredCount: number;
  totalRecoveredCount: number;
  recoveredRevenue: number;
  potentialLostRevenue: number;
  recoveryRate: number;
}

export interface EcomSettings {
  headerSettings?: HeaderSettings;
  storeName?: string;
  storeDomain?: string;
  storeLogo?: string;
  storeTagline?: string;
  topAnnouncementText?: string;
  companyName?: string;
  contactEmail?: string;
  contactPhone?: string;
  storeAddress?: string;
  footerDescription?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    twitter?: string;
    tiktok?: string;
    linkedin?: string;
    whatsapp?: string;
  };
  primaryColor?: string;
  pixelId?: string;
  gtmId?: string;
  metaApiToken?: string;
  steadfastApiKey?: string;
  steadfastSecretKey?: string;
  deliveryChargeInsideDhaka: number;
  deliveryChargeOutsideDhaka: number;
  deliveryChargeInsideExpress?: number;
  deliveryChargeOutsideExpress?: number;
  freeDeliveryEnabled?: boolean;
  freeDeliveryMinPurchase?: number;
  deliveryDays?: string[];
  deliveryCutoffTimes?: Record<string, string>;

  bkashNumber?: string;
  nagadNumber?: string;
  paymentGateways?: PaymentGatewayItem[];
  deliveryMethods?: DeliveryMethodItem[];
  heroBanners?: HeroBannerItem[];
  categories?: string[];
  categoryItems?: CategoryItem[];
  brands?: Brand[];
  promoCards?: PromoCardItem[];
  pointsEnabled?: boolean;
  pointsEarnRate?: number;
  pointsRewards?: PointRewardItem[];
  pointsFaqs?: PointFaqItem[];
  maintenanceMode?: boolean;
  showViewCountOnWebsite?: boolean;
  websiteViewsCount?: number;
  landingViewsCount?: number;
  fcmServerKey?: string;
  fcmVapidKey?: string;
  flashSale?: FlashSaleSettings;
  highlightSpotlight?: HighlightSpotlightSettings;

  // Pathao Courier API Integration Settings
  pathaoClientId?: string;
  pathaoClientSecret?: string;
  pathaoClientEmail?: string;
  pathaoClientPassword?: string;
  pathaoStoreId?: string;
  pathaoEnvironment?: 'sandbox' | 'production';
  pathaoBaseUrl?: string;
  pathaoGrantType?: string;
  pathaoTitle?: string;
  pathaoMinCharge?: number;
  pathaoMaxCharge?: number;
  pathaoWebhookSecret?: string;
  defaultCourierProvider?: 'steadfast' | 'pathao';
  aboutSettings?: AboutPageSettings;

  // VIP Membership & Digital Loyalty Club
  vipTiers?: VipTier[];
  digitalLoyaltyCards?: DigitalLoyaltyCard[];
  clubMembers?: ClubMember[];

  // Storefront Section Customization
  featuredSectionTitle?: string;
  featuredSectionSubtitle?: string;
  bundlesSectionTitle?: string;
  bundlesSectionSubtitle?: string;
  bestSellersSectionTitle?: string;
  bestSellersSectionSubtitle?: string;

  // Customer Reviews & Testimonials Carousel ("What our customers say")
  testimonials?: TestimonialSectionSettings;

  // Interactive Before/After Comparison
  beforeAfter?: BeforeAfterSettings;

  // "Brands That Love Us" Logo Bar
  clientLogos?: ClientLogosSettings;

  // "See What Customers Are Saying" Photo Reviews Carousel
  photoReviews?: PhotoReviewsSettings;

  // "Hear it from the people who wash" Video Reviews Section
  videoReviews?: VideoReviewsSettings;

  // "Frequently asked questions" Accordion Section
  faqs?: FaqSectionSettings;

  // Cart Drawer Embedded Review Settings
  cartReview?: CartReviewSettings;

  // Blog Posts
  blogPosts?: BlogPost[];
}

export interface TestimonialItem {
  id: string;
  name: string;
  designation?: string; // Company, location, or customer title
  avatarOrLogo?: string;
  rating: number; // 1 to 5
  quote: string;
  active?: boolean;
}

export interface TestimonialSectionSettings {
  enabled: boolean;
  title: string; // e.g. "What our customers say"
  subtitle?: string;
  autoScroll?: boolean;
  scrollInterval?: number; // in seconds, e.g. 5
  showReviewsBadge?: boolean; // floating side tab "★ Reviews"
  items: TestimonialItem[];
}

export interface BeforeAfterBullet {
  id: string;
  title: string;
  description: string;
}

export interface BeforeAfterSettings {
  enabled: boolean;
  title: string;
  description: string;
  beforeImage: string;
  afterImage: string;
  beforeBadge?: string; // default "BEFORE"
  afterBadge?: string;  // default "AFTER"
  initialSliderPosition?: number; // 0 to 100, default 50
  buttonText?: string;  // e.g. "Shop PowerPax™"
  buttonLink?: string;  // e.g. "/shop"
  bullets: BeforeAfterBullet[];
}

export interface ClientLogoItem {
  id: string;
  name: string;
  logoUrl: string;
  link?: string;
  active?: boolean;
}

export interface ClientLogosSettings {
  enabled: boolean;
  title: string; // e.g. "Brands That Love Us"
  bgColor?: string; // default "#0c1e30"
  items: ClientLogoItem[];
}

export interface PhotoReviewItem {
  id: string;
  name: string;
  isVerified?: boolean;
  rating: number; // 1 to 5
  quote: string;
  photoUrl: string;
  productTag?: string; // e.g. "PowerPax™ Clean..."
  active?: boolean;
}

export interface PhotoReviewsSettings {
  enabled: boolean;
  title: string; // e.g. "See What Customers Are Saying"
  overallRating?: number; // e.g. 4.76
  totalReviewsCount?: number; // e.g. 268
  isVerifiedBadge?: boolean;
  items: PhotoReviewItem[];
}

export interface VideoReviewItem {
  id: string;
  author: string; // e.g. "Jenna H."
  pillTag?: string; // e.g. "Benefits"
  subtitle?: string; // e.g. "ONE POD, FIVE JOBS"
  quote: string;
  videoUrl?: string;
  posterUrl: string;
  active?: boolean;
}

export interface VideoReviewsSettings {
  enabled: boolean;
  badge?: string;
  title?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  items: VideoReviewItem[];
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  active?: boolean;
}

export interface FaqSectionSettings {
  enabled: boolean;
  title: string; // e.g. "Frequently asked questions"
  subtitle?: string;
  bgColor?: string; // default dark "#0c1e30"
  items: FaqItem[];
}

export interface CartReviewSettings {
  enabled: boolean;
  reviewerName: string;
  location?: string;
  isVerified: boolean;
  reviewDate: string;
  rating: number;
  comment: string;
  photoUrl?: string;
  productTitle?: string;
  productImage?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  excerpt: string;
  content: string; // rich HTML or markdown
  author?: string;
  readTime?: string;
  isFeatured?: boolean;
  createdAt: string;
  updatedAt?: string;
  isPublished?: boolean;
  tags?: string[];
}

export interface AboutPagePillar {
  id: string;
  title: string;
  description: string;
  icon?: string;
  badge?: string;
}

export interface AboutPageStat {
  id: string;
  value: string;
  label: string;
}

export interface AboutPageSettings {
  pageTitle?: string;
  description?: string;
  title?: string;
  subtitle?: string;
  content?: string;
  image?: string;
  badge?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  storyBadge?: string;
  storyTitle?: string;
  storySubtitle?: string;
  storyParagraph1?: string;
  storyParagraph2?: string;
  storyParagraph3?: string;
  storyImage?: string;
  pillarsTitle?: string;
  pillarsSubtitle?: string;
  pillars?: AboutPagePillar[];
  hqTitle?: string;
  hqSubtitle?: string;
  hqAddress?: string;
  hqImage?: string;
  missionStatement?: string;
  founderQuote?: string;
  founderName?: string;
  founderTitle?: string;
  founderImage?: string;
  stats?: AboutPageStat[];
}

export interface InstituteInfo {
  name: string;
  regNo: string;
  phone: string;
  email: string;
  address: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  website?: string;
  logo?: string;
  tagline?: string;
  establishedYear?: string;
  description?: string;
  ingredients?: string;
  benefitsHighlights?: string;
  howToUseIt?: string;
  author?: string;
  tags?: string[];

  industry?: string;
  bearingRollLocation?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  couponDiscount?: number;

  address?: string;
  district?: string;
  registeredAt?: string;
  totalOrders?: number;
  totalSpent?: number;
  pointsBalance?: number;
  pointsSpent?: number;
  points?: number;
  password?: string;
  orders?: any[];
  lastOrderDate?: string;
  authMethod?: 'email' | 'phone' | 'google';
  wishlist?: string[];
  createdAt?: string;
}

export interface BookOrder {
  id: string; // e.g. ORD-2026-1001
  productId?: string;
  productName?: string;
  customerName: string;
  email?: string; 
  couponDiscount?: number;

  paymentGateway?: string;
  deliveryFee?: number;

  name?: string;
  phone: string;
  address: string;
  deliveryZone?: string;
  district?: string;
  thana?: string;
  productTitle?: string; // e.g. "Product Title"
  price?: number;
  unitPrice?: number;
  deliveryCharge: number;
  quantity: number; // 1
  items?: CartItem[] | any[];
  totalPrice?: number; // 580
  totalAmount?: number;
  total?: number;
  orderTotal?: number;
  subtotal?: number;
  itemCount?: number;
  bookTitle?: string;
  deliveryStatus?: string;
  updatedAt?: string;
  customerPhone?: string;
  customerEmail?: string;
  paymentMethod?: 'COD' | 'bKash' | 'Nagad' | 'Cash on Delivery' | string;
  trxId?: string;
  senderPhone?: string;
  orderType?: 'landing' | 'physical' | 'store' | 'storefront';
  source?: string;
  deliveryArea?: string;
  status: 'Pending' | 'Confirmed' | 'Packaging' | 'Ready for Shipment' | 'Shipped' | 'Delivered' | 'Hold' | 'Under Review' | 'Not Responding' | 'Return' | 'Cancelled' | string;
  createdAt: string;
  orderDate?: string;
  pointsSpent?: number;
  notes?: string;
  steadfastTrackingCode?: string;
  steadfastStatus?: string;
  pathaoConsignmentId?: string;
  pathaoTrackingCode?: string;
  pathaoStatus?: string;
  pathaoDeliveryFee?: number;
  courierProvider?: 'steadfast' | 'pathao' | string;
  couponCode?: string;
  luckyCouponCode?: string;
  discountAmount?: number;
  handoffProof?: string;
  courierMerchant?: string;
  giftWrapSelected?: boolean;
  giftWrapPrice?: number;
  memberTier?: string;
  memberDiscount?: number;
  pointsEarned?: number;
  pointsRedeemed?: number;
}

export interface Coupon {
  id: string;
  code: string;
  title: string;
  discount: number;
  maxDiscount?: number;
  minimumSpent?: number;
  minSpent?: number;
  usageLimit?: number;
  usageCount: number;
  endDate?: string;
  type: 'fixed' | 'percentage' | 'percent';
  status: 'Active' | 'Inactive';
  visibility: 'Public' | 'Private';
  oncePerCustomer?: boolean;
  description?: string;
  ingredients?: string;
  benefitsHighlights?: string;
  howToUseIt?: string;
  author?: string;
  tags?: string[];

  updatedAt: string;
}

export interface Brand {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  ingredients?: string;
  benefitsHighlights?: string;
  howToUseIt?: string;
  author?: string;
  tags?: string[];

  website?: string;
  isActive?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type ActiveTab = 'dashboard' | 'products' | 'orders' | 'abandoned_carts' | 'customers' | 'coupons' | 'inventory' | 'category_management' | 'brand_management' | 'slider_management' | 'header_settings' | 'flash_sale' | 'highlight_spotlight' | 'about_settings' | 'landing_setup' | 'payment_settings' | 'delivery_settings' | 'pixel_settings' | 'courier_settings' | 'profile' | 'points' | 'contact_messages' | 'blog_manager' | 'video_reviews';

export interface ContactMessage {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  createdAt: string;
  status?: 'unread' | 'read' | 'replied';
  replyNote?: string;
}

export interface Review {
  id: string;
  productId: string;
  productTitle: string;
  productImage?: string;
  customerName: string;
  email?: string; 
  couponDiscount?: number;

  paymentGateway?: string;
  deliveryFee?: number;

  customerPhone: string;
  rating: number;
  comment: string;
  images: string[];
  createdAt: string;
  orderId?: string;
  isVerifiedBuyer?: boolean;
  helpfulCount?: number;
}

export interface PointRewardItem {
  id: string;
  title: string;
  pointsCost: number;
  rewardType: 'shipping_discount' | 'flat_discount';
  value: number;
}

export interface PointFaqItem {
  id: string;
  question: string;
  answer: string;
}
