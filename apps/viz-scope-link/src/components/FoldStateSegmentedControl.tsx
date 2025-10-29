import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Minimize2, FoldVertical, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FoldStateSegmentedControlProps {
  foldState: "unfolded" | "folded" | "partial";
  onFoldAll: () => void;
  onPartialFold: () => void;
  onUnfoldAll: () => void;
  disabled?: boolean;
  disabledReason?: "hidden" | "not-foldable" | "no-nodes";
  typeName?: string;
}

export function FoldStateSegmentedControl({ 
  foldState, 
  onFoldAll, 
  onPartialFold, 
  onUnfoldAll, 
  disabled,
  disabledReason,
  typeName = "nodes"
}: FoldStateSegmentedControlProps) {
  const getDisabledTooltip = () => {
    if (disabledReason === "hidden") return `Unhide ${typeName} to manage folding`;
    if (disabledReason === "not-foldable") return "Folding not applicable";
    if (disabledReason === "no-nodes") return `No ${typeName} nodes in this scope`;
    return undefined;
  };

  const disabledTooltip = getDisabledTooltip();
  return (
    <div className="inline-flex rounded-md border border-border overflow-hidden">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onFoldAll}
              disabled={disabled}
              className={cn(
                "h-8 w-9 rounded-none border-r border-border px-0 hover:bg-accent",
                foldState === "folded" && "bg-[hsl(var(--chip-visible-bg))] text-[hsl(var(--chip-visible-text))]",
                disabled && "opacity-50"
              )}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{disabledTooltip || `Fold all ${typeName}`}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onPartialFold}
              disabled={disabled}
              className={cn(
                "h-8 w-9 rounded-none border-r border-border px-0 hover:bg-accent",
                foldState === "partial" && "bg-[hsl(var(--chip-visible-bg))] text-[hsl(var(--chip-visible-text))]",
                disabled && "opacity-50"
              )}
            >
              <FoldVertical className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{disabledTooltip || `Partial fold ${typeName}`}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onUnfoldAll}
              disabled={disabled}
              className={cn(
                "h-8 w-9 rounded-none px-0 hover:bg-accent",
                foldState === "unfolded" && "bg-[hsl(var(--chip-visible-bg))] text-[hsl(var(--chip-visible-text))]",
                disabled && "opacity-50"
              )}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{disabledTooltip || `Unfold all ${typeName}`}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
