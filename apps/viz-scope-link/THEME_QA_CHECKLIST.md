# Theme Quality Assurance Checklist

## Automated Checks

Run verification script:
```bash
chmod +x verify-theme.sh
./verify-theme.sh
```

---

## Manual Testing Checklist

### Theme Toggle Functionality
- [ ] Theme toggle button is visible in header
- [ ] Clicking toggle switches between light/dark
- [ ] Theme persists across page navigation
- [ ] Theme icon updates (Sun/Moon)
- [ ] No console errors during toggle
- [ ] Graph updates within 100ms of toggle

### Visual Elements - Dark Theme

**Nodes:**
- [ ] Node background is dark slate (#1e293b)
- [ ] Node border is gray (#475569)
- [ ] Node name text is light (#e2e8f0)
- [ ] Node type text is muted gray (#94a3b8)
- [ ] Metric text is cyan (#22d3ee)

**Links:**
- [ ] Normal links are gray (#64748b)
- [ ] Hop links are dashed cyan (#22d3ee)
- [ ] Link arrows match link color
- [ ] Highlighted links are blue (#3b82f6)

**Selection & Highlighting:**
- [ ] Selected node has blue border (#3b82f6)
- [ ] Branch highlighted nodes are blue fill (#3b82f6)
- [ ] Branch highlighted links are blue (#3b82f6)
- [ ] Selection border is 3px wide

**Meta-Nodes:**
- [ ] Meta-node background is very dark (#0f172a)
- [ ] Meta-node border is purple dashed (#6366f1)
- [ ] Meta-node text is light (#e2e8f0)

**Tooltips:**
- [ ] Tooltip background is dark (#1e293b)
- [ ] Tooltip border is gray (#475569)
- [ ] Tooltip text is light (#e2e8f0)
- [ ] Metric text in tooltip is cyan (#22d3ee)
- [ ] Alert text in tooltip is red (#f87171)

**UI Elements:**
- [ ] Panels have dark background
- [ ] Panel borders are visible but subtle
- [ ] Navigation active item is highlighted
- [ ] Buttons have proper hover states
- [ ] Input focus rings are visible

### Visual Elements - Light Theme

**Nodes:**
- [ ] Node background is soft sage (#e8f0e8)
- [ ] Node border is medium green (#6fa88a)
- [ ] Node name text is dark forest (#1f3d2b)
- [ ] Node type text is muted green (#577965)
- [ ] Metric text is teal (#238a8e)
- [ ] **Contrast check:** All text readable without strain

**Links:**
- [ ] Normal links are gray-green (#748c7f)
- [ ] Hop links are dashed teal (#36a6ab)
- [ ] Link arrows match link color
- [ ] Highlighted links are vibrant green (#2aa572)

**Selection & Highlighting:**
- [ ] Selected node has bold green border (#259662)
- [ ] Branch highlighted nodes are mint fill (#d4f0e4)
- [ ] Branch highlighted links are green (#2aa572)
- [ ] Selection border is 3px wide

**Meta-Nodes:**
- [ ] Meta-node background is very light mint (#ecf7f1)
- [ ] Meta-node border is soft purple dashed (#7c72d4)
- [ ] Meta-node text is dark green (#1f3d2b)

**Tooltips:**
- [ ] Tooltip background is near-white sage (#f9fbfa)
- [ ] Tooltip border is light green (#b8cbbf)
- [ ] Tooltip text is dark (#1f3d2b)
- [ ] Metric text in tooltip is teal (#238a8e)
- [ ] Alert text in tooltip is warm red (#d94826)

**UI Elements:**
- [ ] Panels have light background (#f4f7f4)
- [ ] Panel borders are subtle (#c4d2c9)
- [ ] Page background is soft paper white (#f7faf7)
- [ ] Navigation active item is highlighted (green)
- [ ] Buttons have proper hover states (darker green)
- [ ] Input focus rings are visible (green)
- [ ] No harsh white/black - everything has slight tint

### Accessibility Checks

**Contrast (WCAG AA):**
- [ ] Run axe DevTools on light theme
- [ ] Run axe DevTools on dark theme
- [ ] Check node text contrast (should be 4.5:1+)
- [ ] Check metric text contrast (should be 4.5:1+)
- [ ] Check alert text contrast (should be 4.5:1+)
- [ ] Check button text contrast
- [ ] Check disabled state contrast (3:1+)

**Focus Indicators:**
- [ ] All interactive elements have visible focus
- [ ] Focus ring is 2px minimum
- [ ] Focus ring has sufficient contrast
- [ ] Tab order is logical

**Color Blindness:**
- [ ] Use Chrome DevTools color vision simulation
- [ ] Test Protanopia (red-blind)
- [ ] Test Deuteranopia (green-blind)
- [ ] Test Tritanopia (blue-blind)
- [ ] Verify status is not conveyed by color alone

### Interaction Testing

**Toggle 10× Rapid:**
- [ ] Click theme toggle 10 times rapidly
- [ ] Graph updates every time
- [ ] No stale colors remain
- [ ] No console errors
- [ ] No visual flicker
- [ ] No memory leaks (check DevTools)

**Graph Interactions:**
- [ ] Click node - selection works in both themes
- [ ] Hover node - tooltip appears in theme color
- [ ] Right-click node - context menu appears
- [ ] Open Branch Data Panel - highlights correct nodes
- [ ] Open Node Data Panel - highlights correct node
- [ ] Set as MSN - updates correctly
- [ ] Fold node type - works in both themes

**Panel Operations:**
- [ ] Open/close right panels in both themes
- [ ] Expand/collapse navigation tree
- [ ] Change metric overlay
- [ ] Change time window
- [ ] Toggle node type filters
- [ ] All panels respect theme colors

### Performance

- [ ] Theme toggle completes in <100ms
- [ ] No diagram rebuild on theme change
- [ ] No layout recalculation
- [ ] No visible delay in color updates
- [ ] Smooth animations maintained

### Browser Compatibility

**Chrome/Edge:**
- [ ] Theme toggle works
- [ ] Colors render correctly
- [ ] No console errors

**Firefox:**
- [ ] Theme toggle works
- [ ] Colors render correctly
- [ ] No console errors

**Safari:**
- [ ] Theme toggle works
- [ ] Colors render correctly
- [ ] No console errors

### Edge Cases

- [ ] Theme persists after page reload
- [ ] Theme works with empty graph
- [ ] Theme works with 100+ nodes
- [ ] Theme works with meta-nodes present
- [ ] Theme works with filtered view
- [ ] Theme works with folded nodes
- [ ] Theme works in immersive mode
- [ ] Theme works with overlay metrics
- [ ] Theme works with branch highlighting

---

## Acceptance Criteria

✅ **PASS** if:
- All automated checks pass
- All manual checklist items pass
- Zero hard-coded color literals in GoJS templates
- Theme toggle is instant (<100ms)
- Both themes meet WCAG AA contrast standards
- No console errors in any browser
- Light theme is noticeably low-glare
- Dark theme unchanged from original

❌ **FAIL** if:
- Any hard-coded colors remain in GoJS
- Theme toggle doesn't update graph
- Any contrast ratio below 4.5:1 (normal text)
- Console errors present
- Stale colors after toggle
- Visual flicker during toggle
- Light theme is harsh/high-contrast

---

## Sign-Off

**Tested by:** _______________  
**Date:** _______________  
**Theme toggle working:** [ ] Yes [ ] No  
**All colors dynamic:** [ ] Yes [ ] No  
**Accessibility passed:** [ ] Yes [ ] No  
**Ready for production:** [ ] Yes [ ] No  

**Notes:**
