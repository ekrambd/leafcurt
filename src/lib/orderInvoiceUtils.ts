import { BookOrder } from '../types';

/**
 * Check if payment method is Cash on Delivery
 */
export function isCodPaymentMethod(method?: string): boolean {
  if (!method) return true;
  const m = method.toLowerCase().trim();
  return (
    m === 'cod' ||
    m === 'cash on delivery' ||
    m === 'cash_on_delivery' ||
    m.includes('cash') ||
    m.includes('ক্যাশ') ||
    m === 'hand cash'
  );
}

/**
 * Determine if an order is paid
 */
export function isOrderPaid(order: {
  paymentMethod?: string;
  paymentGateway?: string;
  status?: string;
  trxId?: string;
  paymentStatus?: string;
}): boolean {
  if (order.paymentStatus) {
    return order.paymentStatus.toLowerCase() === 'paid';
  }

  // If COD, it is only paid once Delivered
  if (isCodPaymentMethod(order.paymentMethod || order.paymentGateway)) {
    return order.status === 'Delivered';
  }

  // If online transaction with trxId
  if (order.trxId && order.trxId.trim().length > 0) {
    return true;
  }

  const method = (order.paymentMethod || order.paymentGateway || '').toLowerCase();
  if (
    method.includes('bkash') ||
    method.includes('nagad') ||
    method.includes('rocket') ||
    method.includes('card') ||
    method.includes('online') ||
    method.includes('sslcommerz') ||
    method.includes('aamarpay') ||
    method.includes('shurjopay') ||
    method === 'paid'
  ) {
    return true;
  }

  return false;
}

/**
 * Format relative time (e.g. 'an hour ago', '4 hours ago', 'yesterday')
 */
export function formatRelativeTime(dateInput: string | Date | undefined): string {
  if (!dateInput) return 'just now';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin === 1) return 'a minute ago';
    if (diffMin < 60) return `${diffMin} mins ago`;
    if (diffHours === 1) return 'an hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'recently';
  }
}

/**
 * Clean phone number to Bangladeshi format with country code: 8801XXXXXXXXX
 */
export function normalizeBdPhone(rawPhone?: string): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/[^0-9]/g, '');
  if (digits.startsWith('880')) return digits;
  if (digits.startsWith('0')) return '88' + digits;
  if (digits.length === 10) return '880' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return '880' + digits;
  return digits;
}

/**
 * Build WhatsApp order confirmation & invoice auto-send URL (matching Image 3)
 */
export function buildWhatsAppInvoiceUrl(
  order: BookOrder, 
  storeName: string = 'Leaf Curt', 
  storeDomain?: string
): string {
  const cleanPhone = normalizeBdPhone(order.phone || order.customerPhone);
  const orderShortId = (order.id || '').replace(/^ORD-/, '');
  
  // Invoice link
  const domain = storeDomain 
    ? (storeDomain.startsWith('http') ? storeDomain : `https://${storeDomain}`)
    : (typeof window !== 'undefined' ? window.location.origin : 'https://www.leafcurt.com');
  const invoiceUrl = `${domain}/order/${orderShortId}/invoice`;

  // Item breakdown
  let breakdownLines: string[] = [];
  if (order.items && order.items.length > 0) {
    breakdownLines = order.items.map((it: any) => {
      const title = it.product?.title || it.title || order.productTitle || 'Product';
      const qty = it.quantity || 1;
      const unitPrice = it.variant?.price || it.product?.price || it.price || 0;
      return `• ${qty}x *${title}* — BDT ${unitPrice * qty}`;
    });
  } else {
    const qty = order.quantity || 1;
    const price = order.price || 0;
    const title = order.productTitle || 'Product';
    breakdownLines = [`• ${qty}x *${title}* — BDT ${price * qty}`];
  }

  const subtotal = order.totalPrice 
    ? order.totalPrice - (order.deliveryCharge || 0) + (order.couponDiscount || order.discountAmount || 0)
    : ((order.price || 0) * (order.quantity || 1));
  const deliveryText = (!order.deliveryCharge || order.deliveryCharge === 0) ? 'Free' : `BDT ${order.deliveryCharge}`;
  const total = order.totalAmount || order.totalPrice || ((order.price || 0) * (order.quantity || 1) + (order.deliveryCharge || 0));
  const paymentMethod = order.paymentMethod === 'COD' || !order.paymentMethod ? 'Cash on Delivery' : order.paymentMethod;

  const message = `${invoiceUrl}

❖ *ORDER CONFIRMED — ${storeName.toUpperCase()}*
Order #${orderShortId} · Thank you for your order!

❖ *Order Breakdown:*
${breakdownLines.join('\n')}
-----------------------------------
Subtotal: BDT ${subtotal}
Delivery: ${deliveryText}
*Total Payable: BDT ${total}*
Payment: ${paymentMethod}`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Dynamic loader for html2canvas from CDN
 */
let html2canvasPromise: Promise<any> | null = null;
export function loadHtml2Canvas(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window not defined'));
  }
  if ((window as any).html2canvas) {
    return Promise.resolve((window as any).html2canvas);
  }
  if (html2canvasPromise) {
    return html2canvasPromise;
  }

  html2canvasPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).html2canvas) {
        resolve((window as any).html2canvas);
      } else {
        reject(new Error('html2canvas loaded but not found on window'));
      }
    };
    script.onerror = () => {
      // Fallback mirror
      const fallbackScript = document.createElement('script');
      fallbackScript.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      fallbackScript.async = true;
      fallbackScript.onload = () => resolve((window as any).html2canvas);
      fallbackScript.onerror = () => reject(new Error('Could not load html2canvas library'));
      document.head.appendChild(fallbackScript);
    };
    document.head.appendChild(script);
  });

  return html2canvasPromise;
}

/**
 * Downloads a canvas element as PNG file
 */
export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string = 'invoice.png') {
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Captures an HTML element and copies it to clipboard as an Image (PNG).
 * Also downloads PNG if clipboard image write is not supported or rejected by browser permissions.
 */
export async function copyElementAsImage(
  element: HTMLElement, 
  filename: string = 'invoice.png'
): Promise<{ success: boolean; message: string; downloaded?: boolean }> {
  try {
    const html2canvas = await loadHtml2Canvas();
    const canvas: HTMLCanvasElement = await html2canvas(element, {
      scale: 2, // High DPI for crisp text and barcodes
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });

    // Check if Clipboard Item API is available
    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      return new Promise((resolve) => {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            downloadCanvasAsPng(canvas, filename);
            resolve({ success: true, message: 'Image downloaded as PNG! 💾', downloaded: true });
            return;
          }
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            resolve({ success: true, message: 'Invoice copied as Image to Clipboard! 📋📸' });
          } catch (writeErr) {
            console.warn('[copyElementAsImage] Clipboard write failed, downloading instead:', writeErr);
            downloadCanvasAsPng(canvas, filename);
            resolve({ 
              success: true, 
              message: 'Copied to PNG file (downloaded) due to browser clipboard permissions! 💾', 
              downloaded: true 
            });
          }
        }, 'image/png');
      });
    } else {
      downloadCanvasAsPng(canvas, filename);
      return { success: true, message: 'Image downloaded as PNG file! 💾', downloaded: true };
    }
  } catch (err: any) {
    console.error('[copyElementAsImage] Error rendering image:', err);
    return { success: false, message: err?.message || 'Failed to capture element as image' };
  }
}
