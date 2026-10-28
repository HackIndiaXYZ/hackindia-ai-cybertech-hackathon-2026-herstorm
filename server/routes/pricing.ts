import { Router, Request, Response } from 'express';
import { getPricingAdvice, getAllMandiRates } from '../services/pricing';

export const pricingRouter = Router();

// GET /api/pricing?crop=&price=
pricingRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const crop = String(req.query.crop || '').trim();
    const userPrice = req.query.price ? parseFloat(String(req.query.price)) : undefined;

    if (!crop) {
      res.status(400).json({
        success: false,
        message: 'Crop query parameter is required (e.g., ?crop=tomato).',
      });
      return;
    }

    const advice = await getPricingAdvice(crop, userPrice);
    res.json({
      success: true,
      ...advice,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'Pricing benchmark lookup failed.',
    });
  }
});

// GET /api/pricing/all
pricingRouter.get('/all', async (req: Request, res: Response): Promise<void> => {
  try {
    const rates = await getAllMandiRates();
    res.json({
      success: true,
      rates,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to retrieve mandi rates.',
    });
  }
});
