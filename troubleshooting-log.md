# Troubleshooting Log - Terminal Display Issue

## Problem Description

When creating a new terminal in Agenteck, the terminal fails to display properly. The xterm.js terminal instance is created, but it cannot render because the container has insufficient dimensions.

### Symptoms

1. **Console Output**: The terminal container reports dimensions like `679x8` (width is fine, height is only 8px)
2. **Retry Loop**: The initialization code retries 20 times waiting for proper dimensions, then gives up:
   ```
   Terminal container dimensions (delayed): 679x8
   Container dimensions too small, retrying (1/20)...
   ...
   Terminal [id] failed to get proper dimensions after 20 retries
   ```
3. **Visual Result**: The terminal panel appears but shows no terminal content - just an empty area
4. **The 8px height**: This is exactly `2 * var(--spacing-xs)` = `2 * 4px` = 8px, which is just the padding of `.terminal-view`, indicating the parent has 0 height

### Secondary Issue (Resolved)

There was also a `node-pty` ConPTY crash on Windows:
```
Error: AttachConsole failed
    at Object.<anonymous> (node_modules\node-pty\lib\conpty_console_list_agent.js:13:26)
```

**Solution**: Changed `useConpty: false` in `TerminalProcess.ts` to use WinPTY backend instead.

---

## CSS Layout Chain Analysis

The height must propagate through this chain:

```
.tile-container (flex: 1, min-height: 0, position: relative)
  └── .mosaic (height: 100%, width: 100%)
        └── .mosaic-root (position: absolute, inset: 3px)
              └── .mosaic-tile (position: absolute, inline styles for dimensions)
                    └── .mosaic-window (position: relative, display: flex, flex-direction: column)
                          └── .mosaic-window-toolbar (display: none - we hide it)
                          └── .mosaic-window-body (position: relative, flex: 1, height: 0)
                                └── .terminal-panel (???)
                                      └── .terminal-header (height: 32px)
                                      └── .terminal-panel-content (???)
                                            └── .terminal-view (position: absolute, inset: 0)
```

### Key Insight from react-mosaic-component CSS

The library uses a **flexbox trick** for `.mosaic-window-body`:
```css
.mosaic-window-body {
  position: relative;
  flex: 1;
  height: 0;  /* This is intentional - flex: 1 makes it grow */
  overflow: hidden;
}
```

This means:
- The element has `height: 0` but `flex: 1` causes it to fill available space
- Children using `height: 100%` would get `0` (100% of 0 = 0)
- Children must use **absolute positioning** or **flex** to fill this container

---

## Attempted Fixes

### Attempt 1: Fix Variable Reference Order in TerminalView.tsx

**What**: Moved `lastWrittenIndexRef` definition to the top of the component with other refs.

**Why**: The ref was being used inside `fitAndWrite` function before its definition, which was confusing and potentially problematic.

**Result**: Code is cleaner, but did not fix the height issue.

### Attempt 2: Add StrictMode Guard

**What**: Added `isInitializedRef` to prevent double initialization:
```tsx
if (isInitializedRef.current) return;
isInitializedRef.current = true;
```

**Why**: React StrictMode runs effects twice in development, which could cause xterm initialization issues.

**Result**: Prevents double initialization, but did not fix the height issue.

### Attempt 3: Improve Dimension Detection and Retry Logic

**What**:
- Check both width AND height (was only checking height)
- Add max retry limit (20 retries) to prevent infinite loops
- Use `requestAnimationFrame` before setTimeout for better render timing

**Result**: Better diagnostics, but the height remains 8px after all retries.

### Attempt 4: Add Position Relative to Tile Container

**What**: Added `position: relative` to `.tile-container`:
```css
.tile-container {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background-color: var(--color-background);
  position: relative;  /* Added */
}
```

**Why**: To provide positioning context for absolutely positioned children.

**Result**: Did not fix the issue.

### Attempt 5: Override Mosaic CSS with Absolute Positioning

