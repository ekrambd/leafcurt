import React, { useRef, useState, useEffect } from 'react';
import { BookOrder } from '../types';
import { 
  Printer, MessageCircle, Copy, CheckCircle, Download, Camera, 
  Share2, Check, ExternalLink 
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { dbService } from '../lib/dbService';
import { 
  buildWhatsAppInvoiceUrl, 
  copyElementAsImage, 
  downloadCanvasAsPng, 
  loadHtml2Canvas 
} from '../lib/orderInvoiceUtils';

interface Props {
  order: BookOrder;
}

export function InvoicePreview({ order }: Props) {
  const { ecomSettings, instituteInfo, setEcomSettings, setInstituteInfo } = useAppStore();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
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

  const dt = (() => {
    try {
      const d = new Date(order.createdAt);
      return {
        date: new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short', year: '2-digit' }).format(d),
        time: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(d)
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
  const storeAddress = ecomSettings?.storeAddress || instituteInfo?.address || 'Banasree, Dhaka, Bangladesh';
  const rawPhone = ecomSettings?.contactPhone || instituteInfo?.phone || ecomSettings?.headerSettings?.phone || '01635311494';
  const storePhone = (rawPhone === '+880 1700-000000' || !rawPhone) ? '01635311494' : rawPhone;
  const storeLogo = ecomSettings?.storeLogo || instituteInfo?.logo || '/uploads/file-1792735476267-28104613.webp';
  const storeDomain = (ecomSettings?.storeDomain && !ecomSettings.storeDomain.includes('localhost'))
    ? ecomSettings.storeDomain
    : 'www.leafcurt.com';

  const orderShortId = (order.id || '').replace(/^ORD-/, '');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const windowPrint = window.open('', '', 'width=900,height=650');
    if (!windowPrint) return;
    
    windowPrint.document.write(`
      <html>
        <head>
          <title>Invoice - ${order.id}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body class="bg-white p-8">
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    windowPrint.document.close();
    windowPrint.focus();
    setTimeout(() => {
      windowPrint.print();
      windowPrint.close();
    }, 500);
  };

  // WhatsApp Auto Invoice (matching Image 3)
  const handleWhatsApp = () => {
    const url = buildWhatsAppInvoiceUrl(order, storeName, ecomSettings?.storeDomain);
    window.open(url, '_blank');
  };

  // Copy text field with feedback
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    showToast(`Copied ${field} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Copy all customer bill-to info as formatted text
  const handleCopyAllBillTo = () => {
    const total = order.totalAmount || order.totalPrice || ((order.price || 0) * (order.quantity || 1) + (order.deliveryCharge || 0));
    const fullInfo = `Order ID: #${orderShortId}\nCustomer: ${order.customerName}\nPhone: ${order.phone}\nAddress: ${order.address}${order.thana ? `, ${order.thana}` : ''}${order.district ? `, ${order.district}` : ''}\nTotal: ৳ ${total.toFixed(2)}`;
    handleCopy(fullInfo, 'all');
  };

  // Copy Entire Invoice As Image to System Clipboard
  const handleCopyAsImage = async () => {
    if (!printRef.current) return;
    setIsCapturing(true);
    showToast('Rendering high-res invoice image...');
    try {
      const res = await copyElementAsImage(printRef.current, `invoice-${orderShortId}.png`);
      showToast(res.message);
    } catch (err: any) {
      showToast(err?.message || 'Failed to copy image');
    } finally {
      setIsCapturing(false);
    }
  };

  // Download Invoice Directly as PNG Image
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
      showToast('Invoice downloaded as PNG! 💾');
    } catch (err: any) {
      showToast(err?.message || 'Download failed');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col font-sans">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="bg-slate-900 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between border-b border-slate-800 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button 
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Actions Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-extrabold text-slate-900">Invoice Details</h2>
            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
              #{orderShortId}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Print-ready official invoice with barcode, items, customer bill-to & experience QR.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Copy as Image Button */}
          <button 
            type="button"
            onClick={handleCopyAsImage}
            disabled={isCapturing}
            title="Copy high-res invoice image to clipboard (paste in WhatsApp, Messenger, etc.)"
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isCapturing ? 'Capturing...' : 'Copy as Image'}</span>
          </button>

          {/* Download PNG Button */}
          <button 
            type="button"
            onClick={handleDownloadPng}
            disabled={isCapturing}
            title="Download PNG invoice image file"
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>PNG</span>
          </button>

          {/* WhatsApp Auto-Send Invoice Button */}
          <button 
            type="button"
            onClick={handleWhatsApp}
            title="Send automated invoice & confirmation breakdown directly to customer WhatsApp"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp Invoice</span>
          </button>

          {/* Print Button */}
          <button 
            type="button"
            onClick={handlePrint}
            title="Print paper invoice"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Invoice Canvas Container */}
      <div className="p-4 sm:p-6 overflow-x-auto bg-slate-100/70 flex justify-center">
        
        {/* Printable/Capturable Official Commercial Invoice Sheet */}
        <div 
          ref={printRef} 
          className="invoice-sheet w-full max-w-[760px] bg-white p-7 sm:p-9 rounded-xl border border-slate-200/90 shadow-sm text-slate-800 font-sans"
        >
          {/* Header Row: Store Info & Invoice Meta */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
            {/* Store Brand & Contact */}
            <div className="flex items-start gap-3.5">
              <div className="h-14 w-14 rounded-xl flex items-center justify-center p-1 shrink-0 overflow-hidden bg-slate-50 border border-slate-200/80">
                <img 
                  src={storeLogo} 
                  alt={storeName} 
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => { e.currentTarget.src = '/uploads/file-1792735476267-28104613.webp'; }}
                />
              </div>

              <div className="space-y-0.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  {storeName}
                </h1>
                {/* Website URL Prominently Displayed */}
                <a 
                  href={`https://${storeDomain}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-xs font-bold text-[#0279c7] hover:underline block font-mono"
                >
                  {storeDomain}
                </a>
                <p className="text-slate-500 text-xs font-medium">{storeAddress}</p>
                <p className="text-slate-500 text-xs font-mono font-medium">{storePhone}</p>
              </div>
            </div>

            {/* Right: Invoice Label, ID & Barcode */}
            <div className="sm:text-right space-y-1 self-stretch sm:self-auto flex sm:flex-col justify-between sm:justify-start items-end">
              <div>
                <span className="text-xs font-black tracking-widest text-slate-400 uppercase block">INVOICE</span>
                <span className="text-lg sm:text-xl font-mono font-black text-slate-900 block leading-tight">
                  #{orderShortId}
                </span>
                <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                  {dt.date} {dt.time}
                </span>
              </div>

              {/* Barcode & Tracking */}
              <div className="pt-1">
                <div 
                  className="w-36 h-6 bg-slate-900 rounded-xs opacity-85 ml-auto" 
                  style={{ background: 'repeating-linear-gradient(90deg, #0f172a 0px, #0f172a 2px, transparent 2px, transparent 4px, #0f172a 4px, #0f172a 6px, transparent 6px, transparent 8px)' }}
                />
                {order.steadfastTrackingCode ? (
                  <p className="text-[10px] font-mono text-[#0279c7] font-bold mt-1">
                    Tracking: #{order.steadfastTrackingCode}
                  </p>
                ) : order.pathaoConsignmentId ? (
                  <p className="text-[10px] font-mono text-[#0279c7] font-bold mt-1">
                    Tracking: #{order.pathaoConsignmentId}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Details Row: Bill To & Order Summary (Clean, border-free layout) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
            {/* Bill To */}
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">
                Bill To
              </span>
              <p className="text-sm font-extrabold text-slate-900">{order.customerName}</p>
              <p className="font-mono font-bold text-slate-700">{order.phone}</p>
              <p className="text-slate-600 leading-relaxed">
                {order.address}{order.thana ? `, ${order.thana}` : ''}{order.district ? `, ${order.district}` : ''}
              </p>
            </div>

            {/* Order Summary Metadata */}
            <div className="sm:text-right space-y-1.5 flex flex-col sm:items-end justify-center">
              <div className="flex justify-between sm:justify-end gap-3 w-full">
                <span className="text-slate-400 font-semibold">Order Channel:</span>
                <span className="font-bold text-slate-800">
                  {order.orderType === 'landing' ? 'Landing Page' : 'Online Store (Website)'}
                </span>
              </div>
              <div className="flex justify-between sm:justify-end gap-3 w-full">
                <span className="text-slate-400 font-semibold">Payment Method:</span>
                <span className="font-bold text-slate-800">
                  {order.paymentMethod === 'COD' || !order.paymentMethod ? 'Cash on Delivery' : order.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between sm:justify-end gap-3 w-full items-center">
                <span className="text-slate-400 font-semibold">Order Status:</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                  order.status === 'Confirmed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                  order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  order.status === 'Shipped' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                  'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table (Clean, sleek, commercial standard) */}
          <div className="py-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-2.5 text-left w-10">#</th>
                  <th className="py-2.5 text-left">Item Description</th>
                  <th className="py-2.5 text-right w-24">Price</th>
                  <th className="py-2.5 text-center w-16">Qty</th>
                  <th className="py-2.5 text-right w-28">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items && order.items.length > 0 ? order.items.map((item: any, idx: number) => {
                  const price = item.variant?.price || item.product?.price || item.price || 0;
                  const qty = item.quantity || 1;
                  return (
                    <tr key={idx}>
                      <td className="py-3 text-slate-400 font-mono font-medium">{idx + 1}</td>
                      <td className="py-3 pr-4">
                        <p className="font-bold text-slate-900">{item.product?.title || item.title || order.productTitle}</p>
                        {item.variant?.name && (
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">{item.variant.name}</p>
                        )}
                      </td>
                      <td className="py-3 text-right font-mono text-slate-600">৳ {price.toFixed(2)}</td>
                      <td className="py-3 text-center font-mono font-bold text-slate-800">{qty}</td>
                      <td className="py-3 text-right font-mono font-bold text-slate-900">৳ {(price * qty).toFixed(2)}</td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td className="py-3 text-slate-400 font-mono font-medium">1</td>
                    <td className="py-3 pr-4">
                      <p className="font-bold text-slate-900">{order.productTitle || 'Product'}</p>
                    </td>
                    <td className="py-3 text-right font-mono text-slate-600">৳ {(order.price || 0).toFixed(2)}</td>
                    <td className="py-3 text-center font-mono font-bold text-slate-800">{order.quantity || 1}</td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900">৳ {((order.price || 0) * (order.quantity || 1)).toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end pt-3 border-t border-slate-200">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono font-bold text-slate-900">
                  ৳ {(order.totalPrice ? Math.max(0, order.totalPrice - (order.deliveryCharge || 0) + (order.couponDiscount || order.discountAmount || 0)) : ((order.price || 0) * (order.quantity || 1))).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charge</span>
                <span className="font-mono font-bold text-slate-900">
                  ৳ {(order.deliveryCharge || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total</span>
                <span className="font-mono text-base">
                  ৳ {(order.totalAmount || order.totalPrice || ((order.price || 0) * (order.quantity || 1) + (order.deliveryCharge || 0))).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 text-xs">
                <span>Paid</span>
                <span className="font-mono">৳ 0.00</span>
              </div>
              <div className="flex justify-between items-center text-xs font-black text-slate-900 pt-1.5 border-t border-slate-100">
                <span>Due Amount</span>
                <span className="font-mono text-sm text-[#0279c7]">
                  ৳ {(order.totalAmount || order.totalPrice || ((order.price || 0) * (order.quantity || 1) + (order.deliveryCharge || 0))).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer: Terms / Note and Signature */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-8 mt-6 border-t border-slate-200 text-xs">
            <div className="space-y-1 max-w-sm">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                Terms & Notes
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {order.notes || 'Thank you for your order with Leaf Curt! For inquiries, please contact our helpline.'}
              </p>
            </div>
            <div className="sm:text-right self-end">
              <div className="w-40 border-b border-slate-300 mb-1 ml-auto"></div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                Authorized Signature
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
