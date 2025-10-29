import { NodeType } from "@/lib/models";
import { NodeTypeIcon } from "@/components/icons/NodeTypeIcon";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface QuickNodeTypeChipProps {
  type: NodeType;
  isVisible: boolean;
  isLocked: boolean;
  isAutoFolded: boolean;
  isPartialFolded: boolean;
  count?: number;
  onClick: () => void;
  onAltClick?: () => void;
  onShiftClick?: () => void;
  onLongPress?: () => void;
  onRightClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export function QuickNodeTypeChip({
  type,
  isVisible,
  isLocked,
  isAutoFolded,
  isPartialFolded,
  count,
  onClick,
  onAltClick,
  onShiftClick,
  onLongPress,
  onRightClick,
  className,
}: QuickNodeTypeChipProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (e.altKey && onAltClick) {
      onAltClick();
    } else if (e.shiftKey && onShiftClick) {
      onShiftClick();
    } else if (!isLocked) {
      onClick();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onRightClick) {
      onRightClick(e);
    }
  };

  const tooltipText = isLocked
    ? "MSN type cannot be hidden"
    : `${isVisible ? "Hide" : "Show"} ${type} in current scope`;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button
            role="button"
            aria-pressed={isVisible}
            aria-disabled={isLocked}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 h-8 rounded-md border text-sm transition-all",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isVisible
                ? "bg-[var(--chip-visible-bg)] border-[var(--chip-visible-border)] text-[var(--chip-visible-text)]"
                : "bg-transparent border-border text-muted-foreground opacity-60",
              isLocked
                ? "cursor-not-allowed opacity-70"
                : "hover:brightness-110 cursor-pointer",
              className
            )}
          >
            <NodeTypeIcon type={type} size={16} />
            <span className="text-xs select-none whitespace-nowrap">{type}</span>
            {count !== undefined && count > 0 && (
              <span className="text-[10px] text-muted-foreground ml-0.5">×{count}</span>
            )}
            <div className="flex items-center gap-1 ml-1">
              {isLocked && (
                <Badge
                  variant="outline"
                  className="h-4 px-1.5 text-[10px] border-[var(--badge-lock)] text-[var(--badge-lock)]"
                  aria-label="MSN type cannot be hidden"
                >
                  <Lock className="h-2.5 w-2.5" />
                </Badge>
              )}
              {isAutoFolded && !isLocked && (
                <Badge
                  variant="outline"
                  className="h-4 px-1.5 text-[10px] border-[var(--badge-auto)] text-[var(--badge-auto)]"
                  aria-label="Auto-folded"
                >
                  AUTO
                </Badge>
              )}
              {isPartialFolded && !isLocked && (
                <Badge
                  variant="outline"
                  className="h-4 px-1.5 text-[10px] border-[var(--badge-partial)] text-[var(--badge-partial)]"
                  aria-label="Partially folded"
                >
                  PARTIAL
                </Badge>
              )}
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