**What**: Added aggressive absolute positioning overrides:
```css
.mosaic {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
}

.mosaic-window {
  position: absolute !important;
  /* ... inset: 0 */
}

.mosaic-window-body {
  position: absolute !important;
  /* ... inset: 0 */
}
```

**Why**: Thought absolute positioning would force proper dimensions.

**Result**: **BROKE THE LAYOUT COMPLETELY**. The library uses flexbox for `.mosaic-window` and `.mosaic-window-body`. Overriding with absolute positioning destroyed the flex layout.

### Attempt 6: Revert Mosaic Overrides, Keep Library's Flexbox

**What**: Removed the absolute positioning overrides from `.mosaic-window` and `.mosaic-window-body`, keeping the library's native flexbox layout.

```css
.mosaic-window {
  border-radius: var(--radius-md) !important;
  overflow: hidden !important;
  /* Removed absolute positioning - keep library's flex layout */
}

.mosaic-window-body {
  background: var(--color-surface) !important;
  /* Removed absolute positioning - keep library's flex: 1, height: 0 */
}
```

**Result**: Library layout restored, but `.terminal-panel` still getting 0 height.

### Attempt 7: Change TerminalPanel from Flexbox to Absolute Positioning

**What**: Changed `.terminal-panel` from:
```css
.terminal-panel {
  display: flex;
  flex-direction: column;
  height: 100%;  /* 100% of 0 = 0! */
  width: 100%;
}
```

To:
```css
.terminal-panel {
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
```

**Why**: Since `.mosaic-window-body` has `height: 0` with `flex: 1`, using `height: 100%` gives 0. Absolute positioning with `inset: 0` should fill the parent (which has `position: relative`).

**Result**: **CURRENT STATE** - Not yet confirmed if this fixes the issue. Theoretically should work.

---

## Current Theory

The root cause is a **CSS height inheritance failure** in the layout chain:

1. **react-mosaic-component** uses a flexbox trick where `.mosaic-window-body` has `height: 0` but `flex: 1` to expand
2. Our `.terminal-panel` was using `height: 100%`, which computed to `100% of 0 = 0`
3. This cascaded down: `.terminal-panel-content` got 0 height, `.terminal-view` got 0 height (but kept its 8px padding)

**The fix** should be to use absolute positioning for `.terminal-panel` since its parent `.mosaic-window-body` has `position: relative`.

---

## Files Modified

| File | Change |
|------|--------|
| `src/renderer/components/terminal/TerminalView.tsx` | Moved refs to top, added StrictMode guard, improved retry logic |
| `src/renderer/components/terminal/TerminalPanel.css` | Changed from `height: 100%` to absolute positioning |
| `src/renderer/styles/app.css` | Removed incorrect absolute positioning overrides on mosaic classes |
| `src/main/terminal/TerminalProcess.ts` | Changed `useConpty: false` to fix Windows PTY crash |

---

## Verification Steps

To verify if the fix works:

1. Run `npm run build && npm start`
2. Click "New Terminal" in the toolbar
3. Open DevTools (F12) and check Console for:
   - `Terminal container dimensions (delayed): XXXxYYY` - Y should be > 50
   - `Terminal [id] resized to COLSxROWS` - should show reasonable values like 80x24
4. The terminal should display a PowerShell prompt and accept input

---

## Open Questions

1. Is the `.mosaic-window-body` actually getting proper height from the flex layout?
2. Does the library's `height: 0` trick work correctly with our hidden toolbar?
3. Are there any timing issues with when React renders vs when mosaic calculates tile dimensions?
4. Would using a `ResizeObserver` on a parent element help detect when dimensions are ready?

---

## Alternative Approaches to Consider

