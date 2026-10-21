export interface CustomerSession {
  phone: string;
  name?: string;
  email?: string;
  isLoggedIn: boolean;
}

export const CUSTOMER_PHONE_KEY = 'customer_session_phone';
export const CUSTOMER_NAME_KEY = 'customer_session_name';
export const CUSTOMER_EMAIL_KEY = 'customer_session_email';

export function getCustomerSession(): CustomerSession | null {
  if (typeof window === 'undefined') return null;
  const rawPhone = localStorage.getItem(CUSTOMER_PHONE_KEY);
  if (!rawPhone) return null;
  const cleanPhone = rawPhone.replace(/\D/g, '').replace(/^880/, '0').replace(/^88/, '');
  const name = localStorage.getItem(CUSTOMER_NAME_KEY) || undefined;
  const email = localStorage.getItem(CUSTOMER_EMAIL_KEY) || undefined;
  return {
    phone: cleanPhone,
    name,
    email,
    isLoggedIn: true
  };
}

export function setCustomerSession(data: { phone: string; name?: string; email?: string }): void {
  if (typeof window === 'undefined') return;
  const cleanPhone = data.phone.replace(/\D/g, '').replace(/^880/, '0').replace(/^88/, '');
  localStorage.setItem(CUSTOMER_PHONE_KEY, cleanPhone);
  if (data.name) {
    localStorage.setItem(CUSTOMER_NAME_KEY, data.name);
  }
  if (data.email) {
    localStorage.setItem(CUSTOMER_EMAIL_KEY, data.email);
  }
  window.dispatchEvent(new Event('customer-auth-changed'));
}

export function clearCustomerSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CUSTOMER_PHONE_KEY);
  localStorage.removeItem(CUSTOMER_NAME_KEY);
  localStorage.removeItem(CUSTOMER_EMAIL_KEY);
  window.dispatchEvent(new Event('customer-auth-changed'));
}

export function isCustomerLoggedIn(): boolean {
  return getCustomerSession() !== null;
}

export async function checkReviewEligibility(productId?: string): Promise<{
  canReview: boolean;
  reason?: string;
  ordersCount: number;
  customerName?: string;
  matchedOrderId?: string;
}> {
  const session = getCustomerSession();
  if (!session) {
    return {
      canReview: false,
      reason: 'must_login',
      ordersCount: 0
    };
  }

  try {
    const params = new URLSearchParams({ phone: session.phone });
    if (productId) params.append('productId', productId);

    const res = await fetch(`/api/reviews/check-eligibility?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.customerName && !session.name) {
        setCustomerSession({ phone: session.phone, name: data.customerName, email: session.email });
      }
      return {
        canReview: Boolean(data.canReview),
        reason: data.reason,
        ordersCount: data.ordersCount || 0,
        customerName: data.customerName || session.name,
        matchedOrderId: data.matchedOrderId
      };
    }
  } catch (err) {
    console.warn('Failed checking review eligibility from server:', err);
  }

  // Fallback: check local orders in browser
  try {
    const localOrdersRaw = localStorage.getItem('noor_book_orders') || '[]';
    const orders = JSON.parse(localOrdersRaw);
    const matching = orders.filter((o: any) => {
      const oPhone = (o.phone || '').replace(/\D/g, '').replace(/^880/, '0').replace(/^88/, '');
      return oPhone === session.phone;
    });

    if (matching.length > 0) {
      return {
        canReview: true,
        ordersCount: matching.length,
        customerName: matching[0].customerName || session.name,
        matchedOrderId: matching[0].id
      };
    }
  } catch {}

  return {
    canReview: false,
    reason: 'রিভিউ দেওয়ার জন্য গ্রাহককে অবশ্যই পূর্বে ওয়েবসাইট থেকে একটি অর্ডার সম্পন্ন করতে হবে।',
    ordersCount: 0,
    customerName: session.name
  };
}

export async function voteReviewHelpful(reviewId: string): Promise<number | null> {
  try {
    const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/vote`, {
      method: 'POST'
    });
    if (res.ok) {
      const data = await res.json();
      return data.helpfulCount ?? null;
    }
  } catch (err) {
    console.warn('Failed to vote review:', err);
  }
  return null;
}
