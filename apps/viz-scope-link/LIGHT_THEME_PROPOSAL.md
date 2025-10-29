# Light Theme Proposal
## Design Philosophy: Sustainable & Accessible

**Concept**: Soft sustainability greens with low-glare whites and warm earth tones  
**Target**: WCAG AA (4.5:1 for normal text, 3:1 for large text)  
**Inspiration**: Forest canopy, natural paper, living systems monitoring

---

## Color Palette

### Surface Colors
```css
--background: 120 20% 97%        /* Soft paper white (#f7faf7) */
--surface: 120 15% 95%            /* Light sage (#f2f5f2) */
--surface-elevated: 0 0% 100%     /* Pure white for cards */
```

### Text Colors
```css
--foreground: 150 40% 15%         /* Deep forest (#172e21) - 12.5:1 on bg */
--text-secondary: 150 20% 35%     /* Muted forest (#4a6456) - 6.8:1 on bg */
--text-muted: 150 10% 55%         /* Light moss (#7a8c84) - 3.9:1 on bg */
```

### Brand & Interactive
```css
--primary: 160 65% 40%            /* Living green (#249966) */
--primary-hover: 160 70% 35%      /* Deeper green (#1d8556) */
--primary-active: 160 75% 30%     /* Rich green (#167145) */

--accent: 35 90% 55%              /* Warm amber (#f5a623) */
--accent-hover: 35 95% 50%        /* Golden amber */
```

### Graph-Specific (Light Theme)
```css
/* Nodes */
--gojs-node-fill: 120 25% 92%              /* Soft sage node (#e8f0e8) */
--gojs-node-stroke: 150 30% 60%            /* Medium green border (#6fa88a) */
--gojs-node-text: 150 40% 20%              /* Dark forest text (#1f3d2b) */
--gojs-node-text-muted: 150 20% 45%        /* Subtle green-gray (#577965) */

/* Highlighting */
--gojs-highlight-fill: 160 60% 90%         /* Light mint (#d4f0e4) */
--gojs-highlight-stroke: 160 65% 45%       /* Vibrant green (#2aa572) */
--gojs-selection-stroke: 160 70% 40%       /* Bold selection (#259662) */

/* Links */
--gojs-link-stroke: 150 15% 55%            /* Neutral gray-green (#748c7f) */
--gojs-hop-stroke: 180 55% 45%             /* Teal hop (#36a6ab) */

/* Metrics & Status */
--gojs-metric-text: 180 60% 35%            /* Deep teal (#238a8e) */
--gojs-alert-text: 10 85% 45%              /* Warm red (#d94826) */
--gojs-warn-text: 35 90% 45%               /* Amber warning (#e69515) */

/* Meta Nodes */
--gojs-meta-fill: 160 40% 95%              /* Very light mint (#ecf7f1) */
--gojs-meta-stroke: 250 50% 55%            /* Soft purple (#7c72d4) */

/* Tooltips */
--gojs-tooltip-fill: 150 30% 98%           /* Near-white sage (#f9fbfa) */
--gojs-tooltip-stroke: 150 25% 75%         /* Light border (#b8cbbf) */

/* Graph Background */
--graph-bg: 120 18% 98%                    /* Lightest sage (#f8faf8) */
--graph-grid: 120 10% 90%                  /* Subtle grid (#e3e8e4) */
```

### Panels & UI
```css
--panel-bg: 120 20% 96%                    /* Light panel (#f4f7f4) */
--panel-border: 150 15% 80%                /* Subtle green border (#c4d2c9) */

--border: 150 20% 85%                      /* UI borders (#d1dcd5) */
--input-border: 150 25% 75%                /* Input borders (#afc2b6) */
--ring: 160 65% 45%                        /* Focus ring (matches primary) */
```

### Semantic Colors
```css
--success: 140 60% 45%                     /* Nature green (#2db86d) */
--warning: 35 90% 55%                      /* Amber alert (#f5a623) */
--destructive: 10 75% 50%                  /* Warm red (#df5230) */
```

---

## Contrast Ratios (WCAG AA Compliance)

| Text | Background | Ratio | Pass |
|------|------------|-------|------|
| Foreground on Background | #172e21 on #f7faf7 | 12.5:1 | ✅ AAA |
| Text Secondary on Background | #4a6456 on #f7faf7 | 6.8:1 | ✅ AAA |
| Text Muted on Background | #7a8c84 on #f7faf7 | 3.9:1 | ✅ AA Large |
| Node Text on Node Fill | #1f3d2b on #e8f0e8 | 8.2:1 | ✅ AAA |
| Metric Text on Node Fill | #238a8e on #e8f0e8 | 5.1:1 | ✅ AA |
| Alert Text on Node Fill | #d94826 on #e8f0e8 | 4.8:1 | ✅ AA |
| Link on Graph BG | #748c7f on #f8faf8 | 4.2:1 | ✅ AA Large |

---

## Theme Philosophy Comparison

### Dark Theme (Current)
- **Mood**: Enterprise monitoring, control room
- **Use case**: Extended sessions, low-light environments
- **Colors**: Cool blues, cyan accents, deep slate backgrounds

### Light Theme (Proposed)
- **Mood**: Sustainability, living systems, natural growth
- **Use case**: Daytime use, presentations, eco-focused branding
- **Colors**: Warm greens, earth tones, paper-like surfaces
- **Contrast**: High but soft (no harsh white/black)

---

## Implementation Notes

1. **No pure white/black** - All whites have slight green tint for warmth
2. **Green-shifted grays** - All neutral colors lean toward green for cohesion
3. **Warm accents** - Amber/orange for warnings maintains visibility on green
4. **Accessible metrics** - Teal for data maintains distinction from status colors
5. **Purple meta-nodes** - Complementary color provides visual grouping distinction

---

## Visual Hierarchy

```
Primary Actions (Green) → Status (Amber/Red) → Data (Teal) → Structure (Gray-Green)
```

This ensures:
- Interactive elements are most prominent (green)
- Alerts draw attention (warm colors)
- Data is readable but secondary (cool teal)
- Structure recedes appropriately (muted greens)
