import { 
  Transaction, 
  WalletNode, 
  TemporalPattern, 
  TemporalHeatmapData,
  GraphLink 
} from '@/types/transaction';

// Constants for temporal analysis
const BURST_THRESHOLD_SECONDS = 30; // Transactions within 30 seconds = burst
const BURST_MIN_COUNT = 3; // Minimum 3 transactions for a burst
const PERIODIC_VARIANCE_THRESHOLD = 0.15; // 15% variance = periodic
const RAPID_SEQUENCE_THRESHOLD = 5; // Seconds between rapid transactions
const DELAYED_THRESHOLD_SECONDS = 3600; // 1 hour delay threshold

/**
 * Calculate temporal attention score for a wallet
 * Higher score = more suspicious temporal patterns
 */
export function calculateTemporalAttentionScore(
  wallet: WalletNode,
  transactions: Transaction[]
): number {
  const walletTxs = transactions.filter(
    tx => tx.From === wallet.address || tx.To === wallet.address
  );

  if (walletTxs.length < 2) return 0;

  let score = 0;

  // Sort by age (descending = newest first in original data, so reverse for chronological)
  const sortedTxs = [...walletTxs].sort((a, b) => b.Age_seconds - a.Age_seconds);
  const times = sortedTxs.map(tx => tx.Age_seconds);

  // 1. Burst detection (multiple transactions in short period)
  const bursts = detectBursts(times);
  score += Math.min(30, bursts.length * 10);

  // 2. Periodicity detection (regular intervals = automation)
  const periodicityScore = detectPeriodicity(times);
  score += periodicityScore;

  // 3. Time-of-day concentration (transactions at unusual hours)
  const timeConcentrationScore = detectTimeConcentration(sortedTxs);
  score += timeConcentrationScore;

  // 4. Rapid fire sequences
  const rapidSequences = detectRapidSequences(times);
  score += Math.min(20, rapidSequences * 5);

  return Math.min(100, score);
}

/**
 * Detect bursts of transactions
 */
function detectBursts(times: number[]): { start: number; end: number; count: number }[] {
  const bursts: { start: number; end: number; count: number }[] = [];
  
  let burstStart = 0;
  let burstCount = 1;

  for (let i = 1; i < times.length; i++) {
    const gap = Math.abs(times[i] - times[i - 1]);
    
    if (gap <= BURST_THRESHOLD_SECONDS) {
      burstCount++;
    } else {
      if (burstCount >= BURST_MIN_COUNT) {
        bursts.push({
          start: times[burstStart],
          end: times[i - 1],
          count: burstCount
        });
      }
      burstStart = i;
      burstCount = 1;
    }
  }

  // Check last burst
  if (burstCount >= BURST_MIN_COUNT) {
    bursts.push({
      start: times[burstStart],
      end: times[times.length - 1],
      count: burstCount
    });
  }

  return bursts;
}

/**
 * Detect periodic patterns in transaction timing
 */
function detectPeriodicity(times: number[]): number {
  if (times.length < 3) return 0;

  const gaps: number[] = [];
  for (let i = 1; i < times.length; i++) {
    gaps.push(Math.abs(times[i] - times[i - 1]));
  }

  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  if (avgGap === 0) return 0;

  const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / gaps.length;
  const coefficientOfVariation = Math.sqrt(variance) / avgGap;

  // Lower CV = more periodic = more suspicious
  if (coefficientOfVariation < 0.05) return 25; // Very periodic
  if (coefficientOfVariation < 0.1) return 15; // Moderately periodic
  if (coefficientOfVariation < PERIODIC_VARIANCE_THRESHOLD) return 8;
  
  return 0;
}

/**
 * Detect unusual time-of-day concentration
 */
function detectTimeConcentration(transactions: Transaction[]): number {
  // Group by hour of day (using modulo for simplicity since we have age_seconds)
  const hourBuckets = new Array(24).fill(0);
  
  transactions.forEach(tx => {
    // Approximate hour from age - this is relative time, not absolute
    // We'll use the distribution pattern instead
    const pseudoHour = Math.floor((tx.Age_seconds % 86400) / 3600);
    hourBuckets[pseudoHour]++;
  });

  const totalTx = transactions.length;
  const maxInBucket = Math.max(...hourBuckets);
  const concentration = maxInBucket / totalTx;

  // If more than 50% of transactions in same hour = suspicious
  if (concentration > 0.7) return 15;
  if (concentration > 0.5) return 10;
  if (concentration > 0.3) return 5;
  
  return 0;
}

/**
 * Detect rapid-fire sequences
 */
function detectRapidSequences(times: number[]): number {
  let rapidCount = 0;
  
  for (let i = 1; i < times.length; i++) {
    const gap = Math.abs(times[i] - times[i - 1]);
    if (gap <= RAPID_SEQUENCE_THRESHOLD) {
      rapidCount++;
    }
  }
  
  return rapidCount;
}

/**
 * Get temporal patterns for a wallet
 */
