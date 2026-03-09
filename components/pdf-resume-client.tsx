"use client";

import type { ResumeData, StoredProfileData } from "@/lib/resume-store";
import { getTemplate, DEFAULT_TEMPLATE_ID } from "@/lib/templates";
import { PdfResume } from "@/components/pdf-resume";
import { LETTER_WIDTH_IN, LETTER_HEIGHT_IN } from "@/lib/pdf-constants";

/**
 * Flowing document (8.5in wide, can be multiple pages tall). PDF engine applies margins to EVERY page,
 * so between-page spacing is consistent. No colored background in margin.
 */
export function PdfResumeClient({ data, templateId }: { data: ResumeData; templateId?: string }) {
  const stored = data as StoredProfileData;
  const entry = getTemplate(templateId ?? DEFAULT_TEMPLATE_ID);
  const Component = entry?.Component ?? PdfResume;
  return (
    <div className="bg-white flex justify-center items-start">
      <div
        style={{
          width: `${LETTER_WIDTH_IN}in`,
          backgroundColor: "#fff",
          boxSizing: "border-box",
        }}
      >
        <Component data={data} style={stored?.style} />
      </div>
    </div>
  );
}

