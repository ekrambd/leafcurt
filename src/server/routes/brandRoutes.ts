import { Router } from 'express';
import { prisma } from '../db';
import { requireAdmin } from '../middleware/adminAuth';
import { globalCache } from '../services/cacheEngine';

export const brandRouter = Router();

// GET all brands - Always fresh
brandRouter.get('/', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  try {
    const items = await prisma.brand.findMany();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

// GET by ID
brandRouter.get('/:id', async (req, res) => {
  try {
    const item = await prisma.brand.findUnique({ where: { id: req.params.id } });
    if (item) res.json(item);
    else res.status(404).json({ error: 'Not found' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// POST create or upsert
brandRouter.post('/', requireAdmin, async (req, res) => {
  try {
    const id = req.body.id || `brand-${Date.now()}`;
    const data = {
      name: req.body.name,
      logo: req.body.logo || null,
      description: req.body.description || null,
      website: req.body.website || null
    };

    const item = await prisma.brand.upsert({
      where: { id },
      update: data,
      create: { id, ...data }
    });

    globalCache.invalidateTag('brands');
    res.status(201).json(item);
  } catch (error: any) {
    console.error('Failed to save brand:', error);
    res.status(500).json({ error: error.message || 'Failed to save brand' });
  }
});

// PUT update
brandRouter.put('/:id', requireAdmin, async (req, res) => {
  try {
    const item = await prisma.brand.update({
      where: { id: req.params.id },
      data: req.body
    });
    globalCache.invalidateTag('brands');
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

// DELETE
brandRouter.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.brand.deleteMany({ where: { id: req.params.id } });
    globalCache.invalidateTag('brands');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});
