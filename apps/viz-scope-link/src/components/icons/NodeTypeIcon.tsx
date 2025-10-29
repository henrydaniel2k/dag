import { NodeType } from "@/lib/models";
import { getNodeTypeIcon } from "@/lib/icons/nodeTypeIcons";

interface NodeTypeIconProps {
  type: NodeType;
  className?: string;
  size?: number;
}

export function NodeTypeIcon({ type, className = "", size }: NodeTypeIconProps) {
  const icon = getNodeTypeIcon(type);
  const iconSize = size || icon.size;

  return (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox={icon.viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label={`${type} icon`}
      role="img"
    >
      <path d={icon.path} />
    </svg>
  );
}
