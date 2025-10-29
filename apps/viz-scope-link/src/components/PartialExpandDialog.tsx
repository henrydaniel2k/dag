import { MetaNode } from "@/lib/models";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

interface PartialExpandDialogProps {
  metaNode: MetaNode | null;
  open: boolean;
  onClose: () => void;
  onExpand: (nodeIds: string[]) => void;
  getNodeName: (nodeId: string) => string;
}

export function PartialExpandDialog({
  metaNode,
  open,
  onClose,
  onExpand,
  getNodeName,
}: PartialExpandDialogProps) {
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());

  if (!metaNode) return null;

  const handleToggle = (nodeId: string) => {
    const newSelected = new Set(selectedNodes);
    if (newSelected.has(nodeId)) {
      newSelected.delete(nodeId);
    } else {
      newSelected.add(nodeId);
    }
    setSelectedNodes(newSelected);
  };

  const handleExpandSelected = () => {
    onExpand(Array.from(selectedNodes));
    setSelectedNodes(new Set());
    onClose();
  };

  const handleExpandAll = () => {
    onExpand(metaNode.nodeIds);
    setSelectedNodes(new Set());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Expand Nodes from {metaNode.type}</DialogTitle>
          <DialogDescription>
            Select which nodes to expand from this meta-node ({metaNode.count} nodes)
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[400px] overflow-y-auto space-y-2">
          {metaNode.nodeIds.map((nodeId) => (
            <div key={nodeId} className="flex items-center space-x-2">
              <Checkbox
                id={nodeId}
                checked={selectedNodes.has(nodeId)}
                onCheckedChange={() => handleToggle(nodeId)}
              />
              <label
                htmlFor={nodeId}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {getNodeName(nodeId)}
              </label>
            </div>
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={handleExpandAll}
          >
            Expand All
          </Button>
          <Button
            onClick={handleExpandSelected}
            disabled={selectedNodes.size === 0}
          >
            Expand Selected ({selectedNodes.size})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