export function getTemporalPatterns(
  wallet: WalletNode,
  transactions: Transaction[]
): TemporalPattern[] {
  const patterns: TemporalPattern[] = [];
  const walletTxs = transactions.filter(
    tx => tx.From === wallet.address || tx.To === wallet.address
  );

  if (walletTxs.length < 2) return patterns;

  const sortedTxs = [...walletTxs].sort((a, b) => b.Age_seconds - a.Age_seconds);
  const times = sortedTxs.map(tx => tx.Age_seconds);

  // Detect burst patterns
  const bursts = detectBursts(times);
  bursts.forEach((burst, idx) => {
    patterns.push({
      type: 'burst',
      description: `${burst.count} transactions within ${Math.abs(burst.end - burst.start)}s`,
      severity: burst.count >= 5 ? 'high' : burst.count >= 3 ? 'medium' : 'low',
      timeRange: { start: burst.start, end: burst.end },
      involvedTransactions: sortedTxs
        .filter(tx => tx.Age_seconds >= Math.min(burst.start, burst.end) && 
                      tx.Age_seconds <= Math.max(burst.start, burst.end))
        .map(tx => tx.TxHash)
    });
  });

  // Detect periodic patterns
  if (times.length >= 3) {
    const gaps: number[] = [];
    for (let i = 1; i < times.length; i++) {
      gaps.push(Math.abs(times[i] - times[i - 1]));
    }
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / gaps.length;
    const cv = Math.sqrt(variance) / (avgGap || 1);

    if (cv < PERIODIC_VARIANCE_THRESHOLD && avgGap < 600) {
      patterns.push({
        type: 'periodic',
        description: `Regular interval pattern: ~${avgGap.toFixed(0)}s between transactions (CV: ${(cv * 100).toFixed(1)}%)`,
        severity: cv < 0.05 ? 'high' : cv < 0.1 ? 'medium' : 'low',
        timeRange: { start: Math.min(...times), end: Math.max(...times) },
        involvedTransactions: sortedTxs.map(tx => tx.TxHash)
      });
    }
  }

  // Detect rapid sequences
  let rapidStart = -1;
  let rapidTxs: string[] = [];
  
  for (let i = 1; i < times.length; i++) {
    const gap = Math.abs(times[i] - times[i - 1]);
    if (gap <= RAPID_SEQUENCE_THRESHOLD) {
      if (rapidStart === -1) {
        rapidStart = times[i - 1];
        rapidTxs = [sortedTxs[i - 1].TxHash];
      }
      rapidTxs.push(sortedTxs[i].TxHash);
    } else if (rapidTxs.length >= 2) {
      patterns.push({
        type: 'rapid_sequence',
        description: `${rapidTxs.length} transactions in rapid succession (<${RAPID_SEQUENCE_THRESHOLD}s apart)`,
        severity: rapidTxs.length >= 5 ? 'high' : 'medium',
        timeRange: { start: rapidStart, end: times[i - 1] },
        involvedTransactions: rapidTxs
      });
      rapidStart = -1;
      rapidTxs = [];
    }
  }

  return patterns;
}

/**
 * Generate heatmap data for temporal visualization
 */
export function generateTemporalHeatmap(transactions: Transaction[]): TemporalHeatmapData[] {
  const heatmapData: TemporalHeatmapData[] = [];
  
  // Create 24x7 grid (hours x days)
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      heatmapData.push({
        hour,
        day,
        intensity: 0,
        txCount: 0
      });
    }
  }

  // Populate based on transaction ages
  // Since we have relative ages, we'll distribute across the heatmap
  const minAge = Math.min(...transactions.map(tx => tx.Age_seconds));
  const maxAge = Math.max(...transactions.map(tx => tx.Age_seconds));
  const ageRange = maxAge - minAge || 1;

  transactions.forEach(tx => {
    // Map age to a pseudo day/hour
    const normalizedAge = (tx.Age_seconds - minAge) / ageRange;
    const totalHours = normalizedAge * 168; // 7 days * 24 hours
    const day = Math.floor(totalHours / 24) % 7;
    const hour = Math.floor(totalHours % 24);
    
    const idx = day * 24 + hour;
    if (heatmapData[idx]) {
      heatmapData[idx].txCount++;
      heatmapData[idx].intensity = Math.min(1, heatmapData[idx].txCount / 10);
    }
  });

  return heatmapData;
}

/**
 * Get time range from transactions
 */
export function getTimeRange(transactions: Transaction[]): { min: number; max: number } {
  if (transactions.length === 0) return { min: 0, max: 0 };
  
  const ages = transactions.map(tx => tx.Age_seconds);
  return {
    min: Math.min(...ages),
    max: Math.max(...ages)
  };
}

/**
 * Filter transactions by time range
 */
export function filterTransactionsByTime(
  transactions: Transaction[],
  minTime: number,
  maxTime: number
): Transaction[] {
  return transactions.filter(
    tx => tx.Age_seconds >= minTime && tx.Age_seconds <= maxTime
  );
}

/**
 * Sort links by temporal order for animation
 */
export function sortLinksByTime(links: GraphLink[], transactions: Transaction[]): GraphLink[] {
  const txAgeMap = new Map<string, number>();
  transactions.forEach(tx => txAgeMap.set(tx.TxHash, tx.Age_seconds));
  
  return [...links]
    .map((link, idx) => ({
      ...link,
      temporalIndex: idx,
      sortAge: txAgeMap.get(link.txHash) || 0
    }))
    .sort((a, b) => b.sortAge - a.sortAge) // Descending age = chronological order
    .map((link, idx) => ({
      ...link,
      temporalIndex: idx
    }));
}

/**
 * Get first and last seen times for a wallet
 */
export function getWalletTimeRange(
  walletAddress: string,
  transactions: Transaction[]
): { firstSeen: number; lastSeen: number } {
  const walletTxs = transactions.filter(
    tx => tx.From === walletAddress || tx.To === walletAddress
  );
  
  if (walletTxs.length === 0) {
    return { firstSeen: 0, lastSeen: 0 };
  }
  
  const ages = walletTxs.map(tx => tx.Age_seconds);
  return {
    firstSeen: Math.max(...ages), // Higher age = earlier
    lastSeen: Math.min(...ages)   // Lower age = more recent
  };
}
