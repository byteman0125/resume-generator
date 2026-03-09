"use client";

import type { ResumeData, ResumeStyle } from "@/lib/resume-store";
import { getTemplate, DEFAULT_TEMPLATE_ID } from "@/lib/templates";
import { RESUME_PREVIEW_ID } from "@/lib/generate-pdf";
import { PDF_CONTENT_PADDING } from "@/lib/pdf-constants"; // Same inset as PDF; between-pages: see doc/PDF_MARGINS_AND_PAGES.md

export interface ScaledResumePreviewProps {
  data: ResumeData;
  scale?: number;
  /** Template to render (default: template-1). */
  templateId?: string;
  /** Style applied to the template. */
  style?: ResumeStyle;
  /** When true, the inner wrapper gets RESUME_PREVIEW_ID for PDF export. */
  forPdf?: boolean;
  className?: string;
}

/**
 * Renders the resume using a lib template at letter size (216×279mm) with
 * an optional scale transform. Use for print preview and PDF export.
 */
export function ScaledResumePreview({
  data,
  scale = 1,
  templateId = DEFAULT_TEMPLATE_ID,
  style,
  forPdf = false,
  className,
}: ScaledResumePreviewProps) {
  const entry = getTemplate(templateId);
  const TemplateComponent = entry?.Component;
  const heightMm = 279 * scale;

  if (!TemplateComponent) {
    return (
      <div className={className ?? ""} style={{ width: `${216 * scale}mm`, minHeight: `${279 * scale}mm` }}>
        <p className="text-sm text-muted-foreground">Template not found.</p>
      </div>
    );
  }

  return (
    <div
      className={`bg-white shadow-sm rounded-sm flex-shrink-0 relative ${className ?? ""}`.trim()}
      style={{
        width: `${216 * scale}mm`,
        minHeight: `${279 * scale}mm`,
        height: `${heightMm}mm`,
      }}
    >
      <div
        className="absolute top-0 left-0 box-border overflow-y-auto"
        style={{
          width: "216mm",
          minHeight: "279mm",
          maxHeight: "279mm",
          padding: PDF_CONTENT_PADDING,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <div id={forPdf ? RESUME_PREVIEW_ID : undefined}>
          <TemplateComponent data={data} style={style} />
        </div>
      </div>
    </div>
  );
}
