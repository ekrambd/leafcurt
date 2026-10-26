import { 
  Product, Coupon, Brand, 
  PaymentGatewayItem, DeliveryMethodItem, HeroBannerItem, PromoCardItem, 
  EcomSettings, InstituteInfo, FlashSaleSettings, HighlightSpotlightSettings,
  HeaderSettings, HeaderMenuItem, VipTier, DigitalLoyaltyCard, ClubMember,
  TestimonialSectionSettings, TestimonialItem, BlogPost
} from '../types';

export const DEFAULT_PRODUCTS: Product[] = [];

export const DEFAULT_COUPONS: Coupon[] = [];

export const DEFAULT_BRANDS: Brand[] = [];

export const DEFAULT_PAYMENT_GATEWAYS: PaymentGatewayItem[] = [
  {
    id: 'gw-1',
    title: 'Cash on Delivery',
    type: 'Cash on Delivery',
    status: 'Active',
    transactionFee: 0,
    discountAmount: 0,
    priority: 1,
    instruction: 'Pay with cash upon delivery of your order.',
    updatedAt: 'Jul 23, 2026',
    accountNumber: ''
  }
];

export const DEFAULT_DELIVERY_METHODS: DeliveryMethodItem[] = [];

export const DEFAULT_PROMO_CARDS: PromoCardItem[] = [];

export const DEFAULT_ABOUT_SETTINGS: import('../types').AboutPageSettings = {
  title: 'about us',
  subtitle: 'প্রিমিয়াম কোয়ালিটি ও এক্সিলেন্স',
  content: `আমাদের ব্র্যান্ডে আমরা বিশ্বাস করি দৈনন্দিন যত্ন কেবল বাহ্যিক সৌন্দর্য নয়, বরং আত্মবিশ্বাস ও সুস্থতার এক অবিচ্ছেদ্য অংশ।

আমরা সরাসরি আধুনিক ল্যাবরেটরি থেকে সংগৃহীত প্রিমিয়াম ফর্মুলেশন ও ক্লিনিক্যাল উপাদান সরবরাহ করি। আমাদের প্রতিটি প্রোডাক্ট ১০০% আসল, ল্যাব-টেস্টেড এবং নিরাপদ।

আমাদের লক্ষ্য হলো প্রতিটি গ্রাহকের কাছে সেরা মানের আন্তর্জাতিক প্রোডাক্ট সহজলভ্য এবং নির্ভরযোগ্যভাবে পৌঁছে দেওয়া।`,
  image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=1600&auto=format&fit=crop&q=85',
  badge: 'PREMIUM QUALITY & BOTANICAL SCIENCE',
  heroTitle: 'The Heritage of Botanical Excellence & Science',
  heroSubtitle: 'Forged with excellence, our products harmonize premium ingredients with cutting-edge active formulation.',
  heroImage: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=1600&auto=format&fit=crop&q=85',
  storyBadge: 'PHILOSOPHY & LEGACY',
  storyTitle: 'Clinical Botanical Purity with Proven Results',
  storySubtitle: 'From Research Labs to Discerning Customers Worldwide',
  storyParagraph1: 'Our brand was born out of a profound commitment to restorative health and quality performance. By fusing high-potency botanicals with clinically proven actives, we deliver formulas that deeply replenish and protect.',
  storyParagraph2: 'Our dedicated laboratories in Seoul adhere to the strictest dermatological standards, ensuring micro-molecular absorption, continuous 72-hour moisture lock, and noticeable clinical fading of hyperpigmentation in 28 days.',
  storyParagraph3: 'Every formulation is 100% cruelty-free, paraben-free, dermatologist-tested, and certified under Korean KFDA clean beauty standards.',
  storyImage: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=1000&auto=format&fit=crop&q=85',
  pillarsTitle: 'Our Four Pillars of Dermal Excellence',
  pillarsSubtitle: 'Bridging timeless Korean wellness traditions with cutting-edge dermatology',
  pillars: [
    {
      id: 'p1',
      badge: 'HERITAGE',
      title: 'Hanbang Herbal Synergy',
      description: 'Authentic Korean herbal medicine principles blended for cellular vitality, barrier defense, and deep radiant clarity.',
      icon: 'Sprout'
    },
    {
      id: 'p2',
      badge: 'BIOTECH',
      title: 'Micro Bio-Fermentation',
      description: 'Micro-molecular cold fermentation allowing active nutrients to penetrate up to 10 dermal layers deep effortlessly.',
      icon: 'FlaskConical'
    },
    {
      id: 'p3',
      badge: 'CLEAN DERMA',
      title: 'EWG Green & Cruelty-Free',
      description: 'Dermatologist-formulated with zero harsh parabens, artificial fragrances, or sulfates. Safe for the most sensitive skin.',
      icon: 'ShieldCheck'
    },
    {
      id: 'p4',
      badge: 'RESTORATION',
      title: '5-Tier Barrier Defense',
      description: 'Multi-molecular ceramides and phytosphingosine engineered to lock in deep hydration for 72 hours continuously.',
      icon: 'Layers'
    }
  ],
  hqTitle: 'Global Headquarters & R&D Hub',
  hqSubtitle: 'Global R&D Center & Innovation Hub',
  hqAddress: '9F, Gangnamjeil Bldg, 109, Teheran-ro, Gangnam-gu, Seoul, Republic of Korea',
  hqImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=85',
  missionStatement: 'We sincerely hope we can relieve your tensions and stresses, and give you a healthier and more peaceful life.',
  founderName: 'Dermal Research & Formulation Institute',
  founderTitle: 'Clinical Formulation & Botanical Science Division',
  founderImage: 'https://images.unsplash.com/photo-1594824813589-980f745e69e8?w=800&auto=format&fit=crop&q=85',
  stats: [
    { id: 's1', value: '28 Days', label: 'Skin Renewal Cycle' },
    { id: 's2', value: '100%', label: 'K-Clean Certified' },
    { id: 's3', value: '5-Tier', label: 'Ceramide Barrier Defense' },
    { id: 's4', value: '15+', label: 'Herbal Bio-Actives' }
  ]
};

