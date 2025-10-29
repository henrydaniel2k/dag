import { NodeType } from "@/lib/models";
import { Button } from "@/components/ui/button";
import { QuickNodeTypeChip } from "@/components/QuickNodeTypeChip";
import { ListTree } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface QuickNodeTypeControlsProps {
  scopeTypes: NodeType[];
  hiddenTypes: NodeType[];
  onToggleType: (type: NodeType) => void;
  lockedType: NodeType | null;
  foldedNodeIds: Set<string>;
  onOpenNodeTypePanel: () => void;
  getTypeNodeCount: (type: NodeType) => { total: number; folded: number; unfolded: number; visible: number; hiddenBranch: number };
  autoFoldedTypes: Set<NodeType>;
  hasNonDefaultSettings: boolean;
}

export function QuickNodeTypeControls({
  scopeTypes,
  hiddenTypes,
  onToggleType,
  lockedType,
  foldedNodeIds,
  onOpenNodeTypePanel,
  getTypeNodeCount,
  autoFoldedTypes,
  hasNonDefaultSettings,
}: QuickNodeTypeControlsProps) {
  const hiddenSet = new Set(hiddenTypes);

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-background">
      {/* Node Types Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenNodeTypePanel}
        className="relative h-8"
        title="Open Node Type Panel (T)"
      >
        <ListTree className="h-4 w-4 mr-2" />
        Node Types
        {hasNonDefaultSettings && (
          <span
            className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary"
            aria-label="Node types modified"
          />
        )}
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Quick Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {scopeTypes.map((type) => {
          const isLocked = type === lockedType;
          const isVisible = !hiddenSet.has(type);
          const counts = getTypeNodeCount(type);
          const isAutoFolded = autoFoldedTypes.has(type);
          const isPartialFolded = counts.folded > 0 && counts.unfolded > 0;
          const showCount = counts.folded > 0;

          return (
            <QuickNodeTypeChip
              key={type}
              type={type}
              isVisible={isVisible}
              isLocked={isLocked}
              isAutoFolded={isAutoFolded}
              isPartialFolded={isPartialFolded}
              count={showCount ? counts.total : undefined}
              onClick={() => {
                if (!isLocked) {
                  onToggleType(type);
                }
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
