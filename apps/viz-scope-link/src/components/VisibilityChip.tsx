import { Button } from "@/components/ui/button";
import { NodeTypeIcon } from "@/components/icons/NodeTypeIcon";
import { NodeType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface VisibilityChipProps {
  type: NodeType;
  isVisible: boolean;
  isDisabled: boolean;
  onClick: () => void;
  className?: string;
}

export function VisibilityChip({ type, isVisible, isDisabled, onClick, className }: VisibilityChipProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={isDisabled}
      aria-pressed={isVisible}
      aria-disabled={isDisabled}
      className={cn(
        "h-8 px-3 text-xs font-medium transition-all duration-150 gap-1.5",
        isVisible
          ? "bg-[hsl(var(--chip-visible-bg))] border-[hsl(var(--chip-visible-border))] text-[hsl(var(--chip-visible-text))] hover:brightness-110"
          : "bg-transparent border-border text-muted-foreground opacity-60 hover:opacity-80",
        isDisabled && "opacity-70 cursor-not-allowed",
        className
      )}
    >
      <NodeTypeIcon type={type} className="w-3.5 h-3.5" />
      {type}
    </Button>
  );
}
