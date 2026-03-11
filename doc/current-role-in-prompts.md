# Current Company Role in Prompts

## Summary
The app now passes the **current company's role/title** (from the first experience, `experience[0].role`) into AI prompts and the generate API. It is available as the `{{role}}` token in prompt templates.

## Changes

### API (`app/api/ai/generate/route.ts`)
- **Request body:** Optional `currentRole?: string | null` added to `GenerateRequestBody`.
- **Prompt building:** `buildPrompt()` uses `currentRole` when filling templates:
  - **bulletsCurrent / bulletsLast:** `fill(..., { company, job_description, role: currentRole })`
  - **summary / skills:** `fill(..., { company, job_description, role: currentRole })`
- Prompt templates can use `{{role}}` to reference the candidate’s current role (e.g. "Software Engineer") in addition to `{{company}}` and `{{job_description}}`.

### Desktop (`desktop/src/components/job-applications-view.tsx`)
- **Source of role:** `currentRole = expList[0]?.role?.trim() ?? form.title?.trim() ?? ""` (first experience role, or application job title as fallback).
- **Bulk run:** `params` includes `currentRole`; `buildFullPromptForGptStep` receives it and passes it to `buildPromptForButton`.
- **Modal API flow:** Every `/api/ai/generate` call (extractCoreContext, bulletsCurrent, bulletsLast, summary, skills) includes `currentRole` in the request body.
- **Modal GPT webview flow:** `params` includes `currentRole` and is passed to `buildFullPromptForGptStep`.
- **Copy prompt buttons:** `buildPromptForButton` is called with `currentRole` so copied prompts contain the resolved `{{role}}` value.

### Types
- `buildPromptForButton` and `buildFullPromptForGptStep` params accept optional `currentRole?: string | null`.

## Usage in prompts
In **Settings → AI prompts**, you can use:
- `{{company}}` – current company name
- `{{job_description}}` – role context (bullets) or full JD (summary/skills)
- `{{role}}` – current company’s role/title (e.g. "Senior Software Engineer")

Example bullet prompt:  
"Write 4–5 bullets for **{{company}}** in the role of **{{role}}**, tailored to the target job context below."
