import { Router } from 'express';
import { requireAdmin } from '../middleware/adminAuth';
import { 
  getBlacklist, 
  addBlacklistEntry, 
  removeBlacklistEntry, 
  isPhoneBlocked, 
  isIpBlocked,
  normalizePhoneForCheck,
  normalizeIpForCheck
} from '../services/blacklistService';

export const blacklistRouter = Router();

// GET all blacklisted phones and IPs (Admin only)
blacklistRouter.get('/', requireAdmin, (_req, res) => {
  const entries = getBlacklist();
  res.json({
    success: true,
    data: entries,
    metrics: {
      total: entries.length,
      phones: entries.filter(e => e.type === 'phone').length,
      ips: entries.filter(e => e.type === 'ip').length
    }
  });
});

// POST check if a phone or IP is blocked (Public endpoint used by checkout client)
blacklistRouter.post('/check', (req, res) => {
  const { phone, ip: userIp } = req.body;
  const clientIp = userIp || 
                   req.header('cf-connecting-ip') || 
                   req.header('x-forwarded-for')?.split(',')[0] || 
                   req.ip || 
                   req.socket.remoteAddress || 
                   '';

  const phoneResult = phone ? isPhoneBlocked(phone) : { isBlocked: false };
  const ipResult = clientIp ? isIpBlocked(clientIp) : { isBlocked: false };

  if (phoneResult.isBlocked) {
    return res.json({
      blocked: true,
      type: 'phone',
      message: 'এই ফোন নম্বরটি ব্লক তালিকায় রয়েছে। অর্ডার সম্পন্ন করা সম্ভব হচ্ছে না।'
    });
  }

  if (ipResult.isBlocked) {
    return res.json({
      blocked: true,
      type: 'ip',
      message: 'আপনার নেটওয়ার্ক / আইপি অ্যাড্রেস থেকে সাময়িকভাবে অর্ডার গ্রহণ স্থগিত আছে।'
    });
  }

  return res.json({ blocked: false });
});

// POST add phone or IP to blacklist (Admin only)
blacklistRouter.post('/', requireAdmin, (req, res) => {
  const { type, value, reason } = req.body;

  if (!type || !value || (type !== 'phone' && type !== 'ip')) {
    return res.status(400).json({ success: false, error: 'Invalid payload. Type must be "phone" or "ip" and value is required.' });
  }

  const adminName = (req as any).admin?.email || 'Admin';
  const entry = addBlacklistEntry(type, value, reason, adminName);

  res.json({
    success: true,
    message: `${type === 'phone' ? 'Phone number' : 'IP address'} successfully added to blacklist.`,
    data: entry
  });
});

// DELETE remove from blacklist (Admin only)
blacklistRouter.delete('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const removed = removeBlacklistEntry(id);
  if (removed) {
    res.json({ success: true, message: 'Removed from blacklist.' });
  } else {
    res.status(404).json({ success: false, error: 'Blacklist entry not found.' });
  }
});
