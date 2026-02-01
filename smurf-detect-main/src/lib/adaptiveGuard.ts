import {
  Transaction,
  WalletNode,
  LaunderingPattern,
  PatternFeatures,
  PatternExample,
  AdaptiveGuardResult,
  PatternLibrary
} from '@/types/transaction';

/**
 * Built-in laundering patterns based on known techniques
 */
export const BUILT_IN_PATTERNS: LaunderingPattern[] = [
  {
    id: 'fan-out-classic',
    name: 'Classic Fan-Out',
    description: 'Single source distributing to many recipients in short time',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    examples: [],
    features: {
      avgFanOut: 8,
      avgFanIn: 1,
      avgTimeBetweenTx: 30,
      avgTxValue: 0.5,
      rhythmVariance: 0.1,
      hasPeelingChain: false,
      hasRapidBurst: true,
      txCountRange: { min: 5, max: 50 }
    },
    isBuiltIn: true,
    confidence: 0.85
  },
  {
    id: 'fan-in-aggregation',
    name: 'Fan-In Aggregation',
    description: 'Many sources consolidating into single recipient',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    examples: [],
    features: {
      avgFanOut: 1,
      avgFanIn: 8,
      avgTimeBetweenTx: 60,
      avgTxValue: 0.3,
      rhythmVariance: 0.15,
      hasPeelingChain: false,
      hasRapidBurst: true,
      txCountRange: { min: 5, max: 100 }
    },
    isBuiltIn: true,
    confidence: 0.82
  },
  {
    id: 'peeling-chain',
    name: 'Peeling Chain',
    description: 'Sequential transactions with decreasing values',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    examples: [],
    features: {
      avgFanOut: 2,
      avgFanIn: 1,
      avgTimeBetweenTx: 120,
      avgTxValue: 1.0,
      rhythmVariance: 0.2,
      hasPeelingChain: true,
      hasRapidBurst: false,
      txCountRange: { min: 3, max: 20 }
    },
    isBuiltIn: true,
    confidence: 0.88
  },
  {
    id: 'rapid-layering',
    name: 'Rapid Layering',
    description: 'Quick succession of transactions through multiple hops',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    examples: [],
    features: {
      avgFanOut: 3,
      avgFanIn: 2,
      avgTimeBetweenTx: 15,
      avgTxValue: 0.8,
      rhythmVariance: 0.08,
      hasPeelingChain: false,
      hasRapidBurst: true,
      txCountRange: { min: 10, max: 100 }
    },
    isBuiltIn: true,
    confidence: 0.9
  },
  {
    id: 'smurfing-classic',
    name: 'Classic Smurfing',
    description: 'Breaking large amounts into small, similar-sized transactions',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    examples: [],
    features: {
      avgFanOut: 10,
      avgFanIn: 1,
      avgTimeBetweenTx: 45,
      avgTxValue: 0.1,
      rhythmVariance: 0.05,
      hasPeelingChain: false,
      hasRapidBurst: true,
      txCountRange: { min: 10, max: 200 }
    },
    isBuiltIn: true,
    confidence: 0.92
  }
];

/**
 * Extract features from a wallet for pattern matching
 */
export function extractWalletFeatures(
  wallet: WalletNode,
  transactions: Transaction[]
): PatternFeatures {
  const walletTxs = transactions.filter(
    tx => tx.From === wallet.address || tx.To === wallet.address
  );

  const outgoingTxs = walletTxs.filter(tx => tx.From === wallet.address);
  const incomingTxs = walletTxs.filter(tx => tx.To === wallet.address);

  // Calculate unique recipients/senders
  const uniqueRecipients = new Set(outgoingTxs.map(tx => tx.To)).size;
  const uniqueSenders = new Set(incomingTxs.map(tx => tx.From)).size;

  // Calculate average value
  const avgValue = walletTxs.length > 0
    ? walletTxs.reduce((sum, tx) => sum + tx.Value_ETH, 0) / walletTxs.length
    : 0;

  // Calculate rhythm variance
  const times = walletTxs.map(tx => tx.Age_seconds).sort((a, b) => a - b);
  let rhythmVariance = 1;
  if (times.length >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < times.length; i++) {
      gaps.push(Math.abs(times[i] - times[i - 1]));
    }
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / gaps.length;
    rhythmVariance = avgGap > 0 ? Math.sqrt(variance) / avgGap : 1;
  }

  // Detect rapid burst
  let hasRapidBurst = false;
  for (let i = 1; i < times.length; i++) {
    if (Math.abs(times[i] - times[i - 1]) < 30) {
      hasRapidBurst = true;
      break;
    }
  }

  return {
    avgFanOut: uniqueRecipients,
    avgFanIn: uniqueSenders,
    avgTimeBetweenTx: wallet.avgTimeBetweenTx || 0,
    avgTxValue: avgValue,
    rhythmVariance,
    hasPeelingChain: wallet.isPeelingSource,
    hasRapidBurst,
    txCountRange: { min: walletTxs.length, max: walletTxs.length }
  };
}

