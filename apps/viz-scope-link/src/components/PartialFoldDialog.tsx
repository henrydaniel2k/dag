import { useState } from "react";
import { NodeType, Node as GraphNode } from "@/lib/models";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NodeTypeIcon } from "@/components/icons/NodeTypeIcon";

interface PartialFoldDialogProps {
  open: boolean;
  onClose: () => void;
  nodeType: NodeType;
  nodes: GraphNode[];
  onFold: (nodeIds: string[]) => void;
  getNodeName: (nodeId: string) => string;
}

export function PartialFoldDialog({
  open,
  onClose,
  nodeType,
  nodes,
  onFold,
  getNodeName,
}: PartialFoldDialogProps) {
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());

  const handleToggle = (nodeId: string) => {
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

  const handleFoldSelected = () => {
    if (selectedNodeIds.size > 0) {
      onFold(Array.from(selectedNodeIds));
      onClose();
      setSelectedNodeIds(new Set());
    }
  };

  const handleFoldAll = () => {
    onFold(nodes.map((n) => n.id));
    onClose();
    setSelectedNodeIds(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <NodeTypeIcon type={nodeType} size={20} className="text-primary" />
            Partial Fold: {nodeType}
          </DialogTitle>
          <DialogDescription>
            Select which {nodeType} nodes to fold into a meta-node.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-2">
            {nodes.map((node) => (
              <div
                key={node.id}
                className="flex items-center gap-3 p-2 rounded-md border border-border hover:bg-muted/50 cursor-pointer"
                onClick={() => handleToggle(node.id)}
              >
                <Checkbox
                  checked={selectedNodeIds.has(node.id)}
                  onCheckedChange={() => handleToggle(node.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{getNodeName(node.id)}</div>
                  <div className="text-xs text-muted-foreground">{node.id}</div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleFoldAll}>
            Fold All
          </Button>
          <Button onClick={handleFoldSelected} disabled={selectedNodeIds.size === 0}>
            Fold Selected ({selectedNodeIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
