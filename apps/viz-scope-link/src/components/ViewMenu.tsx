import { Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type ViewType = "Physical View" | "Graph View" | "Data Reports" | "Alerts" | "Data Inputs";

interface ViewMenuProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function ViewMenu({ currentView, onViewChange }: ViewMenuProps) {
  const views: ViewType[] = ["Physical View", "Graph View", "Data Reports", "Alerts", "Data Inputs"];

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {views.map((view) => (
            <DropdownMenuItem
              key={view}
              onClick={() => onViewChange(view)}
              className={currentView === view ? "bg-accent" : ""}
            >
              {view}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <span className="text-sm font-medium">{currentView}</span>
    </div>
  );
}
