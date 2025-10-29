# Theme Refactor Implementation Plan

## Overview
Replace all hard-coded GoJS colors with dynamic theme bindings using `.ofModel()` pattern.

---

## Phase 1: Add Theme Tokens to CSS

**File**: `src/index.css`

### Add to `:root` (Dark Theme)
```css
/* GoJS-specific tokens (dark) */
--gojs-node-fill: 217 33% 15%;
--gojs-node-stroke: 215 16% 47%;
--gojs-node-text: 213 27% 95%;
--gojs-node-text-muted: 215 20% 65%;
--gojs-metric-text: 187 85% 43%;
--gojs-alert-text: 0 91% 71%;
--gojs-highlight-fill: 221 83% 53%;
--gojs-highlight-stroke: 217 91% 60%;
--gojs-selection-stroke: 221 83% 53%;
--gojs-link-stroke: 215 16% 47%;
--gojs-hop-stroke: 187 85% 43%;
--gojs-meta-fill: 217 91% 10%;
--gojs-meta-stroke: 243 75% 59%;
--gojs-tooltip-fill: 217 33% 15%;
--gojs-tooltip-stroke: 215 16% 47%;
```

### Add to `.light` Theme
```css
/* GoJS-specific tokens (light) */
--gojs-node-fill: 120 25% 92%;
--gojs-node-stroke: 150 30% 60%;
--gojs-node-text: 150 40% 20%;
--gojs-node-text-muted: 150 20% 45%;
--gojs-metric-text: 180 60% 35%;
--gojs-alert-text: 10 85% 45%;
--gojs-highlight-fill: 160 60% 90%;
--gojs-highlight-stroke: 160 65% 45%;
--gojs-selection-stroke: 160 70% 40%;
--gojs-link-stroke: 150 15% 55%;
--gojs-hop-stroke: 180 55% 45%;
--gojs-meta-fill: 160 40% 95%;
--gojs-meta-stroke: 250 50% 55%;
--gojs-tooltip-fill: 150 30% 98%;
--gojs-tooltip-stroke: 150 25% 75%;

/* Complete light theme */
--graph-bg: 120 18% 98%;
--graph-grid: 120 10% 90%;
--panel-bg: 120 20% 96%;
--panel-border: 150 15% 80%;
```

---

## Phase 2: Create Theme Utility

**File**: `src/lib/theme.ts` (NEW)

```typescript
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
}

function getCSSColor(varName: string): string {
  const hsl = getComputedStyle(document.documentElement)
    .getPropertyValue(`--gojs-${varName}`)
    .trim();
  return hsl ? `hsl(${hsl})` : '#000';
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
  };
}

export function applyTheme(diagram: go.Diagram | null) {
  if (!diagram) return;
  
  const theme = getGojsTheme();
  diagram.commit(d => {
    d.model.set(d.model.modelData, 'theme', theme);
  }, 'update-theme');
  
  diagram.updateAllTargetBindings();
}
```

---

## Phase 3: Refactor GraphCanvas.tsx

**File**: `src/components/GraphCanvas.tsx`

### Changes Required:

1. **Import theme utilities** (top of file):
```typescript
import { getGojsTheme, applyTheme } from "@/lib/theme";
```

2. **Initialize theme in model** (line ~326):
```typescript
const model = new go.GraphLinksModel([], []);
model.linkKeyProperty = "key";
model.modelData = { theme: getGojsTheme() };
d.model = model;
```

3. **Replace all node template colors** (lines 152-202):
```typescript
// BEFORE:
$(go.Shape, "RoundedRectangle", {
  strokeWidth: 2,
  fill: "#1e293b",
  stroke: "#475569",
})

// AFTER:
$(go.Shape, "RoundedRectangle", {
  strokeWidth: 2,
},
  new go.Binding("fill", "theme", t => t.nodeFill).ofModel(),
  new go.Binding("stroke", "theme", t => t.nodeStroke).ofModel()
)
```

4. **Replace all text strokes** (lines 174-201):
```typescript
// Node name text
$(go.TextBlock, {
  margin: 5,
  font: "bold 14px sans-serif",
},
  new go.Binding("text", "name"),
  new go.Binding("stroke", "theme", t => t.nodeText).ofModel()
)

// Node type text  
$(go.TextBlock, {
  margin: 2,
  font: "11px sans-serif",
},
  new go.Binding("text", "type"),
  new go.Binding("stroke", "theme", t => t.nodeTextMuted).ofModel()
)

// Metric text
$(go.TextBlock, {
  margin: 2,
  font: "12px sans-serif",
  visible: false,
},
  new go.Binding("text", "metric"),
  new go.Binding("visible", "metric", m => !!m),
  new go.Binding("stroke", "theme", t => t.metricText).ofModel()
)
```

5. **Update highlight bindings** (lines 160-167):
```typescript
new go.Binding("fill", "", function(data, obj) {
  const theme = (obj.diagram?.model as any)?.modelData?.theme;
  if (data.isHighlighted) return theme?.highlightFill || "#3b82f6";
  return theme?.nodeFill || "#1e293b";
}),
new go.Binding("stroke", "", function(data, obj) {
  const theme = (obj.diagram?.model as any)?.modelData?.theme;
  if (data.isHighlighted) return theme?.highlightStroke || "#60a5fa";
  return theme?.nodeStroke || "#475569";
})
```