export const DEFAULT_FLASH_SALE_SETTINGS: FlashSaleSettings = {
  enabled: true,
  productId: '',
  badgeTag: '',
  title: '',
  subtitle: '',
  customImage: '',
  flashPrice: 0,
  originalPrice: 0,
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  buttonText: 'SHOP NOW',
  showVideoSection: false,
  videoTitle: '',
  videoSubtitle: '',
  videoType: 'file',
  videoUrl: ''
};

export const DEFAULT_HIGHLIGHT_SPOTLIGHT_SETTINGS: HighlightSpotlightSettings = {
  enabled: true,
  targetType: 'product',
  productId: '',
  categoryName: '',
  badgeTag: '',
  title: '',
  subtitle: '',
  customImage: '',
  buttonText: 'BUY NOW',
  buttonLink: ''
};

export const DEFAULT_TESTIMONIAL_SETTINGS: TestimonialSectionSettings = {
  enabled: true,
  title: 'সম্মানিত গ্রাহকদের বাস্তব অভিজ্ঞতা',
  subtitle: 'ধানমন্ডি, বসুন্ধরা ও বনশ্রীসহ সারা দেশের গ্রাহকদের মতামত',
  autoScroll: true,
  scrollInterval: 5,
  showReviewsBadge: true,
  items: [
    {
      id: 'testim-1',
      name: 'সাদিয়া ইসলাম',
      designation: 'ধানমন্ডি, ঢাকা',
      avatarOrLogo: '',
      rating: 5,
      quote: 'ধানমন্ডির বাসায় আমাদের ফ্রন্ট লোড ওয়াশিং মেশিনে আগে গুঁড়া ডিটারজেন্ট ব্যবহার করায় ড্রামে আঠালো তলানি জমে সেন্সর সমস্যা করত। Leaf Curt 5-in-1 Pods ব্যবহার শুরুর পর ড্রাম একদম ঝকঝকে পরিষ্কার। আর কাপড় ধোয়ার পর যে অসাধারণ মিষ্টি সুবাস বের হয়, তা ৩-৪ দিন পর্যন্ত পোশাকে লেগেই থাকে। ট্রুলি বেস্ট চয়েস!',
      active: true
    },
    {
      id: 'testim-2',
      name: 'ফারহানা আফরোজ',
      designation: 'বসুন্ধরা আর/এ, ঢাকা',
      avatarOrLogo: '',
      rating: 5,
      quote: 'বসুন্ধরায় থাকি, ডেলিভারি অর্ডার করার পরদিনই পেয়েছি। ১টি পডেই ডিটারজেন্ট, সফটনার ও পারফিউম থাকায় আলাদা কিছু কেনার কোনো প্রয়োজন হয় না। বাচ্চাদের কাপড়ের চকোলেট আর খাবারের জেদি দাগ এক ওয়াশেই শেষ। কাপড়ের উজ্জ্বলতা একটুও নষ্ট হয় না। এক কথায় অসাধারণ!',
      active: true
    },
    {
      id: 'testim-3',
      name: 'নুসরাত জাহান',
      designation: 'বনশ্রী, ঢাকা',
      avatarOrLogo: '',
      rating: 5,
      quote: 'বনশ্রীতে আমাদের ফ্ল্যাটে কাপড় ধোয়া নিয়ে প্রতিদিন কাজের মানুষের সাবান ঢালার অপচয় নিয়ে খুব বিরক্ত ছিলাম। এই ক্যাপসুল পডস আসায় জীবন একদম সহজ হয়ে গেছে—১ লোডে ঠিক ১টি পড। সাবান মাপা বা নষ্ট হওয়ার কোনো সুযোগ নেই। কাপড়ে সুন্দর স্নিগ্ধ সুবাস থাকে।',
      active: true
    },
    {
      id: 'testim-4',
      name: 'তানহা তাবাসসুম',
      designation: 'উত্তরা, ঢাকা',
      avatarOrLogo: '',
      rating: 5,
      quote: 'প্রথমে ১টি বক্স নিয়েছিলাম ট্রায়াল হিসেবে। ওয়াশিং মেশিনের জন্য এটি যে কতটা দরকারি তা ব্যবহারের পরই বুঝেছি। বিশেষ করে সাদা কাপড় ও রঙিন কাপড়ে কোনো ধরনের সাদা পাউডারের গুঁড়ো দাগ লেগে থাকে না। পানির সাথে ১০০% গলে যায়। পুরো পরিবারের কাপড় এখন ফ্রেশ!',
      active: true
    },
    {
      id: 'testim-5',
      name: 'সাবরিনা সুলতানা',
      designation: 'গুলশান-২, ঢাকা',
      avatarOrLogo: '',
      rating: 5,
      quote: 'ইমপোর্টেড প্রিমিয়াম কোয়ালিটি পডস। কাপড়ের ফেব্রিক নষ্ট না করে নিখুঁতভাবে পরিষ্কার করে এবং ফ্রেঞ্চ পারফিউমের চমৎকার সুবাস দেয়। মেশিনের ভেতরের দুর্গন্ধও একদম দূর হয়ে গেছে। আমি সবাইকে এই 5-in-1 পডস ব্যবহারের পরামর্শ দিব।',
      active: true
    },
    {
      id: 'testim-6',
      name: 'মেহনাজ পারভীন',
      designation: 'মিরপুর ডিওএইচএস, ঢাকা',
      avatarOrLogo: '',
      rating: 5,
      quote: 'কাপড় ধোয়ার পর নরম ও মসৃণ থাকে, আলাদা কমফোর্ট সফটনার ব্যবহারের আর দরকার পড়ে না। ড্রামের ভেতর কোনো কাঁচা গুঁড়া সাবান জমে থাকে না। দ্রুত হোম ডেলিভারি ও পার্সেল চেক করে পেমেন্ট করার সুবিধা খুব ভালো লেগেছে।',
      active: true
    }
  ]
};

