import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Package, 
  Flame, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { Product, EcomSettings, FlashSaleSettings } from '../types';
import { dbService } from '../lib/dbService';
import { DEFAULT_FLASH_SALE_SETTINGS } from '../lib/constants';

interface FlashSaleManagerProps {
  products: Product[];
  onSettingsUpdated?: () => void;
}

export default function FlashSaleManager({ products, onSettingsUpdated }: FlashSaleManagerProps) {
  const [ecomSettings, setEcomSettings] = useState<EcomSettings | null>(null);
  const [flashSale, setFlashSale] = useState<FlashSaleSettings>(DEFAULT_FLASH_SALE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Live Countdown Demo State for Preview
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Load Settings from DB
  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const settings = await dbService.getEcomSettings();
        setEcomSettings(settings);
        if (settings.flashSale) {
          setFlashSale({
            ...DEFAULT_FLASH_SALE_SETTINGS,
            ...settings.flashSale
          });
        }
      } catch (err) {
        console.error('Failed to load flash sale settings:', err);
        setErrorMsg('Failed to load settings from database.');
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  // Update Countdown Timer
  useEffect(() => {
    const calculateTime = () => {
      if (!flashSale.endDate) return;
      const difference = +new Date(flashSale.endDate) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [flashSale.endDate]);

  // Selected Target Product Details
  const selectedProduct = useMemo(() => {
    if (!flashSale.productId) return products[0] || null;
    return products.find(p => p.id === flashSale.productId) || products[0] || null;
  }, [products, flashSale.productId]);

  // Calculate discount percentage
  const discountPercent = useMemo(() => {
    const orig = flashSale.originalPrice || selectedProduct?.regularPrice || selectedProduct?.price || 0;
    const flash = flashSale.flashPrice || selectedProduct?.price || 0;
    if (orig > flash && orig > 0) {
      return Math.round(((orig - flash) / orig) * 100);
    }
    return 0;
  }, [flashSale.originalPrice, flashSale.flashPrice, selectedProduct]);

  // Handle Product Selection change
  const handleSelectProduct = (pid: string) => {
    const prod = products.find(p => p.id === pid);
    if (!prod) return;
    setFlashSale(prev => ({
      ...prev,
      productId: pid,
      flashPrice: prod.price,
      originalPrice: prod.regularPrice || prod.price
    }));
  };

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg('');
      const current = await dbService.getEcomSettings();
      const targetId = flashSale.productId || (selectedProduct?.id || '');
      const prod = products.find(p => p.id === targetId) || selectedProduct;

      const updated: EcomSettings = {
        ...current,
        flashSale: {
          enabled: flashSale.enabled,
          productId: targetId,
          flashPrice: flashSale.flashPrice || prod?.price || 0,
          originalPrice: flashSale.originalPrice || prod?.regularPrice || prod?.price || 0,
          endDate: flashSale.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      };

      await dbService.saveEcomSettings(updated);
      setEcomSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
      onSettingsUpdated?.();
    } catch (err: any) {
      console.error('Failed to save flash sale settings:', err);
      setErrorMsg(err.message || 'Error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-medium text-slate-500">Loading flash sale settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans max-w-4xl pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0 ring-4 ring-orange-500/5">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Flash Sale Product Management
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 uppercase tracking-wider">
                1 Target Product
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any product for the home page flash sale spotlight. All titles, descriptions, and images are displayed dynamically from the selected product.
            </p>
          </div>
        </div>

        {/* Enable / Disable Switch */}
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-700">
            {flashSale.enabled ? 'Active' : 'Disabled'}
          </span>
          <button
            type="button"
            onClick={() => setFlashSale(prev => ({ ...prev, enabled: !prev.enabled }))}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
              flashSale.enabled ? 'bg-orange-500' : 'bg-slate-300'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                flashSale.enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Flash sale settings saved! Live storefront is now updated dynamically.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-xs font-semibold animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Configuration Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Card 1: Select Target Product & Dynamic Preview */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-500" />
              <h2 className="text-sm font-bold text-slate-900">Select Target Product</h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              Dynamic Product Info
            </span>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              Select Product:
            </label>
            <select
              value={flashSale.productId || selectedProduct?.id || ''}
              onChange={(e) => handleSelectProduct(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all cursor-pointer"
            >
              {products.length === 0 ? (
                <option value="">No products found</option>
              ) : (
                products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} (Regular: Tk.{(p.regularPrice || p.price).toLocaleString()} | Sale: Tk.{p.price.toLocaleString()})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Dynamic Selected Product Preview Box */}
          {selectedProduct && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-white border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center p-1 shadow-2xs">
                <img
                  src={selectedProduct.coverImage || selectedProduct.images?.[0]}
                  alt={selectedProduct.title}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/favicon/favicon-96x96.png';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0 space-y-1.5 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                    {selectedProduct.category || 'Skincare'}
                  </span>
                  {selectedProduct.series && (
                    <span className="text-[10px] font-semibold text-slate-500">
                      {selectedProduct.series}
                    </span>
                  )}
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    In Stock ({selectedProduct.stockQuantity || selectedProduct.stock || 100})
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {selectedProduct.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {selectedProduct.description ? selectedProduct.description.split('\n')[0].replace(/^Product Description\s*[:：]?\s*/i, '').trim() : 'Active formula for deep hydration & radiance.'}
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-3 pt-1 text-xs">
                  <span className="font-bold text-emerald-600">Base Price: Tk.{selectedProduct.price?.toLocaleString()}</span>
                  {selectedProduct.regularPrice && selectedProduct.regularPrice > selectedProduct.price && (
                    <span className="text-slate-400 line-through">Regular: Tk.{selectedProduct.regularPrice?.toLocaleString()}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Price & Countdown Timer */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Clock className="w-5 h-5 text-orange-500" />
            <h2 className="text-sm font-bold text-slate-900">Flash Sale Pricing & Countdown Timer</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Flash Sale Offer Price (Tk.) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400 text-xs font-bold">Tk.</span>
                <input
                  type="number"
                  min="0"
                  required
                  value={flashSale.flashPrice || 0}
                  onChange={(e) => setFlashSale(prev => ({ ...prev, flashPrice: Number(e.target.value) }))}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-bold focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Regular / Strike-through Price (Tk.)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400 text-xs font-bold">Tk.</span>
                <input
                  type="number"
                  min="0"
                  value={flashSale.originalPrice || 0}
                  onChange={(e) => setFlashSale(prev => ({ ...prev, originalPrice: Number(e.target.value) }))}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-mono focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {discountPercent > 0 && (
            <div className="p-3 bg-orange-50 border border-orange-200/80 rounded-xl flex items-center justify-between text-xs font-bold text-orange-900">
              <span>Customer Savings Discount:</span>
              <span className="bg-orange-500 text-white px-2.5 py-0.5 rounded-full text-[11px] font-black">
                {discountPercent}% OFF
              </span>
            </div>
          )}

          {/* Countdown End Date & Time */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-orange-500" />
              Flash Sale Expiry Date & Time (Countdown Ends):
            </label>
            <input
              type="datetime-local"
              value={flashSale.endDate ? flashSale.endDate.slice(0, 16) : ''}
              onChange={(e) => setFlashSale(prev => ({ ...prev, endDate: new Date(e.target.value).toISOString() }))}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-mono focus:border-orange-500 focus:outline-none cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              The live countdown on the home page will run continuously until this date and time.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-bold text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Save Flash Sale Settings</span>
            </>
          )}
        </button>

      </form>

    </div>
  );
}
