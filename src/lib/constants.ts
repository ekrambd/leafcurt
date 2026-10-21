import { 
  Product, Coupon, Brand, 
  PaymentGatewayItem, DeliveryMethodItem, HeroBannerItem, PromoCardItem, 
  EcomSettings, InstituteInfo, FlashSaleSettings, HighlightSpotlightSettings,
  HeaderSettings, HeaderMenuItem, VipTier, DigitalLoyaltyCard, ClubMember 
} from '../types';

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: '3-in-1-laundry-detergent-pods',
    title: '3-in-1 Laundry Detergent Pods',
    subtitle: 'Modern Triple-Chamber Design - Deep Cleaning & Long-Lasting Fragrance',
    slug: '3-in-1-laundry-detergent-pods',
    author: 'AUTHENTIC',
    authorName: 'AUTHENTIC Factory',
    brand: 'AUTHENTIC',
    brandId: 'brand-authentic',
    category: 'Laundry Detergent Pods',
    subCategory: 'Triple-Chamber Pods',
    series: '3-in-1 Detergent Pods',
    regularPrice: 35.0,
    price: 25.0,
    discountPercentage: 28,
    stockQuantity: 500000,
    isAvailable: true,
    isFeatured: true,
    coverImage: '/authentic/pod_triple_chamber_main.png',
    images: [
      '/authentic/pod_triple_chamber_main.png',
      '/authentic/pod_packaging_boxes.png',
      '/authentic/thumb_1_overview.png',
      '/authentic/thumb_2_style1_red.png',
      '/authentic/thumb_3_style2_heart.png',
      '/authentic/thumb_4_style3_beads.png',
      '/authentic/thumb_5_style4_green.png'
    ],
    additionalImages: [
      '/authentic/pod_packaging_boxes.png',
      '/authentic/thumb_1_overview.png',
      '/authentic/thumb_2_style1_red.png',
      '/authentic/thumb_3_style2_heart.png',
      '/authentic/thumb_4_style3_beads.png',
      '/authentic/thumb_5_style4_green.png'
    ],
    weightBadge: 'Basis weight: 25g/pcs',
    capacityBadge: '1 pod ~24-28pcs clothes',
    sizeBadge: 'Size: 6*6*2cm',
    bottomBannerBadge: 'Custom formula, color, and scent.',
    hasVideo: true,
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-liquid-soap-bubble-close-up-view-40763-large.mp4',
    videoType: 'mp4',
    videoTitle: 'Authentic 3-in-1 Laundry Pods Manufacturing & Quality Demonstration',
    videoPoster: '/authentic/pod_packaging_boxes.png',
    videoDescription: 'Watch how Authentic manufactures 3-in-1 triple-chamber laundry pods with high-speed automated PVA film sealing, multi-stage fragrance microencapsulation, and strict 5-stage quality testing.',
    galleryAutoScroll: true,
    galleryScrollInterval: 4,
    moq: 'OEM/ODM Starting from 100,000 Pcs',
    sampleService: 'Stock Samples Available; Custom Samples Developed Based on Project Requirements',
    oemService: 'Formula + Fragrance + Pod Structure + Shape + Weight + Color + Packaging + Label',
    whatsappNumber: '+8618027300683',
    whatsappMessage: 'Hello Authentic! I would like to get a quote for 3-in-1 Laundry Detergent Pods.',
    contactEmail: 'authentic.factory@outlook.com',
    facebookUrl: 'https://facebook.com',
    linkedinUrl: 'https://linkedin.com',
    specTable: [
      { feature: 'Recommended Laundry Load', details: '8g: Approx. 2–4 kg\n10g: Approx. 3–5 kg\n25g: Approx. 8–12 kg' },
      { feature: 'Function', details: 'Deep Cleaning / Stain Removal / Antibacterial / Anti-Mite / Fabric Softening / Color Protection / Long-Lasting Fragrance / Odor Control / Hypoallergenic / Customized Functions' },
      { feature: 'Fragrance', details: 'Sweet Peach / green fruit / Sandhill / Rose Feast / Customized' },
      { feature: 'MOQ', details: 'OEM/ODM Starting from 100,000 Pcs' },
      { feature: 'Sample Service', details: 'Stock Samples Available; Custom Samples Developed Based on Project Requirements' },
      { feature: 'OEM Service', details: 'Formula + Fragrance + Pod Structure + Shape + Weight + Color + Packaging + Label' }
    ],
    specificationsList: [
      {
        title: '1. Flexible 3-In-1 Laundry Solution',
        description: 'Three-Chamber Laundry Pods For Brands, Importers, Distributors And Private-Label Customers. Custom Options Support Everyday Laundry, Baby Care, Pet Care, Sportswear And Commercial Use.'
      },
      {
        title: '2. Multiple Pod Weights & Dosage',
        description: 'Available In 8g, 10g And 25g Sizes. One 10g Pod Is Recommended For Approximately 3–5 Kg Of Laundry, With Dosage Varying By Formula, Soil Level And Washing Conditions.'
      },
      {
        title: '3. Customizable Formulas & Functions',
        description: 'Core Functions Include Deep Cleaning, Anti-Mite Care And Long-Lasting Fragrance. Combine Liquid, Powder Or Fragrance Beads, With Customized Additives Available For Specific Projects.'
      },
      {
        title: '4. Fragrance Options',
        description: 'Choose From Sweet Peach, Green Fruity, Sandhill, Rose Feast Or Custom Scents. Fragrance Direction And Intensity Can Be Tailored To Regional Preferences And Brand Positioning.'
      },
      {
        title: '5. Custom Packaging & Design',
        description: 'Available In Boxes, Pouches, Tubs, Jars Or Buckets, Including Child-Resistant, Recyclable And Plastic-Free Options. In-House Design Support Covers Multilingual Labels And Brand Visuals.'
      },
      {
        title: '6. OEM/ODM Support & Production',
        description: 'Customize Pod Structure, Shape, Weight, Color, Formula, Fragrance, Packaging And Labels. Standard Starting Quantity: 100,000 Pieces. Stock And Custom Samples Are Available; Production Takes Approximately 20–30 Days After Sample Approval And Deposit, Depending On Order Requirements.'
      }
    ],
    keyFeatureCards: [
      {
        icon: 'globe',
        title: 'Global Fragrance Partnerships & Custom Development',
        subtitle: 'Co-Developed Fragrances with Leading Global Suppliers',
        description: 'Through long-term collaboration with leading global fragrance suppliers, including Givaudan and Firmenich, our team has jointly developed a wide range of popular fragrance solutions for laundry products. From floral and fruity to fresh and sophisticated perfume-inspired profiles, fragrance type and intensity can be customized to meet different brand positioning and market preferences.'
      },
      {
        icon: 'clock',
        title: '72 Hours To 1 Week Fragrance Retention',
        subtitle: 'Multi-Stage Testing for Long-Lasting Fragrance',
        description: 'Our laboratory team conducts multiple fragrance performance and retention tests to evaluate and optimize scent performance on fabrics. Depending on the fragrance system, formula and usage conditions, fragrance retention on fabrics can reach approximately 72 hours to 1 week, supporting the development of long-lasting fragrance laundry pods for different market requirements.'
      },
      {
        icon: 'box',
        title: '3 Billion Pods Annual Production Capacity',
        subtitle: 'Automated Manufacturing Built for High-Volume Orders',
        description: 'With an annual laundry pod production capacity of up to 3 billion pieces, Authentic is equipped with fully automated production lines and automated manufacturing equipment covering key production processes. Our scalable production system supports customized OEM/ODM projects and high-volume orders for global brands, importers and distributors.'
      },
      {
        icon: 'check',
        title: '5-Stage Quality Control',
        subtitle: 'Quality Control Throughout the Manufacturing Process',
        description: 'Our 5-stage quality control process covers key stages from raw materials and production to finished product inspection. Supported by laboratory testing and 100% batch inspection, our QC system helps maintain consistent product quality across OEM/ODM production.'
      }
    ],
    description: 'Flexible 3-In-1 Laundry Solution. Three-Chamber Laundry Pods For Brands, Importers, Distributors And Private-Label Customers. Custom Options Support Everyday Laundry, Baby Care, Pet Care, Sportswear And Commercial Use.'
  },
  {
    id: 'prod-vb5-repair-serum',
    title: 'VB5 Repair Serum',
    author: 'FANTINE Korea',
    authorName: 'FANTINE Korea',
    brand: 'FANTINE',
    brandId: 'brand-fantine',
    regularPrice: 1800,
    price: 1550,
    discountPercentage: 14,
    stockQuantity: 100,
    category: 'Serums',
    series: 'Ultra Repair Series',
    coverImage: '/uploads/file-1791830876714-429462367.jpg',
    images: [
      '/uploads/file-1791830876714-429462367.jpg',
      '/uploads/file-1791830880605-206422960.jpeg',
      '/uploads/file-1791830885183-155996593.jpeg'
    ],
    additionalImages: [
      '/uploads/file-1791830880605-206422960.jpeg',
      '/uploads/file-1791830885183-155996593.jpeg'
    ],
    description: `Intensive Provitamin B5 (D-Panthenol) and Centella Asiatica calming serum. Rapidly relieves skin redness, soothes allergic reactions, repairs weakened moisture barrier, and locks deep hydration into sensitized facial skin.

পণ্যের বিবরণ:
উচ্চ বিশুদ্ধতার প্রো-ভিটামিন বি৫ (ডি-প্যান্থেনল) ও সেন্টেলা সমৃদ্ধ ইনটেনসিভ রিপেয়ারিং সিরাম। এটি সংবেদনশীল ও ক্ষতিগ্রস্ত ত্বকের জ্বালাপোড়া ও লালচে ভাব তাৎক্ষণিকভাবে দূর করে, ত্বকের প্রাকৃতিক সুরক্ষা স্তর (Skin Barrier) মজবুত করে এবং দীর্ঘস্থায়ী আর্দ্রতা নিশ্চিত করে।`,
    benefitsHighlights: `Pure Provitamin B5 (D-Panthenol),
Rapid barrier repair & soothing,
Reduces irritation & redness,
Deep cellular moisture lock.

⭐ Overall
• 🎯 Barrier Restoration: 9.5/10
• 🛡️ Redness & Soothing: 9.8/10
• 💧 Deep Hydration: 9.0/10
• 🧴 Barrier Defense: 9.2/10
• ✨ Gentle Tolerance: 10/10

প্রধান সুবিধাসমূহ:
বিশুদ্ধ প্রো-ভিটামিন বি৫ (D-Panthenol),
ত্বকের ড্যামেজড ব্যারিয়ার দ্রুত মেরামত,
রেডনেস ও প্রদাহ উপশম,
গভীর আর্দ্রতা ধারণ ক্ষমতা।

⭐ সামগ্রিক মূল্যায়ন
🎯 ত্বক মেরামত / ব্যারিয়ার সুরক্ষা: ৯.৫/১০
🛡️ লালচে ভাব ও জ্বালাপোড়া দূর: ৯.৮/১০
💧 গভীর আর্দ্রতা (Hydration): ৯.০/১০
🧴 পুষ্টি ও ত্বকের ঢাল: ৯.২/১০
✨ সংবেদনশীল ত্বকে শতভাগ নিরাপদ: ১০/১০`,
    howToUse: `After cleansing and toning in the morning and evening, dispense 2-3 drops onto fingertips and gently pat over face and neck until fully absorbed. Follow with moisturizer.

ব্যবহারবিধি:
সকাল ও সন্ধ্যায় ত্বক পরিষ্কার ও টোনার ব্যবহারের পর, ২-৩ ফোঁটা সিরাম আঙুলে নিয়ে পুরো মুখ ও গলায় আলতোভাবে চেপে চেপে লাগিয়ে দিন। এরপর ময়েশ্চারাইজার ব্যবহার করুন।`,
    howToUseIt: `After cleansing and toning in the morning and evening, dispense 2-3 drops onto fingertips and gently pat over face and neck until fully absorbed. Follow with moisturizer.

ব্যবহারবিধি:
সকাল ও সন্ধ্যায় ত্বক পরিষ্কার ও টোনার ব্যবহারের পর, ২-৩ ফোঁটা সিরাম আঙুলে নিয়ে পুরো মুখ ও গলায় আলতোভাবে চেপে চেপে লাগিয়ে দিন। এরপর ময়েশ্চারাইজার ব্যবহার করুন।`,
    ingredients: `WATER, PANTHENOL (PROVITAMIN B5), GLYCERIN, BUTYLENE GLYCOL, MADECASSOSIDE, CENTELLA ASIATICA EXTRACT, SODIUM HYALURONATE, CERAMIDE NP, ALLANTOIN, BETA-GLUCAN, 1,2-HEXANEDIOL, ETHYLHEXYLGLYCERIN, CARBOMER, ARGININE.

উপাদানসমূহ: পানি, প্যান্থেনল (প্রো-ভিটামিন বি৫), গ্লিসারিন, বিউটিলিন গ্লাইকল, ম্যাডেক্যাসোসাইড, সেন্টেলা এশিয়াটিকা নির্যাস, সোডিয়াম হায়ালুরোনেট, সিরামাইড এনপি, অ্যালানটয়েন, বিটা-গ্লুকান, ১,২-হেক্সেনডিওল।`,
    badge: 'Best Seller',
    isFeatured: true
  },
  {
    id: 'prod-vc-brightening-serum',
    title: 'VC Brightening Serum',
    author: 'FANTINE Korea',
    regularPrice: 2200,
    price: 1350,
    discountPercentage: 39,
    stockQuantity: 100,
    category: 'Serums',
    series: 'Whitening and Brightening Series',
    coverImage: '/uploads/file-1791830762714-399075316.jpg',
    images: [
      '/uploads/file-1791830762714-399075316.jpg',
      '/uploads/file-1791830766725-465711461.jpeg',
      '/uploads/file-1791830769792-761661464.jpeg'
    ],
    additionalImages: [
      '/uploads/file-1791830766725-465711461.jpeg',
      '/uploads/file-1791830769792-761661464.jpeg'
    ],
    description: `Powerful antioxidant capacity with a high concentration of pure Vitamin C, delivering a true Vitamin C serum.

পণ্যের বিবরণ:
বিশুদ্ধ ভিটামিন সি-এর উচ্চ ঘনত্বের সমন্বয়ে গঠিত এই সিরামটি শক্তিশালী অ্যান্টি-অক্সিডেন্ট কার্যকারিতা প্রদান করে।`,
    benefitsHighlights: `Pure Vitamin C,
Stronger efficacy,
Greater stability,
Easier absorption.

⭐ Overall
• 🎯 Pigmentation/brightening: 8.5/10
• 🛡️ Antioxidant: 9.5/10
• 💧 Hydration: 7/10
• 🧴 Nourishment/barrier: 6/10
• ✨ Texture/pores: 7/10

প্রধান সুবিধাসমূহ:
বিশুদ্ধ ভিটামিন সি,
অধিক কার্যকারিতা,
উন্নত স্থায়িত্ব,
সহজ শোষণ ক্ষমতা।

⭐ সামগ্রিক মূল্যায়ন
🎯 পিগমেন্টেশন/উজ্জ্বলতা বৃদ্ধি: ৮.৫/১০
🛡️ অ্যান্টি-অক্সিডেন্ট: ৯.৫/১০
💧 আর্দ্রতা প্রদান (Hydration): ৭/১০
🧴 পুষ্টি/ত্বকের সুরক্ষা স্তর (Barrier): ৬/১০
✨ টেক্সচার/লোমকূপ: ৭/১০`,
    howToUse: `After cleansing in the morning and evening, use your fingertips to apply three pumps of serum to damp skin. Gently press the serum into the skin with your palms to enhance absorption.

ব্যবহারবিধি:
সকাল ও সন্ধ্যায় ত্বক পরিষ্কার করার পর, আঙুলের সাহায্যে তিন পাম্প পরিমাণ সিরাম ভেজা ত্বকে লাগান। সিরামটি ভালোভাবে শোষিত হতে সাহায্য করার জন্য হাতের তালু দিয়ে আলতোভাবে ত্বকে চেপে দিন।`,
    howToUseIt: `After cleansing in the morning and evening, use your fingertips to apply three pumps of serum to damp skin. Gently press the serum into the skin with your palms to enhance absorption.

ব্যবহারবিধি:
সকাল ও সন্ধ্যায় ত্বক পরিষ্কার করার পর, আঙুলের সাহায্যে তিন পাম্প পরিমাণ সিরাম ভেজা ত্বকে লাগান। সিরামটি ভালোভাবে শোষিত হতে সাহায্য করার জন্য হাতের তালু দিয়ে আলতোভাবে ত্বকে চেপে দিন।`,
    ingredients: `WATER, ETHOXYDIGLYCOL, ASCORBIC ACID, PROPANEDIOL, DIPROPYL-ENE GLYCOL, PEG-8, BETAINE, 1,2-HEXANE-DIOL, PANTHENOL, SODIUM HYDROXIDE, FERULIC ACID, HYDROXYACETOPHENONE, SALICYLIC ACID, XANTHAN GUM OTHER TRACE COMPONENTS: SODIUM HYALURONATE

উপাদানসমূহ: পানি, ইথোক্সিডাইগ্লাইকল, অ্যাসকরবিক অ্যাসিড, প্রোপেনডিওল, ডাইপ্রোপিলিন গ্লাইকল, পিইজি-৮ (PEG-8), বেটেইন, ১,২-হেক্সেনডিওল, প্যানথেনল, সোডিয়াম হাইড্রোক্সাইড, ফেরুলিক অ্যাসিড, হাইড্রোক্সিয়াসিটোফেনন, স্যালিসাইলিক অ্যাসিড, জ্যান্থান গাম। অন্যান্য অতি সামান্য উপাদান: সোডিয়াম হায়ালুরোনেট।`,
    badge: 'Popular',
    isFeatured: true
  },
  {
    id: 'prod-vb3-spot-lightening-essence',
    title: 'VB3 Spot-Lightening Essence',
    author: 'FANTINE Korea',
    authorName: 'FANTINE Korea',
    brand: 'FANTINE',
    brandId: 'brand-fantine',
    regularPrice: 2100,
    price: 1500,
    discountPercentage: 29,
    stockQuantity: 100,
    category: 'Serums',
    series: 'Whitening and Brightening Series',
    coverImage: '/uploads/file-1791830989305-696330059.jpg',
    images: [
      '/uploads/file-1791830989305-696330059.jpg',
      '/uploads/file-1791830994106-62464748.jpeg',
      '/uploads/file-1791830999191-605068443.jpeg'
    ],
    additionalImages: [
      '/uploads/file-1791830994106-62464748.jpeg',
      '/uploads/file-1791830999191-605068443.jpeg'
    ],
    description: `High-potency Vitamin B3 (Niacinamide) and Alpha-Arbutin spot-correcting essence. Actively targets stubborn post-acne dark marks, sun spots, and hyperpigmentation while balancing excess sebum and shrinking enlarged pores.

পণ্যের বিবরণ:
উচ্চ কার্যক্ষমতাসম্পন্ন ভিটামিন বি৩ (নিয়াসিনামাইড) এবং আলফা-আরবুটিন সমৃদ্ধ স্পট-লাইটেনিং এসেন্স। এটি ত্বকের জেদি কালো দাগ, মেছতা ও ব্রণের দাগ দূর করে ত্বকের স্বাভাবিক উজ্জ্বলতা ফিরিয়ে আনে এবং অতিরিক্ত তৈলাক্ততা দূর করে লোমকূপ সঙ্কুচিত করে।`,
    benefitsHighlights: `Targeted dark spot correction,
High-purity Niacinamide (Vitamin B3),
Pore tightening & oil control,
Evens skin tone & texture.

⭐ Overall
• 🎯 Spot Lightening / Melasma: 9.4/10
• 🛡️ Post-Acne Mark Fading: 9.5/10
• 💧 Hydration & Balance: 8.5/10
• 🧴 Sebum Regulation: 9.0/10
• ✨ Pore Refining: 9.2/10

প্রধান সুবিধাসমূহ:
কালো দাগ ও পিগমেন্টেশন হালকা করা,
উচ্চ বিশুদ্ধতার নিয়াসিনামাইড (ভিটামিন বি৩),
লোমকূপ সঙ্কোচন ও তেল নিয়ন্ত্রণ,
ত্বকের অসম রঙ দূর করে সমরূপ উজ্জ্বলতা।

⭐ সামগ্রিক মূল্যায়ন
🎯 দাগ হালকা ও মেছতা নিয়ন্ত্রণ: ৯.৪/১০
🛡️ ব্রণের দাগ দূরীকরণ: ৯.৫/১০
💧 আর্দ্রতা ও ত্বকের ভারসাম্য: ৮.৫/১০
🧴 সিবাম নিয়ন্ত্রণ: ৯.০/১০
✨ পোর মিনিমাইজিং: ৯.২/১০`,
    howToUse: `Apply 2-3 drops to cleansed skin morning and night, paying extra attention to hyperpigmented spots and uneven areas. Always follow with SPF during daytime.

ব্যবহারবিধি:
প্রতিদিন সকাল ও রাতে ত্বক পরিষ্কারের পর ২-৩ ফোঁটা এসেন্স সম্পূর্ণ মুখে বিশেষ করে দাগযুক্ত স্থানে আলতোভাবে ব্যবহার করুন। দিনের বেলা সানস্ক্রিন ব্যবহার করুন।`,
    howToUseIt: `Apply 2-3 drops to cleansed skin morning and night, paying extra attention to hyperpigmented spots and uneven areas. Always follow with SPF during daytime.

ব্যবহারবিধি:
প্রতিদিন সকাল ও রাতে ত্বক পরিষ্কারের পর ২-৩ ফোঁটা এসেন্স সম্পূর্ণ মুখে বিশেষ করে দাগযুক্ত স্থানে আলতোভাবে ব্যবহার করুন। দিনের বেলা সানস্ক্রিন ব্যবহার করুন।`,
    ingredients: `WATER, NIACINAMIDE (VITAMIN B3), BUTYLENE GLYCOL, GLYCERIN, ALPHA-ARBUTIN, TRANEXAMIC ACID, GLYCYRRHIZA GLABRA (LICORICE) ROOT EXTRACT, SODIUM HYALURONATE, ALLANTOIN, 1,2-HEXANEDIOL, HYDROXYETHYLCELLULOSE, ETHYLHEXYLGLYCERIN.

উপাদানসমূহ: পানি, নিয়াসিনামাইড (ভিটামিন বি৩), বিউটিলিন গ্লাইকল, গ্লিসারিন, আলফা-আরবুটিন, ট্রানেক্সামিক অ্যাসিড, যষ্টিমধু নির্যাস, সোডিয়াম হায়ালুরোনেট, অ্যালানটয়েন, ১,২-হেক্সেনডিওল।`,
    badge: 'Trending',
    isFeatured: true
  },
  {
    id: 'prod-super-antioxidant-serum',
    title: 'Super Antioxidant Serum',
    author: 'FANTINE Korea',
    authorName: 'FANTINE Korea',
    brand: 'FANTINE',
    brandId: 'brand-fantine',
    regularPrice: 2300,
    price: 1600,
    discountPercentage: 30,
    stockQuantity: 100,
    category: 'Serums',
    series: 'Ultra Repair Series',
    coverImage: '/uploads/file-1791831243256-923954313.jpg',
    images: [
      '/uploads/file-1791831243256-923954313.jpg',
      '/uploads/file-1791831246663-670212725.jpeg',
      '/uploads/file-1791831250379-772129356.jpeg'
    ],
    additionalImages: [
      '/uploads/file-1791831246663-670212725.jpeg',
      '/uploads/file-1791831250379-772129356.jpeg'
    ],
    description: `Ultimate multi-antioxidant defense serum. Combines Ferulic Acid, Astaxanthin, and Resveratrol to neutralize environmental free radicals, prevent premature cellular aging, eliminate dullness, and boost youthful radiance.

পণ্যের বিবরণ:
শক্তিশালী মাল্টি-অ্যান্টিঅক্সিডেন্ট ডিফেন্স সিরাম। এতে রয়েছে ফেরুলিক অ্যাসিড, অ্যাস্টাজ্যান্থিন ও রেসভেরাট্রল যা ক্ষতিকর পরিবেশ দূষণ ও ফ্রি-র‍্যাডিক্যাল থেকে ত্বককে রক্ষা করে, বয়সের ছাপ প্রতিরোধ করে এবং ত্বককে করে প্রাণবন্ত ও ঝলমলে।`,
    benefitsHighlights: `Multi-antioxidant synergy,
Neutralizes free radical damage,
Anti-photoaging defense,
Restores radiant vitality.

⭐ Overall
• 🎯 Antioxidant Protection: 9.8/10
• 🛡️ Anti-Pollution Defense: 9.5/10
• 💧 Hydration: 8.0/10
• 🧴 Cellular Firming: 8.8/10
• ✨ Radiant Glow: 9.2/10

প্রধান সুবিধাসমূহ:
শক্তিশালী মাল্টি-অ্যান্টিঅক্সিডেন্ট ফর্মুলা,
পরিবেশ দূষণ ও ফ্রি-র‍্যাডিক্যাল প্রতিরোধ,
ত্বকের অকাল বার্ধক্য রোধ,
উজ্জ্বল ও সতেজ ত্বকের দীপ্তি।

⭐ সামগ্রিক মূল্যায়ন
🎯 অ্যান্টিঅক্সিডেন্ট সুরক্ষা: ৯.৮/১০
🛡️ পরিবেশ দূষণ থেকে ঢাল: ৯.৫/১০
💧 আর্দ্রতা প্রদান: ৮.০/১০
🧴 ত্বকের টানটান ভাব: ৮.৮/১০
✨ উজ্জ্বল ও গ্লাস স্কিন গ্লো: ৯.২/১০`,
    howToUse: `Gently smooth 3 drops onto clean face and neck in the morning before sun exposure, and at evening to recharge depleted skin.

ব্যবহারবিধি:
প্রতিদিন সকালে রোদে যাওয়ার পূর্বে এবং রাতে ত্বক পরিষ্কার করে ৩ ফোঁটা সিরাম মুখ ও গলায় মেখে নিন।`,
    howToUseIt: `Gently smooth 3 drops onto clean face and neck in the morning before sun exposure, and at evening to recharge depleted skin.

ব্যবহারবিধি:
প্রতিদিন সকালে রোদে যাওয়ার পূর্বে এবং রাতে ত্বক পরিষ্কার করে ৩ ফোঁটা সিরাম মুখ ও গলায় মেখে নিন।`,
    ingredients: `WATER, PROPANEDIOL, GLYCERIN, FERULIC ACID, ASTAXANTHIN, RESVERATROL, CAMELLIA SINENSIS (GREEN TEA) LEAF EXTRACT, TOCOPHERYL ACETATE (VITAMIN E), SODIUM HYALURONATE, 1,2-HEXANEDIOL, POLYSORBATE 20, ETHYLHEXYLGLYCERIN.

উপাদানসমূহ: পানি, প্রোপেনডিওল, গ্লিসারিন, ফেরুলিক অ্যাসিড, অ্যাস্টাজ্যান্থিন, রেসভেরাট্রল, গ্রিন টি নির্যাস, ভিটামিন ই (টোকোফেরিল অ্যাসিটেট), সোডিয়াম হায়ালুরোনেট, ১,২-হেক্সেনডিওল।`,
    badge: 'Antioxidant',
    isFeatured: true
  },
  {
    id: 'prod-ve-nourishing-serum',
    title: 'VE Nourishing Serum',
    author: 'FANTINE Korea',
    authorName: 'FANTINE Korea',
    brand: 'FANTINE',
    brandId: 'brand-fantine',
    regularPrice: 1950,
    price: 1450,
    discountPercentage: 26,
    stockQuantity: 100,
    category: 'Serums',
    series: 'Deep Hydration Series',
    coverImage: '/uploads/file-1791830588893-187058483.jpg',
    images: [
      '/uploads/file-1791830588893-187058483.jpg',
      '/uploads/file-1791830593541-799200212.jpeg',
      '/uploads/file-1791830597458-464719743.jpeg'
    ],
    additionalImages: [
      '/uploads/file-1791830593541-799200212.jpeg',
      '/uploads/file-1791830597458-464719743.jpeg'
    ],
    description: `Lipid-rich Vitamin E (Tocopherol) and Botanical Squalane nourishing serum. Deeply comforts parched, peeling, or weather-damaged skin, replenishing natural intercellular lipids for 48-hour moisture barrier defense.

পণ্যের বিবরণ:
ভিটামিন ই (টোকোফেরল) ও বোটানিক্যাল স্কোয়ালেন সমৃদ্ধ গভীর পুষ্টিকর সিরাম। শুষ্ক, রুক্ষ ও ফেটে যাওয়া ত্বকে প্রয়োজনীয় লিপিড ফিরিয়ে দিয়ে ৪৮ ঘণ্টা পর্যন্ত তীব্র আর্দ্রতা বজায় রাখে এবং ত্বককে মাখনের মতো নরম ও কোমল করে।`,
    benefitsHighlights: `Pure Tocopherol (Vitamin E),
48-hour deep lipid hydration,
Relieves dry peeling & tight skin,
Restores natural softness.

⭐ Overall
• 🎯 Deep Moisture Lock: 9.7/10
• 🛡️ Flakiness Relief: 9.6/10
• 💧 Hydration Barrier: 9.5/10
• 🧴 Lipid Nourishment: 9.8/10
• ✨ Velvety Softness: 9.4/10

প্রধান সুবিধাসমূহ:
খাঁটি টোকোফেরল (ভিটামিন ই),
৪৮ ঘণ্টা গভীর লিপিড আর্দ্রতা,
ত্বকের খসখসে ভাব ও রুক্ষতা দূরীকরণ,
মখমলে মসৃণতা ফিরিয়ে আনা।

⭐ সামগ্রিক মূল্যায়ন
🎯 গভীর আর্দ্রতা লক: ৯.৭/১০
🛡️ শুষ্কতা ও খোসা ওঠা রোধ: ৯.৬/১০
💧 হাইড্রেশন ব্যারিয়ার: ৯.৫/১০
🧴 লিপিড পুষ্টি প্রদান: ৯.৮/১০
✨ মাখনের মতো কোমলতা: ৯.৪/১০`,
    howToUse: `Dispense 2-3 drops into palm, warm gently between hands, and press lightly onto cleansed skin morning and evening.

ব্যবহারবিধি:
সকাল ও রাতে ২-৩ ফোঁটা সিরাম হাতের তালুতে নিয়ে আলতোভাবে ঘষে উষ্ণ করে পুরো মুখে হালকা চাপে বসিয়ে দিন।`,
    howToUseIt: `Dispense 2-3 drops into palm, warm gently between hands, and press lightly onto cleansed skin morning and evening.

ব্যবহারবিধি:
সকাল ও রাতে ২-৩ ফোঁটা সিরাম হাতের তালুতে নিয়ে আলতোভাবে ঘষে উষ্ণ করে পুরো মুখে হালকা চাপে বসিয়ে দিন।`,
    ingredients: `WATER, GLYCERIN, TOCOPHERYL ACETATE (VITAMIN E), SQUALANE, SIMMONDSIA CHINENSIS (JOJOBA) SEED OIL, MACADAMIA TERNIFOLIA SEED OIL, SODIUM HYALURONATE, 1,2-HEXANEDIOL, CERAMIDE NP, HYDROXYACETOPHENONE.

উপাদানসমূহ: পানি, গ্লিসারিন, ভিটামিন ই (টোকোফেরিল অ্যাসিটেট), স্কোয়ালেন, জোজোবা অয়েল, ম্যাকাকাডামিয়া সিড অয়েল, সোডিয়াম হায়ালুরোনেট, সিরামাইড এনপি, ১,২-হেক্সেনডিওল।`,
    badge: 'Moisture Care',
    isFeatured: true
  },
  {
    id: 'prod-rapid-acne-treatment-essence',
    title: 'Rapid Acne Treatment Essence',
    author: 'FANTINE Korea',
    authorName: 'FANTINE Korea',
    brand: 'FANTINE',
    brandId: 'brand-fantine',
    regularPrice: 3000,
    price: 2000,
    discountPercentage: 33,
    stockQuantity: 100,
    category: 'Rapid Acne Treatment Series',
    series: 'Rapid Acne Treatment Series',
    coverImage: '/uploads/file-1791826953559-621616270.jpg',
    images: [
      '/uploads/file-1791826953559-621616270.jpg',
      '/uploads/file-1791826958408-501895547.jpeg',
      '/uploads/file-1791826961577-101639256.jpeg'
    ],
    additionalImages: [
      '/uploads/file-1791826958408-501895547.jpeg',
      '/uploads/file-1791826961577-101639256.jpeg'
    ],
    description: `Clinical rapid-action acne clarifying essence. Formulated with Salicylic Acid (BHA), Tea Tree, and Heartleaf to dissolve pore-clogging sebum, neutralize acne bacteria, relieve inflamed pimples, and prevent recurrent breakouts.

পণ্যের বিবরণ:
ক্লিনিক্যাল র‍্যাপিড একনে ট্রিটমেন্ট এসেন্স। স্যালিসাইলিক অ্যাসিড (BHA), টি-ট্রি ও হার্টলিফ এক্সট্র্যাক্টের সমন্বয়ে তৈরি, যা লোমকূপে জমে থাকা তেল ও জীবাণু পরিষ্কার করে সক্রিয় ব্রণ দ্রুত শুকিয়ে ফেলে এবং নতুন ব্রণ ওঠা রোধ করে।`,
    benefitsHighlights: `Fast-acting acne & pimple relief,
Unclogs congested pores & blackheads,
Regulates excess sebum production,
Calms inflamed breakouts without drying.

⭐ Overall
• 🎯 Active Acne Clearance: 9.6/10
• 🛡️ Pimple Redness Relief: 9.5/10
• 💧 Moisture Balance: 8.0/10
• 🧴 Sebum & Oil Control: 9.4/10
• ✨ Pore Unclogging: 9.5/10

প্রধান সুবিধাসমূহ:
সক্রিয় ব্রণ ও ফুসকুড়ি দ্রুত দূরীকরণ,
ব্ল্যাকহেডস ও পোরস পরিষ্কারকরণ,
অতিরিক্ত তেল ও সিবাম নিয়ন্ত্রণ,
ত্বক শুকিয়ে না ফেলে আরামদায়ক প্রশান্তি।

⭐ সামগ্রিক মূল্যায়ন
🎯 ব্রণ নির্মূল ক্ষমতা: ৯.৬/১০
🛡️ ব্রণের লালচে ভাব উপশম: ৯.৫/১০
💧 আর্দ্রতার ভারসাম্য: ৮.০/১০
🧴 সিবাম ও তেল নিয়ন্ত্রণ: ৯.৪/১০
✨ পোরস গভীর থেকে পরিচ্ছন্নতা: ৯.৫/১০`,
    howToUse: `Apply 2-3 drops to affected acne areas or all over face after cleansing at evening. Start every other night and gradually build up to daily use.

ব্যবহারবিধি:
প্রতিদিন রাতে ত্বক পরিষ্কারের পর ব্রণের স্থানে বা পুরো মুখে ২-৩ ফোঁটা এসেন্স আলতোভাবে লাগিয়ে দিন।`,
    howToUseIt: `Apply 2-3 drops to affected acne areas or all over face after cleansing at evening. Start every other night and gradually build up to daily use.

ব্যবহারবিধি:
প্রতিদিন রাতে ত্বক পরিষ্কারের পর ব্রণের স্থানে বা পুরো মুখে ২-৩ ফোঁটা এসেন্স আলতোভাবে লাগিয়ে দিন।`,
    ingredients: `WATER, BUTYLENE GLYCOL, SALICYLIC ACID (BHA), MELALEUCA ALTERNIFOLIA (TEA TREE) EXTRACT, HOUTTUYNIA CORDATA EXTRACT, ZINC PCA, CENTELLA ASIATICA EXTRACT, 1,2-HEXANEDIOL, ARGININE, ALLANTOIN, XANTHAN GUM.

উপাদানসমূহ: পানি, বিউটিলিন গ্লাইকল, স্যালিসাইলিক অ্যাসিড (BHA), টি-ট্রি নির্যাস, হার্টলিফ নির্যাস, জিংক পিসিএ, সেন্টেলা এশিয়াটিকা নির্যাস, ১,২-হেক্সেনডিওল, আরজিনিন।`,
    badge: 'Acne Care',
    isFeatured: true
  },
  {
    id: 'prod-aha-exfoliating-essence',
    title: 'AHA Exfoliating Essence',
    author: 'FANTINE Korea',
    authorName: 'FANTINE Korea',
    brand: 'FANTINE',
    brandId: 'brand-fantine',
    regularPrice: 3000,
    price: 2000,
    discountPercentage: 33,
    stockQuantity: 100,
    category: 'Toners',
    series: 'Rapid Acne Treatment Series',
    coverImage: '/uploads/file-1791822354692-346436357.jpg',
    images: [
      '/uploads/file-1791822354692-346436357.jpg',
      '/uploads/file-1791822359176-731563340.webp',
      '/uploads/file-1791822363053-980807663.webp'
    ],
    additionalImages: [
      '/uploads/file-1791822359176-731563340.webp',
      '/uploads/file-1791822363053-980807663.webp'
    ],
    description: `Gentle alpha-hydroxy fruit acid resurfacing elixir. Dissolves hardened keratinized dead cells, sweeps away dull crust, improves rough skin texture, and enhances the absorption of subsequent serums.

পণ্যের বিবরণ:
মৃদু এএইচএ (AHA) ফ্রুট অ্যাসিড সমৃদ্ধ এক্সফোলিয়েটিং এসেন্স। এটি ত্বকের উপরিভাগের মৃত কোষ দূর করে খসখসে ভাব কাটিয়ে ত্বককে করে কাঁচের মতো মসৃণ, ফ্রেশ ও উজ্জ্বল।`,
    benefitsHighlights: `Dissolves dull, dead skin cells,
Evens bumpy and rough texture,
Deep pore cleansing & smoothing,
Promotes glowing cellular renewal.

⭐ Overall
• 🎯 Dead Skin Exfoliation: 9.6/10
• 🛡️ Smooth Skin Texture: 9.5/10
• 💧 Hydration: 8.0/10
• 🧴 Glow & Radiance: 9.2/10
• ✨ Pore Cleansing: 9.3/10

প্রধান সুবিধাসমূহ:
মৃত কোষ দূর করে ত্বক পুনরুজ্জীবিত করা,
খসখসে ত্বক মসৃণ করা,
পোরস ভেতর থেকে গভীর পরিষ্কার,
উজ্জ্বল স্কিন টোন ও দীপ্তি।

⭐ সামগ্রিক মূল্যায়ন
🎯 ডেড সেল দূরীকরণ: ৯.৬/১০
🛡️ মসৃণ ও সমতল ত্বক: ৯.৫/১০
💧 আর্দ্রতা রক্ষা: ৮.০/১০
🧴 প্রাকৃতিক গ্লো: ৯.২/১০
✨ পোর ডিপ ক্লিনিং: ৯.৩/১০`,
    howToUse: `Use 2-3 nights per week on cleansed skin with a cotton pad. Avoid eye contour area. Do not rinse off. Follow with barrier serum or cream.

ব্যবহারবিধি:
সপ্তাহে ২-৩ রাত ত্বক পরিষ্কারের পর কটন প্যাডে নিয়ে মুখে আলতোভাবে ব্যবহার করুন। ধুয়ে ফেলার প্রয়োজন নেই। এরপর সিরাম বা ক্রিম ব্যবহার করুন।`,
    howToUseIt: `Use 2-3 nights per week on cleansed skin with a cotton pad. Avoid eye contour area. Do not rinse off. Follow with barrier serum or cream.

ব্যবহারবিধি:
সপ্তাহে ২-৩ রাত ত্বক পরিষ্কারের পর কটন প্যাডে নিয়ে মুখে আলতোভাবে ব্যবহার করুন। ধুয়ে ফেলার প্রয়োজন নেই। এরপর সিরাম বা ক্রিম ব্যবহার করুন।`,
    ingredients: `WATER, GLYCOLIC ACID (AHA), LACTIC ACID, PROPANEDIOL, POTASSIUM HYDROXIDE, PYRUS MALUS (APPLE) FRUIT EXTRACT, PANTHENOL, SODIUM HYALURONATE, 1,2-HEXANEDIOL, ETHYLHEXYLGLYCERIN.

উপাদানসমূহ: পানি, গ্লাইকোলিক অ্যাসিড (AHA), ল্যাকটিক অ্যাসিড, প্রোপেনডিওল, পটাশিয়াম হাইড্রোক্সাইড, আপেল নির্যাস, প্যানথেনল, সোডিয়াম হায়ালুরোনেট, ১,২-হেক্সেনডিওল।`,
    badge: 'Exfoliation',
    isFeatured: true
  },
  {
    id: 'prod-retinol-anti-aging-serum',
    title: 'Retinol Anti-Aging Serum',
    author: 'FANTINE Korea',
    authorName: 'FANTINE Korea',
    brand: 'FANTINE',
    brandId: 'brand-fantine',
    regularPrice: 3200,
    price: 2200,
    discountPercentage: 31,
    stockQuantity: 100,
    category: 'Serums',
    series: 'Ultra Repair Series',
    coverImage: '/uploads/file-1791827320010-515338106.jpg',
    images: [
      '/uploads/file-1791827320010-515338106.jpg',
      '/uploads/file-1791827334201-693066165.jpeg',
      '/uploads/file-1791827334452-792065672.jpeg'
    ],
    additionalImages: [
      '/uploads/file-1791827334201-693066165.jpeg',
      '/uploads/file-1791827334452-792065672.jpeg'
    ],
    description: `Micro-encapsulated pure Retinol and Bakuchiol nocturnal rejuvenating serum. Stimulates natural collagen synthesis, minimizes stubborn forehead lines, crow's feet, and smile lines while firming lax skin for a youthful contour.

পণ্যের বিবরণ:
মাইক্রো-এনক্যাপসুলেটেড রেটিনল ও বাকুচিওল সমৃদ্ধ অ্যান্টি-এজিং নাইট সিরাম। এটি ত্বকে নতুন কোলাজেন তৈরি করে বলিরেখা, ফাইন লাইনস এবং ঝুলে পড়া ত্বক টানটান করে বয়সের ছাপ দূর করে তারুণ্য ফিরিয়ে আনে।`,
    benefitsHighlights: `Encapsulated slow-release Retinol,
Diminishes fine lines & wrinkles,
Accelerates cellular turnover,
Improves dermal bounce & firmness.

⭐ Overall
• 🎯 Fine Line Reduction: 9.5/10
• 🛡️ Collagen Boosting: 9.6/10
• 💧 Hydration: 8.2/10
• 🧴 Firming & Tightening: 9.4/10
• ✨ Smooth Skin Renewal: 9.3/10

প্রধান সুবিধাসমূহ:
ধীর-শোষণকারী এনক্যাপসুলেটেড রেটিনল,
বলিরেখা ও বয়সের ছাপ দূরীকরণ,
ত্বকের কোলাজেন পুনর্গঠন,
ত্বক টানটান ও ইলাস্টিক করা।

⭐ সামগ্রিক মূল্যায়ন
🎯 বলিরেখা হ্রাস: ৯.৫/১০
🛡️ কোলাজেন বৃদ্ধি: ৯.৬/১০
💧 আর্দ্রতা বজায় রাখা: ৮.২/১০
🧴 টানটান ভাব ও দৃঢ়তা: ৯.৪/১০
✨ কোষ পুনর্জন্ম: ৯.৩/১০`,
    howToUse: `Apply 2-3 drops at night only onto cleansed skin. Begin using 2 nights per week, gradually increasing frequency. Always apply SPF sunscreen the following morning.

ব্যবহারবিধি:
শুধুমাত্র রাতে ত্বক পরিষ্কারের পর ২-৩ ফোঁটা ব্যবহার করুন। প্রথম সপ্তাহে ২ রাত দিয়ে শুরু করে ধীরে ধীরে ব্যবহার বাড়ান। পরদিন সকালে অবশ্যই সানস্ক্রিন ব্যবহার করুন।`,
    howToUseIt: `Apply 2-3 drops at night only onto cleansed skin. Begin using 2 nights per week, gradually increasing frequency. Always apply SPF sunscreen the following morning.

ব্যবহারবিধি:
শুধুমাত্র রাতে ত্বক পরিষ্কারের পর ২-৩ ফোঁটা ব্যবহার করুন। প্রথম সপ্তাহে ২ রাত দিয়ে শুরু করে ধীরে ধীরে ব্যবহার বাড়ান। পরদিন সকালে অবশ্যই সানস্ক্রিন ব্যবহার করুন।`,
    ingredients: `WATER, GLYCERIN, CAPRYLIC/CAPRIC TRIGLYCERIDE, RETINOL (MICRO-ENCAPSULATED), BAKUCHIOL, ADENOSINE, PALMITOYL TRIPEPTIDE-5, SODIUM HYALURONATE, TOCOPHEROL, 1,2-HEXANEDIOL, POLYSORBATE 20, ETHYLHEXYLGLYCERIN.

উপাদানসমূহ: পানি, গ্লিসারিন, রেটিনল (মাইক্রো-এনক্যাপসুলেটেড), বাকুচিওল, অ্যাডিনোসিন, পেপটাইড, সোডিয়াম হায়ালুরোনেট, ভিটামিন ই (টোকোফেরল), ১,২-হেক্সেনডিওল।`,
    badge: 'Anti-Aging',
    isFeatured: true
  },
  {
    id: 'prod-collagen-elastic-essence',
    title: 'Collagen Elastic Essence',
    author: 'FANTINE Korea',
    authorName: 'FANTINE Korea',
    brand: 'FANTINE',
    brandId: 'brand-fantine',
    regularPrice: 2500,
    price: 1800,
    discountPercentage: 28,
    stockQuantity: 100,
    category: 'Serums',
    series: 'Deep Hydration Series',
    coverImage: '/uploads/file-1791823814770-967689183.jpg',
    images: [
      '/uploads/file-1791823814770-967689183.jpg',
      '/uploads/file-1791823819604-611080923.jpeg',
      '/uploads/file-1791823819691-282589560.jpeg'
    ],
    additionalImages: [
      '/uploads/file-1791823819604-611080923.jpeg',
      '/uploads/file-1791823819691-282589560.jpeg'
    ],
    description: `Hydrolyzed marine and botanical collagen peptide lifting essence. Replenishes depleting dermal bounce, plumps dry expression lines, and imparts the coveted radiant Korean glass-skin finish.

পণ্যের বিবরণ:
হাইড্রোলাইজড মেরিন ও ভেষজ কোলাজেন পেপটাইড সমৃদ্ধ ইলাস্টিসিটি এসেন্স। এটি ত্বকের গভীরে হারিয়ে যাওয়া স্থিতিস্থাপকতা ফিরিয়ে দিয়ে ত্বককে ভরাট, টানটান ও আকর্ষণীয় কোরিয়ান গ্লাস-স্কিন আভা প্রদান করে।`,
    benefitsHighlights: `High-density Hydrolyzed Collagen,
Restores skin bounce & elasticity,
Deeply plumps fine dehydration lines,
Imparts dewy glass-skin glow.

⭐ Overall
• 🎯 Elasticity & Bounce: 9.7/10
• 🛡️ Plumping Effect: 9.5/10
• 💧 Glass-Skin Hydration: 9.4/10
• 🧴 Barrier Support: 9.0/10
• ✨ Smooth Radiance: 9.5/10

প্রধান সুবিধাসমূহ:
উচ্চ ঘনত্বের হাইড্রোলাইজড কোলাজেন,
ত্বকের স্থিতিস্থাপকতা ও বাউন্স বৃদ্ধি,
ফাইন লাইনস ভরাট করে মসৃণ করা,
কাঁচের মতো চকচকে গ্লাস-স্কিন ফিনিশ।

⭐ সামগ্রিক মূল্যায়ন
🎯 ইলাস্টিসিটি ও বাউন্স: ৯.৭/১০
🛡️ প্লাস্পিং ও ত্বক ভরাট: ৯.৫/১০
💧 গ্লাস-স্কিন হাইড্রেশন: ৯.৪/১০
🧴 ত্বকের সুরক্ষা: ৯.০/১০
✨ প্রাকৃতিক দীপ্তি ও গ্লো: ৯.৫/১০`,
    howToUse: `Apply 3 pumps generously onto cleansed face and neck morning and night before heavier face creams. Press into skin until fully absorbed.

ব্যবহারবিধি:
সকাল ও রাতে ত্বক পরিষ্কারের পর ৩ পাম্প পরিমাণ এসেন্স মুখ ও গলায় মেখে হাতের তালু দিয়ে আলতোভাবে চেপে মিলিয়ে দিন।`,
    howToUseIt: `Apply 3 pumps generously onto cleansed face and neck morning and night before heavier face creams. Press into skin until fully absorbed.

ব্যবহারবিধি:
সকাল ও রাতে ত্বক পরিষ্কারের পর ৩ পাম্প পরিমাণ এসেন্স মুখ ও গলায় মেখে হাতের তালু দিয়ে আলতোভাবে চেপে মিলিয়ে দিন।`,
    ingredients: `HYDROLYZED COLLAGEN EXTRACT, WATER, BUTYLENE GLYCOL, GLYCERIN, TREMELLA FUCIFORMIS (MUSHROOM) EXTRACT, POLYGLUTAMIC ACID, COPPER TRIPEPTIDE-1, SODIUM HYALURONATE, BETAINE, PANTHENOL, 1,2-HEXANEDIOL, ETHYLHEXYLGLYCERIN.

উপাদানসমূহ: হাইড্রোলাইজড কোলাজেন নির্যাস, পানি, বিউটিলিন গ্লাইকল, গ্লিসারিন, ট্রেমেল্লা মাশরুম নির্যাস, পলিগ্লুটামিক অ্যাসিড, কপার ট্রাইপেপটাইড-১, সোডিয়াম হায়ালুরোনেট, প্যানথেনল, ১,২-হেক্সেনডিওল।`,
    badge: 'Elasticity',
    isFeatured: true
  },
  {
    id: 'prod-botox-anti-wrinkle-essence',
    title: 'Botox Anti-Wrinkle Essence',
    author: 'FANTINE Korea',
    authorName: 'FANTINE Korea',
    brand: 'FANTINE',
    brandId: 'brand-fantine',
    regularPrice: 3200,
    price: 2200,
    discountPercentage: 31,
    stockQuantity: 100,
    category: 'Serums',
    series: 'Ultra Repair Series',
    coverImage: '/uploads/file-1791822783298-380226454.jpg',
    images: [
      '/uploads/file-1791822783298-380226454.jpg'
    ],
    additionalImages: [
      '/uploads/file-1791822783298-380226454.jpg'
    ],
    description: `Dual-signal peptide anti-wrinkle lifting essence. Stimulates natural collagen synthesis, relaxes fine facial expression lines, and visibly restores skin firmness and youthful elasticity.

পণ্যের বিবরণ:
ডুয়াল-সিগন্যাল পেপটাইড সমৃদ্ধ বোটক্স অ্যান্টি-রিঙ্কেল এসেন্স। এটি ত্বকের গভীরে কোলাজেন উৎপাদন বৃদ্ধি করে, বলিরেখা ও ফাইন লাইনস দূর করে ত্বককে টানটান, মসৃণ ও উজ্জ্বল করে তোলে।`,
    benefitsHighlights: `Dual-Signal Peptide Complex,
Botox-like expression line smoothing,
Enhanced dermal firmness,
Deep skin plumping & lifting.

⭐ Overall
• 🎯 Anti-Wrinkle / Firming: 9.5/10
• 🛡️ Lifting & Elasticity: 9.0/10
• 💧 Hydration: 8.0/10
• 🧴 Barrier & Nourishment: 8.5/10
• ✨ Smooth Texture: 9.0/10

প্রধান সুবিধাসমূহ:
ডুয়াল-সিগন্যাল পেপটাইড,
বলিরেখা হ্রাস ও মসৃণতা,
ত্বকের টানটান ভাব ও ইলাস্টিসিটি বৃদ্ধি,
গভীর আর্দ্রতা ও তারুণ্যোজ্জ্বল আভা।`,
    howToUse: `After cleansing and toning, dispense 2-3 pumps onto fingertips and gently massage into face and neck with upward lifting motions until fully absorbed.

ব্যবহারবিধি:
সকাল ও সন্ধ্যায় ত্বক পরিষ্কার ও টোনার ব্যবহারের পর, ২-৩ পাম্প এসেন্স আঙুলে নিয়ে নিচ থেকে উপরের দিকে আলতোভাবে ম্যাসাজ করে ত্বকে মিলিয়ে দিন।`,
    howToUseIt: `After cleansing and toning, dispense 2-3 pumps onto fingertips and gently massage into face and neck with upward lifting motions until fully absorbed.

ব্যবহারবিধি:
সকাল ও সন্ধ্যায় ত্বক পরিষ্কার ও টোনার ব্যবহারের পর, ২-৩ পাম্প এসেন্স আঙুলে নিয়ে নিচ থেকে উপরের দিকে আলতোভাবে ম্যাসাজ করে ত্বকে মিলিয়ে দিন।`,
    ingredients: `WATER, GLYCERIN, ACETYL HEXAPEPTIDE-8, PALMITOYL PENTAPEPTIDE-4, COPPER TRIPEPTIDE-1, NIACINAMIDE, ADENOSINE, SODIUM HYALURONATE, BUTYLENE GLYCOL, 1,2-HEXANEDIOL, BETAINE, PANTHENOL, ALLANTOIN, CARBOMER, ARGININE, ETHYLHEXYLGLYCERIN.

উপাদানসমূহ: পানি, গ্লিসারিন, অ্যাসিটাইল হেক্সাপেপটাইড-৮, পালমিটয়েল পেন্টাপেপটাইড-৪, কপার ট্রাইপেপটাইড-১, নিয়াসিনামাইড, অ্যাডিনোসিন, সোডিয়াম হায়ালুরোনেট, বিউটিলিন গ্লাইকল, ১,২-হেক্সেনডিওল, বেটেইন, প্যানথেনল, অ্যালানটয়েন।`,
    badge: 'Anti-Wrinkle',
    isFeatured: true
  }
];

