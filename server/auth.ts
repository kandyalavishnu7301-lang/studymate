import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, User } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'studymate_secure_jwt_secret_token_2026_dev';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function verifyToken(token: string): { id: string; email: string; name: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string };
    return decoded;
  } catch (err) {
    return null;
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Authentication token is missing' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    return;
  }

  const user = db.getData().users.find((u) => u.id === decoded.id);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized: User account not found' });
    return;
  }

  req.user = user;
  next();
}

export function sanitizeUser(user: User) {
  const { passwordHash, ...rest } = user;
  return rest;
}
