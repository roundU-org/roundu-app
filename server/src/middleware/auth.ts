import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { sendError } from '../utils/response';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.header('authorization') ?? req.header('Authorization');
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    sendError(res, 401, 'UNAUTHENTICATED', 'Missing or malformed Authorization header');
    return;
  }
  const token = header.slice(7).trim();
  if (!token) {
    sendError(res, 401, 'UNAUTHENTICATED', 'Empty bearer token');
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    if (!payload.sub || !payload.role) {
      sendError(res, 401, 'UNAUTHENTICATED', 'Token payload missing required claims');
      return;
    }
    req.user = {
      sub: payload.sub,
      id: payload.sub,
      role: payload.role,
      phone: payload.phone,
    };
    next();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid token';
    sendError(res, 401, 'UNAUTHENTICATED', message);
  }
}
