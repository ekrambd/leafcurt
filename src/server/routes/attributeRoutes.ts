import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '../middleware/adminAuth';

export const attributeRouter = Router();

const ATTR_FILE = path.join(process.cwd(), 'prisma', 'attributes.json');

const INITIAL_ATTRIBUTES = [
  {
    id: 'attr-size',
    name: 'Size',
    type: 'select',
    description: 'Clothing & Footwear sizes',
    values: [
      { id: 'val-s', name: 'S' },
      { id: 'val-m', name: 'M' },
      { id: 'val-l', name: 'L' },
      { id: 'val-xl', name: 'XL' },
      { id: 'val-xxl', name: 'XXL' },
      { id: 'val-free', name: 'Free Size' }
    ]
  },
  {
    id: 'attr-color',
    name: 'Color',
    type: 'color',
    description: 'Color variants',
    values: [
      { id: 'val-black', name: 'Black', code: '#000000' },
      { id: 'val-white', name: 'White', code: '#FFFFFF' },
      { id: 'val-red', name: 'Red', code: '#EF4444' },
      { id: 'val-blue', name: 'Blue', code: '#3B82F6' },
      { id: 'val-green', name: 'Green', code: '#10B981' },
      { id: 'val-navy', name: 'Navy Blue', code: '#1E3A8A' },
      { id: 'val-maroon', name: 'Maroon', code: '#831843' },
      { id: 'val-gray', name: 'Gray', code: '#6B7280' }
    ]
  },
  {
    id: 'attr-weight',
    name: 'Weight',
    type: 'select',
    description: 'Grocery & Spices weight increments',
    values: [
      { id: 'val-250g', name: '250 g' },
      { id: 'val-500g', name: '0.5 kg (500g)' },
      { id: 'val-1kg', name: '1 kg' },
      { id: 'val-2kg', name: '2 kg' },
      { id: 'val-5kg', name: '5 kg' }
    ]
  },
  {
    id: 'attr-pattern',
    name: 'Pattern',
    type: 'select',
    description: 'Fabric & Design patterns',
    values: [
      { id: 'val-plain', name: 'Plain / Solid' },
      { id: 'val-striped', name: 'Striped' },
      { id: 'val-printed', name: 'Printed' },
      { id: 'val-check', name: 'Checkered' },
      { id: 'val-floral', name: 'Floral' },
      { id: 'val-embroidered', name: 'Embroidered' }
    ]
  },
  {
    id: 'attr-material',
    name: 'Material',
    type: 'select',
    description: 'Fabric & Build composition',
    values: [
      { id: 'val-cotton', name: '100% Cotton' },
      { id: 'val-silk', name: 'Silk' },
      { id: 'val-linen', name: 'Linen' },
      { id: 'val-denim', name: 'Denim' },
      { id: 'val-leather', name: 'Genuine Leather' },
      { id: 'val-georgette', name: 'Georgette' }
    ]
  }
];

function readAttributes() {
  try {
    if (fs.existsSync(ATTR_FILE)) {
      const data = fs.readFileSync(ATTR_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_ATTRIBUTES;
}

function writeAttributes(attrs: any[]) {
  try {
    const dir = path.dirname(ATTR_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(ATTR_FILE, JSON.stringify(attrs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write attributes.json:', err);
  }
}

// GET all attributes
attributeRouter.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const items = readAttributes();
  res.json(items);
});

// POST upsert attribute
attributeRouter.post('/', requireAdmin, (req, res) => {
  try {
    const body = req.body || {};
    const id = body.id || `attr-${Date.now()}`;
    const name = (body.name || '').trim();

    if (!name) {
      return res.status(400).json({ error: 'Attribute name is required' });
    }

    const items = readAttributes();
    const existingIdx = items.findIndex((a: any) => a.id === id || a.name.toLowerCase() === name.toLowerCase());
    const newAttr = {
      id,
      name,
      type: body.type || 'select',
      description: body.description || '',
      values: Array.isArray(body.values) ? body.values : []
    };

    if (existingIdx >= 0) {
      items[existingIdx] = newAttr;
    } else {
      items.push(newAttr);
    }

    writeAttributes(items);
    res.status(201).json(newAttr);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save attribute' });
  }
});

// POST batch
attributeRouter.post('/batch', requireAdmin, (req, res) => {
  try {
    if (Array.isArray(req.body)) {
      writeAttributes(req.body);
      return res.json({ success: true, count: req.body.length });
    }
    res.status(400).json({ error: 'Expected array of attributes' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE attribute
attributeRouter.delete('/:id', requireAdmin, (req, res) => {
  try {
    const id = req.params.id;
    const items = readAttributes();
    const filtered = items.filter((a: any) => a.id !== id && a.name.toLowerCase() !== id.toLowerCase());
    writeAttributes(filtered);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete attribute' });
  }
});
