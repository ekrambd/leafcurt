import { trackEvent, createEventId } from '../lib/pixelGtmService';
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Copy, 
  Smartphone, 
  CreditCard, 
  Gift,
  ChevronRight,
  CheckCircle2,
  MessageCircle,
  Truck,
  Scale,
  MapPin,
  Clock,
  Sparkles,
  Award,
  Coins
} from 'lucide-react';
import { Product, BookOrder, EcomSettings, DeliveryMethodItem, PaymentGatewayItem, Coupon, AbandonedCartItem, VipTier, DigitalLoyaltyCard, ClubMember } from '../types';
import { dbService } from '../lib/dbService';
import { DEFAULT_DELIVERY_METHODS, DEFAULT_PAYMENT_GATEWAYS } from '../lib/constants';
import { getCustomerSession, setCustomerSession } from '../lib/customerAuth';
import { BD_ALL_DISTRICTS, DHAKA_SUBURBS, calculateCartTotalWeight, calculateDeliveryCharge, filterDeliveryMethodsForDistrict } from '../lib/deliveryCalculator';
import { validateCustomerName, validateBdPhone, validateRealAddress, validateOrderCustomerDetails } from '../lib/orderValidation';
import { ApiClient } from '../services/apiClient';

const BD_DISTRICTS = [
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
  'Jhenaidah',
  'Chuadanga',
  'Meherpur',
  'Bagerhat',
  'Narail',
  'Magura',
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

interface CartItem {
  product: Product;
  quantity: number;
  variant?: any;
  selectedColor?: string;
  selectedSize?: string;
  selectedVariant?: string;
}

interface CheckoutPageProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  ecomSettings: EcomSettings;
  onNavigateHome: () => void;
  onNavigateShop: () => void;
  onOpenLoginModal?: () => void;
}

