# Theme Audit Report
## Executive Summary

**Status**: ❌ Theme system partially implemented  
**Critical Issues**: 44 hard-coded color literals in GoJS templates  
**Light Theme**: Exists but incomplete (missing graph/panel tokens)  
**Theme Toggle**: Not implemented for GoJS diagram

---

## Theme Coverage Matrix

| Area | Current Source | Token/Var | Proposed Token | File/Selector | Fix Needed? |
|------|---------------|-----------|----------------|---------------|-------------|
| **Page & Layout** |
| Page background | CSS var | `--background` | ✓ Same | body | ✅ OK |
| Panel backgrounds | CSS var | `--panel-bg` | ✓ Same | .panel classes | ⚠️ Incomplete light |
| Panel borders | CSS var | `--panel-border` | ✓ Same | .border | ⚠️ Incomplete light |
| **Text** |
| Primary text | CSS var | `--foreground` | ✓ Same | body | ✅ OK |
| Secondary text | CSS var | `--muted-foreground` | ✓ Same | .text-muted | ✅ OK |
| Headings | CSS var | `--foreground` | ✓ Same | h1-h6 | ✅ OK |
| **Interactive Elements** |
| Button default | CSS var | `--primary` | ✓ Same | button.tsx | ✅ OK |
| Button hover | CSS var | computed | ✓ Same | button.tsx | ✅ OK |
| Input borders | CSS var | `--input` | ✓ Same | input.tsx | ✅ OK |
| Focus rings | CSS var | `--ring` | ✓ Same | global | ✅ OK |
| **Status & Alerts** |
| Success | CSS var | `--success` | ✓ Same | alert.tsx | ✅ OK |
| Warning | CSS var | `--warning` | ✓ Same | alert.tsx | ✅ OK |
| Destructive | CSS var | `--destructive` | ✓ Same | alert.tsx | ✅ OK |
| **GoJS Graph - Nodes** |
| Node fill | **HEX LITERAL** | `#1e293b` | `--gojs-node-fill` | GraphCanvas.tsx:157 | ❌ CRITICAL |
| Node stroke | **HEX LITERAL** | `#475569` | `--gojs-node-stroke` | GraphCanvas.tsx:158 | ❌ CRITICAL |
| Node text | **HEX LITERAL** | `#e2e8f0` | `--gojs-node-text` | GraphCanvas.tsx:178 | ❌ CRITICAL |
| Node text secondary | **HEX LITERAL** | `#94a3b8` | `--gojs-node-text-muted` | GraphCanvas.tsx:187 | ❌ CRITICAL |
| Node metric text | **HEX LITERAL** | `#22d3ee` | `--gojs-metric-text` | GraphCanvas.tsx:196 | ❌ CRITICAL |
| Node highlighted fill | **HEX LITERAL** | `#3b82f6` | `--gojs-highlight-fill` | GraphCanvas.tsx:161 | ❌ CRITICAL |
| Node highlighted stroke | **HEX LITERAL** | `#60a5fa` | `--gojs-highlight-stroke` | GraphCanvas.tsx:165 | ❌ CRITICAL |
| **GoJS Graph - Links** |
| Link stroke | **HEX LITERAL** | `#64748b` | `--gojs-link-stroke` | GraphCanvas.tsx:218 | ❌ CRITICAL |
| Link highlighted | **HEX LITERAL** | `#3b82f6` | `--gojs-highlight-fill` | GraphCanvas.tsx:220 | ❌ CRITICAL |
| Hop link stroke | **HEX LITERAL** | `#22d3ee` | `--gojs-hop-stroke` | GraphCanvas.tsx:234 | ❌ CRITICAL |
| **GoJS Graph - Selection** |
| Selection stroke | **HEX LITERAL** | `#3b82f6` | `--gojs-selection-stroke` | GraphCanvas.tsx:208 | ❌ CRITICAL |
| **GoJS Graph - Meta Nodes** |
| Meta fill | **HEX LITERAL** | `#0f172a` | `--gojs-meta-fill` | GraphCanvas.tsx:271 | ❌ CRITICAL |
| Meta stroke | **HEX LITERAL** | `#6366f1` | `--gojs-meta-stroke` | GraphCanvas.tsx:272 | ❌ CRITICAL |
| Meta text | **HEX LITERAL** | `#e2e8f0` | `--gojs-node-text` | GraphCanvas.tsx:285 | ❌ CRITICAL |
| **GoJS Graph - Tooltips** |
| Tooltip fill | **HEX LITERAL** | `#1e293b` | `--gojs-tooltip-fill` | GraphCanvas.tsx:112 | ❌ CRITICAL |
| Tooltip stroke | **HEX LITERAL** | `#475569` | `--gojs-tooltip-stroke` | GraphCanvas.tsx:112 | ❌ CRITICAL |
| Tooltip text | **HEX LITERAL** | `#e2e8f0` | `--gojs-node-text` | GraphCanvas.tsx:245 | ❌ CRITICAL |
| Tooltip metric | **HEX LITERAL** | `#22d3ee` | `--gojs-metric-text` | GraphCanvas.tsx:122 | ❌ CRITICAL |
| Tooltip alert | **HEX LITERAL** | `#f87171` | `--gojs-alert-text` | GraphCanvas.tsx:133 | ❌ CRITICAL |
| **Navigation** |
| Nav active bg | CSS var | `--sidebar-accent` | ✓ Same | Navigation.tsx | ✅ OK |
| Nav hover bg | CSS var | computed | ✓ Same | Navigation.tsx | ✅ OK |
| **Shadows** |
| Panel shadow | inline | none | `--shadow-panel` | various | ⚠️ Add token |

---

## Anti-Patterns Found

### 1. **GoJS Hard-Coded Colors** (44 instances)
All GoJS templates use hex literals instead of binding to theme data:
```typescript
$(go.Shape, { fill: "#1e293b", stroke: "#475569" })  // ❌ BAD
```

Should be:
```typescript
$(go.Shape, 
  new go.Binding("fill", "theme", t => t.nodeFill).ofModel(),
  new go.Binding("stroke", "theme", t => t.nodeStroke).ofModel()
)  // ✅ GOOD
```

### 2. **No Theme Toggle for GoJS**
Theme switching in UI components but GoJS diagram never updates.

### 3. **Incomplete Light Theme**
Light theme in `index.css` missing:
- `--graph-bg`, `--graph-grid`
- `--node-default`, `--node-selected`, `--node-hover`
- `--link-default`, `--link-hop`
- `--panel-bg`, `--panel-border`

### 4. **No modelData.theme Pattern**
GoJS templates cannot react to theme changes without `.ofModel()` bindings.

---

## Findings Summary

| Category | Count | Status |
|----------|-------|--------|
| Hard-coded colors in GoJS | 44 | ❌ Critical |
| Missing light theme tokens | 8 | ⚠️ High |
| Theme toggle mechanism | 0 | ❌ Critical |
| CSS var usage in UI | ~90% | ✅ Good |

---

## Verification Gaps

1. **No theme toggle UI** - Users cannot switch themes
2. **No `applyTheme()` function** - No central theme update logic
3. **No `.ofModel()` bindings** - GoJS cannot react to theme changes
4. **No e2e theme tests** - No automated verification

---

## Next Steps

See `LIGHT_THEME_PROPOSAL.md` and `THEME_REFACTOR_PLAN.md` for implementation details.
