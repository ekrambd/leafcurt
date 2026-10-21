const fs = require('fs');
const path = require('path');

const storageFile = path.join(__dirname, '..', 'prisma', 'products.json');
if (!fs.existsSync(storageFile)) {
  console.log('No products.json file found at', storageFile);
  process.exit(0);
}

const products = JSON.parse(fs.readFileSync(storageFile, 'utf8'));
const vcIndex = products.findIndex(p => p.id === 'prod-vc-brightening-serum');

if (vcIndex !== -1) {
  products[vcIndex].description = `Powerful antioxidant capacity with a high concentration of pure Vitamin C, delivering a true Vitamin C serum.

পণ্যের বিবরণ:
বিশুদ্ধ ভিটামিন সি-এর উচ্চ ঘনত্বের সমন্বয়ে গঠিত এই সিরামটি শক্তিশালী অ্যান্টি-অক্সিডেন্ট কার্যকারিতা প্রদান করে।`;

  products[vcIndex].benefitsHighlights = `Pure Vitamin C,
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
✨ টেক্সচার/লোমকূপ: ৭/১০`;

  products[vcIndex].howToUse = `After cleansing in the morning and evening, use your fingertips to apply three pumps of serum to damp skin. Gently press the serum into the skin with your palms to enhance absorption.

ব্যবহারবিধি:
সকাল ও সন্ধ্যায় ত্বক পরিষ্কার করার পর, আঙুলের সাহায্যে তিন পাম্প পরিমাণ সিরাম ভেজা ত্বকে লাগান। সিরামটি ভালোভাবে শোষিত হতে সাহায্য করার জন্য হাতের তালু দিয়ে আলতোভাবে ত্বকে চেপে দিন।`;

  products[vcIndex].howToUseIt = products[vcIndex].howToUse;

  products[vcIndex].ingredients = `WATER, ETHOXYDIGLYCOL, ASCORBIC ACID, PROPANEDIOL, DIPROPYL-ENE GLYCOL, PEG-8, BETAINE, 1,2-HEXANE-DIOL, PANTHENOL, SODIUM HYDROXIDE, FERULIC ACID, HYDROXYACETOPHENONE, SALICYLIC ACID, XANTHAN GUM OTHER TRACE COMPONENTS: SODIUM HYALURONATE

উপাদানসমূহ: পানি, ইথোক্সিডাইগ্লাইকল, অ্যাসকরবিক অ্যাসিড, প্রোপেনডিওল, ডাইপ্রোপিলিন গ্লাইকল, পিইজি-৮ (PEG-8), বেটেইন, ১,২-হেক্সেনডিওল, প্যানথেনল, সোডিয়াম হাইড্রোক্সাইড, ফেরুলিক অ্যাসিড, হাইড্রোক্সিয়াসিটোফেনন, স্যালিসাইলিক অ্যাসিড, জ্যান্থান গাম। অন্যান্য অতি সামান্য উপাদান: সোডিয়াম হায়ালুরোনেট।`;

  fs.writeFileSync(storageFile, JSON.stringify(products, null, 2), 'utf8');
  console.log('Successfully updated prod-vc-brightening-serum in products.json!');
} else {
  console.log('prod-vc-brightening-serum not found in products.json');
}
