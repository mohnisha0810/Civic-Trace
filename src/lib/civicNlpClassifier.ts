import { ComplaintCategory } from '../types';
import { CATEGORY_LABELS } from './imageClassifier';

export interface TextClassificationResult {
  category: ComplaintCategory;
  categoryLabel: string;
  confidence: number; // 0.0 to 1.0
  confidencePercent: number; // 0 to 100
  confidenceLevel: 'high' | 'medium' | 'low';
  isUnclear: boolean;
  clarifyingQuestion?: string;
  detectedKeywords: string[];
  explanation: string;
}

interface CategoryRules {
  category: ComplaintCategory;
  englishKeywords: string[];
  hindiKeywords: string[];
  weight: number;
}

const CIVIC_RULES: CategoryRules[] = [
  {
    category: 'road_damage',
    weight: 1.0,
    englishKeywords: [
      'pothole',
      'potholes',
      'crater',
      'asphalt',
      'bitumen',
      'tarmac',
      'road broken',
      'damaged road',
      'bad road',
      'ditch',
      'cavity',
      'uneven road',
      'cracks on road',
      'caved in',
      'speed breaker',
      'pavement damaged',
      'sub-base',
      'pothole crater',
    ],
    hindiKeywords: [
      'khadda',
      'khadde',
      'gaddha',
      'gaddhe',
      'gadha',
      'gadhe',
      'sadak',
      'sarak',
      'tuti sadak',
      'sadak kharab',
      'rasta tuta',
      'sadak toot gayi',
      'kankad',
    ],
  },
  {
    category: 'garbage_waste',
    weight: 1.0,
    englishKeywords: [
      'garbage',
      'waste',
      'trash',
      'dump',
      'dumping',
      'litter',
      'debris',
      'dustbin',
      'litter bin',
      'rubbish',
      'rotting',
      'filth',
      'stench',
      'foul smell',
      'uncollected',
      'sanitation',
      'sweeping',
      'plastic waste',
      'solid waste',
      'compactor',
    ],
    hindiKeywords: [
      'kachra',
      'kachre',
      'kooda',
      'koode',
      'kudadan',
      'kudedan',
      'gandagi',
      'safai',
      'badboo',
      'kachra pada hai',
      'kooda nahi uthaya',
      'kachre ka dher',
    ],
  },
  {
    category: 'drainage_sewage',
    weight: 1.0,
    englishKeywords: [
      'drainage',
      'drain',
      'drains',
      'sewage',
      'sewer',
      'manhole',
      'manhole cover',
      'gutter',
      'overflow',
      'overflowing',
      'waterlogging',
      'stagnant water',
      'choked drain',
      'blocked drain',
      'black water',
      'sewage line',
      'foul water',
    ],
    hindiKeywords: [
      'naali',
      'nali',
      'naliyaan',
      'naala',
      'nala',
      'sewer block',
      'manhole khula',
      'gutter band',
      'ganda paani',
      'naali bhar gayi',
      'pani bhara hai',
      'badboo nali',
    ],
  },
  {
    category: 'water_supply',
    weight: 1.0,
    englishKeywords: [
      'water supply',
      'water pipe',
      'pipeline',
      'pipe leak',
      'water burst',
      'water leakage',
      'drinking water',
      'potable water',
      'no water',
      'low water pressure',
      'water tanker',
      'pipeline ruptured',
      'water main',
      'tap dry',
      'water contamination',
    ],
    hindiKeywords: [
      'paani',
      'pani',
      'peene ka paani',
      'paani nahi aa raha',
      'pipe phat gaya',
      'pipe leak',
      'paani beh raha hai',
      'nal',
      'jal board',
      'nal dry',
    ],
  },
  {
    category: 'streetlight_electrical',
    weight: 1.0,
    englishKeywords: [
      'streetlight',
      'street light',
      'streetlights',
      'lamp',
      'lamp post',
      'light pole',
      'pole',
      'bulb',
      'dark street',
      'pitch dark',
      'wire hanging',
      'dangling wire',
      'sparking',
      'electric pole',
      'light not working',
      'transformer',
      'fuse',
      'no light',
    ],
    hindiKeywords: [
      'batti',
      'light kharab',
      'andhera',
      'bijli',
      'bijli ka taar',
      'khamba',
      'light nahi jal rahi',
      'street light band',
      'andhere me',
      'wire latak raha',
    ],
  },
  {
    category: 'traffic_signals',
    weight: 0.9,
    englishKeywords: [
      'traffic signal',
      'traffic light',
      'signal not working',
      'red light',
      'fallen tree',
      'tree blocking',
      'road obstruction',
      'barricade',
      'road blocked',
      'fallen pole',
    ],
    hindiKeywords: [
      'signal band',
      'traffic jam',
      'ped gir gaya',
      'rasta band',
      'raasta ruk gaya',
      'ped toota',
    ],
  },
];

