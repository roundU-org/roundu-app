export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        id: string;
        role: 'customer' | 'provider' | 'admin';
        phone?: string;
      };
      requestId?: string;
    }
  }
}
