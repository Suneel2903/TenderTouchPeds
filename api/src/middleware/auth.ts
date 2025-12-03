import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  admin?: {
    adminId: string;
    email: string;
  };
}

export function requireAdminAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  try {
    const payload = jwt.verify(token, secret) as { adminId: string; email: string };
    req.admin = { adminId: payload.adminId, email: payload.email };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}