/**
 * Calculate similarity between wallet features and pattern features
 */
function calculateSimilarity(
  walletFeatures: PatternFeatures,
  patternFeatures: PatternFeatures
): { similarity: number; matchedFeatures: string[] } {
  const matchedFeatures: string[] = [];
  let totalScore = 0;
  let maxScore = 0;

  // Fan-out similarity (weight: 20)
  const fanOutDiff = Math.abs(walletFeatures.avgFanOut - patternFeatures.avgFanOut);
  const fanOutScore = Math.max(0, 20 - fanOutDiff * 2);
  totalScore += fanOutScore;
  maxScore += 20;
  if (fanOutScore >= 15) matchedFeatures.push('Fan-out pattern');

  // Fan-in similarity (weight: 20)
  const fanInDiff = Math.abs(walletFeatures.avgFanIn - patternFeatures.avgFanIn);
  const fanInScore = Math.max(0, 20 - fanInDiff * 2);
  totalScore += fanInScore;
  maxScore += 20;
  if (fanInScore >= 15) matchedFeatures.push('Fan-in pattern');

  // Timing similarity (weight: 15)
  const timeDiff = Math.abs(walletFeatures.avgTimeBetweenTx - patternFeatures.avgTimeBetweenTx);
  const timeScore = Math.max(0, 15 - timeDiff / 10);
  totalScore += timeScore;
  maxScore += 15;
  if (timeScore >= 10) matchedFeatures.push('Timing pattern');

  // Value similarity (weight: 10)
  const valueDiff = Math.abs(walletFeatures.avgTxValue - patternFeatures.avgTxValue);
  const valueScore = Math.max(0, 10 - valueDiff * 5);
  totalScore += valueScore;
  maxScore += 10;
  if (valueScore >= 7) matchedFeatures.push('Value pattern');

  // Rhythm variance similarity (weight: 15)
  const rhythmDiff = Math.abs(walletFeatures.rhythmVariance - patternFeatures.rhythmVariance);
  const rhythmScore = Math.max(0, 15 - rhythmDiff * 30);
  totalScore += rhythmScore;
  maxScore += 15;
  if (rhythmScore >= 10) matchedFeatures.push('Rhythm regularity');

  // Boolean features (weight: 10 each)
  if (walletFeatures.hasPeelingChain === patternFeatures.hasPeelingChain) {
    totalScore += 10;
    if (walletFeatures.hasPeelingChain) matchedFeatures.push('Peeling chain');
  }
  maxScore += 10;

  if (walletFeatures.hasRapidBurst === patternFeatures.hasRapidBurst) {
    totalScore += 10;
    if (walletFeatures.hasRapidBurst) matchedFeatures.push('Rapid burst');
  }
  maxScore += 10;

  return {
    similarity: totalScore / maxScore,
    matchedFeatures
  };
}

/**
 * Analyze a wallet against all patterns
 */
export function analyzeWalletWithAdaptiveGuard(
  wallet: WalletNode,
  transactions: Transaction[],
  patternLibrary: PatternLibrary
): AdaptiveGuardResult {
  const walletFeatures = extractWalletFeatures(wallet, transactions);
  const allPatterns = [...BUILT_IN_PATTERNS, ...patternLibrary.patterns.filter(p => !p.isBuiltIn)];

  const matchedPatterns: AdaptiveGuardResult['matchedPatterns'] = [];
  let maxSimilarity = 0;

  allPatterns.forEach(pattern => {
    const { similarity, matchedFeatures } = calculateSimilarity(walletFeatures, pattern.features);
    
    if (similarity > 0.3) { // Only include patterns with >30% match
      matchedPatterns.push({
        patternId: pattern.id,
        patternName: pattern.name,
        similarity,
        matchedFeatures
      });
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }
  });

  // Sort by similarity descending
  matchedPatterns.sort((a, b) => b.similarity - a.similarity);

  // Calculate overall score
  const overallScore = Math.min(100, Math.round(
    wallet.suspicionScore * 0.4 + // Base suspicion score
    maxSimilarity * 60 + // Pattern matching contribution
    (matchedPatterns.length > 2 ? 10 : 0) // Multiple pattern bonus
  ));

  // Determine if this is a zero-day candidate
  const isZeroDayCandidate = wallet.suspicionScore >= 50 && maxSimilarity < 0.5;
  const zeroDayReason = isZeroDayCandidate
    ? 'High suspicion but no strong pattern match - potential new laundering technique'
    : undefined;

  // Calculate confidence based on data quality
  const walletTxs = transactions.filter(
    tx => tx.From === wallet.address || tx.To === wallet.address
  );
  const confidence = Math.min(1, 0.3 + walletTxs.length * 0.05 + matchedPatterns.length * 0.1);

  return {
    walletAddress: wallet.address,
    overallScore,
    confidence,
    matchedPatterns,
    isZeroDayCandidate,
    zeroDayReason
  };
}

