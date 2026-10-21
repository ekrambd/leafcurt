// Utility for Meta (Facebook) Pixel & Google Tag Manager (GTM) event tracking

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
    dataLayer?: any[];
  }
}

const initializedPixelIds = new Set<string>();
const initializedGtmIds = new Set<string>();

export const initPixelAndGtm = (pixelId?: string, gtmId?: string) => {
  if (typeof window === 'undefined') return;

  const normalizedPixelId = pixelId?.trim();
  const normalizedGtmId = gtmId?.trim();

  // 1. Setup the FBQ stub synchronously so events can be queued immediately!
  if (normalizedPixelId && !initializedPixelIds.has(normalizedPixelId)) {
    if (!window.fbq) {
      const fbq: any = function (...args: any[]) {
        if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
        else fbq.queue.push(args);
      };
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = '2.0';
      fbq.queue = [];
      window.fbq = fbq;
      window._fbq = fbq;
    }
    // init immediately so PageView and other events bind to this ID
    window.fbq('init', normalizedPixelId);
  }

  // 2. Setup the GTM dataLayer stub synchronously
  if (normalizedGtmId && !initializedGtmIds.has(normalizedGtmId)) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  }

  // Load scripts immediately without 3.5-second delay so tracker catches all early events
  if (normalizedPixelId && !document.getElementById('fb-pixel-script')) {
    const script = document.createElement('script');
    script.id = 'fb-pixel-script';
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
    initializedPixelIds.add(normalizedPixelId);
  }

  if (normalizedGtmId && !document.getElementById('gtm-script')) {
    const script = document.createElement('script');
    script.id = 'gtm-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(normalizedGtmId)}`;
    document.head.appendChild(script);
    initializedGtmIds.add(normalizedGtmId);
  }
};

export const createEventId = (prefix: string) => {
  const randomPart = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${randomPart}`;
};

export const trackEvent = (eventName: string, data: Record<string, any> = {}, eventId?: string) => {
  if (typeof window === 'undefined') return;

  // Ensure FB stub exists so queued events are never dropped
  if (!window.fbq) {
    const fbq: any = function (...args: any[]) {
      if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
      else fbq.queue.push(args);
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    window.fbq = fbq;
    window._fbq = fbq;
  }

  const finalEventId = eventId || createEventId(eventName.toLowerCase());

  // 1. Meta Pixel track with deduplication eventID
  try {
    window.fbq('track', eventName, data, { eventID: finalEventId });
  } catch (e) {
    console.warn('Pixel event track failed:', e);
  }

  // 2. GTM dataLayer push
  window.dataLayer = window.dataLayer || [];
  try {
    const gtmEventNames: Record<string, string> = {
      PageView: 'page_view',
      ViewContent: 'view_item',
      AddToCart: 'add_to_cart',
      InitiateCheckout: 'begin_checkout',
      Purchase: 'purchase',
      Search: 'search',
      Contact: 'contact',
      Lead: 'generate_lead'
    };

    const gtmEvent = gtmEventNames[eventName] || eventName.toLowerCase();
    const payload: Record<string, any> = {
      event: gtmEvent,
      event_id: eventId,
      ...data
    };

    // Standard GA4 ecommerce object
    if (['ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase'].includes(eventName)) {
      payload.ecommerce = {
        currency: data.currency || 'BDT',
        value: data.value,
        items: data.contents || [],
        ...(eventName === 'Purchase' ? { transaction_id: eventId } : {})
      };
    }

    window.dataLayer.push(payload);
  } catch (e) {
    console.warn('GTM dataLayer push failed:', e);
  }

  // 3. Server-Side Meta Conversions API (CAPI) Dispatch with Event Deduplication
  try {
    const rawCookies = typeof document !== 'undefined' ? document.cookie : '';
    const fbpMatch = rawCookies.match(/_fbp=([^;]+)/);
    const fbcMatch = rawCookies.match(/_fbc=([^;]+)/);

    const capiEvents = ['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase', 'Lead', 'Contact', 'Search'];
    if (capiEvents.includes(eventName)) {
      // Dynamic Meta Test Event Code resolution (from URL or session)
      let dynamicTestCode: string | undefined;
      if (typeof window !== 'undefined') {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          let fromUrl = (urlParams.get('test_event_code') || urlParams.get('test_code'))?.trim();
          if (fromUrl) {
            if (!fromUrl.toUpperCase().startsWith('TEST')) {
              fromUrl = `TEST${fromUrl}`;
            }
            sessionStorage.setItem('meta_test_code', fromUrl);
            document.cookie = `meta_test_code=${encodeURIComponent(fromUrl)}; path=/; max-age=86400; SameSite=Lax`;
            dynamicTestCode = fromUrl;
          } else {
            dynamicTestCode = sessionStorage.getItem('meta_test_code') || undefined;
          }
        } catch {}
      }

      fetch('/api/facebook/capi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName,
          eventId: finalEventId,
          eventSourceUrl: window.location.href,
          testEventCode: dynamicTestCode,
          eventData: data,
          userData: {
            phone: data.phone || data.customerPhone,
            email: data.email || data.customerEmail,
            name: data.customerName || data.name,
            district: data.district,
            fbp: fbpMatch?.[1],
            fbc: fbcMatch?.[1]
          }
        }),
        keepalive: true
      }).catch(() => {
        // Non-blocking failover
      });
    }
  } catch {
    // Non-blocking failover
  }
};