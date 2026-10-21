import { Product, DeliveryMethodItem, DeliveryAreaScope } from '../types';

export const DHAKA_SUBURBS = [
  'gazipur',
  'narayanganj',
  'savar',
  'keraniganj',
  'munshiganj',
  'narsingdi'
];

export const BD_ALL_DISTRICTS = [
  'Dhaka',
  'Gazipur',
  'Narayanganj',
  'Chattogram',
  'Sylhet',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Rangpur',
  'Mymensingh',
  'Cumilla',
  "Cox's Bazar",
  'Brahmanbaria',
  'Chandpur',
  'Noakhali',
  'Feni',
  'Lakshmipur',
  'Tangail',
  'Kishoreganj',
  'Narsingdi',
  'Manikganj',
  'Munshiganj',
  'Faridpur',
  'Gopalganj',
  'Madaripur',
  'Rajbari',
  'Shariatpur',
  'Bogura',
  'Pabna',
  'Sirajganj',
  'Naogaon',
  'Natore',
  'Chapainawabganj',
  'Joypurhat',
  'Jashore',
  'Satkhira',
  'Kushtia',
  'Magura',
  'Meherpur',
  'Narail',
  'Chuadanga',
  'Jhenaidah',
  'Bagerhat',
  'Patuakhali',
  'Bhola',
  'Pirojpur',
  'Barguna',
  'Jhalokathi',
  'Dinajpur',
  'Kurigram',
  'Gaibandha',
  'Nilphamari',
  'Panchagarh',
  'Thakurgaon',
  'Lalmonirhat',
  'Habiganj',
  'Moulvibazar',
  'Sunamganj',
  'Netrokona',
  'Jamalpur',
  'Sherpur',
  'Bandarban',
  'Rangamati',
  'Khagrachhari'
];

/**
 * Calculates a product's individual unit weight in kg.
 */
export function calculateProductWeight(product: Product): number {
  if (product.weightKg && product.weightKg > 0) {
    return Number(product.weightKg);
  }

  // Attempt parsing weight from weightBadge (e.g. "Basis weight: 25g/pcs" or "Weight: 1kg")
  if (product.weightBadge) {
    const raw = product.weightBadge.toLowerCase();
    const kgMatch = raw.match(/([\d.]+)\s*kg/);
    if (kgMatch && kgMatch[1]) {
      return Number(kgMatch[1]);
    }
    const gMatch = raw.match(/([\d.]+)\s*g/);
    if (gMatch && gMatch[1]) {
      const grams = Number(gMatch[1]);
      // If it says "25g/pcs", a pack of 20 pods = 500g = 0.5kg
      if (grams <= 50) {
        return 0.5; // Standard 20-30 pod box
      }
      return Number((grams / 1000).toFixed(2));
    }
  }

  // Fallback realistic ecommerce unit parcel weight
  return 0.5; // 500 grams default
}

/**
 * Calculates total weight of all items in cart (in kg).
 */
export function calculateCartTotalWeight(cart: { product: Product; quantity: number }[]): number {
  if (!cart || cart.length === 0) return 0.5;
  const total = cart.reduce((sum, item) => {
    const unitWeight = calculateProductWeight(item.product);
    const qty = Math.max(1, Number(item.quantity) || 1);
    return sum + (unitWeight * qty);
  }, 0);
  return Number(Math.max(0.2, total).toFixed(2));
}

/**
 * Checks if a customer's selected district falls into a delivery method's area scope.
 */
export function isDistrictInScope(
  districtName: string,
  areaScope?: DeliveryAreaScope,
  customDistricts?: string[]
): boolean {
  if (!areaScope || areaScope === 'all') return true;

  const clean = (districtName || '').toLowerCase().trim();
  const isDhakaExact = clean === 'dhaka' || (clean.includes('dhaka') && !clean.includes('sub'));
  const isSuburb = DHAKA_SUBURBS.some(sub => clean.includes(sub));

  switch (areaScope) {
    case 'inside_dhaka':
      return isDhakaExact && !isSuburb;

    case 'dhaka_suburbs':
      return isSuburb;

    case 'outside_dhaka':
      // Anyone not in main Dhaka City Metro
      return !isDhakaExact;

    case 'custom_districts':
      if (!customDistricts || customDistricts.length === 0) return false;
      return customDistricts.some(cd => cd.toLowerCase().trim() === clean || clean.includes(cd.toLowerCase().trim()));

    default:
      return true;
  }
}

