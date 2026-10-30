import { Router } from 'express';
import { storeSettings, updateStoreSettings, storeOrders, saveOrdersToDisk } from '../data/store';
import { PathaoCourierService } from '../services/pathaoService';
import { FacebookCapiService } from '../services/facebookCapiService';
import { requireAdmin } from '../middleware/adminAuth';
import { cacheResponse } from '../middleware/cacheMiddleware';
import { globalCache } from '../services/cacheEngine';
import { circuitBreakerRegistry } from '../services/circuitBreaker';

export const settingsRouter = Router();
export const courierRouter = Router();
export const facebookRouter = Router();

// Settings Routes - Always fresh, no-store to ensure instant admin updates
const handleGetSettings = (_req: any, res: any) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const { 
    pixelId: _pixelId, 
    metaApiToken: _metaApiToken, 
    pathaoClientSecret: _pathaoClientSecret,
    pathaoClientPassword: _pathaoClientPassword,
    ...publicSettings 
  } = storeSettings;
  res.json({
    ...publicSettings,
    pixelId: (process.env.META_PIXEL_ID || process.env.VITE_META_PIXEL_ID || storeSettings.pixelId || '').trim()
  });
};

const handlePostSettings = (req: any, res: any) => {
  const { 
    pixelId: _pixelId, 
    metaApiToken: _metaApiToken, 
    ...safeSettings 
  } = req.body;
  const updated = updateStoreSettings(safeSettings);

  // Invalidate settings cache
  globalCache.invalidateTag('settings');

  res.json({ success: true, settings: updated });
};

settingsRouter.get('/', handleGetSettings);
settingsRouter.get('/ecom', handleGetSettings);
settingsRouter.post('/', requireAdmin, handlePostSettings);
settingsRouter.post('/ecom', requireAdmin, handlePostSettings);

// ==========================================
// PATHAO COURIER DISPATCH & INTEGRATION (ONLY OFFICIAL)
// ==========================================
courierRouter.post('/pathao/test', requireAdmin, async (req, res) => {
  try {
    const creds = req.body?.credentials || req.body;
    const result = await PathaoCourierService.testConnection(creds);
    res.json(result);
  } catch (err: any) {
    res.status(502).json({ success: false, message: err.message || 'Pathao credentials connection test failed' });
  }
});

courierRouter.get('/pathao/stores', requireAdmin, async (req, res) => {
  try {
    const creds = req.query as any;
    const result = await PathaoCourierService.getStores(creds);
    res.json(result);
  } catch (err: any) {
    res.status(502).json({ success: false, message: err.message || 'Failed to fetch Pathao stores' });
  }
});

// Cities, Zones & Areas - Open to storefront for live checkout address selection
courierRouter.get('/pathao/cities', async (_req, res) => {
  try {
    const result = await PathaoCourierService.getCities();
    res.json(result);
  } catch (err: any) {
    res.status(502).json({ success: false, message: err.message || 'Failed to fetch Pathao cities' });
  }
});

courierRouter.get('/pathao/cities/:cityId/zones', async (req, res) => {
  try {
    const result = await PathaoCourierService.getZones(req.params.cityId);
    res.json(result);
  } catch (err: any) {
    res.status(502).json({ success: false, message: err.message || 'Failed to fetch Pathao zones' });
  }
});

courierRouter.get('/pathao/zones/:zoneId/areas', async (req, res) => {
  try {
    const result = await PathaoCourierService.getAreas(req.params.zoneId);
    res.json(result);
  } catch (err: any) {
    res.status(502).json({ success: false, message: err.message || 'Failed to fetch Pathao areas' });
  }
});

// Live Dynamic Price Calculation API for Checkout
courierRouter.post('/pathao/price-plan', async (req, res) => {
  try {
    const { storeId, itemType, deliveryType, itemWeight, recipientCity, recipientZone } = req.body || {};
    if (!recipientCity || !recipientZone) {
      return res.status(400).json({ success: false, message: 'recipientCity and recipientZone are required' });
    }
    const result = await PathaoCourierService.calculatePrice({
      storeId,
      itemType: Number(itemType) || 2,
      deliveryType: Number(deliveryType) || 48,
      itemWeight: Number(itemWeight) || 0.5,
      recipientCity: Number(recipientCity),
      recipientZone: Number(recipientZone)
    });
    res.json(result);
  } catch (err: any) {
    res.status(502).json({ success: false, message: err.message || 'Failed to calculate Pathao delivery price' });
  }
});

