import { Node, NodeType } from "@/lib/models";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface NodeContextMenuProps {
  node: Node;
  children: React.ReactNode;
  onOpenDataPanel: () => void;
  onSetAsMsn: () => void;
  onToggleFoldType: () => void;
  onOpenBranchPanel?: () => void;
  canOpenBranch: boolean;
}

export function NodeContextMenu({
  node,
  children,
  onOpenDataPanel,
  onSetAsMsn,
  onToggleFoldType,
  onOpenBranchPanel,
  canOpenBranch,
}: NodeContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onOpenDataPanel}>
          Open Node Data Panel
        </ContextMenuItem>
        <ContextMenuItem onClick={onSetAsMsn}>
          Set as MSN
        </ContextMenuItem>
        <ContextMenuItem onClick={onToggleFoldType}>
          Toggle Fold {node.type}
        </ContextMenuItem>
        {canOpenBranch && onOpenBranchPanel && (
          <ContextMenuItem onClick={onOpenBranchPanel}>
            Open Branch Data Panel
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