/**
 * Create initial pattern library
 */
export function createPatternLibrary(): PatternLibrary {
  return {
    patterns: [...BUILT_IN_PATTERNS],
    lastUpdated: Date.now()
  };
}

/**
 * Add a user-flagged example to learn from
 */
export function addFlaggedExample(
  patternLibrary: PatternLibrary,
  wallet: WalletNode,
  transactions: Transaction[],
  patternName: string,
  notes?: string
): PatternLibrary {
  const walletFeatures = extractWalletFeatures(wallet, transactions);
  
  // Check if pattern exists
  const existingPattern = patternLibrary.patterns.find(p => p.name === patternName);
  
  if (existingPattern) {
    // Add example to existing pattern
    existingPattern.examples.push({
      walletAddress: wallet.address,
      confirmedAt: Date.now(),
      confirmedBy: 'user',
      notes
    });
    
    // Update pattern features using weighted average
    const numExamples = existingPattern.examples.length;
    const weight = 1 / numExamples;
    
    existingPattern.features = {
      avgFanOut: existingPattern.features.avgFanOut * (1 - weight) + walletFeatures.avgFanOut * weight,
      avgFanIn: existingPattern.features.avgFanIn * (1 - weight) + walletFeatures.avgFanIn * weight,
      avgTimeBetweenTx: existingPattern.features.avgTimeBetweenTx * (1 - weight) + walletFeatures.avgTimeBetweenTx * weight,
      avgTxValue: existingPattern.features.avgTxValue * (1 - weight) + walletFeatures.avgTxValue * weight,
      rhythmVariance: existingPattern.features.rhythmVariance * (1 - weight) + walletFeatures.rhythmVariance * weight,
      hasPeelingChain: existingPattern.features.hasPeelingChain || walletFeatures.hasPeelingChain,
      hasRapidBurst: existingPattern.features.hasRapidBurst || walletFeatures.hasRapidBurst,
      txCountRange: {
        min: Math.min(existingPattern.features.txCountRange.min, walletFeatures.txCountRange.min),
        max: Math.max(existingPattern.features.txCountRange.max, walletFeatures.txCountRange.max)
      }
    };
    
    existingPattern.updatedAt = Date.now();
    existingPattern.confidence = Math.min(0.95, existingPattern.confidence + 0.02);
  } else {
    // Create new pattern
    const newPattern: LaunderingPattern = {
      id: `user-${Date.now()}`,
      name: patternName,
      description: `User-defined pattern based on flagged wallet ${wallet.address.slice(0, 8)}...`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      examples: [{
        walletAddress: wallet.address,
        confirmedAt: Date.now(),
        confirmedBy: 'user',
        notes
      }],
      features: walletFeatures,
      isBuiltIn: false,
      confidence: 0.5 // Start with lower confidence for user-defined patterns
    };
    
    patternLibrary.patterns.push(newPattern);
  }
  
  patternLibrary.lastUpdated = Date.now();
  return { ...patternLibrary };
}

/**
 * Get pattern by ID
 */
export function getPatternById(
  patternLibrary: PatternLibrary,
  patternId: string
): LaunderingPattern | undefined {
  return patternLibrary.patterns.find(p => p.id === patternId);
}

/**
 * Remove user-defined pattern
 */
export function removePattern(
  patternLibrary: PatternLibrary,
  patternId: string
): PatternLibrary {
  const pattern = patternLibrary.patterns.find(p => p.id === patternId);
  if (pattern && !pattern.isBuiltIn) {
    patternLibrary.patterns = patternLibrary.patterns.filter(p => p.id !== patternId);
    patternLibrary.lastUpdated = Date.now();
  }
  return { ...patternLibrary };
}