export const DEFAULT_CLIENT_LOGOS_SETTINGS: import('../types').ClientLogosSettings = {
  enabled: true,
  title: 'Brands That Love Us',
  bgColor: '#051c2c',
  items: [
    {
      id: 'brand-1',
      name: 'WashClub',
      logoUrl: '/authentic/brand_washclub.png',
      link: '',
      active: true
    },
    {
      id: 'brand-2',
      name: "Splash 'Em Out",
      logoUrl: '/authentic/brand_splash_em_out.png',
      link: '',
      active: true
    },
    {
      id: 'brand-3',
      name: "Cleaner's Supply",
      logoUrl: '/authentic/brand_cleaners_supply.png',
      link: '',
      active: true
    },
    {
      id: 'brand-4',
      name: 'Costco Wholesale',
      logoUrl: '/authentic/brand_costco.png',
      link: '',
      active: true
    },
    {
      id: 'brand-5',
      name: 'Bubbles Laundry Service',
      logoUrl: '/authentic/brand_bubbles.png',
      link: '',
      active: true
    },
    {
      id: 'brand-6',
      name: 'Columbus Express Laundry',
      logoUrl: '/authentic/brand_columbus.png',
      link: '',
      active: true
    }
  ]
};

export const DEFAULT_HERO_BANNERS: import('../types').HeroBannerItem[] = [];

export const DEFAULT_HEADER_SETTINGS: HeaderSettings = {
  showTopBar: false,
  phone: '',
  email: '',
  socialLinks: {
    facebook: '',
    youtube: '',
    instagram: '',
    linkedin: '',
    tiktok: '',
    whatsapp: ''
  },
  logoUrl: '',
  brandName: '',
  menuItems: [
    {
      id: 'menu-home',
      label: 'Home',
      link: '/',
      hasDropdown: false
    },
    {
      id: 'menu-shop',
      label: 'Shop',
      link: '/shop',
      hasDropdown: false
    },
    {
      id: 'menu-about',
      label: 'About Us',
      link: '/about',
      hasDropdown: false
    },
    {
      id: 'menu-blog',
      label: 'Blog',
      link: '/blog',
      hasDropdown: false
    },
    {
      id: 'menu-contact',
      label: 'Contact',
      link: '/contact',
      hasDropdown: false
    }
  ],
  ctaButtonText: '',
  ctaButtonLink: '',
  ctaActionType: 'link',
  showCtaButton: false,
  vipClubText: 'VIP Club',
  vipClubBadge: '',
  showVipButton: false,
  searchPlaceholder: 'Search...'
};

