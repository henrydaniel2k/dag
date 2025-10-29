import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Layers, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ImmersiveToggleProps {
  immersiveMode: boolean;
  onToggle: (value: boolean) => void;
}

export function ImmersiveToggle({ immersiveMode, onToggle }: ImmersiveToggleProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-l border-border">
      <div className="relative">
        <Layers className="h-4 w-4 text-muted-foreground" />
        {immersiveMode && (
          <span
            className="absolute -top-1 -right-1 flex h-2 w-2"
            aria-label="Immersive mode active"
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
        )}
      </div>
      <Switch id="immersive-mode" checked={immersiveMode} onCheckedChange={onToggle} disabled />
      <Label htmlFor="immersive-mode" className="text-sm font-medium">
        Immersive
      </Label>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Toggle Immersive Mode (I) - View multiple topologies simultaneously</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
