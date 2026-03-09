"use client";

import { useEffect } from "react";
import { ScaledResumePreview } from "@/components/scaled-resume-preview";
import type { ResumeData } from "@/lib/resume-store";

export function PrintPreviewClient({ data }: { data: ResumeData }) {
  useEffect(() => {
    const header = document.querySelector("header");
    if (header) (header as HTMLElement).style.setProperty("display", "none");
    return () => {
      if (header) (header as HTMLElement).style.removeProperty("display");
    };
  }, []);

  return (
    <div className="w-full flex justify-center py-8 bg-gray-100" data-pdf-ready="true">
      <ScaledResumePreview data={data} scale={1} forPdf />
    </div>
  );
}
