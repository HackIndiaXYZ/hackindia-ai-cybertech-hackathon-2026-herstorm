import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UserModel } from '../models/User';

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    id: string;
    name: string;
    phone: string;
    role: 'farmer' | 'fpo' | 'customer';
    address: string;
    lat: number;
    lng: number;
  };
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required. Missing or malformed token.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string; role: string };
    if (!decoded || !decoded.id) {
      res.status(401).json({ success: false, message: 'Invalid token payload.' });
      return;
    }

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      res.status(401).json({ success: false, message: 'User account not found.' });
      return;
    }

    req.user = {
      _id: String(user._id || user.id),
      id: String(user._id || user.id),
      name: user.name,
      phone: user.phone,
      role: user.role,
      address: user.address || '',
      lat: user.lat || 0,
      lng: user.lng || 0,
    };

    next();
  } catch (err: any) {
    res.status(401).json({ success: false, message: 'Session expired or token invalid.' });
  }
}

export function requireRole(...roles: Array<'farmer' | 'fpo' | 'customer'>) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user.role}' is not authorized to access this resource.`,
      });
      return;
    }

    next();
  };
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  console.error('[TraceCrop Error]', err.message || err);
  const status = err.status || 500;
  const message = err.message || 'An unexpected internal error occurred.';
  res.status(status).json({
    success: false,
    message,
  });
}
