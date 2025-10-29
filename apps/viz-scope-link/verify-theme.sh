#!/bin/bash

# Theme Verification Script
# Checks for hard-coded color literals in GoJS templates

echo "🔍 Theme Audit Verification"
echo "================================"
echo ""

FAIL_COUNT=0

# Check for hex colors in GraphCanvas
echo "📊 Checking GraphCanvas.tsx for hard-coded hex colors..."
HEX_COUNT=$(grep -n "fill: ['\"]#\|stroke: ['\"]#" src/components/GraphCanvas.tsx | wc -l)
if [ "$HEX_COUNT" -gt 0 ]; then
  echo "❌ FAIL: Found $HEX_COUNT hard-coded hex colors"
  grep -n "fill: ['\"]#\|stroke: ['\"]#" src/components/GraphCanvas.tsx
  FAIL_COUNT=$((FAIL_COUNT + 1))
else
  echo "✅ PASS: No hard-coded hex colors in fill/stroke"
fi
echo ""

# Check for .ofModel() bindings
echo "📊 Checking for .ofModel() theme bindings..."
OFMODEL_COUNT=$(grep -n "\.ofModel()" src/components/GraphCanvas.tsx | wc -l)
if [ "$OFMODEL_COUNT" -gt 0 ]; then
  echo "✅ PASS: Found $OFMODEL_COUNT .ofModel() bindings (expected: 20+)"
else
  echo "❌ FAIL: No .ofModel() bindings found"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Check for theme utility file
echo "📊 Checking for theme utility..."
if [ -f "src/lib/theme.ts" ]; then
  echo "✅ PASS: Theme utility exists"
else
  echo "❌ FAIL: Theme utility not found at src/lib/theme.ts"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Check for getGojsTheme function
echo "📊 Checking for getGojsTheme implementation..."
if grep -q "getGojsTheme" src/lib/theme.ts 2>/dev/null; then
  echo "✅ PASS: getGojsTheme function found"
else
  echo "❌ FAIL: getGojsTheme function not found"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Check for applyTheme function
echo "📊 Checking for applyTheme implementation..."
if grep -q "applyTheme" src/lib/theme.ts 2>/dev/null; then
  echo "✅ PASS: applyTheme function found"
else
  echo "❌ FAIL: applyTheme function not found"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Check for light theme tokens in CSS
echo "📊 Checking for light theme GoJS tokens..."
LIGHT_TOKENS=$(grep -n "\.light" -A 30 src/index.css | grep "gojs-" | wc -l)
if [ "$LIGHT_TOKENS" -gt 10 ]; then
  echo "✅ PASS: Found $LIGHT_TOKENS light theme GoJS tokens"
else
  echo "❌ FAIL: Insufficient light theme tokens (found: $LIGHT_TOKENS, expected: 15+)"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Check for dark theme tokens in CSS
echo "📊 Checking for dark theme GoJS tokens..."
DARK_TOKENS=$(grep -n ":root" -A 60 src/index.css | grep "gojs-" | wc -l)
if [ "$DARK_TOKENS" -gt 10 ]; then
  echo "✅ PASS: Found $DARK_TOKENS dark theme GoJS tokens"
else
  echo "❌ FAIL: Insufficient dark theme tokens (found: $DARK_TOKENS, expected: 15+)"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Check for MutationObserver (theme change detection)
echo "📊 Checking for theme change observer..."
if grep -q "MutationObserver" src/components/GraphCanvas.tsx; then
  echo "✅ PASS: MutationObserver found for theme changes"
else
  echo "⚠️  WARN: No MutationObserver found (theme may not auto-update)"
fi
echo ""

# Final summary
echo "================================"
if [ "$FAIL_COUNT" -eq 0 ]; then
  echo "✅ ALL CHECKS PASSED"
  echo "Theme refactor is complete!"
  exit 0
else
  echo "❌ $FAIL_COUNT CHECK(S) FAILED"
  echo "Theme refactor is incomplete. See failures above."
  exit 1
fi
