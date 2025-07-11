export class AuthService {
  constructor(db: any) {}
  async authenticate() { return true; }
  async validateAPIKey(apiKey: string) { return { key_id: 'mock', rate_limit_per_hour: 1000 }; }
} 