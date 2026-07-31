// ---------------------------------------------------------------------------
// Shared palette for the injected UI
// ---------------------------------------------------------------------------
//
// Outside ui/ because stale.ts paints on-page markings in the same colours the
// switcher uses, and a shared module keeps the two from importing each other.

/** CloudCannon brand blue. Reserved for actions and the active locale. */
export const CC_BLUE = "#034ad8";
export const CC_BLUE_DARK = "#0239a8";
/** Faint blue wash for hover on blue-actioned controls. */
export const CC_BLUE_TINT = "rgba(3, 74, 216, 0.08)";

// Stale is neutral slate rather than a warning colour: out-of-date is a status,
// and the only action in that panel is the blue "Mark all as reviewed".
/** Panel border, FAB count badge, and the grey dashes of the on-page ring. */
export const STALE_ACCENT = "#334155";
export const STALE_TEXT = "#475569";
/** Neutral row hover inside the popover and stale panel. */
export const SLATE_HOVER = "#f1f5f9";