export const DEFAULT_COUPONS: Coupon[] = [];

export const DEFAULT_BRANDS: Brand[] = [
  {
    id: 'brand-fantine',
    name: 'FANTINE Korea',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
];

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

export const DEFAULT_DELIVERY_METHODS: DeliveryMethodItem[] = [
  {
    id: 'dm-inside-dhaka',
    title: 'Inside Dhaka (ঢাকা মেট্রো সিটি)',
    subtitle: '২৪-৪৮ ঘণ্টার মধ্যে ফাস্ট হোম ডেলিভারি',
    status: 'Active',
    mode: 'Weight based',
    type: 'Weight based',
    areaScope: 'inside_dhaka',
    pricingModel: 'weight_based',
    baseWeightKg: 1.0,
    baseCharge: 70,
    additionalChargePerKg: 20,
    minimumCharge: 70,
    maximumCharge: 500,
    deliveryCharge: 70,
    freeDeliveryThreshold: 2000,
    estimatedDays: '24-48 Hours',
    courierPartner: 'Steadfast / Pathao',
    updatedAt: 'Oct 21, 2026'
  },
  {
    id: 'dm-dhaka-suburbs',
    title: 'Dhaka Suburbs (ঢাকা উপশহর)',
    subtitle: 'গাজীপুর, নারায়ণগঞ্জ, সাভার, কেরানীগঞ্জ',
    status: 'Active',
    mode: 'Weight based',
    type: 'Weight based',
    areaScope: 'dhaka_suburbs',
    pricingModel: 'weight_based',
    baseWeightKg: 1.0,
    baseCharge: 100,
    additionalChargePerKg: 25,
    minimumCharge: 100,
    maximumCharge: 600,
    deliveryCharge: 100,
    freeDeliveryThreshold: 2500,
    estimatedDays: '2-3 Days',
    courierPartner: 'Steadfast / RedX',
    updatedAt: 'Oct 21, 2026'
  },
  {
    id: 'dm-outside-dhaka',
    title: 'Outside Dhaka (সারাদেশে হোম ডেলিভারি)',
    subtitle: 'সকল জেলা ও থানা পর্যায়ে কুরিয়ারে ক্যাশ অন ডেলিভারি',
    status: 'Active',
    mode: 'Weight based',
    type: 'Weight based',
    areaScope: 'outside_dhaka',
    pricingModel: 'weight_based',
    baseWeightKg: 1.0,
    baseCharge: 130,
    additionalChargePerKg: 30,
    minimumCharge: 130,
    maximumCharge: 800,
    deliveryCharge: 130,
    freeDeliveryThreshold: 3000,
    estimatedDays: '2-4 Days',
    courierPartner: 'Steadfast / eCourier',
    updatedAt: 'Oct 21, 2026'
  },
  {
    id: 'dm-express-dhaka',
    title: 'Dhaka Same-Day Express (জরুরি ডেলিভারি)',
    subtitle: 'অর্ডার করার ১২ ঘণ্টার মধ্যে দ্রুততম ডেলিভারি',
    status: 'Active',
    mode: 'Fixed',
    type: 'Fixed',
    areaScope: 'inside_dhaka',
    pricingModel: 'flat',
    baseWeightKg: 1.0,
    baseCharge: 140,
    additionalChargePerKg: 0,
    minimumCharge: 140,
    maximumCharge: 200,
    deliveryCharge: 140,
    freeDeliveryThreshold: 0,
    estimatedDays: 'Same Day (12h)',
    courierPartner: 'Pathao Rider',
    updatedAt: 'Oct 21, 2026'
  }
];

export const DEFAULT_PROMO_CARDS: PromoCardItem[] = [
  {
    id: 'promo-1',
    title: 'PREDATOR HELIOS NEO 16',
    badge: 'PREDATOR',
    subtitle: 'POWER. PRECISION. PREDATOR.',
    discountText: '3,20,000 BDT',
    imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'promo-2',
    title: 'MSI VECTOR A16 HX',
    badge: 'MSI EDITION',
    subtitle: 'POWER. PRECISION. VICTORY.',
    discountText: '2,59,999 BDT',
    imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500&auto=format&fit=crop&q=80'
  }
];

export const DEFAULT_ABOUT_SETTINGS: import('../types').AboutPageSettings = {
  title: 'about us',
  subtitle: 'প্রিমিয়াম স্কিনকেয়ার And কোরিয়ান ডার্মাটোলজি এক্সিলেন্স',
  content: `FANTINE-এ আমরা বিশ্বাস করি ত্বকের যত্ন কেবল বাহ্যিক সৌন্দর্য নয়, বরং আত্মবিশ্বাস ও সুস্থতার একT অংশ।

আমরা সরাসরি দক্ষিণ কোরিয়ার আধুনিক ল্যাবরেটরি from সংগৃহীত প্রিমিয়াম হ্যানবাং হার্বাল ফর্মুলেশন ও ক্লিনিক্যাল স্কিনকেয়ার উপাদান সরবরাহ করি। আমাদের প্রতিT প্Roডাক্ট 10০% আসল, ল্যাব-টেস্টেড And নিরাপদ।

আমাদের লক্ষ্য হলো Bangladeshের প্রতিT customerের কাছে সেরা মানের আন্তর্জাতিক স্কিনকেয়ার product সহজলভ্য And নির্ভরযোগ্যভাবে পৌঁছে দেওয়া।`,
  image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=1600&auto=format&fit=crop&q=85',
  badge: 'CLINICAL K-BEAUTY & BOTANICAL SCIENCE',
  heroTitle: 'The Heritage of Clinical Hanbang & Dermal Science',
  heroSubtitle: 'Forged in Seoul by Brandini Co., Ltd., FANTINE harmonizes centuries-old Korean herbal remedies with cutting-edge active bio-fermentation.',
  heroImage: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=1600&auto=format&fit=crop&q=85',
  storyBadge: 'PHILOSOPHY & LEGACY',
  storyTitle: 'Clinical Botanical Purity with Proven Results',
  storySubtitle: 'From Gangnam Research Labs to Global Beauty Aficionados',
  storyParagraph1: 'FANTINE was born out of a profound commitment to restorative dermal health. By fusing high-potency Hanbang botanicals—such as 6-year aged Korean Red Ginseng, Fermented Rice Bran, Camellia Sinensis, and Centella Asiatica—with clinical actives like Niacinamide, Stabilized Vitamin C, and 5-Multi Ceramides, we deliver formulas that deeply replenish without compromising sensitive skin barriers.',
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
  hqTitle: 'Brandini Co., Ltd. Seoul Headquarters',
  hqSubtitle: 'Global R&D Center & Innovation Hub',
  hqAddress: '9F, Gangnamjeil Bldg, 109, Teheran-ro, Gangnam-gu, Seoul, Republic of Korea',
  hqImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=85',
  missionStatement: 'We sincerely hope we can relieve your tensions and stresses, and give you a healthier and more peaceful life.',
  founderQuote: 'True skin radiance is not an overnight illusion, but a harmonious balance between natural botanical resilience and scientific dermal precision.',
  founderName: 'FANTINE Dermal Research Institute',
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

export const DEFAULT_HERO_BANNERS: import('../types').HeroBannerItem[] = [
  {
    id: 'banner-1',
    title: '3-in-1 Triple Chamber Laundry Detergent Pods',
    subtitle: 'Deep Stain Removal • Long-Lasting Fragrance • Fiber Protection & Anti-Bacterial Care',
    badge: 'INNOVATIVE LAUNDRY CARE',
    discountText: 'UP TO 28% OFF',
    showDiscount: true,
    imageOnly: false,
    bgGradient: 'from-slate-950/85 via-slate-900/60 to-transparent',
    imageUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=1920&auto=format&fit=crop&q=85',
    mobileImageUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&auto=format&fit=crop&q=85',
    link: '/product/3-in-1-laundry-detergent-pods',
    actionType: 'product',
    productId: '3-in-1-laundry-detergent-pods'
  },
  {
    id: 'banner-2',
    title: 'Global OEM/ODM Custom Manufacturing & Export',
    subtitle: 'Capacity of 3 Billion Pods/Year • Custom Fragrance, Formula, Packaging & Water-Soluble Film',
    badge: 'WHOLESALE & EXPORT FACTORY',
    discountText: 'FACTORY DIRECT MOQ',
    showDiscount: true,
    imageOnly: false,
    bgGradient: 'from-[#0b1b3d]/90 via-[#102a5c]/60 to-transparent',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1920&auto=format&fit=crop&q=85',
    mobileImageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=85',
    link: '#quote',
    actionType: 'external'
  },
  {
    id: 'banner-3',
    title: 'Eco-Friendly Detergent Sheets & Booster Beads',
    subtitle: '100% Biodegradable & Quick Dissolving PVA Film • Non-Toxic Eco Formulation',
    badge: 'ECO-FRIENDLY & SUSTAINABLE',
    discountText: 'SPECIAL COMBO PACK',
    showDiscount: true,
    imageOnly: false,
    bgGradient: 'from-[#064e3b]/90 via-[#065f46]/60 to-transparent',
    imageUrl: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=1920&auto=format&fit=crop&q=85',
    mobileImageUrl: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&auto=format&fit=crop&q=85',
    link: '/shop',
    actionType: 'external'
  }
];

export const DEFAULT_HEADER_SETTINGS: HeaderSettings = {
  showTopBar: true,
  phone: '+86 18027300683',
  email: 'authentic.factory@outlook.com',
  socialLinks: {
    facebook: 'https://facebook.com',
    youtube: 'https://youtube.com',
    instagram: 'https://instagram.com',
    linkedin: 'https://linkedin.com',
    tiktok: 'https://tiktok.com',
    whatsapp: '+86 18027300683'
  },
  logoUrl: '/livewellfresh_logo.png',
  brandName: 'livewellfresh',
  menuItems: [
    {
      id: 'menu-1',
      label: 'About livewellfresh',
      link: '/about',
      hasDropdown: true,
      dropdownItems: [
        { label: 'Company Overview', link: '/about' },
        { label: 'Manufacturing Facility', link: '/about' },
        { label: 'Certifications & QC', link: '/about' },
        { label: 'R&D Fragrance Lab', link: '/about' }
      ]
    },
    {
      id: 'menu-2',
      label: 'Products',
      link: '/shop',
      hasDropdown: true,
      dropdownItems: [
        { label: '3-in-1 Laundry Pods', link: '/product/3-in-1-laundry-detergent-pods' },
        { label: 'Scent Booster Beads', link: '/shop' },
        { label: 'Dishwasher Pods', link: '/shop' },
        { label: 'Concentrated Laundry Sheets', link: '/shop' }
      ]
    },
    {
      id: 'menu-3',
      label: 'OEM/ODM Solutions',
      link: '/shop',
      hasDropdown: false
    },
    {
      id: 'menu-4',
      label: 'Blog',
      link: '/about',
      hasDropdown: false
    },
    {
      id: 'menu-5',
      label: 'Contact',
      link: '/contact',
      hasDropdown: false
    }
  ],
  ctaButtonText: 'Get A Quote',
  ctaButtonLink: '#quote',
  ctaActionType: 'quote_modal',
  showCtaButton: true
};

export const DEFAULT_ECOM_SETTINGS: EcomSettings = {
  headerSettings: DEFAULT_HEADER_SETTINGS,
  storeName: 'livewellfresh',
  companyName: 'livewellfresh Ltd.',
  storeLogo: '/livewellfresh_logo.png',
  storeTagline: 'FRESH CLOTHES. BETTER LIFE',
  topAnnouncementText: 'WELCOME TO LIVEWELLFRESH • FRESH CLOTHES. BETTER LIFE',
  contactEmail: 'authentic.factory@outlook.com',
  contactPhone: '+86 18027300683',
  storeAddress: 'No. 88 Industrial Avenue, High-Tech Manufacturing Zone',
  footerDescription: 'livewellfresh • Innovative 3-in-1 Triple Chamber Laundry Pods & Eco Detergent Care. Fresh Clothes. Better Life.',
  socialLinks: {
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    youtube: 'https://youtube.com',
    twitter: '',
    tiktok: 'https://tiktok.com',
    linkedin: 'https://linkedin.com',
    whatsapp: '+86 18027300683'
  },
  primaryColor: '#0284c7',
  gtmId: '',
  deliveryChargeInsideDhaka: 0,
  deliveryChargeOutsideDhaka: 0,
  bkashNumber: '',
  nagadNumber: '',
  paymentGateways: DEFAULT_PAYMENT_GATEWAYS,
  deliveryMethods: DEFAULT_DELIVERY_METHODS,
  categories: ['Laundry Detergent Pods', '3-in-1 Detergent Pods', 'Scent Booster Beads', 'Dishwasher Pods', 'Ultra Clean Series'],
  heroBanners: DEFAULT_HERO_BANNERS,
  promoCards: DEFAULT_PROMO_CARDS,
  showViewCountOnWebsite: true,
  websiteViewsCount: 14200,
  landingViewsCount: 8900,
  aboutSettings: DEFAULT_ABOUT_SETTINGS,
  flashSale: DEFAULT_FLASH_SALE_SETTINGS,
  highlightSpotlight: DEFAULT_HIGHLIGHT_SPOTLIGHT_SETTINGS
};

export const DEFAULT_INSTITUTE_INFO: InstituteInfo = {
  name: 'livewellfresh Ltd.',
  logo: '/livewellfresh_logo.png',
  regNo: '',
  phone: '+86 18027300683',
  email: 'authentic.factory@outlook.com',
  address: 'No. 88 Industrial Avenue, High-Tech Manufacturing Zone',
  street: 'No. 88 Industrial Avenue',
  description: 'livewellfresh • Innovative 3-in-1 Triple Chamber Laundry Pods & Eco Detergent Care. Fresh Clothes. Better Life.',
  industry: 'Laundry & Cleaning Products',
  bearingRollLocation: 'High-Tech Manufacturing Zone'
};

export const DEFAULT_LANDING_PAGE_SETTINGS: import('../types').LandingPageData = {
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

export const createDefaultLandingForProduct = (product: Product): import('../types').LandingPageData => {
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
    title: 'livewellfresh VIP Club Card',
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

