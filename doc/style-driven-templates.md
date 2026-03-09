# Style-driven templates and UI

## What was implemented

1. **ResumeStyle and storage**
   - `ResumeStyle` in `resume-store` already had sizes (nameSize, titleSize, contactSize, sectionSize, bodySize) and colors. **fontFamily** was added.
   - **resumeStyleFromSettingsPatch** converts a partial `ResumePreviewStyleSettings` (from the preview UI) into `Partial<ResumeStyle>` for saving.
   - Style is stored with the profile: `StoredProfileData = ResumeData & { style?: ResumeStyle }`. The API saves/loads the full JSON, so `style` is persisted.

2. **Templates use style**
   - **Template 1 (PdfResume)** and **Template 2** accept an optional **style** prop. They use it for font size (pt), colors, font family, and line height, with sensible defaults when a value is missing.
   - Registry components are typed as `ComponentType<{ data: ResumeData; style?: ResumeStyle }>`.

3. **Editor UI**
   - **Appearance** card: **Font** dropdown (Default, Georgia, Times New Roman, Helvetica, System UI). Changing it updates `data.style.fontFamily` and the live preview.
   - **Live preview** already had clickable name/title/contact that open a format bar (size, color, bold/italic, alignment). That bar now calls **onStyleChange** with typography patches, which are merged into `data.style` via **resumeStyleFromSettingsPatch** and saved with the profile.

4. **Data flow**
   - User changes font (or name/title/contact format in the preview) → **onStyleChange(patch)** → **resumeStyleFromSettingsPatch(patch)** → **setData({ ...stored, style: nextStyle })** → API saves full payload.
   - When rendering: **styleSettingsFromStored(data)** turns stored style into **ResumePreviewStyleSettings** for the preview; templates receive **style** and use it for PDF/preview.

5. **Where style is passed**
   - Editor: **ResumePreview** gets **styleSettings** and **onStyleChange**; preview root uses **styleSettings.fontFamily**.
   - Templates page: **PreviewComponent** gets **style={templateEntry?.style}** (template default or empty).
   - PdfResumeClient: **PdfResume** gets **style={(data as StoredProfileData)?.style}** so the PDF uses the profile’s saved style.

## Changing size or font from the UI

- **Font:** Editor → **Appearance** card → **Font** dropdown.
- **Name / title / contact size and color:** In the live preview, click your **name**, **title**, or **contact line** and use the format bar that appears.
- All of this is saved with the profile and used in the PDF when you generate it.
