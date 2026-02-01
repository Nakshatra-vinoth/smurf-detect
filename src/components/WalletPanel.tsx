import { WalletNode, TemporalPattern, TemporalHeatmapData } from '@/types/transaction';
import { getSuspicionLevel } from '@/lib/smurfingDetector';
import { 
  AlertTriangle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  Activity, 
  Shield, 
  ShieldAlert, 
  ShieldX,
  Zap,
  Crosshair,
  Flag,
  Users,
  GitBranch,
  Split
} from 'lucide-react';
import { TemporalHeatmap } from '@/components/TemporalHeatmap';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WalletPanelProps {
  wallet: WalletNode | null;
  onClose: () => void;
  temporalPatterns?: TemporalPattern[];
  temporalHeatmap?: TemporalHeatmapData[];
  onSetAsSeed?: () => void;
  onFlagWallet?: (flag: 'confirmed_laundering' | 'suspicious' | 'cleared') => void;
  showForensicActions?: boolean;
}

export function WalletPanel({ 
  wallet, 
  onClose, 
  temporalPatterns = [],
  temporalHeatmap = [],
  onSetAsSeed,
  onFlagWallet,
  showForensicActions = true
}: WalletPanelProps) {
  if (!wallet) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
        <Shield className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-center text-lg">Click on a wallet node to inspect its details</p>
        <p className="text-center text-sm mt-2 opacity-60">The graph shows transaction flows between wallets</p>
      </div>
    );
  }

  const suspicionLevel = getSuspicionLevel(wallet.suspicionScore);
  
  const getSuspicionIcon = () => {
    switch (suspicionLevel) {
      case 'low': return <Shield className="w-6 h-6" />;
      case 'medium': return <ShieldAlert className="w-6 h-6" />;
      case 'high': return <ShieldX className="w-6 h-6" />;
    }
  };

  const getRhythmBadge = () => {
    switch (wallet.transactionRhythm) {
      case 'normal':
        return <span className="suspicion-badge-low px-2 py-1 rounded text-xs">Normal activity</span>;
      case 'suspicious':
        return <span className="suspicion-badge-medium px-2 py-1 rounded text-xs">Suspiciously coordinated</span>;
      case 'highly_suspicious':
        return <span className="suspicion-badge-high px-2 py-1 rounded text-xs">Highly suspicious automation</span>;
    }
  };

  const getPatternSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low': return 'text-suspicion-low border-suspicion-low/30 bg-suspicion-low/10';
      case 'medium': return 'text-suspicion-medium border-suspicion-medium/30 bg-suspicion-medium/10';
      case 'high': return 'text-suspicion-high border-suspicion-high/30 bg-suspicion-high/10';
    }
  };

  const getWalletRoleBadge = () => {
    const role = wallet.walletRole || 'normal';
    switch (role) {
      case 'mule':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">Mule</span>
          </div>
        );
      case 'aggregator':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30">
            <GitBranch className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">Aggregator</span>
          </div>
        );
      case 'splitter':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/20 border border-orange-500/30">
            <Split className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-orange-300">Splitter</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-300">Normal</span>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col animate-fade-in bg-card/50">
      {/* Header */}
      <div className="p-5 border-b border-border/60 bg-card/80">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Wallet Details</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>
        
        {/* Address & Role */}
        <div className="glass-panel p-4 mb-4 space-y-3">
          <div>
            <p className="stat-label mb-2">Wallet Address</p>
            <p className="address-text text-primary break-all text-sm leading-relaxed">{wallet.address}</p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Entity Type</p>
              <p className="text-sm font-medium text-foreground">{wallet.entityType || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Wallet Role</p>
              {getWalletRoleBadge()}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {showForensicActions && (
          <div className="flex gap-2 mb-4">
            {onSetAsSeed && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSetAsSeed}
                className="flex-1 h-9 text-xs font-medium"
              >
                <Crosshair className="w-3.5 h-3.5 mr-1.5" />
                Set as Seed
              </Button>
            )}
            {onFlagWallet && (
              <Select onValueChange={(v) => onFlagWallet(v as any)}>
                <SelectTrigger className="flex-1 h-9 text-xs font-medium">
                  <Flag className="w-3.5 h-3.5 mr-1.5" />
                  <SelectValue placeholder="Flag wallet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed_laundering">
                    <span className="text-red-500 font-medium">Confirmed Laundering</span>
                  </SelectItem>
                  <SelectItem value="suspicious">
                    <span className="text-amber-500 font-medium">Suspicious</span>
                  </SelectItem>
                  <SelectItem value="cleared">
                    <span className="text-green-500 font-medium">Cleared</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* Temporal Density Heatmap */}
        {temporalHeatmap.length > 0 && (
          <div className="mb-4 pb-4 border-b border-border/60">
            <TemporalHeatmap data={temporalHeatmap} />
          </div>
        )}

        {/* Suspicion Score */}
        <div className={cn(
          "p-5 rounded-lg border-2 flex items-center gap-5",
          suspicionLevel === 'low' && "bg-suspicion-low/10 border-suspicion-low/40",
          suspicionLevel === 'medium' && "bg-suspicion-medium/10 border-suspicion-medium/40",
          suspicionLevel === 'high' && "bg-suspicion-high/10 border-suspicion-high/40 danger-glow",
        )}>
          <div className={cn(
            "shrink-0",
            suspicionLevel === 'low' && "text-suspicion-low",
            suspicionLevel === 'medium' && "text-suspicion-medium",
            suspicionLevel === 'high' && "text-suspicion-high",
          )}>
            {getSuspicionIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="stat-label mb-1">Suspicion Score</p>
            <p className={cn(
              "text-4xl font-bold leading-none",
              suspicionLevel === 'low' && "text-suspicion-low",
              suspicionLevel === 'medium' && "text-suspicion-medium",
              suspicionLevel === 'high' && "text-suspicion-high",
            )}>
              {wallet.suspicionScore}
              <span className="text-lg font-normal text-muted-foreground ml-1">/100</span>
            </p>
          </div>
          {/* Temporal Attention Score */}
          {wallet.temporalAttentionScore !== undefined && wallet.temporalAttentionScore > 0 && (
            <div className="text-right shrink-0">
              <p className="stat-label flex items-center gap-1 justify-end mb-1">
                <Zap className="w-3.5 h-3.5" />
                Temporal
              </p>
              <p className={cn(
                "text-2xl font-bold",
                wallet.temporalAttentionScore >= 70 ? "text-red-500" :
                wallet.temporalAttentionScore >= 50 ? "text-amber-500" :
                "text-cyan-500"
              )}>
                {wallet.temporalAttentionScore}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="p-5 border-b border-border/60 bg-card/40">
        <h3 className="text-sm font-semibold text-foreground mb-4">Transaction Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-panel p-4 space-y-2">
            <div className="flex items-center gap-2 text-suspicion-high">
              <ArrowUpRight className="w-4 h-4" />
              <span className="stat-label">Total Sent</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{wallet.totalSent.toFixed(4)} ETH</p>
            <p className="text-xs text-muted-foreground">{wallet.outgoingCount.toLocaleString()} transactions</p>
          </div>
          <div className="glass-panel p-4 space-y-2">
            <div className="flex items-center gap-2 text-suspicion-low">
              <ArrowDownLeft className="w-4 h-4" />
              <span className="stat-label">Total Received</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{wallet.totalReceived.toFixed(4)} ETH</p>
            <p className="text-xs text-muted-foreground">{wallet.incomingCount.toLocaleString()} transactions</p>
          </div>
        </div>
      </div>

      {/* Transaction Rhythm */}
      <div className="p-5 border-b border-border/60 bg-card/40">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Transaction Rhythm</h3>
        </div>
        <div className="flex items-center gap-2 mb-3">
          {getRhythmBadge()}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{wallet.rhythmDescription}</p>
      </div>

      {/* Temporal Patterns */}
      {temporalPatterns.length > 0 && (
        <div className="p-5 border-b border-border/60 bg-card/40">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-semibold text-foreground">Temporal Patterns Detected</h3>
          </div>
          <div className="space-y-3">
            {temporalPatterns.map((pattern, idx) => (
              <div 
                key={idx}
                className={cn(
                  "p-3 rounded-lg border-2 text-sm",
                  getPatternSeverityColor(pattern.severity)
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold capitalize text-foreground">{pattern.type.replace('_', ' ')}</span>
                  <span className={cn(
                    "text-xs font-medium uppercase px-2 py-0.5 rounded",
                    pattern.severity === 'high' && "bg-suspicion-high/20 text-suspicion-high",
                    pattern.severity === 'medium' && "bg-suspicion-medium/20 text-suspicion-medium",
                    pattern.severity === 'low' && "bg-suspicion-low/20 text-suspicion-low"
                  )}>
                    {pattern.severity}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{pattern.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suspicion Reasons */}
      <div className="flex-1 overflow-auto p-5 bg-card/40">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Analysis Results</h3>
        </div>
        
        {wallet.suspicionReasons.length > 0 ? (
          <div className="space-y-3">
            {wallet.suspicionReasons.map((reason, index) => (
              <div 
                key={index} 
                className="flex items-start gap-3 p-4 glass-panel rounded-lg border border-border/50"
              >
                <AlertTriangle className="w-5 h-5 text-suspicion-medium shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">{reason}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Shield className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-base font-medium mb-1">No suspicious patterns detected</p>
            <p className="text-sm">This wallet appears to have normal activity</p>
          </div>
        )}

        {/* Pattern Indicators */}
        <div className="mt-6 pt-6 border-t border-border/60">
          <p className="stat-label mb-3">Pattern Indicators</p>
          <div className="flex flex-wrap gap-2">
            {wallet.participatesInFanOut && (
              <span className="suspicion-badge-high px-3 py-1.5 rounded-md text-xs font-medium">Fan-out</span>
            )}
            {wallet.participatesInFanIn && (
              <span className="suspicion-badge-high px-3 py-1.5 rounded-md text-xs font-medium">Fan-in</span>
            )}
            {wallet.isPeelingSource && (
              <span className="suspicion-badge-medium px-3 py-1.5 rounded-md text-xs font-medium">Peeling Chain</span>
            )}
            {wallet.isManuallyFlagged && (
              <span className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium",
                wallet.flaggedAs === 'confirmed_laundering' ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                wallet.flaggedAs === 'suspicious' ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                "bg-green-500/20 text-green-400 border border-green-500/30"
              )}>
                {wallet.flaggedAs === 'confirmed_laundering' ? '🚨 Flagged' :
                 wallet.flaggedAs === 'suspicious' ? '⚠️ Suspicious' : '✓ Cleared'}
              </span>
            )}
            {!wallet.participatesInFanOut && !wallet.participatesInFanIn && !wallet.isPeelingSource && !wallet.isManuallyFlagged && (
              <span className="suspicion-badge-low px-3 py-1.5 rounded-md text-xs font-medium">No patterns</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
