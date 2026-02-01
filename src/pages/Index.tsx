import { useState, useEffect, useCallback, useMemo } from 'react';
import { parseCSV } from '@/lib/csvParser';
import { analyzeTransactions, getTopSuspiciousWallets } from '@/lib/smurfingDetector';
import { 
  calculateTemporalAttentionScore, 
  getTemporalPatterns, 
  generateTemporalHeatmap,
  getTimeRange,
  filterTransactionsByTime 
} from '@/lib/temporalAnalysis';
import { 
  expandSubgraph, 
  generateInverseMapping, 
  getDefaultExpansionConfig,
  createSeedFromWallet 
} from '@/lib/subgraphExpansion';
import { 
  createPatternLibrary, 
  analyzeWalletWithAdaptiveGuard,
  addFlaggedExample 
} from '@/lib/adaptiveGuard';
import { 
  Transaction, 
  WalletNode, 
  GraphData, 
  GraphNode,
  ViewMode,
  SubgraphExpansionConfig,
  InverseTopologyMapping,
  PatternLibrary,
  AdaptiveGuardResult,
  TemporalPattern,
  TemporalHeatmapData
} from '@/types/transaction';
import { TransactionGraph } from '@/components/TransactionGraph';
import { WalletPanel } from '@/components/WalletPanel';
import { TopSuspiciousList } from '@/components/TopSuspiciousList';
import { GraphLegend } from '@/components/GraphLegend';
import { ModeToolbar } from '@/components/ModeToolbar';
import { TimelineSlider } from '@/components/TimelineSlider';
import { ForensicPanel } from '@/components/ForensicPanel';
import { AdaptivePanel } from '@/components/AdaptivePanel';
import { ContextMenu } from '@/components/ContextMenu';
import { Search, Loader2, AlertCircle, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { toast } = useToast();
  
  // Core data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Map<string, WalletNode>>(new Map());
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [selectedWallet, setSelectedWallet] = useState<WalletNode | null>(null);
  const [topSuspicious, setTopSuspicious] = useState<WalletNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalTx: 0, totalWallets: 0, highRiskCount: 0 });

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('overview');

  // Temporal state
  const [timeRange, setTimeRange] = useState({ min: 0, max: 1000 });
  const [currentTime, setCurrentTime] = useState(1000);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showTemporalFlow, setShowTemporalFlow] = useState(true);
  const [temporalHeatmap, setTemporalHeatmap] = useState<TemporalHeatmapData[]>([]);
  const [selectedWalletPatterns, setSelectedWalletPatterns] = useState<TemporalPattern[]>([]);

  // Forensic Anchor state
  const [expansionConfig, setExpansionConfig] = useState<SubgraphExpansionConfig>(getDefaultExpansionConfig());
  const [subgraphData, setSubgraphData] = useState<GraphData | null>(null);
  const [inverseMapping, setInverseMapping] = useState<InverseTopologyMapping[]>([]);
  const [isExpanding, setIsExpanding] = useState(false);

  // Adaptive Guard state
  const [patternLibrary, setPatternLibrary] = useState<PatternLibrary>(createPatternLibrary());
  const [adaptiveResult, setAdaptiveResult] = useState<AdaptiveGuardResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);
  const [zeroDayCandidates, setZeroDayCandidates] = useState<{ address: string; score: number; reason: string }[]>([]);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: GraphNode } | null>(null);

  // Computed values
  const seedAddresses = useMemo(() => 
    new Set(expansionConfig.seeds.map(s => s.address)), 
    [expansionConfig.seeds]
  );

  const filteredTransactions = useMemo(() => {
    if (viewMode === 'overview') {
      return filterTransactionsByTime(transactions, timeRange.min, currentTime);
    }
    return transactions;
  }, [transactions, timeRange, currentTime, viewMode]);

  const displayGraphData = useMemo(() => {
    if (viewMode === 'forensic' && subgraphData) {
      return subgraphData;
    }
    return graphData;
  }, [viewMode, subgraphData, graphData]);

  const filteredCount = useMemo(() => filteredTransactions.length, [filteredTransactions]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/data/dataset_small.csv');
      if (!response.ok) {
        throw new Error('Failed to load transaction data');
      }
      
      const csvText = await response.text();
      const parsedTransactions = parseCSV(csvText);
      
      // Limit to first 2000 transactions for performance
      const limitedTx = parsedTransactions.slice(0, 2000);
      setTransactions(limitedTx);
      
      const { wallets: analyzedWallets, graphData: analyzedGraph } = analyzeTransactions(limitedTx);
      
      // Calculate temporal attention scores
      analyzedWallets.forEach((wallet, address) => {
        wallet.temporalAttentionScore = calculateTemporalAttentionScore(wallet, limitedTx);
        wallet.temporalPatterns = getTemporalPatterns(wallet, limitedTx);
      });
      
      // Update graph nodes with temporal scores
      analyzedGraph.nodes = analyzedGraph.nodes.map(node => ({
        ...node,
        wallet: analyzedWallets.get(node.id) || node.wallet
      }));
      
      setWallets(analyzedWallets);
      setGraphData(analyzedGraph);
      
      // Set time range
      const range = getTimeRange(limitedTx);
      setTimeRange(range);
      setCurrentTime(range.max);
      
      // Generate heatmap
      setTemporalHeatmap(generateTemporalHeatmap(limitedTx));
      
      const top = getTopSuspiciousWallets(analyzedWallets, 10);
      setTopSuspicious(top);
      
      // Find zero-day candidates
      const zeroDays: { address: string; score: number; reason: string }[] = [];
      analyzedWallets.forEach((wallet) => {
        const result = analyzeWalletWithAdaptiveGuard(wallet, limitedTx, patternLibrary);
        if (result.isZeroDayCandidate) {
          zeroDays.push({
            address: wallet.address,
            score: result.overallScore,
            reason: result.zeroDayReason || 'Unknown pattern'
          });
        }
      });
      setZeroDayCandidates(zeroDays.sort((a, b) => b.score - a.score).slice(0, 10));
      
      const highRisk = Array.from(analyzedWallets.values()).filter(w => w.suspicionScore >= 60).length;
      setStats({
        totalTx: limitedTx.length,
        totalWallets: analyzedWallets.size,
        highRiskCount: highRisk,
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Node click handler
  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedWallet(node.wallet);
    
    // Get temporal patterns for selected wallet
    if (node.wallet) {
      const patterns = getTemporalPatterns(node.wallet, transactions);
      setSelectedWalletPatterns(patterns);
    }
    
    // Auto-analyze with Adaptive Guard
    if (viewMode === 'adaptive' && node.wallet) {
      const result = analyzeWalletWithAdaptiveGuard(node.wallet, transactions, patternLibrary);
      setAdaptiveResult(result);
    }
  }, [transactions, viewMode, patternLibrary]);

  // Node right-click handler
  const handleNodeRightClick = useCallback((node: GraphNode, event: MouseEvent) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, node });
  }, []);

  // Wallet click from list
  const handleWalletClick = useCallback((wallet: WalletNode) => {
    setSelectedWallet(wallet);
    const patterns = getTemporalPatterns(wallet, transactions);
    setSelectedWalletPatterns(patterns);
  }, [transactions]);

  // Close panel
  const handleClosePanel = useCallback(() => {
    setSelectedWallet(null);
    setSelectedWalletPatterns([]);
    setAdaptiveResult(null);
  }, []);

  // Set wallet as seed (Forensic Anchor)
  const handleSetAsSeed = useCallback(() => {
    if (!selectedWallet) return;
    
    if (expansionConfig.seeds.some(s => s.address === selectedWallet.address)) {
      toast({
        title: "Already a seed",
        description: "This wallet is already set as a forensic anchor.",
        variant: "default"
      });
      return;
    }
    
    const newSeed = createSeedFromWallet(selectedWallet);
    setExpansionConfig(prev => ({
      ...prev,
      seeds: [...prev.seeds, newSeed]
    }));
    
    toast({
      title: "Seed Added",
      description: `${selectedWallet.address.slice(0, 8)}... added as forensic anchor.`,
    });
    
    setViewMode('forensic');
  }, [selectedWallet, expansionConfig.seeds, toast]);

  // Remove seed
  const handleRemoveSeed = useCallback((seedId: string) => {
    setExpansionConfig(prev => ({
      ...prev,
      seeds: prev.seeds.filter(s => s.id !== seedId)
    }));
  }, []);

  // Expand subgraph
  const handleExpandSubgraph = useCallback(() => {
    if (expansionConfig.seeds.length === 0) return;
    
    setIsExpanding(true);
    
    // Simulate async operation
    setTimeout(() => {
      const expanded = expandSubgraph(expansionConfig, transactions, wallets);
      const mapping = generateInverseMapping(expanded, wallets, transactions);
      
      setSubgraphData({
        nodes: expanded.nodes,
        links: expanded.links
      });
      setInverseMapping(mapping);
      setIsExpanding(false);
      
      toast({
        title: "Subgraph Expanded",
        description: `Found ${expanded.nodes.length} nodes and ${expanded.links.length} connections.`,
      });
    }, 500);
  }, [expansionConfig, transactions, wallets, toast]);

  // Flag wallet
  const handleFlagWallet = useCallback((flag: 'confirmed_laundering' | 'suspicious' | 'cleared', patternName?: string) => {
    if (!selectedWallet) return;
    
    // Update wallet
    const updatedWallet = { ...selectedWallet, isManuallyFlagged: true, flaggedAs: flag };
    wallets.set(selectedWallet.address, updatedWallet);
    setSelectedWallet(updatedWallet);
    
    // If flagged as laundering, add to pattern library
    if (flag === 'confirmed_laundering' && patternName) {
      const updatedLibrary = addFlaggedExample(patternLibrary, selectedWallet, transactions, patternName);
      setPatternLibrary(updatedLibrary);
    }
    
    toast({
      title: "Wallet Flagged",
      description: `Marked as ${flag.replace('_', ' ')}.`,
    });
  }, [selectedWallet, wallets, patternLibrary, transactions, toast]);

  // Analyze with Adaptive Guard
  const handleAnalyzeWallet = useCallback(() => {
    if (!selectedWallet) return;
    
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const result = analyzeWalletWithAdaptiveGuard(selectedWallet, transactions, patternLibrary);
      setAdaptiveResult(result);
      setIsAnalyzing(false);
    }, 300);
  }, [selectedWallet, transactions, patternLibrary]);

  // Click wallet from inverse mapping
  const handleInverseMappingClick = useCallback((address: string) => {
    const wallet = wallets.get(address);
    if (wallet) {
      handleWalletClick(wallet);
    }
  }, [wallets, handleWalletClick]);

  // Context menu actions
  const handleCopyAddress = useCallback(() => {
    if (contextMenu?.node) {
      navigator.clipboard.writeText(contextMenu.node.wallet.address);
      toast({ title: "Address copied!" });
    }
  }, [contextMenu, toast]);

  const handleViewOnEtherscan = useCallback(() => {
    if (contextMenu?.node) {
      window.open(`https://etherscan.io/address/${contextMenu.node.wallet.address}`, '_blank');
    }
  }, [contextMenu]);

  // Timeline handlers
  const handleTimeChange = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleRangeChange = useCallback((start: number, end: number) => {
    // Could be used for range-based filtering
  }, []);

  const handlePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-lg text-foreground">Loading transaction data...</p>
          <p className="text-sm text-muted-foreground mt-2">Analyzing smurfing patterns</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center glass-panel p-8 rounded-lg max-w-md">
          <AlertCircle className="w-12 h-12 text-suspicion-high mx-auto mb-4" />
          <p className="text-lg text-foreground mb-2">Error Loading Data</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button 
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b-2 border-border/60 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient-cyber">The Smurfing Hunter</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Advanced Blockchain AML Analysis Platform</p>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="text-right px-4 py-2 rounded-lg bg-secondary/30 border border-border/50">
              <p className="stat-label mb-1">Transactions</p>
              <p className="text-xl font-bold text-foreground">{stats.totalTx.toLocaleString()}</p>
            </div>
            <div className="text-right px-4 py-2 rounded-lg bg-secondary/30 border border-border/50">
              <p className="stat-label mb-1">Wallets</p>
              <p className="text-xl font-bold text-foreground">{stats.totalWallets.toLocaleString()}</p>
            </div>
            <div className="text-right px-4 py-2 rounded-lg bg-suspicion-high/10 border border-suspicion-high/30">
              <p className="stat-label mb-1">High Risk</p>
              <p className="text-xl font-bold text-suspicion-high">{stats.highRiskCount}</p>
            </div>
            {zeroDayCandidates.length > 0 && (
              <div className="text-right px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="stat-label flex items-center gap-1.5 justify-end mb-1">
                  <Zap className="w-3.5 h-3.5 text-red-500" />
                  Zero-Day
                </p>
                <p className="text-xl font-bold text-red-500 animate-pulse">{zeroDayCandidates.length}</p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mode Toolbar */}
      <ModeToolbar
        currentMode={viewMode}
        onModeChange={setViewMode}
        seedCount={expansionConfig.seeds.length}
        patternCount={patternLibrary.patterns.length}
        zeroDayCount={zeroDayCandidates.length}
      />

      {/* Timeline Slider (below header as full-width) */}
      {viewMode === 'overview' && (
        <TimelineSlider
          minTime={timeRange.min}
          maxTime={timeRange.max}
          currentTime={currentTime}
          onTimeChange={handleTimeChange}
          onRangeChange={handleRangeChange}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          playbackSpeed={playbackSpeed}
          onSpeedChange={setPlaybackSpeed}
          transactionCount={stats.totalTx}
          filteredCount={filteredCount}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden bg-background">
        {/* Left Panel - Graph */}
        <div className="flex-1 flex flex-col p-5 min-w-0 gap-5" style={{ flexBasis: '66.666%' }}>
          {/* Graph */}
          <div className="flex-1 relative rounded-lg overflow-hidden border border-border/50 bg-card/30">
            <TransactionGraph 
              data={displayGraphData}
              onNodeClick={handleNodeClick}
              onNodeRightClick={handleNodeRightClick}
              selectedNodeId={selectedWallet?.id || null}
              seedNodes={seedAddresses}
              currentTime={currentTime}
              timeRange={timeRange}
              showTemporalFlow={showTemporalFlow && viewMode === 'overview'}
              viewMode={viewMode}
            />
            
            {/* Legend Overlay */}
            <div className="absolute bottom-5 left-5">
              <GraphLegend />
            </div>

          </div>
          
          {/* Top Suspicious List (Overview mode) */}
          {viewMode === 'overview' && (
            <div>
              <TopSuspiciousList 
                wallets={topSuspicious}
                onWalletClick={handleWalletClick}
                selectedWalletId={selectedWallet?.id || null}
              />
            </div>
          )}
        </div>

        {/* Right Panel - Context-aware */}
        <div className="w-[420px] border-l-2 border-border/60 bg-card/30 overflow-hidden flex flex-col">
          {viewMode === 'overview' && (
            <WalletPanel 
              wallet={selectedWallet}
              onClose={handleClosePanel}
              temporalPatterns={selectedWalletPatterns}
              temporalHeatmap={temporalHeatmap}
              onSetAsSeed={handleSetAsSeed}
              onFlagWallet={handleFlagWallet}
            />
          )}
          
          {viewMode === 'forensic' && (
            <ForensicPanel
              config={expansionConfig}
              onConfigChange={setExpansionConfig}
              inverseMapping={inverseMapping}
              selectedWallet={selectedWallet}
              onAddSeed={handleSetAsSeed}
              onRemoveSeed={handleRemoveSeed}
              onWalletClick={handleInverseMappingClick}
              onExpand={handleExpandSubgraph}
              isExpanding={isExpanding}
              timeRange={timeRange}
            />
          )}
          
          {viewMode === 'adaptive' && (
            <AdaptivePanel
              selectedWallet={selectedWallet}
              patternLibrary={patternLibrary}
              adaptiveResult={adaptiveResult}
              onFlagWallet={handleFlagWallet}
              onAnalyzeWallet={handleAnalyzeWallet}
              onSelectPattern={setSelectedPatternId}
              selectedPatternId={selectedPatternId}
              isAnalyzing={isAnalyzing}
              zeroDayCandidates={zeroDayCandidates}
              onWalletClick={handleInverseMappingClick}
            />
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          walletAddress={contextMenu.node.wallet.address}
          onClose={() => setContextMenu(null)}
          onSetAsSeed={() => {
            setSelectedWallet(contextMenu.node.wallet);
            handleSetAsSeed();
          }}
          onFlagAsLaundering={() => {
            setSelectedWallet(contextMenu.node.wallet);
            handleFlagWallet('confirmed_laundering');
          }}
          onFlagAsSuspicious={() => {
            setSelectedWallet(contextMenu.node.wallet);
            handleFlagWallet('suspicious');
          }}
          onFlagAsCleared={() => {
            setSelectedWallet(contextMenu.node.wallet);
            handleFlagWallet('cleared');
          }}
          onCopyAddress={handleCopyAddress}
          onViewOnEtherscan={handleViewOnEtherscan}
        />
      )}
    </div>
  );
};

export default Index;
