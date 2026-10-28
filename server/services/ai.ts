import { GoogleGenAI } from '@google/genai';
import { config } from '../config';

export interface GradingResult {
  grade: 'A' | 'B' | 'C';
  reason: string;
  confidence: number;
  source: 'gemini' | 'fallback';
  isAutoRejected: boolean;
}

export interface CropSuggestion {
  title: string;
  category: string;
  expectedYieldWeeks: string;
  marketDemand: string;
  reason: string;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
  apiKey,
  httpOptions: {
    timeout: 30000, // 3 minutes
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});
}

/**
 * Grade agricultural produce using Google Gemini Vision API,
 * with deterministic graceful fallback if offline or unkeyed.
 */
export async function gradeProduceImage(
  imageBuffer: Buffer,
  mimeType: string,
  declaredCrop: string
): Promise<GradingResult> {
  const ai = getGeminiClient();

  if (!ai) {
    return runFallbackGrading(imageBuffer, declaredCrop, 'Gemini API key not configured.');
  }

  try {
    const base64Data = imageBuffer.toString('base64');
    const prompt = `You are a certified agricultural quality grading inspector for the TraceCrop marketplace.
The farmer declared this produce as: "${declaredCrop}".
Analyze the image carefully and assess:
1. Does the image depict the declared crop (${declaredCrop})? If not, grade must be "C" with reason stating crop mismatch.
2. Freshness, natural colouration, skin firmness, and harvest viability.
3. Presence of rot, mold, wilting, severe bruising, or pest infestation.
4. Size and shape uniformity across the batch.

Assign a standard grade:
- Grade "A": Superior freshness, vibrant color, minimal to zero surface blemishes, high commercial value.
- Grade "B": Good condition with minor superficial cosmetic blemishes, perfectly edible and marketable.
- Grade "C": Overripe, severely bruised, wilting, rotten, diseased, or mismatched produce. Unacceptable for direct market listing.

Return STRICT JSON ONLY, no conversational text, no markdown backticks:
{"grade": "A" | "B" | "C", "reason": "<concise explanation in 1-2 sentences>", "confidence": <number between 0.50 and 1.0>}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: base64Data,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        temperature: 0.1,
      },
    });

    const rawText = (response.text || '').trim();
    // Defensive JSON extraction
    const cleanedJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedJson);

    const grade: 'A' | 'B' | 'C' = ['A', 'B', 'C'].includes(parsed.grade) ? parsed.grade : 'B';
    const confidence = typeof parsed.confidence === 'number' ? Math.min(Math.max(parsed.confidence, 0.5), 1.0) : 0.88;
    const reason = parsed.reason || `Graded ${grade} based on visual inspection.`;
    const isAutoRejected = grade === 'C';

    return {
      grade,
      reason,
      confidence,
      source: 'gemini',
      isAutoRejected,
    };
  } catch (err: any) {
    console.warn('[TraceCrop AI] Gemini Vision API call failed:', err.message);
    return runFallbackGrading(imageBuffer, declaredCrop, `AI inspection error: ${err.message}`);
  }
}

function runFallbackGrading(imageBuffer: Buffer, declaredCrop: string, note?: string): GradingResult {
  // Deterministic fallback: do NOT auto-reject on fallback so genuine produce is not lost;
  // pass to FPO review with clear manual audit notification.
  const sizeKb = Math.round(imageBuffer.length / 1024);
  return {
    grade: 'B',
    reason: `Automated visual inspection offline. Forwarded to FPO for manual batch verification (${declaredCrop}, image size ${sizeKb} KB).`,
    confidence: 0.75,
    source: 'fallback',
    isAutoRejected: false,
  };
}

/**
 * Seasonal planting and market demand suggestions for farmers.
 */
export async function getSeasonalSuggestions(
  location: string,
  currentMonth: string,
  pastCrops: string[]
): Promise<CropSuggestion[]> {
  const ai = getGeminiClient();

  if (ai) {
    try {
      const prompt = `You are an expert agronomist advising a smallholder farmer in India.
Farmer Details:
- Region: ${location || 'Maharashtra, India'}
- Current Month: ${currentMonth || 'October'}
- Past Cultivated Crops: ${pastCrops.length > 0 ? pastCrops.join(', ') : 'Tomatoes, Onions'}

Recommend 3 high-demand, climate-suitable crops or vegetables the farmer should plant or harvest now to maximize returns through FPO aggregation.

Return STRICT JSON format as an array of 3 objects with keys: "title", "category", "expectedYieldWeeks", "marketDemand", "reason".
No markdown fences or extra text.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.3,
        },
      });

      const raw = (response.text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
      const suggestions: CropSuggestion[] = JSON.parse(raw);
      if (Array.isArray(suggestions) && suggestions.length > 0) {
        return suggestions.slice(0, 3);
      }
    } catch (err: any) {
      console.warn('[TraceCrop AI] Suggestions API failed, falling back to curated seasonal data:', err.message);
    }
  }

  // Static curated seasonal recommendations fallback
  return [
    {
      title: 'Green Bell Peppers (Capsicum)',
      category: 'Vegetables',
      expectedYieldWeeks: '8-10 weeks',
      marketDemand: 'High in Urban Supermarkets',
      reason: 'Favorable autumn temperatures promote uniform flowering with high wholesale mandi price stability.',
    },
    {
      title: 'Short-Cycle Spinach & Fenugreek',
      category: 'Vegetables',
      expectedYieldWeeks: '3-4 weeks',
      marketDemand: 'Steady Daily Local Demand',
      reason: 'Rapid turnover leafy greens generate quick liquidity while conditioning soil between major cropping cycles.',
    },
    {
      title: 'Winter Green Peas (Matar)',
      category: 'Vegetables',
      expectedYieldWeeks: '10-12 weeks',
      marketDemand: 'Peak Winter Festive Premium',
      reason: 'Early winter sowing captures top opening mandi rates of Rs 65-80/kg prior to broader market saturation.',
    },
  ];
}
