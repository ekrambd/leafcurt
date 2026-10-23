import { Router } from 'express';
import { storeProducts, saveProductsToDisk, loadProductsFromDisk, loadOrdersFromDisk } from '../data/store';
import { Product } from '../../types';
import { cacheResponse } from '../middleware/cacheMiddleware';
import { globalCache } from '../services/cacheEngine';
import { shardService } from '../services/shardService';
import { prisma } from '../db';

export const productRouter = Router();

// Invalidate legacy cached products immediately
globalCache.invalidateTag('products');

// GET /api/products/bestsellers - Dynamic algorithm-based best sellers (week, month, all-time)
productRouter.get('/bestsellers', cacheResponse({ ttlSeconds: 30, staleWhileRevalidateSeconds: 60, tag: 'products' }), (req, res) => {
  try {
    const orders = loadOrdersFromDisk();
    const products = loadProductsFromDisk();

    const productById = new Map<string, Product>();
    const productByTitle = new Map<string, Product>();
    for (const p of products) {
      if (!p || !p.id) continue;
      productById.set(p.id, p);
      productById.set(p.id.toLowerCase(), p);
      if (p.title) {
        productByTitle.set(p.title.trim().toLowerCase(), p);
      }
    }

    const findProduct = (idOrTitle?: string): Product | undefined => {
      if (!idOrTitle) return undefined;
      const str = String(idOrTitle).trim();
      return productById.get(str) || productById.get(str.toLowerCase()) || productByTitle.get(str.toLowerCase());
    };

    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const salesWeek: Record<string, number> = {};
    const salesMonth: Record<string, number> = {};
    const salesAll: Record<string, number> = {};
    let totalSales = 0;

    for (const order of orders) {
      const statusLower = (order.status || '').toLowerCase();
      if (statusLower === 'cancelled' || statusLower === 'canceled') {
        continue;
      }

      const rawTime = order.createdAt || order.orderDate || '';
      const parsedDate = new Date(rawTime).getTime();
      const orderTime = isNaN(parsedDate) ? 0 : parsedDate;

      const isWeek = orderTime >= oneWeekAgo;
      const isMonth = orderTime >= oneMonthAgo;

      const recordItem = (idOrTitle?: string, quantity?: number) => {
        const prod = findProduct(idOrTitle);
        if (!prod || !prod.id) return;
        const qty = Math.max(1, Number(quantity) || 1);
        totalSales += qty;
        salesAll[prod.id] = (salesAll[prod.id] || 0) + qty;
        if (isMonth) {
          salesMonth[prod.id] = (salesMonth[prod.id] || 0) + qty;
        }
        if (isWeek) {
          salesWeek[prod.id] = (salesWeek[prod.id] || 0) + qty;
        }
      };

      if (Array.isArray(order.items) && order.items.length > 0) {
        for (const item of order.items) {
          const itemKey = item.productId || item.product?.id || item.id || item.product?.title || item.title;
          const qty = item.quantity || 1;
          recordItem(itemKey, qty);
        }
      } else if (order.productId || order.productTitle || order.productName) {
        recordItem(order.productId || order.productTitle || order.productName, order.quantity || 1);
      }
    }

    const rankProducts = (salesMap: Record<string, number>) => {
      return Object.entries(salesMap)
        .filter(([_, count]) => count > 0)
        .map(([id, salesCount]) => {
          const product = productById.get(id);
          if (!product) return null;
          return {
            ...product,
            salesCount
          };
        })
        .filter((p): p is (Product & { salesCount: number }) => p !== null)
        .sort((a, b) => b.salesCount - a.salesCount);
    };

    const weekRanked = rankProducts(salesWeek);
    const monthRanked = rankProducts(salesMonth);
    const allRanked = rankProducts(salesAll);

    return res.json({
      success: true,
      totalSales,
      data: {
        week: weekRanked,
        month: monthRanked,
        all: allRanked
      }
    });
  } catch (err: any) {
    console.error('[productRouter] Error calculating bestsellers:', err);
    return res.status(500).json({ success: false, totalSales: 0, data: { week: [], month: [], all: [] } });
  }
});

