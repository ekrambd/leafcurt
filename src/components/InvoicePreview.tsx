import React, { useRef, useState, useEffect } from 'react';
import { BookOrder } from '../types';
import { 
  Printer, MessageCircle, Copy, CheckCircle, Download, Camera, 
  Share2, Check, ExternalLink, QrCode as QrIcon
} from 'lucide-react';
import QRCode from 'qrcode';
import { useAppStore } from '../store/useAppStore';
import { dbService } from '../lib/dbService';
import { 
  buildWhatsAppInvoiceUrl, 
  copyElementAsImage, 
  downloadCanvasAsPng, 
  loadHtml2Canvas,
  isOrderPaid
} from '../lib/orderInvoiceUtils';
import { encodeCode128B } from '../lib/barcodeGenerator';

interface Props {
  order: BookOrder;
}

// Real Scannable Code 128 (Subset B) Barcode Component
function BarcodeSVG({ value, height = 36 }: { value: string; height?: number }) {
  const cleanVal = (value || '1001').trim();
  const modules = encodeCode128B(cleanVal);
  const totalWidth = modules.reduce((sum, m) => sum + m.width, 0);

  let currentX = 0;
  return (
    <svg 
      viewBox={`0 0 ${totalWidth} ${height}`} 
      className="w-full h-8" 
      preserveAspectRatio="none"
      style={{ imageRendering: 'pixelated' }}
    >
      <rect x="0" y="0" width={totalWidth} height={height} fill="#ffffff" />
      {modules.map((m, idx) => {
        const x = currentX;
        currentX += m.width;
        if (!m.isBar) return null;
        return (
          <rect
            key={idx}
            x={x}
            y={0}
            width={m.width}
            height={height}
            fill="#000000"
          />
        );
      })}
    </svg>
  );
}

