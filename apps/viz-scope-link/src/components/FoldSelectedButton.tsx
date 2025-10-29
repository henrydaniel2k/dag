import { Button } from "@/components/ui/button";
import { FoldVertical } from "lucide-react";

interface FoldSelectedButtonProps {
  selectedCount: number;
  onFoldSelected: () => void;
}

export function FoldSelectedButton({
  selectedCount,
  onFoldSelected,
}: FoldSelectedButtonProps) {
  if (selectedCount < 2) return null;

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={onFoldSelected}
      className="fixed bottom-4 right-4 shadow-lg z-50"
    >
      <FoldVertical className="w-4 h-4 mr-2" />
      Fold Selected ({selectedCount})
    </Button>
  );
}
