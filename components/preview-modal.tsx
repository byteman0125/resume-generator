"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getTemplate, DEFAULT_TEMPLATE_ID } from "@/lib/templates";
import { RESUME_PREVIEW_ID } from "@/lib/generate-pdf";
import type { ResumeData } from "@/lib/resume-store";
import { useState } from "react";
import { FileDown } from "lucide-react";

interface PreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ResumeData;
}

export function PreviewModal({ open, onOpenChange, data }: PreviewModalProps) {
  const [downloading, setDownloading] = useState(false);
  const entry = getTemplate(DEFAULT_TEMPLATE_ID);
  const TemplateComponent = entry?.Component;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { downloadResumeAsPdf } = await import("@/lib/generate-pdf");
      const name = data.profile.name || "resume";
      const filename = `${name.replace(/\s+/g, "-").toLowerCase()}-resume.pdf`;
      await downloadResumeAsPdf(RESUME_PREVIEW_ID, filename);
    } catch (e) {
      console.error("PDF download failed:", e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        showClose={true}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Resume preview</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto min-h-0 border rounded-md bg-gray-50 dark:bg-gray-900">
          <div id={RESUME_PREVIEW_ID} className="max-w-none">
            {TemplateComponent ? (
              <TemplateComponent data={data} style={{}} />
            ) : (
              <p className="p-4 text-sm text-muted-foreground">Template not found.</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleDownload} disabled={downloading}>
            <FileDown className="h-4 w-4 mr-2" />
            {downloading ? "Generating…" : "Download PDF"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
