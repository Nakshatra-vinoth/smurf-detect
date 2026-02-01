export interface Transaction {
  Record: number;
  TxHash: string;
  Block: number;
  From: string;
  To: string;
  Value_ETH: number;
  TxFee: number;
  Age_seconds: number;
  From_is_address: boolean;
  To_is_address: boolean;
  From_entity_type: string;
  To_entity_type: string;
  Fee_to_Value: number;
  Value_Wei: string;
  From_tx_count: number;
  To_tx_count: number;
}

export interface WalletNode {
  id: string;
  address: string;
  totalSent: number;
  totalReceived: number;
  outgoingCount: number;
  incomingCount: number;
  suspicionScore: number;
  suspicionReasons: string[];
  transactionRhythm: 'normal' | 'suspicious' | 'highly_suspicious';
  rhythmDescription: string;
  entityType: string;
  avgTimeBetweenTx: number;
  participatesInFanOut: boolean;
  participatesInFanIn: boolean;
  isPeelingSource: boolean;
  txCount: number;
  // Temporal Pattern-Aware Attention
  temporalAttentionScore?: number;
  temporalPatterns?: TemporalPattern[];
  firstSeen?: number;
  lastSeen?: number;
  // Adaptive Guard (Meta-learning)
  adaptiveGuardScore?: number;
  similarityToKnownPatterns?: number;
  matchedPatterns?: string[];
  isManuallyFlagged?: boolean;
  flaggedAs?: 'confirmed_laundering' | 'suspicious' | 'cleared';
  walletRole?: 'mule' | 'aggregator' | 'splitter' | 'normal';
}

export interface GraphNode {
  id: string;
  val: number;
  color: string;
  wallet: WalletNode;
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  value: number;
  age: number;
  txHash: string;
  temporalIndex?: number; // For animation sequencing
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export type SuspicionLevel = 'low' | 'medium' | 'high';

// ==========================================
// Temporal Pattern-Aware Attention Types
// ==========================================

export interface TemporalPattern {
  type: 'burst' | 'periodic' | 'delayed' | 'rapid_sequence' | 'time_zone_anomaly';
  description: string;
  severity: 'low' | 'medium' | 'high';
  timeRange: { start: number; end: number };
  involvedTransactions: string[]; // TxHashes
}

export interface TemporalHeatmapData {
  hour: number;
  day: number;
  intensity: number;
  txCount: number;
}

export interface TimelineFilter {
  minTime: number;
  maxTime: number;
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
}

// ==========================================
// Seed-Driven Subgraph Expansion Types
// ==========================================

export interface SeedWallet {
  id: string;
  address: string;
  label?: string;
  addedAt: number;
  color?: string;
}

export interface SubgraphExpansionConfig {
  seeds: SeedWallet[];
  kHops: number; // 1-5
  timeRange: { start: number; end: number } | null;
  entityTypeFilter: string[]; // e.g., ['wallet_or_contract', 'known_entity']
  minValueThreshold: number; // Minimum ETH value
  expansionDirection: 'forward' | 'backward' | 'bidirectional';
}

export interface SubgraphNode extends GraphNode {
  hopDistance: number; // Distance from nearest seed
  pathFromSeed: string[]; // Addresses in path
  isSeed: boolean;
}

export interface SubgraphLink extends GraphLink {
  isInSubgraph: boolean;
  direction: 'forward' | 'backward';
}

export interface SubgraphData {
  nodes: SubgraphNode[];
  links: SubgraphLink[];
  seeds: SeedWallet[];
}

export interface InverseTopologyMapping {
  seedAddress: string;
  connectedWallets: {
    address: string;
    relationship: 'sends_to' | 'receives_from' | 'bidirectional';
    hopDistance: number;
    totalValue: number;
    txCount: number;
    suspicionScore: number;
  }[];
}

// ==========================================
// Meta-learning / Adaptive Guard Types
// ==========================================

export interface LaunderingPattern {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  examples: PatternExample[];
  features: PatternFeatures;
  isBuiltIn: boolean;
  confidence: number;
}

export interface PatternExample {
  walletAddress: string;
  confirmedAt: number;
  confirmedBy: 'user' | 'system';
  notes?: string;
}

export interface PatternFeatures {
  avgFanOut: number;
  avgFanIn: number;
  avgTimeBetweenTx: number;
  avgTxValue: number;
  rhythmVariance: number;
  hasPeelingChain: boolean;
  hasRapidBurst: boolean;
  txCountRange: { min: number; max: number };
}

export interface AdaptiveGuardResult {
  walletAddress: string;
  overallScore: number; // 0-100
  confidence: number; // 0-1
  matchedPatterns: {
    patternId: string;
    patternName: string;
    similarity: number; // 0-1
    matchedFeatures: string[];
  }[];
  isZeroDayCandidate: boolean;
  zeroDayReason?: string;
}

export interface PatternLibrary {
  patterns: LaunderingPattern[];
  lastUpdated: number;
}

// ==========================================
// UI State Types
// ==========================================

export type ViewMode = 'overview' | 'forensic' | 'adaptive';

export interface ForensicAnalysisState {
  config: SubgraphExpansionConfig;
  subgraphData: SubgraphData | null;
  inverseMapping: InverseTopologyMapping[];
  isExpanding: boolean;
}

export interface AdaptiveGuardState {
  patternLibrary: PatternLibrary;
  results: Map<string, AdaptiveGuardResult>;
  isAnalyzing: boolean;
  selectedPattern: string | null;
}