const GENERIC_VAGUE_PHRASES = [
  'problem here',
  'fix this',
  'please help',
  'very bad',
  'issue here',
  'look into this',
  'complaint',
  'help me',
  'kuch karo',
  'dekho',
  'theek karo',
  'bahut bura hai',
  'ye problem hai',
  'urgent',
  'attention needed',
];

/**
 * Classifies a civic issue from the user's free-text description.
 * Supports both English and transliterated Hindi / colloquial terms.
 */
export function classifyCivicDescription(text: string): TextClassificationResult {
  const clean = (text || '').trim().toLowerCase();

  // 1. Guard against empty or ultra-short input
  if (!clean || clean.length < 5) {
    return {
      category: 'other',
      categoryLabel: CATEGORY_LABELS['other'] || 'Other Civic Issue',
      confidence: 0.3,
      confidencePercent: 30,
      confidenceLevel: 'low',
      isUnclear: true,
      clarifyingQuestion:
        'Please provide a few more details describing the issue (e.g. road damage, garbage, water, or streetlights).',
      detectedKeywords: [],
      explanation: 'Description too short to identify category reliably.',
    };
  }

  // 2. Check if the text matches exclusively generic vague phrases
  const isGeneric = GENERIC_VAGUE_PHRASES.some((phrase) => clean === phrase || clean.startsWith(phrase));
  if (isGeneric && clean.length < 25) {
    return {
      category: 'other',
      categoryLabel: CATEGORY_LABELS['other'] || 'Other Civic Issue',
      confidence: 0.35,
      confidencePercent: 35,
      confidenceLevel: 'low',
      isUnclear: true,
      clarifyingQuestion:
        'Could you specify whether this issue is about roads & potholes, garbage accumulation, drainage, water supply, or streetlights?',
      detectedKeywords: [],
      explanation: 'General request detected without specific civic category markers.',
    };
  }

  // 3. Match against rules with weighted keyword scoring
  let bestCategory: ComplaintCategory = 'other';
  let highestScore = 0;
  let matchedKeywords: string[] = [];

  for (const rule of CIVIC_RULES) {
    let score = 0;
    const currentMatches: string[] = [];

    // Check English keywords
    for (const kw of rule.englishKeywords) {
      if (clean.includes(kw)) {
        score += kw.split(' ').length > 1 ? 2.5 : 1.5; // Multi-word phrases carry higher confidence
        currentMatches.push(kw);
      }
    }

    // Check Hindi / Hinglish keywords
    for (const hkw of rule.hindiKeywords) {
      if (clean.includes(hkw)) {
        score += hkw.split(' ').length > 1 ? 2.5 : 1.5;
        currentMatches.push(hkw);
      }
    }

    score *= rule.weight;

    if (score > highestScore) {
      highestScore = score;
      bestCategory = rule.category;
      matchedKeywords = currentMatches;
    }
  }

  // 4. Calculate realistic confidence
  if (highestScore === 0) {
    return {
      category: 'other',
      categoryLabel: CATEGORY_LABELS['other'] || 'Other Civic Issue',
      confidence: 0.45,
      confidencePercent: 45,
      confidenceLevel: 'low',
      isUnclear: true,
      clarifyingQuestion:
        'We could not match this to a standard category. Please select the most appropriate category below.',
      detectedKeywords: [],
      explanation: 'No specific civic domain keywords detected in description.',
    };
  }

  // Confidence scaling based on keyword match depth
  const rawConfidence = Math.min(0.95, 0.65 + highestScore * 0.08);
  const confidencePercent = Math.round(rawConfidence * 100);
  const confidenceLevel =
    confidencePercent >= 80 ? 'high' : confidencePercent >= 60 ? 'medium' : 'low';

  const categoryLabel = CATEGORY_LABELS[bestCategory] || 'Other Civic Issue';

  return {
    category: bestCategory,
    categoryLabel,
    confidence: rawConfidence,
    confidencePercent,
    confidenceLevel,
    isUnclear: false,
    detectedKeywords: Array.from(new Set(matchedKeywords)),
    explanation: `Identified based on keywords: "${matchedKeywords.slice(0, 3).join(', ')}".`,
  };
}
