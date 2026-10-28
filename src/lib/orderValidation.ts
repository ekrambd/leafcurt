/**
 * Strict Order & Customer Data Validation Utility
 *
 * Enforces real, deliverable customer information:
 * 1. Real Customer Name (Bengali & English, reject random chars, bots & dummy words)
 * 2. Authentic Bangladeshi Mobile Phone Number (013-019 prefixes, 11 digits, reject dummy sequences)
 * 3. Detailed Physical Delivery Address (minimum 10 chars, multiple words, reject single-word & dummy spam)
 */

// List of obvious fake, test, or spam names
const DUMMY_NAME_PATTERNS = [
  'test', 'testing', 'tester', 'fake', 'dummy', 'asdf', 'qwerty', 'zxcv', 
  'admin', 'administrator', 'user', 'demo', 'sample', 'anon', 'anonymous',
  'null', 'undefined', 'none', 'no name', 'nameless', 'xyz', 'abc', 'aaa',
  'bbb', 'ccc', 'customer', 'client', 'buyer', 'someone', 'person', 'na', 'n/a'
];

// List of single-word or fake address patterns that cannot be delivered by couriers
const DUMMY_ADDRESS_PATTERNS = [
  'test', 'test address', 'testing', 'fake', 'dummy', 'asdf', 'qwerty', 'zxcv',
  'dhaka', 'chittagong', 'sylhet', 'rajshahi', 'khulna', 'barisal', 'rangpur',
  'mymensingh', 'bangladesh', 'bd', 'na', 'n/a', 'null', 'none', 'unknown',
  'home', 'my home', 'my address', 'house', 'road', 'village', 'somewhere',
  '12345', '123456', '00000', 'abc', 'xyz', 'demo address', 'sample address'
];

/**
 * Validates customer name.
 * Accepts English & Bengali scripts, dots, hyphens, and spaces.
 */
