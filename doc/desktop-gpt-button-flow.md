# Desktop: GPT Button 4-Step DeepSeek Flow

## Overview

The **GPT** button in the application modal runs a 4-step AI pipeline using **only the DeepSeek chat webview** (no backend API). Context extraction and all 4 steps run in the webview. Before the 4 steps, step 0 sends an extraction prompt to the webview and uses the reply as **core role context**; that context is prepended to each of the 4 prompts so all steps are aligned to the same role understanding.

## Behavior

- **When**: User has pasted a job description and AI prompts are loaded. DeepSeek panel can be **open or closed**; the webview is always mounted, visibility is toggled with CSS.
- **Steps (sequential, one-click)**:
  0. **Extract core role context (webview)** – send the same extraction prompt used on the server (job title, responsibilities, skills, tone) to the DeepSeek webview via `runGptStepInWebview`; the assistant reply is the in-memory **role context** for this run. No API call.
  1. **Current company bullets** – prompt from `aiPrompts.bulletsCurrent` with `{{company}}` and `{{job_description}}`, with role context prepended.
  2. **Last company bullets** – prompt from `aiPrompts.bulletsLast` with `{{company}}` (last company), with role context prepended.
  3. **Summary** – prompt from `aiPrompts.summary` plus “Here are the experience bullets to base the summary on” and the bullets from steps 1–2, again with the same role context prepended.
  4. **Skills** – prompt from `aiPrompts.skills` plus “Here are the experience bullets to extract skills from” and the same bullets, with role context prepended.
- **Parsing**: Same as API: step 1/2 text → experience descriptions; step 3 → `profile.summary`; step 4 → “Category: A, B, C” lines parsed by `parseSkillsText()` into `skills` array.
- **Errors**: On timeout or failure (e.g. send never enables, no new message), the pipeline **stops** (no retry). Button returns to normal state.

## Implementation (modular)

- **`buildExtractionPromptForGpt(jobDescription)`**  
  Builds the extraction prompt for step 0 (same text as server `buildExtractionPrompt`). Used only for the GPT flow so context is obtained from the webview, not the API.

- **`buildFullPromptForGptStep(stepId, prompts, params, generatedBullets?, roleContext?)`**  
  Builds the exact prompt string for each step. Steps 1–2 use `buildPromptForButton`; steps 3–4 append the bullets block when `generatedBullets` is provided. When `roleContext` is provided, it is prepended as a “Role context (use to tailor)” block at the top of the prompt so all four steps share the same role understanding.

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

- **API flow**: Same prompts and parsing; see `buildPromptForButton`, `/api/ai/generate`, and `app/api/ai/generate/route.ts` for server-side prompt building, including `extractCoreContext`, `roleContext`, and optional `messages` chat history support.
- **DeepSeek panel**: Single webview, no refresh on open/close; “new chat” is auto-clicked when the application modal opens (`desktop-deepseek-panel-fixes.md`).