export interface DeliveryCalculationResult {
  finalCharge: number;
  isFreeDelivery: boolean;
  breakdownText: string;
  baseCharge: number;
  baseWeightKg: number;
  extraWeightKg: number;
  extraCharge: number;
  effectiveWeightKg: number;
  pricingModel: 'flat' | 'weight_based';
}

/**
 * Calculates delivery fee based on method settings, cart total amount, and cart weight.
 */
export function calculateDeliveryCharge(
  method: DeliveryMethodItem,
  cartSubtotal: number,
  cartWeightKg: number
): DeliveryCalculationResult {
  const isWeightBased = method.pricingModel === 'weight_based' || method.type === 'Weight based';
  const baseCharge = Number(method.baseCharge ?? method.deliveryCharge ?? 0);
  const baseWeightKg = Number(method.baseWeightKg ?? 1.0);
  const additionalPerKg = Number(method.additionalChargePerKg ?? 20);
  const effectiveWeight = Math.max(0.1, Number(cartWeightKg) || 0.5);

  // Check free delivery threshold
  const freeThreshold = Number(method.freeDeliveryThreshold || 0);
  if (freeThreshold > 0 && cartSubtotal >= freeThreshold) {
    return {
      finalCharge: 0,
      isFreeDelivery: true,
      breakdownText: `ফ্রি ডেলিভারি (অর্ডার ৳${freeThreshold.toLocaleString()} এর বেশি)`,
      baseCharge,
      baseWeightKg,
      extraWeightKg: 0,
      extraCharge: 0,
      effectiveWeightKg: effectiveWeight,
      pricingModel: isWeightBased ? 'weight_based' : 'flat'
    };
  }

  // Weight-based calculation
  if (isWeightBased) {
    if (effectiveWeight <= baseWeightKg) {
      return {
        finalCharge: baseCharge,
        isFreeDelivery: false,
        breakdownText: `৳${baseCharge} (বেস ${baseWeightKg} kg পর্যন্ত)`,
        baseCharge,
        baseWeightKg,
        extraWeightKg: 0,
        extraCharge: 0,
        effectiveWeightKg: effectiveWeight,
        pricingModel: 'weight_based'
      };
    }

    const extraWeight = Math.ceil(effectiveWeight - baseWeightKg);
    const extraCharge = extraWeight * additionalPerKg;
    const finalCharge = baseCharge + extraCharge;

    return {
      finalCharge,
      isFreeDelivery: false,
      breakdownText: `৳${baseCharge} (১ম ${baseWeightKg} kg) + ৳${extraCharge} (অতিরিক্ত ${extraWeight} kg)`,
      baseCharge,
      baseWeightKg,
      extraWeightKg: extraWeight,
      extraCharge,
      effectiveWeightKg: effectiveWeight,
      pricingModel: 'weight_based'
    };
  }

  // Flat rate calculation
  const flatFee = Number(method.deliveryCharge ?? baseCharge ?? 0);
  return {
    finalCharge: flatFee,
    isFreeDelivery: false,
    breakdownText: 'স্থির চার্জ (Flat Rate)',
    baseCharge: flatFee,
    baseWeightKg,
    extraWeightKg: 0,
    extraCharge: 0,
    effectiveWeightKg: effectiveWeight,
    pricingModel: 'flat'
  };
}

/**
 * Filters and prioritizes delivery methods for a given customer district.
 */
export function filterDeliveryMethodsForDistrict(
  methods: DeliveryMethodItem[],
  districtName: string
): DeliveryMethodItem[] {
  const activeMethods = methods.filter(m => m.status === 'Active');
  if (activeMethods.length === 0) return [];

  // Match methods that explicitly fit this district
  const matched = activeMethods.filter(m => isDistrictInScope(districtName, m.areaScope, m.customDistricts));
  if (matched.length > 0) {
    return matched;
  }

  // Fallback to 'all' nationwide methods if no specific area matched
  const nationwide = activeMethods.filter(m => !m.areaScope || m.areaScope === 'all');
  if (nationwide.length > 0) return nationwide;

  // Ultimate fallback to whatever active methods exist
  return activeMethods;
}
