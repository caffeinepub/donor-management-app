# Specification

## Summary
**Goal:** Reformat specific navigation and hero content areas in the TrustTrack frontend to use bullet point lists.

**Planned changes:**
- In `Header.tsx`, wrap the navigation items inside the header's inner div in a `<ul>` with `<li>` elements, styled to remain horizontal and consistent with the existing warm theme.
- In `WelcomeBanner.tsx`, convert the content inside the 4th child div of the hero section into an unordered bullet list, styled with the existing yellow/white warm theme.

**User-visible outcome:** The header navigation items and the hero section's 4th div content are displayed as bullet point lists, while preserving all existing functionality, routing, and visual styling.