1. **Debug with explicit heights**: Temporarily set fixed pixel heights to isolate which layer is failing
2. **Use CSS Grid**: Consider replacing flexbox with CSS Grid for the terminal panel layout
3. **Wait for mosaic layout event**: The library might emit events when layout is complete
4. **Use ref callback**: Instead of `useEffect`, use a ref callback to detect when container is mounted with dimensions
5. **Check if toolbar hiding affects layout**: The hidden `.mosaic-window-toolbar` might affect the flex calculation

---

## Attempt 8: ResizeObserver-Based Initialization (2026-01-16)

### Root Cause Analysis

The previous attempts focused on CSS fixes, but the actual issue was identified as a **timing/race condition** between:
1. React rendering the component
2. Mosaic calculating tile dimensions
3. Browser computing flexbox layout
4. xterm.js trying to fit to container dimensions

The retry loop with `requestAnimationFrame` + `setTimeout` was unreliable because:
- `requestAnimationFrame` fires before paint, but layout may not be complete
- `setTimeout` with arbitrary delays is fragile
- Polling for dimensions doesn't guarantee the browser has finished layout

### The Fix

**Changed approach**: Instead of polling with timeouts, use `ResizeObserver` to wait for the container to have proper dimensions before calling `fitAddon.fit()`.

**Why ResizeObserver works better**:
- The `ResizeObserver` callback fires **after** the browser has completed layout calculations
- The `contentRect` provides the actual computed dimensions
- No arbitrary delays or retry counts needed

### Code Changes in `TerminalView.tsx`

1. Added `hasInitialFitRef` to track if the first fit has been performed
2. Removed the `fitAndWrite` function with retry loop
3. Removed `requestAnimationFrame` + `setTimeout` initialization
4. Moved all initialization logic into the `ResizeObserver` callback:
   - Check if `width > 50 && height > 50` before fitting
   - On first fit (`hasInitialFitRef.current === false`), call `handleResize()` and write buffered output
   - On subsequent observations, just call `handleResize()` for resizing

### Key Insight

The CSS chain was actually correct all along. The issue was purely timing - xterm.js was trying to initialize before the browser had computed the final dimensions from the flexbox layout. By gating initialization on `ResizeObserver` detecting proper dimensions, we ensure xterm.js only initializes after layout is complete.

### Result

**PARTIALLY SUCCESSFUL** - ResizeObserver-based initialization is correct for timing, but the underlying CSS issue remained. The terminal was still not visible because `.mosaic-window-body` wasn't getting proper height from the flex layout.

---

## Attempt 9: Absolute Positioning for mosaic-window-body (2026-01-16)

### Discovery

After adding `min-height: 200px` to `.mosaic-window-body` for debugging, the terminal became visible but only filled about 1/5 of the available space. This confirmed:
1. The flex layout (`flex: 1; height: 0`) wasn't computing correctly
2. The CSS chain from `.terminal-panel` down was correct
3. The issue was specifically in `.mosaic-window-body` not expanding

### Root Cause

The react-mosaic-component library uses a flexbox trick where `.mosaic-window-body` has `flex: 1` and `height: 0`. This is supposed to make the body expand to fill available space in the flex column. However, when the toolbar is hidden with `display: none`, the flex calculation doesn't work correctly - the body doesn't expand.

### The Fix

Override the library's flex layout with absolute positioning:

```css
.mosaic-window {
  position: relative !important;  /* Positioning context for child */
}

.mosaic-window-body {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  height: auto !important;
}
```

This bypasses the flex layout entirely and makes `.mosaic-window-body` fill its parent using absolute positioning.

### Files Modified

| File | Change |
|------|--------|
| `src/renderer/styles/app.css` | Added absolute positioning to `.mosaic-window-body` and `position: relative` to `.mosaic-window` |
| `src/renderer/components/terminal/TerminalView.tsx` | Kept ResizeObserver-based initialization (correct for timing) |

### Result

**SUCCESS** - Terminal now displays correctly, filling the entire panel. The combination of:
1. Absolute positioning for `.mosaic-window-body` (CSS fix)
2. ResizeObserver-based initialization (timing fix)

...ensures the terminal renders reliably.
