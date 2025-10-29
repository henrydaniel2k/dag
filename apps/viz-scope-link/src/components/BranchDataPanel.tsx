import { X } from "lucide-react";
import { Node, NodeType, Variable, TimeWindow } from "@/lib/models";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { NodeTypeIcon } from "@/components/icons/NodeTypeIcon";
import { getBranchNodes } from "@/lib/scope";
import { electricalTopology } from "@/mocks/topologies";
import { getAlignedTimePeriod } from "@/lib/timeWindows";

interface BranchDataPanelProps {
  rootNode: Node;
  onClose: () => void;
  overlayMetric: Variable | null;
  timeWindow: TimeWindow;
}

export function BranchDataPanel({
  rootNode,
  onClose,
  overlayMetric,
  timeWindow,
}: BranchDataPanelProps) {
  // Get all branch nodes (MANTO-only)
  const branchNodeIds = getBranchNodes(rootNode.id, electricalTopology);
  const branchNodes = Array.from(branchNodeIds)
    .map((id) => electricalTopology.nodes.get(id))
    .filter((n): n is Node => n !== undefined);

  // Count node types
  const typeCounts = new Map<NodeType, number>();
  for (const node of branchNodes) {
    typeCounts.set(node.type, (typeCounts.get(node.type) || 0) + 1);
  }

  // Consolidate integrated metrics only
  const integratedMetrics = branchNodes
    .flatMap((n) => n.metrics)
    .filter((m) => m.variable.isIntegrated);

  const metricsByVariable = new Map<string, typeof integratedMetrics>();
  for (const metric of integratedMetrics) {
    const key = metric.variable.id;
    if (!metricsByVariable.has(key)) {
      metricsByVariable.set(key, []);
    }
    metricsByVariable.get(key)!.push(metric);
  }

  const consolidatedMetrics = Array.from(metricsByVariable.entries()).map(
    ([varId, metrics]) => {
      const variable = metrics[0].variable;
      let consolidatedValue: number;

      if (variable.type === "extensive") {
        consolidatedValue = metrics.reduce((sum, m) => sum + m.value, 0);
      } else {
        consolidatedValue =
          metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
      }

      return {
        variable,
        value: consolidatedValue,
      };
    }
  );

  // Time alignment
  const timePeriod = overlayMetric
    ? getAlignedTimePeriod(timeWindow, overlayMetric.sit, timeWindow)
    : { period: timeWindow, shouldConsolidate: false };

  return (
    <div className="w-96 border-l border-border bg-card flex flex-col h-full animate-slide-in-right">
      <div className="p-4 border-b border-border flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">Branch Data</h3>
          <p className="text-sm text-muted-foreground">
            Root: {rootNode.name}
          </p>
          <Badge variant="secondary" className="mt-2">
            {branchNodes.length} nodes
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 border-b border-border bg-muted">
        <p className="text-xs text-muted-foreground">Time Period (MANTO only) • {timePeriod.period}</p>
        {timePeriod.shouldConsolidate && (
          <p className="text-xs text-warning mt-1">Data consolidated to window</p>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">
              Consolidated Metrics (Integrated Only)
            </h4>
            <div className="space-y-2">
              {consolidatedMetrics.length > 0 ? (
                consolidatedMetrics.map(({ variable, value }) => (
                  <div
                    key={variable.id}
                    className="flex items-center justify-between p-3 rounded-md bg-secondary"
                  >
                    <div>
                      <p className="text-sm font-medium">{variable.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {variable.type === "extensive" ? "Sum" : "Average"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{value.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {variable.unit}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No integrated metrics available
                </p>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Branch Inventory</h4>
            <div className="space-y-2">
              {Array.from(typeCounts.entries())
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([type, count]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between p-3 rounded-md bg-secondary"
                  >
                    <div className="flex items-center gap-2">
                      <NodeTypeIcon type={type} className="text-primary" size={16} />
                      <p className="text-sm font-medium">{type}</p>
                    </div>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              <div className="flex items-center justify-between p-3 rounded-md bg-primary/10 border border-primary">
                <p className="text-sm font-semibold">Total Nodes</p>
                <Badge variant="default">{branchNodes.length}</Badge>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