export const DEFAULT_BEFORE_AFTER_SETTINGS: import('../types').BeforeAfterSettings = {
  enabled: true,
  title: 'Ready to Upgrade Your Laundry Operation?',
  description: 'PowerPax™ capsules are built for commercial performance — no guesswork, no waste, just clean that performs.',
  beforeImage: '/authentic/before_stain.png',
  afterImage: '/authentic/after_clean.png',
  beforeBadge: 'BEFORE',
  afterBadge: 'AFTER',
  initialSliderPosition: 50,
  buttonText: 'Shop PowerPax™',
  buttonLink: '/shop',
  bullets: [
    {
      id: 'ba-1',
      title: 'Lower Cost Per Turn',
      description: 'Use less, save more with every load'
    },
    {
      id: 'ba-2',
      title: 'Mess-Free Precision',
      description: 'No pouring, no measuring, just drop and go'
    },
    {
      id: 'ba-3',
      title: 'Eco-Safe Formula',
      description: 'Safe for skin, safe for the planet'
    },
    {
      id: 'ba-4',
      title: 'Cleaner results across all machine types',
      description: ''
    }
  ]
};

export const DEFAULT_PHOTO_REVIEWS_SETTINGS: import('../types').PhotoReviewsSettings = {
  enabled: true,
  title: 'See What Customers Are Saying',
  overallRating: 4.76,
  totalReviewsCount: 268,
  isVerifiedBadge: true,
  items: [
    {
      id: 'pr-1',
      name: 'Gus',
      isVerified: true,
      rating: 5,
      quote: 'Love the smell, keeps us efficient by just dropping the...',
      photoUrl: '/authentic/photo_review_gus.png',
      productTag: 'Power Pellets...',
      active: true
    },
    {
      id: 'pr-2',
      name: 'Leonard',
      isVerified: true,
      rating: 5,
      quote: 'These pods really work. I now used them exclusively for..',
      photoUrl: '/authentic/photo_review_leonard.png',
      productTag: 'Laundry Labs',
      active: true
    },
    {
      id: 'pr-3',
      name: 'Lari',
      isVerified: true,
      rating: 5,
      quote: 'Love your product. Its too spendy for me but for those...',
      photoUrl: '/authentic/photo_review_lari.png',
      productTag: 'PowerPax™ Clean...',
      active: true
    },
    {
      id: 'pr-4',
      name: 'Jason',
      isVerified: true,
      rating: 5,
      quote: "I'm actually (pleasantly) surprised that these actually..",
      photoUrl: '/authentic/photo_review_jason.png',
      productTag: 'Athletic Pax – High...',
      active: true
    },
    {
      id: 'pr-5',
      name: 'Cortney',
      isVerified: true,
      rating: 5,
      quote: 'Not only have we fallen in love with the brand and product,...',
      photoUrl: '/authentic/photo_review_cortney.png',
      productTag: 'PowerPax™ 100ct...',
      active: true
    }
  ]
};

export const DEFAULT_VIDEO_REVIEWS_SETTINGS: import('../types').VideoReviewsSettings = {
  enabled: true,
  badge: '',
  title: 'What About Our Product',
  description: '',
  buttonText: '',
  buttonLink: '',
  items: []
};

