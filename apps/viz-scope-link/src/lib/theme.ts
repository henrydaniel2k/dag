import * as go from "gojs";

export interface GojsTheme {
  nodeFill: string;
  nodeStroke: string;
  nodeText: string;
  nodeTextMuted: string;
  metricText: string;
  alertText: string;
  highlightFill: string;
  highlightStroke: string;
  selectionStroke: string;
  linkStroke: string;
  hopStroke: string;
  metaFill: string;
  metaStroke: string;
  tooltipFill: string;
  tooltipStroke: string;
  tooltipText: string;
  iconFill: string;
  iconStroke: string;
  primary: string;
}

function getCSSColor(varName: string): string {
  const hsl = getComputedStyle(document.documentElement)
    .getPropertyValue(`--gojs-${varName}`)
    .trim();
  return hsl ? `hsl(${hsl})` : '#000000';
}

export function getGojsTheme(): GojsTheme {
  return {
    nodeFill: getCSSColor('node-fill'),
    nodeStroke: getCSSColor('node-stroke'),
    nodeText: getCSSColor('node-text'),
    nodeTextMuted: getCSSColor('node-text-muted'),
    metricText: getCSSColor('metric-text'),
    alertText: getCSSColor('alert-text'),
    highlightFill: getCSSColor('highlight-fill'),
    highlightStroke: getCSSColor('highlight-stroke'),
    selectionStroke: getCSSColor('selection-stroke'),
    linkStroke: getCSSColor('link-stroke'),
    hopStroke: getCSSColor('hop-stroke'),
    metaFill: getCSSColor('meta-fill'),
    metaStroke: getCSSColor('meta-stroke'),
    tooltipFill: getCSSColor('tooltip-fill'),
    tooltipStroke: getCSSColor('tooltip-stroke'),
    tooltipText: getCSSColor('tooltip-text'),
    iconFill: getCSSColor('icon-fill'),
    iconStroke: getCSSColor('icon-stroke'),
    primary: getCSSColor('primary'),
  };
}

export function applyTheme(diagram: go.Diagram | null) {
  if (!diagram) return;
  
  const theme = getGojsTheme();
  diagram.commit(d => {
    if (d.model.modelData) {
      d.model.set(d.model.modelData, 'theme', theme);
    } else {
      d.model.modelData = { theme };
    }
  }, 'update-theme');
  
  diagram.updateAllTargetBindings();
}
