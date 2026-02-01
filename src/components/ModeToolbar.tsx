import { cn } from '@/lib/utils';
import { Eye, Crosshair, Shield, ChevronDown } from 'lucide-react';
import { ViewMode } from '@/types/transaction';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface ModeToolbarProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  seedCount: number;
  patternCount: number;
  zeroDayCount: number;
}

export function ModeToolbar({ 
  currentMode, 
  onModeChange, 
  seedCount, 
  patternCount,
  zeroDayCount 
}: ModeToolbarProps) {
  const modes: { id: ViewMode; label: string; icon: React.ReactNode; description: string }[] = [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: <Eye className="w-4 h-4" />,
      description: 'Full network visualization with temporal analysis'
    },
    { 
      id: 'forensic', 
      label: 'Forensic Anchor', 
      icon: <Crosshair className="w-4 h-4" />,
      description: 'Seed-driven subgraph expansion & investigation'
    },
    { 
      id: 'adaptive', 
      label: 'Adaptive Guard', 
      icon: <Shield className="w-4 h-4" />,
      description: 'Pattern matching & zero-day detection'
    },
  ];

  return (
    <div className="w-full bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-[1920px] mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Mode buttons */}
          <div className="flex items-center gap-1">
            {modes.map(mode => (
              <button
                key={mode.id}
                onClick={() => onModeChange(mode.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  "hover:bg-secondary/80",
                  currentMode === mode.id 
                    ? "bg-primary/20 text-primary border border-primary/30" 
                    : "text-muted-foreground border border-transparent"
                )}
              >
                {mode.icon}
                <span>{mode.label}</span>
                
                {/* Badge for counts */}
                {mode.id === 'forensic' && seedCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-xs">
                    {seedCount}
                  </span>
                )}
                {mode.id === 'adaptive' && zeroDayCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-500 text-xs animate-pulse">
                    {zeroDayCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Mode description */}
          <div className="flex items-center gap-4">
            <p className="text-xs text-muted-foreground">
              {modes.find(m => m.id === currentMode)?.description}
            </p>

            {/* Quick actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  Quick Actions
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onModeChange('forensic')}>
                  <Crosshair className="w-4 h-4 mr-2" />
                  Start Investigation
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onModeChange('adaptive')}>
                  <Shield className="w-4 h-4 mr-2" />
                  Scan for Patterns
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