6. **Update selection adornment** (line 208):
```typescript
$(go.Shape, "RoundedRectangle", { 
  fill: null, 
  strokeWidth: 3 
},
  new go.Binding("stroke", "theme", t => t.selectionStroke).ofModel()
)
```

7. **Update link templates** (lines 218-225):
```typescript
$(go.Shape, { strokeWidth: 2 },
  new go.Binding("strokeWidth", "isHighlighted", h => h ? 3 : 2),
  new go.Binding("stroke", "", function(data, obj) {
    const theme = (obj.diagram?.model as any)?.modelData?.theme;
    if (data.isHighlighted) return theme?.highlightStroke || "#3b82f6";
    return theme?.linkStroke || "#64748b";
  })
)
```

8. **Update hop links** (lines 232-237):
```typescript
$(go.Shape, {
  strokeWidth: 2,
  strokeDashArray: [4, 4],
},
  new go.Binding("stroke", "theme", t => t.hopStroke).ofModel()
),
$(go.Shape, { toArrow: "Standard" },
  new go.Binding("stroke", "theme", t => t.hopStroke).ofModel(),
  new go.Binding("fill", "theme", t => t.hopStroke).ofModel()
)
```

9. **Update tooltips** (lines 109-149, 239-248):
```typescript
toolTip: $(
  go.Adornment,
  "Auto",
  $(go.Shape, 
    new go.Binding("fill", "theme", t => t.tooltipFill).ofModel(),
    new go.Binding("stroke", "theme", t => t.tooltipStroke).ofModel()
  ),
  $(go.Panel, "Vertical", { margin: 8 },
    $(go.TextBlock, {
      margin: 2,
      font: "12px sans-serif",
      visible: false,
    },
      new go.Binding("text", "tooltipMetric"),
      new go.Binding("visible", "tooltipMetric", m => !!m),
      new go.Binding("stroke", "theme", t => t.metricText).ofModel()
    ),
    // ... similar for other tooltip texts
  )
)
```

10. **Update meta-node template** (lines 266-318):
```typescript
$(go.Shape, "RoundedRectangle", {
  strokeWidth: 3,
  strokeDashArray: [5, 3],
},
  new go.Binding("fill", "theme", t => t.metaFill).ofModel(),
  new go.Binding("stroke", "theme", t => t.metaStroke).ofModel()
)
```

11. **Add theme effect hook** (after line 519, before return):
```typescript
// Apply theme when component mounts or theme changes
useEffect(() => {
  const observer = new MutationObserver(() => {
    applyTheme(diagram.current);
  });
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'class']
  });
  
  // Initial theme application
  applyTheme(diagram.current);
  
  return () => observer.disconnect();
}, []);
```

---

## Phase 4: Add Theme Toggle UI

**File**: `src/pages/RuntimePage.tsx`

Add theme toggle button near immersive toggle:

```typescript
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

// In component:
const [theme, setTheme] = useState<'light' | 'dark'>(
  () => document.documentElement.classList.contains('light') ? 'light' : 'dark'
);

const toggleTheme = () => {
  const next = theme === 'dark' ? 'light' : 'dark';
  document.documentElement.classList.toggle('light', next === 'light');
  setTheme(next);
};

// In JSX (near ImmersiveToggle):
<Button
  variant="outline"
  size="icon"
  onClick={toggleTheme}
  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
>
  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
</Button>
```

---

## Phase 5: Verification

### Grep Script
```bash
#!/bin/bash
# check-colors.sh
echo "Checking for remaining hard-coded colors in GoJS..."
grep -rn "fill: ['\"]#" src/components/GraphCanvas.tsx && echo "❌ FAIL: Hard-coded fills found" || echo "✅ PASS: No hard-coded fills"
grep -rn "stroke: ['\"]#" src/components/GraphCanvas.tsx && echo "❌ FAIL: Hard-coded strokes found" || echo "✅ PASS: No hard-coded strokes"
```

### Manual QA Checklist
- [ ] Toggle theme 10× - verify graph updates instantly
- [ ] Check node fills, strokes, text colors in both themes
- [ ] Check link colors (normal & highlighted)
- [ ] Check hop links (dashed cyan/teal)
- [ ] Check selection adornment (blue/green border)
- [ ] Check meta-node colors (purple border)
- [ ] Check tooltips background & text
- [ ] Check context menu (should use CSS vars already)
- [ ] Check panels, navigation, buttons
- [ ] Check focus rings on inputs
- [ ] Check disabled states
- [ ] Check alert badges (red/amber text)
- [ ] Check branch highlighting
- [ ] Verify no console errors
- [ ] Test in Chrome, Firefox, Safari
- [ ] Test light theme contrast with accessibility tools

---

## Rollout Strategy

1. ✅ Create theme tokens in CSS
2. ✅ Build theme utility functions
3. ✅ Refactor GraphCanvas.tsx (largest file, most changes)
4. ✅ Add theme toggle UI
5. ✅ Test thoroughly
6. ✅ Document for users
7. 🔄 Monitor for edge cases

---

## Risk Mitigation

- **Fallback values** in theme getter functions prevent crashes
- **Model data check** before accessing theme prevents null errors  
- **MutationObserver** ensures theme updates propagate
- **No template rebuild** - only binding updates (fast, no flicker)
- **Dark theme unchanged** - existing users see no difference unless toggling