export const DEFAULT_FAQ_SETTINGS: import('../types').FaqSectionSettings = {
  enabled: true,
  title: 'সচরাচর জিজ্ঞাসিত প্রশ্নাবলী (FAQ)',
  subtitle: 'আমাদের লন্ড্রি পডস, ব্যবহার বিধি এবং অর্ডার সংক্রান্ত যেকোনো তথ্যের জন্য নিচের উত্তরগুলো দেখুন',
  bgColor: '#0a3866',
  items: [
    {
      id: 'faq-1',
      question: 'লন্ড্রি পডস (Laundry Pods) কী এবং এর মূল সুবিধাগুলো কী কী?',
      answer: "লন্ড্রি পডস হলো একটি আধুনিক ৫-ইন-১ লন্ড্রি সমাধান। এতে এক পণ্যেই রয়েছে শক্তিশালী ডিটারজেন্ট, ক্ষতিকর ব্যাকটেরিয়া ও জীবাণুনাশক, ফেব্রিক সফটেনার, দীর্ঘস্থায়ী মনোমুগ্ধকর সুবাস এবং বিশেষায়িত ব্লেন্ডেড এনজাইম। কঠিন ময়লা ও দাগ পরিষ্কারের পাশাপাশি এটি কাপড়কে করে কোমল ও সুগন্ধিময়।",
      active: true
    },
    {
      id: 'faq-2',
      question: 'লন্ড্রি পডস কীভাবে ব্যবহার করতে হয়?',
      answer: 'ব্যবহার অত্যন্ত সহজ ও ঝামেলাহীন! কোনো মাপা বা ঢালার প্রয়োজন নেই। প্রথমে ওয়াশিং মেশিনের ড্রামের ভেতর ১টি পড সরাসরি রেখে দিন। এরপর কাপড় দিয়ে মেশিন চালু করে দিন। পানির সংস্পর্শে পডের পাতলা আবরণ সম্পূর্ণ গলে গিয়ে নিজে থেকেই নিখুঁতভাবে কাপড় পরিষ্কার করে।',
      active: true
    },
    {
      id: 'faq-3',
      question: 'এটি কি সব ধরণের ওয়াশিং মেশিন এবং কাপড়ের জন্য নিরাপদ?',
      answer: 'হ্যাঁ, এটি ফ্রন্ট-লোড, টপ-লোড ও সেমি-অটোমেটিক সহ সব ধরণের ওয়াশিং মেশিনের জন্য শতভাগ নিরাপদ। এছাড়া এর Neutral pH ফর্মুলা কাপড়ের রঙ ও তন্তুর কোনো ক্ষতি না করে দীর্ঘস্থায়ী উজ্জ্বলতা বজায় রাখে।',
      active: true
    },
    {
      id: 'faq-4',
      question: 'ঘামের তীব্র দুর্গন্ধ ও কঠিন দাগ কি এটি দূর করতে পারে?',
      answer: 'অবশ্যই! আমাদের পডসে রয়েছে উন্নত Odor-Fighting Technology এবং ৫ ধরনের বিশেষায়িত প্রাকৃতিক বায়ো-এনজাইম। এটি কাপড়ের তন্তুর গভীরে প্রবেশ করে ঘামের দুর্গন্ধের মূল কারণ দূর করে এবং চা, কফি, তেল বা খাবারের কঠিন দাগ দ্রুত আলগা করে পরিষ্কার করে।',
      active: true
    },
    {
      id: 'faq-5',
      question: 'এতে কি কোনো ক্ষতিকারক কেমিক্যাল বা ব্লিচিং এজেন্ট আছে?',
      answer: 'একেবারেই না। আমাদের পণ্যটি সম্পূর্ণ Fluorescent Brightener, ফসফরাস ও ক্লোরিন ব্লিচিং এজেন্ট মুক্ত। ফলে কাপড়ে অনাকাঙ্ক্ষিত কোনো রাসায়নিক অবশিষ্টাংশ থাকে না এবং পরিবেশের কোনো ক্ষতি হয় না।',
      active: true
    },
    {
      id: 'faq-6',
      question: 'সংবেদনশীল (সেনসিটিভ) ত্বক ও বাচ্চাদের কাপড়ে কি এটি ব্যবহার করা যাবে?',
      answer: 'হ্যাঁ, সম্পূর্ণ নিরাপদ। এর স্কিন-ফ্রেন্ডলি Neutral pH ফর্মুলা ত্বকে কোনো রকম জ্বালাপোড়া বা অ্যালার্জি সৃষ্টি করে না। এটি পরিবার ও বাচ্চাদের কাপড়ের জন্যও অত্যন্ত আরামদায়ক ও নিরাপদ।',
      active: true
    },
    {
      id: 'faq-7',
      question: 'পডগুলো কি চাপ লাগলে ফেটে যাওয়ার ভয় থাকে?',
      answer: 'না, আমাদের প্রতিটি পড উন্নত প্রযুক্তিতে তৈরি এবং ৬০০ নিউটন (600N) পর্যন্ত বাহ্যিক চাপ সহ্য করতে পারে। তাই ডেলিভারির সময় বা সাধারণ সংরক্ষণে এটি ফেটে যাওয়ার কোনো সম্ভাবনা নেই।',
      active: true
    },
    {
      id: 'faq-8',
      question: 'অর্ডার করার পর ডেলিভারি পেতে কতদিন সময় লাগে এবং ক্যাশ অন ডেলিভারি কি আছে?',
      answer: 'সারা বাংলাদেশে আমরা দ্রুত হোম ডেলিভারি নিশ্চিত করি। ঢাকা সিটির ভেতরে সাধারণত ২৪ থেকে ৪৮ ঘণ্টার মধ্যে এবং ঢাকার বাইরে ২ থেকে ৩ কার্যদিবসের মধ্যে ডেলিভারি সম্পন্ন হয়। এছাড়া পণ্য হাতে পেয়ে মূল্য পরিশোধের সুবিধার্থে ক্যাশ অন ডেলিভারি (Cash on Delivery) ব্যবস্থা রয়েছে।',
      active: true
    }
  ]
};

