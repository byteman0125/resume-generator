"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { sampleResumeData } from "@/lib/resume-store";
import { getTemplate } from "@/lib/templates";
import {
  FORMAT_IDS,
  FORMAT_LIST,
  formatIdToTemplateId,
  getDefaultStyleForFormat,
  type FormatId,
} from "@/lib/template-format";
import type { ResumeStyle } from "@/lib/resume-store";
import { cn } from "@/lib/utils";
import { FileText, Pencil, FileDown } from "lucide-react";
import { TemplateStyleSidebar } from "@/components/template-style-sidebar";

export default function TemplateFormatPage() {
  const params = useParams();
  const router = useRouter();
  const formatId = (params?.formatId as string) ?? "";
  const validFormat = FORMAT_IDS.includes(formatId as FormatId);
  const templateId = validFormat ? formatIdToTemplateId(formatId) : null;
  const templateEntry = templateId ? getTemplate(templateId) : null;

  const [style, setStyle] = useState<ResumeStyle | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [tempStyle, setTempStyle] = useState<ResumeStyle>({});
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const pdfUrlRef = useRef<string | null>(null);
  pdfUrlRef.current = pdfUrl;

  const loadStyle = useCallback(async () => {
    if (!validFormat) return;
    const res = await fetch(`/api/templates/${formatId}/style`);
    if (!res.ok) return;
    const data = await res.json();
    setStyle(data);
    setTempStyle(data);
  }, [formatId, validFormat]);

  useEffect(() => {
    if (!validFormat) {
      router.replace("/template/format1");
      return;
    }
    loadStyle();
  }, [validFormat, formatId, router, loadStyle]);

  // Generate PDF when style or formatId is ready; show in preview.
  useEffect(() => {
    if (!validFormat || !templateId || style === null) return;
    let cancelled = false;
    setPdfError(null);
    setPdfLoading(true);
    setPdfUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    const payload = { ...sampleResumeData, style };
    fetch("/api/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: payload, templateId }),
    })
      .then(async (res) => {
        if (cancelled) return null;
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(err?.error ?? "PDF failed");
        }
        return res.blob();
      })
      .then((blob) => {
        if (cancelled || !blob) return;
        const prev = pdfUrlRef.current;
        if (prev) URL.revokeObjectURL(prev);
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      })
      .catch((e) => {
        if (!cancelled) setPdfError(e instanceof Error ? e.message : "PDF failed");
      })
      .finally(() => {
        if (!cancelled) setPdfLoading(false);
      });
    return () => {
      cancelled = true;
      const current = pdfUrlRef.current;
      if (current) URL.revokeObjectURL(current);
    };
  }, [validFormat, templateId, style]);

  const handleEditOpen = () => {
    const defaults = getDefaultStyleForFormat(formatId as FormatId);
    setTempStyle({ ...defaults, ...(style ?? {}) });
    setEditOpen(true);
  };

  const handleTempStyleChange = (next: ResumeStyle) => {
    setTempStyle(next);
  };

  const handleSave = async () => {
    const res = await fetch(`/api/templates/${formatId}/style`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tempStyle),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Failed to save");
      return;
    }
    const saved = await res.json();
    setStyle(saved);
    setTempStyle(saved);
    setEditOpen(false);
    // PDF will regenerate from useEffect when style updates
  };

  const pdfFilename = `${(sampleResumeData.profile.name || "resume").replace(/\s+/g, "-").toLowerCase()}-${formatId}.pdf`;

  if (!validFormat || !templateEntry) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const selectedFormat = FORMAT_LIST.find((f) => f.formatId === formatId);
  const iframeSrc = pdfUrl ? `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1` : null;
  const PreviewComponent = templateEntry.Component;
  const showLivePreview = editOpen;

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-0 w-full">
      {/* Left - Template list */}
      <aside className="w-52 flex-shrink-0 border-r border-border bg-muted/20 flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Templates</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Choose a template to preview.
          </p>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {FORMAT_LIST.map((f) => (
            <Link
              key={f.formatId}
              href={`/template/${f.formatId}`}
              className={cn(
                "flex flex-nowrap items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors",
                formatId === f.formatId
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-transparent hover:bg-muted/60"
              )}
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate font-medium text-sm">{f.name}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Center - Preview */}
      <main className="flex-1 min-w-0 flex flex-col bg-muted/30">
        <div className="flex-shrink-0 border-b border-border bg-background px-4 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-base font-semibold truncate">{selectedFormat?.name}</h1>
            <p className="text-xs text-muted-foreground truncate">{selectedFormat?.description}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {pdfUrl ? (
              <a
                href={pdfUrl}
                download={pdfFilename}
                className="inline-flex items-center gap-2 rounded-md text-sm font-medium border border-input bg-background px-3 py-2 hover:bg-accent hover:text-accent-foreground"
              >
                <FileDown className="h-4 w-4" />
                Download PDF
              </a>
            ) : (
              <Button variant="outline" size="sm" disabled className="gap-2">
                <FileDown className="h-4 w-4" />
                Download PDF
              </Button>
            )}
          </div>
        </div>
        <div className="flex-1 min-h-0 min-w-0 flex overflow-hidden">
          <div className="flex-1 min-h-0 flex items-start justify-center overflow-hidden p-6 bg-gray-100">
            <Card className="flex h-full min-h-[480px] w-full max-w-[816px] flex-shrink-0 flex-col overflow-hidden">
              <CardHeader className="flex-shrink-0 py-3 flex flex-row items-center justify-between gap-2 border-b border-border">
                <CardTitle className="text-base">Preview (sample data)</CardTitle>
                <Button variant="outline" size="sm" onClick={handleEditOpen} className="gap-1.5 shrink-0">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
                {showLivePreview ? (
                  <div className="min-h-[480px] flex-1 overflow-y-auto overflow-x-hidden p-4 bg-white">
                    <PreviewComponent data={sampleResumeData} style={tempStyle} />
                  </div>
                ) : (
                  <>
                    {pdfLoading && (
                      <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm py-12">
                        Generating PDF…
                      </div>
                    )}
                    {!pdfLoading && pdfError && (
                      <div className="flex flex-1 items-center justify-center text-destructive text-sm p-4">
                        {pdfError}
                      </div>
                    )}
                    {!pdfLoading && !pdfError && iframeSrc && (
                      <iframe
                        title="Template PDF preview"
                        src={iframeSrc}
                        className="min-h-[480px] flex-1 w-full border-0"
                      />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right - Edit sidebar */}
          {editOpen && (
            <TemplateStyleSidebar
              style={tempStyle}
              onChange={handleTempStyleChange}
              onSave={handleSave}
              onClose={() => setEditOpen(false)}
            />
          )}
        </div>
      </main>
    </div>
  );
}
