import { WalletNode } from '@/types/transaction';
import { getSuspicionLevel } from '@/lib/smurfingDetector';
import { Trophy, AlertTriangle, Users, GitBranch, Split } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopSuspiciousListProps {
  wallets: WalletNode[];
  onWalletClick: (wallet: WalletNode) => void;
  selectedWalletId: string | null;
}

const getRoleBadge = (role?: string) => {
  if (!role) return null;
  const roleConfig = {
    mule: { icon: Users, color: 'purple', label: 'Mule' },
    aggregator: { icon: GitBranch, color: 'blue', label: 'Agg' },
    splitter: { icon: Split, color: 'orange', label: 'Split' },
    normal: { icon: null, color: 'green', label: 'Normal' },
  };
  const config = roleConfig[role as keyof typeof roleConfig];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <span className={cn(
      "px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1 border",
      config.color === 'purple' && "bg-purple-500/20 text-purple-300 border-purple-500/30",
      config.color === 'blue' && "bg-blue-500/20 text-blue-300 border-blue-500/30",
      config.color === 'orange' && "bg-orange-500/20 text-orange-300 border-orange-500/30",
      config.color === 'green' && "bg-green-500/20 text-green-300 border-green-500/30"
    )}>
      {Icon && <Icon className="w-3 h-3" />}
      {config.label}
    </span>
  );
};

export function TopSuspiciousList({ wallets, onWalletClick, selectedWalletId }: TopSuspiciousListProps) {
  return (
    <div className="glass-panel p-5 rounded-lg border border-border/50">
      <div className="flex items-center gap-3 mb-5 pb-3 border-b border-border/50">
        <Trophy className="w-6 h-6 text-suspicion-high" />
        <h3 className="text-base font-bold text-foreground">Top 10 Suspicious Wallets</h3>
      </div>
      
      <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
        {wallets.map((wallet, index) => {
          const level = getSuspicionLevel(wallet.suspicionScore);
          const isSelected = wallet.id === selectedWalletId;
          
          return (
            <button
              key={wallet.id}
              onClick={() => onWalletClick(wallet)}
              className={cn(
                "w-full p-4 rounded-lg text-left transition-all",
                "border-2",
                isSelected 
                  ? "bg-primary/20 border-primary/60 shadow-lg shadow-primary/10" 
                  : "bg-secondary/40 hover:bg-secondary/60 border-transparent hover:border-primary/30",
              )}
            >
              <div className="flex items-center gap-4">
                <span className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                  index < 3 
                    ? "bg-suspicion-high/20 text-suspicion-high border-2 border-suspicion-high/40" 
                    : "bg-muted/50 text-muted-foreground border border-border"
                )}>
                  {index + 1}
                </span>
                
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="address-text text-foreground font-medium text-sm">
                      {wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}
                    </p>
                    {getRoleBadge(wallet.walletRole)}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1">
                    {wallet.suspicionReasons.length > 0 
                      ? wallet.suspicionReasons[0].slice(0, 50) + (wallet.suspicionReasons[0].length > 50 ? '...' : '')
                      : 'Multiple indicators detected'}
                  </p>
                </div>
                
                <div className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-bold shrink-0 border-2",
                  level === 'high' && "bg-suspicion-high/20 text-suspicion-high border-suspicion-high/40",
                  level === 'medium' && "bg-suspicion-medium/20 text-suspicion-medium border-suspicion-medium/40",
                  level === 'low' && "bg-suspicion-low/20 text-suspicion-low border-suspicion-low/40",
                )}>
                  {wallet.suspicionScore}
                </div>
              </div>
            </button>
          );
        })}
        
        {wallets.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No data loaded</p>
            <p className="text-xs mt-1">Load transaction data to see suspicious wallets</p>
          </div>
        )}
      </div>
    </div>
  );
}