export default function CheckoutPage({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  ecomSettings,
  onNavigateHome,
  onNavigateShop,
  onOpenLoginModal
}: CheckoutPageProps) {
  // Form State (Pre-filled if logged in)
  const initialCustomer = useMemo(() => getCustomerSession(), []);
  const [name, setName] = useState(() => initialCustomer?.name || '');
  const [phone, setPhone] = useState(() => initialCustomer?.phone || '');
  const [email, setEmail] = useState(() => initialCustomer?.email || '');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [thana, setThana] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [isBillingSame, setIsBillingSame] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Animated typing demo placeholder for address input
  const demoAddresses = useMemo(() => [
    'বাড়ি # ১২, রোড # ৪, সেক্টর # ৩, উত্তরা, ঢাকা',
    'ফ্ল্যাট ৪বি, বাড়ি ২৫, ধানমন্ডি ২/এ, ঢাকা',
    'হাউস # ১০, রোড # ৭, বনশ্রী ব্লক-বি, রামপুরা, ঢাকা',
    'দোকান নং ১৫, চকবাজার, কোতোয়ালী, চট্টগ্রাম',
    'উপশহর রোড, হাউজিং এস্টেট, সিলেট সদর'
  ], []);

  const [placeholderText, setPlaceholderText] = useState(demoAddresses[0]);

  useEffect(() => {
    let currentIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let timer: any = null;

    const tick = () => {
      const fullText = demoAddresses[currentIdx];
      if (!isDeleting) {
        setPlaceholderText(fullText.slice(0, charIdx + 1));
        charIdx++;
        if (charIdx === fullText.length) {
          isDeleting = true;
          timer = setTimeout(tick, 2200); // pause on full text
          return;
        }
        timer = setTimeout(tick, 60);
      } else {
        setPlaceholderText(fullText.slice(0, charIdx - 1));
        charIdx--;
        if (charIdx === 0) {
          isDeleting = false;
          currentIdx = (currentIdx + 1) % demoAddresses.length;
          timer = setTimeout(tick, 400); // pause before typing next
          return;
        }
        timer = setTimeout(tick, 30);
      }
    };

    timer = setTimeout(tick, 1000);
    return () => clearTimeout(timer);
  }, [demoAddresses]);

  // Pathao Official Courier Integration State
  const [pathaoCities, setPathaoCities] = useState<{ city_id: number; city_name: string }[]>([]);
  const [pathaoZones, setPathaoZones] = useState<{ zone_id: number; zone_name: string }[]>([]);
  const [pathaoAreas, setPathaoAreas] = useState<{ area_id: number; area_name: string }[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [isLoadingPathao, setIsLoadingPathao] = useState(false);
  const [pathaoCalculatedPrice, setPathaoCalculatedPrice] = useState<number | null>(null);
  const [pathaoPriceDetails, setPathaoPriceDetails] = useState<{ price: number; final_price: number; discount?: number } | null>(null);

  // Fetch Pathao Cities on load
  useEffect(() => {
    let isMounted = true;
    ApiClient.getPathaoCities()
      .then(res => {
        if (!isMounted) return;
        const list = res?.data?.data || res?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          setPathaoCities(list);
          // Try to select Dhaka by default if available
          const dhaka = list.find((c: any) => c.city_name?.toLowerCase().includes('dhaka'));
          if (dhaka) {
            setSelectedCityId(dhaka.city_id);
            setDistrict(dhaka.city_name);
          } else {
            setSelectedCityId(list[0].city_id);
            setDistrict(list[0].city_name);
          }
        }
      })
      .catch(() => {
        // Fallback or offline, non-blocking
      });
    return () => { isMounted = false; };
  }, []);

  // Fetch Pathao Zones when City changes
  useEffect(() => {
    if (!selectedCityId) {
      setPathaoZones([]);
      setSelectedZoneId(null);
      return;
    }
    let isMounted = true;
    setIsLoadingPathao(true);
    ApiClient.getPathaoZones(selectedCityId)
      .then(res => {
        if (!isMounted) return;
        const list = res?.data?.data || res?.data || [];
        if (Array.isArray(list)) {
          setPathaoZones(list);
          if (list.length > 0) {
            setSelectedZoneId(list[0].zone_id);
            setThana(list[0].zone_name);
          } else {
            setSelectedZoneId(null);
            setThana('');
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoadingPathao(false);
      });
    return () => { isMounted = false; };
  }, [selectedCityId]);

  // Fetch Pathao Areas when Zone changes
  useEffect(() => {
    if (!selectedZoneId) {
      setPathaoAreas([]);
      setSelectedAreaId(null);
      return;
    }
    let isMounted = true;
    ApiClient.getPathaoAreas(selectedZoneId)
      .then(res => {
        if (!isMounted) return;
        const list = res?.data?.data || res?.data || [];
        if (Array.isArray(list)) {
          setPathaoAreas(list);
          if (list.length > 0) {
            setSelectedAreaId(list[0].area_id);
          } else {
            setSelectedAreaId(null);
          }
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [selectedZoneId]);

  // Calculate Cart Subtotal & Total Parcel Weight
  const cartSubtotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const price = item.product.price || item.product.regularPrice || 0;
      return total + (price * item.quantity);
    }, 0);
  }, [cart]);

  const cartTotalWeight = useMemo(() => {
    return calculateCartTotalWeight(cart);
  }, [cart]);

  // Dynamic Delivery Methods from Admin Settings filtered by District
  const activeDeliveryMethods = useMemo<DeliveryMethodItem[]>(() => {
    const allMethods = Array.isArray(ecomSettings?.deliveryMethods)
      ? ecomSettings.deliveryMethods.filter(m => m.status === 'Active')
      : [];

    return filterDeliveryMethodsForDistrict(allMethods, district);
  }, [ecomSettings?.deliveryMethods, district]);

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

  // Intelligent Auto-detect City and Zone from typed address string
  useEffect(() => {
    if (!address || address.trim().length < 3 || pathaoCities.length === 0) return;
    const cleanAddr = address.toLowerCase();

    // 1. Try to find matching city/district
    const matchedCity = pathaoCities.find(c => {
      const cName = c.city_name.toLowerCase();
      // Match English or direct substring
      return cleanAddr.includes(cName) || 
        (cName.includes('dhaka') && (cleanAddr.includes('ঢাকা') || cleanAddr.includes('dhaka'))) ||
        (cName.includes('chittagong') && (cleanAddr.includes('চট্টগ্রাম') || cleanAddr.includes('ctg') || cleanAddr.includes('chittagong'))) ||
        (cName.includes('sylhet') && (cleanAddr.includes('সিলেট') || cleanAddr.includes('sylhet'))) ||
        (cName.includes('rajshahi') && (cleanAddr.includes('রাজশাহী') || cleanAddr.includes('rajshahi'))) ||
        (cName.includes('khulna') && (cleanAddr.includes('খুলনা') || cleanAddr.includes('khulna'))) ||
        (cName.includes('rangpur') && (cleanAddr.includes('রংপুর') || cleanAddr.includes('rangpur'))) ||
        (cName.includes('gazipur') && (cleanAddr.includes('গাজীপুর') || cleanAddr.includes('gazipur'))) ||
        (cName.includes('narayanganj') && (cleanAddr.includes('নারায়ণগঞ্জ') || cleanAddr.includes('narayanganj')));
    });

    if (matchedCity && matchedCity.city_id !== selectedCityId) {
      setSelectedCityId(matchedCity.city_id);
      setDistrict(matchedCity.city_name);
    }
  }, [address, pathaoCities, selectedCityId]);

  // Auto-detect zone once zones are loaded for that city
  useEffect(() => {
    if (!address || address.trim().length < 3 || pathaoZones.length === 0) return;
    const cleanAddr = address.toLowerCase();

    const matchedZone = pathaoZones.find(z => {
      const zName = z.zone_name.toLowerCase();
      if (zName.length < 3) return false;
      return cleanAddr.includes(zName);
    });

    if (matchedZone && matchedZone.zone_id !== selectedZoneId) {
      setSelectedZoneId(matchedZone.zone_id);
      setThana(matchedZone.zone_name);
    }
  }, [address, pathaoZones, selectedZoneId]);
  useEffect(() => {
    if (!selectedCityId || !selectedZoneId) {
      setPathaoCalculatedPrice(null);
      setPathaoPriceDetails(null);
      return;
    }

    let isMounted = true;
    const timeoutId = setTimeout(() => {
      ApiClient.calculatePathaoPrice({
        recipientCity: selectedCityId,
        recipientZone: selectedZoneId,
        itemWeight: Math.max(0.5, Number(cartTotalWeight) || 0.5),
        itemType: 2, // Parcel
        deliveryType: 48 // Normal delivery
      })
      .then(res => {
        if (!isMounted) return;
        if (res && res.data) {
          // Standard Delivery Fee is res.data.price (e.g. ৳130)
          const baseDeliveryFee = typeof res.data.price === 'number' ? res.data.price : (res.data.final_price || 130);
          setPathaoCalculatedPrice(baseDeliveryFee);
          setPathaoPriceDetails({
            price: baseDeliveryFee,
            final_price: typeof res.data.final_price === 'number' ? res.data.final_price : baseDeliveryFee,
            discount: res.data.discount || res.data.promo_discount || 0
          });
        }
      })
      .catch(() => {
        // Fallback gracefully without breaking checkout
      });
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [selectedCityId, selectedZoneId, cartTotalWeight]);

  const selectedDeliveryMethod = useMemo(() => {
    if (activeDeliveryMethods.length === 0) return null;
    return activeDeliveryMethods.find(m => m.id === selectedDeliveryMethodId) || activeDeliveryMethods[0] || null;
  }, [activeDeliveryMethods, selectedDeliveryMethodId]);

  // Method fee calculations cache for immediate UI display
  const methodCalculations = useMemo(() => {
    const map: Record<string, ReturnType<typeof calculateDeliveryCharge>> = {};
    const globalFree = ecomSettings?.freeDeliveryEnabled && 
                       ecomSettings?.freeDeliveryMinPurchase && 
                       cartSubtotal >= ecomSettings.freeDeliveryMinPurchase;

    activeDeliveryMethods.forEach(method => {
      const res = calculateDeliveryCharge(method, cartSubtotal, cartTotalWeight);
      if (globalFree) {
        res.finalCharge = 0;
        res.isFreeDelivery = true;
        res.breakdownText = `ফ্রি ডেলিভারি (স্পেশাল অফার ৳${ecomSettings.freeDeliveryMinPurchase}+)`;
      } else if (pathaoCalculatedPrice !== null && (method.courierPartner === 'Pathao' || !method.courierPartner)) {
        res.finalCharge = pathaoCalculatedPrice;
        res.breakdownText = `পাঠাও অফিসিয়াল রিয়েল-টাইম রেট (${cartTotalWeight} kg)`;
      }
      map[method.id] = res;
    });
    return map;
  }, [activeDeliveryMethods, cartSubtotal, cartTotalWeight, ecomSettings, pathaoCalculatedPrice]);

  const deliveryCalc = useMemo(() => {
    if (pathaoCalculatedPrice !== null && (!selectedDeliveryMethod || selectedDeliveryMethod.courierPartner === 'Pathao')) {
      const globalFree = ecomSettings?.freeDeliveryEnabled && 
                         ecomSettings?.freeDeliveryMinPurchase && 
                         cartSubtotal >= ecomSettings.freeDeliveryMinPurchase;
      return {
        finalCharge: globalFree ? 0 : pathaoCalculatedPrice,
        isFreeDelivery: Boolean(globalFree),
        breakdownText: globalFree ? `ফ্রি ডেলিভারি (স্পেশাল অফার ৳${ecomSettings.freeDeliveryMinPurchase}+)` : `পাঠাও অফিসিয়াল রেট (${cartTotalWeight} kg)`,
        effectiveWeightKg: cartTotalWeight
      };
    }

    if (!selectedDeliveryMethod) {
      return {
        finalCharge: 0,
        isFreeDelivery: true,
        breakdownText: '',
        effectiveWeightKg: cartTotalWeight
      };
    }
    return methodCalculations[selectedDeliveryMethod.id] || calculateDeliveryCharge(selectedDeliveryMethod, cartSubtotal, cartTotalWeight);
  }, [selectedDeliveryMethod, methodCalculations, cartSubtotal, cartTotalWeight, pathaoCalculatedPrice, ecomSettings]);

  const deliveryCost = pathaoCalculatedPrice !== null ? deliveryCalc.finalCharge : (selectedDeliveryMethod ? deliveryCalc.finalCharge : 0);

  // Payment Gateways from Admin
  const activePaymentGateways = useMemo<PaymentGatewayItem[]>(() => {
    let gateways = ecomSettings?.paymentGateways;
    if (!gateways || gateways.length === 0) {
      gateways = DEFAULT_PAYMENT_GATEWAYS;
    }
    const active = gateways.filter(g => g.status === 'Active');
    return active.length > 0 ? active : gateways;
  }, [ecomSettings?.paymentGateways]);

  const [selectedPaymentGatewayId, setSelectedPaymentGatewayId] = useState<string>('');
  const [senderPhone, setSenderPhone] = useState('');
  const [trxId, setTrxId] = useState('');
  const [copiedAccNo, setCopiedAccNo] = useState(false);

  useEffect(() => {
    if (activePaymentGateways.length > 0 && (!selectedPaymentGatewayId || !activePaymentGateways.some(g => g.id === selectedPaymentGatewayId))) {
      setSelectedPaymentGatewayId(activePaymentGateways[0].id);
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

  // Coupon Logic
  // Collapsed by default for first-time customers
  const [couponAccordionOpen, setCouponAccordionOpen] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);

  useEffect(() => {
    dbService.getCoupons().then(list => {
      setAvailableCoupons(list.filter(c => c.status === 'Active'));
    }).catch(() => {});
  }, []);

  // Cart Item Count

  const totalItemCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  const couponDiscountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percent') {
      const disc = Math.round((cartSubtotal * appliedCoupon.discount) / 100);
      return appliedCoupon.maxDiscount ? Math.min(disc, appliedCoupon.maxDiscount) : disc;
    }
    return Math.min(appliedCoupon.discount, cartSubtotal);
  }, [appliedCoupon, cartSubtotal]);

  const bogoEligible = useMemo(() => {
    return appliedCoupon && (appliedCoupon.usageCount || 0) >= 10 && cartSubtotal >= 2000;
  }, [appliedCoupon, cartSubtotal]);

  const gatewayDiscount = selectedPaymentGateway?.discountAmount ? Number(selectedPaymentGateway.discountAmount) : 0;
  const gatewayFee = selectedPaymentGateway?.transactionFee ? Number(selectedPaymentGateway.transactionFee) : 0;

  // VIP / Loyalty club discounts completely removed for now
  const memberDiscountAmount = 0;
  const pointsRedeemedTaka = 0;

  const grandTotal = Math.max(0, cartSubtotal + deliveryCost + gatewayFee - gatewayDiscount - couponDiscountAmount);

  // Track InitiateCheckout on checkout page entry
  useEffect(() => {
    if (cart.length > 0) {
      const eventId = createEventId('initiate_checkout');
      trackEvent('InitiateCheckout', {
        content_name: cart.map(i => i.product.title).join(', '),
        content_ids: cart.map(i => i.product.id),
        content_type: 'product',
        value: grandTotal || cartSubtotal,
        currency: 'BDT',
        num_items: totalItemCount,
        contents: cart.map(item => ({
          id: item.product.id,
          name: item.product.title,
          quantity: item.quantity,
          item_price: item.product.price
        }))
      }, eventId);
    }
  }, []);

  // Abandoned Cart Auto-Capture (Fixo Cart Architecture)
  const lastCapturedSignature = useRef<string>('');
  const isOrderCompletedRef = useRef<boolean>(false);

  const captureCurrentCart = useCallback(async () => {
    if (isOrderCompletedRef.current || cart.length === 0) return;
    const cleanPhone = phone.replace(/\D/g, '').replace(/^880/, '0').replace(/^88/, '');
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) return;

    const items: AbandonedCartItem[] = cart.map(item => ({
      productId: item.product.id,
      productTitle: item.product.title,
      productImage: item.product.coverImage || item.product.image,
      quantity: item.quantity,
      unitPrice: item.product.price || item.product.regularPrice || 0,
      totalPrice: (item.product.price || item.product.regularPrice || 0) * item.quantity,
      variant: item.selectedVariant || (item.selectedColor ? `${item.selectedColor}${item.selectedSize ? ' / ' + item.selectedSize : ''}` : undefined),
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize
    }));

    const signature = `${cleanPhone}|${name}|${address}|${district}|${grandTotal}|${cart.length}`;
    if (signature === lastCapturedSignature.current) return;
    lastCapturedSignature.current = signature;

    try {
      await dbService.captureAbandonedCart({
        customerPhone: cleanPhone,
        customerName: name.trim() || undefined,
        customerAddress: address.trim() || undefined,
        customerDistrict: district || undefined,
        customerEmail: email.trim() || undefined,
        items,
        subtotal: cartSubtotal,
        deliveryCharge: deliveryCost,
        totalAmount: grandTotal,
        source: 'storefront_checkout'
      });
    } catch (e) {
      console.warn('Abandoned cart capture error:', e);
    }
  }, [phone, name, address, district, email, cart, cartSubtotal, deliveryCost, grandTotal]);

  // Debounced auto-save on typing 11-digit phone number (500ms)
  useEffect(() => {
    const cleanPhone = phone.replace(/\D/g, '').replace(/^880/, '0').replace(/^88/, '');
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) return;

    const timer = setTimeout(() => {
      captureCurrentCart();
    }, 500);

    return () => clearTimeout(timer);
  }, [phone, name, address, district, cartSubtotal, deliveryCost, grandTotal, captureCurrentCart]);

  // Capture immediately if user leaves page before placing order
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isOrderCompletedRef.current) {
        captureCurrentCart();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [captureCurrentCart]);

  const handleApplyCoupon = (codeToApply?: string) => {
    const targetCode = (codeToApply || couponCodeInput).trim();
    if (!targetCode) return;
    setCouponError('');
    setCouponSuccess('');

    const match = availableCoupons.find(c => c.code.toLowerCase() === targetCode.toLowerCase());
    if (!match) {
      setCouponError('Invalid or expired coupon code.');
      return;
    }
    if (match.minSpent && cartSubtotal < match.minSpent) {
      setCouponError(`Minimum order of Tk.${match.minSpent.toLocaleString()} required for this coupon.`);
      return;
    }
    setAppliedCoupon(match);
    setCouponSuccess(`Coupon "${match.code}" applied successfully!`);
    setCouponCodeInput('');
  };

  const handleCopyAccountNumber = (acc: string) => {
    navigator.clipboard.writeText(acc);
    setCopiedAccNo(true);
    setTimeout(() => setCopiedAccNo(false), 2000);
  };

  // Order Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<BookOrder | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; phone?: string; address?: string }>({});

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation against fake/dummy names and non-BD phones (Address is optional)
    const validation = validateOrderCustomerDetails({ name, phone, address, allowOptionalAddress: true });
    if (!validation.isValid) {
      setFieldErrors({
        name: validateCustomerName(name).error,
        phone: validateBdPhone(phone).error,
        address: address.trim() ? validateRealAddress(address, true).error : undefined
      });
      alert(validation.errors[0]);
      return;
    }

    setFieldErrors({});
    const cleanCustomerName = validation.sanitized.name;
    const cleanPhone = validation.sanitized.phone;
    const cleanAddress = validation.sanitized.address || (thana && district ? `${thana}, ${district}` : (district || ''));

    if (cart.length === 0) {
      alert('Your shopping bag is empty.');
      return;
    }
    if (!agreeTerms) {
      alert('Please agree to the Terms & Conditions and Privacy Policy.');
      return;
    }
    if (isOnlinePayment && (!senderPhone.trim() || !trxId.trim())) {
      alert(`Please provide the Sender Phone Number and Transaction ID (TrxID) for ${selectedPaymentGateway?.title}.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const orderId = `ORD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      
      const orderPayload: BookOrder = {
        id: orderId,
        customerName: cleanCustomerName,
        name: cleanCustomerName,
        phone: cleanPhone,
        email: email.trim() || undefined,
        address: cleanAddress,
        district: district,
        thana: thana.trim() || undefined,
        recipientCity: selectedCityId || undefined,
        recipientCityName: pathaoCities.find(c => c.city_id === selectedCityId)?.city_name,
        recipientZone: selectedZoneId || undefined,
        recipientZoneName: pathaoZones.find(z => z.zone_id === selectedZoneId)?.zone_name,
        recipientArea: selectedAreaId || undefined,
        recipientAreaName: pathaoAreas.find(a => a.area_id === selectedAreaId)?.area_name,
        courierProvider: 'pathao',
        notes: (specialNotes.trim() ? specialNotes.trim() + '\n' : '') + (bogoEligible ? '[BOGO APPLIED: 11th+ Coupon Usage - Free Gift]' : '') || undefined,
        deliveryArea: selectedDeliveryMethod?.title || 'Standard Delivery',
        deliveryZone: selectedDeliveryMethod?.title || 'Standard Delivery',
        deliveryCharge: deliveryCost,
        price: cartSubtotal,
        unitPrice: cart.length === 1 ? cart[0].product.price : cartSubtotal,
        totalAmount: grandTotal,
        totalPrice: grandTotal,
        productName: cart.map(i => `${i.product.title} (x${i.quantity})`).join(', ') + (bogoEligible && cart.length > 0 ? `, [FREE] ${cart[0].product.title} (x1)` : ''),
        productTitle: cart.map(i => `${i.product.title} (x${i.quantity})`).join(', ') + (bogoEligible && cart.length > 0 ? `, [FREE] ${cart[0].product.title} (x1)` : ''),
        status: 'Pending',
        orderType: 'storefront',
        paymentMethod: selectedPaymentGateway?.title || 'Cash on Delivery',
        paymentGateway: selectedPaymentGateway?.title || 'Cash on Delivery',
        senderPhone: isOnlinePayment ? senderPhone.trim() : undefined,
        trxId: isOnlinePayment ? trxId.trim() : undefined,
        couponCode: appliedCoupon?.code,
        couponDiscount: couponDiscountAmount > 0 ? couponDiscountAmount : undefined,
        quantity: totalItemCount + (bogoEligible ? 1 : 0),
        createdAt: new Date().toISOString(),
        orderDate: new Date().toISOString(),
        items: (() => {
          const baseItems = cart.map(i => ({
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
          }));
          
          if (bogoEligible && baseItems.length > 0) {
            baseItems.push({
              product: {
                ...baseItems[0].product,
                id: `free-${baseItems[0].product.id}`,
                title: `[FREE GIFT] ${baseItems[0].product.title}`,
                price: 0
              },
              quantity: 1
            });
          }
          return baseItems;
        })()
      };

      // 1. Try Authoritative Server-Side Atomic Checkout first
      let confirmedOrder: BookOrder = orderPayload;
      let orderCreatedViaServer = false;

      try {
        const response = await fetch('/api/orders/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
            testEventCode: (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('meta_test_code') : undefined) || undefined,
            deliveryZone: selectedDeliveryMethod?.title || 'Pathao Courier',
            deliveryMethodId: selectedDeliveryMethod?.id,
            recipientCity: selectedCityId || undefined,
            recipientCityName: pathaoCities.find(c => c.city_id === selectedCityId)?.city_name,
            recipientZone: selectedZoneId || undefined,
            recipientZoneName: pathaoZones.find(z => z.zone_id === selectedZoneId)?.zone_name,
            recipientArea: selectedAreaId || undefined,
            recipientAreaName: pathaoAreas.find(a => a.area_id === selectedAreaId)?.area_name,
            courierProvider: 'pathao',
            deliveryCharge: deliveryCost,
            deliveryFee: deliveryCost,
            memberDiscount: memberDiscountAmount,
            pointsDiscount: pointsRedeemedTaka,
            paymentMethod: selectedPaymentGateway?.title || 'Cash on Delivery',
            senderPhone: isOnlinePayment ? senderPhone.trim() : undefined,
            trxId: isOnlinePayment ? trxId.trim() : undefined,
            couponCode: appliedCoupon?.code,
            items: (() => {
              const baseApiItems = cart.map(i => ({
                productId: i.product.id,
                quantity: i.quantity,
                price: i.product.price,
                regularPrice: i.product.regularPrice,
                title: i.product.title
              }));
              if (bogoEligible && baseApiItems.length > 0) {
                baseApiItems.push({
                  productId: baseApiItems[0].productId,
                  quantity: 1,
                  price: 0,
                  regularPrice: baseApiItems[0].regularPrice,
                  title: `[FREE GIFT] ${baseApiItems[0].title}`
                });
              }
              return baseApiItems;
            })()
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
      const totalItemsPurchased = cart.reduce((sum, item) => sum + item.quantity, 0);
      trackEvent('Purchase', {
        content_name: cart.map(i => i.product.title).join(', '),
        content_ids: cart.map(i => i.product.id),
        content_type: 'product',
        value: grandTotal || cartSubtotal,
        currency: 'BDT',
        num_items: totalItemsPurchased,
        contents: cart.map(item => ({
          id: item.product.id,
          name: item.product.title,
          quantity: item.quantity,
          item_price: item.product.price
        }))
      }, purchaseEventId);

      // Automatically establish customer session so buyer can leave verified reviews immediately
      const buyerPhone = confirmedOrder.customerPhone || confirmedOrder.phone;
      if (buyerPhone) {
        setCustomerSession({
          phone: buyerPhone,
          name: confirmedOrder.customerName,
          email: confirmedOrder.customerEmail
        });
      }

      isOrderCompletedRef.current = true;
      setOrderSuccess(confirmedOrder);
      onClearCart();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Order placement failed:', err);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ORDER SUCCESS SCREEN
  if (orderSuccess) {
    return (
      <div className="min-h-[80vh] bg-[#f8fafc] py-16 px-4 sm:px-6 flex items-center justify-center animate-fadeIn">
        <div className="max-w-xl w-full bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-100 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Order Placed Successfully!</h1>
            <p className="text-sm text-slate-500">
              Thank you <span className="font-semibold text-slate-800">{orderSuccess.customerName}</span>! Your order has been placed.
            </p>
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 text-left space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Order Tracking ID:</span>
              <span className="font-mono font-bold text-slate-900">{orderSuccess.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Payable Amount:</span>
              <span className="font-bold text-[#0284c7] text-base">{(orderSuccess.totalAmount || orderSuccess.totalPrice || 0).toLocaleString()} BDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Method:</span>
              <span className="font-medium text-slate-800">{orderSuccess.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Delivery Address:</span>
              <span className="font-medium text-slate-800 text-right truncate max-w-[220px]">{orderSuccess.address}</span>
            </div>
            {orderSuccess.memberTier && (
              <div className="flex justify-between items-center text-amber-900 bg-amber-50/90 p-2.5 rounded-xl border border-amber-200/80 font-medium">
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>VIP মেম্বারশিপ ({orderSuccess.memberTier}):</span>
                </span>
                <span className="font-bold text-amber-800">ছাড় -৳{(orderSuccess.memberDiscount || 0).toLocaleString()}</span>
              </div>
            )}
            {orderSuccess.pointsEarned && (
              <div className="flex justify-between items-center text-emerald-900 bg-emerald-50/90 p-2.5 rounded-xl border border-emerald-200/80 font-medium">
                <span className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  <span>অর্জিত রিওয়ার্ড পয়েন্ট:</span>
                </span>
                <span className="font-bold text-emerald-700">+{orderSuccess.pointsEarned} Points</span>
              </div>
            )}
          </div>

          {/* 1-Click WhatsApp Order Confirmation & Tracking */}
          {(() => {
            const rawWa = ecomSettings?.socialLinks?.whatsapp || ecomSettings?.contactPhone || ecomSettings?.headerSettings?.socialLinks?.whatsapp || ecomSettings?.headerSettings?.phone || '';
            const cleanWa = rawWa.replace(/[^0-9]/g, '');
            const checkoutStoreName = ecomSettings?.storeName || ecomSettings?.headerSettings?.brandName || 'our team';
            if (!cleanWa) return null;
            return (
              <a
                href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(
                  `Hello ${checkoutStoreName},\nI just placed order #${orderSuccess.id} (Amount: ${(orderSuccess.totalAmount || orderSuccess.totalPrice || 0).toLocaleString()} BDT).\nCustomer Name: ${orderSuccess.customerName}\nPhone: ${orderSuccess.customerPhone || orderSuccess.phone}\nPlease confirm my order & delivery updates!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-6 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer no-underline"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                Track & Confirm on WhatsApp (1-Click)
              </a>
            );
          })()}

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={onNavigateShop}
              className="flex-1 py-3.5 px-6 bg-gradient-to-r from-[#0284c7] to-[#16a34a] hover:from-[#0369a1] hover:to-[#15803d] text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-600/20 transition-all cursor-pointer"
            >
              Continue Shopping
            </button>
            <button
              onClick={() => onOpenLoginModal ? onOpenLoginModal() : onNavigateHome()}
              className="flex-1 py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all cursor-pointer"
            >
              Track Order / Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-24 selection:bg-sky-100 selection:text-sky-900">
      
      {/* 1. Header Title & Breadcrumb */}
      <div className="bg-white border-b border-slate-200/80 py-8 text-center space-y-1.5 shadow-2xs">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Checkout</h1>
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <button onClick={onNavigateHome} className="hover:text-slate-900 transition-colors cursor-pointer">
            Home
          </button>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-[#0284c7] font-semibold">Checkout</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* 2. Top Login / Register Notice Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <p className="text-xs sm:text-sm text-slate-600 font-medium text-center sm:text-left">
            Have any account? please login or register
          </p>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenLoginModal}
              className="px-5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              Login
            </button>
            <button
              type="button"
              onClick={onOpenLoginModal}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#0284c7] to-[#16a34a] hover:from-[#0369a1] hover:to-[#15803d] rounded-xl transition-all shadow-sm shadow-sky-600/20 cursor-pointer"
            >
              Register
            </button>
          </div>
        </div>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ============================================================
                LEFT COLUMN: Order Review + Shipping Address + Billing
                ============================================================ */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Card 1: Order Review */}
              <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-[#f97316] rounded-full"></div>
                    <h2 className="text-base font-bold text-slate-900">Order review</h2>
                  </div>
                  {cart.length > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-50 text-[#0284c7] border border-sky-200 text-xs font-bold shadow-2xs">
                      <Scale className="w-3.5 h-3.5" />
                      <span>মোট পার্সেল ওজন: {cartTotalWeight} kg</span>
                    </div>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-8 space-y-3">
                    <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500">Your cart is currently empty.</p>
                    <button
                      type="button"
                      onClick={onNavigateShop}
                      className="px-4 py-2 bg-[#f97316] text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Shop Products
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {cart.map((item) => (
                      <div key={item.product.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <img
                            src={item.product.coverImage || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200'}
                            alt={item.product.title}
                            loading="lazy"
                            decoding="async"
                            width={56}
                            height={56}
                            className="w-14 h-14 object-cover rounded-xl border border-slate-100 bg-slate-50 shrink-0"
                          />
                          <div className="min-w-0 space-y-1">
                            <h3 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                              {item.product.title}
                            </h3>

                            {/* Attribute Badge / Variant in Item Row */}
                            {(item.variant?.name || (Array.isArray(item.product.selectedAttributes) && item.product.selectedAttributes.length > 0)) && (
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                {item.variant?.name ? (
                                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                    {item.variant.name}
                                  </span>
                                ) : (
                                  item.product.selectedAttributes?.map((attr, aIdx) => (
                                    <span key={aIdx} className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                      {attr.attributeName}: {Array.isArray(attr.values) ? attr.values.join(', ') : attr.values}
                                    </span>
                                  ))
                                )}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2">
                              {item.product.price === 0 && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md border border-teal-200/60">
                                  <Gift className="w-3 h-3" />
                                  Gift
                                </span>
                              )}
                              
                              {/* Quantity pill selector */}
                              <div className="inline-flex items-center border border-slate-200 rounded-lg bg-slate-50/70 p-0.5 text-xs">
                                <span className="text-[11px] text-slate-500 pl-1.5 pr-1">Qty:</span>
                                <button
                                  type="button"
                                  onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                                  className="w-5 h-5 flex items-center justify-center rounded text-slate-600 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center font-bold text-slate-800 text-xs">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                                  className="w-5 h-5 flex items-center justify-center rounded text-slate-600 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <span className="font-semibold text-xs sm:text-sm text-slate-900">
                            Tk.{(item.product.price * item.quantity).toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.product.id)}
                            className="p-1.5 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Remove Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card 2: Shipping & Customer Details */}
              <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-5">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-[#f97316] rounded-full"></div>
                  <h2 className="text-base font-bold text-slate-900">Shipping Details</h2>
                </div>

                <div className="space-y-4 text-xs sm:text-sm">
                  {/* 1. Mobile Phone Number */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Phone Number (mobile number) *</span>
                      {phone.length === 11 && validateBdPhone(phone).isValid && (
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> বৈধ মোবাইল নম্বর
                        </span>
                      )}
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs font-bold text-slate-600">
                        88
                      </span>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (fieldErrors.phone) {
                            const val = validateBdPhone(e.target.value);
                            if (val.isValid) setFieldErrors(prev => ({ ...prev, phone: undefined }));
                          }
                        }}
                        onBlur={() => {
                          captureCurrentCart();
                          if (phone.trim()) {
                            const val = validateBdPhone(phone);
                            if (!val.isValid) setFieldErrors(prev => ({ ...prev, phone: val.error }));
                            else setFieldErrors(prev => ({ ...prev, phone: undefined }));
                          }
                        }}
                        placeholder="01XXXXXXXXX"
                        className={`w-full px-4 py-3 bg-white border ${
                          fieldErrors.phone 
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500' 
                            : 'border-slate-200 focus:border-[#f97316] focus:ring-[#f97316]'
                        } rounded-r-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 font-mono focus:outline-none focus:ring-1 transition-all`}
                      />
                    </div>
                    {fieldErrors.phone && (
                      <p className="text-[11px] text-rose-600 font-medium">{fieldErrors.phone}</p>
                    )}
                  </div>

                  {/* 2. Full Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Full Name (your name) *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (fieldErrors.name) {
                          const val = validateCustomerName(e.target.value);
                          if (val.isValid) setFieldErrors(prev => ({ ...prev, name: undefined }));
                        }
                      }}
                      onBlur={() => {
                        captureCurrentCart();
                        if (name.trim()) {
                          const val = validateCustomerName(name);
                          if (!val.isValid) setFieldErrors(prev => ({ ...prev, name: val.error }));
                          else setFieldErrors(prev => ({ ...prev, name: undefined }));
                        }
                      }}
                      placeholder="আপনার সম্পূর্ণ নাম লিখুন"
                      className={`w-full px-4 py-3 bg-white border ${
                        fieldErrors.name 
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500' 
                          : 'border-slate-200 focus:border-[#f97316] focus:ring-[#f97316]'
                      } rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-all`}
                    />
                    {fieldErrors.name && (
                      <p className="text-[11px] text-rose-600 font-medium">{fieldErrors.name}</p>
                    )}
                  </div>

                  {/* 3. Full Address (Auto-detects City & Zone) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#0284c7]" />
                        <span>সম্পূর্ণ ডেলিভারি ঠিকানা (বাসা/রোড, থানা, এলাকা, জেলা)</span>
                      </label>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        ✨ অটো-ক্যালকুলেশন
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => {
                          setAddress(e.target.value);
                          if (fieldErrors.address) {
                            const val = validateRealAddress(e.target.value, true);
                            if (val.isValid) setFieldErrors(prev => ({ ...prev, address: undefined }));
                          }
                        }}
                        onBlur={() => {
                          captureCurrentCart();
                          if (address.trim()) {
                            const val = validateRealAddress(address, true);
                            if (!val.isValid) setFieldErrors(prev => ({ ...prev, address: val.error }));
                            else setFieldErrors(prev => ({ ...prev, address: undefined }));
                          }
                        }}
                        placeholder={`যেমন: ${placeholderText}`}
                        className={`w-full px-4 py-3 bg-white border ${
                          fieldErrors.address 
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500' 
                            : 'border-slate-200 focus:border-[#0284c7] focus:ring-[#0284c7]'
                        } rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-all`}
                      />
                    </div>

                    {fieldErrors.address ? (
                      <p className="text-[11px] text-rose-600 font-medium">{fieldErrors.address}</p>
                    ) : (
                      <div className="flex items-center justify-between pt-0.5 text-[11px] text-slate-500">
                        <span>💡 ঠিকানায় আপনার জেলা ও থানার নাম লিখলে পাঠাও ডেলিভারি চার্জ স্বয়ংক্রিয়ভাবে হিসাব হবে।</span>
                        {(district || thana) && (
                          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                            {district}{thana ? ` • ${thana}` : ''}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Delivery Charge Selector (Only show manual delivery methods if dynamic Pathao is not auto-selected) */}
                  {!selectedCityId || !selectedZoneId ? (
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-[#0284c7]" />
                          <span>ডেলিভারি চার্জ (Delivery Charge)</span>
                        </label>
                      </div>

                      {activeDeliveryMethods.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {activeDeliveryMethods.map((method) => {
                            const isSelected = selectedDeliveryMethod?.id === method.id;
                            const calc = methodCalculations[method.id] || calculateDeliveryCharge(method, cartSubtotal, cartTotalWeight);

                            return (
                              <div
                                key={method.id}
                                onClick={() => setSelectedDeliveryMethodId(method.id)}
                                className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all flex flex-col justify-between gap-2.5 ${
                                  isSelected 
                                    ? 'border-[#0284c7] bg-sky-50/60 text-slate-900 font-bold ring-2 ring-sky-300 shadow-xs'
                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 text-slate-700'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2.5 min-w-0">
                                    <div className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                                      isSelected ? 'border-[#0284c7] bg-[#0284c7]' : 'border-slate-300'
                                    }`}>
                                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-extrabold text-slate-900 text-xs truncate">
                                        {method.title}
                                      </div>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        {method.courierPartner && (
                                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-white/90 border border-slate-200 text-slate-600 rounded">
                                            {method.courierPartner}
                                          </span>
                                        )}
                                        {method.estimatedDays && (
                                          <span className="text-[10px] text-slate-500 font-medium flex items-center gap-0.5">
                                            <Clock className="w-2.5 h-2.5" />
                                            <span>{method.estimatedDays}</span>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <span className="font-black text-sm text-[#0284c7]">
                                      {calc.isFreeDelivery ? 'FREE (৳০)' : `৳${calc.finalCharge}`}
                                    </span>
                                  </div>
                                </div>

                                {/* Weight / Rate breakdown pill */}
                                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                                  <span className="truncate max-w-[200px]">{calc.breakdownText}</span>
                                  {calc.pricingModel === 'weight_based' && (
                                    <span className="text-[#0284c7] font-semibold shrink-0">ওজন ভিত্তিক</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 text-slate-800 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                              <Truck className="w-5 h-5 text-amber-700" />
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900 text-xs sm:text-sm">কোনো ডেলিভারি মেথড যোগ করা হয়নি</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">অ্যাডমিন প্যানেল (Settings &gt; Delivery) থেকে ডেলিভারি মেথড যোগ করলে এখানে সিলেক্ট করার অপশন আসবে।</p>
                            </div>
                          </div>
                          <span className="font-bold text-xs text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shrink-0 shadow-2xs">
                            Tk. 0
                          </span>
                        </div>
                      )}
                    </div>
                  ) : null}

                </div>
              </div>

            </div>

            {/* ============================================================
                RIGHT COLUMN: Payment Method + Coupons + Summary + Order Button
                ============================================================ */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Card 1: Payment Method */}
              <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-gradient-to-b from-[#0284c7] to-[#16a34a] rounded-full"></div>
                  <h2 className="text-base font-bold text-slate-900">Payment method</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activePaymentGateways.map((gateway) => {
                    const isSelected = selectedPaymentGateway?.id === gateway.id;
                    const isCOD = gateway.type === 'Cash on Delivery' || gateway.type === 'COD' || gateway.title.toLowerCase().includes('cash');
                    const isBkash = gateway.title.toLowerCase().includes('bkash') || gateway.title.toLowerCase().includes('development');

                    return (
                      <div
                        key={gateway.id}
                        onClick={() => setSelectedPaymentGatewayId(gateway.id)}
                        className={`flex items-center justify-between p-3.5 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all select-none ${
                          isSelected
                            ? 'border-[#0284c7] bg-sky-50/50 shadow-xs ring-1 ring-[#0284c7]'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isBkash ? (
                            <div className="w-6 h-6 rounded-md bg-[#e2136e] text-white flex items-center justify-center shrink-0 text-[10px] font-bold">
                              bK
                            </div>
                          ) : isCOD ? (
                            <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                              💵
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                              <CreditCard className="w-4 h-4" />
                            </div>
                          )}

                          <span className="font-semibold text-slate-900 text-xs truncate">
                            {gateway.title}
                          </span>
                        </div>

                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'border-[#0284c7] bg-[#0284c7]' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile Banking / Online Gateway Instructions & TrxID Input */}
                {isOnlinePayment && selectedPaymentGateway && (
                  <div className="p-4 bg-sky-50/60 border border-sky-200/80 rounded-2xl space-y-3 text-xs animate-fadeIn">
                    <div className="space-y-1.5">
                      <div className="font-bold text-sky-950 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Smartphone className="w-4 h-4 text-[#0284c7]" />
                          {selectedPaymentGateway.title} Payment
                        </span>
                        {selectedPaymentGateway.discountAmount > 0 && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                            Save Tk.{selectedPaymentGateway.discountAmount}
                          </span>
                        )}
                      </div>

                      {selectedPaymentGateway.accountNumber && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-slate-600">Account Number:</span>
                          <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-sky-200 text-xs">
                            {selectedPaymentGateway.accountNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyAccountNumber(selectedPaymentGateway.accountNumber || '')}
                            className="p-1.5 hover:bg-sky-100 rounded-lg text-[#0284c7] cursor-pointer"
                            title="Copy Account Number"
                          >
                            {copiedAccNo ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}

                      {selectedPaymentGateway.instruction && (
                        <p className="text-[11px] text-slate-600 whitespace-pre-line leading-relaxed pt-1">
                          {selectedPaymentGateway.instruction}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-sky-200/60">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Sender Phone Number *</label>
                        <input
                          type="tel"
                          required={isOnlinePayment}
                          placeholder="01XXXXXXXXX"
                          value={senderPhone}
                          onChange={(e) => setSenderPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#0284c7] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Transaction ID (TrxID) *</label>
                        <input
                          type="text"
                          required={isOnlinePayment}
                          placeholder="e.g. 9J82K3M..."
                          value={trxId}
                          onChange={(e) => setTrxId(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-xs font-mono uppercase focus:ring-1 focus:ring-[#0284c7] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 2: Coupon / Gift Voucher Accordion */}
              <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-4">
                <button
                  type="button"
                  onClick={() => setCouponAccordionOpen(!couponAccordionOpen)}
                  className="w-full flex items-center justify-between text-left cursor-pointer"
                >
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    Have any coupon or gift voucher?
                  </h2>
                  {couponAccordionOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {couponAccordionOpen && (
                  <div className="space-y-4 pt-1 animate-fadeIn">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value)}
                        placeholder="Enter Coupon"
                        className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm uppercase tracking-wider focus:outline-none focus:border-[#f97316]"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        className="px-5 py-2.5 bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                      >
                        Apply coupon
                      </button>
                    </div>

                    {couponError && (
                      <p className="text-xs text-rose-500 font-medium">{couponError}</p>
                    )}
                    {couponSuccess && (
                      <p className="text-xs text-emerald-600 font-medium">{couponSuccess}</p>
                    )}


                  </div>
                )}
              </div>

              {/* Card 3: Summary Calculations */}
              <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-3.5">
                <div className="flex justify-between text-xs sm:text-sm text-slate-600">
                  <span>Sub total</span>
                  <span className="font-semibold text-slate-900">Tk.{cartSubtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-xs sm:text-sm text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span>Total parcel weight</span>
                    <span className="text-[10px] text-slate-400 font-normal">({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                  </span>
                  <span className="font-bold text-slate-800 font-mono">
                    {cartTotalWeight} kg
                  </span>
                </div>

                <div className="flex justify-between text-xs sm:text-sm text-slate-600">
                  <span>Delivery cost</span>
                  <span className="font-semibold text-slate-900">
                    {deliveryCost === 0 ? 'Tk.0' : `Tk.${deliveryCost.toLocaleString()}`}
                  </span>
                </div>

                {couponDiscountAmount > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm text-emerald-600 font-medium">
                    <span>Coupon Discount ({appliedCoupon?.code})</span>
                    <span>-Tk.{couponDiscountAmount.toLocaleString()}</span>
                  </div>
                )}

                {gatewayDiscount > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm text-emerald-600 font-medium">
                    <span>Payment Discount</span>
                    <span>-Tk.{gatewayDiscount.toLocaleString()}</span>
                  </div>
                )}

                {gatewayFee > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm text-amber-600 font-medium">
                    <span>Gateway Fee</span>
                    <span>+Tk.{gatewayFee.toLocaleString()}</span>
                  </div>
                )}

                {bogoEligible && (
                  <div className="flex justify-between text-xs sm:text-sm text-emerald-700 font-bold bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
                    <span className="flex items-center gap-1.5">
                      <span>🎉</span>
                      <span>BOGO FREE Gift Applied!</span>
                    </span>
                    <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">1 Extra Free</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-sm sm:text-base font-bold text-slate-900">Total</span>
                  <span className="text-lg sm:text-xl font-black text-[#0284c7] tracking-tight">
                    Tk.{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Terms Agreement Checkbox */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-[#0284c7] focus:ring-[#0284c7] cursor-pointer"
                />
                <label htmlFor="agreeTerms" className="text-xs text-slate-600 leading-relaxed cursor-pointer select-none">
                  I have read and agree to the <span className="text-[#0284c7] hover:underline font-medium">Terms and Conditions</span>, <span className="text-[#0284c7] hover:underline font-medium">Privacy Policy</span> & <span className="text-[#0284c7] hover:underline font-medium">Refund and Return Policy</span>.
                </label>
              </div>

              {/* Main PLACE ORDER Button */}
              <button
                type="submit"
                disabled={isSubmitting || cart.length === 0}
                className="w-full py-4 px-8 bg-gradient-to-r from-[#0284c7] via-[#0284c7] to-[#16a34a] hover:from-[#0369a1] hover:to-[#15803d] active:scale-[0.99] disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-sky-600/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    PLACING ORDER...
                  </>
                ) : (
                  'PLACE ORDER'
                )}
              </button>

            </div>

          </div>
        </form>

      </div>

    </div>
  );
}
