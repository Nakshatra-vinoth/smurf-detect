import { useState } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Brain,
  Sparkles,
  ChevronRight,
  BookOpen,
  Plus,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { 
  WalletNode, 
  PatternLibrary, 
  AdaptiveGuardResult,
  LaunderingPattern 
} from '@/types/transaction';

interface AdaptivePanelProps {
  selectedWallet: WalletNode | null;
  patternLibrary: PatternLibrary;
  adaptiveResult: AdaptiveGuardResult | null;
  onFlagWallet: (flag: 'confirmed_laundering' | 'suspicious' | 'cleared', patternName?: string) => void;
  onAnalyzeWallet: () => void;
  onSelectPattern: (patternId: string) => void;
  selectedPatternId: string | null;
  isAnalyzing: boolean;
  zeroDayCandidates: { address: string; score: number; reason: string }[];
  onWalletClick: (address: string) => void;
}

export function AdaptivePanel({
  selectedWallet,
  patternLibrary,
  adaptiveResult,
  onFlagWallet,
  onAnalyzeWallet,
  onSelectPattern,
  selectedPatternId,
  isAnalyzing,
  zeroDayCandidates,
  onWalletClick
}: AdaptivePanelProps) {
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [newPatternName, setNewPatternName] = useState('');
  const [selectedFlag, setSelectedFlag] = useState<'confirmed_laundering' | 'suspicious' | 'cleared'>('suspicious');

  const handleFlag = () => {
    if (selectedFlag === 'confirmed_laundering' && newPatternName) {
      onFlagWallet(selectedFlag, newPatternName);
    } else {
      onFlagWallet(selectedFlag);
    }
    setShowFlagDialog(false);
    setNewPatternName('');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.5) return 'text-amber-500';
    return 'text-red-500';
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-cyan-500" />
          <h2 className="text-lg font-semibold text-foreground">Adaptive Guard</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          AI-powered pattern matching with few-shot learning capability
        </p>
      </div>

      {/* Zero-Day Alerts */}
      {zeroDayCandidates.length > 0 && (
        <div className="p-4 border-b border-border bg-red-500/5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-red-500 animate-pulse" />
            <Label className="text-sm font-medium text-red-500">Zero-Day Candidates</Label>
            <span className="ml-auto px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 text-xs">
              {zeroDayCandidates.length}
            </span>
          </div>
          <div className="space-y-1">
            {zeroDayCandidates.slice(0, 3).map(candidate => (
              <button
                key={candidate.address}
                onClick={() => onWalletClick(candidate.address)}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
              >
                <span className="font-mono text-xs text-foreground">
                  {formatAddress(candidate.address)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-400">{candidate.score}</span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                </div>
              </button>
            ))}
            {zeroDayCandidates.length > 3 && (
              <p className="text-xs text-muted-foreground text-center">
                +{zeroDayCandidates.length - 3} more
              </p>
            )}
          </div>
        </div>
      )}

      {/* Selected Wallet Analysis */}
      {selectedWallet ? (
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium">Wallet Analysis</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={onAnalyzeWallet}
              disabled={isAnalyzing}
              className="h-7 text-xs"
            >
              {isAnalyzing ? (
                <>
                  <Brain className="w-3 h-3 mr-1 animate-pulse" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-3 h-3 mr-1" />
                  Analyze
                </>
              )}
            </Button>
          </div>

          <div className="glass-panel p-3 rounded-lg mb-3">
            <p className="font-mono text-xs text-primary mb-2">
              {formatAddress(selectedWallet.address)}
            </p>
            
            {adaptiveResult ? (
              <div className="space-y-3">
                {/* Overall Score */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Adaptive Guard Score</span>
                    <span className={cn(
                      "text-lg font-bold",
                      adaptiveResult.overallScore >= 70 ? "text-red-500" :
                      adaptiveResult.overallScore >= 40 ? "text-amber-500" :
                      "text-green-500"
                    )}>
                      {adaptiveResult.overallScore}
                    </span>
                  </div>
                  <Progress 
                    value={adaptiveResult.overallScore} 
                    className="h-2"
                  />
                </div>

                {/* Confidence */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Confidence</span>
                  <span className={cn("text-sm font-medium", getConfidenceColor(adaptiveResult.confidence))}>
                    {(adaptiveResult.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Zero-Day Indicator */}
                {adaptiveResult.isZeroDayCandidate && (
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                    <Zap className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-red-500">Zero-Day Candidate</p>
                      <p className="text-[10px] text-muted-foreground">
                        {adaptiveResult.zeroDayReason}
                      </p>
                    </div>
                  </div>
                )}

                {/* Matched Patterns */}
                {adaptiveResult.matchedPatterns.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Matched Patterns</p>
                    <div className="space-y-1">
                      {adaptiveResult.matchedPatterns.slice(0, 3).map(match => (
                        <div 
                          key={match.patternId}
                          className="flex items-center justify-between p-2 rounded bg-secondary/50"
                        >
                          <span className="text-xs text-foreground">{match.patternName}</span>
                          <span className={cn(
                            "text-xs font-medium",
                            match.similarity >= 0.7 ? "text-red-500" :
                            match.similarity >= 0.5 ? "text-amber-500" :
                            "text-muted-foreground"
                          )}>
                            {(match.similarity * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                Click "Analyze" to run pattern matching
              </p>
            )}
          </div>

          {/* Flag Wallet */}
          <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full" size="sm">
                <Sparkles className="w-4 h-4 mr-2" />
                Flag This Wallet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Flag Wallet</DialogTitle>
                <DialogDescription>
                  Your feedback helps improve pattern detection. This wallet will be used as a training example.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Classification</Label>
                  <Select
                    value={selectedFlag}
                    onValueChange={(v) => setSelectedFlag(v as typeof selectedFlag)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed_laundering">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-500" />
                          Confirmed Laundering
                        </div>
                      </SelectItem>
                      <SelectItem value="suspicious">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          Suspicious (Needs Review)
                        </div>
                      </SelectItem>
                      <SelectItem value="cleared">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Cleared (False Positive)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedFlag === 'confirmed_laundering' && (
                  <div className="space-y-2">
                    <Label>Pattern Name (for learning)</Label>
                    <Select
                      value={newPatternName}
                      onValueChange={setNewPatternName}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select or create pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        {patternLibrary.patterns.map(p => (
                          <SelectItem key={p.id} value={p.name}>
                            {p.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="__new__">
                          <div className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Create New Pattern...
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {newPatternName === '__new__' && (
                      <Input
                        placeholder="Enter new pattern name"
                        value=""
                        onChange={(e) => setNewPatternName(e.target.value)}
                        className="mt-2"
                      />
                    )}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowFlagDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleFlag}>
                  Submit Flag
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="p-4 border-b border-border">
          <div className="text-center py-6 text-muted-foreground">
            <Brain className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Select a wallet to analyze</p>
            <p className="text-xs mt-1">Click on any node in the graph</p>
          </div>
        </div>
      )}

      {/* Pattern Library */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 pb-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <Label className="text-sm font-medium">Pattern Library</Label>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {patternLibrary.patterns.length} patterns • {patternLibrary.patterns.filter(p => !p.isBuiltIn).length} user-defined
          </p>
        </div>

        <ScrollArea className="flex-1 px-4 pb-4">
          <div className="space-y-2">
            {patternLibrary.patterns.map(pattern => (
              <button
                key={pattern.id}
                onClick={() => onSelectPattern(pattern.id)}
                className={cn(
                  "w-full p-3 rounded-lg text-left transition-all border",
                  selectedPatternId === pattern.id
                    ? "bg-primary/10 border-primary/30"
                    : "bg-secondary/30 border-transparent hover:bg-secondary/60"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">
                    {pattern.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {pattern.isBuiltIn ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-500">
                        Built-in
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-500">
                        Custom
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {(pattern.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {pattern.description}
                </p>
                {pattern.examples.length > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {pattern.examples.length} training example{pattern.examples.length > 1 ? 's' : ''}
                  </p>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
