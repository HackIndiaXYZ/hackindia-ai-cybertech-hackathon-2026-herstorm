import { Router, Request, Response } from 'express';
import multer from 'multer';
import { gradeProduceImage, getSeasonalSuggestions } from '../services/ai';
import { requireAuth, AuthRequest } from '../middleware/auth';

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

export const aiRouter = Router();

// POST /api/ai/grade (preview or test produce grading)
aiRouter.post('/grade', upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  try {
    const crop = String(req.body.crop || req.body.name || 'produce').trim();
    let imageBuffer: Buffer | null = null;
    let mimeType = 'image/jpeg';

    if (req.file) {
      imageBuffer = req.file.buffer;
      mimeType = req.file.mimetype;
    } else if (req.body.imageBase64) {
      const base64Data = req.body.imageBase64.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
      mimeType = req.body.mimeType || 'image/jpeg';
    }

    if (!imageBuffer) {
      res.status(400).json({
        success: false,
        message: 'No image provided. Please upload an image file or provide imageBase64.',
      });
      return;
    }

    const grading = await gradeProduceImage(imageBuffer, mimeType, crop);
    res.json({
      success: true,
      grading,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'AI grading process failed.',
    });
  }
});

// POST /api/ai/suggestions
aiRouter.post('/suggestions', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userLocation = req.body.location || req.user?.address || 'Maharashtra, India';
    const currentMonth = req.body.currentMonth || new Date().toLocaleString('default', { month: 'long' });
    const pastCrops = Array.isArray(req.body.pastCrops) ? req.body.pastCrops : [];

    const suggestions = await getSeasonalSuggestions(userLocation, currentMonth, pastCrops);
    res.json({
      success: true,
      suggestions,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'Crop suggestions service failed.',
    });
  }
});
