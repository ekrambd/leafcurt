import { Router } from 'express';
import { requireAdmin } from '../middleware/adminAuth';
import { storeSettings, updateStoreSettings, storeProducts } from '../data/store';
import { HeroBannerItem } from '../../types';

export const sliderRouter = Router();

function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  const match = url.trim().match(/(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([\w-]{11})/i);
  return match ? match[1] : null;
}

function resolveBannerMedia(banner: Partial<HeroBannerItem>): HeroBannerItem {
  const isVideo = banner.mediaType === 'video';
  const ytId = isVideo ? extractYouTubeId(banner.youtubeUrl || banner.videoUrl) : null;
  let videoUrl = banner.videoUrl || '';
  let youtubeUrl = banner.youtubeUrl || '';

  if (ytId && !youtubeUrl) {
    youtubeUrl = `https://www.youtube.com/watch?v=${ytId}`;
  }

  let imageUrl = banner.imageUrl || '';
  if (isVideo && !imageUrl && ytId) {
    imageUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }

  // Linked Product resolution
  let productId = banner.productId || undefined;
  if (productId) {
    const matched = (storeProducts || []).find(p => p.id === productId);
    if (matched && !banner.title && !isVideo) {
      banner.title = matched.title;
    }
  }

  return {
    id: banner.id || `hb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: isVideo ? '' : (banner.title || ''),
    subtitle: isVideo ? '' : (banner.subtitle || ''),
    badge: isVideo ? '' : (banner.badge || ''),
    discountText: isVideo ? '' : (banner.discountText || ''),
    showDiscount: Boolean(banner.showDiscount),
    imageOnly: isVideo ? true : Boolean(banner.imageOnly),
    bgGradient: banner.bgGradient || 'from-slate-900 via-rose-950 to-slate-900',
    imageUrl,
    mobileImageUrl: banner.mobileImageUrl || '',
    link: banner.link || '',
    actionType: banner.actionType || (productId ? 'product' : 'external'),
    productId,
    mediaType: isVideo ? 'video' : 'image',
    videoType: banner.videoType || (ytId ? 'youtube' : 'file'),
    videoUrl,
    youtubeUrl,
    buttonText: banner.buttonText || 'BUY NOW',
    secondaryButtonText: banner.secondaryButtonText || '',
    secondaryButtonLink: banner.secondaryButtonLink || '',
    durationSeconds: banner.durationSeconds ? Number(banner.durationSeconds) : undefined
  };
}

// GET /api/sliders (Fetch hero banners, video banners and timing intervals)
sliderRouter.get('/', (_req, res) => {
  try {
    const heroBanners = (storeSettings.heroBanners || []).map(resolveBannerMedia);
    const heroSliderInterval = storeSettings.heroSliderInterval || 5;
    const heroVideoInterval = storeSettings.heroVideoInterval || 10;

    res.json({
      success: true,
      heroBanners,
      items: heroBanners, // Alias for convenience
      heroSliderInterval,
      heroVideoInterval
    });
  } catch (error) {
    console.error('[sliderRouter] GET / error:', error);
    res.status(500).json({ error: 'Failed to fetch sliders' });
  }
});

// GET /api/sliders/:id
sliderRouter.get('/:id', (req, res) => {
  const heroBanners = storeSettings.heroBanners || [];
  const found = heroBanners.find(b => b.id === req.params.id);
  if (found) {
    res.json({ success: true, item: resolveBannerMedia(found) });
  } else {
    res.status(404).json({ error: 'Banner not found' });
  }
});

// POST /api/sliders (Add new banner / video)
sliderRouter.post('/', requireAdmin, (req, res) => {
  try {
    const currentBanners = [...(storeSettings.heroBanners || [])];
    const newBanner = resolveBannerMedia(req.body);
    currentBanners.push(newBanner);

    const updated = updateStoreSettings({
      heroBanners: currentBanners
    });

    res.status(201).json({
      success: true,
      item: newBanner,
      heroBanners: updated.heroBanners || [],
      heroSliderInterval: updated.heroSliderInterval || 5,
      heroVideoInterval: updated.heroVideoInterval || 10
    });
  } catch (error) {
    console.error('[sliderRouter] POST / error:', error);
    res.status(500).json({ error: 'Failed to create slider' });
  }
});

// PUT /api/sliders/:id (Update specific banner / video)
sliderRouter.put('/:id', requireAdmin, (req, res) => {
  try {
    const currentBanners = [...(storeSettings.heroBanners || [])];
    const index = currentBanners.findIndex(b => b.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    const updatedBanner = resolveBannerMedia({
      ...currentBanners[index],
      ...req.body,
      id: req.params.id
    });

    currentBanners[index] = updatedBanner;

    const updated = updateStoreSettings({
      heroBanners: currentBanners
    });

    res.json({
      success: true,
      item: updatedBanner,
      heroBanners: updated.heroBanners || [],
      heroSliderInterval: updated.heroSliderInterval || 5,
      heroVideoInterval: updated.heroVideoInterval || 10
    });
  } catch (error) {
    console.error('[sliderRouter] PUT /:id error:', error);
    res.status(500).json({ error: 'Failed to update slider' });
  }
});

// DELETE /api/sliders/:id (Delete banner / video)
sliderRouter.delete('/:id', requireAdmin, (req, res) => {
  try {
    const currentBanners = (storeSettings.heroBanners || []).filter(b => b.id !== req.params.id);

    const updated = updateStoreSettings({
      heroBanners: currentBanners
    });

    res.json({
      success: true,
      heroBanners: updated.heroBanners || [],
      heroSliderInterval: updated.heroSliderInterval || 5,
      heroVideoInterval: updated.heroVideoInterval || 10
    });
  } catch (error) {
    console.error('[sliderRouter] DELETE /:id error:', error);
    res.status(500).json({ error: 'Failed to delete slider' });
  }
});

// PUT /api/sliders (Bulk save all banners, reordering, and timing intervals)
sliderRouter.put('/', requireAdmin, (req, res) => {
  try {
    const rawBanners: HeroBannerItem[] = req.body.heroBanners || req.body.items || storeSettings.heroBanners || [];
    const resolvedBanners = rawBanners.map(resolveBannerMedia);

    const updated = updateStoreSettings({
      heroBanners: resolvedBanners,
      heroSliderInterval: req.body.heroSliderInterval !== undefined ? Number(req.body.heroSliderInterval) : (storeSettings.heroSliderInterval || 5),
      heroVideoInterval: req.body.heroVideoInterval !== undefined ? Number(req.body.heroVideoInterval) : (storeSettings.heroVideoInterval || 10)
    });

    res.json({
      success: true,
      heroBanners: updated.heroBanners || [],
      heroSliderInterval: updated.heroSliderInterval || 5,
      heroVideoInterval: updated.heroVideoInterval || 10
    });
  } catch (error) {
    console.error('[sliderRouter] PUT / error:', error);
    res.status(500).json({ error: 'Failed to save slider settings' });
  }
});
