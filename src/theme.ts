// ---------------------------------------------------------------------------
// Shared palette for the injected UI
// ---------------------------------------------------------------------------
//
// Lives outside ui/ because stale.ts (not a ui module) paints on-page markings
// with the same colours the switcher uses — a common module keeps the two from
// importing each other in a cycle.

/** CloudCannon brand blue. Reserved for actions and the active locale. */
export const CC_BLUE = "#034ad8";
export const CC_BLUE_DARK = "#0239a8";
/** Faint blue wash for hover on blue-actioned controls. */
export const CC_BLUE_TINT = "rgba(3, 74, 216, 0.08)";

// Stale indicators are deliberately neutral slate, not a warning colour: an
// out-of-date translation is a status, and the only *action* in that panel is
// the blue "Mark all as reviewed". Slate also stays legible over the arbitrary
// page colours a site's own design throws at it, which amber did not.
export const STALE_ACCENT = "#334155";
export const STALE_TEXT = "#475569";
/** On-page tint behind a stale element — light enough to read text over. */
export const STALE_TINT = "rgba(51, 65, 85, 0.06)";
/** Neutral row hover inside the popover and stale panel. */
export const SLATE_HOVER = "#f1f5f9";
