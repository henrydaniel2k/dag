import { NodeType, Node as GraphNode, Topology } from "@/lib/models";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NodeTypeIcon } from "@/components/icons/NodeTypeIcon";
import { Minimize2, Maximize2, EyeOff, Eye, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getBranchNodes } from "@/lib/scope";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useState, useMemo } from "react";

interface NodeGroupPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeType: NodeType | null;
  nodes: GraphNode[];
  foldedNodeIds: Set<string>;
  hiddenBranchRoots: Set<string>;
  visibleIdsBeforeFold: Set<string>;
  topology: Topology;
  onFoldNodes: (nodeIds: string[]) => void;
  onUnfoldNodes: (nodeIds: string[]) => void;
  onHideBranch?: (nodeIds: string[]) => void;
  onUnhideBranch?: (nodeIds: string[]) => void;
}

export function NodeGroupPanel({
  open,
  onOpenChange,
  nodeType,
  nodes,
  foldedNodeIds,
  hiddenBranchRoots,
  visibleIdsBeforeFold,
  topology,
  onFoldNodes,
  onUnfoldNodes,
  onHideBranch,
  onUnhideBranch,
}: NodeGroupPanelProps) {
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'eligible' | 'hidden'>('all');

  const handleToggleNode = (nodeId: string) => {
    setSelectedNodeIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedNodeIds.size === nodes.length) {
      setSelectedNodeIds(new Set());
    } else {
      setSelectedNodeIds(new Set(nodes.map((n) => n.id)));
    }
  };

  const handleFoldSelected = () => {
    onFoldNodes(Array.from(selectedNodeIds));
    setSelectedNodeIds(new Set());
  };

  const handleUnfoldSelected = () => {
    onUnfoldNodes(Array.from(selectedNodeIds));
    setSelectedNodeIds(new Set());
  };

  const handleHideBranchSelected = () => {
    if (onHideBranch) {
      onHideBranch(Array.from(selectedNodeIds));
      setSelectedNodeIds(new Set());
    }
  };

  const handleUnhideBranchSelected = () => {
    if (onUnhideBranch) {
      onUnhideBranch(Array.from(selectedNodeIds));
      setSelectedNodeIds(new Set());
    }
  };

  // Filtered nodes based on selected filter
  const filteredNodes = useMemo(() => {
    if (filter === 'eligible') {
      return nodes.filter(n => 
        n.parents.some(p => visibleIdsBeforeFold.has(p)) && 
        n.children.length > 0 &&
        !hiddenBranchRoots.has(n.id)
      );
    }
    if (filter === 'hidden') {
      return nodes.filter(n => hiddenBranchRoots.has(n.id));
    }
    return nodes;
  }, [nodes, filter, visibleIdsBeforeFold, hiddenBranchRoots]);

  // Check eligibility for bulk hide (nodes must have children and visible parents)
  const canHideSelected = useMemo(() => {
    if (selectedNodeIds.size === 0) return false;
    return Array.from(selectedNodeIds).every(nodeId => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return false;
      const hasVisibleParent = node.parents.some(p => visibleIdsBeforeFold.has(p));
      return hasVisibleParent && node.children.length > 0;
    });
  }, [selectedNodeIds, nodes, visibleIdsBeforeFold]);

  const canUnhideSelected = useMemo(() => {
    return Array.from(selectedNodeIds).some(nodeId => hiddenBranchRoots.has(nodeId));
  }, [selectedNodeIds, hiddenBranchRoots]);

  // Count ineligible nodes in selection
  const ineligibleCount = useMemo(() => {
    return Array.from(selectedNodeIds).filter(nodeId => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return true;
      const hasVisibleParent = node.parents.some(p => visibleIdsBeforeFold.has(p));
      return !hasVisibleParent || node.children.length === 0;
    }).length;
  }, [selectedNodeIds, nodes, visibleIdsBeforeFold]);

  const foldedCount = nodes.filter((n) => foldedNodeIds.has(n.id)).length;
  const unfoldedCount = nodes.length - foldedCount;
  const hiddenCount = nodes.filter(n => hiddenBranchRoots.has(n.id)).length;
  const eligibleCount = nodes.filter(n => 
    n.parents.some(p => visibleIdsBeforeFold.has(p)) && 
    n.children.length > 0 &&
    !hiddenBranchRoots.has(n.id)
  ).length;

  if (!nodeType) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <NodeTypeIcon type={nodeType} size={20} className="text-primary" />
            {nodeType} Nodes
          </SheetTitle>
          <SheetDescription>
            {nodes.length} {nodes.length === 1 ? "node" : "nodes"} 
            {hiddenCount > 0 && ` • ${hiddenCount} hidden`}
            {` • ${foldedCount} folded • ${unfoldedCount} visible`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Bulk actions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs"
              >
                {selectedNodeIds.size === nodes.length ? "Deselect All" : "Select All"}
              </Button>
              <span className="text-xs text-muted-foreground">
                {selectedNodeIds.size} selected
              </span>
            </div>

            {selectedNodeIds.size > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFoldSelected}
                    className="flex-1 h-8 text-xs"
                  >
                    <Minimize2 className="h-3 w-3 mr-1" />
                    Fold
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUnfoldSelected}
                    className="flex-1 h-8 text-xs"
                  >
                    <Maximize2 className="h-3 w-3 mr-1" />
                    Unfold
                  </Button>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  {onHideBranch && filter !== 'hidden' && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleHideBranchSelected}
                              className="w-full h-8 text-xs"
                              disabled={!canHideSelected}
                            >
                              <EyeOff className="h-3 w-3 mr-1" />
                              Hide Branch
                            </Button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {canHideSelected 
                            ? `Hide selected branches (${selectedNodeIds.size})`
                            : ineligibleCount > 0 
                              ? `Cannot hide: ${ineligibleCount} ${ineligibleCount === 1 ? 'node lacks' : 'nodes lack'} a parent in this view`
                              : "Select eligible nodes to hide"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {onUnhideBranch && canUnhideSelected && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUnhideBranchSelected}
                      className="flex-1 h-8 text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Unhide Branch
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Filter pills */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-1">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className="h-7 text-xs px-3"
              >
                All
              </Button>
              <Button
                variant={filter === 'eligible' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('eligible')}
                className="h-7 text-xs px-3"
              >
                Eligible ({eligibleCount})
              </Button>
              <Button
                variant={filter === 'hidden' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('hidden')}
                className="h-7 text-xs px-3"
              >
                Hidden ({hiddenCount})
              </Button>
            </div>
          </div>

          {/* Node list */}
          <ScrollArea className="h-[calc(100vh-360px)]">
            <div className="space-y-1 pr-4">
              {filteredNodes.map((node) => {
                const isFolded = foldedNodeIds.has(node.id);
                const isHidden = hiddenBranchRoots.has(node.id);
                const isSelected = selectedNodeIds.has(node.id);

                return (
                  <div
                    key={node.id}
                    className={`flex items-center gap-3 p-2 rounded-md border transition-colors ${
                      isSelected
                        ? "bg-primary/10 border-primary/30"
                        : "bg-card border-border hover:bg-muted/50"
                    } ${isHidden ? 'opacity-70' : ''}`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleNode(node.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate">{node.name}</span>
                        {isHidden && (
                          <Badge variant="outline" className="text-xs">
                            Hidden branch
                          </Badge>
                        )}
                        {isFolded && (
                          <Badge variant="secondary" className="text-xs">
                            Folded
                          </Badge>
                        )}
                        {!isHidden && (
                          <Badge variant="secondary" className="text-xs">
                            Visible
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{node.id}</span>
                        <span>•</span>
                        <span>{node.children.length} children</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
