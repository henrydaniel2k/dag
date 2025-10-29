import { X, AlertCircle } from "lucide-react";
import { Node, Variable, TimeWindow } from "@/lib/models";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { NodeTypeIcon } from "@/components/icons/NodeTypeIcon";
import { getAlignedTimePeriod } from "@/lib/timeWindows";
import { electricalTopology, coolingTopology } from "@/mocks/topologies";

interface NodeDataPanelProps {
  node: Node;
  onClose: () => void;
  overlayMetric: Variable | null;
  timeWindow: TimeWindow;
}

// Metric families for organizing metrics
const METRIC_FAMILIES = {
  emissions: { name: "Emissions", order: 1 },
  energy: { name: "Energy & Power", order: 2 },
  environmental: { name: "Environmental", order: 3 },
  other: { name: "Other Metrics", order: 4 },
};

function getMetricFamily(variableName: string): keyof typeof METRIC_FAMILIES {
  const name = variableName.toLowerCase();
  if (name.includes("co2") || name.includes("emission")) return "emissions";
  if (name.includes("power") || name.includes("energy") || name.includes("current") || name.includes("voltage")) return "energy";
  if (name.includes("temperature") || name.includes("humidity")) return "environmental";
  return "other";
}

export function NodeDataPanel({
  node,
  onClose,
  overlayMetric,
  timeWindow,
}: NodeDataPanelProps) {
  // Get data across all topologies
  const allNodes: Node[] = [];
  if (node.topologies.includes("Electrical")) {
    const elecNode = electricalTopology.nodes.get(node.id);
    if (elecNode) allNodes.push(elecNode);
  }
  if (node.topologies.includes("Cooling")) {
    const coolNode = coolingTopology.nodes.get(node.id);
    if (coolNode) allNodes.push(coolNode);
  }

  // Merge metrics from all topologies
  const allMetrics = allNodes.flatMap((n) => n.metrics);
  const uniqueMetrics = Array.from(
    new Map(allMetrics.map((m) => [m.variable.id, m])).values()
  );

  // Group metrics by family
  const metricsByFamily = uniqueMetrics.reduce((acc, metric) => {
    const family = getMetricFamily(metric.variable.name);
    if (!acc[family]) acc[family] = [];
    acc[family].push(metric);
    return acc;
  }, {} as Record<keyof typeof METRIC_FAMILIES, typeof uniqueMetrics>);

  // Sort families by order
  const sortedFamilies = (Object.keys(metricsByFamily) as Array<keyof typeof METRIC_FAMILIES>)
    .sort((a, b) => METRIC_FAMILIES[a].order - METRIC_FAMILIES[b].order);

  // Time alignment
  const timePeriod = overlayMetric
    ? getAlignedTimePeriod(timeWindow, overlayMetric.sit, timeWindow)
    : { period: timeWindow, shouldConsolidate: false };

  return (
    <div className="w-96 border-l border-border bg-card flex flex-col h-full animate-slide-in-right">
      <div className="p-4 border-b border-border flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <NodeTypeIcon type={node.type} className="text-primary" size={16} />
            <h3 className="text-lg font-semibold">{node.name}</h3>
            {node.alerts && node.alerts.length > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Alert
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{node.type}</p>
          <div className="flex gap-1 mt-2">
            {node.topologies.map((topo) => (
              <Badge key={topo} variant="secondary" className="text-xs">
                {topo}
              </Badge>
            ))}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 border-b border-border bg-muted">
        <p className="text-xs text-muted-foreground">Time Period • {timePeriod.period}</p>
        {timePeriod.shouldConsolidate && (
          <p className="text-xs text-warning mt-1">Data consolidated to window</p>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {node.alerts && node.alerts.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Alerts</h4>
              <div className="space-y-2">
                {node.alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20"
                  >
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                    <p className="text-sm">{alert}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sortedFamilies.map((family) => (
            <div key={family}>
              <h4 className="text-sm font-semibold mb-2">{METRIC_FAMILIES[family].name}</h4>
              <div className="space-y-2">
                {metricsByFamily[family].map((metric) => (
                  <div
                    key={metric.variable.id}
                    className="p-3 rounded-md bg-secondary"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{metric.variable.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {metric.variable.type} • SIT: {metric.variable.sit}m
                          {metric.variable.isIntegrated && " • Integrated"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">
                          {metric.value.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {metric.variable.unit}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div>
            <h4 className="text-sm font-semibold mb-2">Connections</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-md bg-secondary text-center">
                <p className="text-xs text-muted-foreground mb-1">Parents</p>
                <p className="text-2xl font-bold">{node.parents.length}</p>
              </div>
              <div className="p-3 rounded-md bg-secondary text-center">
                <p className="text-xs text-muted-foreground mb-1">Children</p>
                <p className="text-2xl font-bold">{node.children.length}</p>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
