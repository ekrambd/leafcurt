import { Router } from 'express';
import { prisma } from '../db';
import { requireAdmin } from '../middleware/adminAuth';
import { globalCache } from '../services/cacheEngine';

export const couponRouter = Router();

// GET all coupons - Always fresh
couponRouter.get('/', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  try {
    const items = await prisma.coupon.findMany();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// GET by ID
couponRouter.get('/:id', async (req, res) => {
  try {
    const item = await prisma.coupon.findUnique({ where: { id: req.params.id } });
    if (item) res.json(item);
    else res.status(404).json({ error: 'Not found' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// POST create or upsert
couponRouter.post('/', requireAdmin, async (req, res) => {
  try {
    const data = { ...req.body };
    const id = data.id || `cpn_${Date.now()}`;
    const code = (data.code || '').trim().toUpperCase();
    
    // Parse date if string
    let endDate: Date | undefined = undefined;
    if (data.endDate) {
      const parsed = new Date(data.endDate);
      if (!isNaN(parsed.getTime())) endDate = parsed;
    }

    const couponPayload: any = {
      code,
      title: data.title || code,
      discount: Number(data.discount || 0),
      maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : null,
      minimumSpent: data.minimumSpent ? Number(data.minimumSpent) : null,
      usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
      usageCount: Number(data.usageCount || 0),
      endDate: endDate || null,
      type: data.type || 'fixed',
      status: data.status || 'Active',
      visibility: data.visibility || 'Public',
      oncePerCustomer: Boolean(data.oncePerCustomer),
      description: data.description || null
    };

    // Check if coupon with same id or code already exists
    const existing = await prisma.coupon.findFirst({
      where: {
        OR: [
          { id },
          { code }
        ]
      }
    });

    let item;
    if (existing) {
      item = await prisma.coupon.update({
        where: { id: existing.id },
        data: couponPayload
      });
    } else {
      item = await prisma.coupon.create({
        data: {
          id,
          ...couponPayload
        }
      });
    }

    globalCache.invalidateTag('coupons');
    res.status(201).json(item);
  } catch (error: any) {
    console.error('Failed to create/update coupon:', error);
    res.status(500).json({ error: error.message || 'Failed to create coupon' });
  }
});

// PUT update
couponRouter.put('/:id', requireAdmin, async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.endDate && typeof data.endDate === 'string') {
      const parsed = new Date(data.endDate);
      if (!isNaN(parsed.getTime())) data.endDate = parsed;
    }
    const item = await prisma.coupon.update({
      where: { id: req.params.id },
      data
    });
    globalCache.invalidateTag('coupons');
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

// DELETE
couponRouter.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.coupon.deleteMany({
      where: {
        OR: [
          { id: req.params.id },
          { code: req.params.id }
        ]
      }
    });
    globalCache.invalidateTag('coupons');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});
