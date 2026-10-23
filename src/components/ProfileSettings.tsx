import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { 
  User, CheckCircle, Phone, Mail, MapPin, Lock, ShieldCheck,
  Building2, KeyRound, QrCode, Receipt, ChevronDown, Download,
  Image as ImageIcon, Upload, X, Palette, Store, Check, Sparkles, Share2
} from 'lucide-react';
import { dbService } from '../lib/dbService';
import { CircularProgress } from './LoadingSkeleton';
import { uploadFileToStorage } from '../lib/storageService';
import { authService } from '../lib/authService';
import { FeedbackDialog } from './ui/FeedbackDialog';

interface ProfileSettingsProps {
  adminEmail: string;
}

const BRAND_COLOR_PRESETS = [
  { name: 'Rose Red (Default)', hex: '#e11d48' },
  { name: 'Teal Green', hex: '#0f766e' },
  { name: 'Emerald Green', hex: '#16a34a' },
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Indigo Purple', hex: '#6366f1' },
  { name: 'Deep Orange', hex: '#ea580c' },
  { name: 'Amber Gold', hex: '#d97706' },
  { name: 'Slate Dark', hex: '#0f172a' },
];

export default function ProfileSettings({ adminEmail }: ProfileSettingsProps) {
  // Store Details state
  const [storeName, setStoreName] = useState('Store');
  const [companyName, setCompanyName] = useState('Store Ltd.');
  const [storeTagline, setStoreTagline] = useState('Premium Quality Online Shopping • Fast Delivery Nationwide.');
  const [topAnnouncementText, setTopAnnouncementText] = useState('WELCOME TO OUR STORE • FAST HOME DELIVERY NATIONWIDE');
  const [phone, setPhone] = useState('+880 1700-000000');
  const [email, setEmail] = useState(adminEmail || 'contact@store.com');
  const [street, setStreet] = useState('Dhaka, Bangladesh');
  const [industry, setIndustry] = useState('Retail & E-Commerce');

  // Social Media Links state (dynamic from admin, no static fallbacks)
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Store Identity & Branding state
  const [storeLogo, setStoreLogo] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#93c5fd');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Additional settings
  const [bearingRollLocation, setBearingRollLocation] = useState('Seoul');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [activeTab, setActiveTab] = useState<'identity' | 'contact' | 'social' | 'security'>('identity');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [info, ecomSettings] = await Promise.all([
          dbService.getInstituteInfo(),
          dbService.getEcomSettings()
        ]);

        if (info) {
          if (info.name) setCompanyName(info.name);
          if (info.phone) setPhone(info.phone);
          if (info.email) setEmail(info.email);
          if (info.address) setStreet(info.address);
          if (info.industry) setIndustry(info.industry);
          if (info.bearingRollLocation) setBearingRollLocation(info.bearingRollLocation);
          if (info.description) setStoreTagline(info.description);
          if (info.logo) setStoreLogo(info.logo);
        }

        if (ecomSettings) {
          if (ecomSettings.storeName) setStoreName(ecomSettings.storeName);
          if (ecomSettings.companyName) setCompanyName(ecomSettings.companyName);
          if (ecomSettings.storeLogo) setStoreLogo(ecomSettings.storeLogo);
          if (ecomSettings.storeTagline) setStoreTagline(ecomSettings.storeTagline);
          if (ecomSettings.topAnnouncementText) setTopAnnouncementText(ecomSettings.topAnnouncementText);
          if (ecomSettings.contactEmail) setEmail(ecomSettings.contactEmail);
          if (ecomSettings.contactPhone) setPhone(ecomSettings.contactPhone);
          if (ecomSettings.storeAddress) setStreet(ecomSettings.storeAddress);
          if (ecomSettings.primaryColor) setPrimaryColor(ecomSettings.primaryColor);
          if (ecomSettings.maintenanceMode !== undefined) setMaintenanceMode(ecomSettings.maintenanceMode);
          const loadedSocial = ecomSettings.socialLinks || ecomSettings.headerSettings?.socialLinks;
          if (loadedSocial) {
            setFacebookUrl(loadedSocial.facebook || '');
            setInstagramUrl(loadedSocial.instagram || '');
            setYoutubeUrl(loadedSocial.youtube || '');
            setTwitterUrl(loadedSocial.twitter || '');
            setTiktokUrl(loadedSocial.tiktok || '');
            setLinkedinUrl(loadedSocial.linkedin || '');
            setWhatsappNumber(loadedSocial.whatsapp || '');
          }
        }

        const currentUser = authService.getUser();
        if (currentUser) {
          setDisplayName(currentUser.email || '');
        }

      } catch (err) {
        console.error('Failed to load profile data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingLogo(true);
      const downloadUrl = await uploadFileToStorage(file, 'store_assets/logo');
      setStoreLogo(downloadUrl);
      setFeedback({
        isOpen: true,
        type: 'success',
        title: 'Logo Uploaded',
        message: 'Logo uploaded successfully! Click "Update Settings" to apply changes.'
      });
    } catch (err: any) {
      console.error('Error uploading logo:', err);
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Upload Failed',
        message: 'Logo upload failed: ' + (err.message || 'Please check file format.')
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const oldInst = await dbService.getInstituteInfo() || {} as any;
      await dbService.saveInstituteInfo({
        ...oldInst,
        name: companyName || storeName,
        logo: storeLogo,
        description: storeTagline,
        phone,
        email,
        address: street,
        street,
        industry,
        bearingRollLocation
      });

      const socialLinksPayload = {
        facebook: facebookUrl.trim(),
        instagram: instagramUrl.trim(),
        youtube: youtubeUrl.trim(),
        twitter: twitterUrl.trim(),
        tiktok: tiktokUrl.trim(),
        linkedin: linkedinUrl.trim(),
        whatsapp: whatsappNumber.trim()
      };

      const oldEcom = await dbService.getEcomSettings() || {} as any;
      await dbService.saveEcomSettings({
        ...oldEcom,
        storeName,
        companyName,
        storeLogo,
        storeTagline,
        topAnnouncementText,
        contactEmail: email,
        contactPhone: phone,
        storeAddress: street,
        footerDescription: storeTagline,
        primaryColor,
        maintenanceMode,
        headerSettings: {
          ...(oldEcom.headerSettings || {}),
          logoUrl: storeLogo || oldEcom.headerSettings?.logoUrl,
          brandName: storeName || oldEcom.headerSettings?.brandName,
          phone: phone || oldEcom.headerSettings?.phone,
          email: email || oldEcom.headerSettings?.email,
          socialLinks: {
            ...(oldEcom.headerSettings?.socialLinks || {}),
            ...socialLinksPayload
          }
        },
        socialLinks: socialLinksPayload
      });

      // Dynamically update favicon based on store logo
      if (storeLogo) {
        let link = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = storeLogo;
      }


      setIsSaving(false);
      setFeedback({
        isOpen: true,
        type: 'success',
        title: 'Settings Saved Successfully',
        message: 'Store identity, company details, footer branding, and contact information have been updated!'
      });
    } catch (err: any) {
      console.error('Error saving profile settings:', err);
      setIsSaving(false);
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Failed to save settings. Please try again.'
      });
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Invalid Password',
        message: 'New password must be at least 6 characters.'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Password Mismatch',
        message: 'New password and confirmation password do not match.'
      });
      return;
    }

    setIsChangingPass(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token') || ''}`
        },
        body: JSON.stringify({ currentPassword: currentPassword || '', newPassword })
      });

      if (!res.ok) {
        let msg = 'Failed to change password';
        try {
          const data = await res.json();
          msg = data.message || msg;
        } catch {
          // fallback
        }
        throw new Error(msg);
      }

      setFeedback({
        isOpen: true,
        type: 'success',
        title: 'Password Changed Successfully',
        message: 'Your administrator password has been updated successfully.'
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Password Change Failed',
        message: err.message || 'Please try again.'
      });
    } finally {
      setIsChangingPass(false);
    }
  };

  if (isLoading) {
    return (
      <CircularProgress label="Loading profile settings..." size="md" />
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'identity' as const, label: 'Store & Identity', icon: Store },
          { id: 'contact' as const, label: 'Contact & Header', icon: Phone },
          { id: 'social' as const, label: 'Social Media', icon: Share2 },
          { id: 'security' as const, label: 'Security & Password', icon: Lock }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="w-full">
        {/* TAB 1: STORE & IDENTITY */}
        {activeTab === 'identity' && (
          <form onSubmit={handleSaveSettings} noValidate className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Store Name</label>
                  <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 bg-white">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Store className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-transparent text-sm text-slate-900 focus:outline-none font-semibold"
                      placeholder="e.g. livewellfresh"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Company Name</label>
                  <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 bg-white">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-transparent text-sm text-slate-900 focus:outline-none font-semibold"
                      placeholder="e.g. livewellfresh Ltd."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Footer & Store Tagline</label>
                <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 bg-white">
                  <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
                    <Sparkles className="h-5 w-5 text-slate-400" />
                  </div>
                  <textarea
                    value={storeTagline}
                    onChange={(e) => setStoreTagline(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-transparent text-sm text-slate-900 focus:outline-none min-h-[80px] resize-y"
                    placeholder="e.g. livewellfresh • Innovative 3-in-1 Triple Chamber Laundry Pods & Eco Detergent Care."
                  />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-blue-600" />
                  Store Logo
                </h4>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-4">
                    {storeLogo ? (
                      <div className="relative group">
                        <img 
                          src={storeLogo} 
                          alt="Store Logo" 
                          className="h-16 w-auto max-w-[14rem] object-contain bg-slate-50 border border-slate-200 rounded-lg p-2 shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setStoreLogo('')}
                          className="absolute -top-2 -right-2 p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete Logo"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-16 w-36 bg-slate-100 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-[10px] text-slate-400 font-bold">
                        No Logo Uploaded
                      </div>
                    )}

                    <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors border border-slate-200">
                      <Upload className="h-3.5 w-3.5 text-slate-600" />
                      <span>{isUploadingLogo ? 'Uploading...' : 'Upload Logo File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={isUploadingLogo}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="space-y-1 max-w-lg">
                    <label className="text-[11px] font-semibold text-slate-500">Or Direct Logo Image URL / Path:</label>
                    <input
                      type="text"
                      value={storeLogo}
                      onChange={(e) => setStoreLogo(e.target.value)}
                      placeholder="/livewellfresh_logo.png or https://example.com/logo.png"
                      className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-slate-800">Maintenance Mode</h4>
                    <p className="text-[11px] text-slate-500">
                      When enabled, a maintenance banner will be displayed to storefront visitors.
                    </p>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="maintenance_toggle"
                      checked={maintenanceMode}
                      onChange={(e) => setMaintenanceMode(e.target.checked)}
                      className="sr-only peer"
                    />
                    <label 
                      htmlFor="maintenance_toggle" 
                      className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600 cursor-pointer" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button 
                type="submit"
                disabled={isSaving}
                className="px-7 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                {isSaving ? 'Updating...' : 'Update Settings'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: CONTACT & HEADER */}
        {activeTab === 'contact' && (
          <form onSubmit={handleSaveSettings} noValidate className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Customer Care Phone</label>
                  <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 bg-white">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-transparent text-sm text-slate-900 focus:outline-none font-mono"
                      placeholder="e.g. +86 18027300683"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Contact Email</label>
                  <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 bg-white">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-transparent text-sm text-slate-900 focus:outline-none font-mono"
                      placeholder="e.g. authentic.factory@outlook.com"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Top Bar Announcement Text</label>
                <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 bg-white">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Sparkles className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={topAnnouncementText}
                    onChange={(e) => setTopAnnouncementText(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-transparent text-sm text-slate-900 focus:outline-none font-semibold uppercase tracking-wider"
                    placeholder="e.g. WELCOME TO LIVEWELLFRESH • FRESH CLOTHES. BETTER LIFE"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Office / Store Address</label>
                <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 bg-white">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-transparent text-sm text-slate-900 focus:outline-none"
                    placeholder="e.g. No. 88 Industrial Avenue, High-Tech Manufacturing Zone"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button 
                type="submit"
                disabled={isSaving}
                className="px-7 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                {isSaving ? 'Updating...' : 'Update Settings'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: SOCIAL MEDIA */}
        {activeTab === 'social' && (
          <form onSubmit={handleSaveSettings} noValidate className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Non-empty social media links will automatically display in the top announcement bar and website footer. Empty links are automatically hidden.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Facebook Page URL</label>
                  <input
                    type="text"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    placeholder="https://facebook.com/yourbrand"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Instagram Profile URL</label>
                  <input
                    type="text"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/yourbrand"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">YouTube Channel URL</label>
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/@yourbrand"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Twitter / X Profile URL</label>
                  <input
                    type="text"
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                    placeholder="https://twitter.com/yourbrand"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">TikTok Profile URL</label>
                  <input
                    type="text"
                    value={tiktokUrl}
                    onChange={(e) => setTiktokUrl(e.target.value)}
                    placeholder="https://tiktok.com/@yourbrand"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">WhatsApp Contact / Link</label>
                  <input
                    type="text"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+86 18027300683 or https://wa.me/..."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button 
                type="submit"
                disabled={isSaving}
                className="px-7 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                {isSaving ? 'Updating...' : 'Update Settings'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 4: SECURITY & PASSWORD */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Active Admin Account</p>
                <p className="text-sm font-bold text-slate-900">{displayName || email || adminEmail}</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Current Password</label>
                <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 bg-white">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 bg-transparent text-sm text-slate-900 focus:outline-none"
                    placeholder="Enter current password"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">New Password</label>
                  <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 bg-white">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full pl-10 pr-4 py-2.5 bg-transparent text-sm text-slate-900 focus:outline-none"
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
                  <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 bg-white">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ShieldCheck className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-10 pr-4 py-2.5 bg-transparent text-sm text-slate-900 focus:outline-none"
                      placeholder="Repeat new password"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <Lock className="h-3.5 w-3.5" />
                  {isChangingPass ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Feedback Dialog on Save */}
      <FeedbackDialog
        isOpen={feedback.isOpen}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
        onClose={() => setFeedback(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
