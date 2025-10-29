import { Variable, TimeWindow } from "@/lib/models";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { availableVariables } from "@/mocks/topologies";
import { getAllowedWindows } from "@/lib/timeWindows";

interface MetricSelectorProps {
  selectedMetric: Variable | null;
  onMetricChange: (metric: Variable | null) => void;
  selectedWindow: TimeWindow;
  onWindowChange: (window: TimeWindow) => void;
}

export function MetricSelector({
  selectedMetric,
  onMetricChange,
  selectedWindow,
  onWindowChange,
}: MetricSelectorProps) {
  const allowedWindows = selectedMetric
    ? getAllowedWindows(selectedMetric)
    : ["Latest", "15m", "1h", "3h", "12h", "24h", "3d", "7d", "14d", "30d", "Custom"];

  return (
    <div className="flex items-center gap-4 p-4 border-b border-border bg-card">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium whitespace-nowrap">
          Overlay Metric:
        </label>
        <Select
          value={selectedMetric?.id || "none"}
          onValueChange={(value) => {
            if (value === "none") {
              onMetricChange(null as any);
            } else {
              const metric = availableVariables.find((v) => v.id === value);
              if (metric) onMetricChange(metric);
            }
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select metric" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {availableVariables.map((variable) => (
              <SelectItem key={variable.id} value={variable.id}>
                {variable.name} ({variable.unit})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium whitespace-nowrap">
          Time Window:
        </label>
        <Select value={selectedWindow} onValueChange={(value) => onWindowChange(value as TimeWindow)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(allowedWindows as TimeWindow[]).map((window) => (
              <SelectItem key={window} value={window}>
                {window}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
