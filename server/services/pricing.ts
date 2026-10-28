import { MandiRateModel } from '../models/MandiRate';

export interface PricingAdvice {
  crop: string;
  mandiRate: number;
  suggested: number;
  warnAbove: number;
  formula: string;
  warning: boolean;
  warningMessage?: string;
}

export async function getPricingAdvice(cropName: string, userPrice?: number): Promise<PricingAdvice> {
  const normalized = (cropName || '').trim().toLowerCase();
  
  // Find matching crop or partial match
  let mandiEntry = await MandiRateModel.findOne({ crop: normalized });
  if (!mandiEntry) {
    const allRates = await MandiRateModel.find({});
    mandiEntry = allRates.find((r) => normalized.includes(r.crop) || r.crop.includes(normalized)) || null;
  }

  // Default baseline if crop is unlisted
  const mandiRate = mandiEntry ? mandiEntry.ratePerKg : 30;
  const suggested = Math.round(mandiRate * 1.2 * 10) / 10;
  const warnAbove = Math.round(mandiRate * 1.5 * 10) / 10;
  const formula = `Rs ${mandiRate} (mandi rate) x 1.2 = Rs ${suggested}`;

  const hasWarning = typeof userPrice === 'number' && userPrice > warnAbove;
  const warningMessage = hasWarning
    ? `Price Rs ${userPrice}/kg exceeds 1.5x mandi benchmark (Rs ${warnAbove}/kg). Listing will be flagged for FPO price audit.`
    : undefined;

  return {
    crop: normalized,
    mandiRate,
    suggested,
    warnAbove,
    formula,
    warning: hasWarning,
    warningMessage,
  };
}

export async function getAllMandiRates() {
  const rates = await MandiRateModel.find({});
  return rates.map((r) => ({
    crop: r.crop,
    ratePerKg: r.ratePerKg,
    category: r.category || 'Vegetables',
    suggestedPrice: Math.round(r.ratePerKg * 1.2 * 10) / 10,
    warnAbove: Math.round(r.ratePerKg * 1.5 * 10) / 10,
    updatedOn: r.updatedOn,
  }));
}
