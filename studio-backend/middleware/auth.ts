import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

type JwtPayload = { uid: number; email: string };

export function signToken(payload: JwtPayload) {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const secret = process.env.JWT_SECRET || 'dev-secret';
    return jwt.verify(token, secret) as JwtPayload;
  } catch {
    return null;
  }
}

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token as string | undefined;
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'unauthorized' });
  (req as any).user = payload;
  next();
}