export const BANGLADESHI_FEMALE_CART_REVIEWS: import('../types').CartReviewSettings[] = [
  {
    enabled: true,
    reviewerName: 'সাদিয়া ইসলাম',
    location: 'ধানমন্ডি, ঢাকা',
    isVerified: true,
    reviewDate: 'গতকাল',
    rating: 5,
    comment: 'ধানমন্ডির বাসায় আমাদের ফ্রন্ট লোড ওয়াশিং মেশিনে Leaf Curt 5-in-1 Pods ব্যবহার করে খুব খুশি। গুঁড়া সাবানের সাদা আঠালো দাগ একদম নেই, আর কাপড়ে ৩-৪ দিন মিষ্টি সুবাস থাকে।',
    photoUrl: '',
    productTitle: 'Leaf Curt 5-in-1 Laundry Detergent Pods',
    productImage: ''
  },
  {
    enabled: true,
    reviewerName: 'ফারহানা আফরোজ',
    location: 'বসুন্ধরা আর/এ, ঢাকা',
    isVerified: true,
    reviewDate: '২ দিন আগে',
    rating: 5,
    comment: 'বসুন্ধরায় দ্রুত ডেলিভারি পেয়েছি। ১ পডেই ডিটারজেন্ট, সফটনার ও পারফিউম থাকায় আলাদা বোতল কেনার ঝামেলা শেষ। বাচ্চাদের কাপড়ের কঠিন দাগ সহজে উঠে যায়।',
    photoUrl: '',
    productTitle: 'Leaf Curt 5-in-1 Laundry Detergent Pods',
    productImage: ''
  },
  {
    enabled: true,
    reviewerName: 'নুসরাত জাহান',
    location: 'বনশ্রী, ঢাকা',
    isVerified: true,
    reviewDate: '৩ দিন আগে',
    rating: 5,
    comment: 'বনশ্রীতে আমাদের ফ্ল্যাটে কাপড় ধোয়ায় সাবানের অপচয় একদম জিরো হয়ে গেছে। ১ লোডে ১টি পড দিলেই যথেষ্ট। কাপড় ভীষণ নরম ও ফ্রেশ থাকে।',
    photoUrl: '',
    productTitle: 'Leaf Curt 5-in-1 Laundry Detergent Pods',
    productImage: ''
  },
  {
    enabled: true,
    reviewerName: 'তানহা তাবাসসুম',
    location: 'উত্তরা, ঢাকা',
    isVerified: true,
    reviewDate: '৪ দিন আগে',
    rating: 5,
    comment: 'প্রথমে ট্রাই করার জন্য ১ বক্স নিয়েছিলাম। কোয়ালিটি দেখে মুগ্ধ হয়ে এখন বড় ফ্যামিলি টাব প্যাক অর্ডার করলাম। ওয়াশিং মেশিনের ড্রাম একদম সুরক্ষিত রাখে।',
    photoUrl: '',
    productTitle: 'Leaf Curt 5-in-1 Laundry Detergent Pods',
    productImage: ''
  },
  {
    enabled: true,
    reviewerName: 'সাবরিনা সুলতানা',
    location: 'গুলশান-২, ঢাকা',
    isVerified: true,
    reviewDate: '১ সপ্তাহ আগে',
    rating: 5,
    comment: 'Best laundry detergent pods in Bangladesh! কাপড়ের উজ্জ্বলতা বা কালার একটুও নষ্ট হয় না। ডেলিভারিও খুব দ্রুত পেয়েছি।',
    photoUrl: '',
    productTitle: 'Leaf Curt 5-in-1 Laundry Detergent Pods',
    productImage: ''
  },
  {
    enabled: true,
    reviewerName: 'মেহনাজ পারভীন',
    location: 'মিরপুর ডিওএইচএস, ঢাকা',
    isVerified: true,
    reviewDate: '৫ দিন আগে',
    rating: 5,
    comment: 'ওয়াশিং মেশিনে কাপড় ধোয়া এখন অনেক সহজ। কাপড়গুলো চমৎকার নরম ও ফ্রেশ থাকে, কোনো আলাদা কমফোর্ট সফটনার লাগে না।',
    photoUrl: '',
    productTitle: 'Leaf Curt 5-in-1 Laundry Detergent Pods',
    productImage: ''
  }
];

export const DEFAULT_CART_REVIEW_SETTINGS: import('../types').CartReviewSettings = BANGLADESHI_FEMALE_CART_REVIEWS[0];

export const DEFAULT_BLOG_POSTS: BlogPost[] = [];


export const DEFAULT_ECOM_SETTINGS: EcomSettings = {
  headerSettings: DEFAULT_HEADER_SETTINGS,
  storeName: '',
  companyName: '',
  storeLogo: '',
  storeTagline: '',
  topAnnouncementText: '',
  contactEmail: '',
  contactPhone: '',
  storeAddress: '',
  footerDescription: '',
  socialLinks: {
    facebook: '',
    instagram: '',
    youtube: '',
    twitter: '',
    tiktok: '',
    linkedin: '',
    whatsapp: ''
  },
  primaryColor: '#0284c7',
  gtmId: '',
  deliveryChargeInsideDhaka: 60,
  deliveryChargeOutsideDhaka: 110,
  freeDeliveryMinPurchase: 450,
  bkashNumber: '',
  nagadNumber: '',
  paymentGateways: DEFAULT_PAYMENT_GATEWAYS,
  deliveryMethods: DEFAULT_DELIVERY_METHODS,
  categories: [],
  heroBanners: [],
  promoCards: [],
  showViewCountOnWebsite: true,
  websiteViewsCount: 14200,
  landingViewsCount: 8900,
  aboutSettings: DEFAULT_ABOUT_SETTINGS,
  flashSale: DEFAULT_FLASH_SALE_SETTINGS,
  highlightSpotlight: DEFAULT_HIGHLIGHT_SPOTLIGHT_SETTINGS,
  beforeAfter: DEFAULT_BEFORE_AFTER_SETTINGS,
  testimonials: DEFAULT_TESTIMONIAL_SETTINGS,
  clientLogos: DEFAULT_CLIENT_LOGOS_SETTINGS,
  photoReviews: DEFAULT_PHOTO_REVIEWS_SETTINGS,
  videoReviews: DEFAULT_VIDEO_REVIEWS_SETTINGS,
  faqs: DEFAULT_FAQ_SETTINGS,
  cartReview: DEFAULT_CART_REVIEW_SETTINGS,
  blogPosts: DEFAULT_BLOG_POSTS
};

