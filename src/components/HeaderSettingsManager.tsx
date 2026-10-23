import React, { useState, useEffect } from 'react';
import { EcomSettings, HeaderSettings, HeaderMenuItem } from '../types';
import { dbService } from '../lib/dbService';
import { DEFAULT_HEADER_SETTINGS } from '../lib/constants';
import { compressImage } from '../lib/imageUtils';
import { uploadDataUrlToStorage } from '../lib/storageService';
import { FeedbackDialog } from './ui/FeedbackDialog';
import {
  Save,
  Phone,
  Mail,
  Share2,
  Globe,
  Upload,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sliders,
  ExternalLink,
  Eye,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Layers,
  FileText
} from 'lucide-react';

export default function HeaderSettingsManager() {
  const [settings, setSettings] = useState<HeaderSettings>(DEFAULT_HEADER_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [activeTab, setActiveTab] = useState<'topbar' | 'branding' | 'menu' | 'cta' | 'preview'>('topbar');

  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        setIsLoading(true);
        const ecom: EcomSettings = await dbService.getEcomSettings();
        const header = ecom?.headerSettings || DEFAULT_HEADER_SETTINGS;
        setSettings({
          ...DEFAULT_HEADER_SETTINGS,
          ...header,
          phone: header.phone || ecom?.contactPhone || '',
          email: header.email || ecom?.contactEmail || '',
          brandName: header.brandName || ecom?.storeName || '',
          logoUrl: header.logoUrl || ecom?.storeLogo || '',
          socialLinks: {
            facebook: '',
            instagram: '',
            youtube: '',
            twitter: '',
            tiktok: '',
            linkedin: '',
            whatsapp: '',
            ...(ecom?.socialLinks || {}),
            ...(header.socialLinks || {})
          },
          menuItems: header.menuItems?.length
            ? header.menuItems
            : DEFAULT_HEADER_SETTINGS.menuItems
        });
      } catch (err) {
        console.error('Failed to load header settings:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Save settings
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const ecom: EcomSettings = await dbService.getEcomSettings() || {} as any;
      const cleanSocial = {
        facebook: (settings.socialLinks?.facebook || '').trim(),
        instagram: (settings.socialLinks?.instagram || '').trim(),
        youtube: (settings.socialLinks?.youtube || '').trim(),
        twitter: (settings.socialLinks?.twitter || '').trim(),
        tiktok: (settings.socialLinks?.tiktok || '').trim(),
        linkedin: (settings.socialLinks?.linkedin || '').trim(),
        whatsapp: (settings.socialLinks?.whatsapp || '').trim()
      };

      const updatedSettings: HeaderSettings = {
        ...settings,
        phone: (settings.phone || '').trim(),
        email: (settings.email || '').trim(),
        brandName: (settings.brandName || '').trim(),
        socialLinks: cleanSocial
      };

      const updatedEcom: EcomSettings = {
        ...ecom,
        headerSettings: updatedSettings,
        storeLogo: updatedSettings.logoUrl || ecom.storeLogo,
        storeName: updatedSettings.brandName || ecom.storeName,
        contactPhone: updatedSettings.phone || ecom.contactPhone,
        contactEmail: updatedSettings.email || ecom.contactEmail,
        socialLinks: cleanSocial
      };
      await dbService.saveEcomSettings(updatedEcom);

      try {
        const inst = await dbService.getInstituteInfo();
        if (inst) {
          await dbService.saveInstituteInfo({
            ...inst,
            logo: updatedSettings.logoUrl || inst.logo,
            name: updatedSettings.brandName || inst.name,
            phone: updatedSettings.phone || inst.phone,
            email: updatedSettings.email || inst.email
          });
        }
      } catch {}

      setFeedback({
        isOpen: true,
        type: 'success',
        title: 'Settings Saved Successfully',
        message: 'Header and top bar settings have been updated and are now live on your storefront.'
      });
    } catch (err: any) {
      console.error('Failed to save header settings:', err);
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Failed to Save',
        message: err.message || 'An error occurred while saving header settings.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default Authentic settings
  const handleResetDefaults = () => {
    if (window.confirm('Reset header settings to Authentic default template?')) {
      setSettings(DEFAULT_HEADER_SETTINGS);
    }
  };

  // Handle Logo Upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const compressedDataUrl = await compressImage(file, 800, 0.9);
      const uploadedUrl = await uploadDataUrlToStorage(compressedDataUrl, 'header_logo');
      setSettings(prev => ({ ...prev, logoUrl: uploadedUrl }));
    } catch (err: any) {
      console.error('Failed uploading logo:', err);
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Logo Upload Failed',
        message: err.message || 'Unable to upload brand logo.'
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  // Menu items helpers
  const handleAddMenuItem = () => {
    const newItem: HeaderMenuItem = {
      id: `menu-${Date.now()}`,
      label: 'New Link',
      link: '/shop',
      hasDropdown: false,
      dropdownItems: []
    };
    setSettings(prev => ({
      ...prev,
      menuItems: [...prev.menuItems, newItem]
    }));
  };

  const handleUpdateMenuItem = (id: string, updates: Partial<HeaderMenuItem>) => {
    setSettings(prev => ({
      ...prev,
      menuItems: prev.menuItems.map(item => item.id === id ? { ...item, ...updates } : item)
    }));
  };

  const handleDeleteMenuItem = (id: string) => {
    setSettings(prev => ({
      ...prev,
      menuItems: prev.menuItems.filter(item => item.id !== id)
    }));
  };

  const handleMoveMenuItem = (index: number, direction: 'up' | 'down') => {
    setSettings(prev => {
      const items = [...prev.menuItems];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= items.length) return prev;
      const temp = items[index];
      items[index] = items[targetIndex];
      items[targetIndex] = temp;
      return { ...prev, menuItems: items };
    });
  };

  const handleAddDropdownItem = (menuId: string) => {
    setSettings(prev => ({
      ...prev,
      menuItems: prev.menuItems.map(item => {
        if (item.id === menuId) {
          const currentDropdown = item.dropdownItems || [];
          return {
            ...item,
            hasDropdown: true,
            dropdownItems: [...currentDropdown, { label: 'New Sub-item', link: '/shop' }]
          };
        }
        return item;
      })
    }));
  };

  const handleUpdateDropdownItem = (menuId: string, subIndex: number, field: 'label' | 'link', val: string) => {
    setSettings(prev => ({
      ...prev,
      menuItems: prev.menuItems.map(item => {
        if (item.id === menuId && item.dropdownItems) {
          const newDropdown = [...item.dropdownItems];
          newDropdown[subIndex] = { ...newDropdown[subIndex], [field]: val };
          return { ...item, dropdownItems: newDropdown };
        }
        return item;
      })
    }));
  };

  const handleDeleteDropdownItem = (menuId: string, subIndex: number) => {
    setSettings(prev => ({
      ...prev,
      menuItems: prev.menuItems.map(item => {
        if (item.id === menuId && item.dropdownItems) {
          const newDropdown = item.dropdownItems.filter((_, idx) => idx !== subIndex);
          return {
            ...item,
            hasDropdown: newDropdown.length > 0,
            dropdownItems: newDropdown
          };
        }
        return item;
      })
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mr-3" />
        <span className="font-medium text-sm">Loading Header & Top Bar Settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Page Title & Main Save Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Storefront Navigation & Top Bar</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Header & Top Bar Customizer</h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure contact info, social links, logo, navbar menus, and "Get A Quote" CTA button.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Reset Defaults
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-700/20 transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('topbar')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'topbar'
              ? 'bg-white text-teal-700 border-t-2 border-teal-600 border-x border-slate-200 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          Top Bar (Contact & Social)
        </button>

        <button
          onClick={() => setActiveTab('branding')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'branding'
              ? 'bg-white text-teal-700 border-t-2 border-teal-600 border-x border-slate-200 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          Logo & Brand
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'menu'
              ? 'bg-white text-teal-700 border-t-2 border-teal-600 border-x border-slate-200 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Navigation Menu ({settings.menuItems.length})
        </button>

        <button
          onClick={() => setActiveTab('cta')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'cta'
              ? 'bg-white text-teal-700 border-t-2 border-teal-600 border-x border-slate-200 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          CTA Button ("Get A Quote")
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'preview'
              ? 'bg-white text-teal-700 border-t-2 border-teal-600 border-x border-slate-200 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Live Preview
        </button>
      </div>

      {/* TAB 1: TOP BAR SETTINGS */}
      {activeTab === 'topbar' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Top Contact Bar Visibility</h3>
                <p className="text-xs text-slate-500 mt-0.5">Toggle the blue top bar containing phone, email, and social links.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showTopBar}
                  onChange={e => setSettings(prev => ({ ...prev, showTopBar: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-teal-600" />
                  Top Bar Phone Number
                </label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={e => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g. +880 1700-000000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-teal-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-400 mt-1">Displayed with telephone icon on the left of top bar.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-teal-600" />
                  Top Bar Contact Email
                </label>
                <input
                  type="text"
                  value={settings.email}
                  onChange={e => setSettings(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g. support@yourbrand.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-teal-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-400 mt-1">Displayed with envelope icon next to phone number.</p>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-teal-600" />
                Social Media Links (Top Bar Right)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Icons will appear automatically on the right side of the top bar when URLs are configured.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Facebook URL</label>
                <input
                  type="text"
                  value={settings.socialLinks?.facebook || ''}
                  onChange={e => setSettings(prev => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, facebook: e.target.value }
                  }))}
                  placeholder="https://facebook.com/..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">YouTube URL</label>
                <input
                  type="text"
                  value={settings.socialLinks?.youtube || ''}
                  onChange={e => setSettings(prev => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, youtube: e.target.value }
                  }))}
                  placeholder="https://youtube.com/@..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instagram URL</label>
                <input
                  type="text"
                  value={settings.socialLinks?.instagram || ''}
                  onChange={e => setSettings(prev => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, instagram: e.target.value }
                  }))}
                  placeholder="https://instagram.com/..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Twitter / X URL</label>
                <input
                  type="text"
                  value={settings.socialLinks?.twitter || ''}
                  onChange={e => setSettings(prev => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                  }))}
                  placeholder="https://x.com/..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">LinkedIn URL</label>
                <input
                  type="text"
                  value={settings.socialLinks?.linkedin || ''}
                  onChange={e => setSettings(prev => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                  }))}
                  placeholder="https://linkedin.com/company/..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">TikTok URL</label>
                <input
                  type="text"
                  value={settings.socialLinks?.tiktok || ''}
                  onChange={e => setSettings(prev => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, tiktok: e.target.value }
                  }))}
                  placeholder="https://tiktok.com/@..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Number or Chat Link</label>
                <input
                  type="text"
                  value={settings.socialLinks?.whatsapp || ''}
                  onChange={e => setSettings(prev => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, whatsapp: e.target.value }
                  }))}
                  placeholder="e.g. +880 1700-000000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-teal-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BRANDING & LOGO */}
      {activeTab === 'branding' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Brand Identity & Navbar Logo</h3>
            <p className="text-xs text-slate-500 mt-0.5">Configure the brand emblem displayed on the top left of the header navbar.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Brand Name</label>
                <input
                  type="text"
                  value={settings.brandName || ''}
                  onChange={e => setSettings(prev => ({ ...prev, brandName: e.target.value }))}
                  placeholder="Authentic"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Logo URL or Path</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.logoUrl || ''}
                    onChange={e => setSettings(prev => ({ ...prev, logoUrl: e.target.value }))}
                    placeholder="/authentic/authentic_logo.png"
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-teal-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setSettings(prev => ({ ...prev, logoUrl: '/authentic/authentic_logo.png' }))}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Default
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Or Upload Custom Logo</label>
                <label className="inline-flex items-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 mr-2 text-teal-600" />
                  {uploadingLogo ? 'Uploading Logo...' : 'Upload Image (PNG/WebP/SVG)'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Logo Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center flex flex-col items-center justify-center min-h-[220px]">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Navbar Logo Preview</span>
              {settings.logoUrl ? (
                <div className="p-4 bg-white rounded-xl shadow-xs border border-slate-200 flex items-center gap-3">
                  <img
                    src={settings.logoUrl}
                    alt={settings.brandName || 'Logo'}
                    className="h-10 max-w-[180px] object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/logo_transparent.webp';
                    }}
                  />
                  {settings.brandName && (
                    <span className="text-base font-extrabold tracking-tight text-slate-900">{settings.brandName}</span>
                  )}
                </div>
              ) : (
                <div className="text-slate-400 text-xs italic">No logo selected</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MENU ITEMS */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Header Navbar Links & Dropdowns</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage the main navigation links displayed across desktop and mobile menus.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddMenuItem}
              className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Menu Item
            </button>
          </div>

          {/* Menu Items List */}
          <div className="space-y-4">
            {settings.menuItems.map((item, index) => (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="font-bold text-sm text-slate-800">{item.label}</span>
                    {item.hasDropdown && (
                      <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-bold rounded-full">
                        {item.dropdownItems?.length || 0} Dropdown Links
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 self-end md:self-auto">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveMenuItem(index, 'up')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg cursor-pointer"
                      title="Move Up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={index === settings.menuItems.length - 1}
                      onClick={() => handleMoveMenuItem(index, 'down')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg cursor-pointer"
                      title="Move Down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMenuItem(item.id)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer ml-1"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Item Title / Label</label>
                    <input
                      type="text"
                      value={item.label}
                      onChange={e => handleUpdateMenuItem(item.id, { label: e.target.value })}
                      placeholder="e.g. Products"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Link Target / Route</label>
                    <input
                      type="text"
                      value={item.link}
                      onChange={e => handleUpdateMenuItem(item.id, { link: e.target.value })}
                      placeholder="/shop or /about"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-teal-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Dropdown Toggle */}
                <div className="pt-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.hasDropdown}
                      onChange={e => {
                        const checked = e.target.checked;
                        handleUpdateMenuItem(item.id, {
                          hasDropdown: checked,
                          dropdownItems: checked && (!item.dropdownItems || item.dropdownItems.length === 0)
                            ? [{ label: 'Sub-item 1', link: item.link }]
                            : item.dropdownItems
                        });
                      }}
                      className="rounded-sm border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-xs font-bold text-slate-700">Enable Dropdown Menu for this item</span>
                  </label>
                </div>

                {/* Sub items manager if dropdown is enabled */}
                {item.hasDropdown && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Sub-menu Links</span>
                      <button
                        type="button"
                        onClick={() => handleAddDropdownItem(item.id)}
                        className="inline-flex items-center text-[11px] font-bold text-teal-600 hover:text-teal-700 cursor-pointer"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Sub-link
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(item.dropdownItems || []).map((sub, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={sub.label}
                            onChange={e => handleUpdateDropdownItem(item.id, sIdx, 'label', e.target.value)}
                            placeholder="Sub-item Name"
                            className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                          <input
                            type="text"
                            value={sub.link}
                            onChange={e => handleUpdateDropdownItem(item.id, sIdx, 'link', e.target.value)}
                            placeholder="/product/..."
                            className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteDropdownItem(item.id, sIdx)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CTA BUTTON ("Get A Quote") */}
      {activeTab === 'cta' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Header CTA Button</h3>
              <p className="text-xs text-slate-500 mt-0.5">Configure the pill button on the right side of the navbar (e.g. "Get A Quote").</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showCtaButton}
                onChange={e => setSettings(prev => ({ ...prev, showCtaButton: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CTA Button Text</label>
              <input
                type="text"
                value={settings.ctaButtonText}
                onChange={e => setSettings(prev => ({ ...prev, ctaButtonText: e.target.value }))}
                placeholder="Get A Quote"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Action Type</label>
              <select
                value={settings.ctaActionType}
                onChange={e => setSettings(prev => ({ ...prev, ctaActionType: e.target.value as any }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-teal-500 focus:outline-hidden"
              >
                <option value="quote_modal">Open "Request A Quote" Modal</option>
                <option value="custom_link">Navigate to URL or Page</option>
              </select>
            </div>

            {settings.ctaActionType === 'custom_link' && (
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Custom Link URL</label>
                <input
                  type="text"
                  value={settings.ctaButtonLink}
                  onChange={e => setSettings(prev => ({ ...prev, ctaButtonLink: e.target.value }))}
                  placeholder="#quote or /contact"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-teal-500 focus:outline-hidden"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: LIVE PREVIEW */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold">Interactive Live Header Preview</h3>
              <p className="text-xs text-slate-400">Previewing how the header renders on high-resolution displays.</p>
            </div>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center text-xs font-bold text-teal-400 hover:text-teal-300"
            >
              Open Live Storefront Page <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>
          </div>

          <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-lg bg-white">
            {/* Top Bar Preview */}
            {settings.showTopBar && (
              <div className="bg-[#1b438f] text-white text-xs py-2 px-6 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  {settings.phone && (
                    <span className="flex items-center gap-1.5 font-medium">
                      <Phone className="w-3.5 h-3.5 text-blue-200" />
                      {settings.phone}
                    </span>
                  )}
                  {settings.email && (
                    <span className="flex items-center gap-1.5 font-medium">
                      <Mail className="w-3.5 h-3.5 text-blue-200" />
                      {settings.email}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {settings.socialLinks?.facebook?.trim() && <span className="opacity-80 hover:opacity-100 text-[11px] font-bold">FB</span>}
                  {settings.socialLinks?.instagram?.trim() && <span className="opacity-80 hover:opacity-100 text-[11px] font-bold">IG</span>}
                  {settings.socialLinks?.youtube?.trim() && <span className="opacity-80 hover:opacity-100 text-[11px] font-bold">YT</span>}
                  {settings.socialLinks?.twitter?.trim() && <span className="opacity-80 hover:opacity-100 text-[11px] font-bold">X</span>}
                  {settings.socialLinks?.linkedin?.trim() && <span className="opacity-80 hover:opacity-100 text-[11px] font-bold">IN</span>}
                  {settings.socialLinks?.tiktok?.trim() && <span className="opacity-80 hover:opacity-100 text-[11px] font-bold">TT</span>}
                  {settings.socialLinks?.whatsapp?.trim() && <span className="opacity-80 hover:opacity-100 text-[11px] font-bold">WA</span>}
                </div>
              </div>
            )}

            {/* Navbar Preview */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                {settings.logoUrl && (
                  <img
                    src={settings.logoUrl}
                    alt={settings.brandName || 'Authentic'}
                    className="h-9 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/logo_transparent.webp';
                    }}
                  />
                )}
                <span className="font-extrabold text-lg tracking-tight text-slate-900">{settings.brandName || 'Authentic'}</span>
              </div>

              <div className="hidden md:flex items-center gap-7">
                {settings.menuItems.map(item => (
                  <div key={item.id} className="relative group">
                    <span className="text-xs font-bold text-slate-800 hover:text-teal-600 flex items-center gap-1 cursor-pointer">
                      {item.label}
                      {item.hasDropdown && <ChevronDown className="w-3 h-3 text-slate-400" />}
                    </span>
                  </div>
                ))}
              </div>

              {settings.showCtaButton && (
                <button
                  type="button"
                  className="px-5 py-2 bg-[#1b438f] text-white text-xs font-bold rounded-full hover:bg-blue-900 transition-colors shadow-xs flex items-center gap-1.5"
                >
                  {settings.ctaButtonText || 'Get A Quote'}
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Simulated Page Content */}
            <div className="p-8 bg-slate-50 text-center text-slate-400 text-xs font-medium">
              Product details showcase content renders here below header.
            </div>
          </div>
        </div>
      )}

      {/* Global Feedback Dialog */}
      <FeedbackDialog
        isOpen={feedback.isOpen}
        onClose={() => setFeedback(prev => ({ ...prev, isOpen: false }))}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
    </div>
  );
}
