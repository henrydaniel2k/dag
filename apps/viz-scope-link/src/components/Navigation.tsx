import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, GripVertical } from "lucide-react";
import { Node, TopologyType } from "@/lib/models";
import { buildPseudoTree } from "@/lib/scope";
import { electricalTopology, coolingTopology } from "@/mocks/topologies";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { NodeTypeIcon } from "@/components/icons/NodeTypeIcon";

interface NavigationProps {
  selectedManto: TopologyType;
  onMantoChange: (manto: TopologyType) => void;
  selectedMsn: string | null;
  onMsnChange: (msn: string) => void;
}

export function Navigation({
  selectedManto,
  onMantoChange,
  selectedMsn,
  onMsnChange,
}: NavigationProps) {
  const topology = selectedManto === "Electrical" ? electricalTopology : coolingTopology;
  
  // Resizable width with localStorage persistence
  const [navWidth, setNavWidth] = useState<number>(() => {
    const stored = localStorage.getItem('nav-width');
    return stored ? parseInt(stored, 10) : 360;
  });
  const [isResizing, setIsResizing] = useState(false);
  
  // Auto-expand all nodes by default
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    const allNodeIds = new Set<string>();
    topology.nodes.forEach((node) => {
      if (node.children.length > 0) {
        allNodeIds.add(node.id);
      }
    });
    return allNodeIds;
  });

  // Update expanded nodes when topology changes
  useEffect(() => {
    const allNodeIds = new Set<string>();
    topology.nodes.forEach((node) => {
      if (node.children.length > 0) {
        allNodeIds.add(node.id);
      }
    });
    setExpandedNodes(allNodeIds);
  }, [selectedManto, topology]);

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(280, Math.min(420, e.clientX));
      setNavWidth(newWidth);
      localStorage.setItem('nav-width', newWidth.toString());
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const pseudoTree = buildPseudoTree(topology);

  // Get root nodes (nodes with no parents)
  const rootNodes = Array.from(topology.nodes.values())
    .filter((node) => node.parents.length === 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  const toggleExpand = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderTreeNode = (node: Node, depth: number = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedMsn === node.id;

    return (
      <div key={node.id}>
        <TooltipProvider delayDuration={500}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`flex items-center gap-2 px-2 py-2 cursor-pointer transition-colors rounded-lg ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary"
                }`}
                style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
                onClick={() => onMsnChange(node.id)}
              >
                {hasChildren ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(node.id);
                    }}
                    className="p-0.5 hover:bg-muted rounded flex-shrink-0"
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                ) : (
                  <span className="w-5 flex-shrink-0" />
                )}
                <NodeTypeIcon 
                  type={node.type} 
                  size={16} 
                  className={isSelected ? "text-primary-foreground flex-shrink-0" : "text-primary flex-shrink-0"} 
                />
                <span className="text-sm font-medium truncate flex-1 min-w-0">{node.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground ml-auto flex-shrink-0 whitespace-nowrap">
                  {node.type}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="font-medium">{node.name}</p>
              <p className="text-xs text-muted-foreground">{node.type}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {hasChildren && isExpanded && (
          <div>
            {node.children
              .map((childId) => topology.nodes.get(childId))
              .filter((child): child is Node => child !== undefined)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="border-r border-border bg-card flex flex-col h-full relative"
      style={{ width: `${navWidth}px` }}
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">Navigation</h2>
          <Select value={selectedManto} onValueChange={(value) => onMantoChange(value as TopologyType)}>
            <SelectTrigger className="h-9 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Electrical">Electrical</SelectItem>
              <SelectItem value="Cooling">Cooling</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3">
          {rootNodes.map((node) => renderTreeNode(node))}
        </div>
      </ScrollArea>
      
      {/* Resize handle */}
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/50 transition-colors group"
        onMouseDown={() => setIsResizing(true)}
        role="separator"
        aria-label="Resize navigation panel"
      >
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