export function InvoicePreview({ order }: Props) {
  const { ecomSettings, instituteInfo, setEcomSettings, setInstituteInfo } = useAppStore();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  
  const printRef = useRef<HTMLDivElement>(null);

  // Auto-sync real settings from server if not loaded yet
  useEffect(() => {
    if (!ecomSettings?.storeName) {
      dbService.getEcomSettings().then((s) => {
        if (s) setEcomSettings(s);
      }).catch(() => {});
    }
    if (!instituteInfo?.name || instituteInfo.name === 'Store Ltd.') {
      dbService.getInstituteInfo().then((i) => {
        if (i) setInstituteInfo(i);
      }).catch(() => {});
    }
  }, []);

  const orderShortId = (order.id || '').replace(/^ORD-/, '');
  const trackingId = order.pathaoConsignmentId || (order as any).trackingCode || null;

  const dt = (() => {
    try {
      const d = new Date(order.createdAt);
      return {
        date: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).format(d),
        time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(d)
      };
    } catch {
      return { date: order.createdAt || '', time: '' };
    }
  })();

  const storeName = (() => {
    const raw = ecomSettings?.companyName || ecomSettings?.storeName || instituteInfo?.name;
    if (!raw || raw === 'Store Ltd.' || raw === 'Store' || raw === 'LEAFCURT') return 'Leaf Curt';
    return raw.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  })();
  const rawPhone = ecomSettings?.contactPhone || instituteInfo?.phone || ecomSettings?.headerSettings?.phone || '01635311494';
  const storePhone = (rawPhone === '+880 1700-000000' || !rawPhone) ? '01635311494' : rawPhone;
  const storeLogo = ecomSettings?.storeLogo || instituteInfo?.logo || '/favicon/android-chrome-192x192.png';
  const storeDomain = (ecomSettings?.storeDomain && !ecomSettings.storeDomain.includes('localhost'))
    ? ecomSettings.storeDomain
    : 'www.leafcurt.com';

  // Generate Review & Feedback QR Code
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://leafcurt.com';
    const reviewUrl = `${origin}/shop?review=${encodeURIComponent(order.id)}&phone=${encodeURIComponent(order.phone || '')}`;
    
    QRCode.toDataURL(reviewUrl, {
      width: 140,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.warn('QR code generation failed:', err));
  }, [order.id, order.phone]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    showToast(`Copied ${field}: ${text}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const windowPrint = window.open('', '', 'width=850,height=600');
    if (!windowPrint) return;
    
    windowPrint.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${orderShortId}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
            @media print {
              html, body {
                margin: 0;
                padding: 0;
                background: #ffffff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print { display: none !important; }
              .invoice-sheet {
                box-shadow: none !important;
                border: 1px solid #e2e8f0 !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                margin-bottom: 12mm !important;
              }
            }
          </style>
        </head>
        <body class="bg-white p-2">
          ${printContent.outerHTML}
        </body>
      </html>
    `);
    windowPrint.document.close();
    windowPrint.focus();
    setTimeout(() => {
      windowPrint.print();
      windowPrint.close();
    }, 400);
  };

  const handleWhatsApp = () => {
    const url = buildWhatsAppInvoiceUrl(order, storeName, ecomSettings?.storeDomain);
    window.open(url, '_blank');
  };

  const handleCopyAsImage = async () => {
    if (!printRef.current) return;
    setIsCapturing(true);
    showToast('Rendering high-res invoice slip...');
    try {
      const res = await copyElementAsImage(printRef.current, `invoice-${orderShortId}.png`);
      showToast(res.message);
    } catch (err: any) {
      showToast(err?.message || 'Failed to copy image');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDownloadPng = async () => {
    if (!printRef.current) return;
    setIsCapturing(true);
    try {
      const html2canvas = await loadHtml2Canvas();
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      downloadCanvasAsPng(canvas, `invoice-${orderShortId}.png`);
      showToast('Invoice slip downloaded as PNG!');
    } catch (err: any) {
      showToast(err?.message || 'Download failed');
    } finally {
      setIsCapturing(false);
    }
  };

  const subtotal = order.totalPrice 
    ? Math.max(0, order.totalPrice - (order.deliveryCharge || 0) + (order.couponDiscount || order.discountAmount || 0)) 
    : ((order.price || 0) * (order.quantity || 1));
  const deliveryCharge = order.deliveryCharge || 0;
  const grandTotal = order.totalAmount || order.totalPrice || (subtotal + deliveryCharge);
  const isPaid = isOrderPaid(order);
  const codDue = isPaid ? 0 : grandTotal;

  // Courier display name
  const courierName = order.courierProvider 
    ? order.courierProvider.charAt(0).toUpperCase() + order.courierProvider.slice(1)
    : (order.pathaoConsignmentId ? 'Pathao' : 'Pathao Courier');

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-slate-900 text-white px-4 py-2 text-xs font-bold flex items-center justify-between border-b border-slate-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm text-slate-900">Commercial Slip Preview</span>
          <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-200 text-slate-800 rounded-md">
            #{orderShortId}
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            (Compact A4-printable slip: up to 3–4 fit per A4 sheet)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={handleCopyAsImage}
            disabled={isCapturing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            title="Copy as PNG Image to paste directly in WhatsApp / Messenger"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isCapturing ? 'Capturing...' : 'Copy Image'}</span>
          </button>

          <button 
            type="button"
            onClick={handleDownloadPng}
            disabled={isCapturing}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            title="Download PNG"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PNG</span>
          </button>

          <button 
            type="button"
            onClick={handleWhatsApp}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            title="Send WhatsApp Invoice"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button 
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            title="Print small slips on A4"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Slip</span>
          </button>
        </div>
      </div>

      {/* Invoice Canvas Preview - Compact Professional Slip matching user design */}
      <div className="p-3 sm:p-5 overflow-x-auto bg-slate-100/70 flex justify-center">
        <div 
          ref={printRef}
          className="invoice-sheet w-full max-w-[590px] bg-white p-4 sm:p-5 rounded-xl border border-slate-300 shadow-sm text-slate-900 font-sans text-xs"
        >
          {/* Header Row: Logo, Brand & Customer Copy Badge */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                <img 
                  src={storeLogo} 
                  alt={storeName} 
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => { e.currentTarget.src = '/favicon/android-chrome-192x192.png'; }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase leading-none">
                    {storeName}
                  </h1>
                  <span className="text-[9px] font-extrabold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 uppercase tracking-wider">
                    Customer Copy
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                  Bangladesh · {storePhone}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-mono block">
                {storeDomain}
              </span>
            </div>
          </div>

          {/* Barcodes Row: Left = Order Invoice Barcode | Right = Courier Tracking Barcode */}
          <div className="grid grid-cols-2 gap-3 p-2 bg-slate-50/70 rounded-lg border border-slate-200 mb-3">
            {/* Invoice ID Barcode */}
            <div className="space-y-1">
              <BarcodeSVG value={orderShortId} height={28} />
              <div className="flex items-center justify-between pt-0.5">
                <span className="font-mono text-[11px] font-black text-slate-800">
                  <span className="text-slate-400 font-bold text-[9px]">INV</span> #{orderShortId}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(orderShortId, 'Invoice ID')}
                  className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer no-print"
                  title="Copy Invoice ID"
                >
                  {copiedField === 'Invoice ID' ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            {/* Courier Tracking ID Barcode */}
            <div className="space-y-1">
              {trackingId ? (
                <>
                  <BarcodeSVG value={trackingId} height={28} />
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="font-mono text-[11px] font-black text-slate-900 truncate">
                      <span className="text-teal-600 font-bold text-[9px]">TRK</span> {trackingId}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(trackingId, 'Tracking ID')}
                      className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer no-print shrink-0"
                      title="Copy Tracking Code"
                    >
                      {copiedField === 'Tracking ID' ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col justify-center items-center p-1 bg-amber-50/60 rounded border border-dashed border-amber-200 text-center">
                  <span className="text-[10px] font-bold text-amber-800">Tracking Pending</span>
                  <span className="text-[9px] text-amber-600">Auto-generated upon courier dispatch</span>
                </div>
              )}
            </div>
          </div>

          {/* Customer Bill To & Meta Section */}
          <div className="border-b border-slate-200 pb-2.5 mb-2.5 grid grid-cols-1 sm:grid-cols-12 gap-2 text-[11px]">
            {/* Customer Information (Left 7 cols) */}
            <div className="sm:col-span-7 space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black text-slate-400 uppercase">BILL TO:</span>
                <strong className="text-slate-900 font-bold">{order.customerName}</strong>
                <button
                  type="button"
                  onClick={() => handleCopy(order.customerName, 'Customer Name')}
                  className="text-slate-400 hover:text-slate-700 p-0.5 no-print cursor-pointer"
                  title="Copy Name"
                >
                  <Copy className="w-2.5 h-2.5" />
                </button>
                <span className="text-slate-300">·</span>
                <span className="font-mono font-bold text-slate-800">{order.phone}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(order.phone, 'Phone Number')}
                  className="text-slate-400 hover:text-slate-700 p-0.5 no-print cursor-pointer"
                  title="Copy Phone"
                >
                  <Copy className="w-2.5 h-2.5" />
                </button>
              </div>

              <div className="flex items-start gap-1">
                <p className="text-slate-600 leading-snug break-words flex-1">
                  {order.address}{order.thana ? `, ${order.thana}` : ''}{order.district ? `, ${order.district}` : ''}
                </p>
                <button
                  type="button"
                  onClick={() => handleCopy(`${order.address}${order.thana ? `, ${order.thana}` : ''}${order.district ? `, ${order.district}` : ''}`, 'Address')}
                  className="text-slate-400 hover:text-slate-700 p-0.5 no-print cursor-pointer shrink-0"
                  title="Copy Full Address"
                >
                  <Copy className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

            {/* Order Date & Courier Status (Right 5 cols) */}
            <div className="sm:col-span-5 grid grid-cols-2 gap-1.5 text-[10px] sm:border-l sm:border-slate-100 sm:pl-2.5">
              <div>
                <span className="text-slate-400 block font-bold uppercase text-[9px]">Date:</span>
                <span className="font-bold text-slate-800">{dt.date}, {dt.time}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold uppercase text-[9px]">Method:</span>
                <span className="font-bold text-slate-800 truncate block">
                  {order.paymentMethod === 'COD' || !order.paymentMethod ? 'Cash on Delivery' : order.paymentMethod}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold uppercase text-[9px]">Courier:</span>
                <span className="font-bold text-slate-800">{courierName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold uppercase text-[9px]">Status:</span>
                <span className="font-bold text-teal-700">
                  {order.status} {order.quantity ? `(${order.quantity} pcs)` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-[11px] mb-2.5 border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-black uppercase text-[9px] tracking-wider">
                <th className="py-1 text-left w-6">#</th>
                <th className="py-1 text-left">ITEM DESCRIPTION</th>
                <th className="py-1 text-right w-16">RATE</th>
                <th className="py-1 text-center w-10">QTY</th>
                <th className="py-1 text-right w-20">AMOUNT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items && order.items.length > 0 ? (
                order.items.map((item: any, idx: number) => {
                  const rate = item.variant?.price || item.product?.price || item.price || 0;
                  const qty = item.quantity || 1;
                  const itemTitle = item.product?.title || item.title || order.productTitle;
                  const itemImage = item.variant?.image || item.product?.image || item.image;
                  const sku = item.product?.sku || item.sku || `sku:${itemTitle.slice(0, 4).toLowerCase()}`;

                  return (
                    <tr key={idx}>
                      <td className="py-1.5 text-slate-400 font-mono">{String(idx + 1).padStart(2, '0')}</td>
                      <td className="py-1.5 pr-2">
                        <div className="flex items-center gap-1.5">
                          {itemImage && (
                            <img 
                              src={itemImage} 
                              alt="" 
                              className="w-5 h-5 rounded object-cover border border-slate-200 shrink-0" 
                            />
                          )}
                          <div>
                            <span className="font-bold text-slate-900 leading-tight">
                              {itemTitle}
                            </span>
                            {item.variant?.name && (
                              <span className="text-[10px] text-slate-500 font-medium ml-1">
                                ({item.variant.name})
                              </span>
                            )}
                            <span className="text-[9px] font-mono text-slate-400 ml-1.5">
                              (SKU: {sku})
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-1.5 text-right font-mono text-slate-700">{rate.toFixed(2)}</td>
                      <td className="py-1.5 text-center font-mono font-bold text-slate-900">{qty}</td>
                      <td className="py-1.5 text-right font-mono font-bold text-slate-900">{(rate * qty).toFixed(2)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="py-1.5 text-slate-400 font-mono">01</td>
                  <td className="py-1.5 pr-2">
                    <span className="font-bold text-slate-900">{order.productTitle || 'Product'}</span>
                    <span className="text-[9px] font-mono text-slate-400 ml-1.5">
                      (SKU: {(order as any).sku || 'LC-ITEM'})
                    </span>
                  </td>
                  <td className="py-1.5 text-right font-mono text-slate-700">{(order.price || 0).toFixed(2)}</td>
                  <td className="py-1.5 text-center font-mono font-bold text-slate-900">{order.quantity || 1}</td>
                  <td className="py-1.5 text-right font-mono font-bold text-slate-900">
                    {((order.price || 0) * (order.quantity || 1)).toFixed(2)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Bottom Section: Left = Scan for Review & Experience QR | Right = Totals & COD Due */}
          <div className="border-t border-slate-200 pt-2 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            {/* Scan Review Box (Left 7 cols) */}
            <div className="sm:col-span-7 flex items-center gap-2.5 p-2 bg-slate-50/80 rounded-lg border border-slate-200">
              {qrCodeDataUrl ? (
                <img 
                  src={qrCodeDataUrl} 
                  alt="Scan to Review" 
                  className="w-14 h-14 bg-white p-0.5 rounded border border-slate-200 shrink-0" 
                />
              ) : (
                <div className="w-14 h-14 bg-white rounded border border-slate-200 flex items-center justify-center shrink-0">
                  <QrIcon className="w-6 h-6 text-slate-400" />
                </div>
              )}
              <div className="space-y-0.5">
                <p className="text-[11px] font-extrabold text-slate-900 leading-tight">
                  আপনার অভিজ্ঞতা কেমন? · Share Feedback
                </p>
                <p className="text-[10px] text-slate-500 leading-snug">
                  QR স্ক্যান করে অর্ডার ও পণ্যের রিভিউ দিন এবং কুপন জিতুন!
                </p>
                <span className="text-[9px] font-mono text-[#0279c7] font-semibold block">
                  Scan to review verified purchase
                </span>
              </div>
            </div>

            {/* Totals Breakdown & COD Payable (Right 5 cols) */}
            <div className="sm:col-span-5 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono font-bold text-slate-800">৳ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery</span>
                <span className="font-mono font-bold text-slate-800">৳ {deliveryCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-black text-slate-900 pt-1 border-t border-slate-200">
                <span>Total</span>
                <span className="font-mono font-black text-sm">৳ {grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-black text-slate-900 bg-slate-100 p-1 rounded border border-slate-200">
                <span>COD / Due</span>
                <span className="font-mono font-black text-sm text-[#0279c7]">৳ {codDue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Bottom Signatures & Confirmation */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-2 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Order Confirmed · Thank you for shopping with Leaf Curt</span>
            <span>Authorized Signature</span>
          </div>

        </div>
      </div>
    </div>
  );
}
