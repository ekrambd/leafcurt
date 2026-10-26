import { Router } from 'express';
import { requireAdmin } from '../middleware/adminAuth';
import { storeSettings, updateStoreSettings, storeProducts } from '../data/store';
import { VideoReviewItem, VideoReviewsSettings } from '../../types';

export const videoReviewRouter = Router();

function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  const match = url.trim().match(/(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([\w-]{11})/i);
  return match ? match[1] : null;
}

function resolvePosterUrl(posterUrl?: string, videoUrl?: string): string {
  if (posterUrl && posterUrl.trim()) return posterUrl.trim();
  const ytId = extractYouTubeId(videoUrl);
  if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  return '';
}

function enrichItemWithProduct(item: Partial<VideoReviewItem>): VideoReviewItem {
  const posterUrl = resolvePosterUrl(item.posterUrl, item.videoUrl);
  let productId = item.productId || undefined;
  let productTitle = item.productTitle || undefined;
  let productPrice = item.productPrice !== undefined ? Number(item.productPrice) : undefined;
  let productRegularPrice = item.productRegularPrice !== undefined ? Number(item.productRegularPrice) : undefined;
  let productImage = item.productImage || undefined;
  let productDiscountBadge = item.productDiscountBadge || undefined;
  let productUrl = item.productUrl || undefined;

  // Auto-fill from product catalog if productId is provided
  if (productId) {
    const matchedProduct = (storeProducts || []).find(p => p.id === productId);
    if (matchedProduct) {
      if (!productTitle) productTitle = matchedProduct.title;
      if (productPrice === undefined) productPrice = matchedProduct.price;
      if (productRegularPrice === undefined && matchedProduct.regularPrice) productRegularPrice = matchedProduct.regularPrice;
      if (!productImage) productImage = (Array.isArray(matchedProduct.images) && matchedProduct.images[0]) || matchedProduct.image;
      if (!productDiscountBadge && productRegularPrice && productRegularPrice > (productPrice || 0)) {
        const discountPercent = Math.round((1 - (productPrice || 0) / productRegularPrice) * 100);
        if (discountPercent > 0) productDiscountBadge = `${discountPercent}% OFF`;
      }
    }
  }

  return {
    id: item.id || `vr-${Date.now()}`,
    author: item.author || 'Reviewer',
    pillTag: item.pillTag || '',
    subtitle: item.subtitle || '',
    quote: item.quote || '',
    posterUrl,
    videoUrl: item.videoUrl || '',
    active: item.active !== false,
    productId,
    productTitle,
    productPrice,
    productRegularPrice,
    productImage,
    productDiscountBadge,
    productUrl
  };
}

// GET video reviews settings & items
videoReviewRouter.get('/', (_req, res) => {
  const videoSettings: VideoReviewsSettings = storeSettings.videoReviews || {
    enabled: true,
    items: []
  };

  const resolvedItems = (videoSettings.items || []).map(enrichItemWithProduct);

  res.json({
    enabled: videoSettings.enabled ?? true,
    items: resolvedItems
  });
});

// POST a new video review item
videoReviewRouter.post('/', requireAdmin, (req, res) => {
  try {
    const currentSettings = storeSettings.videoReviews || { enabled: true, items: [] };
    const currentItems: VideoReviewItem[] = [...(currentSettings.items || [])];

    const newItem = enrichItemWithProduct(req.body);
    currentItems.push(newItem);

    const updated = updateStoreSettings({
      videoReviews: {
        ...currentSettings,
        items: currentItems
      }
    });

    res.status(201).json({ success: true, item: newItem, settings: updated.videoReviews });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add video review' });
  }
});

// PUT update a specific video review item by id
videoReviewRouter.put('/:id', requireAdmin, (req, res) => {
  try {
    const currentSettings = storeSettings.videoReviews || { enabled: true, items: [] };
    const currentItems: VideoReviewItem[] = [...(currentSettings.items || [])];

    const index = currentItems.findIndex(i => i.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Video review not found' });
    }

    currentItems[index] = enrichItemWithProduct({
      ...currentItems[index],
      ...req.body,
      id: req.params.id
    });

    const updated = updateStoreSettings({
      videoReviews: {
        ...currentSettings,
        items: currentItems
      }
    });

    res.json({ success: true, item: currentItems[index], settings: updated.videoReviews });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update video review' });
  }
});

// DELETE a specific video review item by id
videoReviewRouter.delete('/:id', requireAdmin, (req, res) => {
  try {
    const currentSettings = storeSettings.videoReviews || { enabled: true, items: [] };
    const filteredItems = (currentSettings.items || []).filter(i => i.id !== req.params.id);

    const updated = updateStoreSettings({
      videoReviews: {
        ...currentSettings,
        items: filteredItems
      }
    });

    res.json({ success: true, settings: updated.videoReviews });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete video review' });
  }
});

// PUT update settings (toggle enable/disable or bulk reorder items)
videoReviewRouter.put('/', requireAdmin, (req, res) => {
  try {
    const currentSettings = storeSettings.videoReviews || { enabled: true, items: [] };
    const rawItems: VideoReviewItem[] = req.body.items || currentSettings.items || [];
    const resolvedItems = rawItems.map(enrichItemWithProduct);

    const newSettings: VideoReviewsSettings = {
      ...currentSettings,
      ...req.body,
      items: resolvedItems
    };

    const updated = updateStoreSettings({
      videoReviews: newSettings
    });

    res.json({ success: true, settings: updated.videoReviews });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save video reviews settings' });
  }
});