courierRouter.post('/pathao/dispatch', requireAdmin, async (req, res) => {
  try {
    const result = await PathaoCourierService.dispatchOrder(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Pathao dispatch failed' });
  }
});

courierRouter.get('/pathao/status/:consignmentId', requireAdmin, async (req, res) => {
  try {
    const result = await PathaoCourierService.getStatus(req.params.consignmentId);
    res.json(result);
  } catch (err: any) {
    res.status(502).json({ success: false, message: err.message || 'Pathao status check failed' });
  }
});

// Pathao Webhook Receiver - Auto updates order status on Delivery / Return
courierRouter.post('/pathao/webhook', async (req, res) => {
  try {
    const eventData = req.body || {};
    console.log('[Pathao Webhook Event Received]:', JSON.stringify(eventData));

    const consignmentId = eventData.consignment_id || eventData.consignmentId || eventData.merchant_order_id;
    const rawStatus = (eventData.order_status || eventData.status || '').toLowerCase();

    if (consignmentId) {
      const matchIndex = storeOrders.findIndex(
        o => o.pathaoConsignmentId === consignmentId || o.id === consignmentId
      );

      if (matchIndex !== -1) {
        let newStatus = storeOrders[matchIndex].status;
        if (rawStatus.includes('delivered') || rawStatus === 'successful') {
          newStatus = 'Delivered';
        } else if (rawStatus.includes('return') || rawStatus.includes('cancelled') || rawStatus.includes('failed')) {
          newStatus = 'Return';
        }

        storeOrders[matchIndex] = {
          ...storeOrders[matchIndex],
          status: newStatus,
          pathaoStatus: eventData.order_status || eventData.status,
          updatedAt: new Date().toISOString()
        };
        saveOrdersToDisk(storeOrders);
        globalCache.invalidateTag('orders');
        console.log(`[Pathao Auto-Update]: Order ${storeOrders[matchIndex].id} status changed to ${newStatus}`);
      }
    }

    res.status(200).json({ success: true, message: 'Webhook event processed' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Meta Facebook CAPI Protected by Circuit Breaker
facebookRouter.post('/capi', async (req, res) => {
  const { eventName, eventId, eventData, userData, eventSourceUrl, testEventCode } = req.body || {};
  if (!eventName || !eventId || !eventSourceUrl) {
    res.status(400).json({ success: false, message: 'eventName, eventId, and eventSourceUrl are required' });
    return;
  }
  const forwardedFor = req.header('cf-connecting-ip') || req.header('x-forwarded-for');
  const clientIpAddress = (req.header('cf-connecting-ip') || forwardedFor?.split(',')[0] || req.ip || req.socket.remoteAddress || '').trim();

  // Extract Facebook Pixel cookies for maximum match quality
  const rawCookies = req.headers.cookie || '';
  const fbpMatch = rawCookies.match(/_fbp=([^;]+)/);
  const fbcMatch = rawCookies.match(/_fbc=([^;]+)/);
  const testCodeCookie = rawCookies.match(/meta_test_code=([^;]+)/);

  const resolvedTestCode = (
    testEventCode ||
    req.query.test_event_code as string ||
    req.query.test_code as string ||
    testCodeCookie?.[1] ||
    ''
  ).trim();

  const enrichedUserData = {
    ...userData,
    fbp: userData?.fbp || fbpMatch?.[1],
    fbc: userData?.fbc || fbcMatch?.[1],
    clientIpAddress
  };

  try {
    const result = await circuitBreakerRegistry.metaPixel.execute(async () => {
      return FacebookCapiService.sendEvent(eventName, {
        eventId,
        eventSourceUrl,
        userAgent: req.header('user-agent'),
        customData: eventData || {},
        testEventCode: resolvedTestCode || undefined
      }, enrichedUserData);
    }, async () => {
      return { success: false, status: 503, message: 'Meta CAPI circuit breaker is open (fast-fallback)' };
    });

    res.status(result.success ? 200 : (result.status || 502)).json(result);
  } catch (err: any) {
    res.status(502).json({ success: false, message: err?.message || 'Meta CAPI failed' });
  }
});
