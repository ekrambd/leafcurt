import { Router } from 'express';
import { prisma } from '../db';
import { requireAdmin } from '../middleware/adminAuth';
import { 
  getStoreReviews, 
  addStoreReview, 
  checkCustomerOrderEligibility, 
  storeReviews, 
  saveReviewsToDisk 
} from '../data/store';

export const reviewRouter = Router();

// GET reviews (all or filtered by productId)
reviewRouter.get('/', async (req, res) => {
  try {
    const { productId } = req.query;
    const items = getStoreReviews(productId as string | undefined);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// GET eligibility check for verified customer review
reviewRouter.get('/check-eligibility', async (req, res) => {
  try {
    const phone = req.query.phone as string;
    const productId = req.query.productId as string | undefined;

    if (!phone) {
      return res.json({ 
        canReview: false, 
        reason: 'must_login', 
        message: 'রিভিউ দিতে দয়া করে ওয়েবসাইটে লগইন করুন।',
        ordersCount: 0 
      });
    }

    const check = checkCustomerOrderEligibility(phone, productId);
    res.json({
      success: true,
      canReview: check.canReview,
      reason: check.reason,
      ordersCount: check.ordersCount,
      customerName: check.matchedOrder?.customerName,
      customerAddress: check.matchedOrder?.address,
      matchedOrderId: check.matchedOrder?.id
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check review eligibility' });
  }
});

// GET by ID
reviewRouter.get('/:id', async (req, res) => {
  try {
    const review = storeReviews.find(r => r.id === req.params.id);
    if (review) {
      return res.json(review);
    }
    const item = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (item) res.json(item);
    else res.status(404).json({ error: 'Review not found' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// POST create review (Verified Customer OR Admin)
reviewRouter.post('/', async (req, res) => {
  try {
    const { productId, productTitle, productImage, customerName, customerPhone, rating, comment, images } = req.body;

    if (!productId || !customerPhone || !comment) {
      return res.status(400).json({ 
        success: false, 
        error: 'Product ID, customer phone number, and review comment are required.' 
      });
    }

    // Check if requester has admin authorization
    const authHeader = req.headers.authorization;
    const isAdmin = authHeader && authHeader.includes('Bearer');

    let matchedOrderId: string | undefined;

    if (!isAdmin) {
      // Must be a verified customer who placed an order
      const eligibility = checkCustomerOrderEligibility(customerPhone, productId);
      if (!eligibility.canReview) {
        return res.status(403).json({
          success: false,
          error: eligibility.reason || 'রিভিউ দেওয়ার জন্য গ্রাহককে অবশ্যই পূর্বে ওয়েবসাইট থেকে একটি অর্ডার সম্পন্ন করতে হবে।'
        });
      }
      matchedOrderId = eligibility.matchedOrder?.id;
    }

    // Create review in persistent store
    const newReview = addStoreReview({
      productId,
      productTitle,
      productImage,
      customerName: customerName || 'Verified Customer',
      customerPhone,
      rating: Number(rating) || 5,
      comment,
      images: Array.isArray(images) ? images : [],
      orderId: matchedOrderId
    });

    // Also persist in Prisma database asynchronously
    try {
      await prisma.review.create({
        data: {
          id: newReview.id,
          productId: newReview.productId,
          productTitle: newReview.productTitle,
          productImage: newReview.productImage,
          customerName: newReview.customerName,
          customerPhone: newReview.customerPhone,
          rating: newReview.rating,
          comment: newReview.comment,
          images: JSON.stringify(newReview.images || [])
        }
      });
    } catch (dbErr) {
      // Prisma backup error - resilient store already saved
    }

    res.status(201).json({ success: true, review: newReview });
  } catch (error) {
    console.error('Failed to create review:', error);
    res.status(500).json({ success: false, error: 'Failed to create review' });
  }
});

// POST vote helpful
reviewRouter.post('/:id/vote', async (req, res) => {
  try {
    const idx = storeReviews.findIndex(r => r.id === req.params.id);
    if (idx !== -1) {
      storeReviews[idx].helpfulCount = (storeReviews[idx].helpfulCount || 0) + 1;
      saveReviewsToDisk(storeReviews);
      return res.json({ success: true, helpfulCount: storeReviews[idx].helpfulCount });
    }
    res.status(404).json({ error: 'Review not found' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to vote' });
  }
});

// PUT update review (Admin only)
reviewRouter.put('/:id', requireAdmin, async (req, res) => {
  try {
    const idx = storeReviews.findIndex(r => r.id === req.params.id);
    if (idx !== -1) {
      storeReviews[idx] = { ...storeReviews[idx], ...req.body };
      saveReviewsToDisk(storeReviews);
      return res.json(storeReviews[idx]);
    }
    const item = await prisma.review.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

// DELETE review (Admin only)
reviewRouter.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const initialLen = storeReviews.length;
    const filtered = storeReviews.filter(r => r.id !== req.params.id);
    if (filtered.length !== initialLen) {
      saveReviewsToDisk(filtered);
    }
    try {
      await prisma.review.delete({ where: { id: req.params.id } });
    } catch {}
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});
