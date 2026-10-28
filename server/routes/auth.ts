import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UserModel } from '../models/User';
import { requireAuth, AuthRequest } from '../middleware/auth';

export const authRouter = Router();

// POST /api/auth/signup
authRouter.post('/signup', async (req, res): Promise<void> => {
  try {
    const { name, phone, password, role, address, lat, lng } = req.body;

    if (!name || !phone || !password || !role) {
      res.status(400).json({
        success: false,
        message: 'Name, phone number, password, and role are required.',
      });
      return;
    }

    const cleanPhone = String(phone).trim().replace(/\s+/g, '');
    if (cleanPhone.length < 10) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number.',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
      return;
    }

    if (!['farmer', 'fpo', 'customer'].includes(role)) {
      res.status(400).json({
        success: false,
        message: "Role must be 'farmer', 'fpo', or 'customer'.",
      });
      return;
    }

    const existingUser = await UserModel.findOne({ phone: cleanPhone });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'An account with this phone number already exists.',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await UserModel.create({
      name: String(name).trim(),
      phone: cleanPhone,
      passwordHash,
      role,
      address: String(address || '').trim(),
      lat: typeof lat === 'number' ? lat : 0,
      lng: typeof lng === 'number' ? lng : 0,
      createdAt: new Date(),
    });

    const userId = String(newUser._id || newUser.id);
    const token = jwt.sign({ id: userId, role: newUser.role }, config.jwtSecret, {
      expiresIn: '7d',
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        _id: userId,
        name: newUser.name,
        phone: newUser.phone,
        role: newUser.role,
        address: newUser.address,
        lat: newUser.lat,
        lng: newUser.lng,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'Signup failed due to internal error.',
    });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req, res): Promise<void> => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      res.status(400).json({
        success: false,
        message: 'Phone number and password are required.',
      });
      return;
    }

    const cleanPhone = String(phone).trim().replace(/\s+/g, '');
    const user = await UserModel.findOne({ phone: cleanPhone });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid phone number or password.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid phone number or password.',
      });
      return;
    }

    const userId = String(user._id || user.id);
    const token = jwt.sign({ id: userId, role: user.role }, config.jwtSecret, {
      expiresIn: '7d',
    });

    res.json({
      success: true,
      token,
      user: {
        id: userId,
        _id: userId,
        name: user.name,
        phone: user.phone,
        role: user.role,
        address: user.address,
        lat: user.lat,
        lng: user.lng,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'Login failed due to internal error.',
    });
  }
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, (req: AuthRequest, res: Response): void => {
  res.json({
    success: true,
    user: req.user,
  });
});
