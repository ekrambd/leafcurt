import { VipTier, DigitalLoyaltyCard, ClubMember, EcomSettings } from '../types';
import { dbService } from './dbService';
import { DEFAULT_VIP_TIERS, DEFAULT_DIGITAL_LOYALTY_CARDS } from './constants';

const TIERS_STORAGE_KEY = 'store_vip_tiers';
const CARDS_STORAGE_KEY = 'store_digital_cards';
const MEMBERS_STORAGE_KEY = 'store_club_members';
const ACTIVE_MEMBER_SESSION_KEY = 'ecom_active_club_member';

export const loyaltyClubService = {
  // --- VIP Tiers ---
  async getVipTiers(): Promise<VipTier[]> {
    try {
      const settings = await dbService.getEcomSettings();
      if (settings?.vipTiers && settings.vipTiers.length > 0) {
        return settings.vipTiers;
      }
    } catch (e) {
      console.warn('Error reading vipTiers from dbService:', e);
    }

    try {
      const local = localStorage.getItem(TIERS_STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    return DEFAULT_VIP_TIERS;
  },

  async saveVipTiers(tiers: VipTier[]): Promise<void> {
    try {
      localStorage.setItem(TIERS_STORAGE_KEY, JSON.stringify(tiers));
      const current = await dbService.getEcomSettings();
      await dbService.saveEcomSettings({
        ...current,
        vipTiers: tiers
      });
    } catch (e) {
      console.error('Failed to save VIP tiers:', e);
    }
  },

  // --- Digital Loyalty Cards ---
  async getDigitalLoyaltyCards(): Promise<DigitalLoyaltyCard[]> {
    try {
      const settings = await dbService.getEcomSettings();
      if (settings?.digitalLoyaltyCards && settings.digitalLoyaltyCards.length > 0) {
        return settings.digitalLoyaltyCards;
      }
    } catch (e) {
      console.warn('Error reading digital cards from dbService:', e);
    }

    try {
      const local = localStorage.getItem(CARDS_STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    return DEFAULT_DIGITAL_LOYALTY_CARDS;
  },

  async saveDigitalLoyaltyCards(cards: DigitalLoyaltyCard[]): Promise<void> {
    try {
      localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards));
      const current = await dbService.getEcomSettings();
      await dbService.saveEcomSettings({
        ...current,
        digitalLoyaltyCards: cards
      });
    } catch (e) {
      console.error('Failed to save digital loyalty cards:', e);
    }
  },

  // --- Club Members ---
  async getClubMembers(): Promise<ClubMember[]> {
    try {
      const settings = await dbService.getEcomSettings();
      if (settings?.clubMembers && settings.clubMembers.length > 0) {
        return settings.clubMembers;
      }
    } catch (e) {
      console.warn('Error reading club members from dbService:', e);
    }

    try {
      const local = localStorage.getItem(MEMBERS_STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    // Seed realistic starting demo members if none exist
    const initialDemoMembers: ClubMember[] = [
      {
        id: 'mem-1',
        phone: '01711000001',
        name: 'তানভীর আহমেদ',
        memberNumber: 'LWF-VIP-892101',
        tierId: 'tier-gold',
        tierName: 'Gold VIP',
        joinedDate: 'Jan 15, 2026',
        validUntil: 'Jan 15, 2027',
        totalSpent: 16500,
        pointsBalance: 420,
        status: 'Active'
      },
      {
        id: 'mem-2',
        phone: '01819000002',
        name: 'সাদিয়া ইসলাম',
        memberNumber: 'LWF-VIP-654320',
        tierId: 'tier-silver',
        tierName: 'Silver Member',
        joinedDate: 'Feb 10, 2026',
        validUntil: 'Feb 10, 2027',
        totalSpent: 7200,
        pointsBalance: 180,
        status: 'Active'
      }
    ];

    try {
      localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(initialDemoMembers));
    } catch {}

    return initialDemoMembers;
  },

  async saveClubMembers(members: ClubMember[]): Promise<void> {
    try {
      localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members));
      const current = await dbService.getEcomSettings();
      await dbService.saveEcomSettings({
        ...current,
        clubMembers: members
      });
    } catch (e) {
      console.error('Failed to save club members:', e);
    }
  },

  // --- Member Lookup & Auto-Enrollment ---
  normalizePhone(phone: string): string {
    return (phone || '').replace(/\D/g, '').replace(/^880/, '0').replace(/^88/, '');
  },

  determineTierBySpend(totalSpent: number, tiers: VipTier[]): VipTier {
    const activeTiers = tiers
      .filter(t => t.status === 'Active')
      .sort((a, b) => b.minLifetimeSpend - a.minLifetimeSpend);

    for (const tier of activeTiers) {
      if (totalSpent >= tier.minLifetimeSpend) {
        return tier;
      }
    }

    // Default to lowest active tier
    return activeTiers[activeTiers.length - 1] || DEFAULT_VIP_TIERS[0];
  },

  async getMemberByPhone(rawPhone: string): Promise<ClubMember | null> {
    const cleanPhone = this.normalizePhone(rawPhone);
    if (!cleanPhone || cleanPhone.length !== 11) return null;

    const members = await this.getClubMembers();
    const found = members.find(m => this.normalizePhone(m.phone) === cleanPhone);
    return found || null;
  },

  async registerOrEnrollMember(
    rawPhone: string,
    name?: string,
    initialSpent: number = 0
  ): Promise<{ member: ClubMember; isNew: boolean }> {
    const cleanPhone = this.normalizePhone(rawPhone);
    if (!cleanPhone || cleanPhone.length !== 11) {
      throw new Error('Valid 11-digit mobile number is required.');
    }

    const members = await this.getClubMembers();
    const tiers = await this.getVipTiers();
    const existingIndex = members.findIndex(m => this.normalizePhone(m.phone) === cleanPhone);

    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const validUntilStr = nextYear.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (existingIndex >= 0) {
      const existing = members[existingIndex];
      const newTotalSpent = existing.totalSpent + initialSpent;
      const updatedTier = this.determineTierBySpend(newTotalSpent, tiers);

      const updatedMember: ClubMember = {
        ...existing,
        name: name?.trim() || existing.name,
        totalSpent: newTotalSpent,
        tierId: updatedTier.id,
        tierName: updatedTier.name,
        status: 'Active'
      };

      members[existingIndex] = updatedMember;
      await this.saveClubMembers(members);
      this.setActiveMemberSession(updatedMember);
      return { member: updatedMember, isNew: false };
    }

    // Register Brand New Member
    const targetTier = this.determineTierBySpend(initialSpent, tiers);
    const memberNo = `LWF-VIP-${Math.floor(100000 + Math.random() * 900000)}`;

    const newMember: ClubMember = {
      id: `mem-${Date.now()}`,
      phone: cleanPhone,
      name: name?.trim() || 'Valued Member',
      memberNumber: memberNo,
      tierId: targetTier.id,
      tierName: targetTier.name,
      joinedDate: todayStr,
      validUntil: validUntilStr,
      totalSpent: initialSpent,
      pointsBalance: 50, // Welcome Gift Points
      status: 'Active'
    };

    members.unshift(newMember);
    await this.saveClubMembers(members);
    this.setActiveMemberSession(newMember);
    return { member: newMember, isNew: true };
  },

  // Active Browser Session Storage for Instant Member State
  getActiveMemberSession(): ClubMember | null {
    try {
      const data = localStorage.getItem(ACTIVE_MEMBER_SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setActiveMemberSession(member: ClubMember | null): void {
    try {
      if (member) {
        localStorage.setItem(ACTIVE_MEMBER_SESSION_KEY, JSON.stringify(member));
      } else {
        localStorage.removeItem(ACTIVE_MEMBER_SESSION_KEY);
      }
    } catch {}
  },

  // --- Calculations for Checkout & Storefront ---
  calculateMemberBenefits(
    cartSubtotal: number,
    member: ClubMember | null,
    tiers: VipTier[],
    card: DigitalLoyaltyCard
  ) {
    if (!member || member.status !== 'Active') {
      return {
        isMember: false,
        tier: null,
        discountPercent: 0,
        discountAmount: 0,
        pointsToEarn: 0,
        effectiveCashbackPercent: ((card.earnPoints * card.pointValueTaka) / card.forSpend) * 100
      };
    }

    const currentTier = tiers.find(t => t.id === member.tierId) || tiers[0] || DEFAULT_VIP_TIERS[0];
    const discountPercent = Number(currentTier.billDiscountPercent || 0);
    const discountAmount = Math.round((cartSubtotal * discountPercent) / 100);

    const basePoints = (cartSubtotal / (card.forSpend || 100)) * (card.earnPoints || 5);
    const multiplier = Number(currentTier.pointMultiplier || 1.0);
    const pointsToEarn = Math.floor(basePoints * multiplier);

    const effectiveCashbackPercent = (((card.earnPoints * multiplier) * card.pointValueTaka) / card.forSpend) * 100;

    return {
      isMember: true,
      tier: currentTier,
      discountPercent,
      discountAmount,
      pointsToEarn,
      effectiveCashbackPercent: Number(effectiveCashbackPercent.toFixed(1))
    };
  }
};
