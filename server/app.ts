import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { authRouter } from './routes/auth';
import { listingsRouter } from './routes/listings';
import { pricingRouter } from './routes/pricing';
import { aiRouter } from './routes/ai';
import { ordersRouter } from './routes/orders';
import { dispatchRouter } from './routes/dispatch';
import { errorHandler } from './middleware/auth';
import { isConnectedToMongo } from './db';

export const app = express();

// Ensure uploads folder exists
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Global middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads serving
app.use('/uploads', express.static(uploadsDir));

// System health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'tracecrop-api',
    mongoConnected: isConnectedToMongo,
    timestamp: new Date().toISOString(),
  });
});

// Phase 1 Routes
app.use('/api/auth', authRouter);

// Phase 2 Routes
app.use('/api/listings', listingsRouter);
app.use('/api/pricing', pricingRouter);
app.use('/api/ai', aiRouter);

// Phase 3 Routes
app.use('/api/orders', ordersRouter);
app.use('/api/dispatch', dispatchRouter);

// Central error handler
app.use(errorHandler);
