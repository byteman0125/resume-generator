/**
 * Shared PDF/page dimensions and margins.
 * Margins apply to EVERY page (including page 2, 3, …). Between pages = bottom margin of page N + top margin of page N+1.
 * MANDATORY: keep between-pages consistent (use these margins in both PDF generation and any multi-page preview).
 */

export const LETTER_WIDTH_IN = 8.5;
export const LETTER_HEIGHT_IN = 11;

export const PDF_MARGIN_TOP_IN = 0.7;
export const PDF_MARGIN_BOTTOM_IN = 0.5;
export const PDF_MARGIN_LEFT_IN = 0.65;
export const PDF_MARGIN_RIGHT_IN = 0.65;

/** Effective gap between two consecutive PDF pages (bottom of page N + top of page N+1). Use for multi-page preview layout. */
export const PDF_BETWEEN_PAGES_IN = PDF_MARGIN_BOTTOM_IN + PDF_MARGIN_TOP_IN;

/** CSS padding value for the content area (same as PDF margins). Used for single-page preview and consistent inset. */
export const PDF_CONTENT_PADDING = `${PDF_MARGIN_TOP_IN}in ${PDF_MARGIN_RIGHT_IN}in ${PDF_MARGIN_BOTTOM_IN}in ${PDF_MARGIN_LEFT_IN}in`;

/** Letter size in px at 96 dpi (for Playwright viewport). */
export const LETTER_VIEWPORT = {
  width: Math.round(LETTER_WIDTH_IN * 96),
  height: Math.round(LETTER_HEIGHT_IN * 96),
} as const;

/** Tall viewport for PDF capture so multi-page content is rendered; Playwright then paginates with margins on each page. */
export const LETTER_VIEWPORT_TALL_HEIGHT = 12000;
