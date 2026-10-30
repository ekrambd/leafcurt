import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { FacebookCapiService } from '../src/server/services/facebookCapiService';
import { PathaoCourierService } from '../src/server/services/pathaoService';

process.env.META_PIXEL_ID = '123456789';
process.env.META_CAPI_TOKEN = 'meta-test-token';
process.env.META_TEST_EVENT_CODE = 'TEST00000';
process.env.PATHAO_CLIENT_ID = 'pathao-test-client';
process.env.PATHAO_CLIENT_SECRET = 'pathao-test-secret';
process.env.PATHAO_CLIENT_EMAIL = 'test@example.com';
process.env.PATHAO_CLIENT_PASSWORD = 'password';

const requests: Array<{ url: string; init?: RequestInit }> = [];

globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
  const url = String(input);
  requests.push({ url, init });

  if (url.endsWith('/issue-token')) {
    return Response.json({ access_token: 'test-token', expires_in: 3600 });
  }
  if (url.endsWith('/city-list')) {
    return Response.json({ message: 'Success', type: 'success', code: 200, data: { data: [{ city_id: 1, city_name: 'Dhaka' }] } });
  }
  if (url.includes('/price-plan')) {
    return Response.json({ message: 'price', type: 'success', code: 200, data: { price: 80, final_price: 80 } });
  }
  if (url.endsWith('/orders')) {
    return Response.json({ message: 'Order created', type: 'success', data: { consignment_id: 'PTH-123', order_status: 'Pending' } });
  }
  if (url.includes('graph.facebook.com')) {
    return Response.json({ events_received: 1 });
  }
  return Response.json({ message: 'Unexpected URL' }, { status: 404 });
}) as typeof fetch;

const cities = await PathaoCourierService.getCities();
assert.ok(cities.length > 0);

const price = await PathaoCourierService.calculatePrice({
  recipientCity: 1,
  recipientZone: 1,
  itemWeight: 0.5
});
assert.equal(price.final_price, 80);

const dispatch = await PathaoCourierService.dispatchOrder({
  order: {
    id: 'ORD-TEST-1',
    customerName: 'Test Customer',
    phone: '01700000000',
    address: 'Dhaka',
    district: 'Dhaka',
    totalPrice: 580,
    status: 'Pending',
    paymentMethod: 'COD',
    productTitle: 'Test Product'
  }
});
assert.equal(dispatch.consignmentId, 'PTH-123');

const capiResult = await FacebookCapiService.sendEvent('Purchase', {
  eventId: 'purchase-test-1',
  eventSourceUrl: 'https://example.com/checkout',
  userAgent: 'integration-test',
  customData: { value: 580, currency: 'BDT' }
}, { phone: '01700000000' });
assert.equal(capiResult.success, true);

const metaRequest = requests.find(request => request.url.includes('graph.facebook.com'))!;
const metaBody = JSON.parse(String(metaRequest.init?.body));
assert.equal(metaBody.data[0].event_id, 'purchase-test-1');
assert.equal(Array.isArray(metaBody.data[0].user_data.ph) ? metaBody.data[0].user_data.ph[0] : metaBody.data[0].user_data.ph, createHash('sha256').update('8801700000000').digest('hex'));
assert.equal(metaBody.access_token, 'meta-test-token');
assert.equal(metaBody.test_event_code, 'TEST00000');

const checkoutResult = await FacebookCapiService.sendEvent('InitiateCheckout', {
  eventId: 'checkout-test-1',
  eventSourceUrl: 'https://example.com/book',
  userAgent: 'integration-test',
  customData: { value: 370, currency: 'BDT' }
}, { phone: '01700000000' });
assert.equal(checkoutResult.success, true);

const checkoutRequest = requests.filter(request => request.url.includes('graph.facebook.com')).at(-1)!;
const checkoutBody = JSON.parse(String(checkoutRequest.init?.body));
assert.equal(checkoutBody.data[0].event_name, 'InitiateCheckout');
assert.equal(checkoutBody.data[0].event_id, 'checkout-test-1');

const unsupportedEvent = await FacebookCapiService.sendEvent('NotARealEvent', {}, {});
assert.equal(unsupportedEvent.success, false);
assert.equal(unsupportedEvent.status, 400);

console.log('Integration smoke tests passed without external network calls.');
