import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export function requireProvider(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    sendError(res, 401, 'UNAUTHENTICATED', 'Authentication required');
    return;
  }
  if (req.user.role !== 'provider' && req.user.role !== 'admin') {
    sendError(res, 403, 'FORBIDDEN', 'Provider role required');
    return;
  }
  next();
}
