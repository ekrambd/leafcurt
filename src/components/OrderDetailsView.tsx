import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, CheckCircle, Package, RefreshCw, ShoppingBag, Truck, Calendar, 
  MapPin, AlertCircle, Edit3, FileText, FileSpreadsheet, MessageCircle, Camera, 
  Copy, Phone, Check, Download, ZoomIn, X 
} from 'lucide-react';
import { BookOrder } from '../types';
import { InvoicePreview } from './InvoicePreview';
import { motion } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { 
  buildWhatsAppInvoiceUrl, 
  copyElementAsImage, 
  downloadCanvasAsPng, 
  loadHtml2Canvas,
  isOrderPaid 
} from '../lib/orderInvoiceUtils';

interface Props {
  order: BookOrder;
  onClose: () => void;
  onUpdateStatus: (orderId: string, newStatus: string) => Promise<void>;
  onEditOrder: (order: BookOrder) => void;
}

const ORDER_STATUSES = [
  'Pending',
  'Confirmed',
  'Packaging',
  'Ready for Shipment',
  'Shipped',
  'Delivered',
  'Return',
  'Cancelled'
];

export function OrderDetailsView({ order, onClose, onUpdateStatus, onEditOrder }: Props) {
  const { ecomSettings, instituteInfo } = useAppStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const hiddenInvoiceRef = useRef<HTMLDivElement>(null);

  const storeName = ecomSettings?.storeName || instituteInfo?.name || 'LEAFCURT';
  const orderShortId = (order.id || '').replace(/^ORD-/, '');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    showToast(`Copied ${field} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyAllInfo = () => {
    const total = order.totalAmount || order.totalPrice || ((order.price || 0) * (order.quantity || 1) + (order.deliveryCharge || 0));
    const fullText = `Order ID: #${orderShortId}\nCustomer: ${order.customerName}\nPhone: ${order.phone}\nAddress: ${order.address}${order.thana ? `, ${order.thana}` : ''}${order.district ? `, ${order.district}` : ''}\nTotal: ৳ ${total.toFixed(2)}`;
    handleCopy(fullText, 'all');
  };

  const handleWhatsApp = () => {
    const url = buildWhatsAppInvoiceUrl(order, storeName, ecomSettings?.storeDomain);
    window.open(url, '_blank');
  };

  // Copy invoice slip as image even from details view
  const handleCopyInvoiceAsImage = async () => {
    // If invoice preview is visible, copy from it, else switch to invoice and copy
    if (!showInvoice) {
      setShowInvoice(true);
      setTimeout(async () => {
        const el = document.querySelector('[data-invoice-slip]') as HTMLElement;
        if (el) {
          setIsCapturing(true);
          showToast('Rendering high-res invoice image...');
          const res = await copyElementAsImage(el, `invoice-${orderShortId}.png`);
          setIsCapturing(false);
          showToast(res.message);
        }
      }, 300);
      return;
    }

    const el = document.querySelector('[data-invoice-slip]') as HTMLElement;
    if (el) {
      setIsCapturing(true);
      showToast('Rendering high-res invoice image...');
      const res = await copyElementAsImage(el, `invoice-${orderShortId}.png`);
      setIsCapturing(false);
      showToast(res.message);
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsUpdating(true);
    await onUpdateStatus(order.id, e.target.value);
    setIsUpdating(false);
  };

  const getStepProgress = () => {
    const s = order.status;
    if (['Cancelled', 'Return', 'Hold', 'Not Responding', 'Under Review'].includes(s)) return 0;
    if (s === 'Pending') return 1;
    if (s === 'Confirmed') return 2;
    if (s === 'Packaging' || s === 'Ready for Shipment') return 3;
    if (s === 'Shipped') return 4;
    if (s === 'Delivered') return 5;
    return 1;
  };

  const currentStep = getStepProgress();

  const steps = [
    { label: 'Confirm Order', icon: ShoppingBag, step: 2 },
    { label: 'Processing Order', icon: RefreshCw, step: 3 },
    { label: 'Product Dispatched', icon: Package, step: 4 },
    { label: 'On Delivery', icon: Truck, step: 4 },
    { label: 'Delivery Completed', icon: CheckCircle, step: 5 },
  ];

  const formatDate = (d: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d));
    } catch {
      return d;
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50 font-sans p-4 sm:p-6 lg:p-8 animate-fadeIn">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="mb-4 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center justify-between border border-slate-800 animate-in fade-in slide-in-from-top-1 duration-200">
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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white px-5 py-4 rounded-2xl shadow-xs border border-slate-200 mb-6 gap-4">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={onClose}
            title="Back to order list"
            className="p-2 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-slate-900">Order Details</h2>
              <span className="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                #{orderShortId}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Copy Invoice as Image */}
          <button
            type="button"
            onClick={handleCopyInvoiceAsImage}
            disabled={isCapturing}
            title="Copy invoice slip as Image to clipboard"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isCapturing ? 'Capturing...' : 'Copy as Image'}</span>
          </button>

          {/* WhatsApp Invoice Auto-Send */}
          <button
            type="button"
            onClick={handleWhatsApp}
            title="Send automated invoice & confirmation to customer WhatsApp"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp Invoice</span>
          </button>

          {/* Toggle Invoice View */}
          <button
            type="button"
            onClick={() => setShowInvoice(!showInvoice)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{showInvoice ? 'View Details' : 'View Invoice'}</span>
          </button>

          {/* Edit Order */}
          <button
            type="button"
            onClick={() => onEditOrder(order)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-bold border border-amber-200 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
        </div>
      </div>

      {showInvoice ? (
        <div data-invoice-slip>
          <InvoicePreview order={order} />
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Status Tracker Card */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-8">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500 font-semibold">Order Status :</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded-md">
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500 font-semibold">Payment Status :</span>
                  <span className={`px-3 py-1 font-bold rounded-md ${
                    isOrderPaid(order)
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {isOrderPaid(order) ? 'Paid' : `Unpaid (${order.paymentMethod || 'Cash On Delivery'})`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select 
                  value={order.status}
                  onChange={handleStatusChange}
                  disabled={isUpdating}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                >
                  {ORDER_STATUSES.map(s => (
                    <option key={s} value={s}>{s} Order</option>
                  ))}
                </select>
                <button 
                  disabled={isUpdating}
                  className="px-4 py-2 bg-[#52c41a] hover:bg-[#49b017] text-white font-bold text-sm rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Change Status'}
                </button>
              </div>
            </div>

            {/* Stepper */}
            <div className="relative flex justify-between items-start px-2 sm:px-10">
              <div className="absolute top-6 left-12 right-12 h-1 bg-slate-200 rounded-full z-0"></div>
              <div 
                className="absolute top-6 left-12 h-1 bg-[#52c41a] rounded-full z-0 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, (currentStep - 2) * 25))}%` }}
              ></div>

              {steps.map((step, idx) => {
                const isActive = currentStep >= step.step;
                const Icon = step.icon;
                return (
                  <div key={idx} className="relative z-10 flex flex-col items-center w-24">
                    <div className={`w-12 h-12 flex items-center justify-center rounded-2xl shadow-sm transition-colors mb-3 ${
                      isActive ? 'bg-[#52c41a] text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-xs font-bold text-center ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 text-center">
                      {isActive ? formatDate(order.createdAt) : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Products List */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-black text-slate-500 uppercase">
                  <th className="pb-4 font-semibold">Product</th>
                  <th className="pb-4 font-semibold text-center">Unit Price</th>
                  <th className="pb-4 font-semibold text-center">Quantity</th>
                  <th className="pb-4 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item: any, idx: number) => {
                    const itemTitle = item.product?.title || item.title || order.productTitle || 'Product';
                    const itemImg = item.variant?.image || item.product?.image || item.image || item.productImage;
                    const itemQty = item.quantity || 1;
                    const itemUnitPrice = item.variant?.price || item.product?.price || item.price || order.price || 0;
                    
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className={`w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 relative group ${itemImg ? 'cursor-pointer hover:ring-2 hover:ring-teal-500' : ''}`}
                              onClick={() => itemImg && setPreviewImage(itemImg)}
                              title={itemImg ? "Click to view full image" : undefined}
                            >
                              {itemImg ? (
                                <>
                                  <img src={itemImg} alt={itemTitle} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <ZoomIn className="w-4 h-4 text-white" />
                                  </div>
                                </>
                              ) : (
                                <Package className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-slate-800 line-clamp-2">{itemTitle}</p>
                              {item.variant?.name && (
                                <span className="text-xs text-slate-500">{item.variant.name}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-center font-mono text-sm text-slate-600">৳ {itemUnitPrice}</td>
                        <td className="py-4 text-center font-mono text-sm text-slate-600">{itemQty}</td>
                        <td className="py-4 text-right font-mono font-bold text-slate-800">৳ {itemUnitPrice * itemQty}</td>
                      </tr>
                    );
                  })
                ) : (
                  (() => {
                    const fallbackQty = order.quantity || 1;
                    const fallbackPrice = order.price ?? (order.totalPrice ? Math.max(0, (order.totalPrice - (order.deliveryCharge || 0)) / fallbackQty) : 0);
                    return (
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Package className="w-5 h-5 text-slate-400" />
                            </div>
                            <p className="font-bold text-sm text-slate-800 line-clamp-2">{order.productTitle || 'Product'}</p>
                          </div>
                        </td>
                        <td className="py-4 text-center font-mono text-sm text-slate-600">৳ {fallbackPrice}</td>
                        <td className="py-4 text-center font-mono text-sm text-slate-600">{fallbackQty}</td>
                        <td className="py-4 text-right font-mono font-bold text-slate-800">৳ {fallbackPrice * fallbackQty}</td>
                      </tr>
                    );
                  })()
                )}
              </tbody>
            </table>

            {/* Cart Totals */}
            {(() => {
              // Strictly compute items subtotal to avoid double delivery counting
              const calculatedItemsSubtotal = order.items && order.items.length > 0
                ? (order.items as any[]).reduce((sum: number, it: any) => sum + ((it.variant?.price || it.product?.price || it.price || 0) * (it.quantity || 1)), 0)
                : 0;

              const deliveryCharge = order.deliveryCharge || 0;
              const discount = Number(order.couponDiscount || order.discountAmount || 0);

              let subtotal = 0;
              if (calculatedItemsSubtotal > 0) {
                subtotal = calculatedItemsSubtotal;
              } else if (order.subtotal !== undefined && order.subtotal !== null && order.subtotal > 0) {
                subtotal = order.subtotal;
              } else if (order.totalPrice && order.totalPrice > deliveryCharge) {
                // If totalPrice is present, subtotal is totalPrice - deliveryCharge
                subtotal = order.totalPrice - deliveryCharge + discount;
              } else {
                subtotal = (order.price || 0) * (order.quantity || 1);
              }

              const totalPrice = subtotal + deliveryCharge - discount;

              return (
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <div className="grid grid-cols-2 bg-slate-50 p-4 rounded-xl mb-2">
                    <span className="font-bold text-slate-800 text-sm">Cart Totals</span>
                    <span className="font-bold text-slate-800 text-sm text-right">Price</span>
                  </div>
                  <div className="px-4 space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 font-medium">Sub Total</span>
                      <span className="font-mono text-slate-800 font-bold">
                        ৳ {subtotal}
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-rose-500 font-medium">Discount</span>
                        <span className="font-mono text-rose-600 font-bold">- ৳ {discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm pb-4 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Shipping</span>
                      <span className="font-mono text-slate-800 font-bold">
                        {deliveryCharge ? `৳ ${deliveryCharge}` : 'Free'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-bold text-slate-900">Total price</span>
                      <span className="font-mono font-black text-orange-500 text-lg">
                        ৳ {totalPrice}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          
          {/* Summary */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-slate-400" />
              Summary
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Order ID</span>
                <span className="font-bold text-slate-900 font-mono">#{order.id.replace('ORD-', '')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date</span>
                <span className="font-bold text-slate-900">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total</span>
                <span className="font-bold font-mono text-orange-500">
                  ৳ {order.totalAmount || order.totalPrice || ((order.price || 0) * (order.quantity || 1) + (order.deliveryCharge || 0))}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Address & Customer Actions (matching Image 1 & 2) */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-teal-600" />
                Customer & Shipping
              </h3>
              <button
                type="button"
                onClick={handleCopyAllInfo}
                title="Copy all customer info"
                className="text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedField === 'all' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'all' ? 'Copied All' : 'Copy All'}</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Customer Name */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Recipient</span>
                  <p className="font-extrabold text-slate-900 text-sm mt-0.5">{order.customerName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(order.customerName, 'Customer Name')}
                  className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title="Copy Name"
                >
                  {copiedField === 'Customer Name' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Phone */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Phone</span>
                  <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">{order.phone}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(order.phone, 'Phone Number')}
                  className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title="Copy Phone"
                >
                  {copiedField === 'Phone Number' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Address */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Delivery Address</span>
                  <p className="text-slate-700 leading-relaxed mt-0.5">
                    {order.address}
                    {order.thana ? `, ${order.thana}` : ''}
                    {order.district ? `, ${order.district}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(`${order.address}${order.thana ? `, ${order.thana}` : ''}${order.district ? `, ${order.district}` : ''}`, 'Address')}
                  className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0 mt-2"
                  title="Copy Address"
                >
                  {copiedField === 'Address' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Contact Buttons */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                onClick={handleWhatsApp}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
              <a
                href={`tel:${order.phone}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-slate-600" />
                <span>Call</span>
              </a>
            </div>
          </div>

          {/* Additional Info / Note */}
          {order.notes && (
            <div className="bg-amber-50 rounded-xl shadow-xs border border-amber-200 p-6">
              <h3 className="font-bold text-amber-900 flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Customer Note
              </h3>
              <p className="text-sm text-amber-800">{order.notes}</p>
            </div>
          )}

        </div>
            </div>
      )}

      {/* Product Image Full View Lightbox Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl p-2 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={previewImage} 
              alt="Product Full Preview" 
              className="w-auto h-auto max-w-full max-h-[85vh] object-contain rounded-xl mx-auto" 
            />
          </div>
        </div>
      )}
    </div>
  );
}
