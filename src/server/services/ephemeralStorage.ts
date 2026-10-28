/**
 * High-Throughput Ephemeral Storage & Data Structures
 *
 * Designed for big-data scalability:
 * 1. Bounded Circular RingBuffer (O(1) amortized, memory-capped event storage)
 * 2. OTP Token Store with strict TTL & Brute-Force Rate Limiting
 * 3. Automatic Periodic TTL Garbage Collection (prevents memory and disk leaks)
 */

export interface SystemEvent {
  id: string;
  type: string;
  timestamp: number;
  data: Record<string, unknown>;
}

/**
 * High-performance Circular Ring Buffer
 * Memory bounded: Never exceeds `capacity`.
 * Operations:
 *   push: O(1)
 *   toArray: O(K) where K is current items count
 */
export class RingBuffer<T> {
  private buffer: (T | undefined)[];
  private capacity: number;
  private head = 0;
  private size = 0;

  constructor(capacity = 5000) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  public push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this.size < this.capacity) {
      this.size++;
    }
  }

  public toArray(): T[] {
    const result: T[] = [];
    const start = (this.head - this.size + this.capacity) % this.capacity;
    for (let i = 0; i < this.size; i++) {
      const idx = (start + i) % this.capacity;
      const val = this.buffer[idx];
      if (val !== undefined) {
        result.push(val);
      }
    }
    return result;
  }

  public getSize(): number {
    return this.size;
  }

  public clear(): void {
    this.buffer = new Array(this.capacity);
    this.head = 0;
    this.size = 0;
  }
}

/**
 * Event Storage using Ring Buffer
 */
export const globalEventStream = new RingBuffer<SystemEvent>(10000);

export function recordSystemEvent(type: string, data: Record<string, unknown> = {}): void {
  globalEventStream.push({
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    timestamp: Date.now(),
    data
  });
}

/**
 * OTP Token Manager with Strict TTL and Attempt Throttling
 */
export interface OtpRecord {
  phone: string;
  code: string;
  expiresAt: number; // epoch ms
  attempts: number;
  maxAttempts: number;
  verified: boolean;
  createdAt: number;
}

export class OtpStore {
  private records: Map<string, OtpRecord> = new Map();
  private readonly defaultTtlMs: number;

  constructor(ttlMinutes = 5) {
    this.defaultTtlMs = ttlMinutes * 60 * 1000;

    // Run automatic garbage collection every 2 minutes
    const gcTimer = setInterval(() => this.pruneExpired(), 120000);
    if (typeof gcTimer.unref === 'function') {
      gcTimer.unref();
    }
  }

  public generateOtp(phone: string, length = 6): string {
    const cleanPhone = phone.replace(/\D/g, '');
    const code = Math.floor(100000 + Math.random() * 900000).toString().slice(0, length);
    const now = Date.now();

    this.records.set(cleanPhone, {
      phone: cleanPhone,
      code,
      expiresAt: now + this.defaultTtlMs,
      attempts: 0,
      maxAttempts: 3,
      verified: false,
      createdAt: now
    });

    recordSystemEvent('otp_generated', { phone: cleanPhone.slice(-4) });
    return code;
  }

  public verifyOtp(phone: string, inputCode: string): { success: boolean; message: string } {
    const cleanPhone = phone.replace(/\D/g, '');
    const record = this.records.get(cleanPhone);

    if (!record) {
      return { success: false, message: 'OTP not requested or already expired.' };
    }

    if (Date.now() > record.expiresAt) {
      this.records.delete(cleanPhone);
      return { success: false, message: 'OTP has expired. Please request a new one.' };
    }

    if (record.attempts >= record.maxAttempts) {
      this.records.delete(cleanPhone);
      return { success: false, message: 'Too many incorrect attempts. Please request a new OTP.' };
    }

    record.attempts++;

    if (record.code !== inputCode.trim()) {
      return {
        success: false,
        message: `Incorrect OTP. ${record.maxAttempts - record.attempts} attempts remaining.`
      };
    }

    record.verified = true;
    this.records.delete(cleanPhone); // Invalidate immediately after successful verification
    recordSystemEvent('otp_verified', { phone: cleanPhone.slice(-4) });

    return { success: true, message: 'OTP verified successfully.' };
  }

  public pruneExpired(): number {
    const now = Date.now();
    let pruned = 0;
    for (const [phone, rec] of this.records.entries()) {
      if (now > rec.expiresAt) {
        this.records.delete(phone);
        pruned++;
      }
    }
    return pruned;
  }
}

export const otpStore = new OtpStore(5);
