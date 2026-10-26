import { Router } from 'express';
import { prisma } from '../db';
import { requireAdmin } from '../middleware/adminAuth';
import { storeSettings } from '../data/store';

export const categoryRouter = Router();

// GET all categories
categoryRouter.get('/', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  try {
    const items = await prisma.category.findMany();
    if (items && items.length > 0) {
      return res.json(items);
    }
    if (storeSettings.categoryItems && storeSettings.categoryItems.length > 0) {
      return res.json(storeSettings.categoryItems);
    }
    if (storeSettings.categories && storeSettings.categories.length > 0) {
      return res.json(storeSettings.categories.map((c, idx) => ({
        id: `cat-${idx}`,
        name: c,
        order: idx,
        subcategories: []
      })));
    }
    res.json([]);
  } catch (error) {
    if (storeSettings.categoryItems && storeSettings.categoryItems.length > 0) {
      return res.json(storeSettings.categoryItems);
    }
    if (storeSettings.categories && storeSettings.categories.length > 0) {
      return res.json(storeSettings.categories.map((c, idx) => ({
        id: `cat-${idx}`,
        name: c,
        order: idx,
        subcategories: []
      })));
    }
    res.json([]);
  }
});

// GET by ID
categoryRouter.get('/:id', async (req, res) => {
  try {
    const item = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (item) res.json(item);
    else res.status(404).json({ error: 'Not found' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// POST create
categoryRouter.post('/', requireAdmin, async (req, res) => {
  try {
    const item = await prisma.category.create({ data: req.body });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create' });
  }
});

// PUT update
categoryRouter.put('/:id', requireAdmin, async (req, res) => {
  try {
    const item = await prisma.category.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

// DELETE
categoryRouter.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});
