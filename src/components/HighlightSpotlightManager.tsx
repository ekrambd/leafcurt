import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Save, 
  Package, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Wand2,
  RefreshCw,
  Type
} from 'lucide-react';
import { Product, EcomSettings, HighlightSpotlightSettings } from '../types';
import { dbService } from '../lib/dbService';
import { DEFAULT_HIGHLIGHT_SPOTLIGHT_SETTINGS } from '../lib/constants';

interface HighlightSpotlightManagerProps {
  products: Product[];
  onSettingsUpdated?: () => void;
}

export default function HighlightSpotlightManager({ products, onSettingsUpdated }: HighlightSpotlightManagerProps) {
  const [ecomSettings, setEcomSettings] = useState<EcomSettings | null>(null);
  const [highlight, setHighlight] = useState<HighlightSpotlightSettings>(DEFAULT_HIGHLIGHT_SPOTLIGHT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiSuccess, setAiSuccess] = useState(false);

  // Extract unique categories from products
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    if (ecomSettings?.categories) {
      ecomSettings.categories.forEach(c => set.add(c));
    }
    return Array.from(set);
  }, [products, ecomSettings]);

  // Load Settings from DB
  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const settings = await dbService.getEcomSettings();
        setEcomSettings(settings);
        if (settings.highlightSpotlight) {
          setHighlight({
            ...DEFAULT_HIGHLIGHT_SPOTLIGHT_SETTINGS,
            ...settings.highlightSpotlight
          });
        }
      } catch (err) {
        console.error('Failed to load highlight spotlight settings:', err);
        setErrorMsg('Failed to load settings from database.');
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  // Selected Target Product Details
  const selectedProduct = useMemo(() => {
    if (!highlight.productId) return products[0] || null;
    return products.find(p => p.id === highlight.productId) || products[0] || null;
  }, [products, highlight.productId]);

  // Products in currently selected category
  const productsInCategory = useMemo(() => {
    const cat = highlight.categoryName || categoryOptions[0] || '';
    return products.filter(p => p.category?.toLowerCase() === cat.toLowerCase());
  }, [products, highlight.categoryName, categoryOptions]);

  // Auto-fill from Product
  const handleAutoFillFromProduct = () => {
    if (!selectedProduct) return;
    const cleanDesc = selectedProduct.description 
      ? selectedProduct.description.split('\n')[0].replace(/^Product Description\s*[:：]?\s*/i, '').trim()
      : '';
    setHighlight(prev => ({
      ...prev,
      title: selectedProduct.title,
      subtitle: cleanDesc || selectedProduct.benefitsHighlights || '',
      badgeTag: selectedProduct.series ? `${selectedProduct.series.toUpperCase()} • SPOTLIGHT` : (selectedProduct.category ? `${selectedProduct.category.toUpperCase()} • SPOTLIGHT` : 'FEATURED SPOTLIGHT'),
      buttonText: 'BUY NOW'
    }));
  };

  // Auto-fill from Category
  const handleAutoFillFromCategory = (catName: string) => {
    const prodsInCat = products.filter(p => p.category?.toLowerCase() === catName.toLowerCase());
    setHighlight(prev => ({
      ...prev,
      categoryName: catName,
      badgeTag: `${catName.toUpperCase()} • COLLECTION`,
      title: `Discover Our Premium ${catName} Series`,
      subtitle: `Explore clinical-grade Korean formulations designed specifically for our ${catName} collection (${prodsInCat.length} products available).`,
      buttonText: 'VIEW COLLECTION'
    }));
  };

  // AI Gemini Copy Generator
  const handleGenerateWithAi = async () => {
    try {
      setGeneratingAi(true);
      setErrorMsg('');
      setAiSuccess(false);

      const payload = highlight.targetType === 'product'
        ? {
            product: {
              title: selectedProduct?.title || '',
              category: selectedProduct?.category || '',
              series: selectedProduct?.series || '',
              description: selectedProduct?.description || '',
              benefitsHighlights: selectedProduct?.benefitsHighlights || '',
              price: selectedProduct?.price
            }
          }
        : {
            categoryName: highlight.categoryName || categoryOptions[0] || 'Skincare'
          };

      const response = await fetch('/api/ai/generate-spotlight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('AI copy generation request failed.');
      }

      const resData = await response.json();
      if (resData.success && resData.data) {
        setHighlight(prev => ({
          ...prev,
          title: resData.data.title || prev.title,
          subtitle: resData.data.subtitle || prev.subtitle,
          badgeTag: resData.data.badgeTag || prev.badgeTag,
          buttonText: resData.data.buttonText || prev.buttonText
        }));
        setAiSuccess(true);
        setTimeout(() => setAiSuccess(false), 3000);
      }
    } catch (err: any) {
      console.error('Failed to generate AI copy:', err);
      // Fallback: auto-fill from product details
      if (highlight.targetType === 'product') {
        handleAutoFillFromProduct();
      } else {
        handleAutoFillFromCategory(highlight.categoryName || categoryOptions[0] || 'Skincare');
      }
    } finally {
      setGeneratingAi(false);
    }
  };

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg('');
      const current = await dbService.getEcomSettings();
      const updated: EcomSettings = {
        ...current,
        highlightSpotlight: {
          ...highlight,
          productId: highlight.targetType === 'product' ? (highlight.productId || selectedProduct?.id || '') : '',
          categoryName: highlight.targetType === 'category' ? (highlight.categoryName || categoryOptions[0] || '') : ''
        }
      };

      await dbService.saveEcomSettings(updated);
      setEcomSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
      onSettingsUpdated?.();
    } catch (err: any) {
      console.error('Failed to save highlight spotlight settings:', err);
      setErrorMsg(err.message || 'Error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-medium text-slate-500">Loading Highlight Spotlight settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans max-w-4xl pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0 ring-4 ring-teal-500/5">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Highlight Spotlight (Featured Product / Category)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Feature a specific product or entire category on the home page. Presentation and details are pulled dynamically from the product, with AI Gemini copy enhancement.
            </p>
          </div>
        </div>

        {/* Enable / Disable Switch */}
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-700">
            {highlight.enabled ? 'Active' : 'Disabled'}
          </span>
          <button
            type="button"
            onClick={() => setHighlight(prev => ({ ...prev, enabled: !prev.enabled }))}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
              highlight.enabled ? 'bg-teal-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                highlight.enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Highlight Spotlight settings successfully saved and updated on store page!</span>
        </div>
      )}

      {aiSuccess && (
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-3 text-teal-800 text-xs font-semibold animate-fadeIn">
          <Sparkles className="w-5 h-5 text-teal-600 shrink-0" />
          <span>✨ Gemini AI has successfully generated luxury copy for this spotlight!</span>
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
        
        {/* Card 1: Select Target Type (Product or Category) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              Focus Target Selection
            </h2>
          </div>

          {/* Toggle Product vs Category */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setHighlight(prev => ({ ...prev, targetType: 'product' }));
              }}
              className={`py-3.5 px-4 rounded-xl border flex items-center justify-center gap-2.5 font-bold text-xs cursor-pointer transition-all ${
                highlight.targetType === 'product'
                  ? 'bg-teal-50 border-teal-500 text-teal-900 ring-2 ring-teal-500/20 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Highlight Product</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setHighlight(prev => ({ ...prev, targetType: 'category' }));
              }}
              className={`py-3.5 px-4 rounded-xl border flex items-center justify-center gap-2.5 font-bold text-xs cursor-pointer transition-all ${
                highlight.targetType === 'category'
                  ? 'bg-teal-50 border-teal-500 text-teal-900 ring-2 ring-teal-500/20 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Highlight Category</span>
            </button>
          </div>

          {/* If Product Mode */}
          {highlight.targetType === 'product' && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Select Product:
                </label>
                <select
                  value={highlight.productId || selectedProduct?.id || ''}
                  onChange={(e) => {
                    const pid = e.target.value;
                    const prod = products.find(p => p.id === pid);
                    const cleanDesc = prod?.description 
                      ? prod.description.split('\n')[0].replace(/^Product Description\s*[:：]?\s*/i, '').trim()
                      : '';
                    setHighlight(prev => ({
                      ...prev,
                      productId: pid,
                      title: prod?.title || prev.title,
                      subtitle: cleanDesc || prod?.benefitsHighlights || prev.subtitle,
                      badgeTag: prod?.series ? `${prod.series.toUpperCase()} • SPOTLIGHT` : (prod?.category ? `${prod.category.toUpperCase()} • SPOTLIGHT` : prev.badgeTag)
                    }));
                  }}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-semibold focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all cursor-pointer"
                >
                  {products.length === 0 ? (
                    <option value="">No products found</option>
                  ) : (
                    products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} (Price: Tk.{p.price.toLocaleString()})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Dynamic Product Preview Card */}
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
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-100 text-teal-800">
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
                      {selectedProduct.description ? selectedProduct.description.split('\n')[0].replace(/^Product Description\s*[:：]?\s*/i, '').trim() : 'Advanced Korean formulation.'}
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-3 pt-1 text-xs">
                      <span className="font-bold text-teal-700">Price: Tk.{selectedProduct.price?.toLocaleString()}</span>
                      {selectedProduct.regularPrice && selectedProduct.regularPrice > selectedProduct.price && (
                        <span className="text-slate-400 line-through">Regular: Tk.{selectedProduct.regularPrice?.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* If Category Mode */}
          {highlight.targetType === 'category' && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Select Category:
                </label>
                <select
                  value={highlight.categoryName || categoryOptions[0] || ''}
                  onChange={(e) => {
                    const cat = e.target.value;
                    handleAutoFillFromCategory(cat);
                  }}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-semibold focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all cursor-pointer"
                >
                  {categoryOptions.length === 0 ? (
                    <option value="">No categories found</option>
                  ) : (
                    categoryOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Dynamic Category Preview */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    Products in "{highlight.categoryName || categoryOptions[0] || 'Selected'}":
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                    {productsInCategory.length} Products
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {productsInCategory.map(p => (
                    <span key={p.id} className="text-[11px] bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium">
                      {p.title}
                    </span>
                  ))}
                  {productsInCategory.length === 0 && (
                    <span className="text-xs text-slate-400 italic">No products assigned to this category yet.</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Presentation & AI Copy Assistant */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Type className="w-5 h-5 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">Presentation & Spotlight Copy</h2>
            </div>

            {/* AI Generator & Auto-Fill Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateWithAi}
                disabled={generatingAi}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm shadow-teal-600/20 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
              >
                {generatingAi ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Gemini Generating...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>✨ Enhance with Gemini AI</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={highlight.targetType === 'product' ? handleAutoFillFromProduct : () => handleAutoFillFromCategory(highlight.categoryName || categoryOptions[0] || 'Skincare')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                title="Reset copy directly from item data"
              >
                Reset to Default
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Header Badge Tag:
              </label>
              <input
                type="text"
                value={highlight.badgeTag || ''}
                onChange={(e) => setHighlight(prev => ({ ...prev, badgeTag: e.target.value }))}
                placeholder="e.g. ULTRA REPAIR • SPOTLIGHT"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-semibold focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Spotlight Section Title:
              </label>
              <input
                type="text"
                value={highlight.title || ''}
                onChange={(e) => setHighlight(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. VB5 Intensive Calming Repair Serum"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-bold focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Spotlight Description / Subtitle:
              </label>
              <textarea
                rows={3}
                value={highlight.subtitle || ''}
                onChange={(e) => setHighlight(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="e.g. Relieves skin irritation, reinforces damaged barrier, and restores natural glass-skin glow."
                className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:border-teal-500 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Call to Action Button Label:
              </label>
              <input
                type="text"
                value={highlight.buttonText || 'BUY NOW'}
                onChange={(e) => setHighlight(prev => ({ ...prev, buttonText: e.target.value }))}
                placeholder="BUY NOW / EXPLORE NOW"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:border-teal-500 focus:outline-none uppercase tracking-wider"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-bold text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-teal-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Save Highlight Spotlight Settings</span>
            </>
          )}
        </button>

      </form>

    </div>
  );
}
