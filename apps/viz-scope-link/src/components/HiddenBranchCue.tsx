import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HiddenBranch {
  rootId: string;
  rootName: string;
  nodeCount: number;
}

interface HiddenBranchCueProps {
  hiddenBranches: HiddenBranch[];
  onUnhide: (rootId: string) => void;
}

export function HiddenBranchCue({ hiddenBranches, onUnhide }: HiddenBranchCueProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  
  if (hiddenBranches.length === 0) return null;
  
  return (
    <TooltipProvider>
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger asChild>
          <button
            className="absolute right-[-12px] top-1/2 -translate-y-1/2 flex flex-col gap-[2px] cursor-pointer z-10 hover:opacity-100 transition-opacity"
            style={{ opacity: 0.85 }}
            onClick={(e) => {
              e.stopPropagation();
              setTooltipOpen(!tooltipOpen);
            }}
            aria-label={`${hiddenBranches.length} hidden branch${hiddenBranches.length > 1 ? 'es' : ''} downstream`}
          >
            <span className="w-[4px] h-[4px] rounded-full bg-primary" />
            <span className="w-[4px] h-[4px] rounded-full bg-primary" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[300px] p-2">
          <div className="space-y-1">
            {hiddenBranches.slice(0, 3).map((branch) => (
              <button
                key={branch.rootId}
                onClick={(e) => {
                  e.stopPropagation();
                  onUnhide(branch.rootId);
                  setTooltipOpen(false);
                }}
                className="w-full flex items-center justify-between gap-2 px-2 py-1 text-xs hover:bg-accent rounded transition-colors"
              >
                <span className="truncate">
                  Branch — <strong>{branch.rootName}</strong> ({branch.nodeCount} nodes)
                </span>
                <span className="text-primary">»</span>
              </button>
            ))}
            {hiddenBranches.length > 3 && (
              <div className="px-2 py-1 text-xs text-muted-foreground">
                +{hiddenBranches.length - 3} more
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
