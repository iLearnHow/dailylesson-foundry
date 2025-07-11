export class RateLimitService {
  constructor(kv: any) {}
  async checkRateLimit(keyId: string, limit: number) { return true; }
} 