import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '../middleware/adminAuth';

export const unitRouter = Router();

const UNITS_FILE = path.join(process.cwd(), 'prisma', 'units.json');

const INITIAL_UNITS = [
  { id: 'unit-pcs', name: 'Pieces', code: 'pcs', isDefault: true, description: 'Single unit or piece' },
  { id: 'unit-kg', name: 'Kilogram', code: 'kg', description: 'Weight in kilograms' },
  { id: 'unit-g', name: 'Gram', code: 'g', description: 'Weight in grams' },
  { id: 'unit-l', name: 'Liter', code: 'L', description: 'Liquid volume in liters' },
  { id: 'unit-ml', name: 'Milliliter', code: 'ml', description: 'Liquid volume in milliliters' },
  { id: 'unit-box', name: 'Box / Pack', code: 'box', description: 'Pack or packaged box' },
  { id: 'unit-pair', name: 'Pair', code: 'pair', description: 'Pair of items (shoes, socks)' },
  { id: 'unit-m', name: 'Meter', code: 'm', description: 'Length in meters' },
  { id: 'unit-set', name: 'Set', code: 'set', description: 'Complete set of items' }
];

function readUnits() {
  try {
    if (fs.existsSync(UNITS_FILE)) {
      const data = fs.readFileSync(UNITS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_UNITS;
}

function writeUnits(units: any[]) {
  try {
    const dir = path.dirname(UNITS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(UNITS_FILE, JSON.stringify(units, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write units.json:', err);
  }
}

// GET all units
unitRouter.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const items = readUnits();
  res.json(items);
});

// POST upsert unit
unitRouter.post('/', requireAdmin, (req, res) => {
  try {
    const body = req.body || {};
    const id = body.id || `unit-${Date.now()}`;
    const name = (body.name || '').trim();
    const code = (body.code || '').trim();

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    const items = readUnits();
    const existingIdx = items.findIndex((u: any) => u.id === id || u.code.toLowerCase() === code.toLowerCase());
    const newUnit = {
      id,
      name,
      code,
      description: body.description || '',
      isDefault: Boolean(body.isDefault)
    };

    if (existingIdx >= 0) {
      items[existingIdx] = newUnit;
    } else {
      items.push(newUnit);
    }

    writeUnits(items);
    res.status(201).json(newUnit);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save unit' });
  }
});

// POST batch
unitRouter.post('/batch', requireAdmin, (req, res) => {
  try {
    if (Array.isArray(req.body)) {
      writeUnits(req.body);
      return res.json({ success: true, count: req.body.length });
    }
    res.status(400).json({ error: 'Expected array of units' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE unit
unitRouter.delete('/:id', requireAdmin, (req, res) => {
  try {
    const id = req.params.id;
    const items = readUnits();
    const filtered = items.filter((u: any) => u.id !== id && u.code !== id);
    writeUnits(filtered);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete unit' });
  }
});
