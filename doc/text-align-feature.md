# Text alignment for name, title, contact

## Summary

Text alignment (left / center / right) was added for the **name**, **title**, and **contact** areas on the resume. Control is **only** from the preview: clicking one of these items shows an alignment bar **above** that item; the user selects Left / Center / Right there. No new controls were added to the style settings panel. The three areas remain plain text (not styled as buttons).

## What was done

### 1. Data and types

- **`lib/resume-store.ts`**  
  - `ResumeStyle` extended with optional:  
    `nameTextAlign?`, `titleTextAlign?`, `contactTextAlign?`  
    (each `"left" | "center" | "right"`).

- **`components/resume-preview.tsx`**  
  - **StyleSettings:** same three optional align fields.
  - **ResumePreviewProps:** optional `onStyleChange?: (patch: Partial<StyleSettings>) => void`.
  - **ResumePreviewContent:**
    - State: `alignAnchor: "name" | "title" | "contact" | null`.
    - `canEditAlign = Boolean(onStyleChange && !forPdf)`.
    - Name, title, contact use `nameTextAlign`, `titleTextAlign`, `contactTextAlign` from `styleSettings` (default `"left"`).
    - **AlignBar:** small bar above the active item with Left / Center / Right; calls `onStyleChange` with the chosen key and closes.
    - **Header:** name, title, contact wrapped in clickable divs when `canEditAlign`; click sets `alignAnchor` and shows AlignBar above that block. Text uses `textAlign` from style.
    - **Click-outside:** document listener clears `alignAnchor` when the bar is open.

### 2. Style page

- **`app/(builder)/style/page.tsx`**
  - State: `nameTextAlign`, `titleTextAlign`, `contactTextAlign` (default `"left"`).
  - **`buildStyleSnapshot`:** parameter type and return object include the three align fields.
  - **Load:** from `data.style` (DB) in hydrate effect; from localStorage (`resumeStyleNameTextAlign`, etc.) in fallback.
  - **Save:** the three values are written to localStorage and included in the debounced DB persist (same effect that calls `buildStyleSnapshot`); they are in the effect dependency array.
  - **ResumePreview:** receives `styleSettings` with `nameTextAlign`, `titleTextAlign`, `contactTextAlign`, and **`onStyleChange`** that updates the three state setters so alignment chosen in the preview is saved.

## Behavior

- On the **Style** tab, clicking the name, title, or contact line in the preview opens a **compact format bar** above that item (like document editors). The bar includes:
  - **Align:** small icon buttons (left / center / right).
  - **Size:** numeric input for font size (name 10–40 pt, title 8–30 pt, contact 8–24 pt).
  - **Color:** color picker.
- Changes are persisted to the current profile (DB and localStorage). Clicking outside closes the bar.
- In PDF view or when `onStyleChange` is not passed, name/title/contact are not clickable and no bar is shown.
- Name, title, and contact are not rendered as buttons; they look like normal text.

## Update: compact bar + font size/color in bar

- The alignment bar was made **smaller** (icon-only align buttons, small size input, small color swatch).
- **Font size and color** for name, title, and contact were **moved** from the right-hand Typography panel into this floating format bar. When you click name/title/contact, the bar shows align + size + color for that item only. The Typography panel now only has **Heading** and **Body** size/color.
