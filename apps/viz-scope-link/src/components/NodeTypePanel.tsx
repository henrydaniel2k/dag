import { NodeType } from "@/lib/models";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { List, RotateCcw, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { VisibilityChip } from "@/components/VisibilityChip";
import { FoldStateSegmentedControl } from "@/components/FoldStateSegmentedControl";

interface NodeTypePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scopeTypes: NodeType[];
  hiddenTypes: NodeType[];
  onToggleType: (type: NodeType) => void;
  lockedType: NodeType | null;
  foldedNodeIds: Set<string>;
  onFoldAll: (type: NodeType) => void;
  onUnfoldAll: (type: NodeType) => void;
  onPartialFold: (type: NodeType) => void;
  getTypeNodeCount: (type: NodeType) => { total: number; folded: number; unfolded: number; visible: number; hiddenBranch: number };
  onOpenNodeGroup: (type: NodeType) => void;
  onResetToDefaults: () => void;
  autoFoldedTypes: Set<NodeType>;
  parentOnlyTypes: Set<NodeType>;
}

export function NodeTypePanel({
  open,
  onOpenChange,
  scopeTypes,
  hiddenTypes,
  onToggleType,
  lockedType,
  foldedNodeIds,
  onFoldAll,
  onUnfoldAll,
  onPartialFold,
  getTypeNodeCount,
  onOpenNodeGroup,
  onResetToDefaults,
  autoFoldedTypes,
  parentOnlyTypes,
}: NodeTypePanelProps) {
  const handleResetType = (type: NodeType) => {
    // Reset visibility if hidden
    if (hiddenTypes.includes(type)) {
      onToggleType(type);
    }
    
    // Reset fold state by unfolding all
    const counts = getTypeNodeCount(type);
    if (counts.folded > 0) {
      onUnfoldAll(type);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-[420px] sm:w-[460px] p-0 flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader className="px-6 py-4 border-b border-border">
          <div className="flex flex-col space-y-1">
            <SheetTitle>Node Types</SheetTitle>
            <SheetDescription>
              Control visibility and folding for each node type in this scope.
            </SheetDescription>
          </div>
        </SheetHeader>
        
        <ScrollArea className="px-4 py-2 h-[calc(100vh-120px)]">
          <div className="space-y-0">
            {scopeTypes.map((type) => {
              const isHidden = hiddenTypes.includes(type);
              const isLocked = type === lockedType;
              const isAutoFolded = autoFoldedTypes.has(type);
              const counts = getTypeNodeCount(type);
              const allFolded = counts.unfolded === 0 && counts.total > 0;
              const allUnfolded = counts.folded === 0 && counts.total > 0;
              const partiallyFolded = counts.folded > 0 && counts.unfolded > 0;
              
              let currentFoldState: "unfolded" | "folded" | "partial" = "unfolded";
              if (allFolded) {
                currentFoldState = "folded";
              } else if (partiallyFolded) {
                currentFoldState = "partial";
              }

              const getDisabledReason = (): "hidden" | "not-foldable" | "no-nodes" | undefined => {
                if (counts.total === 0) return "no-nodes";
                if (isHidden) return "hidden";
                if (isLocked) return "not-foldable";
                return undefined;
              };

              const getChipTooltip = () => {
                if (isLocked) return "MSN type cannot be hidden";
                if (counts.total === 0) return `No ${type} nodes in this scope`;
                return `Click to ${isHidden ? 'show' : 'hide'} ${type} in current scope`;
              };

              return (
                <div 
                  key={type} 
                  className="grid grid-cols-[minmax(0,1fr)_minmax(100px,auto)_auto] gap-2 px-4 py-3 border-b border-border/50 hover:bg-accent/5 items-center"
                >
              {/* Column A: Type chip + subline (NO BADGES) */}
              <div className="flex flex-col gap-1 min-w-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <VisibilityChip
                          type={type}
                          isVisible={!isHidden}
                          isDisabled={isLocked || counts.total === 0}
                          onClick={() => onToggleType(type)}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{getChipTooltip()}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {/* Subline with updated text */}
                <div className="text-xs text-muted-foreground truncate max-w-full">
                  {counts.total} node{counts.total !== 1 ? 's' : ''} • {counts.visible} visible
                  {counts.folded > 0 && ` • ${counts.folded} folded`}
                </div>
              </div>

                  {/* Column B: Fold control */}
                  <FoldStateSegmentedControl
                    foldState={currentFoldState}
                    onFoldAll={() => onFoldAll(type)}
                    onPartialFold={() => onPartialFold(type)}
                    onUnfoldAll={() => onUnfoldAll(type)}
                    disabled={isHidden || counts.total === 0 || isLocked}
                    disabledReason={getDisabledReason()}
                    typeName={type}
                  />

                  {/* Column C: Actions */}
                  <div className="flex items-center gap-1 justify-end">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onOpenNodeGroup(type)}
                          >
                            <List className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Open node list (Node Group Panel)</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleResetType(type)}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Reset this type to defaults
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        
        {/* Reset button at bottom */}
        <div className="px-6 py-4 border-t border-border flex justify-end">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onResetToDefaults}
                  className="h-9 w-9"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset all types to scope defaults</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </SheetContent>
    </Sheet>
  );
}