// GET All Products - High-speed cached with ETag, SWR & Eager Loading (Zero N+1 Queries)
productRouter.get('/', async (req, res) => {
  const includeReviews = req.query.include === 'reviews' || req.query.withReviews === 'true';
  const includeBrand = req.query.include === 'brand' || req.query.withBrand === 'true';

  let products = loadProductsFromDisk();

  // Eager load related data in a single batch query (Zero N+1 queries)
  if (includeReviews || includeBrand) {
    const productIds = products.map(p => p.id);

    const reviewsMap = new Map<string, any[]>();
    if (includeReviews) {
      try {
        const allReviews = await prisma.review.findMany({
          where: { productId: { in: productIds } }
        });
        for (const rev of allReviews) {
          if (!reviewsMap.has(rev.productId)) reviewsMap.set(rev.productId, []);
          reviewsMap.get(rev.productId)!.push(rev);
        }
      } catch {}
    }

    const brandsMap = new Map<string, any>();
    if (includeBrand) {
      try {
        const allBrands = await prisma.brand.findMany();
        for (const b of allBrands) brandsMap.set(b.id, b);
      } catch {}
    }

    products = products.map(p => ({
      ...p,
      reviews: includeReviews ? (reviewsMap.get(p.id) || []) : undefined,
      brandDetails: (includeBrand && p.brandId) ? (brandsMap.get(p.brandId) || null) : undefined
    }));
  }

  res.json(products);
});

// GET Batch Products by IDs in 1 query (Prevents N+1 frontend requests)
productRouter.get('/batch', cacheResponse({ ttlSeconds: 60, staleWhileRevalidateSeconds: 120, tag: 'products' }), (req, res) => {
  const idsQuery = (req.query.ids as string) || '';
  if (!idsQuery) return res.json([]);
  const ids = idsQuery.split(',').map(s => s.trim()).filter(Boolean);
  const currentProds = loadProductsFromDisk();
  const matched = currentProds.filter(p => ids.includes(p.id));
  res.json(matched);
});

// GET Product by ID with sharded view counter tracking
productRouter.get('/:id', cacheResponse({ ttlSeconds: 60, staleWhileRevalidateSeconds: 120, tag: 'products' }), (req, res) => {
  const { id } = req.params;
  const currentProds = loadProductsFromDisk();
  const product = currentProds.find(p => p.id === id);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  // Increment distributed sharded view counter in background
  shardService.incrementCounter(`views_${id}`, 1);

  res.json(product);
});

// POST Create Product - writes and invalidates cache
productRouter.post('/', (req, res) => {
  const newProduct: Product = {
    id: req.body.id || `prod-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...req.body
  };
  const prods = loadProductsFromDisk();
  prods.unshift(newProduct);
  saveProductsToDisk(prods);

  // Invalidate product caches across cluster
  globalCache.invalidateTag('products');

  res.status(201).json(newProduct);
});

// PUT Update Product - updates and invalidates cache
productRouter.put('/:id', (req, res) => {
  const { id } = req.params;
  const prods = loadProductsFromDisk();
  const index = prods.findIndex(p => p.id === id);
  if (index !== -1) {
    prods[index] = { ...prods[index], ...req.body };
    saveProductsToDisk(prods);

    // Invalidate product caches
    globalCache.invalidateTag('products');

    res.json(prods[index]);
  } else {
    res.status(404).json({ error: "Product not found" });
  }
});

// DELETE Product - removes and invalidates cache
productRouter.delete('/:id', (req, res) => {
  const { id } = req.params;
  const prods = loadProductsFromDisk();
  const index = prods.findIndex(p => p.id === id);
  if (index !== -1) {
    prods.splice(index, 1);
    saveProductsToDisk(prods);

    // Invalidate product caches
    globalCache.invalidateTag('products');

    res.json({ success: true, id });
  } else {
    res.status(404).json({ error: "Product not found" });
  }
});
