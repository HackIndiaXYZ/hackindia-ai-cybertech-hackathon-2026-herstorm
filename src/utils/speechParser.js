/**
 * Multi-language speech parser for agricultural voice input.
 * Extracts crop name, quantity (kg), and unit price (Rs/kg) from spoken voice transcripts.
 */

const HINDI_WORD_NUMBERS = {
  ek: 1,
  do: 2,
  teen: 3,
  char: 4,
  chaar: 4,
  paanch: 5,
  panch: 5,
  cheh: 6,
  chhah: 6,
  saat: 7,
  aath: 8,
  nau: 9,
  das: 10,
  gyarah: 11,
  barah: 12,
  terah: 13,
  chaudah: 14,
  pandrah: 15,
  solah: 16,
  satrah: 17,
  atharah: 18,
  unnis: 19,
  bees: 20,
  pachis: 25,
  tees: 30,
  paintis: 35,
  chalis: 40,
  paintalis: 45,
  pachaas: 50,
  pachas: 50,
  saath: 60,
  sattar: 70,
  assi: 80,
  nabbe: 90,
  sau: 100,
};

const ENGLISH_WORD_NUMBERS = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  fifteen: 15,
  twenty: 20,
  twentyfive: 25,
  thirty: 30,
  thirtyfive: 35,
  forty: 40,
  fortyfive: 45,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
};

const CROP_TRANSLATIONS = {
  tamatar: 'tomato',
  aloo: 'potato',
  batata: 'potato',
  pyaz: 'onion',
  kanda: 'onion',
  gajar: 'carrot',
  palak: 'spinach',
  phoolgobi: 'cauliflower',
  patagobi: 'cabbage',
  baingan: 'brinjal',
  vangi: 'brinjal',
  bhindi: 'okra',
  matar: 'peas',
  seb: 'apple',
  kela: 'banana',
  aam: 'mango',
  santre: 'orange',
  santara: 'orange',
  angoor: 'grapes',
  draksha: 'grapes',
  papita: 'papaya',
  amrood: 'guava',
  nimbu: 'lemon',
  limbu: 'lemon',
  anar: 'pomegranate',
};

export function parseVoiceInput(transcript) {
  if (!transcript || typeof transcript !== 'string') {
    return { name: '', quantity: '', price: '' };
  }

  const raw = transcript.toLowerCase().trim();
  const tokens = raw.split(/[\s,]+/);

  let cropName = '';
  let quantity = '';
  let price = '';

  // Extract crop
  for (const token of tokens) {
    if (CROP_TRANSLATIONS[token]) {
      cropName = CROP_TRANSLATIONS[token];
      break;
    }
  }

  // If not found in translations, check direct common crops
  const commonCrops = [
    'tomato',
    'potato',
    'onion',
    'carrot',
    'spinach',
    'cauliflower',
    'cabbage',
    'brinjal',
    'okra',
    'peas',
    'apple',
    'banana',
    'mango',
    'orange',
    'grapes',
    'papaya',
    'guava',
    'lemon',
    'capsicum',
    'cucumber',
    'garlic',
    'ginger',
    'pomegranate',
  ];

  if (!cropName) {
    for (const c of commonCrops) {
      if (raw.includes(c)) {
        cropName = c;
        break;
      }
    }
  }

  // Look for numbers or word numbers
  // Pattern 1: regex matching digits
  const digitMatches = raw.match(/\d+(\.\d+)?/g);
  if (digitMatches && digitMatches.length > 0) {
    if (digitMatches.length >= 2) {
      quantity = digitMatches[0];
      price = digitMatches[1];
    } else {
      // Check context keywords near the single number
      const match = digitMatches[0];
      if (raw.includes('kg') || raw.includes('kilo') || raw.includes('kilos')) {
        quantity = match;
      } else if (raw.includes('rs') || raw.includes('rupee') || raw.includes('rupees') || raw.includes('rupaye')) {
        price = match;
      } else {
        quantity = match;
      }
    }
  }

  // If numbers still not found, check word number dictionaries
  if (!quantity || !price) {
    const foundNumbers = [];
    for (const token of tokens) {
      if (HINDI_WORD_NUMBERS[token]) {
        foundNumbers.push(HINDI_WORD_NUMBERS[token]);
      } else if (ENGLISH_WORD_NUMBERS[token]) {
        foundNumbers.push(ENGLISH_WORD_NUMBERS[token]);
      }
    }

    if (!quantity && foundNumbers.length > 0) {
      quantity = String(foundNumbers[0]);
    }
    if (!price && foundNumbers.length > 1) {
      price = String(foundNumbers[1]);
    }
  }

  return {
    name: cropName ? cropName.charAt(0).toUpperCase() + cropName.slice(1) : '',
    quantity,
    price,
    rawText: transcript,
  };
}
