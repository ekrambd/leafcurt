import { createHash } from 'node:crypto';

// Comprehensive allowlist for e-commerce conversion events
const ALLOWED_EVENTS = new Set([
  'Purchase',
  'InitiateCheckout',
  'AddToCart',
  'ViewContent',
  'PageView',
  'Lead',
  'Contact',
  'Search'
]);

function sha256(value?: string) {
  if (!value?.trim()) return undefined;
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

function normalizePhone(value?: string) {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('880')) return digits;
  if (digits.startsWith('0')) return `88${digits}`;
  if (digits.length === 10) return `880${digits}`;
  return digits;
}

export class FacebookCapiService {
  static async sendEvent(eventName: string, eventData: any, userData: any) {
    const pixelId = (process.env.META_PIXEL_ID || process.env.VITE_META_PIXEL_ID || '').trim();
    const metaApiToken = (process.env.META_CAPI_TOKEN || process.env.META_ACCESS_TOKEN || '').trim();
    let testEventCode = (
      eventData?.testEventCode ||
      eventData?.test_event_code ||
      process.env.META_TEST_CODE ||
      process.env.META_TEST_EVENT_CODE ||
      ''
    ).trim();

    if (testEventCode && !testEventCode.toUpperCase().startsWith('TEST')) {
      testEventCode = `TEST${testEventCode}`;
    }

    if (!pixelId || !metaApiToken) {
      return { success: false, status: 503, message: 'Meta CAPI is not configured on the server (missing META_PIXEL_ID or META_CAPI_TOKEN)' };
    }
    if (!ALLOWED_EVENTS.has(eventName)) {
      return { success: false, status: 400, message: `Unsupported Meta event: ${eventName}` };
    }

    try {
      const rawPhone = userData?.phone ? normalizePhone(userData.phone) : undefined;
      const cleanEmail = userData?.email?.trim().toLowerCase();
      const name = userData?.name || userData?.customerName;
      const firstName = userData?.firstName || (name ? name.split(' ')[0] : undefined);
      const lastName = userData?.lastName || (name && name.includes(' ') ? name.split(' ').slice(1).join(' ') : undefined);
      const city = userData?.city || userData?.district;

      const formattedUserData: Record<string, any> = {
        client_ip_address: userData?.clientIpAddress || undefined,
        client_user_agent: eventData?.userAgent || undefined
      };

      if (rawPhone) formattedUserData.ph = [sha256(rawPhone)];
      if (cleanEmail) formattedUserData.em = [sha256(cleanEmail)];
      if (firstName) formattedUserData.fn = [sha256(firstName)];
      if (lastName) formattedUserData.ln = [sha256(lastName)];
      if (city) formattedUserData.ct = [sha256(city)];
      formattedUserData.country = [sha256('bd')];
      if (userData?.fbp) formattedUserData.fbp = userData.fbp;
      if (userData?.fbc) formattedUserData.fbc = userData.fbc;
      if (userData?.externalId || rawPhone) {
        formattedUserData.external_id = [sha256(userData?.externalId || rawPhone)];
      }

      const customData = { ...(eventData?.customData || {}) };
      if (customData.value !== undefined) {
        customData.value = Number(customData.value);
      }
      if (!customData.currency) {
        customData.currency = 'BDT';
      }

      const payload: Record<string, any> = {
        data: [{
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventData.eventId,
          event_source_url: eventData.eventSourceUrl || 'https://fantinebd.com',
          action_source: 'website',
          user_data: formattedUserData,
          custom_data: customData
        }],
        access_token: metaApiToken
      };

      if (testEventCode) {
        payload.test_event_code = testEventCode;
      }

      const response = await fetch(`https://graph.facebook.com/v23.0/${encodeURIComponent(pixelId)}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok || result.error) {
        console.error('[Meta CAPI] Event rejected:', JSON.stringify(result));
        return { success: false, status: response.status || 502, message: result.error?.message || 'Meta rejected the event', result };
      }

      console.log(`[Meta CAPI] Successfully sent ${eventName} (ID: ${eventData.eventId}, fbtrace_id: ${result.fbtrace_id})`);
      return { success: true, result };
    } catch (error: any) {
      console.error('[Meta CAPI] Network or dispatch error:', error);
      return { success: false, status: 502, message: error?.message || 'Meta CAPI dispatch failed' };
    }
  }
}
