import fs from 'fs';
import path from 'path';
import { BlacklistEntry } from '../../types';

const BLACKLIST_FILE = path.join(process.cwd(), 'prisma', 'blacklist.json');

// In-memory cache for ultra-fast lookup
let blacklistCache: BlacklistEntry[] | null = null;
const blockedPhonesSet = new Set<string>();
const blockedIpsSet = new Set<string>();

export function normalizePhoneForCheck(phone: string): string {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('880')) digits = digits.slice(2);
  else if (digits.startsWith('88')) digits = digits.slice(2);
  if (digits.length === 10 && /^1[3-9]/.test(digits)) digits = '0' + digits;
  return digits;
}

export function normalizeIpForCheck(ip: string): string {
  if (!ip) return '';
  return String(ip).trim().toLowerCase().replace(/^::ffff:/, '');
}

function rebuildSets(entries: BlacklistEntry[]) {
  blockedPhonesSet.clear();
  blockedIpsSet.clear();
  for (const item of entries) {
    if (item.type === 'phone') {
      blockedPhonesSet.add(normalizePhoneForCheck(item.value));
    } else if (item.type === 'ip') {
      blockedIpsSet.add(normalizeIpForCheck(item.value));
    }
  }
}

export function loadBlacklistFromDisk(): BlacklistEntry[] {
  try {
    if (fs.existsSync(BLACKLIST_FILE)) {
      const raw = fs.readFileSync(BLACKLIST_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        blacklistCache = parsed;
        rebuildSets(blacklistCache);
        return blacklistCache;
      }
    }
  } catch (err) {
    console.error('[blacklist] Error reading blacklist from disk:', err);
  }
  blacklistCache = [];
  rebuildSets(blacklistCache);
  return blacklistCache;
}

export function saveBlacklistToDisk(entries: BlacklistEntry[]): void {
  try {
    const dir = path.dirname(BLACKLIST_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(entries, null, 2), 'utf-8');
    blacklistCache = entries;
    rebuildSets(entries);
  } catch (err) {
    console.error('[blacklist] Failed saving blacklist to disk:', err);
  }
}

export function getBlacklist(): BlacklistEntry[] {
  if (!blacklistCache) {
    return loadBlacklistFromDisk();
  }
  return blacklistCache;
}

export function isPhoneBlocked(phone: string): { isBlocked: boolean; entry?: BlacklistEntry } {
  getBlacklist(); // Ensure initialized
  const cleanPhone = normalizePhoneForCheck(phone);
  if (!cleanPhone) return { isBlocked: false };
  if (blockedPhonesSet.has(cleanPhone)) {
    const found = blacklistCache?.find(b => b.type === 'phone' && normalizePhoneForCheck(b.value) === cleanPhone);
    return { isBlocked: true, entry: found };
  }
  return { isBlocked: false };
}

export function isIpBlocked(ip: string): { isBlocked: boolean; entry?: BlacklistEntry } {
  getBlacklist(); // Ensure initialized
  const cleanIp = normalizeIpForCheck(ip);
  if (!cleanIp || cleanIp === 'unknown' || cleanIp === '127.0.0.1' || cleanIp === '::1') {
    return { isBlocked: false };
  }
  if (blockedIpsSet.has(cleanIp)) {
    const found = blacklistCache?.find(b => b.type === 'ip' && normalizeIpForCheck(b.value) === cleanIp);
    return { isBlocked: true, entry: found };
  }
  return { isBlocked: false };
}

export function addBlacklistEntry(type: 'phone' | 'ip', value: string, reason?: string, createdBy?: string): BlacklistEntry {
  const current = getBlacklist();
  const cleanVal = type === 'phone' ? normalizePhoneForCheck(value) : normalizeIpForCheck(value);
  
  // Check if already exists
  const existing = current.find(e => e.type === type && (type === 'phone' ? normalizePhoneForCheck(e.value) : normalizeIpForCheck(e.value)) === cleanVal);
  if (existing) {
    if (reason && reason !== existing.reason) {
      existing.reason = reason;
      saveBlacklistToDisk(current);
    }
    return existing;
  }

  const newEntry: BlacklistEntry = {
    id: `blk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type,
    value: cleanVal,
    reason: reason || (type === 'phone' ? 'Fake order / spam phone' : 'Spam / bot IP address'),
    createdAt: new Date().toISOString(),
    createdBy: createdBy || 'Admin'
  };

  const updated = [newEntry, ...current];
  saveBlacklistToDisk(updated);
  return newEntry;
}

export function removeBlacklistEntry(id: string): boolean {
  const current = getBlacklist();
  const filtered = current.filter(e => e.id !== id && e.value !== id);
  if (filtered.length !== current.length) {
    saveBlacklistToDisk(filtered);
    return true;
  }
  return false;
}
