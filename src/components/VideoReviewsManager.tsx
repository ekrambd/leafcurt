import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Plus, 
  Trash2, 
  Pencil, 
  MoveUp, 
  MoveDown, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  X, 
  Upload, 
  Eye, 
  EyeOff, 
  Film,
  Sparkles,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { VideoReviewsSettings, VideoReviewItem, Product } from '../types';
import { ApiClient } from '../services/apiClient';
import { uploadFileToStorage, uploadDataUrlToStorage } from '../lib/storageService';
import { extractYouTubeId, getVideoPosterUrl, isDirectVideo } from './VideoReviewsSection';

export default function VideoReviewsManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [settings, setSettings] = useState<VideoReviewsSettings>({
    enabled: true,
    items: []
  });

  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

  // Modal / Form state for Add/Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VideoReviewItem | null>(null);
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formAuthor, setFormAuthor] = useState('');
  const [formPillTag, setFormPillTag] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formQuote, setFormQuote] = useState('');
  const [formPosterUrl, setFormPosterUrl] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formActive, setFormActive] = useState(true);

  // Attached Product Form Fields
  const [formProductId, setFormProductId] = useState('');
  const [formProductTitle, setFormProductTitle] = useState('');
  const [formProductPrice, setFormProductPrice] = useState<string | number>('');
  const [formProductRegularPrice, setFormProductRegularPrice] = useState<string | number>('');
  const [formProductImage, setFormProductImage] = useState('');
  const [formProductDiscountBadge, setFormProductDiscountBadge] = useState('');
  const [formProductUrl, setFormProductUrl] = useState('');

  // Load from API
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [res, prods] = await Promise.all([
          ApiClient.getVideoReviews(),
          ApiClient.getProducts().catch(() => [])
        ]);
        setSettings({
          enabled: res.enabled ?? true,
          items: res.items || []
        });
        setAvailableProducts(prods || []);
      } catch (err) {
        console.error('Failed to load video reviews or products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectProduct = (prodId: string) => {
    setFormProductId(prodId);
    if (!prodId) {
      setFormProductTitle('');
      setFormProductPrice('');
      setFormProductRegularPrice('');
      setFormProductImage('');
      setFormProductDiscountBadge('');
      setFormProductUrl('');
      return;
    }
    const found = availableProducts.find(p => p.id === prodId);
    if (found) {
      setFormProductTitle(found.title);
      setFormProductPrice(found.price);
      setFormProductRegularPrice(found.regularPrice || found.price);
      const img = (Array.isArray(found.images) && found.images[0]) || found.image || '';
      setFormProductImage(img);
      if (found.regularPrice && found.regularPrice > found.price) {
        const discount = Math.round((1 - found.price / found.regularPrice) * 100);
        setFormProductDiscountBadge(`${discount}% OFF`);
      } else {
        setFormProductDiscountBadge('');
      }
      setFormProductUrl(`/product/${found.slug || found.id}`);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormAuthor('');
    setFormPillTag('ভেরিফাইড ক্রেতা');
    setFormSubtitle('');
    setFormQuote('');
    setFormPosterUrl('');
    setFormVideoUrl('');
    setFormActive(true);
    setFormProductId('');
    setFormProductTitle('');
    setFormProductPrice('');
    setFormProductRegularPrice('');
    setFormProductImage('');
    setFormProductDiscountBadge('');
    setFormProductUrl('');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: VideoReviewItem) => {
    setEditingItem(item);
    setFormAuthor(item.author || '');
    setFormPillTag(item.pillTag || '');
    setFormSubtitle(item.subtitle || '');
    setFormQuote(item.quote || '');
    setFormPosterUrl(item.posterUrl || '');
    setFormVideoUrl(item.videoUrl || '');
    setFormActive(item.active !== false);
    setFormProductId(item.productId || '');
    setFormProductTitle(item.productTitle || '');
    setFormProductPrice(item.productPrice !== undefined ? item.productPrice : '');
    setFormProductRegularPrice(item.productRegularPrice !== undefined ? item.productRegularPrice : '');
    setFormProductImage(item.productImage || '');
    setFormProductDiscountBadge(item.productDiscountBadge || '');
    setFormProductUrl(item.productUrl || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handlePosterFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingPoster(true);
      const url = await uploadFileToStorage(file, 'video-reviews');
      setFormPosterUrl(url);
      showToast('থাম্বনেইল ইমেজ সফলভাবে আপলোড হয়েছে');
    } catch (err: any) {
      setFormError(err.message || 'ইমেজ আপলোড করতে সমস্যা হয়েছে');
    } finally {
      setIsUploadingPoster(false);
    }
  };

  const captureVideoFrame = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      try {
        const url = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.src = url;
        video.muted = true;
        video.playsInline = true;
        video.currentTime = 0.5;
        video.onloadeddata = () => {
          video.currentTime = 0.5;
        };
        video.onseeked = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 480;
            canvas.height = video.videoHeight || 640;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
              URL.revokeObjectURL(url);
              resolve(dataUrl);
              return;
            }
          } catch {
            // ignore
          }
          URL.revokeObjectURL(url);
          resolve('');
        };
        video.onerror = () => {
          URL.revokeObjectURL(url);
          resolve('');
        };
      } catch {
        resolve('');
      }
    });
  };

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingVideo(true);
      const url = await uploadFileToStorage(file, 'video-reviews');
      setFormVideoUrl(url);

      // Auto-capture video frame as thumbnail if no poster exists
      try {
        const frameDataUrl = await captureVideoFrame(file);
        if (frameDataUrl && (!formPosterUrl.trim() || formPosterUrl.includes('img.youtube.com'))) {
          const posterUrl = await uploadDataUrlToStorage(frameDataUrl, 'video-reviews');
          setFormPosterUrl(posterUrl);
        }
      } catch (thumbErr) {
        console.warn('Auto poster generation skipped:', thumbErr);
      }

      showToast('ভিডিও ফাইল ও প্রিভিউ সফলভাবে আপলোড হয়েছে');
    } catch (err: any) {
      setFormError(err.message || 'ভিডিও আপলোড করতে সমস্যা হয়েছে');
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleVideoUrlChange = (val: string) => {
    setFormVideoUrl(val);
    const ytId = extractYouTubeId(val);
    // If it's a YouTube link and posterUrl is currently empty or previously from YouTube, auto-set thumbnail
    if (ytId && (!formPosterUrl.trim() || formPosterUrl.includes('img.youtube.com'))) {
      setFormPosterUrl(`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`);
    }
  };

  const handleSaveFormItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectivePoster = formPosterUrl.trim() || getVideoPosterUrl('', formVideoUrl);

    if (!formAuthor.trim()) {
      setFormError('গ্রাহকের নাম আবশ্যক');
      return;
    }
    if (!effectivePoster && !formVideoUrl.trim()) {
      setFormError('কমপক্ষে একটি থাম্বনেইল ছবি অথবা ভিডিও লিঙ্ক দিন');
      return;
    }

    const attachedProductFields = formProductId.trim() ? {
      productId: formProductId.trim(),
      productTitle: formProductTitle.trim() || undefined,
      productPrice: formProductPrice !== '' ? Number(formProductPrice) : undefined,
      productRegularPrice: formProductRegularPrice !== '' ? Number(formProductRegularPrice) : undefined,
      productImage: formProductImage.trim() || undefined,
      productDiscountBadge: formProductDiscountBadge.trim() || undefined,
      productUrl: formProductUrl.trim() || undefined
    } : {
      productId: undefined,
      productTitle: undefined,
      productPrice: undefined,
      productRegularPrice: undefined,
      productImage: undefined,
      productDiscountBadge: undefined,
      productUrl: undefined
    };

    const currentItems = [...settings.items];

    if (editingItem) {
      // Update
      const index = currentItems.findIndex(i => i.id === editingItem.id);
      if (index !== -1) {
        currentItems[index] = {
          ...currentItems[index],
          author: formAuthor.trim(),
          pillTag: formPillTag.trim(),
          subtitle: formSubtitle.trim(),
          quote: formQuote.trim(),
          posterUrl: effectivePoster,
          videoUrl: formVideoUrl.trim(),
          active: formActive,
          ...attachedProductFields
        };
      }
    } else {
      // Add new
      const newItem: VideoReviewItem = {
        id: `vr-${Date.now()}`,
        author: formAuthor.trim(),
        pillTag: formPillTag.trim(),
        subtitle: formSubtitle.trim(),
        quote: formQuote.trim(),
        posterUrl: effectivePoster,
        videoUrl: formVideoUrl.trim(),
        active: formActive,
        ...attachedProductFields
      };
      currentItems.push(newItem);
    }

    const updatedSettings = {
      ...settings,
      items: currentItems
    };

    setSettings(updatedSettings);
    setIsFormOpen(false);

    // Persist immediately to API
    try {
      setSaving(true);
      await ApiClient.saveVideoReviews(updatedSettings);
      showToast(editingItem ? 'ভিডিও রিভিউ আপডেট করা হয়েছে!' : 'নতুন ভিডিও রিভিউ যুক্ত করা হয়েছে!');
    } catch (err) {
      console.error('Failed to save video review:', err);
      showToast('সংরক্ষণ করতে ব্যর্থ হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিতভাবে এই ভিডিও রিভিউটি মুছে ফেলতে চান?')) {
      return;
    }

    const updatedItems = settings.items.filter(i => i.id !== id);
    const updatedSettings = {
      ...settings,
      items: updatedItems
    };

    setSettings(updatedSettings);

    try {
      setSaving(true);
      await ApiClient.saveVideoReviews(updatedSettings);
      showToast('ভিডিও রিভিউ মুছে ফেলা হয়েছে');
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleItemActive = async (id: string) => {
    const updatedItems = settings.items.map(item => 
      item.id === id ? { ...item, active: !item.active } : item
    );
    const updatedSettings = { ...settings, items: updatedItems };
    setSettings(updatedSettings);

    try {
      await ApiClient.saveVideoReviews(updatedSettings);
    } catch (err) {
      console.error('Toggle active failed:', err);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const copy = [...settings.items];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= copy.length) return;

    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    const updatedSettings = { ...settings, items: copy };
    setSettings(updatedSettings);

    try {
      await ApiClient.saveVideoReviews(updatedSettings);
      showToast('ক্রম পরিবর্তন সংরক্ষিত হয়েছে');
    } catch (err) {
      console.error('Move failed:', err);
    }
  };

  const handleToggleSectionEnabled = async (enabled: boolean) => {
    const updated = { ...settings, enabled };
    setSettings(updated);
    try {
      setSaving(true);
      await ApiClient.saveVideoReviews(updated);
      showToast(enabled ? 'ভিডিও রিভিউ সেকশন চালু করা হয়েছে' : 'ভিডিও রিভিউ সেকশন বন্ধ করা হয়েছে');
    } catch (err) {
      console.error('Failed to toggle section:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans pb-12">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[9999] bg-emerald-950 text-emerald-100 border border-emerald-500/50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                ভিডিও রিভিউ ম্যানেজমেন্ট (Video Reviews)
              </h2>
              <p className="text-xs text-slate-500">
                গ্রাহকদের বাস্তব ভিডিও মতামত ও আনবক্সিং রিল যুক্ত করুন। কোনো ফেক ডাটা ছাড়া শুধুমাত্র রিয়েল ভিডিও দেখাবে।
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Master Enable/Disable Toggle */}
          <label className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl cursor-pointer transition">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => handleToggleSectionEnabled(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-700">
              {settings.enabled ? '🟢 সেকশন চালু আছে' : '⚪ সেকশন বন্ধ আছে'}
            </span>
          </label>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-2xl shadow-md transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন ভিডিও রিভিউ যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* Info Notice */}
      <div className="p-4 bg-purple-50/70 border border-purple-200/60 rounded-2xl flex items-start gap-3 text-xs text-purple-900">
        <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-bold">স্মার্ট স্টোরফ্রন্ট ইন্টিগ্রেশন:</p>
          <p className="text-[11px] text-purple-800 mt-0.5">
            এখানে ভিডিও রিভিউ যোগ করলে তা স্বয়ংক্রিয়ভাবে হোমপেজে প্রদর্শিত হবে। কোনো ভিডিও না থাকলে স্টোরফ্রন্ট থেকে সেকশনটি সম্পূর্ণভাবে লুকানো থাকবে, কোনো ডামি বা ফেক তথ্য দেখাবে না।
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">
          ভিডিও রিভিউ লোড হচ্ছে...
        </div>
      ) : settings.items.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 space-y-4">
          <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mx-auto">
            <Video className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-base">
              এখনো কোনো ভিডিও রিভিউ যুক্ত করা হয়নি
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              আপনার স্টোরের জন্য গ্রাহকদের বাস্তব ভিডিও রিভিউ, ফেসবুক রিল বা ইউটিউব শর্টস যোগ করতে উপরের বাটনে ক্লিক করুন।
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-2xl shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>প্রথম ভিডিও রিভিউ যোগ করুন</span>
          </button>
        </div>
      ) : (
        /* Video Reviews Cards Grid / Table */
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-600">
              মোট {settings.items.length} টি ভিডিও রিভিউ তালিকাভুক্ত
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {settings.items.map((item, idx) => (
              <div 
                key={item.id || idx}
                className={`bg-white rounded-3xl p-4 border transition-all flex flex-col justify-between ${
                  item.active !== false 
                    ? 'border-slate-200/80 shadow-xs hover:border-purple-300' 
                    : 'border-slate-200 bg-slate-50/50 opacity-60'
                }`}
              >
                <div>
                  {/* Card Header with Reorder & Actions */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200/50">
                      #{idx + 1}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, 'up')}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 disabled:opacity-20 cursor-pointer"
                        title="উপরে নিন"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === settings.items.length - 1}
                        onClick={() => handleMove(idx, 'down')}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 disabled:opacity-20 cursor-pointer"
                        title="নিচে নিন"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleItemActive(item.id)}
                        className={`p-1 rounded-lg cursor-pointer ${
                          item.active !== false ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-200'
                        }`}
                        title={item.active !== false ? 'সক্রিয় আছে (হাইড করতে ক্লিক করুন)' : 'লুকানো আছে (সক্রিয় করতে ক্লিক করুন)'}
                      >
                        {item.active !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                        title="এডিট করুন"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail & Video Preview */}
                  <div className="mt-3 relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/80">
                    {(() => {
                      const poster = getVideoPosterUrl(item.posterUrl, item.videoUrl);
                      const isUpload = isDirectVideo(item.videoUrl);

                      if (poster) {
                        return (
                          <img 
                            src={poster} 
                            alt={item.author} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const ytId = extractYouTubeId(item.videoUrl);
                              if (ytId && !e.currentTarget.src.includes('hqdefault')) {
                                e.currentTarget.src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                              } else {
                                e.currentTarget.style.display = 'none';
                              }
                            }}
                          />
                        );
                      } else if (isUpload) {
                        return (
                          <video 
                            src={`${item.videoUrl}#t=0.5`} 
                            preload="metadata" 
                            muted 
                            playsInline 
                            className="w-full h-full object-cover" 
                          />
                        );
                      } else {
                        return (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Video className="w-8 h-8" />
                          </div>
                        );
                      }
                    })()}

                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow">
                        <Play className="w-4 h-4 fill-slate-900 ml-0.5" />
                      </div>
                    </div>

                    {item.pillTag && (
                      <div className="absolute bottom-2.5 left-2.5 bg-white/95 text-slate-800 text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                        {item.pillTag}
                      </div>
                    )}
                  </div>

                  {/* Card Content Details */}
                  <div className="mt-3 space-y-1">
                    {item.subtitle && (
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        {item.subtitle}
                      </span>
                    )}
                    <h4 className="font-bold text-slate-900 text-xs">
                      {item.author}
                    </h4>
                    {item.quote && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        "{item.quote}"
                      </p>
                    )}
                    {item.videoUrl && (
                      <p className="text-[10px] text-purple-600 font-mono truncate pt-1">
                        🎬 {item.videoUrl}
                      </p>
                    )}

                    {item.productTitle && (
                      <div className="mt-2 p-2 bg-purple-50/80 rounded-xl border border-purple-200/60 flex items-center gap-2">
                        {item.productImage && (
                          <img src={item.productImage} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 border border-purple-100 bg-white" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold text-purple-900 truncate flex items-center gap-1">
                            <ShoppingBag className="w-3 h-3 text-purple-600 shrink-0" />
                            <span>{item.productTitle}</span>
                          </div>
                          <div className="text-[10px] text-purple-700 font-semibold">
                            Tk. {item.productPrice?.toLocaleString()} {item.productDiscountBadge && <span className="text-rose-600 font-bold ml-1">({item.productDiscountBadge})</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className={`inline-flex items-center gap-1 font-bold ${item.active !== false ? 'text-emerald-700' : 'text-slate-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${item.active !== false ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                    <span>{item.active !== false ? 'স্টোরফ্রন্টে প্রদর্শিত' : 'লুকানো রয়েছে'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="text-purple-600 hover:text-purple-700 font-bold cursor-pointer"
                  >
                    সম্পাদনা
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {editingItem ? 'ভিডিও রিভিউ সম্পাদনা করুন' : 'নতুন ভিডিও রিভিউ যোগ করুন'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    গ্রাহকের নাম, ভিডিও লিঙ্ক, কোটেশন এবং থাম্বনেইল তথ্য দিন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveFormItem} className="p-6 space-y-4 text-xs font-semibold">
              
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl flex items-center gap-2 border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Reviewer Author Name */}
                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold">
                    গ্রাহকের নাম (Reviewer Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="যেমন: ফারহানা রহমান"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-normal focus:bg-white focus:border-purple-500 outline-none"
                  />
                </div>

                {/* Pill Tag / Badge */}
                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold">
                    ব্যাজ / ট্যাগ (Pill Tag)
                  </label>
                  <input
                    type="text"
                    value={formPillTag}
                    onChange={(e) => setFormPillTag(e.target.value)}
                    placeholder="যেমন: ভেরিফাইড ক্রেতা, Benefits, Unboxing"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-normal focus:bg-white focus:border-purple-500 outline-none"
                  />
                </div>

                {/* Subtitle / Topic */}
                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold">
                    বিষয় / সাবটাইটেল (Topic / Headline)
                  </label>
                  <input
                    type="text"
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
                    placeholder="যেমন: ৫-ইন-১ ওয়াশ রেজাল্ট"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-normal focus:bg-white focus:border-purple-500 outline-none"
                  />
                </div>

                {/* Active Toggle */}
                <div className="space-y-1 flex flex-col justify-end">
                  <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                    />
                    <span className="font-bold text-slate-800">
                      স্টোরফ্রন্টে প্রদর্শন করুন (Active)
                    </span>
                  </label>
                </div>
              </div>

              {/* Review Quote / Feedback */}
              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">
                  গ্রাহকের মতামত / কোটেশন (Review Quote)
                </label>
                <textarea
                  rows={3}
                  value={formQuote}
                  onChange={(e) => setFormQuote(e.target.value)}
                  placeholder="গ্রাহকের চমৎকার প্রতিক্রিয়া বা পর্যালোচনার অংশবিশেষ লিখুন..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-normal focus:bg-white focus:border-purple-500 outline-none resize-none"
                />
              </div>

              {/* Thumbnail / Poster Image Upload */}
              <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="block text-slate-800 font-bold">
                  ১. থাম্বনেইল ছবি (Poster / Thumbnail Image)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    value={formPosterUrl}
                    onChange={(e) => setFormPosterUrl(e.target.value)}
                    placeholder="/uploads/... অথবা ইমেজ URL"
                    className="flex-1 w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-mono text-[11px]"
                  />
                  <label className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl cursor-pointer text-xs transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingPoster ? 'আপলোড হচ্ছে...' : 'ইমেজ আপলোড'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingPoster}
                      onChange={handlePosterFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {(() => {
                  const effectiveThumbnail = getVideoPosterUrl(formPosterUrl, formVideoUrl);
                  const isUpload = isDirectVideo(formVideoUrl);

                  if (effectiveThumbnail) {
                    return (
                      <div className="flex items-center gap-3 pt-2">
                        <img 
                          src={effectiveThumbnail} 
                          alt="Thumbnail Preview" 
                          className="w-14 h-20 object-cover rounded-xl border border-slate-200 shadow-xs" 
                          onError={(e) => {
                            const ytId = extractYouTubeId(formVideoUrl);
                            if (ytId && !e.currentTarget.src.includes('hqdefault')) {
                              e.currentTarget.src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                            }
                          }}
                        />
                        <div className="space-y-0.5">
                          <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {extractYouTubeId(formVideoUrl) && effectiveThumbnail.includes('youtube.com')
                              ? 'YouTube ভিডিও থেকে প্রিভিউ থাম্বনেইল সনাক্ত হয়েছে'
                              : 'থাম্বনেইল প্রিভিউ প্রস্তুত'}
                          </span>
                          {extractYouTubeId(formVideoUrl) && (
                            <p className="text-[10px] text-slate-500">
                              (ইউটিউব শর্টস বা ভিডিও থেকে অটোমেটিক প্রিভিউ থাম্বনেইল সেট করা হয়েছে)
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  } else if (isUpload) {
                    return (
                      <div className="flex items-center gap-3 pt-2">
                        <video 
                          src={`${formVideoUrl}#t=0.5`}
                          preload="metadata"
                          muted
                          playsInline
                          className="w-14 h-20 object-cover rounded-xl border border-slate-200 shadow-xs" 
                        />
                        <div className="space-y-0.5">
                          <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            আপলোডকৃত ভিডিও ফাইল থেকে প্রিভিউ ফ্রেম প্রস্তুত
                          </span>
                          <p className="text-[10px] text-slate-500">
                            (ভিডিও ফ্রেম অটোমেটিক থাম্বনেইল হিসেবে স্টোরফ্রন্টে প্রদর্শিত হবে)
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Video URL / Video File Upload */}
              <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="block text-slate-800 font-bold">
                  ২. ভিডিও ফাইল অথবা লিংক (MP4 File / YouTube URL)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    value={formVideoUrl}
                    onChange={(e) => handleVideoUrlChange(e.target.value)}
                    placeholder="https://...mp4 অথবা YouTube Shorts / Video লিংক"
                    className="flex-1 w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-mono text-[11px]"
                  />
                  <label className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl cursor-pointer text-xs transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingVideo ? 'আপলোড হচ্ছে...' : 'MP4 ভিডিও আপলোড'}</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      disabled={isUploadingVideo}
                      onChange={handleVideoFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[10px] text-slate-500">
                  💡 সরাসরি .mp4 ফাইল আপলোড করতে পারেন অথবা YouTube / Shorts / Vimeo লিংক দিলে অটোমেটিক থাম্বনেইল প্রিভিউ তৈরি হবে।
                </p>
              </div>

              {/* 3. Attach Product Section (Optional) */}
              <div className="space-y-3 p-4 bg-purple-50/50 rounded-2xl border border-purple-200/80">
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 font-bold flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-purple-600" />
                    <span>৩. প্রোডাক্ট সংযুক্ত করুন (Attach Product - Optional)</span>
                  </label>
                  {formProductId && (
                    <button
                      type="button"
                      onClick={() => handleSelectProduct('')}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-bold cursor-pointer hover:underline"
                    >
                      প্রোডাক্ট রিমুভ করুন
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-500">
                  ভিডিও কার্ডে "BUY NOW" বাটন ও প্রোডাক্ট কার্ড প্রদর্শনের জন্য স্টোর থেকে যেকোনো একটি প্রোডাক্ট নির্বাচন করুন।
                </p>

                {/* Product Picker Dropdown */}
                <div>
                  <select
                    value={formProductId}
                    onChange={(e) => handleSelectProduct(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-xs focus:border-purple-500 outline-none cursor-pointer"
                  >
                    <option value="">-- কোনো প্রোডাক্ট সংযুক্ত নেই (None) --</option>
                    {availableProducts.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.title} — Tk. {prod.price.toLocaleString()} {prod.regularPrice && prod.regularPrice > prod.price ? `(মূল্য: Tk. ${prod.regularPrice.toLocaleString()})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Attached Product Details & Preview */}
                {formProductId && (
                  <div className="pt-2 border-t border-purple-200/60 space-y-3">
                    {/* Visual Live Preview Card */}
                    <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex items-center gap-3">
                      {formProductImage ? (
                        <img
                          src={formProductImage}
                          alt={formProductTitle}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-100 shrink-0 bg-slate-50"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-bold text-slate-900 truncate">
                            {formProductTitle || 'প্রোডাক্টের নাম'}
                          </h5>
                          {formProductDiscountBadge && (
                            <span className="bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                              {formProductDiscountBadge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-black text-slate-900">
                            Tk. {Number(formProductPrice || 0).toLocaleString()}
                          </span>
                          {formProductRegularPrice && Number(formProductRegularPrice) > Number(formProductPrice || 0) && (
                            <span className="text-[10px] text-slate-400 line-through">
                              Tk. {Number(formProductRegularPrice).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
                        সংযুক্ত আছে
                      </span>
                    </div>

                    {/* Editable overrides for fine-tuning */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-0.5">বিক্রয় মূল্য (Tk.)</label>
                        <input
                          type="number"
                          value={formProductPrice}
                          onChange={(e) => setFormProductPrice(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-0.5">আগের মূল্য / Regular (Tk.)</label>
                        <input
                          type="number"
                          value={formProductRegularPrice}
                          onChange={(e) => setFormProductRegularPrice(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-0.5">ডিসকাউন্ট ব্যাজ (যেমন 20% OFF)</label>
                        <input
                          type="text"
                          value={formProductDiscountBadge}
                          onChange={(e) => setFormProductDiscountBadge(e.target.value)}
                          placeholder="20% OFF"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving || isUploadingPoster || isUploadingVideo}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'সংরক্ষণ হচ্ছে...' : editingItem ? 'পরিবর্তন সংরক্ষণ করুন' : 'যোগ করুন'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
