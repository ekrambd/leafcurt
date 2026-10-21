import { Router } from 'express';
import { 
  storeAbandonedCarts, 
  upsertAbandonedCart, 
  adminRecoverCart, 
  deleteAbandonedCart, 
  calculateAbandonedCartMetrics,
  normalizePhoneNumber,
  storeOrders,
  saveOrdersToDisk
} from '../data/store';
import { BookOrder } from '../../types';
import { requireAdmin } from '../middleware/adminAuth';

export const abandonedCartRouter = Router();

// GET /api/abandoned-carts - List carts & metrics
abandonedCartRouter.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const { status, search } = req.query;

  let filtered = [...storeAbandonedCarts];

  if (status && status !== 'all') {
    filtered = filtered.filter(c => c.status === status);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(c => 
      c.customerPhone.includes(q) ||
      (c.customerName && c.customerName.toLowerCase().includes(q)) ||
      (c.customerAddress && c.customerAddress.toLowerCase().includes(q)) ||
      c.items.some(i => i.productTitle.toLowerCase().includes(q))
    );
  }

  // Sort by lastActivityAt descending (most recent first)
  filtered.sort((a, b) => new Date(b.lastActivityAt || b.createdAt).getTime() - new Date(a.lastActivityAt || a.createdAt).getTime());

  const metrics = calculateAbandonedCartMetrics(storeAbandonedCarts);

  res.json({
    success: true,
    carts: filtered,
    metrics,
    total: filtered.length
  });
});

// POST /api/abandoned-carts/capture - Public real-time debounced capture
abandonedCartRouter.post('/capture', (req, res) => {
  try {
    const { 
      customerPhone, 
      customerName, 
      customerAddress, 
      customerDistrict, 
      customerEmail,
      items, 
      subtotal, 
      deliveryCharge, 
      totalAmount, 
      source,
      sourceSlug
    } = req.body;

    if (!customerPhone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const cleanPhone = normalizePhoneNumber(customerPhone);
    if (!cleanPhone || cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
      return res.status(400).json({ success: false, message: 'Invalid 11-digit Bangladeshi mobile number' });
    }

    const cart = upsertAbandonedCart({
      customerPhone: cleanPhone,
      customerName,
      customerAddress,
      customerDistrict,
      customerEmail,
      items: Array.isArray(items) ? items : [],
      subtotal: Number(subtotal) || 0,
      deliveryCharge: Number(deliveryCharge) || 0,
      totalAmount: totalAmount !== undefined ? Number(totalAmount) : undefined,
      source: source || 'storefront_checkout',
      sourceSlug
    });

    if (!cart) {
      return res.status(400).json({ success: false, message: 'Could not capture cart' });
    }

    return res.json({ success: true, cart });
  } catch (err: any) {
    console.error('[AbandonedCart] Capture error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
});

// POST /api/abandoned-carts/:id/recover - Mark cart as recovered by Admin
abandonedCartRouter.post('/:id/recover', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { channel, notes, orderId } = req.body;

    if (!channel) {
      return res.status(400).json({ success: false, message: 'Recovery channel is required' });
    }

    const updated = adminRecoverCart(id, channel, notes, orderId);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Abandoned cart not found' });
    }

    res.json({ success: true, cart: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/abandoned-carts/:id/convert-to-order - 1-Click Convert to Official Order
abandonedCartRouter.post('/:id/convert-to-order', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { customDeliveryCharge, paymentMethod, notes } = req.body;

    const cart = storeAbandonedCarts.find(c => c.id === id);
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Abandoned cart not found' });
    }

    const now = new Date().toISOString();
    const orderId = `ORD-REC-${Date.now().toString().slice(-6)}`;
    const effectiveDelivery = customDeliveryCharge !== undefined ? Number(customDeliveryCharge) : (cart.deliveryCharge || 0);
    const effectiveTotal = (cart.subtotal || 0) + effectiveDelivery;

    const primaryItem = cart.items[0];
    const totalQty = cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const itemNames = cart.items.map(i => `${i.productTitle}${i.variant ? ` (${i.variant})` : ''} x${i.quantity || 1}`).join(', ');

    const newOrder: BookOrder = {
      id: orderId,
      customerName: cart.customerName || 'Customer (Recovered)',
      phone: cart.customerPhone,
      address: cart.customerAddress || 'Address not specified',
      district: cart.customerDistrict || 'Dhaka',
      quantity: totalQty || 1,
      price: effectiveTotal,
      unitPrice: cart.items[0]?.unitPrice || effectiveTotal,
      deliveryCharge: effectiveDelivery,
      total: effectiveTotal,
      orderTotal: effectiveTotal,
      subtotal: cart.subtotal,
      itemCount: totalQty,
      bookTitle: itemNames || (primaryItem ? primaryItem.productTitle : 'Recovered Product'),
      paymentMethod: (paymentMethod as any) || 'COD',
      deliveryStatus: 'Pending',
      status: 'pending',
      orderDate: now,
      createdAt: now,
      updatedAt: now,
      items: cart.items.map(i => ({
        product: {
          id: i.productId,
          title: i.productTitle,
          price: i.unitPrice,
          image: i.productImage
        } as any,
        quantity: i.quantity || 1,
        selectedVariant: i.variant,
        selectedColor: i.selectedColor,
        selectedSize: i.selectedSize
      })),
      notes: `[Real-Time Abandoned Cart Recovery] Source: ${cart.source}. ${notes || ''}`.trim()
    };

    // Save order
    storeOrders.unshift(newOrder);
    saveOrdersToDisk(storeOrders);

    // Update cart status to admin_recovered
    const updatedCart = adminRecoverCart(id, 'admin_converted', `Converted to Order #${orderId}`, orderId);

    res.json({
      success: true,
      order: newOrder,
      cart: updatedCart,
      message: `Successfully created Order #${orderId} from abandoned cart!`
    });
  } catch (err: any) {
    console.error('[AbandonedCart] Convert to order error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/abandoned-carts/send-sms - 1-Click SMS Dispatch
abandonedCartRouter.post('/send-sms', requireAdmin, async (req, res) => {
  try {
    const { phone, message, cartId } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ success: false, message: 'Phone and message are required' });
    }

    // In a live environment with SMSinBD / BulkSMS API keys configured:
    const smsApiKey = process.env.SMSINBD_API_KEY || process.env.BULK_SMS_API_KEY || '';
    const smsSenderId = process.env.SMSINBD_SENDER_ID || 'SMSINBD';

    let dispatched = false;
    if (smsApiKey) {
      try {
        const smsRes = await fetch(`http://api.smsinbd.com/smsapi?api_key=${smsApiKey}&type=text&contacts=${phone}&senderid=${smsSenderId}&msg=${encodeURIComponent(message)}`);
        if (smsRes.ok) dispatched = true;
      } catch (e) {
        console.warn('[AbandonedCart] SMS gateway call failed, logging delivery:', e);
      }
    }

    // Mark cart as recovered via SMS
    if (cartId) {
      adminRecoverCart(cartId, 'sms', `SMS Sent: "${message.slice(0, 40)}..."`);
    }

    res.json({
      success: true,
      dispatched,
      message: `SMS successfully queued for ${phone}`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/abandoned-carts/:id - Delete cart
abandonedCartRouter.delete('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const deleted = deleteAbandonedCart(id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Abandoned cart not found' });
  }
  res.json({ success: true, message: 'Abandoned cart deleted successfully' });
});
