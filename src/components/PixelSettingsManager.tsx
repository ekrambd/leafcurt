import React, { useState, useEffect } from 'react';
import { EcomSettings } from '../types';
import { dbService } from '../lib/dbService';
import { CircularProgress } from './LoadingSkeleton';
import { Check, Code, Save, Eye, ShieldCheck, RefreshCw } from 'lucide-react';

export default function PixelSettingsManager() {
  const [settings, setSettings] = useState<EcomSettings>({
    gtmId: '',
    deliveryChargeInsideDhaka: 60,
    deliveryChargeOutsideDhaka: 120,
    bkashNumber: '',
    nagadNumber: ''
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await dbService.getEcomSettings();
        setSettings(data);
      } catch (err) {
        console.error('Failed to load pixel settings:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await dbService.saveEcomSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('There was a problem saving pixel settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <CircularProgress label="Loading GTM Settings..." size="md" />
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 font-sans max-w-4xl">
      <div className="grid grid-cols-1 gap-6">
        {/* Google Tag Manager & Web Analytics */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Code className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Google Tag Manager (GTM)</h3>
              <p className="text-[11px] text-slate-500">Google Analytics 4 and Google Ads Conversion Tracking</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                GTM Container ID
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ex: GTM-XXXXXXX"
                  value={settings.gtmId || ''}
                  onChange={(e) => setSettings({ ...settings, gtmId: e.target.value })}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none font-mono text-xs text-slate-900"
                />
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>Save</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                All GTM tracking tags and dataLayer events will automatically load into the storefront header once your container ID is set.
              </p>
            </div>

            <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl space-y-1.5 text-blue-900">
              <div className="flex items-center space-x-1.5 font-bold text-[11px]">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span>Automatic data layer events:</span>
              </div>
              <ul className="list-disc list-inside text-[10px] space-y-0.5 text-blue-800">
                <li><code>purchase</code> - Triggered upon order confirmation</li>
                <li><code>begin_checkout</code> - Triggered when checkout drawer or page opens</li>
                <li><code>view_item</code> - Triggered while browsing product details</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
