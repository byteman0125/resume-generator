# Desktop: GPT Button 4-Step DeepSeek Flow

## Overview

The **GPT** button in the application modal runs a 4-step AI pipeline using the **DeepSeek chat webview** (no backend API). It mirrors the API flow: same prompts, same order, same parsing; only the execution uses the in-app DeepSeek panel instead of `/api/ai/generate`.

## Behavior

- **When**: User has pasted a job description and AI prompts are loaded. DeepSeek panel can be **open or closed**; the webview is always mounted, visibility is toggled with CSS.
- **Steps (sequential)**:
  1. **Current company bullets** – prompt from `aiPrompts.bulletsCurrent` with `{{company}}` and `{{job_description}}`.
  2. **Last company bullets** – prompt from `aiPrompts.bulletsLast` with `{{company}}` (last company).
  3. **Summary** – prompt from `aiPrompts.summary` plus “Here are the experience bullets to base the summary on” and the bullets from steps 1–2.
  4. **Skills** – prompt from `aiPrompts.skills` plus “Here are the experience bullets to extract skills from” and the same bullets.
- **Parsing**: Same as API: step 1/2 text → experience descriptions; step 3 → `profile.summary`; step 4 → “Category: A, B, C” lines parsed by `parseSkillsText()` into `skills` array.
- **Errors**: On timeout or failure (e.g. send never enables, no new message), the pipeline **stops** (no retry). Button returns to normal state.

## Implementation (modular)

- **`buildFullPromptForGptStep(stepId, prompts, params, generatedBullets?)`**  
  Builds the exact prompt string for each step. Steps 1–2 use `buildPromptForButton`; steps 3–4 append the bullets block when `generatedBullets` is provided.

- **`parseSkillsText(skillsText)`**  
  Shared helper for “Category: A, B, C” parsing. Used by both API and GPT flows.

- **`runGptStepInWebview(promptText)`**  
  In-webview execution for one step:
  1. Find textarea (placeholder “Message DeepSeek” or class `d96f2d2a`), set value to `promptText + "."`, dispatch `input`/`change` so the send button becomes active.
  2. Poll until send button is enabled (no `ds-icon-button--disabled`, up-arrow SVG), timeout 5s.
  3. Click the send button.
  4. Poll until button shows “generating” (stop icon), then until it is disabled again, timeout 90s.
  5. Read the **last** assistant message (last `.ds-message` containing `.ds-markdown`), return its plain text.

- **State**: `gptPipelineRunning` disables the GPT (and API) button and shows a spinner. On any step returning no text, the pipeline exits and `gptPipelineRunning` is set false.

## Files

- **`desktop/src/components/job-applications-view.tsx`**
  - `buildFullPromptForGptStep`, `parseSkillsText`, `runGptStepInWebview`, GPT button `onClick` with 4-step flow and `setModalResumeData` / `setModalContentVersion` / `schedulePdfRefreshRef`.

## Related

- **API flow**: Same prompts and parsing; see `buildPromptForButton`, `/api/ai/generate`, and `app/api/ai/generate/route.ts` for server-side prompt building.
- **DeepSeek panel**: Single webview, no refresh on open/close; “new chat” is auto-clicked when the application modal opens (`desktop-deepseek-panel-fixes.md`).