export const DEFAULT_INSTITUTE_INFO: InstituteInfo = {
  name: 'Leaf Curt',
  logo: '/uploads/file-1792735476267-28104613.webp',
  regNo: '',
  phone: '01635311494',
  email: 'armtrading16@gmail.com',
  address: 'Banasree, Dhaka, Bangladesh',
  street: 'Banasree, Dhaka, Bangladesh',
  description: 'Leaf Curt - Premium Online Shopping Destination.',
  industry: 'Laundry & Home Care',
  bearingRollLocation: 'Dhaka'
};

export const DEFAULT_LANDING_PAGE_SETTINGS: import('../types').LandingPageData = {
  id: 'landing-default',
  slug: 'vb5-repair-serum',
  templateTheme: 'luxury_dark',
  bookTitle: 'Premium Featured Product',
  bookSubtitle: 'High Performance & Verified Quality Assurance',
  authorName: 'Official Store',
  authorDesignation: 'Verified Quality Assurance',
  authorPhoto: '',
  mainBookImage: '',
  heroBookImage: '',
  logoUrl: '',
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
  variantSectionSubtitle: 'একক বক্স অথবা কম্বো ফ্যামিলি টাব প্যাকের আকর্ষণীয় সাশ্রয়ী অফার',
  customVariants: [
    {
      id: 'var-single',
      name: 'Leaf Curt ৩-ইন-১ লন্ড্রি পড — ১ বক্স (৩০ পিস)',
      image: '/authentic/cart_upsell_box.png',
      price: 450,
      regularPrice: 550,
      tag: 'Best Seller'
    },
    {
      id: 'var-duo',
      name: 'Leaf Curt ৫-ইন-১ লন্ড্রি পড — ১ ফ্যামিলি টাব (৬০ পিস)',
      image: '/authentic/cart_upsell_tub.png',
      price: 790,
      regularPrice: 990,
      tag: 'Save Tk.200'
    }
  ],
  watchSpecs: [
    { label: 'ফর্মুলেশন', value: '৫ বিশেষায়িত বায়ো-এনজাইম ও ফ্যাব্রিক সফটেনার' },
    { label: 'প্রধান সুবিধা', value: 'ডিটারজেন্ট + ব্যাকটেরিয়া অপসারণ + সুবাস + সফটেনার' },
    { label: 'কাপড়ের ধরন', value: 'সাদা, রঙিন ও সব ধরনের পোশাকে নিরাপদ' },
    { label: 'কার্যকারিতা', value: 'কঠিন দাগ দূর করে ও দীর্ঘস্থায়ী মনোমুগ্ধকর সুবাস রাখে' },
    { label: 'নিরাপত্তা', value: 'Fluorescent Brightener, ফসফরাস ও ব্লিচ মুক্ত' },
    { label: 'স্থায়িত্ব', value: '৬০০N পর্যন্ত চাপ সহনশীল ও ১০০% ওয়াটার সলিউবল' }
  ],
  features: [
    '১টি পডেই ৫টি শক্তিশালী সুবিধা (ক্লিনিং, সফটেনার, ফ্র্যাগ্রেন্স, স্টেইন রিমুভাল, হাইজিন)',
    '৯৯.৯% ব্যাকটেরিয়া ও জীবাণু দূর করে কাপড় রাখে সম্পূর্ণ পরিষ্কার ও নিরাপদ',
    'Neutral pH ফর্মুলা—ত্বকের জন্য কোমল এবং অ্যালার্জি সৃষ্টি করে না',
    'কম পানিতে বেশি পরিষ্কার—কাপড়ে কোনো বাড়তি সাবানের আস্তরণ থাকে না',
    'পণ্য হাতে পেয়ে চেক করে সম্পূর্ণ মূল্য পরিশোধের সুবিধা (Cash on Delivery)'
  ],
  reviews: [
    { name: 'তানভীর আহমেদ', comment: 'অসাধারণ কোয়ালিটি! ট্রিপল চেম্বার পড হওয়ায় কাপড় চমৎকার পরিষ্কার হয় এবং পারফিউমের মতো মিষ্টি সুবাস অনেকদিন থাকে।', rating: 5 },
    { name: 'সানজিদা ইসলাম', comment: 'ওয়াশিং মেশিনে ব্যবহার করা খুব সহজ। কাপড়ের রঙ নষ্ট হয় না এবং স্প্যাগেটি ও ঘামের কঠিন দাগ সহজেই উঠে যায়।', rating: 5 },
    { name: 'ফারহানা জামান', comment: 'কম পানিতে সুন্দর ফেনা ও দ্রুত ওয়াশ হয়ে যায়। কাপড় নরম ও চমৎকার সুবাসিত থাকে।', rating: 5 }
  ],
  relatedProductIds: [],
  galleryImages: [
    '/authentic/pod_triple_chamber_main.png',
    '/authentic/pod_packaging_boxes.png',
    '/authentic/thumb_1_overview.png',
    '/authentic/thumb_2_style1_red.png'
  ],
  paymentMethodDefault: 'COD',
  onlyCashOnDelivery: true,
  vintageTag: 'Leaf Curt লন্ড্রি কেয়ার',
  vintageTitle: 'স্মার্ট লন্ড্রি, সতেজ জীবন',
  vintageDescription: 'আধুনিক ৫ বায়ো-এনজাইম টেকনোলজি ও ইউরোপিয়ান কোয়ালিটির মেলবন্ধন।',
  vintageFeatures: [
    { id: 'vf-1', title: '৫-ইন-১ ফর্মুলা', subtitle: 'ক্লিনিং, সফটেনার ও হাইজিন একসাথে', icon: 'ShieldCheck' },
    { id: 'vf-2', title: 'দীর্ঘস্থায়ী সুবাস', subtitle: 'কাপড়ে মনোমুগ্ধকর সতেজ অনুভূতি', icon: 'Sparkles' },
    { id: 'vf-3', title: 'গভীর পরিষ্কার', subtitle: 'তন্তুর ভেতর থেকে কঠিন দাগ অপসারণ', icon: 'Zap' },
    { id: 'vf-4', title: 'ত্বকবান্ধব', subtitle: 'ফসফরাস ও ব্লিচিং এজেন্ট মুক্ত', icon: 'CheckCircle2' }
  ],
  gallerySectionTag: 'গ্যালারি',
  gallerySectionTitle: 'আসল Leaf Curt কোয়ালিটি ও ডিজাইন',
  qualitySectionTag: 'কেন Leaf Curt?',
  qualitySectionTitle: 'প্রিমিয়াম কোয়ালিটি, সাশ্রয়ী দাম ও উন্নত হাইজিন',
  qualityItems: [
    { id: 'qi-1', title: 'ল্যাবরেটরি টেস্টেড', subtitle: '৯৯.৯% ব্যাকটেরিয়া দূর করার সক্ষমতা', icon: 'Settings' },
    { id: 'qi-2', title: 'ইকো-ফ্রেন্ডলি', subtitle: 'কম পানিতে বেশি কার্যকর ও পরিবেশবান্ধব', icon: 'Trophy' }
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

export const createDefaultLandingForProduct = (product: Product): import('../types').LandingPageData => {
  const slug = product.slug || product.id;
  const prodImg = product.coverImage || product.image || (product.images && product.images[0]) || '/authentic/pod_triple_chamber_main.png';
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
    bookSubtitle: product.subtitle || product.shortSummary || product.title,
    authorName: product.authorName || product.author || product.brand || 'Official Store',
    authorDesignation: 'Verified Quality Guarantee',
    authorPhoto: prodImg,
    mainBookImage: prodImg,
    heroBookImage: prodImg,
    logoUrl: '',
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

export const DEFAULT_VIP_TIERS: VipTier[] = [
  {
    id: 'tier-silver',
    name: 'Silver Member',
    levelOrder: 1,
    minLifetimeSpend: 5000,
    billDiscountPercent: 5,
    pointMultiplier: 1.2,
    perks: '৫% বিল ডিসকাউন্ট, ১.২x রিওয়ার্ড পয়েন্ট, ফ্রি রিটার্ন সাপোর্ট',
    status: 'Active',
    cardColor: '#0a3866',
    updatedAt: 'Oct 21, 2026'
  },
  {
    id: 'tier-gold',
    name: 'Gold VIP',
    levelOrder: 2,
    minLifetimeSpend: 15000,
    billDiscountPercent: 10,
    pointMultiplier: 1.5,
    perks: '১০% গ্যারান্টিড বিল ডিসকাউন্ট, ১.৫x পয়েন্ট ক্যাশব্যাক, বার্থডে গিফট ভাউচার, প্রায়োরিটি শিপিং',
    status: 'Active',
    cardColor: '#831843',
    updatedAt: 'Oct 21, 2026'
  },
  {
    id: 'tier-platinum',
    name: 'Platinum Royal',
    levelOrder: 3,
    minLifetimeSpend: 30000,
    billDiscountPercent: 15,
    pointMultiplier: 2.0,
    perks: '১৫% মেগা ডিসকাউন্ট, ২.০x ডাবল ক্যাশব্যাক পয়েন্ট, প্রতিটি অর্ডারে ফ্রি ডেলিভারি, ডেডিকেটেড ভিআইপি হেল্পলাইন',
    status: 'Active',
    cardColor: '#064e3b',
    updatedAt: 'Oct 21, 2026'
  }
];

export const DEFAULT_DIGITAL_LOYALTY_CARDS: DigitalLoyaltyCard[] = [
  {
    id: 'card-default-vip',
    title: 'VIP Club Card',
    cardColor: '#0a3866',
    forSpend: 100,
    earnPoints: 5,
    pointValueTaka: 1,
    validityDays: 365,
    cardType: 'Phone Wallet Pass',
    status: 'Active',
    updatedAt: 'Oct 21, 2026'
  }
];

