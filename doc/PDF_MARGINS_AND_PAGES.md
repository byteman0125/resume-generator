# PDF margins and between-pages (mandatory)

## Rule

- **Margins apply to EVERY page** (page 1, page 2, page 3, …). Same top, bottom, left, right on each.
- **Between pages**: The space from the end of page N to the start of page N+1 is the **bottom margin of page N** plus the **top margin of page N+1**. This must stay consistent in both PDF generation and any multi-page preview UI.

## Implementation

- **Constants**: `lib/pdf-constants.ts`
  - `PDF_MARGIN_TOP_IN`, `PDF_MARGIN_BOTTOM_IN`, `PDF_MARGIN_LEFT_IN`, `PDF_MARGIN_RIGHT_IN`
  - `PDF_BETWEEN_PAGES_IN` = bottom + top (use for multi-page preview gap when stacking page boxes)
- **PDF generation** (`app/api/pdf/route.ts`): Use a **tall viewport** so the full document is rendered; pass **margins to `page.pdf()`** (not HTML padding). Playwright then paginates and applies the same margins to every page. Do not use a single letter-size viewport with zero margins and HTML padding—that would only give correct margins on page 1.
- **Print preview HTML** (`components/pdf-resume-client.tsx`): Render a **flowing document** (8.5in wide, no fixed 11in height, no padding that mimics margins). The PDF engine adds margins per page; the HTML must not force a single page.
- **In-app preview** (`components/scaled-resume-preview.tsx`): Single-letter box uses `PDF_CONTENT_PADDING` for consistent inset. If you add a multi-page view (multiple letter boxes), use `PDF_BETWEEN_PAGES_IN` or equivalent for the gap between consecutive page boxes.

## Do not

- Use a fixed letter-height viewport + zero PDF margins and rely on HTML padding: that only insets page 1; page 2+ would have no top margin.
- Forget to apply margins to every page when changing PDF or preview logic.