export function validateCustomerName(name: string): { isValid: boolean; error?: string; cleanName: string } {
  const cleanName = (name || '').trim().replace(/\s+/g, ' ');

  if (!cleanName) {
    return { isValid: false, error: 'আপনার সম্পূর্ণ নাম লিখুন (Please enter your full name).', cleanName: '' };
  }

  if (cleanName.length < 3) {
    return { isValid: false, error: 'নাম কমপক্ষে ৩ অক্ষরের হতে হবে (Name must be at least 3 characters).', cleanName };
  }

  if (cleanName.length > 70) {
    return { isValid: false, error: 'নাম অতিরিক্ত দীর্ঘ (Name is too long).', cleanName };
  }

  // Check against dummy name keywords
  const lower = cleanName.toLowerCase();
  if (DUMMY_NAME_PATTERNS.includes(lower)) {
    return { isValid: false, error: 'অনুগ্রহ করে আপনার আসল নাম লিখুন (Please provide a real, valid name).', cleanName };
  }

  // Must contain English letters (a-z) or Bengali characters (\u0980-\u09FF)
  const validCharRegex = /^[a-zA-Z\u0980-\u09FF\s.'-]+$/;
  if (!validCharRegex.test(cleanName)) {
    return { isValid: false, error: 'নামে কোনো সংখ্যা বা বিশেষ চিহ্ন ব্যবহার করা যাবে না (Name should only contain letters).', cleanName };
  }

  // Reject repeated characters (e.g. aaaaa, xxxxx, ....)
  if (/(.)\1{4,}/i.test(cleanName)) {
    return { isValid: false, error: 'অনুগ্রহ করে সঠিক নাম লিখুন (Please provide a valid name).', cleanName };
  }

  return { isValid: true, cleanName };
}

/**
 * Validates Bangladeshi mobile phone number.
 * Supported operators: 013, 014, 015, 016, 017, 018, 019
 * Length: Exactly 11 digits starting with 01
 * Rejects repeated/dummy numbers like 01700000000, 01711111111, 01234567890.
 */
export function validateBdPhone(phone: string): { isValid: boolean; error?: string; cleanPhone: string } {
  if (!phone) {
    return { isValid: false, error: '১১ ডিজিটের মোবাইল নম্বর লিখুন (Please enter your mobile phone number).', cleanPhone: '' };
  }

  // Strip non-digit characters
  let digits = phone.replace(/\D/g, '');

  // Normalize BD country code
  if (digits.startsWith('880')) {
    digits = digits.slice(2); // keep leading 0 -> e.g. 88017... becomes 017...
  } else if (digits.startsWith('88')) {
    digits = digits.slice(2);
  }

  // If user entered 10 digits starting with 1[3-9], prepend 0
  if (digits.length === 10 && /^1[3-9]/.test(digits)) {
    digits = '0' + digits;
  }

  if (digits.length !== 11) {
    return { isValid: false, error: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (Phone number must be exactly 11 digits).', cleanPhone: digits };
  }

  // Strict Bangladeshi operator prefix validation
  const bdOperatorRegex = /^01[3-9]\d{8}$/;
  if (!bdOperatorRegex.test(digits)) {
    return { isValid: false, error: 'সঠিক বাংলাদেশী মোবাইল নম্বর দিন (013, 014, 015, 016, 017, 018, 019 দিয়ে শুরু)।', cleanPhone: digits };
  }

  // Check for dummy sequence patterns (e.g., 01700000000, 01811111111, 01999999999)
  const subscriberPart = digits.slice(3); // last 8 digits
  if (/^(\d)\1{7}$/.test(subscriberPart)) {
    return { isValid: false, error: 'সঠিক এবং সচল মোবাইল নম্বর লিখুন (Fake/dummy phone number detected).', cleanPhone: digits };
  }

  // Check for sequential runs (e.g. 01712345678, 01987654321)
  const sequentialPatterns = ['12345678', '87654321', '01234567', '76543210'];
  if (sequentialPatterns.some(pat => subscriberPart.includes(pat))) {
    return { isValid: false, error: 'সঠিক ও সক্রিয় মোবাইল নম্বর দিন (Invalid phone sequence).', cleanPhone: digits };
  }

  // Check distinct digits count across entire 11-digit phone (must have at least 4 distinct digits)
  const uniqueDigits = new Set(digits.split(''));
  if (uniqueDigits.size < 4) {
    return { isValid: false, error: 'সঠিক ও সক্রিয় মোবাইল নম্বর দিন (Invalid phone number).', cleanPhone: digits };
  }

  return { isValid: true, cleanPhone: digits };
}

/**
 * Validates real physical delivery address.
 * Couriers require detailed delivery address (House, Road, Area, Thana/Upazila, District).
 * Rejects single-word entries (e.g. "Dhaka"), dummy strings, or too short entries.
 */
export function validateRealAddress(address: string): { isValid: boolean; error?: string; cleanAddress: string } {
  const cleanAddress = (address || '').trim().replace(/\s+/g, ' ');

  if (!cleanAddress) {
    return { isValid: false, error: 'সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন (Please enter your delivery address).', cleanAddress: '' };
  }

  if (cleanAddress.length < 10) {
    return { 
      isValid: false, 
      error: 'ডেলিভারি ঠিকানা অন্তত ১০ অক্ষরের হতে হবে—বাসা, রোড, এলাকা/গ্রাম উল্লেখ করুন (Address must be at least 10 characters with house/road/area).', 
      cleanAddress 
    };
  }

  if (cleanAddress.length > 300) {
    return { isValid: false, error: 'ঠিকানা অতিরিক্ত দীর্ঘ (Address is too long).', cleanAddress };
  }

  // Check if address is a single word (e.g. just "Dhaka" or "asdfghjklm")
  const words = cleanAddress.split(/[\s,/-]+/).filter(w => w.trim().length > 0);
  if (words.length < 2) {
    return { 
      isValid: false, 
      error: 'শুধু এলাকার নাম নয়, সম্পূর্ণ ঠিকানা দিন (বাসা নং, রোড নং, এলাকা/থানা)। Courier requires a full address.', 
      cleanAddress 
    };
  }

  // Check against dummy address patterns
  const lower = cleanAddress.toLowerCase();
  if (DUMMY_ADDRESS_PATTERNS.includes(lower)) {
    return { 
      isValid: false, 
      error: 'অনুগ্রহ করে সঠিক ডেলিভারি ঠিকানা লিখুন (Please provide a real delivery address).', 
      cleanAddress 
    };
  }

  // Reject repeated characters spam (e.g. aaaaaaaaaa, 1111111111, ........)
  if (/(.)\1{5,}/i.test(cleanAddress)) {
    return { isValid: false, error: 'অনুগ্রহ করে সঠিক ডেলিভারি ঠিকানা লিখুন (Invalid address characters).', cleanAddress };
  }

  // Must contain at least some alphabetic or Bengali characters (not just pure numbers/symbols)
  const hasLetters = /[a-zA-Z\u0980-\u09FF]/.test(cleanAddress);
  if (!hasLetters) {
    return { isValid: false, error: 'ঠিকানায় এলাকা বা বাসার নাম লিখুন (Address must include area or street name).', cleanAddress };
  }

  return { isValid: true, cleanAddress };
}

/**
 * Validates complete order customer details.
 */
export function validateOrderCustomerDetails(data: {
  customerName?: string;
  name?: string;
  phone?: string;
  address?: string;
}): { isValid: boolean; errors: string[]; sanitized: { name: string; phone: string; address: string } } {
  const errors: string[] = [];

  const rawName = data.customerName || data.name || '';
  const nameVal = validateCustomerName(rawName);
  if (!nameVal.isValid && nameVal.error) {
    errors.push(nameVal.error);
  }

  const phoneVal = validateBdPhone(data.phone || '');
  if (!phoneVal.isValid && phoneVal.error) {
    errors.push(phoneVal.error);
  }

  const addressVal = validateRealAddress(data.address || '');
  if (!addressVal.isValid && addressVal.error) {
    errors.push(addressVal.error);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      name: nameVal.cleanName,
      phone: phoneVal.cleanPhone,
      address: addressVal.cleanAddress
    }
  };
}
