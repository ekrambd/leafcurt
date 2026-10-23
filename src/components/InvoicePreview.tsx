import React, { useRef, useState, useEffect } from 'react';
import { BookOrder } from '../types';
import { 
  Printer, MessageCircle, Copy, CheckCircle, Download, Camera, 
  Share2, Check, ExternalLink, QrCode as QrIcon 
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { 
  buildWhatsAppInvoiceUrl, 
  copyElementAsImage, 
  downloadCanvasAsPng, 
  loadHtml2Canvas 
} from '../lib/orderInvoiceUtils';
import QRCode from 'qrcode';

interface Props {
  order: BookOrder;
}

export function InvoicePreview({ order }: Props) {
  const { ecomSettings, instituteInfo } = useAppStore();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  
  const printRef = useRef<HTMLDivElement>(null);

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

  const storeName = ecomSettings?.storeName || instituteInfo?.name || 'LEAFCURT';
  const orderShortId = (order.id || '').replace(/^ORD-/, '');

  // Generate QR Code data URL for the invoice feedback
  useEffect(() => {
    const feedbackUrl = `${window.location.origin}/order/${orderShortId}/feedback`;
    QRCode.toDataURL(feedbackUrl, {
      width: 140,
      margin: 1,
      color: { dark: '#0a192f', light: '#ffffff' }
    }).then(setQrDataUrl).catch(() => {});
  }, [orderShortId]);

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
      <div className="p-4 sm:p-6 overflow-x-auto bg-slate-100/60 flex justify-center">
        
        {/* Printable/Capturable Invoice Slip */}
        <div 
          ref={printRef} 
          className="min-w-[720px] w-full max-w-4xl bg-white p-8 sm:p-10 border border-slate-300 rounded-2xl text-slate-900 font-sans shadow-md"
        >
          
          {/* Header row: Brand & Barcodes */}
          <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-slate-900">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-slate-900 rounded-xl flex items-center justify-center p-2 shrink-0 overflow-hidden shadow-xs">
                <img 
                  src={ecomSettings?.storeLogo || instituteInfo?.logo || '/uploads/file-1792735476267-28104613.webp'} 
                  alt="Logo" 
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => { e.currentTarget.src = '/uploads/file-1792735476267-28104613.webp'; }}
                />
              </div>

              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 font-serif">
                  {storeName}
                </h1>
                <p className="text-slate-500 text-xs font-semibold mt-0.5">Bangladesh</p>
                <p className="text-slate-500 text-xs font-mono font-medium">
                  {ecomSettings?.contactPhone || instituteInfo?.phone || '8801635311494'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              {/* Barcode Box */}
              <div className="border border-slate-300 rounded-xl p-3 text-center min-w-[170px] bg-slate-50/50">
                <p className="text-[10px] font-extrabold text-slate-500 tracking-widest uppercase mb-1.5">
                  Order Barcode
                </p>
                {/* SVG Barcode */}
                <div 
                  className="w-full h-9 bg-slate-900 rounded-xs opacity-90 flex justify-between px-1" 
                  style={{ background: 'repeating-linear-gradient(90deg, #0f172a 0px, #0f172a 2px, transparent 2px, transparent 4px, #0f172a 4px, #0f172a 7px, transparent 7px, transparent 9px)' }}
                />
                <div className="mt-2 text-[10px] font-bold text-slate-500 tracking-wider">ORDER ID</div>
                <div className="font-mono font-black text-lg flex justify-center items-center gap-2 mt-0.5 text-slate-900">
                  <span>{orderShortId}</span>
                  <button 
                    type="button"
                    onClick={() => handleCopy(orderShortId, 'id')} 
                    title="Copy Order ID"
                    className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer p-0.5"
                  >
                    {copiedField === 'id' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              {/* Tracking ID Box */}
              <div className="border border-slate-300 rounded-xl p-3 text-center min-w-[170px] bg-slate-50">
                <p className="text-[10px] font-extrabold text-slate-500 tracking-widest uppercase mb-1.5">Tracking ID</p>
                <div className="border border-dashed border-slate-300 rounded-lg py-2 mt-1 bg-white">
                  <p className="text-xs font-mono font-bold text-slate-600">
                    {order.pathaoConsignmentId ? `#${order.pathaoConsignmentId}` : (order.steadfastTrackingCode ? `#${order.steadfastTrackingCode}` : 'NOT ASSIGNED')}
                  </p>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 italic font-medium">
                  by {ecomSettings?.storeDomain || (typeof window !== 'undefined' ? window.location.host : 'leafcurt.com')}
                </p>
              </div>
            </div>
          </div>

          {/* Details Row: Bill To & Order Metadata */}
          <div className="flex justify-between mb-8 gap-8">
            
            {/* Bill To Card (Exact match for Image 1) */}
            <div className="w-1/2 bg-slate-50/70 border border-slate-200 rounded-xl p-4 relative group">
              <div className="flex items-center justify-between mb-3 border-b border-slate-200/80 pb-2">
                <span className="text-[11px] font-black text-slate-700 tracking-widest uppercase">
                  Bill To
                </span>
                <button
                  type="button"
                  onClick={handleCopyAllBillTo}
                  title="Copy all customer details"
                  className="text-[10px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer"
                >
                  {copiedField === 'all' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'all' ? 'Copied All' : 'Copy All'}</span>
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Customer Name */}
                <div className="flex items-center justify-between text-slate-900 font-extrabold text-sm">
                  <span>{order.customerName}</span>
                  <button 
                    type="button"
                    onClick={() => handleCopy(order.customerName, 'name')} 
                    title="Copy customer name"
                    className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer p-0.5"
                  >
                    {copiedField === 'name' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Customer Phone */}
                <div className="flex items-center justify-between text-slate-700 font-mono font-bold">
                  <span>{order.phone}</span>
                  <button 
                    type="button"
                    onClick={() => handleCopy(order.phone, 'phone')} 
                    title="Copy customer phone"
                    className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer p-0.5"
                  >
                    {copiedField === 'phone' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Customer Address */}
                <div className="flex items-start justify-between text-slate-600 gap-2">
                  <span className="leading-relaxed">
                    {order.address}
                    {order.thana ? `, ${order.thana}` : ''}
                    {order.district ? `, ${order.district}` : ''}
                  </span>
                  <button 
                    type="button"
                    onClick={() => handleCopy(`${order.address}${order.thana ? `, ${order.thana}` : ''}${order.district ? `, ${order.district}` : ''}`, 'address')} 
                    title="Copy delivery address"
                    className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer p-0.5 shrink-0 mt-0.5"
                  >
                    {copiedField === 'address' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Date, Time, Payment, Status */}
            <div className="w-1/2 pl-4">
              <table className="w-full text-xs">
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 text-slate-500 font-semibold">Date:</td>
                    <td className="py-2.5 text-right font-bold text-slate-900 font-mono">{dt.date}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-500 font-semibold">Time:</td>
                    <td className="py-2.5 text-right font-bold text-slate-900 font-mono">{dt.time}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-500 font-semibold">Method:</td>
                    <td className="py-2.5 text-right font-bold text-slate-900">
                      {order.paymentMethod === 'COD' || !order.paymentMethod ? 'Cash In Delivery' : order.paymentMethod}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-500 font-semibold">Status:</td>
                    <td className="py-2.5 text-right font-extrabold uppercase tracking-wider">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        order.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                        order.status === 'Shipped' ? 'bg-purple-100 text-purple-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Items Description Table */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-y-2 border-slate-900 text-[10px] uppercase tracking-widest text-slate-900 font-black">
                <th className="py-3 text-center font-bold w-12">SL</th>
                <th className="py-3 text-left font-bold">Item Description</th>
                <th className="py-3 text-right font-bold w-32">Price</th>
                <th className="py-3 text-center font-bold w-20">Qty</th>
                <th className="py-3 text-right font-bold w-32">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {order.items && order.items.length > 0 ? order.items.map((item: any, idx: number) => {
                const price = item.variant?.price || item.product?.price || item.price || 0;
                const qty = item.quantity || 1;
                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3.5 text-center font-mono font-bold text-slate-500">{idx + 1}</td>
                    <td className="py-3.5">
                      <p className="font-extrabold text-slate-900">{item.product?.title || item.title || order.productTitle}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{item.variant?.name || item.sku || 'default'}</p>
                    </td>
                    <td className="py-3.5 text-right font-mono text-slate-700">{price.toFixed(2)}</td>
                    <td className="py-3.5 text-center font-mono font-bold text-slate-800">{qty}</td>
                    <td className="py-3.5 text-right font-mono font-extrabold text-slate-900">{(price * qty).toFixed(2)}</td>
                  </tr>
                );
              }) : (
                <tr>
                  <td className="py-3.5 text-center font-mono font-bold text-slate-500">1</td>
                  <td className="py-3.5">
                    <p className="font-extrabold text-slate-900">{order.productTitle || 'Product'}</p>
                  </td>
                  <td className="py-3.5 text-right font-mono text-slate-700">{(order.price || 0).toFixed(2)}</td>
                  <td className="py-3.5 text-center font-mono font-bold text-slate-800">{order.quantity || 1}</td>
                  <td className="py-3.5 text-right font-mono font-extrabold text-slate-900">{((order.price || 0) * (order.quantity || 1)).toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals Section */}
          <div className="flex justify-end mb-8 border-t-2 border-slate-900 pt-4">
            <div className="w-80 space-y-1">
              <div className="flex justify-between py-1.5 text-xs">
                <span className="text-slate-600 font-medium">Subtotal</span>
                <span className="font-mono text-slate-900 font-bold">
                  ৳ {(order.totalPrice ? order.totalPrice - (order.deliveryCharge || 0) + (order.couponDiscount || order.discountAmount || 0) : ((order.price || 0) * (order.quantity || 1))).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 text-xs border-b border-slate-200 pb-2">
                <span className="text-slate-600 font-medium">Shipping</span>
                <span className="font-mono text-slate-900 font-bold">
                  ৳ {(order.deliveryCharge || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-3 items-center">
                <span className="font-black text-lg text-slate-900 uppercase">Grand Total</span>
                <span className="font-mono font-black text-xl text-slate-900">
                  ৳ {(order.totalAmount || order.totalPrice || ((order.price || 0) * (order.quantity || 1) + (order.deliveryCharge || 0))).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 text-xs">
                <span className="text-slate-600 font-medium">Paid</span>
                <span className="font-mono text-slate-900 font-bold">৳ 0.00</span>
              </div>
              <div className="flex justify-between py-2.5 mt-1 bg-slate-100 px-3.5 rounded-lg font-bold text-xs">
                <span className="text-slate-900 font-extrabold uppercase">Due Amount</span>
                <span className="font-mono text-slate-900 font-black text-sm">
                  ৳ {(order.totalAmount || order.totalPrice || ((order.price || 0) * (order.quantity || 1) + (order.deliveryCharge || 0))).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Experience Feedback QR Code Box (Exact match for Image 1) */}
          <div className="border border-slate-900 rounded-xl p-4 flex items-center gap-5 my-8 bg-white shadow-2xs">
            <div className="w-20 h-20 bg-white border border-slate-300 rounded-lg p-1 shrink-0 flex items-center justify-center overflow-hidden">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Experience QR" className="w-full h-full object-contain" />
              ) : (
                <QrIcon className="w-12 h-12 text-slate-800" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">আপনার অভিজ্ঞতা কেমন?</h4>
              <p className="text-xs text-slate-700 mt-0.5 font-medium">
                QR স্ক্যান করে অর্ডার ও পণ্য সম্পর্কে মতামত দিন।
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                আপনার মতামত অন্য ক্রেতাকে সঠিক পণ্য বেছে নিতে সাহায্য করবে।
              </p>
              <p className="text-[10px] text-slate-400 mt-1 font-mono tracking-tight">
                Scan to share quick, order-linked feedback.
              </p>
            </div>
          </div>

          {/* Terms & Note and Authorized Signature */}
          <div className="flex justify-between mt-10 pt-4">
            <div>
              <p className="text-[10px] font-black text-slate-500 tracking-widest uppercase mb-1">
                Terms & Note
              </p>
              <p className="text-xs text-slate-600 font-medium">{order.notes || '-'}</p>
            </div>
            <div className="text-right">
              <div className="w-48 border-b-2 border-slate-900 mb-1.5 ml-auto"></div>
              <p className="text-[10px] font-black text-slate-500 tracking-widest uppercase">
                Authorized Signature
              </p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
