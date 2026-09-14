/**
 * The seven system item-type colors from project-overview.md, reused for the
 * homepage's Features grid accents and dashboard-preview mock instead of
 * introducing a second placeholder palette. Applied via inline `style`,
 * mirroring ItemTypeIcon/ItemCard/CollectionCard's data-driven-hex pattern.
 */
export const ITEM_TYPE_COLORS = {
  snippet: "#3b82f6",
  prompt: "#8b5cf6",
  note: "#fde047",
  command: "#f97316",
  link: "#10b981",
  file: "#6b7280",
  image: "#ec4899",
} as const;

/** The brand mark's blue-to-purple gradient, built from the same two colors above. */
export const BRAND_GRADIENT = `linear-gradient(135deg, ${ITEM_TYPE_COLORS.snippet}, ${ITEM_TYPE_COLORS.prompt})`;
