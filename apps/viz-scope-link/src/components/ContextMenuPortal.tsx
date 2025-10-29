import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Database, Target, FoldVertical, GitBranch, Layers, EyeOff, Eye } from "lucide-react";
import { Node } from "@/lib/models";

interface ContextMenuPortalProps {
  isOpen: boolean;
  x: number;
  y: number;
  node: Node | null;
  canOpenBranch: boolean;
  visibleNodes: Node[];
  allScopeNodes: Node[]; // All nodes in current scope (folded + unfolded)
  hiddenBranchRoots: Set<string>;
  visibleIdsBeforeFold: Set<string>;
  onOpenDataPanel: () => void;
  onSetAsMsn: () => void;
  onToggleFold: () => void;
  onOpenBranchPanel: () => void;
  onOpenNodeTypePanel: () => void;
  onHideBranch: (nodeId: string) => void;
  onUnhideBranch: (nodeId: string) => void;
  onClose: () => void;
}

export function ContextMenuPortal({
  isOpen,
  x,
  y,
  node,
  canOpenBranch,
  visibleNodes,
  allScopeNodes,
  hiddenBranchRoots,
  visibleIdsBeforeFold,
  onOpenDataPanel,
  onSetAsMsn,
  onToggleFold,
  onOpenBranchPanel,
  onOpenNodeTypePanel,
  onHideBranch,
  onUnhideBranch,
  onClose,
}: ContextMenuPortalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".context-menu-portal")) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    // Small delay to prevent immediate close
    setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }, 10);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Background context menu (no node)
  if (!node) {
    const menuWidth = 240;
    const menuHeight = 64;
    const adjustedX = x + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 10 : x;
    const adjustedY = y + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 10 : y;

    return createPortal(
      <div
        className="context-menu-portal fixed z-[100] min-w-[240px] rounded-lg border border-panel-border bg-panel-bg/95 backdrop-blur-sm shadow-xl animate-scale-in"
        style={{
          left: `${adjustedX}px`,
          top: `${adjustedY}px`,
        }}
      >
        <div className="py-1">
          <button
            onClick={() => {
              onOpenNodeTypePanel();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary hover:text-accent focus:outline-none focus:bg-secondary focus:text-accent"
          >
            <Layers className="w-4 h-4" />
            <span className="flex-1 text-left">Open Node Type Panel</span>
          </button>
        </div>
      </div>,
      document.body
    );
  }

  // Count ALL nodes of the same type in the current scope (folded + unfolded)
  const allNodesOfSameType = allScopeNodes.filter(n => n.type === node.type);
  const showFoldOption = allNodesOfSameType.length > 1;
  
  // Check if node can be hidden (has visible parent and has children)
  const hasVisibleParent = node.parents.some(parentId => visibleIdsBeforeFold.has(parentId));
  const canHideBranch = node.children.length > 0 && hasVisibleParent;
  const isHiddenRoot = hiddenBranchRoots.has(node.id);

  // Adjust position to keep menu in viewport
  const menuWidth = 240;
  const baseHeight = 96; // 3 base items
  const itemHeight = 32;
  let additionalItems = 0;
  if (showFoldOption) additionalItems++;
  if (canOpenBranch) additionalItems++;
  if (canHideBranch || isHiddenRoot) additionalItems++;
  const menuHeight = baseHeight + (additionalItems * itemHeight);
  const adjustedX = x + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 10 : x;
  const adjustedY = y + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 10 : y;

  const menuItems = [
    {
      icon: Database,
      label: "Open Node Data Panel",
      onClick: () => {
        onOpenDataPanel();
        onClose();
      },
    },
    {
      icon: Target,
      label: "Set as MSN",
      onClick: () => {
        onSetAsMsn();
        onClose();
      },
    },
    ...(showFoldOption
      ? [
          {
            icon: FoldVertical,
            label: `Fold this ${node.type}`,
            onClick: () => {
              onToggleFold();
              onClose();
            },
          },
        ]
      : []),
    ...(canHideBranch || isHiddenRoot
      ? [
          {
            icon: isHiddenRoot ? Eye : EyeOff,
            label: isHiddenRoot ? "Unhide Branch" : "Hide Branch...",
            onClick: () => {
              if (isHiddenRoot) {
                onUnhideBranch(node.id);
              } else {
                onHideBranch(node.id);
              }
              onClose();
            },
            disabled: !canHideBranch && !isHiddenRoot,
            disabledTooltip: "Cannot hide: this node has no upstream parent in the current view",
          },
        ]
      : []),
    ...(canOpenBranch
      ? [
          {
            icon: GitBranch,
            label: "Open Branch Data Panel",
            onClick: () => {
              onOpenBranchPanel();
              onClose();
            },
          },
        ]
      : []),
  ];

  return createPortal(
    <div
      className="context-menu-portal fixed z-[100] min-w-[240px] rounded-lg border border-panel-border bg-panel-bg/95 backdrop-blur-sm shadow-xl animate-scale-in"
      style={{
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
      }}
    >
      <div className="py-1">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={item.onClick}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary hover:text-accent focus:outline-none focus:bg-secondary focus:text-accent"
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  );
}
